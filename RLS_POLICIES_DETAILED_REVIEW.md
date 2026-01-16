# Detailed RLS Policies Review: Clerk Migration

## 📋 Overview

This document breaks down every RLS policy in `migration_add_clerk_user_id.sql`, explaining what each does, how it works, and important considerations.

---

## 🔑 Key Concepts

### **RLS Policy Components**

1. **USING clause** - Checks existing rows (for SELECT, UPDATE, DELETE)
2. **WITH CHECK clause** - Checks new/modified rows (for INSERT, UPDATE)
3. **get_clerk_user_id()** - Custom function that extracts Clerk user ID from JWT

### **How RLS Works**

- RLS policies are evaluated **before** queries execute
- If policy returns `true`, row is accessible
- If policy returns `false`, row is hidden/blocked
- Multiple policies are combined with **OR** (if any policy allows, access is granted)

---

## 📊 Policy-by-Policy Breakdown

### **1. CLIENTS TABLE**

#### **Policy 1: SELECT (View Own Record)**

```sql
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (clerk_user_id = get_clerk_user_id());
```

**What It Does:**
- Allows users to **read** their own client record
- Only rows where `clerk_user_id` matches the current Clerk user ID are visible

**How It Works:**
1. User makes query: `SELECT * FROM clients`
2. RLS evaluates: `clerk_user_id = get_clerk_user_id()`
3. `get_clerk_user_id()` extracts user ID from JWT: `"user_2abc123"`
4. Only rows where `clerk_user_id = "user_2abc123"` are returned

**Example:**
```sql
-- User with clerk_user_id = "user_123" queries:
SELECT * FROM clients;

-- RLS automatically filters to:
SELECT * FROM clients WHERE clerk_user_id = 'user_123';
-- Returns only their own record
```

**Security:**
- ✅ User can only see their own record
- ✅ Cannot see other users' records
- ✅ Works automatically on all SELECT queries

---

#### **Policy 2: UPDATE (Modify Own Record)**

```sql
CREATE POLICY "Users can update their own client record"
  ON clients FOR UPDATE
  USING (clerk_user_id = get_clerk_user_id())
  WITH CHECK (clerk_user_id = get_clerk_user_id());
```

**What It Does:**
- Allows users to **update** their own client record
- **USING**: Checks existing row before update
- **WITH CHECK**: Checks new row values after update

**Why Both Clauses?**

**USING clause:**
- Evaluated **before** the UPDATE
- Checks if the existing row belongs to the user
- Prevents: "User tries to update someone else's record"

**WITH CHECK clause:**
- Evaluated **after** the UPDATE
- Checks if the new values are valid
- Prevents: "User tries to change `clerk_user_id` to someone else's"

**Example:**
```sql
-- User tries to update their own record:
UPDATE clients SET first_name = 'John' WHERE id = 'client-123';
-- ✅ Allowed if clerk_user_id matches

-- User tries to update someone else's record:
UPDATE clients SET first_name = 'John' WHERE id = 'client-456';
-- ❌ Blocked by USING clause (row doesn't belong to user)

-- User tries to change clerk_user_id:
UPDATE clients SET clerk_user_id = 'user_other' WHERE id = 'client-123';
-- ❌ Blocked by WITH CHECK clause (can't change ownership)
```

**Security:**
- ✅ User can only update their own record
- ✅ Cannot change `clerk_user_id` to another user's ID
- ✅ Cannot update other users' records

---

#### **Policy 3: INSERT (Create Own Record)**

```sql
CREATE POLICY "Allow client creation during signup"
  ON clients FOR INSERT
  WITH CHECK (clerk_user_id = get_clerk_user_id());
```

**What It Does:**
- Allows users to **create** their own client record during signup
- Only if they set `clerk_user_id` to their own Clerk user ID

**Why Only WITH CHECK?**
- INSERT doesn't have existing rows, so no USING clause needed
- Only need to check the new row being inserted

**Example:**
```sql
-- User creates their own record:
INSERT INTO clients (clerk_user_id, email, first_name)
VALUES ('user_123', 'user@example.com', 'John');
-- ✅ Allowed if 'user_123' matches get_clerk_user_id()

-- User tries to create record for someone else:
INSERT INTO clients (clerk_user_id, email, first_name)
VALUES ('user_456', 'other@example.com', 'Jane');
-- ❌ Blocked (can't create records for other users)
```

**Security:**
- ✅ User can only create their own record
- ✅ Cannot create records with other users' Clerk IDs
- ✅ Prevents account hijacking

---

### **2. LOYALTY_TRANSACTIONS TABLE**

#### **Policy: SELECT (View Own Transactions)**

```sql
CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Allows users to view transactions for their own client
- Uses a **subquery** to find the client by Clerk user ID
- Then checks if transaction's `client_id` matches

**Why Subquery Pattern?**

The `loyalty_transactions` table doesn't have `clerk_user_id` directly:
- It links to `clients` via `client_id`
- We need to: "Find the client owned by this Clerk user, then check if transaction belongs to that client"

**Step-by-Step:**
1. `get_clerk_user_id()` returns: `"user_123"`
2. Subquery finds client: `SELECT id FROM clients WHERE clerk_user_id = 'user_123'`
3. Returns client ID: `'client-abc'`
4. Main query checks: `client_id IN ('client-abc')`
5. Only transactions with `client_id = 'client-abc'` are visible

**Example:**
```sql
-- User queries transactions:
SELECT * FROM loyalty_transactions;

-- RLS automatically filters to:
SELECT * FROM loyalty_transactions
WHERE client_id IN (
  SELECT id FROM clients WHERE clerk_user_id = 'user_123'
);
-- Returns only transactions for their client
```

**Security:**
- ✅ User can only see transactions for their own client
- ✅ Cannot see other users' transactions
- ✅ Works even though transactions table doesn't have `clerk_user_id`

**Why No INSERT/UPDATE/DELETE Policies?**
- Transactions are created by system functions (e.g., `update_client_points()`)
- These functions use `SECURITY DEFINER` to bypass RLS
- Users shouldn't directly create/modify transactions

---

### **3. BOOKINGS TABLE**

#### **Policy: SELECT (View Own Bookings)**

```sql
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Same pattern as transactions
- Users can view bookings for their own client
- Uses subquery to find client by Clerk user ID

**Security:**
- ✅ User can only see their own bookings
- ✅ Cannot see other users' bookings

**Why No INSERT/UPDATE/DELETE?**
- Bookings are created by the booking system
- Users don't directly create/modify bookings

---

### **4. REFERRALS TABLE**

#### **Policy 1: SELECT (View Referrals They Created)**

```sql
CREATE POLICY "Users can view referrals they created"
  ON referrals FOR SELECT
  USING (
    referrer_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Users can view referrals where they are the **referrer** (person who invited)
- Checks if `referrer_client_id` belongs to the current user's client

**Example:**
```sql
-- User queries referrals:
SELECT * FROM referrals;

-- RLS filters to referrals where user is referrer:
SELECT * FROM referrals
WHERE referrer_client_id IN (
  SELECT id FROM clients WHERE clerk_user_id = 'user_123'
);
```

---

#### **Policy 2: SELECT (View Referrals Where They Are Referee)**

```sql
CREATE POLICY "Users can view referrals where they are the referee"
  ON referrals FOR SELECT
  USING (
    referee_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Users can view referrals where they are the **referee** (person who was invited)
- Checks if `referee_client_id` belongs to the current user's client

**Why Two Policies?**
- A user can be both a referrer (invited others) and a referee (was invited)
- They need to see both types of referrals
- RLS combines policies with OR, so both apply

**Example:**
```sql
-- User can see:
-- 1. Referrals they created (as referrer)
-- 2. Referrals where they were invited (as referee)
-- But NOT referrals between other users
```

---

#### **Policy 3: INSERT (Create Referrals)**

```sql
CREATE POLICY "Users can create referrals as referrer"
  ON referrals FOR INSERT
  WITH CHECK (
    referrer_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Users can create referrals where they are the referrer
- Prevents creating referrals for other users

**Example:**
```sql
-- User creates referral:
INSERT INTO referrals (referrer_client_id, referee_client_id, code)
VALUES ('client-123', 'client-456', 'REF123');
-- ✅ Allowed if 'client-123' belongs to current user

-- User tries to create referral as someone else:
INSERT INTO referrals (referrer_client_id, referee_client_id, code)
VALUES ('client-999', 'client-456', 'REF123');
-- ❌ Blocked (can't create referrals for other users)
```

---

### **5. REDEMPTIONS TABLE**

#### **Policy: SELECT (View Own Redemptions)**

```sql
CREATE POLICY "Users can view their own redemptions"
  ON redemptions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Same pattern as transactions/bookings
- Users can view redemptions for their own client

**Security:**
- ✅ User can only see their own redemptions
- ✅ Cannot see other users' redemptions

---

### **6. NOTIFICATIONS TABLE**

#### **Policy 1: SELECT (View Own Notifications)**

```sql
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Users can view notifications for their own client

---

#### **Policy 2: UPDATE (Update Own Notifications)**

```sql
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What It Does:**
- Users can update notifications for their own client
- Both USING and WITH CHECK prevent:
  - Updating other users' notifications (USING)
  - Changing `client_id` to another user's (WITH CHECK)

**Example Use Case:**
- User marks notification as read: `UPDATE notifications SET read = true WHERE id = 'notif-123'`
- ✅ Allowed if notification belongs to user's client
- ❌ Blocked if notification belongs to another user

---

### **7. user_portal_access TABLE**

#### **Policy: SELECT (View Own Portal Access)**

```sql
ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portal access"
  ON user_portal_access FOR SELECT
  USING (clerk_user_id = get_clerk_user_id());
```

**What It Does:**
- **Enables RLS** on this table (was missing before!)
- Users can only view their own portal access records
- **Critical for security** - prevents users from seeing other users' portal permissions

**Why This Is Important:**
- Without RLS, any authenticated user could query all portal access records
- Could reveal which users have access to which portals
- Now properly secured

**Example:**
```sql
-- User queries portal access:
SELECT * FROM user_portal_access;

-- RLS filters to:
SELECT * FROM user_portal_access WHERE clerk_user_id = 'user_123';
-- Returns only their own portal access records
```

**Why No INSERT/UPDATE/DELETE?**
- Portal access is managed by system/admin
- Users shouldn't be able to modify their own portal access
- Prevents privilege escalation

---

## 🔍 Policy Patterns Summary

### **Pattern 1: Direct Column Match**
```sql
USING (clerk_user_id = get_clerk_user_id())
```
- Used for: `clients`, `user_portal_access`
- Direct comparison of Clerk user ID

### **Pattern 2: Subquery Through Clients**
```sql
USING (
  client_id IN (
    SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
  )
)
```
- Used for: `loyalty_transactions`, `bookings`, `redemptions`, `notifications`
- Finds client first, then checks relationship

### **Pattern 3: Multiple Relationships**
```sql
-- Policy 1: As referrer
USING (referrer_client_id IN (...))

-- Policy 2: As referee  
USING (referee_client_id IN (...))
```
- Used for: `referrals`
- Multiple policies for different relationships

---

## ⚠️ Important Considerations

### **1. get_clerk_user_id() Function Dependency**

**All policies depend on this function working correctly:**
- Must extract Clerk user ID from JWT
- JWT must be passed to Supabase correctly
- If function returns NULL, policies will fail

**Testing:**
```sql
-- Test the function:
SELECT get_clerk_user_id();
-- Should return Clerk user ID when authenticated
-- Returns NULL if not authenticated or JWT not configured
```

### **2. NULL clerk_user_id Values**

**What happens if `clerk_user_id` is NULL?**
- Policies check: `clerk_user_id = get_clerk_user_id()`
- If `clerk_user_id IS NULL`, comparison fails
- Row is **hidden** (user can't see it)

**This is correct behavior:**
- Old records without `clerk_user_id` won't be visible
- Need to migrate existing users to set `clerk_user_id`
- New records must have `clerk_user_id` set

### **3. Performance Considerations**

**Subquery Pattern:**
```sql
client_id IN (
  SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
)
```

**Performance:**
- Subquery executes for each row checked
- Index on `clients.clerk_user_id` is critical
- Consider materialized view or function for better performance

**Optimization:**
- The index we created helps: `idx_clients_clerk_user_id`
- PostgreSQL should optimize the subquery
- Monitor query performance after migration

### **4. Policy Evaluation Order**

**RLS policies are evaluated:**
- Before query execution
- For each row individually
- Policies are combined with OR (if any allows, access granted)

**Multiple Policies:**
- If multiple policies exist, any one can grant access
- Example: Referrals table has 2 SELECT policies (referrer + referee)
- User can see referrals if EITHER policy matches

### **5. SECURITY DEFINER Functions**

**Functions that bypass RLS:**
- `update_client_points()` - Creates transactions
- `process_referral_signup()` - Creates clients
- `link_client_to_clerk_user()` - Links clients

**Why:**
- These functions need to access data across user boundaries
- They implement business logic requiring elevated privileges
- They validate inputs internally

**Security:**
- Functions must validate inputs
- Should only be called from server-side code
- Review function code for security

---

## ✅ Policy Coverage Summary

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `clients` | ✅ | ✅ | ✅ | ❌ | Users can't delete (system managed) |
| `loyalty_transactions` | ✅ | ❌ | ❌ | ❌ | System functions only |
| `bookings` | ✅ | ❌ | ❌ | ❌ | Booking system only |
| `referrals` | ✅ (2 policies) | ✅ | ❌ | ❌ | Can view as referrer/referee |
| `redemptions` | ✅ | ❌ | ❌ | ❌ | System managed |
| `notifications` | ✅ | ❌ | ✅ | ❌ | Can mark as read |
| `user_portal_access` | ✅ | ❌ | ❌ | ❌ | System/admin only |

---

## 🧪 Testing Recommendations

### **Test Each Policy:**

1. **Clients Table:**
   ```sql
   -- As User A: Should see only their record
   SELECT * FROM clients;
   
   -- As User A: Should be able to update their record
   UPDATE clients SET first_name = 'Test' WHERE id = 'client-a-id';
   
   -- As User A: Should NOT be able to update User B's record
   UPDATE clients SET first_name = 'Hack' WHERE id = 'client-b-id';
   -- Should return 0 rows updated
   ```

2. **Transactions Table:**
   ```sql
   -- As User A: Should see only their transactions
   SELECT * FROM loyalty_transactions;
   
   -- Should NOT see User B's transactions
   ```

3. **Referrals Table:**
   ```sql
   -- As User A: Should see referrals they created
   -- AND referrals where they were invited
   SELECT * FROM referrals;
   ```

4. **Portal Access:**
   ```sql
   -- As User A: Should see only their portal access
   SELECT * FROM user_portal_access;
   -- Should NOT see User B's portal access
   ```

---

## 🎯 Summary

**What These Policies Do:**
1. ✅ Enforce data isolation at database level
2. ✅ Prevent users from accessing other users' data
3. ✅ Allow users to manage their own data
4. ✅ Secure portal access information

**Key Points:**
- All policies use `get_clerk_user_id()` to identify current user
- Direct tables use column comparison
- Related tables use subquery pattern
- Multiple policies allow different access patterns (e.g., referrals)

**Critical Dependencies:**
- `get_clerk_user_id()` function must work correctly
- JWT must be configured and passed to Supabase
- Indexes must exist for performance

**Next Steps:**
1. Test `get_clerk_user_id()` function
2. Verify JWT configuration
3. Test each policy with real users
4. Monitor query performance

---

This covers all the RLS policies in detail. Each policy is designed to ensure users can only access their own data while allowing necessary operations.
