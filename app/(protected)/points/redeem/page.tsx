import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RedemptionCalculator } from '@/components/points/redemption-calculator'
import { Gift, Calendar, CheckCircle, AlertTriangle, Info, Lightbulb, FileText, ArrowRight, Coins, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getClient } from '@/lib/utils/get-client'
import { getClientPreferredCurrency, getCurrencySymbol, formatCurrencyWithSymbol } from '@/lib/utils/currency'
import { convertDiscountToPreferredCurrency } from '@/lib/utils/currency-conversion'

export const metadata: Metadata = {
  title: 'How to Redeem Points | Grand Prix Grand Tours Portal',
  description: 'Learn how to redeem your loyalty points for discounts on bookings',
}

// Dynamic page - no caching to ensure immediate updates when preferences change
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PointsRedeemPage() {
  const supabase = await createClient()
  const { client, user } = await getClient()

  if (!user || !client) {
    redirect('/login')
  }

  // Get loyalty settings
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('*')
    .eq('id', 1)
    .single()

  // Get reserved points
  const { data: pendingRedemptions } = await supabase
    .from('redemptions')
    .select('points_redeemed')
    .eq('client_id', client.id)
    .eq('status', 'pending')

  const reservedPoints = pendingRedemptions?.reduce((sum, r) => sum + (r.points_redeemed || 0), 0) || 0
  const availablePoints = (client.points_balance || 0) - reservedPoints

  // Get available discount using the function
  let availableDiscount = {
    points_balance: client.points_balance || 0,
    usable_points: availablePoints,
    discount_amount: availablePoints * (settings?.point_value || 1)
  }

  try {
    const { data: discountData, error } = await supabase
      .rpc('calculate_available_discount', { p_client_id: client.id })
    
    if (!error && discountData && discountData.length > 0) {
      availableDiscount = discountData[0]
    }
  } catch (error) {
    // Fallback to calculated value if RPC fails
    console.warn('Failed to fetch available discount from RPC:', error)
  }

  // Get redemption stats
  const { data: redemptionsData } = await supabase
    .from('redemptions')
    .select('points_redeemed, discount_amount')
    .eq('client_id', client.id)
    .eq('status', 'applied')

  const totalRedemptions = redemptionsData?.length || 0
  const totalPointsRedeemed = redemptionsData?.reduce((sum, r) => sum + (r.points_redeemed || 0), 0) || 0
  const totalSaved = redemptionsData?.reduce((sum, r) => sum + (parseFloat(r.discount_amount?.toString() || '0')), 0) || 0

  const pointValue = settings?.point_value || 1
  const minRedemption = settings?.min_redemption_points || 100
  const redemptionIncrement = settings?.redemption_increment || 100
  const baseCurrency = settings?.currency || 'GBP'
  const preferredCurrency = getClientPreferredCurrency(client, baseCurrency)
  const baseCurrencySymbol = getCurrencySymbol(baseCurrency)
  const preferredCurrencySymbol = getCurrencySymbol(preferredCurrency)
  const usablePoints = availableDiscount.usable_points || Math.floor(availablePoints / redemptionIncrement) * redemptionIncrement
  const discountValueBase = usablePoints * pointValue
  
  // Convert discount to preferred currency if different
  const discountConversion = await convertDiscountToPreferredCurrency(
    discountValueBase,
    baseCurrency,
    preferredCurrency
  )
  
  // Convert example amounts to preferred currency
  const example100Conversion = await convertDiscountToPreferredCurrency(100, baseCurrency, preferredCurrency)
  const example200Conversion = await convertDiscountToPreferredCurrency(200, baseCurrency, preferredCurrency)
  const totalSavedConversion = await convertDiscountToPreferredCurrency(totalSaved, baseCurrency, preferredCurrency)

  return (
    <div className="space-y-8">
      <PageHeader
        title="How to Redeem Points"
        description="Turn your points into savings on your next Grand Prix adventure"
      />

      {/* Redemption Rate Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Redemption Rate
          </CardTitle>
          <CardDescription>
            Your points value when applied to bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside ml-2">
            <li>
              Points can be redeemed in {formatCurrencyWithSymbol(example100Conversion.convertedAmount, preferredCurrency)} increments
            </li>
            <li>
              Every 100 points = {formatCurrencyWithSymbol(example100Conversion.convertedAmount, preferredCurrency)} off your next booking
            </li>
            <li>Any points leftover stay in your balance and can be used in the future</li>
            <li>Your points will automatically show on any new quote you receive from the Sales Team</li>
          </ul>
        </CardContent>
      </Card>

      {/* Available Discount Card */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Your Available Discount</h2>
          <p className="text-muted-foreground">
            See how much you can save right now
          </p>
        </div>
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs opacity-90">Available Points</p>
                  <p className="text-lg font-bold">{availablePoints.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-xs opacity-90">Usable Points</p>
                  <p className="text-lg font-bold">{usablePoints.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-4 border-t border-primary-foreground/20">
                <p className="text-xs opacity-90">You Can Save:</p>
                <div className="text-3xl font-bold">
                  {formatCurrencyWithSymbol(discountConversion.convertedAmount, preferredCurrency)}
                </div>
                <p className="text-sm opacity-90">
                  on your next booking!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How to Redeem Steps */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">How to Redeem</h2>
          <p className="text-muted-foreground">
            Follow these simple steps to use your points
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Step 1 */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  1
                </div>
                <CardTitle className="text-lg">Choose Your Trip</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground flex-1">
                Browse our events and select the perfect Grand Prix experience for you.
              </p>
              <Button asChild className="w-full">
                <a 
                  href="https://www.grandprixgrandtours.com/f1-packages/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Browse Events</span>
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  2
                </div>
                <CardTitle className="text-lg">Apply Points on Quote</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                When you receive a quote from our Sales Team, your available points will automatically show on your quote. You'll see the updated total after your discount is applied.
              </p>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  3
                </div>
                <CardTitle className="text-lg">Save Money!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Your points discount will be automatically applied to your final price. Enjoy your savings!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redemption Calculator */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Redemption Calculator</h2>
          <p className="text-muted-foreground">
            Calculate how much you can save with your available points
          </p>
        </div>
        <RedemptionCalculator 
          availablePoints={availablePoints}
          usablePoints={usablePoints}
          pointValue={pointValue}
          minRedemption={minRedemption}
          redemptionIncrement={redemptionIncrement}
          baseCurrency={baseCurrency}
          preferredCurrency={preferredCurrency !== baseCurrency ? preferredCurrency : undefined}
        />
      </div>

      {/* Redemption Example */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">How It Works</h2>
          <p className="text-muted-foreground">
            See an example of how points redemption works
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Example:</p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">You have 285 points</p>
                  <p className="text-muted-foreground">
                    → You can redeem {formatCurrencyWithSymbol(example200Conversion.convertedAmount, preferredCurrency)} today
                  </p>
                  <p className="text-muted-foreground">→ 85 points will remain in your balance for next time</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Points are redeemed in {formatCurrencyWithSymbol(example100Conversion.convertedAmount, preferredCurrency)} blocks, so any leftover points stay in your balance for future use.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Rules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Important Information</h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Redemption Increments */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold">Redemption Increments</h3>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>
                  Points are redeemed in {formatCurrencyWithSymbol(example100Conversion.convertedAmount, preferredCurrency)} blocks
                </li>
                <li>
                  Every 100 points = {formatCurrencyWithSymbol(example100Conversion.convertedAmount, preferredCurrency)} discount
                </li>
                <li>Any leftover points remain in your balance</li>
              </ul>
            </div>

            {/* When to Use Points */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold">When Can I Use Points?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                You can use points when you receive a quote from our Sales Team. Your available points will automatically show on your quote, and you'll see the updated total after your discount is applied.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redemption History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Your Redemption History</h2>
          <p className="text-muted-foreground">
            Track your points redemptions and total savings
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Redemption Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points Redeemed</p>
                  <p className="text-2xl font-bold mt-1">
                    {totalPointsRedeemed.toLocaleString()}
                  </p>
                </div>
                <Coins className="h-8 w-8 text-primary opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrencyWithSymbol(totalSavedConversion.convertedAmount, preferredCurrency)}
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Bookings</p>
                  <p className="text-lg font-semibold">{totalRedemptions}</p>
                  <p className="text-xs text-muted-foreground mt-1">booking{totalRedemptions !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/points" className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" />
                <span>View Full Statement</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

