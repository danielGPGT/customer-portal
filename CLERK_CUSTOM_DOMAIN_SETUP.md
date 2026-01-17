# Clerk Custom Domain Setup - Hide Clerk.accounts.dev URLs

This guide will help you set up a custom domain for Clerk so that OAuth callbacks and other Clerk URLs use your own domain instead of showing `clerk.accounts.dev` in the browser.

## 🎯 Problem

When users sign in with OAuth (Google, etc.), they see URLs like:
```
https://star-walrus-15.clerk.accounts.dev/v1/oauth_callback?...
```

This looks unprofessional and can confuse users.

## ✅ Solution: Custom Clerk Domain

By setting up a custom domain in Clerk, all Clerk URLs will use your domain instead:
```
https://auth.yourdomain.com/v1/oauth_callback?...
```

---

## 🚀 Step-by-Step Setup

### Step 1: Add Custom Domain in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Settings** → **Domains**
3. Click **"Add Domain"** or **"Configure Custom Domain"**
4. Enter your custom domain (e.g., `auth.grandprixgrandtours.com` or `accounts.grandprixgrandtours.com`)
5. Clerk will provide you with DNS records to add

### Step 2: Add DNS Records

Clerk will provide you with specific DNS records. Typically you need:

#### Option A: CNAME Record (Recommended)

- **Type**: `CNAME`
- **Name**: `auth` (or `accounts`, `clerk` - your choice)
- **Value**: Clerk will provide this (e.g., `clerk-dns.clerk.com` or similar)
- **TTL**: `3600` (or default)

**Example:**
- If you want `auth.grandprixgrandtours.com`:
  - Name: `auth`
  - Value: `[provided-by-clerk]`

#### Option B: A Record (Alternative)

If CNAME doesn't work, Clerk may provide A records with IP addresses.

### Step 3: Verify Domain in Clerk Dashboard

1. After adding DNS records, go back to Clerk Dashboard
2. Click **"Verify Domain"** or wait for automatic verification
3. Clerk will check if DNS records are correctly configured
4. This can take a few minutes to 24 hours

### Step 4: Update Environment Variables

Once your custom domain is verified, update your environment variables:

```bash
# Add this to your .env.local or production environment
NEXT_PUBLIC_CLERK_DOMAIN=auth.grandprixgrandtours.com
```

**Note:** This is optional - Clerk should automatically use your custom domain once verified.

### Step 5: Update Clerk Configuration (If Needed)

In your `next.config.ts` or Clerk configuration, you may need to specify the domain:

```typescript
// This is usually handled automatically, but you can verify in Clerk Dashboard
```

---

## 🔧 Configuration in Code

### Update ClerkProvider (Optional)

If you need to explicitly set the domain, you can do so in your root layout:

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      domain={process.env.NEXT_PUBLIC_CLERK_DOMAIN}
      // ... other props
    >
      {children}
    </ClerkProvider>
  )
}
```

However, Clerk usually detects this automatically once the domain is verified.

---

## 📋 DNS Setup Examples

### Cloudflare

1. Go to Cloudflare Dashboard → Your Domain → DNS
2. Click **"Add record"**
3. Select **Type**: `CNAME`
4. **Name**: `auth` (or your chosen subdomain)
5. **Target**: Enter the value provided by Clerk
6. **Proxy status**: Can be "DNS only" (gray cloud) or "Proxied" (orange cloud)
7. Click **"Save"**

### GoDaddy

1. Go to GoDaddy → My Products → DNS
2. Scroll to "Records" section
3. Click **"Add"**
4. Select **Type**: `CNAME`
5. **Name**: `auth`
6. **Value**: Enter the value provided by Clerk
7. **TTL**: `1 Hour` (or default)
8. Click **"Save"**

### Other DNS Providers

- Look for "DNS Management" or "DNS Settings"
- Add a CNAME record with the name and value provided by Clerk

---

## ✅ Testing

### 1. Verify DNS Propagation

Use tools to check if your DNS records are live:
- [MXToolbox](https://mxtoolbox.com/)
- [DNS Checker](https://dnschecker.org/)
- Command line: `nslookup auth.yourdomain.com`

### 2. Test OAuth Flow

1. Go to your sign-in page
2. Click "Sign in with Google" (or other OAuth provider)
3. Complete the OAuth flow
4. **Check the URL** - it should now show your custom domain instead of `clerk.accounts.dev`

### 3. Check Clerk Dashboard

- Go to Clerk Dashboard → Settings → Domains
- Verify your custom domain shows as "Verified" or "Active"

---

## 🐛 Troubleshooting

### Domain Not Verifying

**Possible causes:**
- DNS records not propagated yet (can take 24-48 hours)
- Incorrect DNS record type or value
- DNS provider caching

**Solutions:**
1. Wait 24-48 hours for full propagation
2. Double-check DNS record values match exactly what Clerk provided
3. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
4. Try using a different DNS checker tool

### Still Seeing clerk.accounts.dev

**Possible causes:**
- Domain not fully verified in Clerk
- Using development/test instance (custom domains only work in production)
- Browser cache

**Solutions:**
1. Verify domain status in Clerk Dashboard
2. Ensure you're using production Clerk keys (`pk_live_` not `pk_test_`)
3. Clear browser cache and cookies
4. Try incognito/private browsing mode

### OAuth Not Working After Setup

**Possible causes:**
- OAuth redirect URLs not updated
- Domain mismatch in OAuth provider settings

**Solutions:**
1. In Clerk Dashboard → User & Authentication → Social Connections
2. Verify redirect URLs include your custom domain
3. Update OAuth provider (Google, etc.) settings if needed
4. Check that `NEXT_PUBLIC_SITE_URL` environment variable matches your domain

---

## 💡 Best Practices

### Subdomain Choice

Good subdomain options:
- `auth.yourdomain.com` - Clear and professional
- `accounts.yourdomain.com` - Common pattern
- `login.yourdomain.com` - User-friendly
- `clerk.yourdomain.com` - Explicit but less user-friendly

### SSL/TLS

- Clerk automatically provides SSL certificates for custom domains
- No additional SSL setup needed
- Certificates are managed by Clerk

### Production vs Development

- **Custom domains only work in Production instances**
- Development instances always use `clerk.accounts.dev`
- Make sure you're testing with production keys

---

## 📚 Additional Resources

- [Clerk Custom Domains Documentation](https://clerk.com/docs/deployments/overview#custom-domains)
- [Clerk Domain Configuration](https://clerk.com/docs/deployments/domains)
- [DNS Propagation Checker](https://dnschecker.org/)

---

## 🎯 Quick Checklist

- [ ] Custom domain added in Clerk Dashboard
- [ ] DNS CNAME record added to your domain
- [ ] DNS record verified (can take 24-48 hours)
- [ ] Domain shows as "Verified" in Clerk Dashboard
- [ ] Using production Clerk keys (`pk_live_`)
- [ ] OAuth flow tested and working
- [ ] URLs now show your custom domain instead of `clerk.accounts.dev`

---

## 🆘 Need Help?

1. **Check Clerk Dashboard** → Settings → Domains for status
2. **Verify DNS records** using DNS checker tools
3. **Contact Clerk Support** via dashboard if domain won't verify
4. **Check Clerk Status** at [status.clerk.com](https://status.clerk.com)

---

## ⚠️ Important Notes

- **Custom domains are a production feature** - they don't work in development/test mode
- **DNS propagation can take 24-48 hours** - be patient
- **SSL is automatic** - Clerk handles certificates
- **No code changes required** - once DNS is set up, Clerk automatically uses your domain
