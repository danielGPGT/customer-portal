import { type CookieOptions } from '@supabase/ssr'

/**
 * Consistent cookie configuration for the application
 * These settings ensure cookies work properly across auth and protected routes
 */
export const cookieConfig: CookieOptions = {
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // Must be false for client-side access (Supabase auth tokens)
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

/**
 * Cookie configuration for authentication tokens
 * These are set by Supabase and need specific settings
 */
export const authCookieConfig: CookieOptions = {
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // Supabase needs client-side access
  maxAge: 60 * 60 * 24 * 365, // 1 year for refresh tokens
}

/**
 * Cookie configuration for session cookies
 */
export const sessionCookieConfig: CookieOptions = {
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true, // Session cookies should be httpOnly
  maxAge: 60 * 60 * 24, // 1 day
}

/**
 * Get cookie options with environment-specific settings
 */
export function getCookieOptions(overrides?: Partial<CookieOptions>): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
    ...overrides,
  }
}


