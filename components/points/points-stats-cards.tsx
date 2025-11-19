"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Coins, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PointsStatsCardsProps {
  lifetimeEarned: number
  lifetimeSpent: number
  earnedChangePercent?: number
  spentChangePercent?: number
  currency?: string
  className?: string
}

export function PointsStatsCards({
  lifetimeEarned,
  lifetimeSpent,
  earnedChangePercent = 0,
  spentChangePercent = 0,
  currency = "GBP",
  className,
}: PointsStatsCardsProps) {
  // Use the passed percentage changes
  const earnedChange = earnedChangePercent
  const spentChange = spentChangePercent

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`
    }
    return points.toLocaleString()
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-2 gap-4", className)}>
      {/* Total Earned Card */}
      <Card className="h-full">
        <CardContent className="h-full">
          <div className="h-full flex flex-col justify-between">
          <div className="mb-4">
            <div className="rounded-lg bg-primary/10 p-2.5 w-fit">
              <Coins className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="space-y-1 mb-4">
            <h3 className="text-sm font-semibold">Total Earned</h3>
            <p className="text-xs text-muted-foreground">Lifetime points</p>
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-bold">{lifetimeEarned.toLocaleString()}</p>
            
            {earnedChange !== 0 && (
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                earnedChange > 0 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}>
                {earnedChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{earnedChange > 0 ? '+' : ''}{earnedChange.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1">vs last year</span>
              </div>
            )}
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Spent Card */}
      <Card>
        <CardContent className="h-full">
          <div className="h-full flex flex-col justify-between">
          <div className="mb-4">
            <div className="rounded-lg bg-primary/10 p-2.5 w-fit">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="space-y-1 mb-4">
            <h3 className="text-sm font-semibold">Total Spent</h3>
            <p className="text-xs text-muted-foreground">Lifetime points</p>
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-bold">{lifetimeSpent.toLocaleString()}</p>
            
            {spentChange !== 0 && (
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                spentChange > 0 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}>
                {spentChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{spentChange > 0 ? '+' : ''}{spentChange.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1">vs last year</span>
              </div>
            )}
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

