"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gift, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface RedeemExplainerCardProps {
  pointValue: number
  minRedemptionPoints: number
  availablePoints: number
  currency: string
}

export function RedeemExplainerCard({ 
  pointValue,
  minRedemptionPoints,
  availablePoints,
  currency 
}: RedeemExplainerCardProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const usablePoints = Math.floor(availablePoints / minRedemptionPoints) * minRedemptionPoints
  const discountValue = usablePoints * pointValue

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Redeem Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-base font-medium">
            1 point = {currencySymbol}{pointValue.toFixed(2)} discount
          </p>
          <p className="text-sm text-muted-foreground">
            Minimum: {minRedemptionPoints.toLocaleString()} points
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">
            Your {availablePoints.toLocaleString()} points can save you {currencySymbol}{discountValue.toLocaleString('en-GB', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} on your next trip!
          </p>
        </div>

        <Button asChild variant="outline" className="w-full" disabled={availablePoints < minRedemptionPoints}>
          <Link href="/points/redeem" className="flex items-center justify-between">
            <span>Calculate Discount</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

