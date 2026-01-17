'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardHeroCardProps {
  firstName: string
  nextTripId?: string | null
  pointsBalance: number
}

export function DashboardHeroCard({
  firstName,
  nextTripId,
  pointsBalance,
}: DashboardHeroCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-xl">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="relative p-6 md:p-8 lg:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Content */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">
                LOYALTY PORTAL
              </p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl break-words">
                Turn Your Trips Into Rewards
              </h1>
              <p className="max-w-2xl text-base text-primary-foreground/90 md:text-lg break-words">
                Earn points on every booking, redeem for discounts, and unlock exclusive benefits
                with our loyalty program.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {nextTripId ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 shadow-lg"
                >
                  <Link href={`/trips/${nextTripId}`} prefetch={true}>
                    View Next Trip
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 shadow-lg"
                >
                  <Link href="/trips" prefetch={true}>
                    View All Trips
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/points/earn" prefetch={true}>
                  Earn More Points
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Decorative Icons */}
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <Plane className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

