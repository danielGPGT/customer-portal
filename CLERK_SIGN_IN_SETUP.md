# Clerk Sign-In and Sign-Up Pages Setup

## ✅ Completed Changes

1. ✅ Created `/app/sign-in/[[...sign-in]]/page.tsx` with Clerk's `<SignIn />` component
2. ✅ Created `/app/sign-up/[[...sign-up]]/page.tsx` with Clerk's `<SignUp />` component
3. ✅ Updated `proxy.ts` to make `/sign-in(.*)` and `/sign-up(.*)` routes public
4. ✅ Updated middleware to redirect to `/sign-in` instead of `/login`
5. ✅ Updated `/login` page to redirect to `/sign-in`
6. ✅ Updated `/signup` page to redirect to `/sign-up` (preserves referral codes in URL)

## 🔧 Required Environment Variables

Add these to your `.env.local` file:

```bash
# Clerk Sign-In Configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard

# Clerk Sign-Up Configuration
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Existing Clerk variables (if not already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

### Environment Variable Explanations

- **`NEXT_PUBLIC_CLERK_SIGN_IN_URL`**: Tells Clerk where your `<SignIn />` component is hosted
- **`NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`**: Where to redirect after successful sign-in (if no redirect_url param)
- **`NEXT_PUBLIC_CLERK_SIGN_UP_URL`**: Tells Clerk where your `<SignUp />` component is hosted
- **`NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`**: Where to redirect after successful sign-up (if no redirect_url param)

## 🎯 How It Works

### Sign-In Page (`/sign-in`)

Clerk's `<SignIn />` component provides:
- **Dedicated sign-in flow**: Users sign in on this page
- **Link to sign-up**: Has a "Don't have an account? Sign up" link at the bottom
- **Built-in email verification**: Handles email verification automatically
- **Password reset**: Can include password reset functionality
- **Social login support**: Can be configured in Clerk Dashboard
- **Error handling**: Built-in error messages and validation
- **Accessibility**: WCAG compliant out of the box

### Sign-Up Page (`/sign-up`)

Clerk's `<SignUp />` component provides:
- **Dedicated sign-up flow**: Users create new accounts on this page
- **Link to sign-in**: Has an "Already have an account? Sign in" link at the bottom
- **Built-in email verification**: Handles email verification automatically
- **Password strength indicators**: Shows password requirements
- **Social login support**: Can be configured in Clerk Dashboard
- **Error handling**: Built-in error messages and validation
- **Accessibility**: WCAG compliant out of the box

### Redirect Flow

1. **Unprotected routes** (`/dashboard`, `/trips`, etc.) → Redirect to `/sign-in` if not authenticated
2. **`/login` route** → Redirects to `/sign-in`
3. **`/signup` route** → Redirects to `/sign-up` (preserves `?ref=` query param for referral codes)
4. **After sign-in** → Redirects to `/dashboard` (or original requested URL)
5. **After sign-up** → Redirects to `/dashboard` (or original requested URL)

## ⚠️ Important Notes

### Referral Codes

The `/signup` route redirects to `/sign-up` with the referral code preserved:
- Example: `/signup?ref=ABC123` → `/sign-up?ref=ABC123`

**However**, Clerk's `<SignUp />` component doesn't automatically process referral codes from the URL. You'll need to:

1. **Option A: Use Clerk webhooks (Recommended)** - Listen for `user.created` event and process referral code from metadata
2. **Option B: Handle after signup** - Process referral code after user completes signup in your application using Clerk's `useUser` hook
3. **Option C: Pass via metadata** - Use Clerk's `afterSignUp` hook or webhook metadata to store referral code

### Referral Code Processing via Webhooks

To process referral codes after signup, set up a Clerk webhook:

1. Go to Clerk Dashboard → Webhooks
2. Create a webhook endpoint
3. Listen for `user.created` event
4. Extract referral code from URL query params or metadata
5. Process referral via your Supabase RPC function

**Example webhook handler:**
```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  // Verify webhook and extract user data
  const user = await verifyWebhook(req)
  
  // Get referral code from user metadata or URL
  const referralCode = user.publicMetadata?.referralCode
  
  if (referralCode) {
    // Process referral via Supabase RPC
    await processReferral(user.id, referralCode)
  }
}
```

### Custom Signup Form

The custom signup form in `components/auth/signup-form.tsx` has been updated to use Clerk and can handle referral codes directly. You can use it if you need more control over the referral signup flow.

## 🧪 Testing

1. **Visit `/sign-in`** - Should show Clerk's sign-in component
2. **Visit `/sign-up`** - Should show Clerk's sign-up component
3. **Visit `/login`** - Should redirect to `/sign-in`
4. **Visit `/signup`** - Should redirect to `/sign-up`
5. **Visit `/signup?ref=CODE`** - Should redirect to `/sign-up?ref=CODE`
6. **Visit protected route** (`/dashboard`) while logged out - Should redirect to `/sign-in`
7. **After sign-in** - Should redirect to `/dashboard` (or originally requested page)
8. **After sign-up** - Should redirect to `/dashboard` (or originally requested page)
9. **Click "Sign up" link** in sign-in page - Should navigate to `/sign-up`
10. **Click "Sign in" link** in sign-up page - Should navigate to `/sign-in`

## 📝 Next Steps

1. Add environment variables to `.env.local`
2. Configure Clerk Dashboard settings:
   - Email verification requirements
   - Password requirements
   - Social login providers (optional)
   - After sign-in redirects
3. Test sign-in/sign-up flow
4. Handle referral codes (if needed) via webhooks or custom logic

## 🔗 Resources

- [Clerk Sign-In Component Docs](https://clerk.com/docs/references/nextjs/sign-in)
- [Clerk Environment Variables](https://clerk.com/docs/guides/development/customize-redirect-urls)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks/overview)
