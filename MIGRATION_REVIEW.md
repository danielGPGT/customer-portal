# Detailed Review: migration_add_clerk_user_id.sql

## 📋 Overview

This migration adds Clerk authentication support to your database by:
1. Adding `clerk_user_id` columns to link Clerk users to your data
2. Creating a function to extract Clerk user ID from JWT tokens
3. Updating all RLS policies to work with Clerk instead of Supabase Auth
4. Creating a helper function to link existing clients to Clerk users

---

## 🔍 Section-by-Section Breakdown

### **SECTION 1: Add `clerk_user_id` to `clients` Table**

```sql
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_clients_clerk_user_id 
ON clients(clerk_user_id) 
WHERE clerk_user_id IS NOT NULL;
```

**What This Does:**
- Adds a new column `clerk_user_id` of type `TEXT` (Clerk user IDs are strings like `user_2abc123`)
- Makes it `UNIQUE` - each Clerk user can only link to one client record
- Creates an index for fast lookups (only indexes non-null values)

**Why TEXT instead of UUID?**
- Clerk user IDs are strings like `user_2abc123def456`, not UUIDs
- Must match the format Clerk provides

**The Index:**
- `WHERE clerk_user_id IS NOT NULL` - Only indexes rows that have a Clerk user ID
- This is efficient because:
  - Old records might not have `clerk_user_id` yet (during migration)
  - Only indexed rows need fast lookups
  - Saves storage space

---

### **SECTION 2: Add `clerk_user_id` to `user_portal_access` Table**

```sql
ALTER TABLE user_portal_access
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_portal_access_clerk_user_id 
ON user_portal_access(clerk_user_id) 
WHERE clerk_user_id IS NOT NULL;
```

**What This Does:**
- Adds `clerk_user_id` to the portal access table
- Creates an index for fast lookups
- **Note:** Not `UNIQUE` here because a user can have multiple portal access records (e.g., both 'client' and 'team' portals)

**Why This Table?**
- `user_portal_access` controls which portals a user can access
- Needs to link to Clerk user ID instead of Supabase auth user ID
- Used in `getClient()` to check portal permissions

---

### **SECTION 3: Create `get_clerk_user_id()` Function**

```sql
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'sub';
END;
$$ LANGUAGE plpgsql STABLE;
```

**What This Does:**
- Creates a function that extracts the Clerk user ID from the JWT token
- Reads from `request.jwt.claims` which contains the JWT payload
- Extracts the `sub` claim (standard JWT field for "subject" = user ID)
- Returns `TEXT` (the Clerk user ID)

**How It Works:**
1. Clerk creates a JWT token when user authenticates
2. JWT includes user ID in the `sub` claim: `{ "sub": "user_2abc123" }`
3. Supabase receives the JWT in request headers
4. This function reads the JWT and extracts `sub`
5. RLS policies use this function to check if user owns the record

**Why `STABLE`?**
- `STABLE` means the function returns the same result for the same input within a transaction
- Tells PostgreSQL it's safe to optimize/cache
- Important for performance in RLS policies

**⚠️ Important Note:**
- This assumes Clerk JWT is passed to Supabase correctly
- You'll need to configure Clerk to include user ID in JWT
- May need to configure Supabase to accept Clerk JWTs

---

### **SECTION 4: Update RLS Policies**

This section updates **all** Row Level Security policies to use Clerk user ID instead of Supabase `auth.uid()`.

#### **4.1 Clients Table Policies**

```sql
-- SELECT Policy
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (clerk_user_id = get_clerk_user_id());
```

**What This Does:**
- Users can only SELECT (read) their own client record
- Checks if `clerk_user_id` matches the current Clerk user ID from JWT
- Replaces old: `USING (auth.uid() = auth_user_id)`

```sql
-- UPDATE Policy
CREATE POLICY "Users can update their own client record"
  ON clients FOR UPDATE
  USING (clerk_user_id = get_clerk_user_id())
  WITH CHECK (clerk_user_id = get_clerk_user_id());
```

**What This Does:**
- Users can only UPDATE their own client record
- `USING` - checks existing row before update
- `WITH CHECK` - checks new row values after update
- Prevents users from changing `clerk_user_id` to someone else's

```sql
-- INSERT Policy
CREATE POLICY "Allow client creation during signup"
  ON clients FOR INSERT
  WITH CHECK (clerk_user_id = get_clerk_user_id());
```

**What This Does:**
- Allows users to create their own client record during signup
- Only if they set `clerk_user_id` to their own Clerk user ID
- Prevents creating records for other users

#### **4.2 Related Tables (Transactions, Bookings, etc.)**

```sql
CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );
```

**What This Does:**
- Users can view transactions for their own client
- Uses a subquery to find the client by Clerk user ID
- Then checks if transaction's `client_id` matches

**Why This Pattern?**
- These tables don't have `clerk_user_id` directly
- They link to `clients` via `client_id`
- So we check: "Is this transaction's client owned by the current Clerk user?"

**Tables Updated:**
- ✅ `loyalty_transactions` - Points transactions
- ✅ `bookings` - Trip bookings
- ✅ `referrals` - Referral records (both as referrer and referee)
- ✅ `redemptions` - Point redemptions
- ✅ `notifications` - User notifications
- ✅ `user_portal_access` - Portal access control

#### **4.3 Portal Access RLS**

```sql
ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portal access"
  ON user_portal_access FOR SELECT
  USING (clerk_user_id = get_clerk_user_id());
```

**What This Does:**
- Enables RLS on `user_portal_access` (was missing before!)
- Users can only see their own portal access records
- **Critical for security** - prevents users from seeing other users' portal permissions

---

### **SECTION 5: Create `link_client_to_clerk_user()` Function**

```sql
CREATE OR REPLACE FUNCTION link_client_to_clerk_user(
    p_clerk_user_id TEXT
)
RETURNS TABLE (...)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id UUID;
    v_clerk_email TEXT;
BEGIN
    -- Find client by clerk_user_id
    SELECT c.id INTO v_client_id
    FROM clients c
    WHERE c.clerk_user_id = p_clerk_user_id
    LIMIT 1;
    
    -- If found, update and return
    IF v_client_id IS NOT NULL THEN
        UPDATE clients
        SET clerk_user_id = p_clerk_user_id,
            updated_at = NOW()
        WHERE clients.id = v_client_id;
        
        RETURN QUERY SELECT ... FROM clients WHERE id = v_client_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

**What This Does:**
- Links an existing client record to a Clerk user
- Takes Clerk user ID as parameter
- Finds client by `clerk_user_id` (if already linked)
- Updates the record and returns it

**Why `SECURITY DEFINER`?**
- Runs with function owner's privileges (bypasses RLS)
- Needed because:
  - Client might not be linked yet (no `clerk_user_id`)
  - RLS would block the query
  - Function needs to find and link the client

**⚠️ Current Limitation:**
- Currently only finds clients already linked by `clerk_user_id`
- **Doesn't link by email** (unlike the old `link_client_to_user` function)
- The comment says: "we'll need to pass email separately or get it another way"

**What's Missing:**
The old function could link by email:
```sql
-- Old function found client by email
SELECT c.id FROM clients c WHERE c.email = v_auth_email
```

This new function should probably do the same, but needs the email passed in or retrieved from Clerk.

---

## 🔄 Comparison: Old vs New

### Old System (Supabase Auth)

```sql
-- Column
auth_user_id UUID REFERENCES auth.users(id)

-- RLS Function
auth.uid()  -- Built-in Supabase function

-- RLS Policy
USING (auth.uid() = auth_user_id)

-- Link Function
link_client_to_user(UUID)  -- Found by email from auth.users
```

### New System (Clerk)

```sql
-- Column
clerk_user_id TEXT UNIQUE

-- RLS Function
get_clerk_user_id()  -- Custom function reading JWT

-- RLS Policy
USING (clerk_user_id = get_clerk_user_id())

-- Link Function
link_client_to_clerk_user(TEXT)  -- Currently only finds by clerk_user_id
```

---

## ⚠️ Issues & Improvements Needed

### **1. `link_client_to_clerk_user()` Function**

**Current Issue:**
- Only finds clients already linked by `clerk_user_id`
- Doesn't link by email (needed for existing clients)

**What It Should Do:**
```sql
-- Should also try to find by email
-- But needs email from Clerk user
-- Options:
-- 1. Pass email as second parameter
-- 2. Query Clerk API to get email (not possible in SQL)
-- 3. Application code passes email
```

**Recommended Fix:**
```sql
CREATE OR REPLACE FUNCTION link_client_to_clerk_user(
    p_clerk_user_id TEXT,
    p_email TEXT  -- Add email parameter
)
-- Then find by email:
SELECT c.id FROM clients c WHERE c.email = p_email
```

### **2. JWT Configuration**

**Current Assumption:**
- Clerk JWT includes user ID in `sub` claim
- Supabase can read Clerk JWTs
- JWT is passed in request headers

**What You Need to Do:**
1. Configure Clerk JWT template to include user ID in `sub`
2. Configure Supabase to accept Clerk JWTs (may need custom setup)
3. Ensure application passes JWT to Supabase in requests

### **3. Migration of Existing Users**

**Current State:**
- Migration adds columns but doesn't migrate existing data
- Old `auth_user_id` values remain
- New users will use `clerk_user_id`

**What You Need:**
- Script to migrate existing Supabase auth users to Clerk
- Link their `clerk_user_id` to existing client records
- Or gradual migration on first login

---

## ✅ What's Good

1. **Comprehensive RLS Updates** - All tables covered
2. **Proper Indexing** - Fast lookups with partial indexes
3. **UNIQUE Constraint** - Prevents duplicate links
4. **Portal Access RLS** - Finally secured!
5. **SECURITY DEFINER** - Properly used for linking function

---

## 📝 Summary

**What This Migration Does:**
1. ✅ Adds `clerk_user_id` columns to link Clerk users
2. ✅ Creates function to extract Clerk user ID from JWT
3. ✅ Updates all RLS policies to use Clerk
4. ✅ Creates linking function (needs email support)
5. ✅ Secures `user_portal_access` table

**What You Still Need:**
1. ⚠️ Configure Clerk JWT for Supabase
2. ⚠️ Improve `link_client_to_clerk_user()` to support email linking
3. ⚠️ Migrate existing users from Supabase Auth to Clerk
4. ⚠️ Test RLS policies work correctly

**Next Steps:**
1. Review and potentially update `link_client_to_clerk_user()` function
2. Configure Clerk JWT template
3. Test the migration on a staging database first
4. Create user migration script

---

Would you like me to:
1. **Improve the `link_client_to_clerk_user()` function** to support email linking?
2. **Create a test script** to verify RLS policies work?
3. **Create a user migration script** to move existing users to Clerk?
