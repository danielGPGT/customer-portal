/**
 * Rate Limiting Utility
 * 
 * In-memory rate limiter for development. For production, consider using:
 * - @upstash/ratelimit (with Redis)
 * - Vercel KV
 * - Custom Redis solution
 */

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  limit: number // Maximum requests per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Timestamp when limit resets
  retryAfter?: number // Seconds to wait before retrying
}

// In-memory store (for development)
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000) // 5 minutes
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param options - Rate limit options
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const key = `${identifier}:${options.interval}`
  
  const record = rateLimitStore.get(key)
  
  // If no record or expired, create new one
  if (!record || record.resetAt < now) {
    const resetAt = now + options.interval
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    })
    
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: resetAt,
    }
  }
  
  // If limit exceeded
  if (record.count >= options.limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: record.resetAt,
      retryAfter,
    }
  }
  
  // Increment count
  record.count++
  rateLimitStore.set(key, record)
  
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    reset: record.resetAt,
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try various headers (for different hosting providers)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback to a default identifier if no IP found
  return 'unknown'
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Signup: 5 attempts per hour
  signup: {
    interval: 60 * 60 * 1000, // 1 hour
    limit: 5,
  },
  // Login: 10 attempts per 15 minutes
  login: {
    interval: 15 * 60 * 1000, // 15 minutes
    limit: 10,
  },
  // Referral invite: 10 invites per hour
  referralInvite: {
    interval: 60 * 60 * 1000, // 1 hour
    limit: 10,
  },
  // General API: 100 requests per minute
  api: {
    interval: 60 * 1000, // 1 minute
    limit: 100,
  },
} as const

