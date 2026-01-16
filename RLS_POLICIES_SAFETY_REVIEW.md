# RLS Policies Safety Review: Clerk Migration

## 🔍 Critical Considerations Before Applying

This document identifies potential issues, edge cases, and things to verify before applying the Clerk RLS policies migration.

---

## ⚠️ CRITICAL ISSUES TO ADDRESS

### **1. get_clerk_user_id() Function Dependency**

**Issue:** All policies depend on `get_clerk_user_id()` working correctly.

**What Could Go Wrong:**
- Function returns NULL if JWT not configured correctly
- Function returns NULL if Clerk JWT not passed to Supabase
- All policies fail → Users can't see their data
- Or worse: All policies fail → Users see all data (if RLS disabled)

**Risk Level:** 🔴 **CRITICAL**

**What To Verify:**
```sql
-- Test the function BEFORE applying policies:
SELECT get_clerk_user_id();
-- Should return Clerk user ID when authenticated
-- If NULL, policies will NOT work correctly
```

**Recommendation:**
- ✅ Test `get_clerk_user_id()` with real Clerk authentication first
- ✅ Verify JWT is passed to Supabase correctly
- ✅ Have rollback plan ready

---

### **2. NULL clerk_user_id Values**

**Issue:** Existing records may have `clerk_user_id = NULL` after migration.

**What Happens:**
```sql
-- Policy check:
USING (clerk_user_id = get_clerk_user_id())
-- If clerk_user_id IS NULL, comparison fails
-- Row is HIDDEN (user can't see it)
```

**Impact:**
- ✅ **Good:** Prevents seeing unlinked records (security)
- ⚠️ **Bad:** Existing users can't see their data until migrated
- ⚠️ **Bad:** Legacy clients without Clerk users are invisible

**Risk Level:** 🟡 **HIGH** - Could break existing functionality

**What To Verify:**
```sql
-- Check how many records have NULL clerk_user_id:
SELECT COUNT(*) FROM clients WHERE clerk_user_id IS NULL;
-- If > 0, you need a migration plan

-- Check how many records have NULL auth_user_id (for comparison):
SELECT COUNT(*) FROM clients WHERE auth_user_id IS NULL;
-- Understand current state before applying
```

**Recommendation:**
- ⚠️ **Option A: Keep Both Policies** (Safer)
  - Keep existing `auth_user_id` policies
  - Add new `clerk_user_id` policies
  - Policies combined with OR → works for both old and new users
  - More permissive but safer migration

- ⚠️ **Option B: Gradual Migration** (Most Careful)
  - Only apply policies to new users first
  - Migrate existing users one by one
  - Then apply policies to all

- ✅ **Option C: Migration Before Policies** (Recommended)
  - Migrate all existing users to Clerk first
  - Set `clerk_user_id` for all records
  - Then apply policies

---

### **3. Existing Policy State**

**Issue:** You currently have policies using `auth.uid()` and `auth_user_id`.

**What To Verify:**
```sql
-- Check current policies:
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('clients', 'loyalty_transactions', 'bookings', 'referrals', 'redemptions', 'notifications', 'user_portal_access')
ORDER BY tablename, policyname;

-- Check which columns they use:
-- If policies use auth_user_id, you may want to keep both
-- If policies use user_id, they need updating anyway
```

**Current State (from migrations):**
- `migration_add_rls_policies.sql` - Uses `user_id` with `auth.uid()`
- `migration_add_auth_user_id.sql` - Updates to `auth_user_id` with `auth.uid()`
- `migration_add_clerk_user_id.sql` - Updates to `clerk_user_id` with `get_clerk_user_id()`

**What This Means:**
- If you've already applied `migration_add_auth_user_id.sql`, you have policies using `auth_user_id`
- The new migration **drops** those policies and creates new ones
- ⚠️ This means existing Supabase Auth users will lose access immediately

**Risk Level:** 🔴 **CRITICAL** - Could break existing users

**Recommendation:**
- ✅ Check which policies are currently active
- ⚠️ Consider keeping both sets of policies during migration
- ⚠️ Or ensure all users are migrated to Clerk before applying

---

### **4. Subquery Performance**

**Issue:** Subquery pattern in policies could be slow.

**Example:**
```sql
USING (
  client_id IN (
    SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
  )
)
```

**Performance Concerns:**
- Subquery executes for each row checked
- Could be slow with many rows
- Index on `clerk_user_id` is critical (already created)

**Risk Level:** 🟡 **MEDIUM** - Could impact performance

**What To Verify:**
```sql
-- Check if index exists:
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'clients' 
AND indexname = 'idx_clients_clerk_user_id';
-- Should exist after migration step 1
```

**Recommendation:**
- ✅ Index is already created in migration (good)
- ⚠️ Monitor query performance after applying
- ⚠️ Consider using a function instead of subquery if slow

---

### **5. Missing Policies**

**Issue:** Some tables might need policies but don't have them.

**What To Verify:**
```sql
-- Check which tables have RLS enabled but no policies:
SELECT t.tablename, t.rowsecurity
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('clients', 'loyalty_transactions', 'bookings', 'referrals', 'redemptions', 'notifications', 'user_portal_access', 'loyalty_settings')
AND t.rowsecurity = true
AND p.policyname IS NULL;

-- Tables with RLS but no policies = locked down (no one can access)
```

**Current Migration Covers:**
- ✅ `clients` - SELECT, INSERT, UPDATE
- ✅ `loyalty_transactions` - SELECT
- ✅ `bookings` - SELECT
- ✅ `referrals` - SELECT (2 policies), INSERT
- ✅ `redemptions` - SELECT
- ✅ `notifications` - SELECT, UPDATE
- ✅ `user_portal_access` - SELECT

**Missing Policies:**
- ❌ `loyalty_settings` - Not included in Clerk migration
  - Old migration had: "All authenticated users can view settings"
  - Should still be readable by authenticated users

**Recommendation:**
- ⚠️ Add policy for `loyalty_settings` if needed:
  ```sql
  -- If loyalty_settings needs to be readable:
  CREATE POLICY "Authenticated users can view loyalty settings"
    ON loyalty_settings FOR SELECT
    USING (get_clerk_user_id() IS NOT NULL);
    -- Any authenticated Clerk user can read
  ```

---

### **6. SECURITY DEFINER Functions**

**Issue:** Functions using `SECURITY DEFINER` bypass RLS.

**What To Verify:**
```sql
-- Check which functions use SECURITY DEFINER:
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND security_type = 'DEFINER';

-- These functions should still work after migration
-- But verify they use the right user ID columns
```

**Functions That Bypass RLS:**
- `update_client_points()` - Creates transactions
- `process_referral_signup()` - Creates clients
- `link_client_to_clerk_user()` - Links clients

**Security Consideration:**
- ✅ These functions bypass RLS (intentional)
- ⚠️ They must validate inputs internally
- ⚠️ They should use correct user ID columns

**Recommendation:**
- ✅ Verify functions work correctly with Clerk
- ⚠️ Review function code to ensure they use `clerk_user_id` where needed
- ⚠️ Test signup flow still works after migration

---

### **7. Application Code Compatibility**

**Issue:** Application code might still reference old columns/policies.

**What To Check:**
- Code that queries `auth_user_id` instead of `clerk_user_id`
- Code that uses `auth.uid()` instead of Clerk user ID
- Code that assumes Supabase Auth

**Files To Review:**
- `lib/utils/get-client.ts` - Already updated ✅
- `components/auth/login-form.tsx` - Already updated ✅
- `components/auth/signup-form.tsx` - Needs updating ⚠️
- Any other files that query client records

**Recommendation:**
- ✅ Verify all queries use `clerk_user_id`
- ⚠️ Test application thoroughly after migration
- ⚠️ Have rollback plan if code breaks

---

## 🔐 SECURITY CONSIDERATIONS

### **1. Policy Drop Order**

**Current Migration:**
```sql
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
CREATE POLICY "Users can view their own client record" ...
```

**Risk:**
- If DROP succeeds but CREATE fails → No policy = locked table
- If CREATE fails midway → Partial policies = inconsistent security

**Recommendation:**
- ✅ Use transactions to wrap policy changes
- ⚠️ Test DROP/CREATE on staging first
- ⚠️ Have rollback SQL ready

---

### **2. RLS Enable/Disable**

**Current Migration:**
```sql
ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;
```

**Risk:**
- Enabling RLS with no policies = table locked (no one can access)
- Enabling RLS with wrong policies = users locked out

**Recommendation:**
- ✅ Enable RLS and create policy in same transaction
- ⚠️ Verify policy exists before enabling RLS
- ⚠️ Test with a test user first

---

### **3. Policy Permissiveness**

**Current Policies:**
- All policies are **PERMISSIVE** (default)
- Multiple policies combined with OR

**Risk:**
- If you have both old and new policies active:
  - `auth_user_id = auth.uid()` OR `clerk_user_id = get_clerk_user_id()`
  - Either can grant access → More permissive than intended

**Recommendation:**
- ✅ Remove old policies before creating new ones (as migration does)
- ⚠️ Or ensure only one set is active at a time

---

## 📋 SAFE APPLICATION STRATEGY

### **Phase 1: Preparation (BEFORE Applying Policies)**

1. **Check Current State:**
   ```sql
   -- Run diagnostic script:
   -- db/check_auth_security_status.sql
   -- Understand what policies exist now
   ```

2. **Test get_clerk_user_id() Function:**
   ```sql
   -- Verify function works with Clerk JWT:
   SELECT get_clerk_user_id();
   -- Should return Clerk user ID when authenticated
   ```

3. **Check Data State:**
   ```sql
   -- How many records need migration:
   SELECT COUNT(*) FROM clients WHERE clerk_user_id IS NULL;
   SELECT COUNT(*) FROM clients WHERE auth_user_id IS NOT NULL;
   ```

4. **Backup Database:**
   - Always backup before applying RLS changes
   - Have rollback SQL ready

---

### **Phase 2: Gradual Application (SAFER Approach)**

**Option A: Add Policies Alongside Existing (Safest)**

```sql
-- Don't drop existing policies, add new ones
-- Keep both auth_user_id AND clerk_user_id policies
-- Works for both old and new users during migration

-- Example for clients:
CREATE POLICY "Users can view their own client record (Clerk)"
  ON clients FOR SELECT
  USING (clerk_user_id = get_clerk_user_id());

-- Keep existing:
-- "Users can view their own client record" using auth_user_id
-- Both policies work → users with either type can access
```

**Pros:**
- ✅ Works during migration period
- ✅ Existing users still work
- ✅ New users work too

**Cons:**
- ⚠️ More permissive (either policy can grant access)
- ⚠️ Need to clean up later

---

**Option B: Test With One Table First**

```sql
-- Apply policies to ONE table first (e.g., user_portal_access)
-- Test thoroughly
-- Then apply to other tables one by one
```

**Pros:**
- ✅ Lower risk
- ✅ Easier to debug issues
- ✅ Can rollback single table

**Cons:**
- ⚠️ More time consuming
- ⚠️ Inconsistent state during migration

---

**Option C: Complete Migration First (Recommended if Possible)**

1. Migrate all users to Clerk
2. Set `clerk_user_id` for all records
3. Then apply policies

**Pros:**
- ✅ Clean migration
- ✅ No mixed state
- ✅ Policies work immediately

**Cons:**
- ⚠️ Requires all users migrated first
- ⚠️ Longer timeline

---

### **Phase 3: Testing (CRITICAL)**

**Test Each Policy:**

1. **Test get_clerk_user_id():**
   ```sql
   -- As Clerk user:
   SELECT get_clerk_user_id();
   -- Should return Clerk user ID
   ```

2. **Test Clients Table:**
   ```sql
   -- As User A with clerk_user_id:
   SELECT * FROM clients;
   -- Should see only their record
   
   -- Try to update their record:
   UPDATE clients SET first_name = 'Test' WHERE id = 'client-a-id';
   -- Should succeed
   
   -- Try to update someone else's record:
   UPDATE clients SET first_name = 'Hack' WHERE id = 'client-b-id';
   -- Should return 0 rows updated
   ```

3. **Test Related Tables:**
   ```sql
   -- As User A:
   SELECT * FROM loyalty_transactions;
   -- Should see only their transactions
   
   SELECT * FROM bookings;
   -- Should see only their bookings
   ```

4. **Test Portal Access:**
   ```sql
   -- As User A:
   SELECT * FROM user_portal_access;
   -- Should see only their portal access
   ```

---

### **Phase 4: Rollback Plan**

**If Something Goes Wrong:**

```sql
-- Rollback: Disable RLS (emergency only!)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- WARNING: This removes security - use only if absolutely necessary

-- Better: Drop new policies and restore old ones
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
-- Then recreate old policy using auth_user_id
```

**Have Rollback SQL Ready:**
- Script to drop all Clerk policies
- Script to restore old policies
- Script to disable RLS if needed

---

## ✅ VERIFICATION CHECKLIST

Before applying policies, verify:

- [ ] `get_clerk_user_id()` function works correctly
- [ ] JWT is passed to Supabase correctly
- [ ] Index on `clerk_user_id` exists
- [ ] Understand current policy state
- [ ] Know how many records have NULL `clerk_user_id`
- [ ] Have migration plan for existing users
- [ ] Have backup of database
- [ ] Have rollback SQL ready
- [ ] Tested on staging first (if possible)
- [ ] Application code uses `clerk_user_id`
- [ ] All functions reviewed for compatibility

---

## 🎯 RECOMMENDED APPROACH

**Most Careful Strategy:**

1. **Don't apply policies yet** - Keep as-is for now
2. **Test get_clerk_user_id()** - Verify it works with Clerk
3. **Migrate users first** - Set `clerk_user_id` for existing users
4. **Test in staging** - Apply policies to staging database first
5. **Test thoroughly** - Verify all functionality works
6. **Then apply to production** - With confidence

**OR:**

1. **Apply policies alongside existing** - Don't drop old policies
2. **Keep both sets active** - Works for both old and new users
3. **Migrate users gradually** - One by one
4. **Remove old policies later** - After all users migrated

---

## 📝 Summary

**Key Risks:**
1. 🔴 `get_clerk_user_id()` must work correctly
2. 🔴 NULL `clerk_user_id` values hide records
3. 🔴 Dropping existing policies breaks old users
4. 🟡 Subquery performance concerns
5. 🟡 Missing policies for some tables

**Recommendations:**
1. ✅ Test everything on staging first
2. ✅ Verify `get_clerk_user_id()` works
3. ✅ Consider keeping both policy sets during migration
4. ✅ Have rollback plan ready
5. ✅ Test thoroughly before production

---

**What would you like to do?**
- Test `get_clerk_user_id()` function first?
- Create a safer migration script that keeps both policies?
- Review the application code for compatibility?
- Something else?
