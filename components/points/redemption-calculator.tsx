"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Calculator } from 'lucide-react'
import { getCurrencySymbol, formatCurrencyWithSymbol } from '@/lib/utils/currency'
import { CurrencyService } from '@/lib/currencyService'
import { useCurrency } from '@/components/providers/currency-provider'

interface RedemptionCalculatorProps {
  availablePoints: number
  usablePoints: number
  pointValue: number
  minRedemption: number
  redemptionIncrement: number
  baseCurrency: string
  preferredCurrency?: string
}

export function RedemptionCalculator({
  availablePoints,
  usablePoints,
  pointValue,
  minRedemption,
  redemptionIncrement,
  baseCurrency,
  preferredCurrency: propPreferredCurrency
}: RedemptionCalculatorProps) {
  // Use currency from context (enterprise-level state management)
  let contextCurrency: string | undefined
  try {
    const { currency } = useCurrency()
    contextCurrency = currency
  } catch {
    // Fallback to prop if context not available
    contextCurrency = propPreferredCurrency
  }
  
  const preferredCurrency = contextCurrency || propPreferredCurrency
  const [pointsToRedeem, setPointsToRedeem] = React.useState<number>(
    Math.min(usablePoints, Math.floor(usablePoints / redemptionIncrement) * redemptionIncrement)
  )
  const [bookingAmount, setBookingAmount] = React.useState<string>('5000')
  const [bookingAmountInBase, setBookingAmountInBase] = React.useState<number>(5000)
  const [convertedDiscount, setConvertedDiscount] = React.useState<number | null>(null)
  const [convertedFinalPrice, setConvertedFinalPrice] = React.useState<number | null>(null)
  const [isConverting, setIsConverting] = React.useState(false)
  
  const hasPreferredCurrency = preferredCurrency && preferredCurrency.toUpperCase() !== baseCurrency.toUpperCase()
  const displayCurrency = hasPreferredCurrency ? preferredCurrency : baseCurrency
  const inputCurrency = hasPreferredCurrency ? preferredCurrency : baseCurrency
  const baseCurrencySymbol = getCurrencySymbol(baseCurrency)
  const inputCurrencySymbol = getCurrencySymbol(inputCurrency)

  const discountBase = pointsToRedeem * pointValue
  const bookingAmountNum = parseFloat(bookingAmount) || 0
  
  // Convert booking amount from preferred currency to base currency
  React.useEffect(() => {
    // Reset immediately if no preferred currency or currencies match
    if (!hasPreferredCurrency) {
      setBookingAmountInBase(bookingAmountNum)
      return
    }
    
    if (bookingAmountNum > 0) {
      setIsConverting(true)
      const convertAmount = async () => {
        try {
          const conversion = await CurrencyService.convertCurrency(
            bookingAmountNum,
            preferredCurrency!,
            baseCurrency
          )
          setBookingAmountInBase(conversion.convertedAmount)
        } catch (error) {
          console.error('[RedemptionCalculator] Error converting booking amount:', error)
          setBookingAmountInBase(bookingAmountNum)
        } finally {
          setIsConverting(false)
        }
      }
      convertAmount()
    } else {
      setBookingAmountInBase(bookingAmountNum)
    }
  }, [bookingAmountNum, hasPreferredCurrency, preferredCurrency, baseCurrency])
  
  const finalPriceBase = Math.max(0, bookingAmountInBase - discountBase)
  
  // Convert discount and final price to preferred currency for display
  React.useEffect(() => {
    // Reset immediately if no preferred currency or currencies match
    if (!hasPreferredCurrency) {
      setConvertedDiscount(null)
      setConvertedFinalPrice(null)
      setIsConverting(false)
      return
    }
    
    if (discountBase > 0) {
      setIsConverting(true)
      const convertAmounts = async () => {
        try {
          const [discountConv, finalPriceConv] = await Promise.all([
            CurrencyService.convertCurrency(discountBase, baseCurrency, preferredCurrency!),
            finalPriceBase > 0 
              ? CurrencyService.convertCurrency(finalPriceBase, baseCurrency, preferredCurrency!)
              : Promise.resolve({ convertedAmount: 0, rate: 1, adjustedRate: 1, fromCurrency: baseCurrency, toCurrency: preferredCurrency!, amount: 0 })
          ])
          setConvertedDiscount(discountConv.convertedAmount)
          setConvertedFinalPrice(finalPriceConv.convertedAmount)
        } catch (error) {
          console.error('[RedemptionCalculator] Error converting amounts:', error)
          setConvertedDiscount(null)
          setConvertedFinalPrice(null)
        } finally {
          setIsConverting(false)
        }
      }
      convertAmounts()
    } else {
      setConvertedDiscount(null)
      setConvertedFinalPrice(null)
      setIsConverting(false)
    }
  }, [discountBase, finalPriceBase, hasPreferredCurrency, preferredCurrency, baseCurrency])

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
              {inputCurrencySymbol}
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
            {hasPreferredCurrency && (
              <span className="ml-1">• Enter amount in {preferredCurrency}</span>
            )}
          </p>
        </div>

        {/* Results */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Discount:</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {isConverting ? (
                <span className="text-sm text-muted-foreground">Converting...</span>
              ) : hasPreferredCurrency && convertedDiscount !== null ? (
                formatCurrencyWithSymbol(convertedDiscount, preferredCurrency!)
              ) : (
                formatCurrencyWithSymbol(discountBase, baseCurrency)
              )}
            </span>
          </div>
          {bookingAmountNum > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Original Price:</span>
                <span className="text-sm">
                  {formatCurrencyWithSymbol(bookingAmountNum, inputCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-base font-semibold">Final Price:</span>
                <span className="text-lg font-bold">
                  {isConverting ? (
                    <span className="text-sm text-muted-foreground">Converting...</span>
                  ) : hasPreferredCurrency && convertedFinalPrice !== null ? (
                    formatCurrencyWithSymbol(convertedFinalPrice, preferredCurrency!)
                  ) : (
                    formatCurrencyWithSymbol(finalPriceBase, baseCurrency)
                  )}
                </span>
              </div>
            </>
          )}
        </div>

        {bookingAmountNum > 0 && (hasPreferredCurrency && convertedFinalPrice !== null ? convertedFinalPrice : finalPriceBase) === 0 && (
          <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 p-3 rounded-md text-sm">
            🎉 Your points cover the entire booking!
          </div>
        )}
      </CardContent>
    </Card>
  )
}

