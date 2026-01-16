# RLS Policies Safe Migration Strategy

## ✅ Updated Migration Approach

The migration has been updated to **keep both policy sets active** during the migration period. This is the safest approach.

---

## 🔄 How It Works

### **Old Approach (Dropped Policies):**
```sql
-- ❌ Old: Drops existing policies
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
CREATE POLICY "Users can view their own client record" ...  -- Clerk version
```
**Problem:** Existing Supabase Auth users lose access immediately

### **New Approach (Keep Both):**
```sql
-- ✅ New: Keeps existing policies, adds new ones
-- Existing: "Users can view their own client record" (Supabase Auth)
-- New:      "Users can view their own client record (Clerk)" (Clerk)
CREATE POLICY "Users can view their own client record (Clerk)" ...  -- Added alongside
```
**Result:** Both Supabase Auth and Clerk users can access their data

---

## 📊 Policy Behavior

### **How RLS Policies Combine**

When multiple policies exist, PostgreSQL combines them with **OR**:
- Policy 1: `auth_user_id = auth.uid()` (Supabase Auth)
- Policy 2: `clerk_user_id = get_clerk_user_id()` (Clerk)
- **Result:** Either condition can grant access

**Example:**
```sql
-- User with Supabase Auth:
SELECT * FROM clients;
-- ✅ Policy 1 matches: auth_user_id = auth.uid() → Access granted

-- User with Clerk:
SELECT * FROM clients;
-- ✅ Policy 2 matches: clerk_user_id = get_clerk_user_id() → Access granted
```

---

## 🔍 Policy Names

### **Policy Naming Strategy**

All Clerk policies have "(Clerk)" suffix to avoid conflicts:

| Table | Supabase Auth Policy | Clerk Policy |
|-------|---------------------|--------------|
| `clients` | "Users can view their own client record" | "Users can view their own client record (Clerk)" |
| `loyalty_transactions` | "Users can view their own transactions" | "Users can view their own transactions (Clerk)" |
| `bookings` | "Users can view their own bookings" | "Users can view their own bookings (Clerk)" |
| `referrals` | "Users can view referrals they created" | "Users can view referrals they created (Clerk)" |
| `notifications` | "Users can view their own notifications" | "Users can view their own notifications (Clerk)" |

---

## 🛡️ Safety Features

### **1. Existence Checks**

All policy creation uses DO blocks to check if policy exists:

```sql
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' 
    AND policyname = 'Users can view their own client record (Clerk)'
  ) THEN
    CREATE POLICY "Users can view their own client record (Clerk)" ...;
  END IF;
END $$;
```

**Benefits:**
- ✅ Safe to run migration multiple times
- ✅ Won't error if policy already exists
- ✅ Idempotent (can run repeatedly)

### **2. No Policy Drops**

- ✅ No `DROP POLICY` statements in migration
- ✅ Existing policies remain active
- ✅ Both Supabase Auth and Clerk policies work

### **3. Gradual Migration**

- ✅ Existing users continue working (Supabase Auth)
- ✅ New users work immediately (Clerk)
- ✅ Can migrate users gradually
- ✅ No breaking changes

---

## 📋 What The Migration Does

### **1. Adds Clerk Columns** ✅
- Adds `clerk_user_id` to `clients` table
- Adds `clerk_user_id` to `user_portal_access` table
- Creates indexes for performance

### **2. Creates Helper Function** ✅
- Creates `get_clerk_user_id()` function
- Extracts Clerk user ID from JWT

### **3. Adds Clerk Policies** ✅
- Creates new policies with "(Clerk)" suffix
- Checks if policy exists before creating
- Keeps existing Supabase Auth policies

### **4. Enables RLS on Portal Access** ✅
- Enables RLS on `user_portal_access` (was missing!)
- Creates Clerk policy for portal access
- Keeps existing Supabase Auth policy (if exists)

---

## 🧪 Testing Strategy

### **Before Applying Migration:**

1. **Check Current Policy State:**
   ```sql
   SELECT tablename, policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('clients', 'loyalty_transactions', 'bookings', 'referrals', 'redemptions', 'notifications', 'user_portal_access')
   ORDER BY tablename, policyname;
   ```

2. **Check Data State:**
   ```sql
   -- How many records need migration:
   SELECT COUNT(*) FROM clients WHERE clerk_user_id IS NULL;
   SELECT COUNT(*) FROM clients WHERE auth_user_id IS NOT NULL;
   ```

3. **Test get_clerk_user_id():**
   ```sql
   -- After JWT configured:
   SELECT get_clerk_user_id();
   -- Should return Clerk user ID when authenticated
   ```

### **After Applying Migration:**

1. **Verify Policies Created:**
   ```sql
   -- Check Clerk policies exist:
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE policyname LIKE '%(Clerk)'
   ORDER BY tablename, policyname;
   ```

2. **Test Both User Types:**
   ```sql
   -- As Supabase Auth user:
   SELECT * FROM clients;
   -- Should see their record (via Supabase Auth policy)
   
   -- As Clerk user:
   SELECT * FROM clients;
   -- Should see their record (via Clerk policy)
   ```

3. **Test Portal Access:**
   ```sql
   -- As Clerk user:
   SELECT * FROM user_portal_access;
   -- Should see only their portal access (via Clerk policy)
   ```

---

## 🗑️ Cleanup (Later)

### **After All Users Migrated to Clerk:**

Once all users are migrated to Clerk and you've verified no Supabase Auth users remain:

1. **Run Cleanup Script:**
   ```sql
   -- db/CLEANUP_REMOVE_OLD_POLICIES.sql
   -- This drops old Supabase Auth policies
   ```

2. **Verify No Supabase Auth Users:**
   ```sql
   -- Before cleanup, verify:
   SELECT COUNT(*) FROM clients WHERE auth_user_id IS NOT NULL AND clerk_user_id IS NULL;
   -- Should be 0 or very small
   ```

3. **Optional: Rename Policies:**
   ```sql
   -- After cleanup, rename Clerk policies to remove "(Clerk)" suffix:
   ALTER POLICY "Users can view their own client record (Clerk)" ON clients 
   RENAME TO "Users can view their own client record";
   ```

---

## ✅ Benefits of This Approach

1. **✅ Zero Downtime** - No breaking changes during migration
2. **✅ Gradual Migration** - Can migrate users one by one
3. **✅ Rollback Safe** - Easy to rollback if needed
4. **✅ Testable** - Can test Clerk policies without breaking existing users
5. **✅ Safe to Run Multiple Times** - Idempotent migration

---

## ⚠️ Important Notes

### **1. Policy Combination (OR Logic)**

- Both policy sets are active
- Policies are combined with OR (not AND)
- Either Supabase Auth OR Clerk policy can grant access
- This is **intentional** for migration period

### **2. Slightly More Permissive During Migration**

- During migration, users with either auth type can access
- This is acceptable during migration period
- After cleanup, only Clerk policies remain (more restrictive)

### **3. Performance Impact**

- Multiple policies may have slight performance impact
- This is temporary (only during migration)
- After cleanup, only Clerk policies remain

---

## 📝 Migration Steps

### **Step 1: Apply Migration**
```sql
-- Run: db/migration_add_clerk_user_id.sql
-- Adds columns, creates function, adds Clerk policies
-- Keeps existing Supabase Auth policies
```

### **Step 2: Test Clerk Policies**
```sql
-- Test with Clerk user:
-- Verify get_clerk_user_id() works
-- Verify Clerk policies work
-- Verify existing Supabase Auth users still work
```

### **Step 3: Migrate Users Gradually**
```sql
-- Migrate users one by one:
-- Set clerk_user_id for each user
-- Verify they can access via Clerk policies
```

### **Step 4: Cleanup (After All Users Migrated)**
```sql
-- Run: db/CLEANUP_REMOVE_OLD_POLICIES.sql
-- Drops old Supabase Auth policies
-- Only Clerk policies remain
```

---

## 🎯 Summary

**What Changed:**
- ✅ Migration no longer drops existing policies
- ✅ Adds new Clerk policies alongside existing ones
- ✅ Uses DO blocks to check existence before creating
- ✅ Policy names have "(Clerk)" suffix to avoid conflicts

**Result:**
- ✅ Both Supabase Auth and Clerk users can access their data
- ✅ Gradual migration possible
- ✅ No breaking changes
- ✅ Safe to run multiple times

**Next Steps:**
1. Review migration file
2. Apply migration to database
3. Test both user types
4. Migrate users gradually
5. Clean up old policies after all users migrated

---

The migration is now much safer! Both policy sets will work together during the migration period.
