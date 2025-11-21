-- Migration: Add persistent referral codes per client
-- Each client should have ONE referral code they can reuse for multiple referrals

-- Step 1: Remove UNIQUE constraint from referrals.referral_code (codes are now reusable)
-- Multiple referral records can share the same code
ALTER TABLE referrals 
DROP CONSTRAINT IF EXISTS referrals_referral_code_key;

-- Step 2: Add referral_code column to clients table (unique per client)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_referral_code ON clients(referral_code) WHERE referral_code IS NOT NULL;

-- Step 3: Backfill existing referral codes from referrals table to clients table
-- This ensures existing users don't lose their codes
UPDATE clients c
SET referral_code = sub.referral_code
FROM (
    SELECT DISTINCT ON (referrer_client_id) 
        referrer_client_id,
        referral_code
    FROM referrals
    WHERE referral_code IS NOT NULL
    ORDER BY referrer_client_id, created_at DESC
) sub
WHERE c.id = sub.referrer_client_id
  AND c.referral_code IS NULL;

-- Function to get or create a referral code for a client
CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_existing_code TEXT;
BEGIN
    -- First, check if client already has a code stored in their record
    SELECT referral_code INTO v_existing_code
    FROM clients
    WHERE id = p_client_id
      AND referral_code IS NOT NULL;
    
    -- If they have one, return it
    IF v_existing_code IS NOT NULL THEN
        RETURN v_existing_code;
    END IF;
    
    -- Otherwise, generate a new unique code
    LOOP
        v_code := upper(substring(md5(random()::text || p_client_id::text || now()::text) from 1 for 8));
        -- Check if code already exists in clients or referrals (should be very rare)
        IF NOT EXISTS(
            SELECT 1 FROM clients WHERE referral_code = v_code
            UNION ALL
            SELECT 1 FROM referrals WHERE referral_code = v_code
        ) THEN
            -- Store the code in the client's record
            UPDATE clients
            SET referral_code = v_code
            WHERE id = p_client_id;
            
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function first (since we're changing the return type)
DROP FUNCTION IF EXISTS check_referral_validity(TEXT);

-- Update check_referral_validity to allow code reuse
-- Now validates that the code belongs to a valid referrer, not that it's unused
CREATE OR REPLACE FUNCTION check_referral_validity(p_referral_code TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    referral_id UUID,
    reason TEXT,
    referrer_client_id UUID
) 
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
AS $$
DECLARE
    v_referrer_client_id UUID;
    v_code_normalized TEXT;
    v_client_exists BOOLEAN;
BEGIN
    -- Normalize the input code (uppercase, trim)
    v_code_normalized := UPPER(TRIM(p_referral_code));
    
    -- PRIORITY 1: Check clients table first (primary storage)
    -- If found here, client definitely exists (we just queried it)
    SELECT c.id INTO v_referrer_client_id
    FROM clients c
    WHERE UPPER(TRIM(c.referral_code)) = v_code_normalized
      AND c.referral_code IS NOT NULL
    LIMIT 1;
    
    -- If found in clients table, it's valid (client exists by definition)
    IF v_referrer_client_id IS NOT NULL THEN
        RETURN QUERY SELECT 
            TRUE::BOOLEAN as is_valid, 
            NULL::UUID as referral_id, 
            'Valid referral code'::TEXT as reason, 
            v_referrer_client_id as referrer_client_id;
        RETURN;
    END IF;
    
    -- PRIORITY 2: Check referrals table (backward compatibility)
    -- Only if not found in clients table
    SELECT DISTINCT r.referrer_client_id INTO v_referrer_client_id
    FROM referrals r
    WHERE UPPER(TRIM(r.referral_code)) = v_code_normalized
      AND r.referral_code IS NOT NULL
    LIMIT 1;
    
    -- If found in referrals, verify the referrer client still exists
    IF v_referrer_client_id IS NOT NULL THEN
        -- Verify client exists (use COUNT for more reliable check)
        SELECT COUNT(*) > 0 INTO v_client_exists
        FROM clients c2
        WHERE c2.id = v_referrer_client_id;
        
        IF v_client_exists THEN
            -- Client exists - valid
            RETURN QUERY SELECT 
                TRUE::BOOLEAN as is_valid, 
                NULL::UUID as referral_id, 
                'Valid referral code'::TEXT as reason, 
                v_referrer_client_id as referrer_client_id;
            RETURN;
        ELSE
            -- Client doesn't exist - invalid
            RETURN QUERY SELECT 
                FALSE::BOOLEAN as is_valid, 
                NULL::UUID as referral_id, 
                'Referrer client not found'::TEXT as reason, 
                v_referrer_client_id as referrer_client_id;
            RETURN;
        END IF;
    END IF;
    
    -- Code doesn't exist in either table
    RETURN QUERY SELECT 
        FALSE::BOOLEAN as is_valid, 
        NULL::UUID as referral_id, 
        'Referral code not found'::TEXT as reason, 
        NULL::UUID as referrer_client_id;
END;
$$ LANGUAGE plpgsql;

-- Drop process_referral_signup first (since it depends on check_referral_validity)
DROP FUNCTION IF EXISTS process_referral_signup(TEXT, UUID, TEXT, TEXT, TEXT, UUID);

-- Update process_referral_signup to work with reusable codes
-- Now creates/updates referral record based on email, not specific referral_id
CREATE OR REPLACE FUNCTION process_referral_signup(
    p_referral_code TEXT,
    p_auth_user_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_team_id UUID DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
AS $$
DECLARE
    v_validity RECORD;
    v_referral_id UUID;
    v_existing_referral RECORD;
    v_client_id UUID;
    v_transaction_id UUID;
    v_referee_bonus INTEGER;
BEGIN
    -- Validate referral code
    SELECT * INTO v_validity
    FROM check_referral_validity(p_referral_code);
    
    IF NOT v_validity.is_valid THEN
        RAISE EXCEPTION 'Invalid referral: %', v_validity.reason;
    END IF;
    
    -- Check if referral record already exists for this email (if they were invited)
    SELECT * INTO v_existing_referral
    FROM referrals
    WHERE referral_code = p_referral_code
      AND referee_email = p_email
      AND referrer_client_id = v_validity.referrer_client_id
    LIMIT 1;
    
    -- Get referee bonus from settings
    SELECT referral_bonus_referee INTO v_referee_bonus
    FROM loyalty_settings WHERE id = 1;
    
    -- Check if client already exists
    SELECT id INTO v_client_id
    FROM clients
    WHERE email = p_email;
    
    -- Create or update client record
    -- Note: auth user should already be created by Supabase Auth before calling this
    IF v_client_id IS NOT NULL THEN
        -- Client exists - update it with referral info
        UPDATE clients
        SET 
            user_id = p_auth_user_id, -- Link to their new auth account
            team_id = COALESCE(team_id, p_team_id, '0cef0867-1b40-4de1-9936-16b867a753d7'), -- Preserve existing or use provided/default
            first_name = COALESCE(NULLIF(first_name, ''), p_first_name),
            last_name = COALESCE(NULLIF(last_name, ''), p_last_name),
            phone = COALESCE(phone, p_phone),
            loyalty_enrolled = TRUE,
            loyalty_enrolled_at = COALESCE(loyalty_enrolled_at, NOW()),
            loyalty_signup_source = 'referral',
            updated_at = NOW()
        WHERE id = v_client_id;
    ELSE
        -- New client - create record
        INSERT INTO clients (
            user_id,
            team_id,
            email,
            first_name,
            last_name,
            phone,
            status,
            loyalty_enrolled,
            loyalty_enrolled_at,
            loyalty_signup_source,
            points_balance
        ) VALUES (
            p_auth_user_id,
            COALESCE(p_team_id, '0cef0867-1b40-4de1-9936-16b867a753d7'),
            p_email,
            p_first_name,
            p_last_name,
            p_phone,
            'active',
            TRUE,
            NOW(),
            'referral',
            0
        )
        RETURNING id INTO v_client_id;
    END IF;
    
    -- Award referee signup bonus (100 points immediately)
    -- Only award if they haven't already received referral signup bonus
    -- Check if there's already a completed referral signup for this client
    IF NOT EXISTS(
        SELECT 1 FROM referrals
        WHERE referee_client_id = v_client_id
          AND referee_signup_points > 0
          AND status IN ('signed_up', 'completed')
    ) THEN
        v_transaction_id := update_client_points(
            v_client_id,
            v_referee_bonus,
            'earn',
            'referral_signup',
            'Referral signup bonus',
            NULL
        );
    ELSE
        -- They already got referral bonus, don't award again
        v_transaction_id := NULL;
    END IF;
    
    -- Update existing referral record OR create new one
    IF v_existing_referral IS NOT NULL THEN
        -- Update existing referral (they were invited)
        UPDATE referrals
        SET 
            referee_client_id = v_client_id,
            status = 'signed_up',
            referee_signup_points = COALESCE(v_existing_referral.referee_signup_points, v_referee_bonus),
            referee_signup_transaction_id = COALESCE(v_transaction_id, v_existing_referral.referee_signup_transaction_id),
            signed_up_at = COALESCE(signed_up_at, NOW())
        WHERE id = v_existing_referral.id
        RETURNING id INTO v_referral_id;
    ELSE
        -- Create new referral record (they used link directly without being invited)
        INSERT INTO referrals (
            referrer_client_id,
            referee_email,
            referee_client_id,
            referral_code,
            referral_link,
            status,
            referee_signup_points,
            referee_signup_transaction_id,
            signed_up_at
        ) VALUES (
            v_validity.referrer_client_id,
            p_email,
            v_client_id,
            p_referral_code,
            NULL, -- Link not needed for direct signups
            'signed_up',
            v_referee_bonus,
            v_transaction_id,
            NOW()
        )
        RETURNING id INTO v_referral_id;
    END IF;
    
    -- Create notification for referrer
    INSERT INTO notifications (
        client_id,
        title,
        message,
        notification_type
    ) VALUES (
        v_validity.referrer_client_id,
        'Friend Signed Up!',
        p_first_name || ' has signed up using your referral link. You''ll get 100 points when they make their first booking!',
        'referral_signup'
    );
    
    -- Create notification for referee
    INSERT INTO notifications (
        client_id,
        title,
        message,
        notification_type
    ) VALUES (
        v_client_id,
        'Welcome Bonus!',
        'You received ' || v_referee_bonus || ' bonus points for signing up with a referral code!',
        'points_earned'
    );
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_referral_code IS 'Gets or creates a persistent referral code for a client. Codes can be reused for multiple referrals.';
COMMENT ON FUNCTION check_referral_validity IS 'Validates referral code and returns referrer info. Codes are reusable - validates referrer eligibility, not single-use status.';
COMMENT ON FUNCTION process_referral_signup IS 'Processes referral signup with reusable codes. Creates or updates referral record based on email.';

