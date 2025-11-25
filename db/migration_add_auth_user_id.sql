-- Migration: Add auth_user_id column to clients table
-- This allows linking client records to auth users without conflicting with existing user_id
-- The auth_user_id column is specifically for portal authentication linking

-- =====================================================
-- 1. ADD AUTH_USER_ID COLUMN
-- =====================================================
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- =====================================================
-- 2. UPDATE RLS POLICIES TO USE AUTH_USER_ID
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
DROP POLICY IF EXISTS "Allow client creation during signup" ON clients;

-- Create new policies using auth_user_id
-- Users can view their own client record (by auth_user_id)
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Users can update their own client record (by auth_user_id)
CREATE POLICY "Users can update their own client record"
  ON clients FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Allow INSERT during signup (handled by SECURITY DEFINER functions)
CREATE POLICY "Allow client creation during signup"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- =====================================================
-- 3. UPDATE OTHER RLS POLICIES THAT REFERENCE USER_ID
-- =====================================================
-- Update loyalty_transactions policy
DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;
CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- Update referrals policies
DROP POLICY IF EXISTS "Users can view referrals they created" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer" ON referrals;

CREATE POLICY "Users can view referrals they created"
  ON referrals FOR SELECT
  USING (
    referrer_client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view referrals where they are the referee"
  ON referrals FOR SELECT
  USING (
    referee_client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create referrals as referrer"
  ON referrals FOR INSERT
  WITH CHECK (
    referrer_client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- Update redemptions policy
DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;
CREATE POLICY "Users can view their own redemptions"
  ON redemptions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- Update notifications policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. CREATE FUNCTION TO LINK CLIENT BY EMAIL
-- =====================================================
-- Drop existing function if it exists (needed when changing return type)
DROP FUNCTION IF EXISTS link_client_to_user(UUID);

CREATE OR REPLACE FUNCTION link_client_to_user(
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    auth_user_id UUID,
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
    v_auth_email TEXT;
BEGIN
    -- Get the email from auth.users
    SELECT au.email INTO v_auth_email
    FROM auth.users au
    WHERE au.id = p_user_id;
    
    -- Verify the auth user exists and has an email
    IF v_auth_email IS NULL THEN
        RETURN;  -- Return empty result
    END IF;
    
    -- Find the client record by email (bypassing RLS) and get its ID
    SELECT c.id INTO v_client_id
    FROM clients c
    WHERE c.email = v_auth_email
    LIMIT 1;
    
    -- If client doesn't exist, return empty
    IF v_client_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Update the client record to link it to the auth user via auth_user_id
    -- Only update auth_user_id and updated_at to preserve other data
    UPDATE clients
    SET 
        auth_user_id = p_user_id,
        updated_at = NOW()
    WHERE clients.id = v_client_id;
    
    -- Return the updated client record by querying it directly
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.auth_user_id,
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
GRANT EXECUTE ON FUNCTION link_client_to_user(UUID) TO authenticated;

-- =====================================================
-- NOTES
-- =====================================================
-- This migration:
-- 1. Adds auth_user_id column for portal authentication linking
-- 2. Updates all RLS policies to use auth_user_id instead of user_id
-- 3. Creates a function to link clients by email using auth_user_id
-- 4. Preserves existing user_id column (may be used for other purposes)
--
-- The auth_user_id column:
-- - Is nullable (allows existing records without auth linking)
-- - Has a foreign key to auth.users(id)
-- - Is indexed for performance
-- - Is used by RLS policies for access control
--
-- Usage in application code:
-- SELECT * FROM link_client_to_user(auth.uid());
-- Returns the client record if found and linked, empty result if not found

