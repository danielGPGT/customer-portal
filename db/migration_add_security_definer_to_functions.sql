-- Migration: Add SECURITY DEFINER to system functions
-- These functions need elevated privileges to bypass RLS when inserting/updating data
-- This is safe because the functions validate inputs and implement business logic

-- =====================================================
-- 0. PROCESS_REFERRAL_SIGNUP FUNCTION
-- =====================================================
-- This function inserts into referrals, notifications, and updates clients
-- It needs SECURITY DEFINER to bypass RLS
-- Note: This function is also updated in migration_add_persistent_referral_codes.sql
-- This is a duplicate update to ensure it has SECURITY DEFINER
DROP FUNCTION IF EXISTS process_referral_signup(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID);

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
    IF v_client_id IS NOT NULL THEN
        UPDATE clients
        SET 
            user_id = p_auth_user_id,
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
        INSERT INTO clients (
            user_id, team_id, email, first_name, last_name, phone,
            status, loyalty_enrolled, loyalty_enrolled_at, loyalty_signup_source, points_balance
        ) VALUES (
            p_auth_user_id,
            COALESCE(p_team_id, '0cef0867-1b40-4de1-9936-16b867a753d7'),
            p_email, p_first_name, p_last_name, p_phone,
            'active', TRUE, NOW(), 'referral', 0
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. UPDATE_CLIENT_POINTS FUNCTION
-- =====================================================
-- This function inserts into loyalty_transactions and updates clients
-- It needs SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS update_client_points(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB, UUID);

CREATE OR REPLACE FUNCTION update_client_points(
    p_client_id UUID,
    p_points_delta INTEGER,
    p_transaction_type TEXT,
    p_source_type TEXT,
    p_description TEXT,
    p_source_reference_id TEXT DEFAULT NULL,
    p_purchase_amount NUMERIC DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
AS $$
DECLARE
    v_transaction_id UUID;
    v_new_balance INTEGER;
    v_current_balance INTEGER;
    v_enrolled BOOLEAN;
BEGIN
    -- Lock the client row to prevent race conditions
    SELECT points_balance, loyalty_enrolled INTO v_current_balance, v_enrolled
    FROM clients
    WHERE id = p_client_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client not found: %', p_client_id;
    END IF;
    
    -- Check if enrolled
    IF v_enrolled IS NOT TRUE THEN
        RAISE EXCEPTION 'Client not enrolled in loyalty program: %', p_client_id;
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance + p_points_delta;
    
    -- Validate balance won't go negative
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient points. Current: %, Requested: %', 
            v_current_balance, ABS(p_points_delta);
    END IF;
    
    -- Update client balance and lifetime totals
    UPDATE clients
    SET 
        points_balance = v_new_balance,
        lifetime_points_earned = CASE 
            WHEN p_points_delta > 0 THEN lifetime_points_earned + p_points_delta 
            ELSE lifetime_points_earned 
        END,
        lifetime_points_spent = CASE 
            WHEN p_points_delta < 0 THEN lifetime_points_spent + ABS(p_points_delta)
            ELSE lifetime_points_spent 
        END,
        updated_at = NOW()
    WHERE id = p_client_id;
    
    -- Create transaction record
    INSERT INTO loyalty_transactions (
        client_id,
        transaction_type,
        points,
        balance_after,
        source_type,
        source_reference_id,
        purchase_amount,
        description,
        metadata,
        created_by
    ) VALUES (
        p_client_id,
        p_transaction_type,
        p_points_delta,
        v_new_balance,
        p_source_type,
        p_source_reference_id,
        p_purchase_amount,
        p_description,
        p_metadata,
        p_created_by
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. ENROLL_CLIENT_IN_LOYALTY FUNCTION
-- =====================================================
-- This function updates clients and inserts into notifications
-- It needs SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS enroll_client_in_loyalty(UUID, TEXT);

CREATE OR REPLACE FUNCTION enroll_client_in_loyalty(
    p_client_id UUID,
    p_signup_source TEXT DEFAULT 'self_signup'
)
RETURNS BOOLEAN 
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
AS $$
DECLARE
    v_already_enrolled BOOLEAN;
BEGIN
    -- Check if already enrolled
    SELECT loyalty_enrolled INTO v_already_enrolled
    FROM clients
    WHERE id = p_client_id;
    
    IF v_already_enrolled = TRUE THEN
        RETURN FALSE; -- Already enrolled
    END IF;
    
    -- Enroll client
    UPDATE clients
    SET 
        loyalty_enrolled = TRUE,
        loyalty_enrolled_at = NOW(),
        loyalty_signup_source = p_signup_source,
        points_balance = 0,
        lifetime_points_earned = 0,
        lifetime_points_spent = 0,
        updated_at = NOW()
    WHERE id = p_client_id;
    
    -- Create notification
    INSERT INTO notifications (
        client_id,
        title,
        message,
        notification_type
    ) VALUES (
        p_client_id,
        'Welcome to Loyalty Program!',
        'You''re now enrolled in our loyalty program. Start earning points on your bookings!',
        'system'
    );
    
    RETURN TRUE; -- Successfully enrolled
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. PROCESS_FIRST_LOYALTY_BOOKING FUNCTION
-- =====================================================
-- This function calls update_client_points and inserts into notifications
-- It needs SECURITY DEFINER to bypass RLS
-- Note: This function might reference bookings_cache which was removed
-- Update the function signature if needed based on your schema

-- =====================================================
-- 4. HANDLE_BOOKING_CANCELLATION FUNCTION
-- =====================================================
-- This function calls update_client_points for refunds and inserts into notifications
-- It needs SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS handle_booking_cancellation(UUID);

CREATE OR REPLACE FUNCTION handle_booking_cancellation(p_booking_id UUID)
RETURNS void 
SECURITY DEFINER  -- Run with function owner's privileges (bypasses RLS)
AS $$
DECLARE
    v_booking RECORD;
    v_client_id UUID;
    v_booking_reference TEXT;
    v_points_earned INTEGER;
    v_points_used INTEGER;
BEGIN
    -- Get booking details from bookings table
    SELECT 
        b.id,
        b.client_id,
        b.booking_reference,
        b.points_earned,
        b.status
    INTO v_booking
    FROM bookings b
    WHERE b.id = p_booking_id
      AND b.deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    v_client_id := v_booking.client_id;
    v_booking_reference := v_booking.booking_reference;
    v_points_earned := COALESCE(v_booking.points_earned, 0);
    
    -- Get redemption for this booking to find points_used
    SELECT COALESCE(SUM(points_redeemed), 0) INTO v_points_used
    FROM redemptions
    WHERE booking_id = p_booking_id
      AND status = 'applied';
    
    -- Also check booking.points_used as fallback
    IF v_points_used = 0 THEN
        SELECT COALESCE(points_used, 0) INTO v_points_used
        FROM bookings
        WHERE id = p_booking_id;
    END IF;
    
    -- Refund points that were earned
    IF v_points_earned > 0 THEN
        PERFORM update_client_points(
            v_client_id,
            -v_points_earned,
            'refund',
            'refund',
            'Points deducted due to cancelled booking ' || v_booking_reference,
            p_booking_id::TEXT
        );
    END IF;
    
    -- Refund points that were spent
    IF v_points_used > 0 THEN
        PERFORM update_client_points(
            v_client_id,
            v_points_used,
            'refund',
            'refund',
            'Points refunded from cancelled booking ' || v_booking_reference,
            p_booking_id::TEXT
        );
        
        -- Update redemption record
        UPDATE redemptions
        SET 
            status = 'refunded',
            refunded_at = NOW()
        WHERE booking_id = p_booking_id
          AND status = 'applied';
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        client_id,
        title,
        message,
        notification_type
    ) VALUES (
        v_client_id,
        'Booking Cancelled',
        'Your booking ' || v_booking_reference || ' has been cancelled. Points have been refunded.',
        'booking_cancelled'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this migration, verify:
-- 1. Signup with referral code works
-- 2. Points are awarded correctly
-- 3. Transactions are created in loyalty_transactions
-- 4. Users can still only see their own transactions (RLS still works for SELECT)

-- =====================================================
-- NOTES
-- =====================================================
-- SECURITY DEFINER functions:
-- - Run with the privileges of the function owner (typically postgres/supabase_admin)
-- - Bypass RLS policies
-- - Should only be used for system functions that implement business logic
-- - Must validate all inputs to prevent security issues
-- - Should not expose sensitive data unnecessarily

-- The update_client_points function is safe because:
-- - It validates the client_id exists
-- - It checks the client is enrolled
-- - It validates the balance won't go negative
-- - It only inserts transactions for valid clients
-- - It's called from other validated functions (process_referral_signup, etc.)

