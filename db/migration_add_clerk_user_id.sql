-- Migration: Add Clerk user ID support to database
-- This migration adds clerk_user_id column and updates RLS policies to work with Clerk

-- =====================================================
-- 1. ADD CLERK_USER_ID COLUMN TO CLIENTS TABLE
-- =====================================================
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_clerk_user_id 
ON clients(clerk_user_id) 
WHERE clerk_user_id IS NOT NULL;

-- =====================================================
-- 2. ADD CLERK_USER_ID COLUMN TO user_portal_access TABLE
-- =====================================================
ALTER TABLE user_portal_access
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_portal_access_clerk_user_id 
ON user_portal_access(clerk_user_id) 
WHERE clerk_user_id IS NOT NULL;

-- =====================================================
-- 3. CREATE FUNCTION TO GET CLERK USER ID
-- =====================================================
-- This function extracts the Clerk user ID from multiple sources:
-- 1. JWT claims (if Clerk JWT is passed to Supabase)
-- 2. Session variable (set by application code)
-- This allows RLS to work even if JWT isn't passed directly
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
DECLARE
  v_jwt_claim TEXT;
  v_session_var TEXT;
BEGIN
  -- Try to get from JWT claims first (if Clerk JWT is passed)
  BEGIN
    v_jwt_claim := current_setting('request.jwt.claims', true)::json->>'sub';
    IF v_jwt_claim IS NOT NULL AND v_jwt_claim != '' THEN
      RETURN v_jwt_claim;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- JWT not available, try session variable
      NULL;
  END;

  -- Fallback: Try to get from session variable (set by application)
  BEGIN
    v_session_var := current_setting('app.clerk_user_id', true);
    IF v_session_var IS NOT NULL AND v_session_var != '' THEN
      RETURN v_session_var;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Session variable not set
      NULL;
  END;

  -- Return NULL if neither source has the user ID
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 3B. CREATE FUNCTION TO SET CLERK USER ID IN SESSION (FOR RLS)
-- =====================================================
-- This function sets the Clerk user ID in the session for RLS policies to read
-- Called by application code before queries
CREATE OR REPLACE FUNCTION set_clerk_user_id(p_user_id TEXT)
RETURNS void AS $$
BEGIN
  -- Set session variable that get_clerk_user_id() can read
  PERFORM set_config('app.clerk_user_id', p_user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_clerk_user_id(TEXT) TO authenticated;

-- =====================================================
-- 4. ADD CLERK RLS POLICIES (ALONGSIDE EXISTING POLICIES)
-- =====================================================
-- NOTE: We're NOT dropping existing policies - keeping both sets active
-- This allows both Supabase Auth users AND Clerk users to work during migration
-- Policies are combined with OR, so either type can access their data
-- Policy names have "(Clerk)" suffix to avoid conflicts with existing policies

-- CLIENTS TABLE
-- Add Clerk policies alongside existing Supabase Auth policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' 
    AND policyname = 'Users can view their own client record (Clerk)'
  ) THEN
    CREATE POLICY "Users can view their own client record (Clerk)"
      ON clients FOR SELECT
      USING (clerk_user_id = get_clerk_user_id());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' 
    AND policyname = 'Users can update their own client record (Clerk)'
  ) THEN
    CREATE POLICY "Users can update their own client record (Clerk)"
      ON clients FOR UPDATE
      USING (clerk_user_id = get_clerk_user_id())
      WITH CHECK (clerk_user_id = get_clerk_user_id());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' 
    AND policyname = 'Allow client creation during signup (Clerk)'
  ) THEN
    CREATE POLICY "Allow client creation during signup (Clerk)"
      ON clients FOR INSERT
      WITH CHECK (clerk_user_id = get_clerk_user_id());
  END IF;
END $$;

-- LOYALTY_TRANSACTIONS TABLE
-- Add Clerk policy alongside existing Supabase Auth policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'loyalty_transactions' 
    AND policyname = 'Users can view their own transactions (Clerk)'
  ) THEN
    CREATE POLICY "Users can view their own transactions (Clerk)"
      ON loyalty_transactions FOR SELECT
      USING (
        client_id IN (
          SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
        )
      );
  END IF;
END $$;

-- BOOKINGS TABLE
-- Add Clerk policy alongside existing Supabase Auth policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' 
    AND policyname = 'Users can view their own bookings (Clerk)'
  ) THEN
    CREATE POLICY "Users can view their own bookings (Clerk)"
      ON bookings FOR SELECT
      USING (
        client_id IN (
          SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
        )
      );
  END IF;
END $$;

-- REFERRALS TABLE
-- Add Clerk policies alongside existing Supabase Auth policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'referrals' 
    AND policyname = 'Users can view referrals they created (Clerk)'
  ) THEN
    CREATE POLICY "Users can view referrals they created (Clerk)"
      ON referrals FOR SELECT
      USING (
        referrer_client_id IN (
          SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'referrals' 
    AND policyname = 'Users can view referrals where they are the referee (Clerk)'
  ) THEN
    CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
      ON referrals FOR SELECT
      USING (
        referee_client_id IN (
          SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'referrals' 
    AND policyname = 'Users can create referrals as referrer (Clerk)'
  ) THEN
    CREATE POLICY "Users can create referrals as referrer (Clerk)"
      ON referrals FOR INSERT
      WITH CHECK (
        referrer_client_id IN (
          SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
        )
      );
  END IF;
END $$;

-- REDEMPTIONS TABLE
-- Add Clerk policy alongside existing Supabase Auth policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'redemptions' 
    AND policyname = 'Users can view their own redemptions (Clerk)'
  ) THEN
    CREATE POLICY "Users can view their own redemptions (Clerk)"
      ON redemptions FOR SELECT
      USING (
        client_id IN (
          SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
        )
      );
  END IF;
END $$;

-- NOTIFICATIONS TABLE
-- Add Clerk policies alongside existing Supabase Auth policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications (Clerk)'
  ) THEN
    CREATE POLICY "Users can view their own notifications (Clerk)"
      ON notifications FOR SELECT
      USING (
        client_id IN (
          SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can update their own notifications (Clerk)'
  ) THEN
    CREATE POLICY "Users can update their own notifications (Clerk)"
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
  END IF;
END $$;

-- user_portal_access TABLE
-- Enable RLS if not already enabled (safe to run multiple times)
ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;

-- Add Clerk policy alongside existing Supabase Auth policy (if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_portal_access' 
    AND policyname = 'Users can view their own portal access (Clerk)'
  ) THEN
    CREATE POLICY "Users can view their own portal access (Clerk)"
      ON user_portal_access FOR SELECT
      USING (clerk_user_id = get_clerk_user_id());
  END IF;
END $$;

-- =====================================================
-- 5. CREATE FUNCTION TO LINK CLIENT BY EMAIL (CLERK VERSION)
-- =====================================================
-- This function links an existing client record to a Clerk user by email
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

-- =====================================================
-- NOTES
-- =====================================================
-- This migration:
-- 1. Adds clerk_user_id column to clients and user_portal_access tables
-- 2. Creates get_clerk_user_id() function to extract Clerk user ID from JWT
-- 3. ADDS NEW RLS policies for Clerk (does NOT drop existing Supabase Auth policies)
-- 4. Creates link_client_to_clerk_user() function for linking existing clients
--
-- IMPORTANT: 
-- - This migration keeps existing Supabase Auth policies active
-- - Both Supabase Auth and Clerk policies work together (OR logic)
-- - This allows gradual migration from Supabase Auth to Clerk
-- - After all users are migrated, you can drop the old Supabase Auth policies
-- - Clerk JWT must be configured to include user ID in 'sub' claim
-- - You may need to configure Clerk to pass the JWT to Supabase
-- - Test RLS policies after applying this migration
-- - Consider migrating existing users' auth_user_id to clerk_user_id
--
-- CLEANUP (After all users migrated):
-- After all users are migrated to Clerk, you can drop old Supabase Auth policies:
-- DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
-- DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
-- DROP POLICY IF EXISTS "Allow client creation during signup" ON clients;
-- (And similar for other tables)
