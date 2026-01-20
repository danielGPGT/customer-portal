-- Add referral points reversal when a referred user's booking is cancelled
-- When a booking is cancelled, if it was the first booking that triggered referral completion,
-- we need to reverse the 100 points that were given to the referrer

CREATE OR REPLACE FUNCTION handle_booking_cancellation(p_booking_id UUID)
RETURNS void AS $$
DECLARE
    v_booking RECORD;
    v_client_id UUID;
    v_booking_reference TEXT;
    v_points_earned INTEGER;
    v_points_used INTEGER;
    v_referral RECORD;
    v_referrer_bonus INTEGER;
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
    
    -- Check if this booking was the first booking that completed a referral
    -- If so, reverse the referral points given to the referrer
    SELECT * INTO v_referral
    FROM referrals
    WHERE first_booking_id = p_booking_id
      AND status = 'completed'
      AND referrer_booking_transaction_id IS NOT NULL
      AND referrer_booking_points > 0;
    
    IF FOUND THEN
        -- Get the referrer bonus amount (should be 100, but get from referral record)
        v_referrer_bonus := v_referral.referrer_booking_points;
        
        -- Reverse the points by deducting them from the referrer
        PERFORM update_client_points(
            v_referral.referrer_client_id,
            -v_referrer_bonus,
            'refund',
            'referral_booking_cancelled',
            'Referral points reversed - ' || (SELECT first_name FROM clients WHERE id = v_client_id) || '''s booking was cancelled',
            v_referral.id::TEXT
        );
        
        -- Update referral status to cancelled
        UPDATE referrals
        SET 
            status = 'cancelled',
            updated_at = NOW()
        WHERE id = v_referral.id;
        
        -- Create notification for referrer
        INSERT INTO notifications (
            client_id,
            title,
            message,
            notification_type
        ) VALUES (
            v_referral.referrer_client_id,
            'Referral Points Reversed',
            'The booking that completed your referral has been cancelled. ' || v_referrer_bonus || ' points have been deducted from your account.',
            'system'
        );
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

COMMENT ON FUNCTION handle_booking_cancellation IS 'Handles booking cancellation: refunds points earned/spent by customer, and reverses referral points if this was the first booking that completed a referral.';
