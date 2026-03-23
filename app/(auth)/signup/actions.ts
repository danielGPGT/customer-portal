'use server'

import { checkServerRateLimit } from '@/lib/utils/rate-limit-server'
import { createClient } from '@supabase/supabase-js'

/**
 * Check if signup is rate limited
 * Returns error message if rate limited, null if allowed
 */
const DISABLE_SIGNUP_RATE_LIMIT =
  process.env.NODE_ENV !== 'production' &&
  process.env.DISABLE_SIGNUP_RATE_LIMIT === "true"

export async function checkSignupRateLimit(): Promise<{ 
  allowed: boolean
  error?: string
  retryAfter?: number
}> {
  if (DISABLE_SIGNUP_RATE_LIMIT) {
    return { allowed: true }
  }

  const result = await checkServerRateLimit('signup')
  
  if (!result.success) {
    return {
      allowed: false,
      error: result.error || 'Too many signup attempts. Please try again later.',
      retryAfter: result.retryAfter,
    }
  }
  
  return { allowed: true }
}

/**
 * Delete an auth user (cleanup on signup failure)
 * Only call this if signup fails after auth user is created
 * 
 * Note: This requires SUPABASE_SERVICE_ROLE_KEY environment variable
 * The service role key has admin privileges and can delete users
 */
export async function cleanupAuthUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      // Don't fail — the user can be cleaned up manually later
      return { success: false, error: 'Service role key not configured' }
    }
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    // Delete the user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
