-- =====================================================
-- MIGRATION: Remove bookings_cache, Add Loyalty Fields to bookings
-- =====================================================
-- Date: January 2025
-- Purpose: Consolidate loyalty data into bookings table directly
-- 
-- This migration:
-- 1. Adds loyalty columns to bookings table
-- 2. Updates all functions that reference bookings_cache
-- 3. Updates all views that reference bookings_cache
-- 4. Drops triggers related to bookings_cache
-- 5. Drops bookings_cache table
-- NOTE: No data migration needed - bookings_cache is empty
--
-- WARNING: Backup your database before running this migration!
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Add Loyalty Columns to bookings Table
-- =====================================================

-- Add loyalty point columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0 CHECK (points_earned >= 0);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0 CHECK (points_used >= 0);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_applied NUMERIC(10, 2) DEFAULT 0 CHECK (discount_applied >= 0);

-- Add first loyalty booking flag
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_first_loyalty_booking BOOLEAN DEFAULT FALSE;

-- Add transaction references
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS earn_transaction_id UUID REFERENCES loyalty_transactions(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS spend_transaction_id UUID REFERENCES loyalty_transactions(id);

-- Add comments
COMMENT ON COLUMN bookings.points_earned IS 'Points earned from this booking (calculated from total_price)';
COMMENT ON COLUMN bookings.points_used IS 'Points used/redempted on this booking (from redemptions)';
COMMENT ON COLUMN bookings.discount_applied IS 'Discount amount applied from points redemption';
COMMENT ON COLUMN bookings.is_first_loyalty_booking IS 'Flag indicating if this was the customer''s first loyalty booking';
COMMENT ON COLUMN bookings.earn_transaction_id IS 'Reference to loyalty_transactions record for points earned';
COMMENT ON COLUMN bookings.spend_transaction_id IS 'Reference to loyalty_transactions record for points spent (via redemption)';

-- Add indexes for loyalty fields
CREATE INDEX IF NOT EXISTS idx_bookings_points_earned ON bookings(points_earned) WHERE points_earned > 0;
CREATE INDEX IF NOT EXISTS idx_bookings_points_used ON bookings(points_used) WHERE points_used > 0;
CREATE INDEX IF NOT EXISTS idx_bookings_is_first_loyalty_booking ON bookings(is_first_loyalty_booking) WHERE is_first_loyalty_booking = TRUE;
CREATE INDEX IF NOT EXISTS idx_bookings_earn_transaction_id ON bookings(earn_transaction_id) WHERE earn_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_spend_transaction_id ON bookings(spend_transaction_id) WHERE spend_transaction_id IS NOT NULL;

-- =====================================================
-- STEP 2: Migrate Data from bookings_cache to bookings
-- =====================================================

-- NOTE: No data migration needed - bookings_cache is empty
-- All new bookings will have loyalty data stored directly in bookings table

-- =====================================================
-- STEP 3: Update Functions That Reference bookings_cache
-- =====================================================

-- Update handle_booking_cancellation function
CREATE OR REPLACE FUNCTION handle_booking_cancellation(p_booking_id UUID)
RETURNS void AS $$
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
        'Your booking ' || v_booking_reference || ' has been cancelled. Points have been refunded to your account.',
        'booking_cancelled'
    );
    
END;
$$ LANGUAGE plpgsql;

-- Update process_first_loyalty_booking function
CREATE OR REPLACE FUNCTION process_first_loyalty_booking(
    p_client_id UUID,
    p_booking_id UUID,
    p_booking_reference TEXT,
    p_booking_amount NUMERIC
)
RETURNS void AS $$
DECLARE
    v_referral RECORD;
    v_transaction_id UUID;
    v_referrer_bonus INTEGER;
    v_points_earned INTEGER;
    v_enrolled BOOLEAN;
    v_first_loyalty_booking TIMESTAMP;
BEGIN
    -- Check if client is enrolled in loyalty
    SELECT loyalty_enrolled, first_loyalty_booking_at 
    INTO v_enrolled, v_first_loyalty_booking
    FROM clients
    WHERE id = p_client_id;
    
    -- If not enrolled, auto-enroll them now
    IF v_enrolled IS NOT TRUE THEN
        PERFORM enroll_client_in_loyalty(p_client_id, 'auto_enrolled');
        v_enrolled := TRUE;
        v_first_loyalty_booking := NULL;
    END IF;
    
    -- Calculate and award points for the purchase
    v_points_earned := calculate_points_from_purchase(p_booking_amount);
    
    v_transaction_id := update_client_points(
        p_client_id,
        v_points_earned,
        'earn',
        'purchase',
        'Points earned from booking ' || p_booking_reference,
        p_booking_id::TEXT,
        p_booking_amount
    );
    
    -- Update booking with loyalty data
    UPDATE bookings
    SET 
        earn_transaction_id = v_transaction_id,
        points_earned = v_points_earned,
        is_first_loyalty_booking = (v_first_loyalty_booking IS NULL),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Update client first booking status
    IF v_first_loyalty_booking IS NULL THEN
        UPDATE clients
        SET first_loyalty_booking_at = NOW()
        WHERE id = p_client_id;
    END IF;
    
    -- Check if this client was referred
    SELECT * INTO v_referral
    FROM referrals
    WHERE referee_client_id = p_client_id
      AND status = 'signed_up';
    
    IF FOUND THEN
        -- Get referrer bonus from settings
        SELECT referral_bonus_referrer INTO v_referrer_bonus
        FROM loyalty_settings WHERE id = 1;
        
        -- Award points to the referrer
        v_transaction_id := update_client_points(
            v_referral.referrer_client_id,
            v_referrer_bonus,
            'earn',
            'referral_booking',
            'Referral completed - ' || (SELECT first_name FROM clients WHERE id = p_client_id) || ' made their first booking',
            v_referral.id::TEXT
        );
        
        -- Update referral status
        UPDATE referrals
        SET 
            status = 'completed',
            referrer_booking_points = v_referrer_bonus,
            referrer_booking_transaction_id = v_transaction_id,
            first_booking_id = p_booking_id,
            first_booking_reference = p_booking_reference,
            completed_at = NOW()
        WHERE id = v_referral.id;
        
        -- Create notification for referrer
        INSERT INTO notifications (
            client_id,
            title,
            message,
            notification_type
        ) VALUES (
            v_referral.referrer_client_id,
            'Referral Bonus Earned!',
            'Your friend has made their first booking! You''ve earned ' || v_referrer_bonus || ' bonus points.',
            'referral_completed'
        );
    END IF;
    
    -- Create notification for customer
    INSERT INTO notifications (
        client_id,
        title,
        message,
        notification_type
    ) VALUES (
        p_client_id,
        'Points Earned!',
        'You''ve earned ' || v_points_earned || ' points from your booking!',
        'points_earned'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: Update Views That Reference bookings_cache
-- =====================================================

-- Update loyalty_customer_summary view
CREATE OR REPLACE VIEW loyalty_customer_summary AS
SELECT 
    c.id,
    c.user_id,
    c.team_id,
    c.email,
    c.first_name,
    c.last_name,
    c.phone,
    c.points_balance,
    c.lifetime_points_earned,
    c.lifetime_points_spent,
    c.loyalty_enrolled_at as member_since,
    c.loyalty_signup_source,
    c.first_loyalty_booking_at,
    c.status,
    c.created_at as client_created_at,
    
    COUNT(DISTINCT CASE WHEN lt.transaction_type = 'earn' THEN lt.id END) as total_earn_transactions,
    COUNT(DISTINCT CASE WHEN lt.transaction_type = 'spend' THEN lt.id END) as total_spend_transactions,
    COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as successful_referrals,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0) as total_spend,
    MAX(b.confirmed_at) as last_booking_date
    
FROM clients c
LEFT JOIN loyalty_transactions lt ON c.id = lt.client_id
LEFT JOIN referrals r ON c.id = r.referrer_client_id
LEFT JOIN bookings b ON c.id = b.client_id 
    AND b.status IN ('confirmed', 'completed')
    AND b.deleted_at IS NULL
WHERE c.loyalty_enrolled = TRUE
GROUP BY c.id;

-- =====================================================
-- STEP 5: Update Trigger for Booking Status Changes
-- =====================================================

-- Replace sync_booking_status_to_cache with direct cancellation handler
DROP TRIGGER IF EXISTS sync_booking_status ON bookings;
DROP FUNCTION IF EXISTS sync_booking_status_to_cache();

-- Create new trigger for booking status changes
CREATE OR REPLACE FUNCTION handle_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If booking is cancelled, trigger refund handling
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        PERFORM handle_booking_cancellation(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_status_change
AFTER UPDATE OF status ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION handle_booking_status_change();

-- =====================================================
-- STEP 6: Drop bookings_cache Related Objects
-- =====================================================

-- Drop trigger (if exists)
DROP TRIGGER IF EXISTS sync_booking_status ON bookings;
DROP TRIGGER IF EXISTS update_bookings_cache_updated_at ON bookings_cache;
DROP FUNCTION IF EXISTS sync_booking_status_to_cache();

-- Drop indexes (will be dropped with table, but explicit for clarity)
-- Note: Indexes are automatically dropped when table is dropped

-- Drop bookings_cache table (only if it exists)
-- NOTE: No data to migrate - table is empty
DROP TABLE IF EXISTS bookings_cache CASCADE;

-- =====================================================
-- STEP 7: Add Function to Sync Redemption Data to bookings
-- =====================================================

-- Create function to update bookings when redemption is applied
CREATE OR REPLACE FUNCTION sync_redemption_to_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points_used INTEGER;
    v_total_discount NUMERIC;
    v_spend_transaction_id UUID;
BEGIN
    -- Only process if booking_id is set
    IF COALESCE(NEW.booking_id, OLD.booking_id) IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Calculate total points_used and discount_applied from all applied redemptions
    -- This handles multiple redemptions on the same booking correctly
    SELECT 
        COALESCE(SUM(points_redeemed), 0),
        COALESCE(SUM(discount_amount), 0),
        MAX(transaction_id) -- Use the most recent transaction ID
    INTO v_total_points_used, v_total_discount, v_spend_transaction_id
    FROM redemptions
    WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
      AND status = 'applied';
    
    -- Update booking with totals
    UPDATE bookings
    SET 
        points_used = v_total_points_used,
        discount_applied = v_total_discount,
        spend_transaction_id = v_spend_transaction_id,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for redemptions
CREATE TRIGGER sync_redemption_to_booking_trigger
AFTER INSERT OR UPDATE OF status, booking_id ON redemptions
FOR EACH ROW
EXECUTE FUNCTION sync_redemption_to_booking();

-- Sync existing redemptions to bookings (for bookings that already have redemptions)
UPDATE bookings b
SET 
    points_used = COALESCE(
        (SELECT SUM(points_redeemed) 
         FROM redemptions 
         WHERE booking_id = b.id AND status = 'applied'), 0
    ),
    discount_applied = COALESCE(
        (SELECT SUM(discount_amount) 
         FROM redemptions 
         WHERE booking_id = b.id AND status = 'applied'), 0
    ),
    spend_transaction_id = (
        SELECT transaction_id 
        FROM redemptions 
        WHERE booking_id = b.id 
          AND status = 'applied' 
        ORDER BY applied_at DESC 
        LIMIT 1
    ),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM redemptions 
    WHERE booking_id = b.id 
      AND status = 'applied'
);

-- =====================================================
-- VERIFICATION QUERIES (Run these after migration)
-- =====================================================

-- Verify bookings have loyalty data
-- SELECT COUNT(*) as bookings_with_points_earned 
-- FROM bookings 
-- WHERE points_earned > 0;

-- Verify bookings_cache table has been dropped
-- SELECT EXISTS (
--     SELECT 1 FROM information_schema.tables 
--     WHERE table_name = 'bookings_cache'
-- ) as bookings_cache_still_exists;

-- Verify new columns exist on bookings table
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'bookings' 
--   AND column_name IN ('points_earned', 'points_used', 'discount_applied', 'is_first_loyalty_booking');

-- Verify functions work
-- SELECT handle_booking_cancellation('some-booking-id'::UUID);
-- SELECT process_first_loyalty_booking('client-id'::UUID, 'booking-id'::UUID, 'REF-123', 1000);

-- =====================================================
-- ROLLBACK SCRIPT (If needed)
-- =====================================================

-- To rollback this migration, you would need to:
-- 1. Recreate bookings_cache table (from original schema)
-- 2. Restore original functions (from loyalty_implement.sql)
-- 3. Restore original views
-- 4. Restore original triggers
-- 5. Drop loyalty columns from bookings table (optional)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- 
-- 1. All loyalty data is now in bookings table
-- 2. Functions now use bookings table directly
-- 3. Views now use bookings table directly  
-- 4. bookings_cache table has been removed
-- 5. Redemption sync trigger added to keep bookings updated
--
-- Next steps:
-- - Test all functions work correctly
-- - Verify data integrity
-- - Update any application code that references bookings_cache
-- - Monitor for any issues
--
-- =====================================================

