# Netlify Deployment Guide

This guide will help you deploy the Customer Loyalty Portal to Netlify.

## Prerequisites

1. A Netlify account
2. Your Supabase project URL and keys
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Install Netlify Next.js Plugin

The `netlify.toml` file is already configured, but you need to install the plugin:

```bash
npm install --save-dev @netlify/plugin-nextjs
```

## Step 2: Configure Environment Variables

In your Netlify dashboard, go to **Site settings** → **Environment variables** and add:

### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-site-name.netlify.app
```

### Optional (for auth cleanup functionality):

```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important:** 
- `NEXT_PUBLIC_SITE_URL` should be your Netlify site URL (e.g., `https://your-app.netlify.app`)
- This URL is used for referral links and email invitations
- Update it if you change your Netlify domain

## Step 3: Update Supabase Auth Settings

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add your Netlify site URL to **Site URL**: `https://your-site-name.netlify.app`
3. Add to **Redirect URLs**:
   - `https://your-site-name.netlify.app/auth/callback`
   - `https://your-site-name.netlify.app/**` (for wildcard)

## Step 4: Deploy

### Option A: Deploy via Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your Git repository
4. Netlify will auto-detect Next.js and use the `netlify.toml` configuration
5. Add environment variables (Step 2)
6. Click **Deploy site**

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

## Step 5: Verify Deployment

After deployment:

1. ✅ Check that the site loads
2. ✅ Test authentication (signup/login)
3. ✅ Verify referral links work (they should use your Netlify URL)
4. ✅ Test protected routes
5. ✅ Check that database connections work

## Important Notes

### Build Settings

The `netlify.toml` file is configured with:
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 20
- **Next.js plugin:** `@netlify/plugin-nextjs`

### Environment Variables

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` should **NEVER** be exposed to the browser (server-side only)
- Update `NEXT_PUBLIC_SITE_URL` if you change your Netlify domain

### Database Migrations

Before deploying, make sure all database migrations are run in Supabase:
- `migration_add_rls_policies.sql`
- `migration_add_performance_indexes.sql`
- `migration_add_points_stats_function.sql`
- `migration_add_referral_counts_function.sql`
- `migration_add_transaction_count_function.sql`
- `migration_add_redemptions_sum_function.sql`
- `migration_add_transactions_pagination_function.sql`
- `migration_add_persistent_referral_codes.sql`
- `fix_get_or_create_referral_code_security_definer.sql`

### Performance

The app is optimized for performance, but on Netlify:
- First load may be slower due to serverless function cold starts
- Consider enabling Netlify's Edge Functions for better performance
- Monitor function execution times in Netlify dashboard

## Troubleshooting

### Build Fails

- Check Node version (should be 20)
- Verify all environment variables are set
- Check build logs in Netlify dashboard

### Authentication Not Working

- Verify Supabase URL and keys are correct
- Check redirect URLs in Supabase dashboard
- Ensure `NEXT_PUBLIC_SITE_URL` matches your Netlify URL

### Referral Links Not Working

- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check that the URL doesn't have a trailing slash
- Test the referral link manually

### Database Errors

- Ensure all migrations are run
- Check RLS policies are enabled
- Verify database functions have `SECURITY DEFINER` where needed

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase auth URLs updated
- [ ] Database migrations run
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test referral links
- [ ] Test protected routes
- [ ] Verify points page loads quickly
- [ ] Check mobile responsiveness
- [ ] Test on different browsers

