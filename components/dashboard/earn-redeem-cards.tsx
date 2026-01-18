'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Sparkles, ArrowRight, Plane, UserPlus, Gift } from 'lucide-react'
import { getCurrencySymbol, formatCurrencyWithSymbol } from '@/lib/utils/currency'
import { useEffect, useState } from 'react'
import { CurrencyService } from '@/lib/currencyService'
import { useCurrency } from '@/components/providers/currency-provider'

interface EarnRedeemCardsProps {
  baseCurrency?: string
  preferredCurrency?: string
  pointsPerPound?: number
  pointValue?: number
}

export function EarnRedeemCards({ baseCurrency = 'GBP', preferredCurrency: propPreferredCurrency, pointsPerPound = 0.05, pointValue = 1 }: EarnRedeemCardsProps) {
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
  const displayCurrency = preferredCurrency || baseCurrency
  const baseCurrencySymbol = getCurrencySymbol(baseCurrency)
  const displayCurrencySymbol = getCurrencySymbol(displayCurrency)
  const spendAmount = 20 // For every £20 you spend, you earn 1 point
  
  // Convert amounts to preferred currency
  const [convertedAmounts, setConvertedAmounts] = useState({
    spend20: 20,
    pointValue: pointValue,
    redeem100: 100
  })
  
  useEffect(() => {
    // Reset to base values immediately if currencies match
    if (!preferredCurrency || preferredCurrency.toUpperCase() === baseCurrency.toUpperCase()) {
      setConvertedAmounts({
        spend20: 20,
        pointValue: pointValue,
        redeem100: 100
      })
      return
    }

    // Convert if currencies are different
    const convertAmounts = async () => {
      try {
        const [spend20Conv, pointValueConv, redeem100Conv] = await Promise.all([
          CurrencyService.convertCurrency(20, baseCurrency, preferredCurrency),
          CurrencyService.convertCurrency(pointValue, baseCurrency, preferredCurrency),
          CurrencyService.convertCurrency(100, baseCurrency, preferredCurrency)
        ])
        setConvertedAmounts({
          spend20: spend20Conv.convertedAmount,
          pointValue: pointValueConv.convertedAmount,
          redeem100: redeem100Conv.convertedAmount
        })
      } catch (error) {
        console.error('Error converting currency:', error)
        // Fallback to base values on error
        setConvertedAmounts({
          spend20: 20,
          pointValue: pointValue,
          redeem100: 100
        })
      }
    }
    convertAmounts()
  }, [preferredCurrency, baseCurrency, pointValue])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* How to Earn Points Card */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">How to Earn Points</CardTitle>
              <CardDescription className="mt-1">
                Discover all the ways you can accumulate points
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Info */}
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-foreground mb-2">Your Earning Rate</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    For every {formatCurrencyWithSymbol(convertedAmounts.spend20, displayCurrency)} you spend, you earn 1 point
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    1 point = {formatCurrencyWithSymbol(convertedAmounts.pointValue, displayCurrency)} to use on a future booking
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Points are automatically credited after booking confirmation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Ways to Earn - Compact */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ways to Earn</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Plane className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">Book your motorsport experience</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <UserPlus className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">Refer a friend (100 points each)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Gift className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">Sign up via referral (100 bonus points)</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button asChild className="w-full mt-4" variant="default">
            <Link href="/points/earn">
              Learn More About Earning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* How to Redeem Points Card */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">How to Redeem Points</CardTitle>
              <CardDescription className="mt-1">
                Turn your points into savings on your next adventure
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Info */}
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-foreground mb-2">Redemption Rate</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Points can be redeemed in {formatCurrencyWithSymbol(convertedAmounts.redeem100, displayCurrency)} increments
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Every 100 points = {formatCurrencyWithSymbol(convertedAmounts.redeem100, displayCurrency)} off your next booking
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Points automatically show on quotes from the Sales Team</span>
                </li>
              </ul>
            </div>
          </div>

          {/* How to Redeem - Compact Steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Simple Steps</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <span className="text-sm text-foreground">Choose your trip</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <span className="text-sm text-foreground">Apply points on your quote</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <span className="text-sm text-foreground">Save money on your booking!</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button asChild className="w-full mt-4" variant="default">
            <Link href="/points/redeem">
              Learn More About Redeeming
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
