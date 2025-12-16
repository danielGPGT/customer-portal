-- Migration: Update process_referral_signup to set auth_user_id
-- This ensures the referral signup flow also sets auth_user_id for RLS compatibility

-- Drop and recreate the function with auth_user_id support
DROP FUNCTION IF EXISTS process_referral_signup(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION process_referral_signup(
    p_referral_code TEXT,
    p_auth_user_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT,
    p_team_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_validity RECORD;
    v_existing_referral RECORD;
    v_client_id UUID;
    v_referral_id UUID;
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
    IF v_client_id IS NOT NULL THEN
        -- Client exists - update it with referral info
        UPDATE clients
        SET 
            user_id = p_auth_user_id,  -- Keep user_id for backward compatibility
            auth_user_id = p_auth_user_id,  -- Use auth_user_id for portal access
            team_id = COALESCE(team_id, p_team_id, '0cef0867-1b40-4de1-9936-16b867a753d7'),
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
            auth_user_id,  -- Added auth_user_id
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
            p_auth_user_id,  -- Keep user_id for backward compatibility
            p_auth_user_id,  -- Use auth_user_id for portal access
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
    
    -- Award referee signup bonus (only if not already received)
    IF NOT EXISTS(
        SELECT 1 FROM referrals
        WHERE referee_client_id = v_client_id
          AND referee_signup_points > 0
          AND status IN ('signed_up', 'completed')
    ) THEN
        v_transaction_id := update_client_points(
            v_client_id, v_referee_bonus, 'earn', 'referral_signup',
            'Referral signup bonus', NULL
        );
    END IF;
    
    -- Update existing referral OR create new one
    IF v_existing_referral IS NOT NULL THEN
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
        INSERT INTO referrals (
            referrer_client_id, referee_email, referee_client_id, referral_code,
            referral_link, status, referee_signup_points, referee_signup_transaction_id, signed_up_at
        ) VALUES (
            v_validity.referrer_client_id, p_email, v_client_id, p_referral_code,
            NULL, 'signed_up', v_referee_bonus, v_transaction_id, NOW()
        )
        RETURNING id INTO v_referral_id;
    END IF;
    
    -- Create notifications
    INSERT INTO notifications (client_id, title, message, notification_type)
    VALUES 
        (v_validity.referrer_client_id, 'Friend Signed Up!', 
         p_first_name || ' has signed up using your referral link. You''ll get 100 points when they make their first booking!',
         'referral_signup'),
        (v_client_id, 'Welcome Bonus!',
         'You received ' || v_referee_bonus || ' bonus points for signing up with a referral code!',
         'points_earned');
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_referral_signup(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;




