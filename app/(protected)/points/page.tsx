import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PointsBalanceCard } from '@/components/points/points-balance-card'
import { EnhancedStatsGrid } from '@/components/points/enhanced-stats-grid'
import { PointsBreakdownChart } from '@/components/points/points-breakdown-chart'
import { PointsProgressCard } from '@/components/points/points-progress-card'
import { RecentTransactionsTable } from '@/components/points/recent-transactions-table'
import { ReferralShareCard } from '@/components/points/referral-share-card'
import { PointsActivityChart } from '@/components/points/points-activity-chart'
import { PointsExpiringAlert } from '@/components/points/points-expiring-alert'

export default async function PointsPage() {
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

  // Get reserved points from pending redemptions
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

  // Get all transactions for calculations
  const { data: allTransactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  // Get recent transactions for table
  const { data: recentTransactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get booking references for recent transactions
  const recentTransactionsWithBookings = await Promise.all(
    (recentTransactions || []).map(async (tx) => {
      if (tx.source_reference_id && (tx.source_type === 'purchase' || tx.source_type === 'redemption')) {
        const { data: booking } = await supabase
          .from('bookings_cache')
          .select('booking_reference, event_name')
          .eq('booking_id', tx.source_reference_id)
          .maybeSingle()
        
        return {
          ...tx,
          booking_reference: booking?.booking_reference || null,
          event_name: booking?.event_name || null,
        }
      }
      return {
        ...tx,
        booking_reference: null,
        event_name: null,
      }
    })
  )

  // Calculate points breakdown by source
  const pointsBySource = {
    purchase: allTransactions?.filter(t => t.source_type === 'purchase' && t.transaction_type === 'earn').reduce((sum, t) => sum + (t.points || 0), 0) || 0,
    referral: allTransactions?.filter(t => (t.source_type === 'referral_signup' || t.source_type === 'referral_booking') && t.transaction_type === 'earn').reduce((sum, t) => sum + (t.points || 0), 0) || 0,
    refund: allTransactions?.filter(t => t.source_type === 'refund' && t.transaction_type === 'earn').reduce((sum, t) => sum + (t.points || 0), 0) || 0,
    adjustment: allTransactions?.filter(t => t.source_type === 'manual_adjustment' && t.transaction_type === 'earn').reduce((sum, t) => sum + (t.points || 0), 0) || 0,
  }


  // Calculate booking stats
  const { data: bookingsData } = await supabase
    .from('bookings_cache')
    .select('points_earned')
    .eq('client_id', client.id)
    .in('booking_status', ['confirmed', 'completed'])
    .not('points_earned', 'is', null)

  const totalBookings = bookingsData?.length || 0
  const averagePerBooking = totalBookings > 0
    ? Math.round(pointsBySource.purchase / totalBookings)
    : 0

  // Calculate next redemption threshold
  const minRedemption = settings?.min_redemption_points || 100
  const redemptionIncrement = settings?.redemption_increment || 100
  const currentLevel = Math.floor(availablePoints / redemptionIncrement)
  const nextThreshold = currentLevel < 1 
    ? minRedemption 
    : (currentLevel + 1) * redemptionIncrement

  // Get expiring points if expiry is enabled
  let expiringPointsData: { points_expiring: number; days_remaining: number } | null = null
  if (settings?.points_expire_after_days) {
    try {
      const { data: expiringData } = await supabase
        .from('points_expiring_soon')
        .select('points_balance, days_remaining')
        .eq('id', client.id)
        .maybeSingle()
      
      if (expiringData && expiringData.days_remaining > 0 && expiringData.days_remaining <= 30) {
        // The view shows customers with points expiring, but doesn't calculate exact amount
        // We'll use a conservative estimate based on balance (in production, implement FIFO for exact amount)
        const estimatedExpiring = expiringData.points_balance || client.points_balance || 0
        expiringPointsData = {
          points_expiring: estimatedExpiring,
          days_remaining: expiringData.days_remaining
        }
      }
    } catch (error) {
      // View might not exist or error querying, ignore silently
      console.warn('Failed to fetch expiring points:', error)
    }
  }

  // Get referral data
  const { data: referralData } = await supabase
    .from('referrals')
    .select('referral_code, referral_link')
    .eq('referrer_client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get monthly activity data for chart
  const monthlyMap = new Map<string, { earned: number; spent: number }>()
  
  allTransactions?.forEach(tx => {
    const month = new Date(tx.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { earned: 0, spent: 0 })
    }
    const data = monthlyMap.get(month)!
    if (tx.transaction_type === 'earn') {
      data.earned += tx.points
    } else if (tx.transaction_type === 'spend') {
      data.spent += Math.abs(tx.points)
    }
  })
  
  const monthlyActivity = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      earned: data.earned,
      spent: data.spent,
      net: data.earned - data.spent
    }))
    .slice(-6) // Last 6 months
    .reverse()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Points Balance</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Track your points, earnings, and redemptions
          </p>
        </div>
      </div>

      {/* Points Expiring Warning */}
      {expiringPointsData && (
        <PointsExpiringAlert
          pointsExpiring={expiringPointsData.points_expiring}
          daysRemaining={expiringPointsData.days_remaining}
          currency={settings?.currency || 'GBP'}
          pointValue={settings?.point_value || 1}
        />
      )}

      {/* Main Layout: Left Column (Main Content) + Right Column (Sidebar) */}
      <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,2fr)_360px] xl:grid-cols-[minmax(0,2.1fr)_400px]">
        {/* LEFT COLUMN - Main Content */}
        <div className="space-y-6 min-w-0">
          {/* Top Row: Two Cards Side-by-Side */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-[2fr_1fr]">
            <PointsBalanceCard 
              points={client.points_balance || 0}
              availablePoints={availablePoints}
              reservedPoints={reservedPoints}
              pointValue={settings?.point_value || 1}
              currency={settings?.currency || 'GBP'}
            />
            <PointsProgressCard
              currentPoints={availablePoints}
              nextThreshold={nextThreshold}
              pointValue={settings?.point_value || 1}
              currency={settings?.currency || 'GBP'}
              minRedemptionPoints={minRedemption}
              redemptionIncrement={redemptionIncrement}
            />
          </div>

          {/* Middle Row: Five Stats Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Lifetime Summary</h2>
            <EnhancedStatsGrid 
              lifetimeEarned={client.lifetime_points_earned || 0}
              lifetimeSpent={client.lifetime_points_spent || 0}
              memberSince={client.loyalty_enrolled_at}
              averagePerBooking={averagePerBooking}
              totalBookings={totalBookings}
              availablePoints={availablePoints}
              currency={settings?.currency || 'GBP'}
              pointValue={settings?.point_value || 1}
            />
          </div>

          {/* Bottom Section: Large Activity Chart */}
          <PointsActivityChart monthlyData={monthlyActivity} />
        </div>

        {/* RIGHT COLUMN - Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start lg:pl-4 w-full lg:w-auto">
          {/* Top: Points Breakdown Chart (Donut) */}
          <PointsBreakdownChart breakdown={pointsBySource} />

          {/* Middle: Recent Transactions Table */}
          <RecentTransactionsTable 
            transactions={recentTransactionsWithBookings || []}
            maxRows={5}
          />

          {/* Bottom: Referral Share Code UI */}
          <ReferralShareCard
            referralCode={referralData?.referral_code || null}
            referralLink={referralData?.referral_link || null}
            refereeBonus={settings?.referral_bonus_referee || 100}
            referrerBonus={settings?.referral_bonus_referrer || 100}
          />
        </div>
      </div>
    </div>
  )
}
