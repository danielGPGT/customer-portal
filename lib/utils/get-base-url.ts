/**
 * Get the base URL for the application
 * Works in both development and production (Netlify)
 */
export function getBaseUrl(): string {
  // Priority 1: Use explicit site URL from environment
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // Priority 2: In production on Netlify, use Netlify-provided URLs
  if (process.env.NETLIFY) {
    // DEPLOY_PRIME_URL is the production URL, DEPLOY_URL is for previews
    return process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL || ''
  }
  
  // Priority 3: In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // Fallback: empty string (caller should handle this)
  return ''
}
