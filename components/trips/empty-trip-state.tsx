'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plane, History, XCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

type TripTab = 'upcoming' | 'past' | 'all'

interface EmptyTripStateProps {
  tab: TripTab
}

const emptyStateConfig = {
  upcoming: {
    icon: Calendar,
    title: 'No upcoming trips',
    description: 'You don\'t have any upcoming bookings at the moment.',
    action: {
      label: 'Browse Events',
      href: '#'
    }
  },
  past: {
    icon: History,
    title: 'No past trips',
    description: 'Your completed bookings will appear here.',
    action: {
      label: 'View Upcoming Trips',
      href: '/trips?tab=upcoming'
    }
  },
  all: {
    icon: Plane,
    title: 'No trips found',
    description: 'You don\'t have any bookings yet.',
    action: {
      label: 'Browse Events',
      href: '#'
    }
  }
}

export function EmptyTripState({ tab }: EmptyTripStateProps) {
  const config = emptyStateConfig[tab]
  const Icon = config.icon

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {config.description}
        </p>
        {config.action.href !== '#' && (
          <Button asChild variant="outline">
            <Link href={config.action.href}>
              {config.action.label}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

