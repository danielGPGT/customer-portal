'use server'

import { checkServerRateLimit } from '@/lib/utils/rate-limit-server'
import { createClient } from '@supabase/supabase-js'

/**
 * Check if signup is rate limited
 * Returns error message if rate limited, null if allowed
 */
export async function checkSignupRateLimit(): Promise<{ 
  allowed: boolean
  error?: string
  retryAfter?: number
}> {
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
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured - cannot cleanup auth user')
      // Don't fail - just log the error. The user can be cleaned up manually later
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
      console.error('Failed to cleanup auth user:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Successfully cleaned up auth user:', userId)
    return { success: true }
  } catch (error: any) {
    console.error('Error cleaning up auth user:', error)
    return { success: false, error: error.message }
  }
}
