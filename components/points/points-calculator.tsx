"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator } from 'lucide-react'
import { getCurrencySymbol, formatCurrencyWithSymbol } from '@/lib/utils/currency'
import { CurrencyService } from '@/lib/currencyService'

interface PointsCalculatorProps {
  pointsPerPound: number
  pointValue: number
  baseCurrency: string
  preferredCurrency?: string
}

export function PointsCalculator({ 
  pointsPerPound, 
  pointValue,
  baseCurrency,
  preferredCurrency
}: PointsCalculatorProps) {
  const [amount, setAmount] = React.useState<string>('')
  const [convertedDiscount, setConvertedDiscount] = React.useState<number | null>(null)
  const [isConverting, setIsConverting] = React.useState(false)
  const [amountInBaseCurrency, setAmountInBaseCurrency] = React.useState<number>(0)
  
  // Determine display currency - use preferred if provided and different from base, otherwise use base
  const hasPreferredCurrency = preferredCurrency && preferredCurrency.toUpperCase() !== baseCurrency.toUpperCase()
  const displayCurrency = hasPreferredCurrency ? preferredCurrency : baseCurrency
  const inputCurrency = hasPreferredCurrency ? preferredCurrency : baseCurrency
  const baseCurrencySymbol = getCurrencySymbol(baseCurrency)
  const inputCurrencySymbol = getCurrencySymbol(inputCurrency)
  
  // Convert entered amount from preferred currency to base currency for calculations
  React.useEffect(() => {
    const amountNum = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0
    
    if (amountNum > 0 && hasPreferredCurrency) {
      setIsConverting(true)
      const convertAmount = async () => {
        try {
          // Convert from preferred currency to base currency
          const conversion = await CurrencyService.convertCurrency(
            amountNum,
            preferredCurrency!,
            baseCurrency
          )
          setAmountInBaseCurrency(conversion.convertedAmount)
        } catch (error) {
          console.error('[PointsCalculator] Error converting amount:', error)
          setAmountInBaseCurrency(amountNum) // Fallback to entered amount
        } finally {
          setIsConverting(false)
        }
      }
      convertAmount()
    } else {
      setAmountInBaseCurrency(amountNum)
    }
  }, [amount, hasPreferredCurrency, preferredCurrency, baseCurrency])
  
  // Calculate points based on base currency amount
  const points = amountInBaseCurrency > 0
    ? Math.floor(amountInBaseCurrency * pointsPerPound)
    : 0
  const discountValueBase = points * pointValue

  // Convert discount to preferred currency for display
  React.useEffect(() => {
    if (hasPreferredCurrency && discountValueBase > 0) {
      setIsConverting(true)
      const convertDiscount = async () => {
        try {
          const conversion = await CurrencyService.convertCurrency(
            discountValueBase,
            baseCurrency,
            preferredCurrency!
          )
          setConvertedDiscount(conversion.convertedAmount)
        } catch (error) {
          console.error('[PointsCalculator] Error converting discount:', error)
          setConvertedDiscount(null)
        } finally {
          setIsConverting(false)
        }
      }
      convertDiscount()
    } else {
      setConvertedDiscount(null)
      setIsConverting(false)
    }
  }, [discountValueBase, hasPreferredCurrency, preferredCurrency, baseCurrency])

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
              {inputCurrencySymbol}
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
          {hasPreferredCurrency && (
            <p className="text-xs text-muted-foreground">
              Enter amount in {preferredCurrency}. Points calculated in {baseCurrency}.
            </p>
          )}
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
                {isConverting ? (
                  <span className="text-sm text-muted-foreground">Converting...</span>
                ) : hasPreferredCurrency && convertedDiscount !== null ? (
                  formatCurrencyWithSymbol(convertedDiscount, preferredCurrency!) + ' in discounts'
                ) : (
                  formatCurrencyWithSymbol(discountValueBase, baseCurrency) + ' in discounts'
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

