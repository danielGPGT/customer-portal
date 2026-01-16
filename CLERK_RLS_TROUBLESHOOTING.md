# Clerk RLS Troubleshooting Guide

## 🐛 Issue: Not Seeing Bookings

**Symptoms:**
- Dashboard shows "Start planning your next adventure!"
- No upcoming trips displayed
- Client record exists with bookings

## 🔍 Debug Steps

### Step 1: Check Your Client Record

**Run this in Supabase SQL Editor:**

```sql
-- Replace with your email
SELECT 
  id,
  email,
  clerk_user_id,
  auth_user_id,
  first_name,
  last_name
FROM clients
WHERE email = 'YOUR_EMAIL@example.com';
```

**If `clerk_user_id` is NULL:**
- That's the problem! Your client isn't linked to Clerk
- **Fix:** Get your Clerk User ID from Clerk Dashboard → Users → Copy User ID
- **Then run:**
```sql
UPDATE clients 
SET clerk_user_id = 'YOUR_CLERK_USER_ID'
WHERE email = 'YOUR_EMAIL@example.com';
```

### Step 2: Check RLS Policies Exist

**Run this:**

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;
```

**Should see:**
- `"Users can view their own bookings"` (Supabase Auth - for internal portal)
- `"Users can view their own bookings (Clerk)"` (Clerk - for customer portal)

**If Clerk policy is missing:**
- Run `db/ADD_CLERK_ONLY_RLS_POLICIES.sql`

### Step 3: Test RLS Policy Directly

**Run this (replace with your client_id from Step 1):**

```sql
-- Test if RLS allows your queries
SELECT 
  id,
  booking_reference,
  status,
  client_id
FROM bookings
WHERE client_id = 'YOUR_CLIENT_ID'
  AND deleted_at IS NULL
  AND status IN ('confirmed', 'pending_payment', 'provisional')
ORDER BY created_at DESC
LIMIT 10;
```

**If this returns 0 rows:**
- RLS is blocking the query
- Check if `clerk_user_id` is set on your client record
- Verify the Clerk policy exists

### Step 4: Temporarily Disable RLS (TESTING ONLY)

**To verify RLS is the issue:**

```sql
-- Disable RLS temporarily
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT COUNT(*) FROM bookings WHERE client_id = 'YOUR_CLIENT_ID';

-- If this works, RLS is the problem!

-- Re-enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

### Step 5: Check Browser Console

**Check the browser console for errors:**
- Open DevTools → Console
- Look for `[Dashboard] Error fetching upcoming bookings`
- The error message will tell you what's wrong

## ✅ Quick Fix

**Most likely issue: Client doesn't have `clerk_user_id` set**

1. **Get your Clerk User ID:**
   - Go to Clerk Dashboard → Users
   - Find your user account
   - Copy the User ID (starts with `user_`)

2. **Update your client record:**
```sql
UPDATE clients 
SET clerk_user_id = 'YOUR_CLERK_USER_ID'
WHERE email = 'YOUR_EMAIL@example.com';
```

3. **Verify it worked:**
```sql
SELECT id, email, clerk_user_id FROM clients WHERE email = 'YOUR_EMAIL@example.com';
```

4. **Refresh the dashboard** - Should see bookings now!

## 🔧 Alternative Fix: Re-run RLS Policies

**If policies aren't working:**

1. **Run this SQL:**
```sql
-- Drop and recreate Clerk policies
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;
CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = bookings.client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );
```

2. **Test again:**
```sql
SELECT COUNT(*) FROM bookings WHERE client_id = 'YOUR_CLIENT_ID';
```
