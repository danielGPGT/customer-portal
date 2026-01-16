# Authentication System Comparison: Supabase Auth vs Clerk

## 📋 Overview

This document explains how authentication worked with Supabase Auth and how it now works with Clerk, including how users are linked to client records in the database.

---

## 🔵 OLD SYSTEM: Supabase Auth

### How It Worked

#### **1. User Authentication Flow**

```
User Login → Supabase Auth → auth.users table → Client Record Lookup
```

**Step-by-Step:**

1. **User submits login form** (`components/auth/login-form.tsx`)
   ```typescript
   await supabase.auth.signInWithPassword({
     email: data.email,
     password: data.password,
   })
   ```

2. **Supabase creates session**
   - Session cookie stored in browser
   - User ID stored in `auth.users` table (Supabase's built-in auth table)
   - User ID is a UUID like `550e8400-e29b-41d4-a716-446655440000`

3. **Application fetches user data** (`lib/utils/get-client.ts`)
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   // user.id = UUID from auth.users table
   ```

#### **2. Linking to Client Records**

**Database Structure:**
- `auth.users` table (Supabase managed) - stores authentication info
- `clients` table (your database) - stores business data
- Link via `auth_user_id` column in `clients` table

**The Linking Process:**

```typescript
// In getClient() function:

// Step 1: Get authenticated user from Supabase Auth
const { data: { user } } = await supabase.auth.getUser()
// user.id = "550e8400-e29b-41d4-a716-446655440000"

// Step 2: Find client record by auth_user_id
const { data: client } = await supabase
  .from('clients')
  .select('*')
  .eq('auth_user_id', user.id)  // Match Supabase auth user ID
  .single()
```

**Database Schema:**
```sql
-- clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),  -- Links to Supabase auth
  email TEXT,
  first_name TEXT,
  -- ... other fields
);
```

#### **3. Row Level Security (RLS)**

**How RLS Worked:**
```sql
-- RLS Policy Example
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (auth.uid() = auth_user_id);
  -- auth.uid() = current Supabase auth user ID
```

**Key Points:**
- `auth.uid()` is a Supabase function that returns the current authenticated user's ID
- RLS policies automatically check if the user owns the record
- Works seamlessly because Supabase Auth and Database are in the same system

#### **4. Signup Flow**

**Old Signup Process:**
1. Check if client exists with email
2. Create Supabase Auth account → `auth.users` record created
3. Create/update client record with `auth_user_id = user.id`
4. Handle referral codes
5. Link existing clients by email if needed

**Code Example:**
```typescript
// Create auth account
const { data: authData } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
})

// Create client record
await supabase.from('clients').insert({
  auth_user_id: authData.user.id,  // Link to Supabase auth user
  email: data.email,
  // ... other fields
})
```

---

## 🟢 NEW SYSTEM: Clerk Authentication

### How It Works

#### **1. User Authentication Flow**

```
User Login → Clerk → Clerk User Database → Client Record Lookup
```

**Step-by-Step:**

1. **User submits login form** (`components/auth/login-form.tsx`)
   ```typescript
   const { signIn, setActive } = useSignIn()
   
   const result = await signIn.create({
     identifier: data.email,
     password: data.password,
   })
   
   await setActive({ session: result.createdSessionId })
   ```

2. **Clerk creates session**
   - Session managed by Clerk (separate service)
   - User ID stored in Clerk's database (not your Supabase database)
   - User ID is a string like `user_2abc123def456`
   - Clerk handles all authentication logic

3. **Application fetches user data** (`lib/clerk/server.ts` → `lib/utils/get-client.ts`)
   ```typescript
   // Get Clerk user
   const clerkUser = await getClerkUser()
   // clerkUser.id = "user_2abc123def456" (Clerk user ID)
   ```

#### **2. Linking to Client Records**

**Database Structure:**
- Clerk User Database (Clerk managed) - stores authentication info
- `clients` table (your Supabase database) - stores business data
- Link via `clerk_user_id` column in `clients` table

**The Linking Process:**

```typescript
// In getClient() function:

// Step 1: Get authenticated user from Clerk
const clerkUser = await getClerkUser()
// clerkUser.id = "user_2abc123def456"

// Step 2: Find client record by clerk_user_id
const { data: client } = await supabase
  .from('clients')
  .select('*')
  .eq('clerk_user_id', clerkUser.id)  // Match Clerk user ID
  .single()
```

**Database Schema:**
```sql
-- clients table (after migration)
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT,  -- Links to Clerk user ID (TEXT, not UUID)
  auth_user_id UUID,   -- Old Supabase link (kept for migration)
  email TEXT,
  first_name TEXT,
  -- ... other fields
);
```

#### **3. Row Level Security (RLS) - The Challenge**

**The Problem:**
- RLS policies use `auth.uid()` which only works with Supabase Auth
- Clerk is a separate service, so `auth.uid()` doesn't know about Clerk users

**The Solution:**
We need to pass Clerk user ID to Supabase so RLS can check it.

**Option 1: JWT Claims (Recommended)**
```sql
-- Custom function to get Clerk user ID from JWT
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  -- Extract Clerk user ID from JWT token
  RETURN current_setting('request.jwt.claims', true)::json->>'sub';
END;
$$ LANGUAGE plpgsql STABLE;

-- Updated RLS Policy
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (clerk_user_id = get_clerk_user_id());
```

**How JWT Works:**
1. Clerk creates JWT token with user ID in `sub` claim
2. Application sends JWT to Supabase with requests
3. RLS function extracts user ID from JWT
4. RLS policy checks if user owns the record

**Option 2: Application-Level Security (Fallback)**
- Disable RLS and check permissions in application code
- Less secure, not recommended

#### **4. Signup Flow (To Be Updated)**

**New Signup Process (when implemented):**
1. Check if client exists with email
2. Create Clerk account → Clerk user record created
3. Create/update client record with `clerk_user_id = clerkUser.id`
4. Handle referral codes
5. Link existing clients by email if needed

**Code Example (when signup is updated):**
```typescript
// Create Clerk account
const { signUp, setActive } = useSignUp()

const result = await signUp.create({
  emailAddress: data.email,
  password: data.password,
  firstName: data.firstName,
  lastName: data.lastName,
})

// After email verification, create client record
await supabase.from('clients').insert({
  clerk_user_id: result.createdUserId,  // Link to Clerk user
  email: data.email,
  // ... other fields
})
```

---

## 🔄 Key Differences

### 1. **User ID Format**

| Aspect | Supabase Auth | Clerk |
|--------|---------------|-------|
| **User ID Type** | UUID | String |
| **Example** | `550e8400-e29b-41d4-a716-446655440000` | `user_2abc123def456` |
| **Storage** | `auth.users` table in Supabase | Clerk's database |
| **Column Type** | `UUID` | `TEXT` |

### 2. **Authentication Service**

| Aspect | Supabase Auth | Clerk |
|--------|---------------|-------|
| **Location** | Same database as your app | Separate service |
| **Session Management** | Supabase handles | Clerk handles |
| **User Management** | Supabase dashboard | Clerk dashboard |
| **Features** | Basic auth | Advanced (MFA, social login, etc.) |

### 3. **Database Linking**

| Aspect | Supabase Auth | Clerk |
|--------|---------------|-------|
| **Link Column** | `auth_user_id` (UUID) | `clerk_user_id` (TEXT) |
| **RLS Function** | `auth.uid()` (built-in) | `get_clerk_user_id()` (custom) |
| **RLS Complexity** | Simple (native) | Requires JWT configuration |

### 4. **Code Changes**

**Old (Supabase):**
```typescript
// Get user
const { data: { user } } = await supabase.auth.getUser()

// Query client
const { data: client } = await supabase
  .from('clients')
  .eq('auth_user_id', user.id)
```

**New (Clerk):**
```typescript
// Get user
const clerkUser = await getClerkUser()

// Query client
const { data: client } = await supabase
  .from('clients')
  .eq('clerk_user_id', clerkUser.id)
```

---

## 🔗 How Client Linking Works (Both Systems)

### The `getClient()` Function Flow

Both systems use the same `getClient()` function pattern, but with different user sources:

```typescript
export const getClient = cache(async () => {
  // STEP 1: Get authenticated user
  // OLD: const { data: { user } } = await supabase.auth.getUser()
  // NEW: const clerkUser = await getClerkUser()
  
  // STEP 2: Check portal access
  // Query user_portal_access table
  
  // STEP 3: Find client record
  // OLD: .eq('auth_user_id', user.id)
  // NEW: .eq('clerk_user_id', clerkUser.id)
  
  // STEP 4: If not found, try to link by email
  // OLD: link_client_to_user(user.id)
  // NEW: link_client_to_clerk_user(clerkUser.id)
  
  // STEP 5: If still not found, create new client
  // OLD: Insert with auth_user_id
  // NEW: Insert with clerk_user_id
  
  return { client, user, portalAccess, error: null }
})
```

### Linking Existing Clients

**Scenario:** User signs up but already has a client record (from booking system, etc.)

**Old System:**
```sql
-- Function: link_client_to_user(UUID)
-- Finds client by email matching auth.users.email
-- Updates auth_user_id to link them
```

**New System:**
```sql
-- Function: link_client_to_clerk_user(TEXT)
-- Finds client by email matching Clerk user email
-- Updates clerk_user_id to link them
```

**Both systems:**
1. Check if client exists with matching email
2. If found, update the link column (`auth_user_id` or `clerk_user_id`)
3. Preserve all existing client data (points, bookings, etc.)

---

## 🛡️ Security Comparison

### Supabase Auth
- ✅ RLS works natively with `auth.uid()`
- ✅ User data in same database
- ✅ Simple security model
- ⚠️ Shared with other portal (security concern)

### Clerk
- ✅ Separate authentication service (better isolation)
- ✅ Advanced security features (MFA, etc.)
- ⚠️ Requires JWT configuration for RLS
- ⚠️ More complex setup

---

## 📊 Database Schema Evolution

### Before (Supabase Auth Only)
```sql
clients (
  id UUID,
  auth_user_id UUID,  -- Links to auth.users
  email TEXT,
  ...
)
```

### After Migration (Clerk)
```sql
clients (
  id UUID,
  clerk_user_id TEXT,  -- NEW: Links to Clerk
  auth_user_id UUID,   -- OLD: Kept for migration
  email TEXT,
  ...
)
```

### Future (After Full Migration)
```sql
clients (
  id UUID,
  clerk_user_id TEXT,  -- Only this one needed
  email TEXT,
  ...
)
-- auth_user_id can be removed after all users migrated
```

---

## 🔄 Migration Path

### For Existing Users

**Option 1: Gradual Migration (Recommended)**
1. User logs in with Clerk
2. System checks if `clerk_user_id` exists
3. If not, finds client by email
4. Links `clerk_user_id` to existing client record
5. User can now use Clerk going forward

**Option 2: Bulk Migration**
1. Export all Supabase auth users
2. Create corresponding Clerk users
3. Link `clerk_user_id` to all client records
4. All users migrated at once

---

## 🎯 Summary

### What Changed
1. **Authentication Service:** Supabase Auth → Clerk
2. **User ID Format:** UUID → String
3. **Link Column:** `auth_user_id` → `clerk_user_id`
4. **RLS Function:** `auth.uid()` → `get_clerk_user_id()`
5. **Session Management:** Supabase → Clerk

### What Stayed the Same
1. **Database Structure:** `clients` table structure (mostly)
2. **Linking Logic:** Same pattern (find by email, link, create if needed)
3. **Portal Access:** Same `user_portal_access` table
4. **Business Logic:** All loyalty/points logic unchanged

### Benefits of Clerk
1. ✅ Complete authentication isolation from other portal
2. ✅ Better security features (MFA, social login)
3. ✅ Better user management UI
4. ✅ More scalable authentication service

---

## 📝 Next Steps

1. **Configure Clerk JWT** for Supabase RLS to work
2. **Update Signup Form** to use Clerk
3. **Test RLS Policies** with Clerk authentication
4. **Migrate Existing Users** from Supabase Auth to Clerk
5. **Remove Supabase Auth Code** after migration complete

---

**Questions?** This document should help you understand how the authentication system works now. The core linking logic is the same, just using Clerk user IDs instead of Supabase auth user IDs.
