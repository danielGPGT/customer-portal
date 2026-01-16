# Clerk Email Verification Troubleshooting

## 🔍 Quick Checks

### 1. Check Development Mode Emails

**In Development Mode, Clerk uses `@accounts.dev` emails:**
- Emails are sent from `noreply@accounts.dev`
- Check your **spam/junk folder** - these often get filtered
- Gmail/Outlook may quarantine development emails

### 2. Verify Clerk Dashboard Settings

1. **Go to Clerk Dashboard** → [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. **Navigate to:** User & Authentication → Email, Phone, Username
3. **Check:**
   - ✅ "Email" is enabled
   - ✅ "Email verification" is required (not optional)
   - ✅ Email verification method is set correctly

### 3. Check Email Provider Settings

**Common issues:**
- **Gmail**: Check "Promotions" and "Spam" tabs
- **Outlook/Office365**: Check "Junk Email" folder
- **Company email**: May be blocked by IT/admin filters

**Test with a personal email:**
- Try with a Gmail account to rule out domain-specific issues

### 4. Verify Environment Variables

Make sure your Clerk keys are correct:

```bash
# Check your .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Note:** Development mode uses `pk_test_` and `sk_test_` keys.

## 🛠️ Solutions

### Solution 1: Check Clerk Dashboard Email Settings

1. Go to **Clerk Dashboard** → **Settings** → **Email & SMS**
2. Verify:
   - Email provider is configured
   - "From" address is set correctly
   - Email templates are enabled

### Solution 2: Test Email Delivery

In **Development Mode**, Clerk has limited email delivery:

1. **Check Clerk Dashboard Logs:**
   - Go to **Dashboard** → **Users** → Find your test user
   - Check if email was sent (you'll see email activity)

2. **Use Clerk's Test Email Feature:**
   - Some Clerk dashboards have a "Send test email" option
   - This helps verify email delivery is working

### Solution 3: Temporarily Disable Email Verification (Development Only)

**⚠️ WARNING: Only for development/testing!**

In Clerk Dashboard:
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Set "Email verification" to **Optional** (temporarily)
3. This allows signup without email verification in dev mode

**Remember to re-enable it for production!**

### Solution 4: Use Magic Links Instead

If email codes aren't working, you can use magic links:

1. **Clerk Dashboard** → **User & Authentication** → **Email, Phone, Username**
2. Enable "Email verification link" (magic links)
3. Disable "Verification code" option

Magic links are often more reliable than codes.

### Solution 5: Check Network/Email Deliverability

**For Gmail/Google Workspace:**
- Emails from `@accounts.dev` may be delayed
- Check "All Mail" folder, not just Inbox
- Wait a few minutes and check again

**For Outlook/Office365:**
- Check "Junk Email" folder
- May need to whitelist `@accounts.dev` domain

**For Company Email:**
- IT may be blocking external emails
- Use a personal email for testing

## 📧 Development Mode Email Behavior

**In Development Mode:**
- Emails sent from `noreply@accounts.dev`
- Limited delivery guarantees
- May take longer to arrive
- More likely to go to spam

**In Production Mode:**
- Uses your custom domain
- Requires DNS configuration (SPF, DKIM, DMARC)
- Better deliverability
- Professional sender reputation

## 🔧 Immediate Action Items

1. ✅ Check spam/junk folder
2. ✅ Verify Clerk Dashboard email settings
3. ✅ Try with a Gmail account
4. ✅ Check Clerk Dashboard → Users → Email activity
5. ✅ Wait 2-3 minutes (email delivery can be delayed)
6. ✅ Click "Resend" button on the verification modal

## 🧪 Testing Steps

1. **Try signing up with a different email:**
   - Use a Gmail account
   - Check spam folder immediately

2. **Check Clerk Dashboard:**
   - Go to Users → Find your test user
   - Check if email was actually sent

3. **Check browser console:**
   - Look for any Clerk errors
   - Check network tab for API calls

4. **Use "Resend" option:**
   - On the verification modal, click "Resend"
   - Sometimes the second attempt works better

## 🚨 If Nothing Works

1. **Check Clerk Status:** [status.clerk.com](https://status.clerk.com)
   - Verify there are no ongoing incidents

2. **Contact Clerk Support:**
   - Go to Clerk Dashboard → Help & Support
   - They can check email delivery logs

3. **Temporarily use custom signup form:**
   - Use `components/auth/signup-form.tsx` (already updated for Clerk)
   - It handles the signup flow differently and may work better

## 📝 Next Steps After Verification Works

Once email verification is working:

1. **Re-enable email verification** in Clerk Dashboard (if you disabled it)
2. **Set up production email domain** (when ready for production)
3. **Configure DNS records** (SPF, DKIM, DMARC) for production
4. **Test referral code flow** (if using custom signup)

## 🔗 Resources

- [Clerk Email Troubleshooting](https://clerk.com/docs/troubleshooting/email-deliverability)
- [Clerk Email Configuration](https://clerk.com/docs/authentication/email-address)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Clerk Status Page](https://status.clerk.com)
