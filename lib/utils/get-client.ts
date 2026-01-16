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
  console.log('[getClient] Starting getClient()...')
  const supabase = await createClient()
  
  // Get Clerk user instead of Supabase auth user
  console.log('[getClient] Calling getClerkUser()...')
  const clerkUser = await getClerkUser()
  console.log('[getClient] getClerkUser() returned:', {
    hasUser: !!clerkUser,
    userId: clerkUser?.id,
    email: clerkUser?.email
  })

  if (!clerkUser) {
    console.log('[getClient] No clerkUser, returning not_authenticated error')
    return { client: null, user: null, portalAccess: [], error: 'not_authenticated' as const }
  }

  // Query portal access using Clerk user ID
  console.log('[getClient] Querying portal access for clerk_user_id:', clerkUser.id)
  const { data: portalRows } = await supabase
    .from('user_portal_access')
    .select('portal_type')
    .eq('clerk_user_id', clerkUser.id)
  console.log('[getClient] Portal access query result:', portalRows)

  let portalAccess = normalizePortalTypes(portalRows)
  const portalAccessExists = portalAccess.length > 0
  const clientAccessEnabled = canAccessClientPortal(portalAccess)
  console.log('[getClient] Portal access check:', { portalAccess, portalAccessExists, clientAccessEnabled })

  if (!clientAccessEnabled) {
    console.log('[getClient] Client portal access not enabled, returning no_client_access error')
    return { client: null, user: clerkUser, portalAccess, error: 'no_client_access' as const }
  }

  const cached = getCachedClient(clerkUser.id)
  if (cached) {
    console.log('[getClient] Found cached client:', cached.client?.id)
    return { client: cached.client, user: clerkUser, portalAccess: cached.portalAccess, error: null }
  }

  // Get client data by clerk_user_id (most common case)
  console.log('[getClient] Querying clients table for clerk_user_id:', clerkUser.id)
  let { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('clerk_user_id', clerkUser.id)
    .single()
  console.log('[getClient] Client query result:', { 
    hasClient: !!client, 
    clientId: client?.id, 
    clientEmail: client?.email,
    error: clientError?.message 
  })

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
      } else if (linkError) {
        console.error('Error linking client to Clerk user in getClient:', linkError)
      }
    }
  }

  // If client still doesn't exist, create one automatically
  if (clientError || !client) {
    console.log('[getClient] Client still doesn\'t exist, attempting to create/link...')
    // If we don't have email yet, try to get it from currentUser() again
    // This handles the case where email wasn't available on first call (timing issue)
    if (!clerkUser.email) {
      console.log('[getClient] No email available, retrying currentUser() to get email...')
      try {
        // Import currentUser dynamically to retry
        const { currentUser } = await import('@clerk/nextjs/server')
        const user = await currentUser()
        if (user?.emailAddresses[0]?.emailAddress) {
          clerkUser.email = user.emailAddresses[0].emailAddress
          console.log('[getClient] Got email from currentUser() retry:', clerkUser.email)
        }
      } catch (error) {
        console.warn('[getClient] Unable to get email from currentUser():', error)
      }
    }

    if (!clerkUser.email) {
      // If we still don't have email, we can't create/link client
      // But if client exists by clerk_user_id, we should still find it
      // So don't return error yet - let the query below handle it
      console.warn('[getClient] No email available for Clerk user:', clerkUser.id)
      console.log('[getClient] Returning setup_failed error (no email)')
      return { client: null, user: clerkUser, portalAccess, error: 'no_email' as const }
    }

    // Final safety check: try to link client by email before inserting
    // Use RPC function to bypass RLS
    console.log('[getClient] Attempting final link by email before creating new client...')
    const { data: linkedClient, error: linkError } = await supabase
      .rpc('link_client_to_clerk_user', { 
        p_clerk_user_id: clerkUser.id,
        p_email: clerkUser.email
      })

    if (linkedClient && linkedClient.length > 0) {
      // Client was found and linked
      client = linkedClient[0]
      clientError = null
      console.log('[getClient] Client linked successfully via RPC:', client.id)
    } else if (linkError) {
      console.error('[getClient] Error linking client via RPC:', linkError)
    } else {
      // No existing client - safe to insert
      console.log('[getClient] No existing client found, creating new client...')
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

      console.log('[getClient] Client insert result:', {
        hasClient: !!newClient,
        clientId: newClient?.id,
        error: createError?.message,
        errorCode: createError?.code
      })

      if (!createError && newClient) {
        client = newClient
        console.log('[getClient] New client created successfully:', client.id)
      } else if (createError?.code === '23505' || createError?.message?.includes('unique constraint') || createError?.message?.includes('duplicate')) {
        // Insert failed due to duplicate - use RPC function to link existing client
        console.log('[getClient] Insert failed due to duplicate, linking existing client...')
        const { data: linkedClient, error: linkError } = await supabase
          .rpc('link_client_to_clerk_user', { 
            p_clerk_user_id: clerkUser.id,
            p_email: clerkUser.email
          })

        if (linkedClient && linkedClient.length > 0) {
          client = linkedClient[0]
          console.log('[getClient] Client linked after duplicate insert:', client.id)
        } else if (linkError) {
          console.error('[getClient] Error linking client after duplicate insert:', linkError)
        }
      }
    }
  }

  if (!client) {
      console.log('[getClient] Still no client after all attempts, returning setup_failed error')
      return { client: null, user: clerkUser, portalAccess, error: 'setup_failed' as const }
  }

  console.log('[getClient] Successfully found/created client:', {
    clientId: client.id,
    email: client.email,
    clerk_user_id: client.clerk_user_id
  })

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

