# Clerk Custom Email Domain Setup Guide

This guide will help you configure Clerk to send emails (password resets, verification emails, etc.) from your own domain instead of Clerk's default `@accounts.dev` domain.

## 📋 Prerequisites

1. **Production Clerk Instance Required**
   - Custom email domains only work on **Production** instances
   - Development instances always use `@accounts.dev` domains
   - You must have a production domain configured in Clerk Dashboard

2. **Domain Access**
   - Access to your domain's DNS settings
   - Ability to add DNS records (SPF, DKIM, DMARC)

---

## 🚀 Step-by-Step Setup

### Step 1: Verify Your Production Domain in Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Settings** → **Domains**
3. Add your production domain (e.g., `grandprixgrandtours.com`)
4. Verify domain ownership (Clerk will provide verification records)
5. Complete domain verification

### Step 2: Configure Email Settings

1. In Clerk Dashboard, go to **Settings** → **Email & SMS**
2. Navigate to **Email Deliverability** section
3. You'll see options for:
   - **From Email Address**: Set to `noreply@yourdomain.com` or `notifications@yourdomain.com`
   - **From Name**: Set to "Grand Prix Grand Tours" or your preferred name

### Step 3: Set Up DNS Records

Clerk will provide you with specific DNS records. You need to add these to your domain's DNS settings:

#### Required DNS Records:

1. **SPF Record** (Sender Policy Framework)
   - Type: `TXT`
   - Name: `@` (or your domain root)
   - Value: `v=spf1 include:sendgrid.net ~all`
   - Purpose: Authorizes Clerk/SendGrid to send emails on your behalf

2. **DKIM Record** (Domain Keys Identified Mail)
   - Type: `TXT`
   - Name: `s1._domainkey` (or similar - Clerk will provide exact name)
   - Value: Clerk will provide this (looks like: `k=rsa; p=MIGfMA0GCSqGSIb3...`)
   - Purpose: Cryptographically signs emails to prove authenticity

3. **DMARC Record** (Recommended)
   - Type: `TXT`
   - Name: `_dmarc`
   - Value: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
   - Purpose: Helps prevent email spoofing and improves deliverability

#### Where to Add DNS Records:

**If using Cloudflare:**
1. Go to Cloudflare Dashboard → Your Domain → DNS
2. Click "Add record"
3. Select type (TXT)
4. Enter name and value
5. Save

**If using GoDaddy:**
1. Go to GoDaddy → My Products → DNS
2. Scroll to "Records" section
3. Click "Add" → Select "TXT"
4. Enter name and value
5. Save

**If using other providers:**
- Look for "DNS Management" or "DNS Settings"
- Add TXT records as specified above

### Step 4: Wait for DNS Propagation

- DNS changes can take **24-48 hours** to fully propagate
- You can check propagation status using tools like:
  - [MXToolbox](https://mxtoolbox.com/)
  - [DNS Checker](https://dnschecker.org/)

### Step 5: Verify Email Configuration

1. In Clerk Dashboard, go to **Settings** → **Email & SMS**
2. Check the status of your email deliverability setup
3. Clerk will show if DNS records are properly configured
4. Test by sending a password reset email

---

## 🎨 Customizing Email Templates

### Option 1: Customize in Clerk Dashboard

1. Go to **Settings** → **Email & SMS** → **Email Templates**
2. Select the template you want to customize (e.g., "Password Reset")
3. Edit:
   - Subject line
   - Email body
   - Branding colors
   - Logo
   - Footer text

### Option 2: Use Custom SMTP (Advanced)

If you want full control over email sending:

1. In Clerk Dashboard, go to **Settings** → **Email & SMS**
2. Enable **Custom SMTP**
3. Configure your SMTP server details
4. Or use Clerk's `email.created` webhook to send emails yourself

---

## 🔧 Environment Variables

No additional environment variables are needed for custom email domains. The configuration is done entirely in the Clerk Dashboard.

However, make sure you have your production Clerk keys:

```bash
# Production Clerk Keys (not test keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

---

## ✅ Testing Your Setup

### Test Password Reset Email

1. Go to your login page
2. Click "Forgot password?"
3. Enter your email
4. Check your inbox (and spam folder)
5. Verify the email comes from your custom domain (e.g., `noreply@grandprixgrandtours.com`)

### Test Signup Verification Email

1. Sign up for a new account
2. Check your email for verification
3. Verify the "From" address is your custom domain

---

## 🐛 Troubleshooting

### Emails Still Coming from @accounts.dev

**Possible causes:**
- Still using development/test Clerk keys
- DNS records not fully propagated
- Domain not verified in Clerk Dashboard
- Not on production instance

**Solutions:**
1. Verify you're using production Clerk keys (`pk_live_` not `pk_test_`)
2. Check DNS records are correct and propagated
3. Verify domain is marked as "Verified" in Clerk Dashboard
4. Wait 24-48 hours for DNS propagation

### Emails Going to Spam

**Possible causes:**
- Missing or incorrect SPF/DKIM records
- No DMARC record
- Domain reputation issues

**Solutions:**
1. Verify all DNS records are correct
2. Add DMARC record (even with `p=none` initially)
3. Use email deliverability tools to check your domain's reputation
4. Warm up your domain by sending emails gradually

### DNS Records Not Working

**Check:**
1. Record type is `TXT` (not `A` or `CNAME`)
2. Record name is correct (some providers need `@` for root, others need domain name)
3. Record value is exactly as Clerk provided (no extra spaces)
4. TTL is set (usually 3600 seconds is fine)

---

## 📚 Additional Resources

- [Clerk Email Deliverability Docs](https://clerk.com/docs/main-concepts/email-deliverability)
- [Clerk Email Customization](https://clerk.com/docs/customization/email-templates)
- [Clerk Environments Guide](https://clerk.com/docs/deployments/environments)
- [SPF Record Generator](https://www.spf-record.com/)
- [DMARC Record Generator](https://www.dmarcanalyzer.com/)

---

## 🎯 Quick Checklist

- [ ] Production domain added to Clerk Dashboard
- [ ] Domain verified in Clerk Dashboard
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] DMARC record added to DNS (recommended)
- [ ] DNS records propagated (check with DNS checker)
- [ ] Email "From" address configured in Clerk Dashboard
- [ ] Test email sent and verified
- [ ] Using production Clerk keys (`pk_live_`)

---

## 💡 Pro Tips

1. **Start with DMARC `p=none`**: This allows you to monitor without rejecting emails while you set up
2. **Use a subdomain**: Consider using `mail.yourdomain.com` for email to keep main domain clean
3. **Monitor deliverability**: Set up DMARC reporting to track email performance
4. **Test thoroughly**: Send test emails to multiple providers (Gmail, Outlook, etc.)
5. **Keep records updated**: If Clerk updates their infrastructure, you may need to update DNS records

---

## 🆘 Need Help?

If you're stuck:
1. Check Clerk Dashboard → Settings → Email & SMS for status indicators
2. Use Clerk's support chat in the dashboard
3. Check [Clerk Status Page](https://status.clerk.com) for any ongoing issues
4. Review Clerk's troubleshooting docs: [Email Deliverability Troubleshooting](https://clerk.com/docs/troubleshooting/email-deliverability)
