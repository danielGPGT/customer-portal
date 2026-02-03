'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { formatCalendarDate } from '@/lib/utils/date'
import { ArrowRight, Sparkles, Plane, UserPlus, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type RecentTransaction = {
  id: string
  transaction_type: string
  source_type: string
  points: number
  description: string
  created_at: string
  booking_reference?: string | null
  event_name?: string | null
}

type RecentTrip = {
  id: string
  booking_reference: string
  event_name: string | null
  event_start_date: string | null
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

interface DashboardActivityListProps {
  transactions: RecentTransaction[]
  trips: RecentTrip[]
}

const getTransactionType = (tx: RecentTransaction) => {
  const isEarn = tx.transaction_type === 'earn' || tx.transaction_type === 'refund'
  const isReferral = tx.source_type?.includes('referral')

  if (isReferral) {
    return {
      label: 'Referral',
      icon: UserPlus,
      className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
    }
  }

  if (isEarn) {
    return {
      label: 'Points',
      icon: Sparkles,
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
    }
  }

  return {
    label: 'Redemption',
    icon: Sparkles,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  }
}

const getStatusBadge = (status: RecentTrip['booking_status']) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400'
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
  }
}

export function DashboardActivityList({ transactions, trips }: DashboardActivityListProps) {
  const allActivities = [
    ...transactions.slice(0, 4).map((tx) => ({
      id: `tx-${tx.id}`,
      type: 'transaction' as const,
      data: tx,
    })),
    ...trips.slice(0, 2).map((trip) => ({
      id: `trip-${trip.id}`,
      type: 'trip' as const,
      data: trip,
    })),
  ].sort((a, b) => {
    const dateA = a.type === 'transaction' ? a.data.created_at : a.data.event_start_date || ''
    const dateB = b.type === 'transaction' ? b.data.created_at : b.data.event_start_date || ''
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  }).slice(0, 4)

  if (allActivities.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity. Start booking trips to see your activity here!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Your Activity</CardTitle>
          <Link
            href="/points"
            prefetch={true}
            className="text-xs font-medium text-primary hover:underline"
          >
            See all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0 divide-y">
          {allActivities.map((activity) => {
            if (activity.type === 'transaction') {
              const tx = activity.data
              const typeInfo = getTransactionType(tx)
              const Icon = typeInfo.icon
              const isEarn = tx.transaction_type === 'earn' || tx.transaction_type === 'refund'
              const pointsDisplay = isEarn
                ? `+${Math.abs(tx.points)}`
                : `-${Math.abs(tx.points)}`

              return (
                <Link
                  key={activity.id}
                  href="/points"
                  prefetch={true}
                  className="group flex items-center gap-3 p-3 transition-colors hover:bg-accent/40"
                >
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', typeInfo.className)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-auto shrink-0', typeInfo.className)}>
                        {typeInfo.label}
                      </Badge>
                      <span className={cn('text-sm font-semibold shrink-0', isEarn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                        {pointsDisplay} pts
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate break-words">{tx.description}</p>
                    {tx.booking_reference && (
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{tx.booking_reference}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM d, yyyy')}
                    </p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            } else {
              const trip = activity.data
              return (
                <Link
                  key={activity.id}
                  href={`/trips/${trip.id}`}
                  prefetch={true}
                  className="group flex items-center gap-3 p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-primary/10 text-primary">
                    <Plane className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-auto', getStatusBadge(trip.booking_status))}>
                        {trip.booking_status}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">
                      {trip.event_name || 'Trip'}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">{trip.booking_reference}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    {trip.event_start_date && (
                      <p className="text-xs text-muted-foreground">
                        {formatCalendarDate(trip.event_start_date, 'MMM d, yyyy')}
                      </p>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            }
          })}
        </div>
      </CardContent>
    </Card>
  )
}

