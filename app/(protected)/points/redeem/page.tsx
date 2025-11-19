import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RedemptionCalculator } from '@/components/points/redemption-calculator'
import { Gift, Calendar, CreditCard, CheckCircle, AlertTriangle, Info, Lightbulb, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function PointsRedeemPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get client data
  let { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) {
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
  const currency = settings?.currency || 'GBP'
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const usablePoints = availableDiscount.usable_points || Math.floor(availablePoints / redemptionIncrement) * redemptionIncrement
  const discountValue = usablePoints * pointValue

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">How to Redeem Points</h1>
      </div>

      {/* Redemption Rate Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Redemption Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base font-medium">
            1 point = {currencySymbol}{pointValue.toFixed(2)} discount
          </p>
          <p className="text-base text-muted-foreground">
            Simple as that! Use your points to save on your next booking.
          </p>
        </CardContent>
      </Card>

      {/* Available Discount Card */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Available Discount</h2>
        <Card className="bg-black text-white border-none">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm opacity-90">Available Points: {availablePoints.toLocaleString()}</div>
                <div className="text-sm opacity-90">Usable Points: {usablePoints.toLocaleString()}</div>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/20">
                <div className="text-sm opacity-90">You Can Save:</div>
                <div className="text-4xl md:text-5xl font-bold">
                  {currencySymbol}{discountValue.toLocaleString('en-GB', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-base opacity-90">
                  on your next booking!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How to Redeem Steps */}
      <div>
        <h2 className="text-xl font-semibold mb-4">How to Redeem</h2>
        <div className="space-y-4">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">1️⃣</span>
                <span>Choose Your Trip</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-muted-foreground">
                Browse our events and select the perfect trip for you.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/trips" className="flex items-center justify-between">
                  <span>Browse Events</span>
                  <Calendar className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">2️⃣</span>
                <span>Apply Points at Checkout</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground">
                During booking, you'll see an option to apply your points as a discount.
              </p>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">3️⃣</span>
                <span>Save Money!</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground">
                Your points discount will be applied to your final price. It's that simple!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redemption Calculator */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Redemption Calculator</h2>
        <RedemptionCalculator 
          availablePoints={availablePoints}
          usablePoints={usablePoints}
          pointValue={pointValue}
          minRedemption={minRedemption}
          redemptionIncrement={redemptionIncrement}
          currency={currency}
        />
      </div>

      {/* Important Rules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Important Rules</h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Minimum Redemption */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-semibold">Minimum Redemption</h3>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Minimum: {minRedemption.toLocaleString()} points</li>
                <li>Must redeem in multiples of {redemptionIncrement.toLocaleString()} points</li>
              </ul>
            </div>

            {/* Redemption Limits */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold">Redemption Limits</h3>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Cannot exceed booking price</li>
                <li>Points reserved at quote</li>
                <li>Applied when booking confirms</li>
              </ul>
            </div>

            {/* Tip */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold">Tip: Combine with Cash</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Don't have enough points? Use what you have and pay the rest in cash!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redemption History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Redemption History</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Redeemed:</span>
                <span className="text-lg font-bold">{totalPointsRedeemed.toLocaleString()} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Saved:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {currencySymbol}{totalSaved.toLocaleString('en-GB', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Used on {totalRedemptions} booking{totalRedemptions !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/points/statement" className="flex items-center justify-between">
                <span>View Statement</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

