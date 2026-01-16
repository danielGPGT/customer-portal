# Authentication Security Review: Shared Supabase Instance

## Executive Summary

This application shares the same Supabase authentication instance with another portal. While there are some security measures in place, there are **critical security concerns** that need to be addressed to ensure proper isolation between portals and prevent unauthorized data access.

---

## 🔴 Critical Security Issues

### 1. **No RLS Policies on `user_portal_access` Table** ⚠️ **CRITICAL**

**Issue:** The `user_portal_access` table has no Row Level Security (RLS) policies enabled. This means:
- Any authenticated user can query all portal access records
- Users from the other portal could see which users have access to this portal
- No database-level enforcement of portal isolation

**Current State:**
```typescript
// In lib/utils/get-client.ts
const { data: portalRows } = await supabase
  .from('user_portal_access')
  .select('portal_type')
  .eq('user_id', user.id)
```

**Risk Level:** 🔴 **CRITICAL** - Portal access information is exposed

**Recommendation:**
```sql
-- Enable RLS on user_portal_access
ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;

-- Users can only view their own portal access records
CREATE POLICY "Users can view their own portal access"
  ON user_portal_access FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 2. **RLS Policy Inconsistency** ⚠️ **HIGH**

**Issue:** There are conflicting RLS policies in the migration files:
- `migration_add_rls_policies.sql` uses `user_id`
- `migration_add_auth_user_id.sql` updates policies to use `auth_user_id`

**Current State:**
- The code uses `auth_user_id` for client lookups (line 71 in `get-client.ts`)
- But the original RLS policies reference `user_id`
- It's unclear which policies are actually active in the database

**Risk Level:** 🟡 **HIGH** - RLS may not be working correctly

**Recommendation:**
1. Verify which RLS policies are actually active in the database
2. Ensure all policies use `auth_user_id` consistently
3. Remove or update any policies still using `user_id`

**Check Current Policies:**
```sql
-- Run this in Supabase SQL Editor to see active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('clients', 'loyalty_transactions', 'bookings', 'referrals', 'redemptions', 'notifications', 'user_portal_access')
ORDER BY tablename, policyname;
```

---

### 3. **Application-Level Portal Access Control Only** ⚠️ **HIGH**

**Issue:** Portal access is enforced only in application code, not at the database level.

**Current Implementation:**
```typescript
// In app/(protected)/layout.tsx
const clientPortalEnabled = canAccessClientPortal(portalAccess)

if (!clientPortalEnabled) {
  redirect('/dashboard?error=client_access_required')
}
```

**Problems:**
- If a user from the other portal somehow bypasses the application check, they could query data directly
- RLS policies don't check portal access - they only check `auth_user_id`
- A user authenticated in the other portal could potentially access this portal's data if they know the client IDs

**Risk Level:** 🟡 **HIGH** - Database doesn't enforce portal isolation

**Recommendation:**
1. Add portal access checks to RLS policies
2. Create a database function that checks portal access
3. Use this function in RLS policies

**Example:**
```sql
-- Create function to check portal access
CREATE OR REPLACE FUNCTION has_portal_access(p_portal_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_portal_access 
    WHERE user_id = auth.uid() 
    AND portal_type = p_portal_type
  );
END;
$$;

-- Update RLS policies to check portal access
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (
    auth.uid() = auth_user_id 
    AND has_portal_access('client')
  );
```

---

### 4. **Shared Supabase Instance Configuration** ⚠️ **MEDIUM**

**Issue:** Both portals use the same Supabase instance:
- Same `NEXT_PUBLIC_SUPABASE_URL`
- Same `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Same `auth.users` table

**Current State:**
```typescript
// lib/supabase/server.ts and client.ts
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

**Security Implications:**
- If the anon key is compromised, both portals are affected
- No network-level isolation between portals
- Shared rate limits and quotas
- If one portal has a security issue, it could affect the other

**Risk Level:** 🟠 **MEDIUM** - Shared infrastructure risk

**Recommendations:**

**Option A: Separate Supabase Projects (Recommended)**
- Create separate Supabase projects for each portal
- Complete isolation at the infrastructure level
- Independent scaling and security
- **Pros:** Maximum security, complete isolation
- **Cons:** More complex to manage, separate databases

**Option B: Enhanced RLS with Portal Isolation (If separation not possible)**
- Add portal-specific checks to all RLS policies
- Use `user_portal_access` in all data access policies
- Create portal-specific database schemas or prefixes
- **Pros:** Works with shared instance
- **Cons:** More complex RLS policies, still shared infrastructure

---

### 5. **Missing RLS on Related Tables** ⚠️ **MEDIUM**

**Issue:** Some tables may not have RLS enabled or may have incomplete policies.

**Tables to Verify:**
- `user_portal_access` - **No RLS found** ⚠️
- `bookings_cache` - Check if RLS is enabled
- Any other tables that store user-specific data

**Recommendation:**
```sql
-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Enable RLS on all user-specific tables
ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;
-- Add appropriate policies for each table
```

---

## 🟡 Medium Priority Issues

### 6. **Portal Access Default Behavior**

**Issue:** In `lib/utils/portal-access.ts`, the `canAccessClientPortal` function defaults to allowing access if no portal access records exist:

```typescript
export function canAccessClientPortal(portals: PortalType[]) {
  return hasClientPortal(portals) || portals.length === 0
}
```

**Problem:** If `user_portal_access` is empty, access is granted by default. This could be a security issue if:
- A user is created without portal access records
- Portal access records are accidentally deleted
- There's a bug in the portal access creation logic

**Recommendation:**
- Change default behavior to deny access if no records exist
- Explicitly create portal access records during signup
- Add validation to ensure portal access exists before granting access

---

### 7. **SECURITY DEFINER Functions Bypass RLS**

**Issue:** Several functions use `SECURITY DEFINER` to bypass RLS, which is necessary but needs careful review.

**Functions:**
- `link_client_to_user()`
- `process_referral_signup()`
- `update_client_points()`
- And others...

**Current State:** These functions bypass RLS, which is intentional but means:
- They must be carefully validated
- Input validation is critical
- They should only be called from trusted server-side code

**Recommendation:**
- Review all SECURITY DEFINER functions for proper input validation
- Ensure they can't be called with arbitrary user IDs
- Add logging/auditing for these functions
- Consider adding additional checks within the functions

---

## ✅ Security Strengths

1. **RLS Enabled on Most Tables** ✅
   - `clients`, `loyalty_transactions`, `bookings`, `referrals`, `redemptions`, `notifications` all have RLS

2. **Application-Level Portal Checks** ✅
   - Portal access is checked in the protected layout
   - Users without client portal access are redirected

3. **Auth User ID Separation** ✅
   - `auth_user_id` column separates portal auth from other user IDs
   - Migration exists to update RLS policies to use `auth_user_id`

4. **Server-Side Data Fetching** ✅
   - Most data fetching happens server-side
   - Client-side Supabase calls are limited

---

## 📋 Action Items (Priority Order)

### Immediate (Critical - Fix Before Production)

1. ✅ **Add RLS to `user_portal_access` table**
   ```sql
   ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view their own portal access"
     ON user_portal_access FOR SELECT
     USING (auth.uid() = user_id);
   ```

2. ✅ **Verify and fix RLS policy consistency**
   - Check which policies are active
   - Ensure all use `auth_user_id` (not `user_id`)
   - Test that RLS is actually working

3. ✅ **Add portal access checks to RLS policies**
   - Create `has_portal_access()` function
   - Update all RLS policies to check portal access
   - Test with users from both portals

### High Priority (Fix Soon)

4. ✅ **Review all SECURITY DEFINER functions**
   - Ensure proper input validation
   - Add logging/auditing
   - Document why each function needs SECURITY DEFINER

5. ✅ **Change default portal access behavior**
   - Deny access by default if no portal access records exist
   - Ensure portal access is always created during signup

6. ✅ **Audit all tables for RLS**
   - List all tables
   - Verify RLS is enabled on user-specific tables
   - Add missing policies

### Medium Priority (Consider for Future)

7. ⚠️ **Consider separate Supabase projects**
   - Evaluate cost/benefit of separation
   - Plan migration if needed
   - Document decision

8. ⚠️ **Add security monitoring**
   - Log failed portal access attempts
   - Monitor for suspicious queries
   - Set up alerts for RLS policy violations

---

## 🔍 Testing Recommendations

### Test Portal Isolation

1. **Create test users in both portals**
2. **Verify users from Portal A cannot access Portal B data:**
   ```sql
   -- As Portal A user, try to query Portal B data
   -- Should return empty or error
   SELECT * FROM clients WHERE auth_user_id = 'portal-b-user-id';
   ```

3. **Test RLS policies:**
   ```sql
   -- Run test_rls_policies.sql
   -- Verify users can only see their own data
   ```

4. **Test portal access enforcement:**
   - User with only 'team' portal access should not access client portal
   - User with no portal access should be denied
   - User with 'client' portal access should access client portal

### Test SECURITY DEFINER Functions

1. **Verify functions validate inputs:**
   - Try calling with invalid user IDs
   - Try calling with other users' IDs
   - Should fail or return empty

2. **Test function permissions:**
   - Regular users should not be able to bypass RLS via functions
   - Functions should only work for authenticated users

---

## 📝 Migration Checklist

Before applying fixes, verify:

- [ ] Current RLS policies in database (run `pg_policies` query)
- [ ] Which tables have RLS enabled
- [ ] Current `user_portal_access` table structure
- [ ] Test users from both portals exist
- [ ] Backup database before making changes

After applying fixes:

- [ ] Test portal isolation works
- [ ] Test RLS policies block unauthorized access
- [ ] Test legitimate access still works
- [ ] Test signup flow creates portal access records
- [ ] Monitor for errors in production

---

## 🎯 Recommended Architecture Changes

### Short Term (If keeping shared instance):

1. **Add RLS to `user_portal_access`**
2. **Update all RLS policies to check portal access**
3. **Create portal access during signup**
4. **Add portal access validation to all queries**

### Long Term (Recommended):

1. **Separate Supabase projects** for each portal
   - Complete infrastructure isolation
   - Independent scaling
   - Better security posture
   - Easier compliance (if needed)

2. **Implement portal-specific database schemas**
   - Even with shared instance, use schema separation
   - `client_portal.clients` vs `team_portal.clients`
   - RLS policies per schema

---

## 📚 References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Multi-Tenancy Guide](https://supabase.com/docs/guides/auth/row-level-security#multi-tenant-applications)
- Migration files:
  - `db/migration_add_rls_policies.sql`
  - `db/migration_add_auth_user_id.sql`
  - `db/RLS_POLICIES_README.md`

---

## ⚠️ Important Notes

1. **Test thoroughly** before deploying to production
2. **Backup database** before applying RLS changes
3. **Monitor logs** after deployment for RLS-related errors
4. **Have rollback plan** ready
5. **Document all changes** for future reference

---

**Last Updated:** [Current Date]  
**Review Status:** 🔴 **Critical Issues Identified - Action Required**
