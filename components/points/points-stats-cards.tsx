"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Coins, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
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

  const stats = [
    {
      key: "earned",
      title: "Total Earned",
      helper: "Lifetime points",
      value: lifetimeEarned,
      change: earnedChange,
      icon: Coins,
    },
    {
      key: "spent",
      title: "Total Spent",
      helper: "Lifetime points",
      value: lifetimeSpent,
      change: spentChange,
      icon: CreditCard,
    },
  ]

  const StatCard = ({
    title,
    helper,
    value,
    change,
    icon: Icon,
  }: {
    title: string
    helper: string
    value: number
    change: number
    icon: typeof Coins
  }) => (
    <Card className="h-full">
      <CardContent className="h-full">
        <div className="flex h-full flex-col justify-between">
          <div className="mb-4">
            <div className="rounded-lg bg-primary/10 p-2.5 w-fit">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mb-4 space-y-1">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="space-y-3">
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {change !== 0 && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  change > 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                )}
              >
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{change > 0 ? "+" : ""}{change.toFixed(1)}%</span>
                <span className="ml-1 text-muted-foreground">vs last year</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="md:hidden">
        <Carousel opts={{ align: "start" }} className="px-2">
          <CarouselContent>
            {stats.map((stat) => (
              <CarouselItem key={stat.key} className="basis-[85%] sm:basis-1/2">
                <StatCard {...stat} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="hidden gap-4 md:grid md:grid-cols-2">
        {stats.map((stat) => (
          <StatCard key={stat.key} {...stat} />
        ))}
      </div>
    </div>
  )
}

