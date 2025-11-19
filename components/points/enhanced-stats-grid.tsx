"use client"

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Calendar, Target, DollarSign, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedStatsGridProps {
  lifetimeEarned: number
  lifetimeSpent: number
  memberSince: string | null
  averagePerBooking?: number
  totalBookings?: number
  availablePoints: number
  currency: string
  pointValue: number
}

export function EnhancedStatsGrid({ 
  lifetimeEarned, 
  lifetimeSpent, 
  memberSince,
  averagePerBooking = 0,
  totalBookings = 0,
  availablePoints,
  currency,
  pointValue
}: EnhancedStatsGridProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const formattedDate = memberSince 
    ? new Date(memberSince).toLocaleDateString('en-GB', { 
        month: 'short', 
        year: 'numeric' 
      })
    : 'N/A'

  const netPoints = lifetimeEarned - lifetimeSpent
  const discountValue = availablePoints * pointValue

  const stats = [
    {
      label: "Total Earned",
      value: lifetimeEarned.toLocaleString(),
      suffix: "pts",
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Total Spent",
      value: lifetimeSpent.toLocaleString(),
      suffix: "pts",
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Net Points",
      value: netPoints.toLocaleString(),
      suffix: "pts",
      icon: Coins,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Member Since",
      value: formattedDate,
      suffix: "",
      icon: Calendar,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "Available Discount",
      value: currencySymbol + discountValue.toLocaleString('en-GB', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      suffix: "",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label} className="relative overflow-hidden">
          <CardContent className="">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-2xl font-bold", stat.color)}>
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="text-sm text-muted-foreground">
                      {stat.suffix}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

