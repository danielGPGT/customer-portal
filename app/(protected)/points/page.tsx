import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { PointsBalanceCard } from '@/components/points/points-balance-card'
import { PointsStatsCards } from '@/components/points/points-stats-cards'
import { ReferAFriendWidget } from '@/components/points/refer-a-friend-widget'
import { ReferFriendBanner } from '@/components/points/refer-friend-banner'
import { StatisticsCard } from '@/components/points/statistics-card'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import dynamicImport from 'next/dynamic'

const LoyaltyTransactionsTable = dynamicImport(
  () => import('@/components/points/loyalty-transactions-table').then(mod => ({ default: mod.LoyaltyTransactionsTable })),
  { 
    loading: () => <div className="h-64 flex items-center justify-center"><div className="text-muted-foreground">Loading transactions...</div></div>
  }
)
import { UserPlus, Coins, CreditCard, Plane } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'
import { getClientPreferredCurrency } from '@/lib/utils/currency'

interface PointsPageProps {
  searchParams: Promise<{ page?: string }>
}

export const metadata: Metadata = {
  title: 'Points Hub | Grand Prix Grand Tours Portal',
  description: 'View your loyalty points balance, transaction history, and referral statistics',
}

// Points overview can be cached briefly
// Dynamic page - no caching to ensure immediate updates when preferences change
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PointsPage({ searchParams }: PointsPageProps) {
  const pageStartTime = performance.now()
  console.log('[Points Page] Starting page load...')
  
  const supabase = await createClient()
  const params = await searchParams
  const currentPage = parseInt(params.page || '1', 10)
  const pageSize = 10
  
  const clientStartTime = performance.now()
  const { client, user } = await getClient()
  console.log(`[Points Page] Client fetch: ${(performance.now() - clientStartTime).toFixed(2)}ms`)

  if (!user || !client) {
    redirect('/login')
  }

  // OPTIMIZED: Parallel fetch initial data (settings, redemptions, referral data)
  const initialDataStartTime = performance.now()
  const [
    { data: settings, error: settingsError },
    { data: pendingRedemptions, error: redemptionsError },
    { data: referralData, error: referralError },
  ] = await Promise.all([
    (async () => {
      const start = performance.now()
      const result = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('id', 1)
        .single()
      console.log(`[Points Page] Settings query: ${(performance.now() - start).toFixed(2)}ms`)
      return result
    })(),
    // OPTIMIZED: Use RPC function for redemptions sum (much faster than SELECT)
    (async () => {
      const start = performance.now()
      const { data: sumData, error: sumError } = await supabase.rpc('get_pending_redemptions_sum', { 
        p_client_id: client.id 
      })
      console.log(`[Points Page] Redemptions sum RPC: ${(performance.now() - start).toFixed(2)}ms`)
      if (sumError) {
        console.warn('[Points Page] Redemptions RPC failed, using fallback:', sumError)
        // Fallback to regular query
        const fallbackResult = await supabase
          .from('redemptions')
          .select('points_redeemed')
          .eq('client_id', client.id)
          .eq('status', 'pending')
        return fallbackResult
      }
      // Convert RPC result (integer) to array format for compatibility
      const reservedPoints = sumData || 0
      return { 
        data: reservedPoints > 0 ? [{ points_redeemed: reservedPoints }] : [],
        error: null 
      }
    })(),
    // OPTIMIZED: Read referral code directly from client record (already fetched, no query needed!)
    (async () => {
      const start = performance.now()
      let referralCode = client.referral_code || null
      
      // Only call RPC if code doesn't exist yet (should be rare after first use)
      if (!referralCode) {
        const { data: referralCodeData } = await supabase.rpc('get_or_create_referral_code', { 
          p_client_id: client.id 
        })
        referralCode = referralCodeData || null
      }
      
      // Get base URL from environment or use localhost in dev
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
      const referralLink = referralCode && baseUrl ? `${baseUrl}/signup?ref=${referralCode}` : null
      console.log(`[Points Page] Referral code lookup: ${(performance.now() - start).toFixed(2)}ms`)
      return { 
        data: referralCode ? { referral_code: referralCode, referral_link: referralLink } : null,
        error: null 
      }
    })(),
  ])
  const initialDataEndTime = performance.now()
  console.log(`[Points Page] Initial data (settings, redemptions, referrals): ${(initialDataEndTime - initialDataStartTime).toFixed(2)}ms`)

  // Calculate reserved points (if RPC was used, it's already a sum; otherwise reduce the array)
  const reservedPoints = typeof pendingRedemptions?.[0]?.points_redeemed === 'number' && pendingRedemptions.length === 1
    ? pendingRedemptions[0].points_redeemed // RPC returned single sum object
    : pendingRedemptions?.reduce((sum, r) => sum + (r.points_redeemed || 0), 0) || 0 // Fallback: sum array
  const availablePoints = (client.points_balance || 0) - reservedPoints

  // Calculate available discount directly (no RPC call needed - it's a simple calculation)
  const redemptionIncrement = settings?.redemption_increment || 100
  const pointValue = settings?.point_value || 1
  const usablePoints = Math.floor(availablePoints / redemptionIncrement) * redemptionIncrement
  const availableDiscount = {
    points_balance: client.points_balance || 0,
    usable_points: usablePoints,
    discount_amount: usablePoints * pointValue
  }

  // OPTIMIZED: Use targeted database queries instead of fetching all transactions
  const now = new Date()
  const currentYearStart = new Date(now.getFullYear(), 0, 1).toISOString()
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1).toISOString()
  const lastYearEnd = new Date(now.getFullYear(), 0, 1).toISOString()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(now.getMonth() - 6)

  // OPTIMIZED: Use database aggregation functions instead of fetching thousands of rows
  const statsQueriesStartTime = performance.now()
  
  // Log individual query start times
  const rpcStartTime = performance.now()
  const [
    { data: statsData, error: statsError },
    { data: referralCountsData, error: referralCountsError },
    transactionCountResult,
    { data: transactions },
    { data: bookingsData },
    { data: recentTransactions },
  ] = await Promise.all([
    // Single RPC call that calculates all stats in one query (MUCH faster - no row fetching!)
    supabase.rpc('get_points_stats', { p_client_id: client.id }).then(result => {
      const rpcEndTime = performance.now()
      console.log(`[Points Page] RPC get_points_stats: ${(rpcEndTime - rpcStartTime).toFixed(2)}ms`)
      if (result.error) {
        console.error('[Points Page] RPC error:', result.error)
      }
      return result
    }),
    // Single RPC call for all referral counts (replaces 3 slow count queries!)
    (async () => {
      const start = performance.now()
      const result = await supabase.rpc('get_referral_counts', { p_client_id: client.id })
      console.log(`[Points Page] RPC get_referral_counts: ${(performance.now() - start).toFixed(2)}ms`)
      if (result.error) {
        console.error('[Points Page] Referral counts RPC error:', result.error)
      }
      return result
    })(),
    // Transactions count for pagination - OPTIMIZED: Use RPC function (bypasses RLS, much faster)
    (async () => {
      const start = performance.now()
      const { data: countData, error: countError } = await supabase.rpc('get_transaction_count', { 
        p_client_id: client.id 
      })
      console.log(`[Points Page] Transaction count RPC: ${(performance.now() - start).toFixed(2)}ms`)
      if (countError) {
        console.warn('[Points Page] Transaction count RPC failed, using fallback:', countError)
        // Fallback to regular count query
        const fallbackResult = await supabase
          .from('loyalty_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', client.id)
        return fallbackResult
      }
      // RPC returns integer directly, wrap it in count format
      return { count: countData ?? 0, error: null }
    })(),
    // Transactions for table (paginated) - OPTIMIZED: Use RPC function (bypasses RLS, much faster)
    (async () => {
      const start = performance.now()
      const { data: transactionsData, error: transactionsError } = await supabase.rpc('get_transactions_paginated', { 
        p_client_id: client.id,
        p_page: currentPage,
        p_page_size: pageSize
      })
      console.log(`[Points Page] Transactions pagination RPC: ${(performance.now() - start).toFixed(2)}ms`)
      if (transactionsError) {
        console.warn('[Points Page] Transactions RPC failed, using fallback:', transactionsError)
        // Fallback to regular query
        const fallbackResult = await supabase
          .from('loyalty_transactions')
          .select('id, transaction_type, points, balance_after, source_type, source_reference_id, description, purchase_amount, purchase_currency, created_at')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
        return fallbackResult
      }
      return { data: transactionsData || [], error: null }
    })(),
    // Booking stats
    (async () => {
      const start = performance.now()
      const result = await supabase
        .from('bookings')
        .select('points_earned')
        .eq('client_id', client.id)
        .in('status', ['confirmed', 'completed'])
        .is('deleted_at', null)
        .not('points_earned', 'is', null)
      console.log(`[Points Page] Bookings stats query: ${(performance.now() - start).toFixed(2)}ms`)
      return result
    })(),
    // Recent transactions for monthly chart (last 6 months)
    (async () => {
      const start = performance.now()
      const result = await supabase
        .from('loyalty_transactions')
        .select('points, transaction_type, created_at')
        .eq('client_id', client.id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: false })
      console.log(`[Points Page] Recent transactions (6 months) query: ${(performance.now() - start).toFixed(2)}ms`)
      return result
    })(),
  ])
  const statsQueriesEndTime = performance.now()
  console.log(`[Points Page] Stats queries (8 parallel, 1 RPC aggregation): ${(statsQueriesEndTime - statsQueriesStartTime).toFixed(2)}ms`)

  // Check if RPC functions exist
  if (statsError) {
    console.error('[Points Page] RPC function get_points_stats failed - make sure migration_add_points_stats_function.sql is run!')
    console.error('[Points Page] Error:', statsError)
  }
  
  // Extract referral counts from RPC result, with fallback if function doesn't exist
  let friendsReferred = 0
  let currentYearReferrals = 0
  let lastYearReferrals = 0
  
  if (referralCountsError) {
    console.warn('[Points Page] RPC function get_referral_counts not found - using fallback queries. Run migration_add_referral_counts_function.sql!')
    // Fallback: Use individual count queries (slower but works)
    const [totalResult, currentYearResult, lastYearResult] = await Promise.all([
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_client_id', client.id)
        .in('status', ['completed', 'signed_up']),
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_client_id', client.id)
        .in('status', ['completed', 'signed_up'])
        .gte('created_at', currentYearStart)
        .lt('created_at', now.toISOString()),
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_client_id', client.id)
        .in('status', ['completed', 'signed_up'])
        .gte('created_at', lastYearStart)
        .lt('created_at', lastYearEnd),
    ])
    friendsReferred = totalResult.count || 0
    currentYearReferrals = currentYearResult.count || 0
    lastYearReferrals = lastYearResult.count || 0
  } else {
    const referralCounts = referralCountsData?.[0] || {
      total_friends_referred: 0,
      current_year_referrals: 0,
      last_year_referrals: 0,
    }
    friendsReferred = referralCounts.total_friends_referred || 0
    currentYearReferrals = referralCounts.current_year_referrals || 0
    lastYearReferrals = referralCounts.last_year_referrals || 0
  }

  // Extract transaction count (handle both RPC result and fallback)
  const totalTransactionsCount = transactionCountResult?.count ?? 0

  // Extract stats from RPC result (single row with all calculations - no JavaScript processing needed!)
  const stats = statsData?.[0] || {
    current_year_spent: 0,
    last_year_spent: 0,
    current_year_earned: 0,
    last_year_earned: 0,
    current_year_purchase_points: 0,
    last_year_purchase_points: 0,
    points_by_purchase: 0,
    points_by_referral: 0,
    points_by_refund: 0,
    points_by_adjustment: 0,
  }

  const currentYearSpent = stats.current_year_spent || 0
  const lastYearSpent = stats.last_year_spent || 0
  const currentYearEarned = stats.current_year_earned || 0
  const lastYearEarned = stats.last_year_earned || 0
  const currentYearPointsFromBookings = stats.current_year_purchase_points || 0
  const lastYearPointsFromBookings = stats.last_year_purchase_points || 0

  // Calculate percentage changes
  const spentChangePercent = lastYearSpent > 0
    ? ((currentYearSpent - lastYearSpent) / lastYearSpent) * 100
    : currentYearSpent > 0 ? 100 : 0

  const earnedChangePercent = lastYearEarned > 0
    ? ((currentYearEarned - lastYearEarned) / lastYearEarned) * 100
    : currentYearEarned > 0 ? 100 : 0

  const pointsFromBookingsChange = lastYearPointsFromBookings > 0
    ? ((currentYearPointsFromBookings - lastYearPointsFromBookings) / lastYearPointsFromBookings) * 100
    : currentYearPointsFromBookings > 0 ? 100 : 0

  // Points breakdown by source (from RPC - already calculated!)
  const pointsBySource = {
    purchase: stats.points_by_purchase || 0,
    referral: stats.points_by_referral || 0,
    refund: stats.points_by_refund || 0,
    adjustment: stats.points_by_adjustment || 0,
  }

  const totalPointsFromBookings = pointsBySource.purchase

  // Get booking references for transactions (BATCH QUERY - fixes N+1 problem)
  const bookingIds = (transactions || [])
    .filter(tx => tx.source_reference_id && (tx.source_type === 'purchase' || tx.source_type === 'redemption'))
    .map(tx => tx.source_reference_id)
    .filter((id, index, self) => self.indexOf(id) === index) // Get unique IDs

  // Batch fetch all bookings in one query (only if needed)
  const bookingMap = new Map<string, { booking_reference: string | null; event_name: string | null }>()
  let bookingsTime = 0
  if (bookingIds.length > 0) {
    const bookingsStartTime = performance.now()
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        events (
          name
        )
      `)
      .in('id', bookingIds)
      .is('deleted_at', null)
    bookingsTime = performance.now() - bookingsStartTime
    console.log(`[Points Page] Bookings query (${bookingIds.length} IDs): ${bookingsTime.toFixed(2)}ms`)

    // Create map for O(1) lookup
    bookings?.forEach(booking => {
      bookingMap.set(booking.id, {
        booking_reference: booking.booking_reference || null,
        event_name: (booking.events as { name?: string } | null)?.name || null,
      })
    })
  }

  // Map transactions with bookings (in-memory, fast)
  const transactionsWithBookings = (transactions || []).map(tx => {
    if (tx.source_reference_id && (tx.source_type === 'purchase' || tx.source_type === 'redemption')) {
      const booking = bookingMap.get(tx.source_reference_id)
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

  // Calculate booking stats
  const totalBookings = bookingsData?.length || 0
  const averagePerBooking = totalBookings > 0
    ? Math.round(pointsBySource.purchase / totalBookings)
    : 0

  // Calculate next redemption threshold
  const minRedemption = settings?.min_redemption_points || 100
  const currentLevel = Math.floor(availablePoints / redemptionIncrement)
  const nextThreshold = currentLevel < 1 
    ? minRedemption 
    : (currentLevel + 1) * redemptionIncrement

  // Get expiring points if expiry is enabled
  let expiringPointsData: { points_expiring: number; days_remaining: number } | null = null
  let expiringTime = 0
  if (settings?.points_expire_after_days) {
    try {
      const expiringStartTime = performance.now()
      const { data: expiringData } = await supabase
        .from('points_expiring_soon')
        .select('points_balance, days_remaining')
        .eq('id', client.id)
        .maybeSingle()
      expiringTime = performance.now() - expiringStartTime
      console.log(`[Points Page] Expiring points query: ${expiringTime.toFixed(2)}ms`)
      
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

  // Calculate percentage change for referrals
  const friendsReferredChange = lastYearReferrals > 0
    ? ((currentYearReferrals - lastYearReferrals) / lastYearReferrals) * 100
    : currentYearReferrals > 0 ? 100 : 0

  const monthlyMap = new Map<string, { earned: number; spent: number }>()
  
  recentTransactions?.forEach(tx => {
    const month = new Date(tx.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { earned: 0, spent: 0 })
    }
    const data = monthlyMap.get(month)!
    if (tx.transaction_type === 'earn') {
      data.earned += tx.points || 0
    } else if (tx.transaction_type === 'spend') {
      data.spent += Math.abs(tx.points || 0)
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

  const baseCurrency = settings?.currency || 'GBP'
  const preferredCurrency = getClientPreferredCurrency(client, baseCurrency)
  const currency = baseCurrency // Keep for backward compatibility

  const totalPageTime = performance.now() - pageStartTime
  const clientFetchTime = initialDataStartTime - clientStartTime
  const initialDataTime = initialDataEndTime - initialDataStartTime
  const statsQueriesTime = statsQueriesEndTime - statsQueriesStartTime
  
  console.log(`[Points Page] ========== PERFORMANCE BREAKDOWN ==========`)
  console.log(`[Points Page] Total page load time: ${totalPageTime.toFixed(2)}ms`)
  console.log(`[Points Page] - Client fetch: ${clientFetchTime.toFixed(2)}ms`)
  console.log(`[Points Page] - Initial data (3 queries parallel): ${initialDataTime.toFixed(2)}ms`)
  console.log(`[Points Page] - Stats queries (14 queries parallel): ${statsQueriesTime.toFixed(2)}ms`)
  if (bookingIds.length > 0) {
    console.log(`[Points Page] - Bookings query (${bookingIds.length} IDs): ${bookingsTime.toFixed(2)}ms`)
  }
  if (settings?.points_expire_after_days) {
    console.log(`[Points Page] - Expiring points query: ${expiringTime.toFixed(2)}ms`)
  }
  console.log(`[Points Page] ==========================================`)

  return (
    <div className="h-full w-full space-y-6">
      <PageHeader
        title="Points Overview"
        description="View and manage your loyalty point transactions"
      />
            
      {/* Top Row: Points Balance Card + Refer a Friend Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
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
          preferredCurrency={preferredCurrency !== baseCurrency ? preferredCurrency : undefined}
          pointValue={pointValue}
          className="col-span-1 lg:col-span-2"
        />
                <ReferFriendBanner
          referralCode={referralData?.referral_code}
          referralLink={referralData?.referral_link}
          bonusPoints={settings?.referral_bonus_referee || 100}
          className="col-span-1 lg:col-span-2"
        />
              {/* Refer a Friend Widget 
              <ReferAFriendWidget
          referralCode={referralData?.referral_code}
          referralLink={referralData?.referral_link}
          refereeBonus={settings?.referral_bonus_referee || 100}
          referrerBonus={settings?.referral_bonus_referrer || 100}
        />*/}


      </div>
      {/* Statistics Cards 
      <div className="space-y-4">
        <div className="md:hidden">
          <Carousel opts={{ align: "start" }} className="px-2">
            <CarouselContent>
              {[
                {
                  icon: <UserPlus className="size-4" />,
                  value: friendsReferred.toString(),
                  title: "Friends Referred",
                  change: friendsReferredChange,
                },
                {
                  icon: <Coins className="size-4" />,
                  value: lastYearEarned.toLocaleString(),
                  title: "Points Earned Last Year",
                  change: earnedChangePercent,
                },
                {
                  icon: <CreditCard className="size-4" />,
                  value: lastYearSpent.toLocaleString(),
                  title: "Points Spent Last Year",
                  change: spentChangePercent,
                },
                {
                  icon: <Plane className="size-4" />,
                  value: totalPointsFromBookings.toLocaleString(),
                  title: "Total Points from Bookings",
                  change: pointsFromBookingsChange,
                },
              ].map((stat) => (
                <CarouselItem key={stat.title} className="basis-[85%] sm:basis-1/2 pb-1">
                  <StatisticsCard
                    icon={stat.icon}
                    value={stat.value}
                    title={stat.title}
                    changePercentage={
                      stat.change !== 0
                        ? `${stat.change > 0 ? "+" : ""}${stat.change.toFixed(1)}%`
                        : "0%"
                    }
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:grid">
          <StatisticsCard
            icon={<UserPlus className="size-4" />}
            value={friendsReferred.toString()}
            title="Friends Referred"
            changePercentage={
              friendsReferredChange !== 0
                ? `${friendsReferredChange > 0 ? "+" : ""}${friendsReferredChange.toFixed(1)}%`
                : "0%"
            }
          />
          <StatisticsCard
            icon={<Coins className="size-4" />}
            value={lastYearEarned.toLocaleString()}
            title="Points Earned Last Year"
            changePercentage={
              earnedChangePercent !== 0
                ? `${earnedChangePercent > 0 ? "+" : ""}${earnedChangePercent.toFixed(1)}%`
                : "0%"
            }
          />
          <StatisticsCard
            icon={<CreditCard className="size-4" />}
            value={lastYearSpent.toLocaleString()}
            title="Points Spent Last Year"
            changePercentage={
              spentChangePercent !== 0
                ? `${spentChangePercent > 0 ? "+" : ""}${spentChangePercent.toFixed(1)}%`
                : "0%"
            }
          />
          <StatisticsCard
            icon={<Plane className="size-4" />}
            value={totalPointsFromBookings.toLocaleString()}
            title="Total Points from Bookings"
            changePercentage={
              pointsFromBookingsChange !== 0
                ? `${pointsFromBookingsChange > 0 ? "+" : ""}${pointsFromBookingsChange.toFixed(1)}%`
                : "0%"
            }
          />
        </div>
      </div>*/}

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
