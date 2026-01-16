# Clerk Integration Setup Instructions

## ✅ Completed Steps

1. ✅ Installed `@clerk/nextjs@latest`
2. ✅ Created `proxy.ts` with `clerkMiddleware()`
3. ✅ Updated `app/layout.tsx` with `<ClerkProvider>`
4. ✅ Updated `middleware.ts` to use Clerk
5. ✅ Created Clerk utility functions (`lib/clerk/server.ts` and `lib/clerk/client.ts`)
6. ✅ Updated `getClient` function to use Clerk user ID
7. ✅ Created database migration (`db/migration_add_clerk_user_id.sql`)
8. ✅ Updated login form to use Clerk

## 🔧 Required Setup Steps

### 1. Create Clerk Account and Application

1. Go to [https://clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose "Next.js" as your framework
4. Copy your API keys from the [API Keys page](https://dashboard.clerk.com/last-active?path=api-keys)

### 2. Add Environment Variables

Create or update `.env.local` in your project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY

# Keep your existing Supabase variables for database
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

**⚠️ IMPORTANT:** 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Only use placeholder values in code examples
- Store real keys only in `.env.local`

### 3. Run Database Migration

Run the migration to add Clerk support to your database:

```sql
-- Run this in your Supabase SQL Editor
-- File: db/migration_add_clerk_user_id.sql
```

This migration:
- Adds `clerk_user_id` column to `clients` and `user_portal_access` tables
- Creates `get_clerk_user_id()` function for RLS policies
- Updates all RLS policies to use Clerk user ID
- Creates `link_client_to_clerk_user()` function

### 4. Configure Clerk JWT for Supabase RLS

**Important:** For RLS policies to work with Clerk, you need to configure Clerk to pass the user ID in the JWT token.

**Option A: Use Clerk's JWT Template (Recommended)**

1. Go to Clerk Dashboard → JWT Templates
2. Create a new template for Supabase
3. Add the user ID to the claims:
   ```json
   {
     "sub": "{{user.id}}"
   }
   ```
4. Use this template when making requests to Supabase

**Option B: Pass Clerk User ID via Request Headers**

Alternatively, you can pass the Clerk user ID via request headers and read it in your RLS functions. This requires updating the `get_clerk_user_id()` function.

### 5. Update Signup Form

The signup form still needs to be updated to use Clerk. Currently it uses Supabase Auth.

**Next Steps:**
- Update `components/auth/signup-form.tsx` to use Clerk's `useSignUp` hook
- Update signup flow to create client record after Clerk signup
- Handle referral code logic with Clerk

### 6. Test the Integration

1. **Test Login:**
   - Go to `/login`
   - Sign in with Clerk
   - Verify redirect to dashboard
   - Check that user data loads correctly

2. **Test RLS Policies:**
   - Verify users can only see their own data
   - Test that RLS blocks unauthorized access

3. **Test Protected Routes:**
   - Verify middleware redirects unauthenticated users
   - Test that authenticated users can access protected routes

## 🔄 Migration from Supabase Auth

### For Existing Users

You'll need to migrate existing users from Supabase Auth to Clerk:

1. **Option A: Gradual Migration (Recommended)**
   - Users sign in with Clerk on first login
   - Link existing client records to Clerk user ID
   - Use email matching to link accounts

2. **Option B: One-Time Migration**
   - Export all Supabase auth users
   - Create corresponding Clerk users
   - Link `clerk_user_id` to existing client records

### Migration Script (To Be Created)

A migration script should:
1. Read existing Supabase auth users
2. Create Clerk users (or match by email)
3. Link `clerk_user_id` to `clients` table
4. Update `user_portal_access` table

## 📝 Remaining Tasks

- [ ] Update signup form to use Clerk
- [ ] Update password reset flow
- [ ] Update signout functionality
- [ ] Create user migration script
- [ ] Test all authentication flows
- [ ] Update documentation
- [ ] Remove Supabase Auth code (after migration complete)

## 🐛 Troubleshooting

### RLS Policies Not Working

If RLS policies aren't working with Clerk:

1. Verify `get_clerk_user_id()` function is working
2. Check that Clerk JWT includes user ID in `sub` claim
3. Verify JWT is being passed to Supabase correctly
4. Test RLS policies manually in Supabase SQL Editor

### User Not Found After Login

If user data isn't loading after Clerk login:

1. Check that `clerk_user_id` is set in `clients` table
2. Verify `getClient` function is using Clerk user ID
3. Check browser console for errors
4. Verify Clerk user ID matches database records

### Middleware Issues

If middleware isn't working:

1. Verify `proxy.ts` is in the root directory
2. Check that `clerkMiddleware` is exported correctly
3. Verify route matchers are correct
4. Check Next.js version compatibility

## 📚 Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk with Supabase](https://clerk.com/docs/integrations/databases/supabase)
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)

## ⚠️ Important Notes

1. **Keep Supabase Auth Code Temporarily**
   - Don't remove Supabase Auth code until migration is complete
   - You may need both systems during transition

2. **Test Thoroughly**
   - Test all authentication flows
   - Verify RLS policies work correctly
   - Test with multiple users

3. **Backup Database**
   - Always backup before running migrations
   - Have a rollback plan ready

4. **Environment Variables**
   - Never commit real keys
   - Use different keys for dev/staging/production
   - Rotate keys if exposed
