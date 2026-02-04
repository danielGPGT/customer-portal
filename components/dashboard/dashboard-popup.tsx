'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { UndrawChecklist, UndrawAddUser, UndrawCelebration, UndrawGift } from 'react-undraw-illustrations'
import { cn } from '@/lib/utils'

const STORAGE_KEY_PREFIX = 'dashboard_popup_dismissed_'

function getStorageKey(variant: NonNullable<PopupVariant>): string {
  return `${STORAGE_KEY_PREFIX}${variant}`
}

interface NextTripInfo {
  id: string
  event_name: string | null
  daysUntilDeparture: number | null
  /** Booking has airport_transfer component – flight details needed for transfer coordination */
  hasAirportTransfers?: boolean
  /** Booking has any flights (booked or customer) */
  hasFlights?: boolean
  /** Booking has booked flights (we booked them) vs customer-added only */
  hasBookedFlights?: boolean
  /** Days until traveller/flight edits are locked (4 weeks before departure) */
  daysUntilLock?: number | null
  /** ISO string – when changes lock */
  lockDate?: string | null
}

interface DashboardPopupProps {
  firstName: string
  nextTrip: NextTripInfo | null
  totalReferrals: number
  pointsBalance: number
  pointsToNextMilestone: number
  minRedemptionPoints: number
}

type PopupVariant = 'welcome' | 'pre-departure' | 'referral' | 'points-milestone' | null

function getPopupVariant(props: DashboardPopupProps): PopupVariant {
  const { nextTrip, totalReferrals, pointsBalance, pointsToNextMilestone } = props

  // 1. Upcoming trip within 60 days – pre-departure reminder (highest priority)
  if (nextTrip?.daysUntilDeparture != null && nextTrip.daysUntilDeparture >= 0 && nextTrip.daysUntilDeparture <= 60) {
    return 'pre-departure'
  }

  // 2. No referrals yet – referral prompt
  if (totalReferrals === 0) {
    return 'referral'
  }

  // 3. Points close to next milestone (within 50 pts of next 100-pt boundary)
  if (pointsToNextMilestone > 0 && pointsToNextMilestone <= 50) {
    return 'points-milestone'
  }

  // 4. Default – welcome / quick tour
  return 'welcome'
}

const variantContent: Record<
  NonNullable<PopupVariant>,
  {
    Illustration: React.ComponentType<{ primaryColor?: string; accentColor?: string; height?: string; className?: string }>
    gradientClass: string
    title: string
    description: (props: DashboardPopupProps) => string
    ctaText: string
    ctaHref: (props: DashboardPopupProps) => string
  }
> = {
  'pre-departure': {
    Illustration: UndrawChecklist,
    gradientClass: 'from-primary-100 via-primary-50 to-background',
    title: 'Get trip-ready',
    description: (p) => {
      const event = p.nextTrip?.event_name || 'Your trip'
      const days = p.nextTrip?.daysUntilDeparture ?? 0
      const dayText = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
      const hasAirportTransfers = p.nextTrip?.hasAirportTransfers ?? false
      const hasFlights = p.nextTrip?.hasFlights ?? false
      const hasBookedFlights = p.nextTrip?.hasBookedFlights ?? false
      const daysUntilLock = p.nextTrip?.daysUntilLock

      const timeRemainingText =
        daysUntilLock != null && daysUntilLock >= 0
          ? daysUntilLock === 0
            ? ' You have less than 1 day remaining to make these changes.'
            : ` You have ${daysUntilLock} ${daysUntilLock === 1 ? 'day' : 'days'} remaining to make these changes.`
          : ''

      if (hasAirportTransfers && !hasFlights) {
        return `${event} is ${dayText}. You have airport transfers – please add your flight details so we can coordinate them. Also confirm your traveller details are correct.${timeRemainingText}`
      }
      if (hasAirportTransfers && hasFlights) {
        return `${event} is ${dayText}. Please verify your traveller and flight details are correct for your airport transfers.${timeRemainingText}`
      }
      if (hasBookedFlights) {
        return `${event} is ${dayText}. Please verify your traveller details are correct. Your flight details are already on file.${timeRemainingText}`
      }
      return `${event} is ${dayText}. Complete your pre-departure checklist: traveller details, flight info (if you&apos;ve booked your own), and points to make the most of your trip.${timeRemainingText}`
    },
    ctaText: 'View your trip',
    ctaHref: (p) => (p.nextTrip?.id ? `/trips/${p.nextTrip.id}` : '/trips'),
  },
  referral: {
    Illustration: UndrawAddUser,
    gradientClass: 'from-secondary-100 via-secondary-50 to-background',
    title: 'Earn bonus points',
    description: () =>
      'Refer a friend and earn 100 points when they book. Share your unique link from the Referral Center.',
    ctaText: 'Go to Referral Center',
    ctaHref: () => '/refer',
  },
  'points-milestone': {
    Illustration: UndrawCelebration,
    gradientClass: 'from-primary-100 via-primary-50 to-background',
    title: 'Almost there',
    description: (p) =>
      `You're ${p.pointsToNextMilestone} points away from your next 100-point milestone. Book another trip to unlock your next discount.`,
    ctaText: 'Browse trips',
    ctaHref: () => '/trips',
  },
  welcome: {
    Illustration: UndrawGift,
    gradientClass: 'from-primary-100 via-primary-50 to-background',
    title: 'Welcome back, {{name}}',
    description: () =>
      'Manage your trips, track loyalty points, and refer friends for bonus rewards. Everything you need is here.',
    ctaText: 'Got it',
    ctaHref: () => '',
  },
}

export function DashboardPopup({
  firstName,
  nextTrip,
  totalReferrals,
  pointsBalance,
  pointsToNextMilestone,
  minRedemptionPoints,
}: DashboardPopupProps) {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const props = { firstName, nextTrip, totalReferrals, pointsBalance, pointsToNextMilestone, minRedemptionPoints }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const variant = getPopupVariant(props)
    if (!variant) return

    const dismissed = localStorage.getItem(getStorageKey(variant))
    if (dismissed === 'true') return

    const timer = setTimeout(() => setOpen(true), 600)
    return () => clearTimeout(timer)
  }, [firstName, nextTrip, totalReferrals, pointsBalance, pointsToNextMilestone, minRedemptionPoints])

  const variant = getPopupVariant(props)

  const handleClose = () => {
    if (dontShowAgain && variant) {
      localStorage.setItem(getStorageKey(variant), 'true')
    }
    setOpen(false)
  }

  if (!variant) return null

  const config = variantContent[variant]
  const IllustrationComponent = config.Illustration

  const title = config.title.replace('{{name}}', firstName)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className={cn('sm:max-w-lg overflow-hidden p-0 gap-0')}>
        <div className={cn('relative overflow-hidden rounded-t-lg bg-gradient-to-b', config.gradientClass, 'pt-6 pb-2')}>
          <div className="mx-auto flex h-40 w-full max-w-[280px] items-center justify-center">
            <IllustrationComponent
              primaryColor="var(--primary-600)"
              accentColor="var(--primary-500)"
              height="160px"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="space-y-4 px-6 pt-6 pb-6">
          <DialogHeader className="space-y-1 p-0">
            <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
            <DialogDescription className="text-left text-base leading-relaxed">
              {config.description(props)}
            </DialogDescription>
          </DialogHeader>
        <DialogFooter className="mt-4 flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2 w-full sm:w-auto order-2 sm:order-1">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label
              htmlFor="dont-show"
              className="text-sm font-normal cursor-pointer text-muted-foreground"
            >
              Don&apos;t show again
            </Label>
          </div>
          {config.ctaHref(props) ? (
            <Button asChild className="w-full sm:w-auto order-1 sm:order-2" onClick={handleClose}>
              <Link
                href={config.ctaHref(props)}
                prefetch
              >
                {config.ctaText}
              </Link>
            </Button>
          ) : (
            <Button className="w-full sm:w-auto order-1 sm:order-2" onClick={handleClose}>
              {config.ctaText}
            </Button>
          )}
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
