# Clerk Signup Client Creation Fix

## 🐛 Issue

After signing up with Clerk, the dashboard doesn't render because:
1. No client record is created/linked after Clerk signup
2. The `link_client_to_clerk_user` RPC function wasn't searching by email
3. The dashboard redirects if no client is found

## ✅ Fixes Applied

### 1. Updated RPC Function

**File:** `db/migration_add_clerk_user_id.sql`

The `link_client_to_clerk_user` function now:
- Accepts both `p_clerk_user_id` and `p_email` parameters
- Searches by `clerk_user_id` first (if already linked)
- Falls back to searching by `email` (for new signups)
- Links existing client records to new Clerk users

### 2. Updated getClient Function

**File:** `lib/utils/get-client.ts`

Updated all calls to `link_client_to_clerk_user` to include the `p_email` parameter:
- Line 83: First attempt to link by email
- Line 104: Safety check before creating new client
- Line 138: Fallback after duplicate insert error

### 3. Fixed User Return

Fixed a bug where `user` was undefined in the `no_client_access` error case.

## 🔧 How It Works Now

### Signup Flow:

1. **User signs up with Clerk** → Clerk user created
2. **User redirected to `/dashboard`**
3. **Dashboard calls `getClient()`:**
   - Gets Clerk user via `getClerkUser()`
   - Queries `clients` table by `clerk_user_id` → Not found (new signup)
   - Calls `link_client_to_clerk_user(clerk_user_id, email)` → Searches by email
   - If client exists by email → Links it to Clerk user
   - If no client exists → Creates new client record automatically
4. **Dashboard renders** with client data

### Existing Client Linking:

If a client record exists with the same email (created by admin), it will be automatically linked to the new Clerk user.

## 🗄️ Database Migration Required

**You need to update the RPC function in your database:**

Run this SQL in your Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION link_client_to_clerk_user(
    p_clerk_user_id TEXT,
    p_email TEXT
)
RETURNS TABLE (
    id UUID,
    clerk_user_id TEXT,
    team_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    status TEXT,
    points_balance INTEGER,
    lifetime_points_earned INTEGER,
    lifetime_points_spent INTEGER,
    loyalty_enrolled BOOLEAN,
    loyalty_enrolled_at TIMESTAMPTZ,
    loyalty_signup_source TEXT,
    first_loyalty_booking_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Try to find client by clerk_user_id first (if already linked)
    SELECT c.id INTO v_client_id
    FROM clients c
    WHERE c.clerk_user_id = p_clerk_user_id
    LIMIT 1;

    -- If not found by clerk_user_id, try to find by email
    IF v_client_id IS NULL AND p_email IS NOT NULL THEN
        SELECT c.id INTO v_client_id
        FROM clients c
        WHERE c.email = p_email
        LIMIT 1;
    END IF;

    -- If client still doesn't exist, return empty
    IF v_client_id IS NULL THEN
        RETURN;
    END IF;

    -- Update the client record to ensure clerk_user_id is set
    UPDATE clients
    SET 
        clerk_user_id = p_clerk_user_id,
        updated_at = NOW()
    WHERE clients.id = v_client_id;

    -- Return the updated client record
    RETURN QUERY
    SELECT 
        c.id,
        c.clerk_user_id,
        c.team_id,
        c.email,
        c.first_name,
        c.last_name,
        c.phone,
        c.status,
        c.points_balance,
        c.lifetime_points_earned,
        c.lifetime_points_spent,
        c.loyalty_enrolled,
        c.loyalty_enrolled_at,
        c.loyalty_signup_source,
        c.first_loyalty_booking_at,
        c.created_at,
        c.updated_at
    FROM clients c
    WHERE c.id = v_client_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION link_client_to_clerk_user(TEXT, TEXT) TO authenticated;
```

## 🧪 Testing

After applying the fix:

1. **Sign up with a new email** → Should create client record automatically
2. **Sign up with an existing client email** → Should link to existing client
3. **Dashboard should render** after signup
4. **Client record should have `clerk_user_id`** set correctly

## 📝 Next Steps

1. Run the SQL migration above in Supabase SQL Editor
2. Test signup flow
3. Verify client records are created/linked correctly
4. Check dashboard loads after signup

## ⚠️ Important Notes

- The RPC function uses `SECURITY DEFINER`, so it bypasses RLS to find/link clients
- This is necessary because RLS policies may block the initial lookup
- After linking, RLS policies will work correctly for future queries
- Client creation uses the regular insert (RLS policies should allow it for new signups)
