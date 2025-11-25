-- Migration: Create function to link existing client records to auth users
-- This function bypasses RLS to allow linking client records by email
-- Used when a client record exists but isn't linked to the current auth user

-- =====================================================
-- LINK_CLIENT_TO_USER FUNCTION
-- =====================================================
-- This function allows linking an existing client record to an auth user
-- It's used when a client record exists with an email but no auth_user_id
-- or when the auth_user_id doesn't match the current auth user
-- 
-- Security: Uses SECURITY DEFINER to bypass RLS, but validates:
-- 1. The email matches the auth user's email
-- 2. The client record exists with that email
-- 3. Only updates auth_user_id, preserves other data (including user_id)

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
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
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
    -- Only update auth_user_id and updated_at to preserve other data (including user_id)
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
-- This function is safe because:
-- 1. It validates that the email matches the auth user's email
-- 2. It only updates auth_user_id and updated_at (preserves other data including user_id)
-- 3. It uses SECURITY DEFINER to bypass RLS (necessary for linking)
-- 4. It's called from server-side code with proper validation
--
-- The auth_user_id column is used for portal authentication and RLS policies.
-- The user_id column is preserved for backward compatibility with other systems.
--
-- Usage in application code:
-- SELECT * FROM link_client_to_user(auth.uid());
-- Returns the client record if found and linked, empty result if not found

