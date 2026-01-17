import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { normalizePortalTypes, canAccessClientPortal, type PortalType } from '@/lib/utils/portal-access'
import { getClerkUser } from '@/lib/clerk/server'

type CachedClient = {
  client: any
  portalAccess: PortalType[]
  expiresAt: number
}

const CLIENT_CACHE_TTL_MS = Number(process.env.CLIENT_CACHE_TTL_MS ?? 60_000)
const clientCache = new Map<string, CachedClient>()

const getCachedClient = (userId: string) => {
  const cached = clientCache.get(userId)
  if (!cached) {
    return null
  }
  if (cached.expiresAt < Date.now()) {
    clientCache.delete(userId)
    return null
  }
  return cached
}

const setCachedClient = (userId: string, client: any, portalAccess: PortalType[]) => {
  clientCache.set(userId, {
    client,
    portalAccess,
    expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
  })
}

/**
 * Cached client fetcher - prevents duplicate queries on the same request
 * Uses React cache() to deduplicate requests within the same render
 * Now uses Clerk for authentication instead of Supabase Auth
 */
export const getClient = cache(async () => {
  const supabase = await createClient()
  
  // Get Clerk user instead of Supabase auth user
  const clerkUser = await getClerkUser()

  if (!clerkUser) {
    return { client: null, user: null, portalAccess: [], error: 'not_authenticated' as const }
  }

  // Query portal access using Clerk user ID
  const { data: portalRows } = await supabase
    .from('user_portal_access')
    .select('portal_type')
    .eq('clerk_user_id', clerkUser.id)

  let portalAccess = normalizePortalTypes(portalRows)
  const portalAccessExists = portalAccess.length > 0
  const clientAccessEnabled = canAccessClientPortal(portalAccess)

  if (!clientAccessEnabled) {
    return { client: null, user: clerkUser, portalAccess, error: 'no_client_access' as const }
  }

  const cached = getCachedClient(clerkUser.id)
  if (cached) {
    return { client: cached.client, user: clerkUser, portalAccess: cached.portalAccess, error: null }
  }

  // Get client data by clerk_user_id (most common case)
  let { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('clerk_user_id', clerkUser.id)
    .single()

  // If client doesn't exist by clerk_user_id, try to link by email using RPC function
  // This bypasses RLS to find and link existing client records
  if (clientError || !client) {
    if (clerkUser.email) {
      // Use RPC function to find and link client by email (bypasses RLS)
      const { data: linkedClient, error: linkError } = await supabase
        .rpc('link_client_to_clerk_user', { 
          p_clerk_user_id: clerkUser.id,
          p_email: clerkUser.email
        })

      if (linkedClient && linkedClient.length > 0) {
        // The RPC returns an array, get the first result
        client = linkedClient[0]
        clientError = null
      }
    }
  }

  // If client still doesn't exist, create one automatically
  if (clientError || !client) {
    // If we don't have email yet, try to get it from currentUser() again
    // This handles the case where email wasn't available on first call (timing issue)
    if (!clerkUser.email) {
      try {
        // Import currentUser dynamically to retry
        const { currentUser } = await import('@clerk/nextjs/server')
        const user = await currentUser()
        if (user?.emailAddresses[0]?.emailAddress) {
          clerkUser.email = user.emailAddresses[0].emailAddress
        }
      } catch (error) {
        // Unable to get email from currentUser()
      }
    }

    if (!clerkUser.email) {
      // If we still don't have email, we can't create/link client
      // But if client exists by clerk_user_id, we should still find it
      // So don't return error yet - let the query below handle it
      return { client: null, user: clerkUser, portalAccess, error: 'no_email' as const }
    }

    // Final safety check: try to link client by email before inserting
    // Use RPC function to bypass RLS
    const { data: linkedClient, error: linkError } = await supabase
      .rpc('link_client_to_clerk_user', { 
        p_clerk_user_id: clerkUser.id,
        p_email: clerkUser.email
      })

    if (linkedClient && linkedClient.length > 0) {
      // Client was found and linked
      client = linkedClient[0]
      clientError = null
    } else if (!linkError) {
      // No existing client - safe to insert
      const firstName = clerkUser.firstName || clerkUser.email.split('@')[0] || 'Customer'
      const lastName = clerkUser.lastName || ''
      const phone = clerkUser.phoneNumber || null

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          clerk_user_id: clerkUser.id,  // Use Clerk user ID
          user_id: null, // Clerk users don't have a Supabase Auth user_id
          team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
          email: clerkUser.email,
          first_name: firstName,
          last_name: lastName || 'User',
          phone: phone,
          status: 'active',
          loyalty_enrolled: true,
          loyalty_enrolled_at: new Date().toISOString(),
          loyalty_signup_source: 'self_signup',
        })
        .select()
        .single()

      if (!createError && newClient) {
        client = newClient
      } else if (createError?.code === '23505' || createError?.message?.includes('unique constraint') || createError?.message?.includes('duplicate')) {
        // Insert failed due to duplicate - use RPC function to link existing client
        const { data: linkedClient } = await supabase
          .rpc('link_client_to_clerk_user', { 
            p_clerk_user_id: clerkUser.id,
            p_email: clerkUser.email
          })

        if (linkedClient && linkedClient.length > 0) {
          client = linkedClient[0]
        }
      }
    }
  }

  if (!client) {
      return { client: null, user: clerkUser, portalAccess, error: 'setup_failed' as const }
  }

  if (!portalAccessExists) {
    const { data: refreshedPortalRows } = await supabase
      .from('user_portal_access')
      .select('portal_type')
      .eq('clerk_user_id', clerkUser.id)

    portalAccess = normalizePortalTypes(refreshedPortalRows)
  }

  setCachedClient(clerkUser.id, client, portalAccess)

  return { client, user: clerkUser, portalAccess, error: null }
})

