"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Calculator } from 'lucide-react'

interface RedemptionCalculatorProps {
  availablePoints: number
  usablePoints: number
  pointValue: number
  minRedemption: number
  redemptionIncrement: number
  currency: string
}

export function RedemptionCalculator({
  availablePoints,
  usablePoints,
  pointValue,
  minRedemption,
  redemptionIncrement,
  currency
}: RedemptionCalculatorProps) {
  const [pointsToRedeem, setPointsToRedeem] = React.useState<number>(
    Math.min(usablePoints, Math.floor(usablePoints / redemptionIncrement) * redemptionIncrement)
  )
  const [bookingAmount, setBookingAmount] = React.useState<string>('5000')
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'

  const discount = pointsToRedeem * pointValue
  const bookingAmountNum = parseFloat(bookingAmount) || 0
  const finalPrice = Math.max(0, bookingAmountNum - discount)

  // Round to nearest increment
  const handleSliderChange = (value: number[]) => {
    const val = value[0]
    // Round down to nearest increment
    const rounded = Math.floor(val / redemptionIncrement) * redemptionIncrement
    // Clamp between min and max usable points
    const clamped = Math.max(minRedemption, Math.min(rounded, Math.floor(usablePoints / redemptionIncrement) * redemptionIncrement))
    setPointsToRedeem(clamped)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Redemption Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Calculate your discount
        </p>

        {/* Points Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Points to redeem:</Label>
            <span className="text-sm text-muted-foreground">
              {pointsToRedeem.toLocaleString()} / {availablePoints.toLocaleString()} available
            </span>
          </div>
          <Slider
            value={[pointsToRedeem]}
            onValueChange={handleSliderChange}
            min={minRedemption}
            max={Math.floor(usablePoints / redemptionIncrement) * redemptionIncrement}
            step={redemptionIncrement}
            className="w-full"
          />
          <Input
            type="number"
            min={minRedemption}
            max={usablePoints}
            step={redemptionIncrement}
            value={pointsToRedeem}
            onChange={(e) => {
              const val = parseInt(e.target.value) || minRedemption
              const rounded = Math.floor(val / redemptionIncrement) * redemptionIncrement
              setPointsToRedeem(Math.max(minRedemption, Math.min(rounded, usablePoints)))
            }}
            className="mt-2"
          />
        </div>

        {/* Booking Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="booking-amount">Example booking amount:</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
              {currencySymbol}
            </span>
            <Input
              id="booking-amount"
              type="number"
              min="0"
              step="100"
              value={bookingAmount}
              onChange={(e) => setBookingAmount(e.target.value)}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            (Available: {availablePoints.toLocaleString()} points)
          </p>
        </div>

        {/* Results */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Discount:</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {currencySymbol}{discount.toLocaleString('en-GB', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
          {bookingAmountNum > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Original Price:</span>
                <span className="text-sm">
                  {currencySymbol}{bookingAmountNum.toLocaleString('en-GB', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-base font-semibold">Final Price:</span>
                <span className="text-lg font-bold">
                  {currencySymbol}{finalPrice.toLocaleString('en-GB', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
            </>
          )}
        </div>

        {bookingAmountNum > 0 && finalPrice === 0 && (
          <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 p-3 rounded-md text-sm">
            🎉 Your points cover the entire booking!
          </div>
        )}
      </CardContent>
    </Card>
  )
}

