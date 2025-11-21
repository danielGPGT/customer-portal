# Rate Limiting Implementation

## Overview

Rate limiting has been implemented to protect against:
- Brute force signup attempts
- Spam account creation
- Referral code abuse
- Login brute force attacks

## Current Implementation

### In-Memory Rate Limiter (Development)

The current implementation uses an in-memory `Map` to track rate limits. This is suitable for:
- Development environments
- Single-server deployments
- Low-traffic applications

**Limitations:**
- Does not persist across server restarts
- Does not work in serverless/multi-instance environments
- Memory usage grows over time (though cleanup runs every 5 minutes)

### Rate Limit Presets

| Action | Limit | Window |
|--------|-------|--------|
| Signup | 5 attempts | 1 hour |
| Login | 10 attempts | 15 minutes |
| Referral Invite | 10 invites | 1 hour |
| General API | 100 requests | 1 minute |

## Usage

### In Server Actions

```typescript
import { checkServerRateLimit } from '@/lib/utils/rate-limit-server'

export async function myServerAction() {
  // Check rate limit
  const rateLimitCheck = await checkServerRateLimit('signup')
  if (!rateLimitCheck.success) {
    return { error: rateLimitCheck.error }
  }
  
  // Continue with action...
}
```

### In Client Components

```typescript
import { checkSignupRateLimit } from '@/app/(auth)/signup/actions'

const onSubmit = async (data) => {
  const rateLimitCheck = await checkSignupRateLimit()
  if (!rateLimitCheck.allowed) {
    toast({ error: rateLimitCheck.error })
    return
  }
  
  // Continue with signup...
}
```

## Production Upgrade: Redis-Based Rate Limiting

For production, especially in serverless or multi-instance environments, you should use Redis-based rate limiting.

### Option 1: Upstash Rate Limit (Recommended)

1. **Install dependencies:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

2. **Set up Upstash Redis:**
   - Create account at https://upstash.com
   - Create a Redis database
   - Get REST URL and token

3. **Update `lib/utils/rate-limit.ts`:**

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
})

const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  analytics: true,
})

export async function checkRateLimit(
  identifier: string,
  preset: 'signup' | 'login' | 'referralInvite'
) {
  const limiter = preset === 'signup' ? signupLimiter : loginLimiter
  const result = await limiter.limit(identifier)
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
  }
}
```

4. **Add environment variables:**
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Option 2: Vercel KV

If deploying on Vercel, you can use Vercel KV:

1. **Install:**
```bash
npm install @vercel/kv
```

2. **Update rate limiter to use Vercel KV**

### Option 3: Custom Redis

For self-hosted Redis:

1. **Install:**
```bash
npm install ioredis
```

2. **Update rate limiter to use ioredis**

## Testing Rate Limits

### Manual Testing

1. Try to sign up 6 times quickly (should fail on 6th attempt)
2. Wait 1 hour and try again (should succeed)
3. Check that error messages are user-friendly

### Automated Testing

```typescript
// Example test
describe('Rate Limiting', () => {
  it('should block after 5 signup attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkSignupRateLimit()
      expect(result.allowed).toBe(true)
    }
    
    const result = await checkSignupRateLimit()
    expect(result.allowed).toBe(false)
    expect(result.error).toContain('Rate limit exceeded')
  })
})
```

## Monitoring

### Recommended Metrics

- Rate limit hits per endpoint
- Most common rate-limited IPs
- Rate limit errors in error tracking (Sentry, etc.)

### Alerts

Set up alerts for:
- Unusual spike in rate limit hits (possible attack)
- Specific IPs hitting rate limits repeatedly
- Rate limit errors affecting legitimate users

## Configuration

### Adjusting Limits

Edit `lib/utils/rate-limit.ts`:

```typescript
export const RateLimitPresets = {
  signup: {
    interval: 60 * 60 * 1000, // 1 hour
    limit: 5, // Change this number
  },
  // ...
}
```

### Custom Rate Limits

```typescript
// Use custom options
const result = await checkServerRateLimit({
  interval: 30 * 60 * 1000, // 30 minutes
  limit: 3, // 3 attempts
})
```

## Security Considerations

1. **IP Spoofing:** Rate limiting by IP can be bypassed with proxies/VPNs
   - Consider combining IP + email for signup
   - Use CAPTCHA for suspicious activity

2. **Distributed Attacks:** Multiple IPs can still attack
   - Monitor for patterns
   - Consider global rate limits

3. **Legitimate Users:** Rate limits might affect legitimate users
   - Provide clear error messages
   - Consider higher limits for verified users
   - Allow whitelisting of trusted IPs

## Future Enhancements

- [ ] Add CAPTCHA after rate limit exceeded
- [ ] Implement progressive delays (exponential backoff)
- [ ] Add rate limit headers to responses
- [ ] Create admin dashboard for rate limit monitoring
- [ ] Add per-user rate limits (not just IP-based)
- [ ] Implement sliding window algorithm (currently fixed window)

