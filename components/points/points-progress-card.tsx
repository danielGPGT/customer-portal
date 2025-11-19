"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, Gift } from 'lucide-react'

interface PointsProgressCardProps {
  currentPoints: number
  nextThreshold: number
  pointValue: number
  currency: string
  minRedemptionPoints: number
  redemptionIncrement: number
}

export function PointsProgressCard({
  currentPoints,
  nextThreshold,
  pointValue,
  currency,
  minRedemptionPoints,
  redemptionIncrement,
}: PointsProgressCardProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  
  // If below minimum, show progress to minimum
  if (currentPoints < minRedemptionPoints) {
    const progressToMin = (currentPoints / minRedemptionPoints) * 100
    const pointsNeeded = minRedemptionPoints - currentPoints
    const nextDiscount = minRedemptionPoints * pointValue

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="break-words">Progress to First Redemption</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current</span>
              <span className="font-semibold">{currentPoints.toLocaleString()} pts</span>
            </div>
            <Progress value={progressToMin} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minimum Required</span>
              <span className="font-semibold">{minRedemptionPoints.toLocaleString()} pts</span>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points needed:</span>
              <Badge variant="outline">{pointsNeeded.toLocaleString()} pts</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next discount:</span>
              <span className="text-sm font-semibold text-primary">
                {currencySymbol}{nextDiscount.toLocaleString('en-GB', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show progress to next redemption increment
  const currentLevel = Math.floor(currentPoints / redemptionIncrement)
  const nextLevel = currentLevel + 1
  const nextThresholdActual = nextLevel * redemptionIncrement
  const progressInCurrentLevel = currentPoints % redemptionIncrement
  const progressPercentage = (progressInCurrentLevel / redemptionIncrement) * 100
  const pointsToNext = nextThresholdActual - currentPoints
  const nextDiscount = nextThresholdActual * pointValue

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <span className="break-words">Progress to Next Threshold</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Level</span>
            <span className="font-semibold">{currentLevel * redemptionIncrement} pts</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next Threshold</span>
            <span className="font-semibold">{nextThresholdActual.toLocaleString()} pts</span>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Points to next:</span>
            <Badge variant="outline">{pointsToNext.toLocaleString()} pts</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next discount:</span>
            <span className="text-sm font-semibold text-primary flex items-center gap-1">
              <Gift className="h-3 w-3" />
              {currencySymbol}{nextDiscount.toLocaleString('en-GB', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

