'use server'

import { z } from 'zod'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  type: z.enum(['email', 'name']),
})

export type DiagnosticIssue = {
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
}

export type ClerkUserInfo = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  createdAt: number
  lastSignInAt: number | null
  publicMetadata: Record<string, unknown>
  banned: boolean
}

export type DiagnosticResult = {
  clerk: ClerkUserInfo | null
  clerkMultiple: boolean
  client: Record<string, any> | null
  clientByEmail: Record<string, any> | null
  linkageMatch: boolean | null
  portalAccess: Array<{ id: string; clerk_user_id: string; portal_type: string }>
  bookings: {
    total: number
    active: number
    softDeleted: number
    byStatus: Record<string, number>
    recent: Array<Record<string, any>>
  }
  loyalty: {
    pointsBalance: number
    lifetimeEarned: number
    lifetimeSpent: number
    loyaltyEnrolled: boolean
    recentTransactions: Array<Record<string, any>>
    referralCode: string | null
  }
  referrals: {
    total: number
    byStatus: Record<string, number>
    list: Array<Record<string, any>>
  }
  notifications: {
    total: number
    unread: number
  }
  redemptions: {
    total: number
    byStatus: Record<string, number>
  }
  issues: DiagnosticIssue[]
}

async function verifyAdmin(): Promise<{ authorized: boolean; userId: string | null }> {
  const { userId } = await auth()
  if (!userId) return { authorized: false, userId: null }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = (user.publicMetadata as any)?.role

  if (role !== 'admin') return { authorized: false, userId }
  return { authorized: true, userId }
}

export async function runDiagnostics(
  query: string,
  type: 'email' | 'name'
): Promise<{ success: boolean; error?: string; data?: DiagnosticResult }> {
  // Verify admin access
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return { success: false, error: 'Access denied. Admin role required.' }
  }

  // Validate input
  const parsed = searchSchema.safeParse({ query, type })
  if (!parsed.success) {
    return { success: false, error: 'Invalid search query.' }
  }

  const issues: DiagnosticIssue[] = []
  const supabase = createServiceClient()
  const clerk = await clerkClient()

  // Step 1: Search Clerk
  let clerkUsers
  try {
    if (type === 'email') {
      clerkUsers = await clerk.users.getUserList({
        emailAddress: [query.trim().toLowerCase()],
        limit: 10,
      })
    } else {
      clerkUsers = await clerk.users.getUserList({
        query: query.trim(),
        limit: 10,
      })
    }
  } catch {
    return { success: false, error: 'Failed to search Clerk. Please try again.' }
  }

  let clerkUser: ClerkUserInfo | null = null
  let clerkMultiple = false

  if (clerkUsers.data.length === 0) {
    issues.push({
      severity: 'error',
      title: 'No Clerk account found',
      description: `No Clerk user found for ${type === 'email' ? 'email' : 'name'}: "${query}". The customer may not have signed up yet, or signed up with a different ${type}.`,
    })
  } else {
    if (clerkUsers.data.length > 1) {
      clerkMultiple = true
      issues.push({
        severity: 'warning',
        title: 'Multiple Clerk accounts found',
        description: `Found ${clerkUsers.data.length} Clerk users matching "${query}". Showing the first result. The customer may have duplicate accounts.`,
      })
    }

    const u = clerkUsers.data[0]
    clerkUser = {
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress || null,
      firstName: u.firstName,
      lastName: u.lastName,
      imageUrl: u.imageUrl,
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
      publicMetadata: u.publicMetadata as Record<string, unknown>,
      banned: u.banned,
    }

    if (u.banned) {
      issues.push({
        severity: 'error',
        title: 'Clerk account is banned',
        description: 'This user has been banned in Clerk and cannot sign in.',
      })
    }
  }

  // Step 2: Search Supabase clients
  let clientByClerkId: Record<string, any> | null = null
  let clientByEmail: Record<string, any> | null = null

  if (clerkUser) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('clerk_user_id', clerkUser.id)
      .maybeSingle()
    clientByClerkId = data
  }

  // Always search by email (either from Clerk or from query)
  const emailToSearch = clerkUser?.email || (type === 'email' ? query.trim().toLowerCase() : null)
  if (emailToSearch) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .ilike('email', emailToSearch)
      .maybeSingle()
    clientByEmail = data
  }

  // Determine the primary client record and detect issues
  let client = clientByClerkId || clientByEmail
  let linkageMatch: boolean | null = null

  if (clientByClerkId && clientByEmail) {
    if (clientByClerkId.id === clientByEmail.id) {
      linkageMatch = true
    } else {
      linkageMatch = false
      issues.push({
        severity: 'error',
        title: 'Duplicate client records',
        description: `Found different client records for clerk_user_id (client ${clientByClerkId.id}) and email (client ${clientByEmail.id}). This customer has duplicate records that need merging.`,
      })
    }
  } else if (clientByClerkId && !clientByEmail) {
    linkageMatch = true
    if (clerkUser?.email) {
      issues.push({
        severity: 'warning',
        title: 'Email mismatch',
        description: `Client record linked by clerk_user_id has email "${clientByClerkId.email}" but Clerk account has "${clerkUser.email}". Email lookup would fail.`,
      })
    }
  } else if (!clientByClerkId && clientByEmail) {
    linkageMatch = false
    issues.push({
      severity: 'error',
      title: 'clerk_user_id not linked',
      description: `Found client record by email (${clientByEmail.email}) but clerk_user_id is ${clientByEmail.clerk_user_id ? `"${clientByEmail.clerk_user_id}" (doesn't match Clerk ID "${clerkUser?.id}")` : 'NULL'}. RLS will block all data access. The getClient() auto-link may have failed.`,
    })
  } else if (!clientByClerkId && !clientByEmail && clerkUser) {
    issues.push({
      severity: 'error',
      title: 'No client record in database',
      description: 'Clerk account exists but no matching client record in Supabase. The customer will see no data. Auto-creation during login may have failed.',
    })
  }

  if (client) {
    if (client.status !== 'active') {
      issues.push({
        severity: 'warning',
        title: `Client status is "${client.status}"`,
        description: `The client record has status "${client.status}" instead of "active". This may affect their experience.`,
      })
    }

    if (!client.clerk_user_id && clerkUser) {
      issues.push({
        severity: 'error',
        title: 'clerk_user_id is NULL',
        description: 'The client record has no clerk_user_id set. RLS policies require this to return data. All queries will return empty results.',
      })
    }

    if (!client.loyalty_enrolled) {
      issues.push({
        severity: 'info',
        title: 'Not enrolled in loyalty program',
        description: 'The client is not enrolled in the loyalty program. Points features may not work as expected.',
      })
    }
  }

  // Step 3: Portal access
  let portalAccess: Array<{ id: string; clerk_user_id: string; portal_type: string }> = []
  const clerkIdForLookup = clerkUser?.id || client?.clerk_user_id
  if (clerkIdForLookup) {
    const { data } = await supabase
      .from('user_portal_access')
      .select('id, clerk_user_id, portal_type')
      .eq('clerk_user_id', clerkIdForLookup)
    portalAccess = data || []
  }

  if (portalAccess.length === 0) {
    issues.push({
      severity: 'info',
      title: 'No explicit portal access rows',
      description: 'No user_portal_access records found. The app defaults to client portal access when no rows exist, so this is usually fine.',
    })
  } else {
    const types = portalAccess.map(p => p.portal_type)
    if (types.includes('team') && !types.includes('client')) {
      issues.push({
        severity: 'warning',
        title: 'Has team portal but not client portal',
        description: 'This user has team portal access but no client portal access. They will be redirected away from the customer portal.',
      })
    }
  }

  // Step 4: Fetch all related data (only if we have a client)
  const clientId = client?.id

  let bookings = { total: 0, active: 0, softDeleted: 0, byStatus: {} as Record<string, number>, recent: [] as any[] }
  let loyalty = {
    pointsBalance: client?.points_balance || 0,
    lifetimeEarned: client?.lifetime_points_earned || 0,
    lifetimeSpent: client?.lifetime_points_spent || 0,
    loyaltyEnrolled: client?.loyalty_enrolled || false,
    recentTransactions: [] as any[],
    referralCode: client?.referral_code || null,
  }
  let referrals = { total: 0, byStatus: {} as Record<string, number>, list: [] as any[] }
  let notifications = { total: 0, unread: 0 }
  let redemptions = { total: 0, byStatus: {} as Record<string, number> }

  if (clientId) {
    const [
      bookingsResult,
      transactionsResult,
      referralsResult,
      notificationsResult,
      redemptionsResult,
    ] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_reference, status, total_price, currency, created_at, deleted_at, points_earned, points_used, discount_applied, is_first_loyalty_booking, event_id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('loyalty_transactions')
        .select('id, transaction_type, points, balance_after, source_type, description, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('referrals')
        .select('id, referee_email, status, referral_code, created_at, signed_up_at, completed_at, referrer_booking_points')
        .eq('referrer_client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('id, read', { count: 'exact' })
        .eq('client_id', clientId),
      supabase
        .from('redemptions')
        .select('id, status, points_redeemed, discount_amount, currency, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
    ])

    // Process bookings
    const allBookings = bookingsResult.data || []
    const activeBookings = allBookings.filter(b => !b.deleted_at)
    const deletedBookings = allBookings.filter(b => b.deleted_at)

    const byStatus: Record<string, number> = {}
    for (const b of activeBookings) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1
    }

    bookings = {
      total: allBookings.length,
      active: activeBookings.length,
      softDeleted: deletedBookings.length,
      byStatus,
      recent: allBookings.slice(0, 10),
    }

    if (deletedBookings.length > 0) {
      issues.push({
        severity: 'warning',
        title: `${deletedBookings.length} soft-deleted booking(s)`,
        description: `Found ${deletedBookings.length} bookings with deleted_at set: ${deletedBookings.map(b => b.booking_reference).join(', ')}. These won't appear in the portal.`,
      })
    }

    if (activeBookings.length === 0 && allBookings.length > 0) {
      issues.push({
        severity: 'error',
        title: 'All bookings are soft-deleted',
        description: 'Every booking for this customer has been soft-deleted. They will see no trips at all.',
      })
    }

    // Process transactions
    loyalty.recentTransactions = transactionsResult.data || []

    // Process referrals
    const allReferrals = referralsResult.data || []
    const refByStatus: Record<string, number> = {}
    for (const r of allReferrals) {
      refByStatus[r.status] = (refByStatus[r.status] || 0) + 1
    }
    referrals = { total: allReferrals.length, byStatus: refByStatus, list: allReferrals }

    // Process notifications
    const allNotifs = notificationsResult.data || []
    notifications = {
      total: notificationsResult.count || allNotifs.length,
      unread: allNotifs.filter(n => !n.read).length,
    }

    // Process redemptions
    const allRedemptions = redemptionsResult.data || []
    const redByStatus: Record<string, number> = {}
    for (const r of allRedemptions) {
      redByStatus[r.status] = (redByStatus[r.status] || 0) + 1
    }
    redemptions = { total: allRedemptions.length, byStatus: redByStatus }
  }

  // Final summary issue if no problems found
  if (issues.length === 0) {
    issues.push({
      severity: 'info',
      title: 'No issues detected',
      description: 'All checks passed. Clerk account, client linkage, portal access, and data all look correct.',
    })
  }

  return {
    success: true,
    data: {
      clerk: clerkUser,
      clerkMultiple,
      client,
      clientByEmail,
      linkageMatch,
      portalAccess,
      bookings,
      loyalty,
      referrals,
      notifications,
      redemptions,
      issues,
    },
  }
}
