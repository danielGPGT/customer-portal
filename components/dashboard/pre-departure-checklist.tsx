'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Users, Plane, Sparkles, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PreDepartureChecklistProps {
  bookingId: string | null
  hasTravelers: boolean
  travelersComplete: boolean
  hasFlights: boolean
  hasPointsRedemption: boolean
  daysUntilDeparture: number | null
}

export function PreDepartureChecklist({
  bookingId,
  hasTravelers,
  travelersComplete,
  hasFlights,
  hasPointsRedemption,
  daysUntilDeparture,
}: PreDepartureChecklistProps) {
  if (!bookingId) return null

  const checklistItems = [
    {
      id: 'travelers',
      label: 'Traveller details confirmed',
      completed: travelersComplete,
      icon: Users,
      href: `/trips/${bookingId}?tab=travelers`,
      description: hasTravelers ? 'All traveller information is complete' : 'Add traveller details',
    },
    {
      id: 'flights',
      label: 'Flight details provided',
      completed: hasFlights,
      icon: Plane,
      href: `/trips/${bookingId}?tab=included`,
      description: hasFlights ? 'Flight information has been added' : 'Add your flight details',
    },
    {
      id: 'points',
      label: 'Points applied',
      completed: hasPointsRedemption,
      icon: Sparkles,
      href: `/trips/${bookingId}?tab=points`,
      description: hasPointsRedemption ? 'Points have been redeemed' : 'Apply points to this booking',
    },
  ]

  const completedCount = checklistItems.filter(item => item.completed).length
  const totalCount = checklistItems.length
  const progressPercentage = (completedCount / totalCount) * 100

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Pre-Departure Checklist</CardTitle>
          <div className="text-sm font-medium text-muted-foreground">
            {completedCount}/{totalCount} complete
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklistItems.map((item) => {
          const Icon = item.icon
          const isCompleted = item.completed

          return (
            <Link
              key={item.id}
              href={item.href}
              className="block"
            >
              <div
                className={cn(
                  'group flex items-start gap-3 rounded-lg border p-4 transition-all hover:bg-accent/50 hover:shadow-sm',
                  isCompleted
                    ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20'
                    : 'border-border bg-card'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 rounded-full p-1.5 transition-colors',
                    isCompleted
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      )}
                    />
                    <h4
                      className={cn(
                        'text-sm font-semibold transition-colors',
                        isCompleted
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-foreground group-hover:text-primary'
                      )}
                    >
                      {item.label}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ArrowRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1',
                    isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )}
                />
              </div>
            </Link>
          )
        })}

        {/* Days Until Departure Info */}
        {daysUntilDeparture !== null && daysUntilDeparture >= 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              {daysUntilDeparture === 0
                ? 'Departing today!'
                : daysUntilDeparture === 1
                ? '1 day until departure'
                : `${daysUntilDeparture} days until departure`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

