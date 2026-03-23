import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCookieOptions } from '@/lib/utils/cookies'
import { getClerkUserId } from '@/lib/clerk/server'

export async function createClient() {
  const cookieStore = await cookies()

  // Get Clerk user ID for RLS policies
  const clerkUserId = await getClerkUserId()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Merge with consistent cookie options
            const cookieOptions = getCookieOptions(options)
            cookieStore.set({ name, value, ...cookieOptions })
          } catch (error) {
            // Handle error silently - cookies might be set in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Merge with consistent cookie options for removal
            const cookieOptions = getCookieOptions({
              ...options,
              maxAge: 0, // Expire immediately
            })
            cookieStore.set({ name, value: '', ...cookieOptions })
          } catch (error) {
            // Handle error silently
          }
        },
      },
      global: {
        headers: clerkUserId ? {
          'x-clerk-user-id': clerkUserId,
        } : {},
      },
    }
  )

  // Set session variable for RLS policies to read.
  // NOTE: This RPC is a best-effort fallback. The primary mechanism is the
  // x-clerk-user-id HTTP header (set above), which PostgREST exposes as
  // current_setting('request.header.x-clerk-user-id') per-request.
  // The header approach is immune to connection-pooling issues where
  // set_config() on one connection isn't visible to another.
  if (clerkUserId) {
    try {
      const { error } = await supabase.rpc('set_clerk_user_id', {
        p_user_id: clerkUserId
      })

      if (error) {
        // Not fatal — the x-clerk-user-id header is the primary RLS mechanism
      }
    } catch {
      // Function might not exist yet — header fallback still works
    }
  }

  return supabase
}

