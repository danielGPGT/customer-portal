"use client"

import { Card, CardContent } from '@/components/ui/card'

interface LifetimeStatsGridProps {
  lifetimeEarned: number
  lifetimeSpent: number
  memberSince: string | null
}

export function LifetimeStatsGrid({ 
  lifetimeEarned, 
  lifetimeSpent, 
  memberSince 
}: LifetimeStatsGridProps) {
  const formattedDate = memberSince 
    ? new Date(memberSince).toLocaleDateString('en-GB', { 
        month: 'short', 
        year: 'numeric' 
      })
    : 'N/A'

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Total Earned
          </div>
          <div className="text-2xl font-bold">
            {lifetimeEarned.toLocaleString()} pts
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Total Spent
          </div>
          <div className="text-2xl font-bold">
            {lifetimeSpent.toLocaleString()} pts
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 md:col-span-1">
        <CardContent className="">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Member Since
          </div>
          <div className="text-2xl font-bold">
            {formattedDate}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

