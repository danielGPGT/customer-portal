import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Clock, ArrowRight, Sparkles, Plane, History } from 'lucide-react'

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

interface RecentActivityCardProps {
  transactions: RecentTransaction[]
  trips: RecentTrip[]
}

const getTransactionBadge = (tx: RecentTransaction) => {
  const isEarn = tx.transaction_type === 'earn' || tx.transaction_type === 'refund'
  const isReferral = tx.source_type?.includes('referral')

  if (isReferral) {
    return {
      label: 'Referral',
      className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
    }
  }

  if (isEarn) {
    return {
      label: 'Earned',
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300',
    }
  }

  return {
    label: 'Spent',
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300',
  }
}

const getStatusBadge = (status: RecentTrip['booking_status']) => {
  const base =
    'border text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5'

  switch (status) {
    case 'confirmed':
      return `${base} bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300`
    case 'completed':
      return `${base} bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300`
    case 'cancelled':
      return `${base} bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300`
    default:
      return `${base} bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300`
  }
}

export function RecentActivityCard({ transactions, trips }: RecentActivityCardProps) {
  const hasTransactions = transactions && transactions.length > 0
  const hasTrips = trips && trips.length > 0

  if (!hasTransactions && !hasTrips) {
    return null
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 text-primary flex h-8 w-8 items-center justify-center">
              <History className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground">
                A quick snapshot of your latest points and trips
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {/* Recent Points Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Points activity</span>
            <Link
              href="/points"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {hasTransactions ? (
            <ul className="space-y-2">
              {transactions.map((tx) => {
                const badge = getTransactionBadge(tx)
                const isEarn =
                  tx.transaction_type === 'earn' || tx.transaction_type === 'refund'
                const pointsDisplay = isEarn
                  ? `+${Math.abs(tx.points)}`
                  : `-${Math.abs(tx.points)}`

                return (
                  <li
                    key={tx.id}
                    className="flex items-start gap-3 rounded-lg border bg-card/60 p-3"
                  >
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'text-sm font-semibold shrink-0',
                              isEarn
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {pointsDisplay} pts
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 h-auto shrink-0', badge.className)}
                          >
                            {badge.label}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-1 break-words">
                        {tx.description}
                      </p>
                      {(tx.booking_reference || tx.event_name) && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {tx.booking_reference && (
                            <span className="font-mono mr-1">{tx.booking_reference}</span>
                          )}
                          {tx.event_name && <span>{tx.event_name}</span>}
                        </p>
                      )}
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </span>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              You haven&apos;t earned or spent any points yet. Make a booking to start earning
              rewards.
            </div>
          )}
        </div>

        {/* Recent Trips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Recent trips</span>
            <Link
              href="/trips"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {hasTrips ? (
            <ul className="space-y-2">
              {trips.map((trip) => (
                <li
                  key={trip.id}
                  className="flex items-start gap-3 rounded-lg border bg-card/60 p-3"
                >
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Plane className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold line-clamp-1">
                        {trip.event_name || 'Trip'}
                      </p>
                      <span className={getStatusBadge(trip.booking_status)}>
                        {trip.booking_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Ref: {trip.booking_reference}
                    </p>
                    {trip.event_start_date && (
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(trip.event_start_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                    <Link
                      href={`/trips/${trip.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      View trip
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              No trips yet. When you book, your most recent trips will appear here for quick
              access.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


