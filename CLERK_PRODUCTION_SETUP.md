# Clerk Production Instance Setup Guide

This guide walks you through creating and configuring a production instance for Clerk, including setting up social connections (OAuth) for production use.

## Overview

For **production** instances, Clerk requires:
- Production API keys (`pk_live_` and `sk_live_`)
- Custom OAuth credentials for social providers (not shared dev credentials)
- Production redirect URLs configured
- Domain verification (if using custom domains)

---

## Step 1: Create Production Instance in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Click on your application
3. If you're currently on a development instance, you need to either:
   - **Option A**: Switch your existing instance to production
   - **Option B**: Create a new production instance (recommended for keeping dev separate)

### Creating a New Production Instance:
1. In Clerk Dashboard, create a new application specifically for production
2. Name it something like "Customer Portal Production" or "GPGT Portal Production"
3. Select your framework (Next.js)

---

## Step 2: Get Production API Keys

1. Navigate to **API Keys** in the Clerk Dashboard: [https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys)
2. Copy your **Production** keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `CLERK_SECRET_KEY` (starts with `sk_live_`)

**⚠️ IMPORTANT**: 
- Development keys start with `pk_test_` and `sk_test_`
- Production keys start with `pk_live_` and `sk_live_`
- Never commit production keys to git

---

## Step 3: Configure Production Environment Variables

Update your production environment (`.env.production` or your hosting platform's environment variables):

```bash
# Production Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET

# Production Site URL (required for OAuth)
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com

# Clerk Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Keep your existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 4: Configure Social Providers for Production

For production, you **must** configure each social provider with custom OAuth credentials. You cannot use the shared development credentials.

### 4.1 Configure Google OAuth (Currently Used)

Since your application uses Google OAuth (see `components/auth/social-login-buttons.tsx`), you need to set it up with production credentials.

#### A. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** or **Google Identity Services API**
4. Navigate to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**
6. Choose **Web application**
7. Configure:
   - **Name**: "Customer Portal Production" (or similar)
   - **Authorized JavaScript origins**: 
     - `https://your-production-domain.com`
     - `https://clerk.com` (Clerk's domain)
   - **Authorized redirect URIs**:
     - `https://YOUR_CLERK_DOMAIN.clerk.accounts.dev/v1/oauth_callback` (Clerk will provide this)
     - Check Clerk Dashboard for exact redirect URI
8. Copy your **Client ID** and **Client Secret**

#### B. Configure in Clerk Dashboard

1. Go to Clerk Dashboard > **SSO Connections**: [https://dashboard.clerk.com/~/user-authentication/sso-connections](https://dashboard.clerk.com/~/user-authentication/sso-connections)
2. Click **Add connection** > **For all users**
3. Select **Google**
4. Enable **Use custom credentials**
5. Enter:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Configure redirect URIs:
   - Clerk will show you the redirect URI to add to Google Cloud Console
   - Make sure it matches what you configured in Google Cloud Console
7. **Scopes** (optional): 
   - Basic scopes are included automatically
   - Add additional scopes if needed (e.g., `profile`, `email`, etc.)
8. **Enable for sign-up and sign-in**: Enable this (or disable if you only want post-signup connections)
9. Click **Save**

#### C. Find Clerk Redirect URI

1. In Clerk Dashboard, go to **SSO Connections** > **Google**
2. Look for the **Redirect URI** or **Callback URL**
3. Copy this and add it to your Google Cloud Console **Authorized redirect URIs**

---

## Step 5: Configure Additional Social Providers (Optional)

If you want to add more social providers later (GitHub, Microsoft, Apple, etc.), follow the same pattern:

1. Create OAuth app with the provider
2. Get Client ID and Client Secret
3. Add to Clerk Dashboard with **Use custom credentials** enabled
4. Configure redirect URIs

---

## Step 6: Verify Configuration

### Checklist:

- [ ] Production Clerk keys are set (`pk_live_` and `sk_live_`)
- [ ] `NEXT_PUBLIC_SITE_URL` points to production domain
- [ ] Google OAuth credentials are configured in Clerk Dashboard
- [ ] Google Cloud Console has correct redirect URIs
- [ ] All Clerk route URLs are configured
- [ ] Database RLS policies are configured for Clerk (already done based on your setup)

### Test:

1. Deploy to production with production keys
2. Test sign-up with Google OAuth
3. Test sign-in with Google OAuth
4. Verify user data is created/linked correctly
5. Test regular email/password sign-up (if enabled)

---

## Step 7: Native Applications (If Applicable)

If you have native/mobile apps, configure allowlisted redirect URLs:

1. In Clerk Dashboard, go to **Native applications**: [https://dashboard.clerk.com/~/native-applications](https://dashboard.clerk.com/~/native-applications)
2. Scroll to **Allowlist for mobile OAuth redirect**
3. Add your custom redirect URLs

---

## Step 8: Custom Domain (Optional)

If you want to use a custom domain for Clerk:

1. See `CLERK_CUSTOM_DOMAIN_SETUP.md` for detailed instructions
2. Configure DNS records
3. Verify domain in Clerk Dashboard
4. Update any domain-specific configurations

---

## Common Issues & Solutions

### Issue: "OAuth redirect URI mismatch"
**Solution**: Ensure the redirect URI in Google Cloud Console exactly matches what Clerk shows in the Dashboard.

### Issue: "Invalid client credentials"
**Solution**: 
- Double-check Client ID and Client Secret are correct
- Ensure you're using production credentials, not test credentials
- Verify the credentials are for the correct Google Cloud project

### Issue: "Production keys not working"
**Solution**:
- Ensure you're using `pk_live_` and `sk_live_` keys
- Verify keys are from the production instance
- Check environment variables are set correctly in production

### Issue: "Social login works in dev but not production"
**Solution**:
- Dev uses shared credentials; production needs custom credentials
- Ensure Google OAuth is configured with **Use custom credentials** enabled
- Verify redirect URIs include your production domain

---

## Migration from Development to Production

If you're migrating from a development instance:

1. **Keep both instances** during transition (recommended)
   - Use different environment variables for dev vs prod
   - Test thoroughly before switching

2. **Or migrate the same instance** (less recommended):
   - Switch to production keys in Clerk Dashboard
   - Reconfigure all social providers
   - Update environment variables

3. **User Migration** (if needed):
   - Users will need to sign up again (development users don't transfer)
   - Or use Clerk's user import/migration tools if available

---

## Security Best Practices

1. ✅ Never commit production keys to git
2. ✅ Use environment variables for all sensitive data
3. ✅ Enable MFA for your Clerk Dashboard account
4. ✅ Regularly rotate OAuth credentials
5. ✅ Monitor Clerk Dashboard for suspicious activity
6. ✅ Use separate Clerk instances for dev and prod
7. ✅ Enable email verification in production
8. ✅ Configure proper password requirements

---

## Resources

- [Clerk Social Connections Overview](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/overview)
- [Clerk Google Setup Guide](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)
- [Clerk Dashboard - SSO Connections](https://dashboard.clerk.com/~/user-authentication/sso-connections)
- [Clerk Dashboard - API Keys](https://dashboard.clerk.com/last-active?path=api-keys)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Summary

To create a production instance:

1. ✅ Create production Clerk application
2. ✅ Get production API keys (`pk_live_` / `sk_live_`)
3. ✅ Set production environment variables
4. ✅ Configure Google OAuth with custom credentials
5. ✅ Set up redirect URIs correctly
6. ✅ Test all authentication flows
7. ✅ Deploy with production keys

The main difference from development: **Production requires custom OAuth credentials** for each social provider, while development uses Clerk's shared credentials.
