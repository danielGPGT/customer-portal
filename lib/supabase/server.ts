import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCookieOptions } from '@/lib/utils/cookies'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
    }
  )
}

