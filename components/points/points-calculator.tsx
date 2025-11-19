"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator } from 'lucide-react'

interface PointsCalculatorProps {
  pointsPerPound: number
  pointValue: number
  currency: string
}

export function PointsCalculator({ 
  pointsPerPound, 
  pointValue,
  currency 
}: PointsCalculatorProps) {
  const [amount, setAmount] = React.useState<string>('')
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  
  const points = amount && !isNaN(parseFloat(amount))
    ? Math.floor(parseFloat(amount) * pointsPerPound)
    : 0
  const discountValue = points * pointValue

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Points Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          How much will you earn?
        </p>

        <div className="space-y-2">
          <Label htmlFor="booking-amount">Enter booking amount:</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
              {currencySymbol}
            </span>
            <Input
              id="booking-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7"
              placeholder="4500"
            />
          </div>
        </div>

        {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You'll earn:</span>
              <span className="text-lg font-bold">{points.toLocaleString()} points</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Worth:</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {currencySymbol}{discountValue.toLocaleString('en-GB', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} in discounts
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

