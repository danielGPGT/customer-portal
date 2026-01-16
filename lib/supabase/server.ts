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

  // Set session variable for RLS policies to read
  // This allows get_clerk_user_id() to work even without JWT
  // IMPORTANT: This must complete before any queries are made
  if (clerkUserId) {
    try {
      // Call set_clerk_user_id function to set session variable
      // This will persist for all queries in this request
      const { error } = await supabase.rpc('set_clerk_user_id', { 
        p_user_id: clerkUserId 
      })
      
      if (error) {
        console.error('Error setting Clerk user ID for RLS:', error)
        // Don't throw - queries will still work but RLS might block
      }
    } catch (error) {
      // Function might not exist yet - that's okay, will be created by migration
      console.warn('set_clerk_user_id function not available yet:', error)
    }
  }

  return supabase
}

