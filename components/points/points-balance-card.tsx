"use client"

import * as React from "react"
import Link from "next/link"
import { MoreVertical, Wallet, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface PointsBalanceCardProps {
  pointsBalance: number
  availablePoints: number
  reservedPoints: number
  availableDiscount: {
    points_balance: number
    usable_points: number
    discount_amount: number
  }
  nextThreshold: number
  minRedemptionPoints: number
  redemptionIncrement: number
  currency?: string
  pointValue?: number
  className?: string
}

export function PointsBalanceCard({
  pointsBalance,
  availablePoints,
  reservedPoints,
  availableDiscount,
  nextThreshold,
  minRedemptionPoints,
  redemptionIncrement,
  currency = "GBP",
  pointValue = 1,
  className,
}: PointsBalanceCardProps) {
  const currencySymbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "€"
  const discountAmount = availableDiscount.discount_amount || availablePoints * pointValue
  
  // Calculate progress to next threshold (same logic as progress card)
  const currentPoints = availablePoints
  let nextThresholdActual = nextThreshold
  let progressToNext = 0
  
  if (currentPoints < minRedemptionPoints) {
    // Below minimum, show progress to minimum
    nextThresholdActual = minRedemptionPoints
    progressToNext = (currentPoints / minRedemptionPoints) * 100
  } else {
    // Show progress to next redemption increment
    const currentLevel = Math.floor(currentPoints / redemptionIncrement)
    const nextLevel = currentLevel + 1
    nextThresholdActual = nextLevel * redemptionIncrement
    const progressInCurrentLevel = currentPoints % redemptionIncrement
    progressToNext = (progressInCurrentLevel / redemptionIncrement) * 100
  }
  
  const pointsToNext = nextThresholdActual - currentPoints
  const nextDiscount = nextThresholdActual * pointValue

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Points Balance</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Export Statement</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4 h-full">
        <div className="h-full flex flex-col justify-between">
        {/* Summary Section - Icon + Large Number */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{pointsBalance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Points Balance</div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mt-2 mb-2" />

        {/* Current Activity Progress Bar */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Current Activity</div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <p><span className="text-muted-foreground">Current</span><span className="font-semibold ml-2">{currentPoints.toLocaleString()}</span></p>
            <p><span className="text-muted-foreground">Next Threshold</span><span className="font-semibold ml-2">{nextThresholdActual.toLocaleString()}</span></p>
          </div>
        </div>

        {/* Metrics List */}
        <div className="space-y-0 flex flex-col md:flex-row gap-2 mt-4">
          <Button variant="outline" asChild className="">
            <Link href="/points/earn" prefetch={true}>
              How to earn points?
            </Link>
          </Button>
          <Button variant="default" asChild className="">
            <Link href="/points/redeem" prefetch={true}>
              How to redeem points?
            </Link>
          </Button>
        </div>







        </div>
      </CardContent>
    </Card>
  )
}
