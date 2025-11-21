-- Fix: Add SECURITY DEFINER to get_or_create_referral_code function
-- This bypasses RLS and makes the function much faster

CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_client_id UUID)
RETURNS TEXT 
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
AS $$
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

COMMENT ON FUNCTION get_or_create_referral_code IS 'Gets or creates a persistent referral code for a client. Codes can be reused for multiple referrals. Uses SECURITY DEFINER for performance.';

