# Clerk RLS Debugging Guide

## 🐛 Current Issue

Users can't see their bookings, referrals, notifications after signing in with Clerk. RLS policies using `get_clerk_user_id()` are not working.

## 🔍 Diagnosis Steps

### Step 1: Test `get_clerk_user_id()` Function

Run this in Supabase SQL Editor (as authenticated user):

```sql
-- Check if function exists and returns value
SELECT get_clerk_user_id() as clerk_user_id;
```

**Expected:** Returns your Clerk user ID (e.g., `"user_abc123"`)  
**If NULL:** Function isn't reading the session variable correctly

### Step 2: Test Session Variable

```sql
-- Set the variable manually
SELECT set_clerk_user_id('user_test123');

-- Check if it's set
SELECT get_clerk_user_id() as clerk_user_id_after_set;
SELECT current_setting('app.clerk_user_id', true) as session_var;
```

**Expected:** Both return `"user_test123"`  
**If NULL:** Session variable isn't persisting

### Step 3: Test Direct Query

```sql
-- Check if you can see bookings with direct query
SELECT COUNT(*) 
FROM bookings 
WHERE client_id IN (
  SELECT id FROM clients WHERE clerk_user_id = 'YOUR_CLERK_USER_ID'
);
```

Replace `YOUR_CLERK_USER_ID` with your actual Clerk user ID from Clerk Dashboard.

**Expected:** Returns count of your bookings  
**If 0:** Either:
- Your `clerk_user_id` isn't set in the `clients` table
- The bookings don't have `client_id` matching your client

### Step 4: Check Your Client Record

```sql
-- Check if your client record has clerk_user_id set
SELECT 
  id,
  email,
  clerk_user_id,
  first_name
FROM clients
WHERE email = 'YOUR_EMAIL@example.com';
```

**Expected:** `clerk_user_id` should be set to your Clerk user ID  
**If NULL:** The signup linking didn't work - need to manually update

### Step 5: Test RLS Policy Directly

```sql
-- This simulates what RLS policy sees
SELECT 
  get_clerk_user_id() as policy_sees_user_id,
  c.id as client_id,
  c.clerk_user_id as client_has_clerk_id,
  COUNT(b.id) as booking_count
FROM clients c
LEFT JOIN bookings b ON b.client_id = c.id
WHERE c.clerk_user_id = get_clerk_user_id()
GROUP BY c.id, c.clerk_user_id;
```

**Expected:** Returns your client and booking count  
**If empty:** RLS policy isn't matching - `get_clerk_user_id()` is returning NULL

## 🛠️ Likely Issues & Fixes

### Issue 1: Session Variable Not Persisting

**Problem:** `set_config('app.clerk_user_id', ...)` doesn't persist across queries

**Solution:** Ensure `set_clerk_user_id()` is called BEFORE any queries. The current implementation should work, but you might need to await it properly.

**Fix:**
```typescript
// In lib/supabase/server.ts
if (clerkUserId) {
  // IMPORTANT: Await this before returning client
  const { error } = await supabase.rpc('set_clerk_user_id', { 
    p_user_id: clerkUserId 
  })
  if (error) {
    console.error('RLS setup failed:', error)
  }
}
```

### Issue 2: `get_clerk_user_id()` Returns NULL

**Problem:** Function can't read session variable

**Check:** Run test query above - if it returns NULL, the session variable isn't being set.

**Fix:** Verify `set_clerk_user_id()` function is created correctly in database.

### Issue 3: Client Record Missing `clerk_user_id`

**Problem:** Your client record doesn't have `clerk_user_id` set

**Check:** Run Step 4 query above

**Fix:** Manually update your client record:
```sql
UPDATE clients 
SET clerk_user_id = 'YOUR_CLERK_USER_ID'
WHERE email = 'YOUR_EMAIL@example.com';
```

### Issue 4: RLS Policies Not Created

**Problem:** Clerk RLS policies weren't created

**Check:**
```sql
-- List all policies on bookings table
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bookings';
```

**Expected:** Should see "Users can view their own bookings (Clerk)" policy  
**If missing:** Run the migration SQL again

## ✅ Quick Fix: Manual Update

If you need to quickly test if RLS is the issue:

```sql
-- Temporarily disable RLS on bookings (FOR TESTING ONLY)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Now test if you can see bookings
SELECT * FROM bookings WHERE client_id = 'YOUR_CLIENT_ID';

-- Re-enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** Only for testing! Re-enable RLS immediately.

## 🔧 Alternative Solution: Bypass RLS for Now

If session variables aren't working, we can temporarily:

1. **Option A:** Use SECURITY DEFINER functions that bypass RLS
2. **Option B:** Disable Clerk RLS policies temporarily (keep Supabase Auth policies)
3. **Option C:** Pass client_id in queries (already doing `.eq('client_id', client.id)`)

The queries already filter by `client_id`, so RLS is mainly for extra security. If the app-level filtering works, we can fix RLS later.

## 📋 Next Steps

1. **Run the test queries** above in Supabase SQL Editor
2. **Check what `get_clerk_user_id()` returns**
3. **Verify your `clerk_user_id` is set** in the clients table
4. **Check if session variable persists** between queries

Once we know what's failing, we can fix it properly!
