'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift, Sparkles, TrendingUp } from 'lucide-react'

interface LoyaltyPointsSectionProps {
  pointsUsed: number
  pointsEarned: number
  currency: string
  pointValue: number
  totalAmount: number
  isCancelled: boolean
}

export function LoyaltyPointsSection({
  pointsUsed,
  pointsEarned,
  currency,
  pointValue,
  totalAmount,
  isCancelled
}: LoyaltyPointsSectionProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const netPoints = pointsEarned - pointsUsed

  if (isCancelled) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Sparkles className="h-5 w-5" />
            Points Refund Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-red-700">
              This booking was cancelled. Points have been refunded according to our refund policy.
            </p>
          </div>
          {pointsUsed > 0 && (
            <div className="space-y-2 pt-2 border-t border-red-200">
              <div className="text-sm text-muted-foreground">Points Refunded</div>
              <div className="flex items-center gap-2 text-green-600">
                <Gift className="h-4 w-4" />
                <span className="font-medium">+{pointsUsed.toLocaleString()} points</span>
                <span className="text-sm text-muted-foreground">
                  ({currencySymbol}{(pointsUsed * pointValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} discount refunded)
                </span>
              </div>
            </div>
          )}
          {pointsEarned > 0 && (
            <div className="space-y-2 pt-2 border-t border-red-200">
              <div className="text-sm text-muted-foreground">Points Deducted</div>
              <div className="flex items-center gap-2 text-red-600">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">-{pointsEarned.toLocaleString()} points</span>
                <span className="text-sm text-muted-foreground">
                  (Points earned from this booking)
                </span>
              </div>
            </div>
          )}
          {netPoints !== 0 && (
            <div className="pt-2 border-t border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Change</span>
                <span className={`font-bold ${netPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netPoints >= 0 ? '+' : ''}{netPoints.toLocaleString()} points
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Loyalty Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pointsUsed > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Points Used</div>
            <div className="flex items-center gap-2 text-purple-600">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">{pointsUsed.toLocaleString()} points</span>
              <span className="text-sm text-muted-foreground">
                ({currencySymbol}{(pointsUsed * pointValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} discount)
              </span>
            </div>
          </div>
        )}

        {pointsEarned > 0 && (
          <div className={`space-y-2 ${pointsUsed > 0 ? 'border-t pt-4' : ''}`}>
            <div className="text-sm text-muted-foreground">Points Earned</div>
            <div className="flex items-center gap-2 text-green-600">
              <Gift className="h-4 w-4" />
              <span className="font-medium">+{pointsEarned.toLocaleString()} points</span>
              <span className="text-sm text-muted-foreground">
                (from {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spend)
              </span>
            </div>
          </div>
        )}

        {pointsUsed > 0 && pointsEarned > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Net Benefit</span>
              </div>
              <span className={`font-bold ${netPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netPoints >= 0 ? '+' : ''}{netPoints.toLocaleString()} points
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

