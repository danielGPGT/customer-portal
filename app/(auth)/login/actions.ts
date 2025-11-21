'use server'

import { checkServerRateLimit } from '@/lib/utils/rate-limit-server'

/**
 * Check if login is rate limited
 * Returns error message if rate limited, null if allowed
 */
export async function checkLoginRateLimit(): Promise<{ 
  allowed: boolean
  error?: string
  retryAfter?: number
}> {
  const result = await checkServerRateLimit('login')
  
  if (!result.success) {
    return {
      allowed: false,
      error: result.error || 'Too many login attempts. Please try again later.',
      retryAfter: result.retryAfter,
    }
  }
  
  return { allowed: true }
}

