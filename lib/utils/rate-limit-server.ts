'use server'

import { headers } from 'next/headers'
import { checkRateLimit, getClientIP, RateLimitPresets, type RateLimitOptions } from './rate-limit'

/**
 * Server-side rate limit check
 * Use this in server actions and API routes
 */
export async function checkServerRateLimit(
  preset: keyof typeof RateLimitPresets | RateLimitOptions,
  customIdentifier?: string
): Promise<{ success: boolean; error?: string; retryAfter?: number }> {
  try {
    const headersList = await headers()
    
    // Get client IP from headers
    const forwarded = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    const ip = forwarded?.split(',')[0].trim() || realIP || 'unknown'
    
    // Use custom identifier if provided, otherwise use IP
    const identifier = customIdentifier || ip
    
    // Get rate limit options
    const options = typeof preset === 'string' 
      ? RateLimitPresets[preset]
      : preset
    
    // Check rate limit
    const result = checkRateLimit(identifier, options)
    
    if (!result.success) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail closed in production — deny the request if rate limiting is broken
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Service temporarily unavailable. Please try again later.' }
    }
    return { success: true }
  }
}

