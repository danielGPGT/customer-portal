import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PointsBalanceCard } from '@/components/points/points-balance-card'
import { PointsStatsCards } from '@/components/points/points-stats-cards'
import { ReferAFriendWidget } from '@/components/points/refer-a-friend-widget'
import { ReferFriendBanner } from '@/components/points/refer-friend-banner'
import { StatisticsCard } from '@/components/points/statistics-card'
import { LoyaltyTransactionsTable } from '@/components/points/loyalty-transactions-table'
import { UserPlus, Coins, CreditCard, Plane } from 'lucide-react'

interface PointsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function PointsPage({ searchParams }: PointsPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const currentPage = parseInt(params.page || '1', 10)
  const pageSize = 10
  
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

  // Calculate year-over-year spent change
  const now = new Date()
  const currentYearStart = new Date(now.getFullYear(), 0, 1) // Jan 1 of current year
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1) // Jan 1 of last year
  const lastYearEnd = new Date(now.getFullYear(), 0, 1) // Jan 1 of current year (exclusive)

  // Get spent transactions for current year
  const currentYearSpent = allTransactions?.filter(tx => {
    const txDate = new Date(tx.created_at)
    return tx.transaction_type === 'spend' && 
           txDate >= currentYearStart && 
           txDate < now
  }).reduce((sum, tx) => sum + Math.abs(tx.points || 0), 0) || 0

  // Get spent transactions for last year
  const lastYearSpent = allTransactions?.filter(tx => {
    const txDate = new Date(tx.created_at)
    return tx.transaction_type === 'spend' && 
           txDate >= lastYearStart && 
           txDate < lastYearEnd
  }).reduce((sum, tx) => sum + Math.abs(tx.points || 0), 0) || 0

  // Calculate percentage change for spent
  const spentChangePercent = lastYearSpent > 0
    ? ((currentYearSpent - lastYearSpent) / lastYearSpent) * 100
    : currentYearSpent > 0 ? 100 : 0

  // Get earned transactions for current year
  const currentYearEarned = allTransactions?.filter(tx => {
    const txDate = new Date(tx.created_at)
    return tx.transaction_type === 'earn' && 
           txDate >= currentYearStart && 
           txDate < now
  }).reduce((sum, tx) => sum + (tx.points || 0), 0) || 0

  // Get earned transactions for last year
  const lastYearEarned = allTransactions?.filter(tx => {
    const txDate = new Date(tx.created_at)
    return tx.transaction_type === 'earn' && 
           txDate >= lastYearStart && 
           txDate < lastYearEnd
  }).reduce((sum, tx) => sum + (tx.points || 0), 0) || 0

  // Calculate percentage change for earned
  const earnedChangePercent = lastYearEarned > 0
    ? ((currentYearEarned - lastYearEarned) / lastYearEarned) * 100
    : currentYearEarned > 0 ? 100 : 0

  // Get transactions count for pagination
  const { count: totalTransactionsCount } = await supabase
    .from('loyalty_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', client.id)

  // Get transactions for table with pagination
  const startRange = (currentPage - 1) * pageSize
  const endRange = startRange + pageSize - 1
  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .range(startRange, endRange)

  // Get booking references for transactions
  const transactionsWithBookings = await Promise.all(
    (transactions || []).map(async (tx) => {
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

  // Get all referrals for statistics
  const { data: allReferrals } = await supabase
    .from('referrals')
    .select('status, created_at')
    .eq('referrer_client_id', client.id)

  // Calculate friends referred (completed or signed_up)
  const friendsReferred = allReferrals?.filter(r => 
    r.status === 'completed' || r.status === 'signed_up'
  ).length || 0

  // Calculate friends referred for current year
  const currentYearReferrals = allReferrals?.filter(r => {
    const rDate = new Date(r.created_at)
    return (r.status === 'completed' || r.status === 'signed_up') &&
           rDate >= currentYearStart &&
           rDate < now
  }).length || 0

  // Calculate friends referred for last year
  const lastYearReferrals = allReferrals?.filter(r => {
    const rDate = new Date(r.created_at)
    return (r.status === 'completed' || r.status === 'signed_up') &&
           rDate >= lastYearStart &&
           rDate < lastYearEnd
  }).length || 0

  // Calculate percentage change for referrals
  const friendsReferredChange = lastYearReferrals > 0
    ? ((currentYearReferrals - lastYearReferrals) / lastYearReferrals) * 100
    : currentYearReferrals > 0 ? 100 : 0

  // Calculate points from bookings (purchase transactions)
  const totalPointsFromBookings = pointsBySource.purchase

  // Calculate points from bookings for current year
  const currentYearPointsFromBookings = allTransactions?.filter(tx => {
    const txDate = new Date(tx.created_at)
    return tx.source_type === 'purchase' && 
           tx.transaction_type === 'earn' &&
           txDate >= currentYearStart && 
           txDate < now
  }).reduce((sum, tx) => sum + (tx.points || 0), 0) || 0

  // Calculate points from bookings for last year
  const lastYearPointsFromBookings = allTransactions?.filter(tx => {
    const txDate = new Date(tx.created_at)
    return tx.source_type === 'purchase' && 
           tx.transaction_type === 'earn' &&
           txDate >= lastYearStart && 
           txDate < lastYearEnd
  }).reduce((sum, tx) => sum + (tx.points || 0), 0) || 0

  // Calculate percentage change for points from bookings
  const pointsFromBookingsChange = lastYearPointsFromBookings > 0
    ? ((currentYearPointsFromBookings - lastYearPointsFromBookings) / lastYearPointsFromBookings) * 100
    : currentYearPointsFromBookings > 0 ? 100 : 0

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

  const currency = settings?.currency || 'GBP'
  const pointValue = settings?.point_value || 1

  return (
    <div className="h-full w-full space-y-6">
      <div>
      <h1 className="text-xl font-bold">Points Overview</h1>
      <p className="text-sm text-muted-foreground">View and manage your loyalty point transactions</p>
      </div>
            
      {/* Top Row: Points Balance Card + Refer a Friend Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Points Balance Card */}
        <PointsBalanceCard
          pointsBalance={client.points_balance || 0}
          availablePoints={availablePoints}
          reservedPoints={reservedPoints}
          availableDiscount={availableDiscount}
          nextThreshold={nextThreshold}
          minRedemptionPoints={minRedemption}
          redemptionIncrement={redemptionIncrement}
          currency={currency}
          pointValue={pointValue}
          className="col-span-1 lg:col-span-2"
        />
                <ReferFriendBanner
          referralCode={referralData?.referral_code}
          referralLink={referralData?.referral_link}
          bonusPoints={settings?.referral_bonus_referee || 100}
        />
              {/* Refer a Friend Widget 
              <ReferAFriendWidget
          referralCode={referralData?.referral_code}
          referralLink={referralData?.referral_link}
          refereeBonus={settings?.referral_bonus_referee || 100}
          referrerBonus={settings?.referral_bonus_referrer || 100}
        />*/}


      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticsCard
          icon={<UserPlus className='size-4' />}
          value={friendsReferred.toString()}
          title="Friends Referred"
          changePercentage={friendsReferredChange !== 0 ? `${friendsReferredChange > 0 ? '+' : ''}${friendsReferredChange.toFixed(1)}%` : '0%'}
        />
        <StatisticsCard
          icon={<Coins className='size-4' />}
          value={lastYearEarned.toLocaleString()}
          title="Points Earned Last Year"
          changePercentage={earnedChangePercent !== 0 ? `${earnedChangePercent > 0 ? '+' : ''}${earnedChangePercent.toFixed(1)}%` : '0%'}
        />
        <StatisticsCard
          icon={<CreditCard className='size-4' />}
          value={lastYearSpent.toLocaleString()}
          title="Points Spent Last Year"
          changePercentage={spentChangePercent !== 0 ? `${spentChangePercent > 0 ? '+' : ''}${spentChangePercent.toFixed(1)}%` : '0%'}
        />
        <StatisticsCard
          icon={<Plane className='size-4' />}
          value={totalPointsFromBookings.toLocaleString()}
          title="Total Points from Bookings"
          changePercentage={pointsFromBookingsChange !== 0 ? `${pointsFromBookingsChange > 0 ? '+' : ''}${pointsFromBookingsChange.toFixed(1)}%` : '0%'}
        />
      </div>

      {/* Transactions Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <p className="text-sm text-muted-foreground">View your loyalty point transactions</p>
        </div>
        <LoyaltyTransactionsTable
          transactions={transactionsWithBookings}
          totalCount={totalTransactionsCount || 0}
          page={currentPage}
          pageSize={pageSize}
        />
      </div>

    </div>
  )
}
