import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { normalizePortalTypes, canAccessClientPortal } from '@/lib/utils/portal-access'

type CachedClient = {
  client: any
  portalAccess: string[]
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

const setCachedClient = (userId: string, client: any, portalAccess: string[]) => {
  clientCache.set(userId, {
    client,
    portalAccess,
    expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
  })
}

/**
 * Cached client fetcher - prevents duplicate queries on the same request
 * Uses React cache() to deduplicate requests within the same render
 */
export const getClient = cache(async () => {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { client: null, user: null, portalAccess: [], error: 'not_authenticated' as const }
  }

  const { data: portalRows } = await supabase
    .from('user_portal_access')
    .select('portal_type')
    .eq('user_id', user.id)

  let portalAccess = normalizePortalTypes(portalRows)
  const portalAccessExists = portalAccess.length > 0
  const clientAccessEnabled = canAccessClientPortal(portalAccess)

  if (!clientAccessEnabled) {
    return { client: null, user, portalAccess, error: 'no_client_access' as const }
  }

  const cached = getCachedClient(user.id)
  if (cached) {
    return { client: cached.client, user, portalAccess: cached.portalAccess, error: null }
  }

  // Get client data by auth_user_id (most common case)
  let { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  // If client doesn't exist by user_id, try to link by email using RPC function
  // This bypasses RLS to find and link existing client records
  if (clientError || !client) {
    if (user.email) {
      // Use RPC function to find and link client by email (bypasses RLS)
      const { data: linkedClient, error: linkError } = await supabase
        .rpc('link_client_to_user', { p_user_id: user.id })

      if (linkedClient && linkedClient.length > 0) {
        // The RPC returns an array, get the first result
        client = linkedClient[0]
        clientError = null
      } else if (linkError) {
        console.error('Error linking client to user in getClient:', linkError)
      }
    }
  }

  // If client still doesn't exist, create one automatically
  if (clientError || !client) {
    if (!user.email) {
      return { client: null, user, portalAccess, error: 'no_email' as const }
    }

    // Final safety check: try to link client by email before inserting
    // Use RPC function to bypass RLS
    const { data: linkedClient, error: linkError } = await supabase
      .rpc('link_client_to_user', { p_user_id: user.id })

    if (linkedClient && linkedClient.length > 0) {
      // Client was found and linked
      client = linkedClient[0]
      clientError = null
    } else {
      // No existing client - safe to insert
      // No existing client - safe to insert
      const userMetadata = user.user_metadata || {}
      const firstName = userMetadata.first_name || user.email.split('@')[0] || 'Customer'
      const lastName = userMetadata.last_name || ''
      const phone = userMetadata.phone || null

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,  // Keep user_id for backward compatibility
          auth_user_id: user.id,  // Use auth_user_id for portal access
          team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
          email: user.email,
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
        const { data: linkedClient, error: linkError } = await supabase
          .rpc('link_client_to_user', { p_user_id: user.id })

        if (linkedClient && linkedClient.length > 0) {
          client = linkedClient[0]
        } else if (linkError) {
          console.error('Error linking client after duplicate insert:', linkError)
        }
      }
    }
  }

  if (!client) {
      return { client: null, user, portalAccess, error: 'setup_failed' as const }
  }

  if (!portalAccessExists) {
    const { data: refreshedPortalRows } = await supabase
      .from('user_portal_access')
      .select('portal_type')
      .eq('user_id', user.id)

    portalAccess = normalizePortalTypes(refreshedPortalRows)
  }

  setCachedClient(user.id, client, portalAccess)

  return { client, user, portalAccess, error: null }
})

