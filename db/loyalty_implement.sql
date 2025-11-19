-- =====================================================
-- LOYALTY PLATFORM - REVISED SCHEMA V3.0
-- =====================================================
-- Using existing clients table instead of separate loyalty_customers
-- 
-- Key Changes from V2.1:
-- - Removed loyalty_customers table
-- - Added loyalty fields to clients table
-- - Updated all foreign keys to reference clients(id)
-- - All functions updated to use clients table
-- - Simpler data model, less JOINs
-- 
-- Loyalty Fields Added to clients:
-- - points_balance
-- - lifetime_points_earned
-- - lifetime_points_spent
-- - loyalty_enrolled (NULL = not enrolled, TRUE = enrolled)
-- - loyalty_enrolled_at
-- - loyalty_signup_source
-- - first_loyalty_booking_at

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LOYALTY FIELDS ADDED TO CLIENTS TABLE
-- =====================================================
-- Add these columns to your existing clients table

ALTER TABLE clients ADD COLUMN IF NOT EXISTS points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifetime_points_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifetime_points_spent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS loyalty_enrolled BOOLEAN DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS loyalty_enrolled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS loyalty_signup_source TEXT CHECK (loyalty_signup_source IN ('referral', 'auto_enrolled', 'self_signup'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_loyalty_booking_at TIMESTAMP WITH TIME ZONE;

-- Indexes for loyalty fields
CREATE INDEX IF NOT EXISTS idx_clients_loyalty_enrolled ON clients(loyalty_enrolled) WHERE loyalty_enrolled = TRUE;
CREATE INDEX IF NOT EXISTS idx_clients_points_balance ON clients(points_balance) WHERE loyalty_enrolled = TRUE;
CREATE INDEX IF NOT EXISTS idx_clients_loyalty_enrolled_at ON clients(loyalty_enrolled_at);

-- Comments
COMMENT ON COLUMN clients.loyalty_enrolled IS 'NULL = not enrolled, TRUE = enrolled in loyalty program';
COMMENT ON COLUMN clients.loyalty_signup_source IS 'How they joined: referral, auto_enrolled (first booking), or self_signup';
COMMENT ON COLUMN clients.points_balance IS 'Current points balance (only for enrolled customers)';
COMMENT ON COLUMN clients.lifetime_points_earned IS 'Total points ever earned';
COMMENT ON COLUMN clients.lifetime_points_spent IS 'Total points ever spent';

-- =====================================================
-- 1. LOYALTY_TRANSACTIONS TABLE
-- =====================================================
-- Complete audit trail of all point movements
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'adjustment', 'expired', 'refund')),
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Source Information
    source_type TEXT NOT NULL CHECK (source_type IN (
        'purchase',           -- Points earned from booking
        'referral_signup',    -- Points for signing up with referral (referee gets 100 pts)
        'referral_booking',   -- Points when referee books (referrer gets 100 pts)
        'redemption',         -- Points spent on discount
        'refund',            -- Points refunded from cancelled booking
        'manual_adjustment',  -- Admin adjustment
        'expiry'             -- Points expired
    )),
    source_reference_id TEXT,
    
    -- Purchase Details
    purchase_amount NUMERIC(10, 2),
    purchase_currency TEXT DEFAULT 'GBP',
    
    -- Description
    description TEXT NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_loyalty_transactions_client_id ON loyalty_transactions(client_id);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);
CREATE INDEX idx_loyalty_transactions_source_type ON loyalty_transactions(source_type);
CREATE INDEX idx_loyalty_transactions_source_reference ON loyalty_transactions(source_reference_id) WHERE source_reference_id IS NOT NULL;
CREATE INDEX idx_loyalty_transactions_client_created ON loyalty_transactions(client_id, created_at DESC);

-- =====================================================
-- 2. REFERRALS TABLE
-- =====================================================
-- Tracks friend referral program
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referrer (existing client who refers)
    referrer_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Referee (person being referred)
    referee_email TEXT NOT NULL,
    referee_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Referral Code
    referral_code TEXT NOT NULL UNIQUE,
    referral_link TEXT,
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Referral sent, awaiting signup
        'signed_up',    -- Referee signed up and got 100 pts
        'completed',    -- Referee booked and referrer got 100 pts
        'expired',
        'cancelled'
    )),
    
    -- Points Awarded
    referee_signup_points INTEGER DEFAULT 0,
    referrer_booking_points INTEGER DEFAULT 0,
    
    -- Transaction References
    referee_signup_transaction_id UUID REFERENCES loyalty_transactions(id),
    referrer_booking_transaction_id UUID REFERENCES loyalty_transactions(id),
    
    -- Booking Tracking
    first_booking_id UUID,
    first_booking_reference TEXT,
    signed_up_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_referrals_referrer_client_id ON referrals(referrer_client_id);
CREATE INDEX idx_referrals_referee_client_id ON referrals(referee_client_id);
CREATE INDEX idx_referrals_referee_email ON referrals(referee_email);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_created_at ON referrals(created_at DESC);

-- =====================================================
-- 3. BOOKINGS_CACHE TABLE
-- =====================================================
-- Caches booking data from main system
CREATE TABLE bookings_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- External References
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    booking_reference TEXT NOT NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    
    -- Booking Details
    event_name TEXT,
    event_start_date DATE,
    event_end_date DATE,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    
    -- Loyalty Points
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    discount_applied NUMERIC(10, 2) DEFAULT 0,
    
    -- Status
    booking_status TEXT NOT NULL CHECK (booking_status IN (
        'pending',
        'confirmed',
        'completed',
        'cancelled'
    )),
    
    -- Is this first loyalty booking?
    is_first_loyalty_booking BOOLEAN DEFAULT FALSE,
    
    -- Transaction References
    earn_transaction_id UUID REFERENCES loyalty_transactions(id),
    spend_transaction_id UUID REFERENCES loyalty_transactions(id),
    
    -- Data
    booking_data JSONB,
    
    -- Timestamps
    booked_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_cache_client_id ON bookings_cache(client_id);
CREATE INDEX idx_bookings_cache_booking_id ON bookings_cache(booking_id);
CREATE INDEX idx_bookings_cache_booking_reference ON bookings_cache(booking_reference);
CREATE INDEX idx_bookings_cache_status ON bookings_cache(booking_status);
CREATE INDEX idx_bookings_cache_booked_at ON bookings_cache(booked_at DESC);
CREATE INDEX idx_bookings_cache_is_first_loyalty_booking ON bookings_cache(is_first_loyalty_booking);
CREATE INDEX idx_bookings_cache_event_id ON bookings_cache(event_id);
CREATE INDEX idx_bookings_cache_event_dates ON bookings_cache(event_start_date, event_end_date);
CREATE INDEX idx_bookings_cache_client_status ON bookings_cache(client_id, booking_status);

-- =====================================================
-- 4. REDEMPTIONS TABLE
-- =====================================================
-- Tracks point redemptions
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Redemption Details
    points_redeemed INTEGER NOT NULL CHECK (points_redeemed > 0),
    discount_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    
    -- Associated Quote/Booking
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    booking_reference TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',    -- Points reserved during quote
        'applied',    -- Points deducted, discount applied
        'cancelled',  -- Quote not converted
        'refunded'    -- Booking cancelled
    )),
    
    -- Transaction Reference
    transaction_id UUID REFERENCES loyalty_transactions(id),
    
    -- Timestamps
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_redemptions_client_id ON redemptions(client_id);
CREATE INDEX idx_redemptions_quote_id ON redemptions(quote_id);
CREATE INDEX idx_redemptions_booking_id ON redemptions(booking_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_redemptions_created_at ON redemptions(created_at DESC);

-- =====================================================
-- 5. CUSTOMER_SESSIONS TABLE
-- =====================================================
CREATE TABLE customer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customer_sessions_client_id ON customer_sessions(client_id);
CREATE INDEX idx_customer_sessions_session_token ON customer_sessions(session_token);
CREATE INDEX idx_customer_sessions_expires_at ON customer_sessions(expires_at);

-- =====================================================
-- 6. NOTIFICATIONS TABLE
-- =====================================================
-- In-app notifications for customers
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'points_earned',
        'points_spent',
        'referral_signup',
        'referral_completed',
        'booking_confirmed',
        'booking_cancelled',
        'system',
        'promotion'
    )),
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    action_url TEXT,
    action_label TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_client_id ON notifications(client_id);
CREATE INDEX idx_notifications_read ON notifications(client_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- =====================================================
-- 7. LOYALTY_SETTINGS TABLE
-- =====================================================
CREATE TABLE loyalty_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    -- Earning Rules
    points_per_pound NUMERIC(10, 4) NOT NULL DEFAULT 0.05,
    currency TEXT NOT NULL DEFAULT 'GBP',
    
    -- Referral Rules
    referral_bonus_referee INTEGER NOT NULL DEFAULT 100,
    referral_bonus_referrer INTEGER NOT NULL DEFAULT 100,
    referral_link_expiry_days INTEGER DEFAULT 90,
    
    -- Redemption Rules
    min_redemption_points INTEGER NOT NULL DEFAULT 100,
    redemption_increment INTEGER NOT NULL DEFAULT 100,
    point_value NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    
    -- Point Expiry (NULL = never expire)
    points_expire_after_days INTEGER,
    
    -- Feature Flags
    referral_program_enabled BOOLEAN DEFAULT TRUE,
    redemption_enabled BOOLEAN DEFAULT TRUE,
    
    -- Portal Branding
    portal_name TEXT DEFAULT 'Customer Portal',
    primary_color TEXT DEFAULT '#000000',
    logo_url TEXT,
    
    -- Metadata
    terms_and_conditions_url TEXT,
    help_email TEXT,
    settings_metadata JSONB DEFAULT '{}'::jsonb,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT loyalty_settings_single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO loyalty_settings (id) VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'admin', 'system', 'webhook')),
    actor_id UUID,
    
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_cache_updated_at 
    BEFORE UPDATE ON bookings_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redemptions_updated_at 
    BEFORE UPDATE ON redemptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_settings_updated_at 
    BEFORE UPDATE ON loyalty_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sync booking status from main bookings table
CREATE OR REPLACE FUNCTION sync_booking_status_to_cache()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bookings_cache
    SET 
        booking_status = NEW.status,
        updated_at = NOW()
    WHERE booking_id = NEW.id;
    
    -- If booking is cancelled, trigger refund handling
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        PERFORM handle_booking_cancellation(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_booking_status
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION sync_booking_status_to_cache();

-- =====================================================
-- CORE HELPER FUNCTIONS
-- =====================================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO code_exists;
        IF NOT code_exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Calculate points from purchase
CREATE OR REPLACE FUNCTION calculate_points_from_purchase(p_amount NUMERIC)
RETURNS INTEGER AS $$
DECLARE
    v_points_per_pound NUMERIC;
    v_points INTEGER;
BEGIN
    SELECT points_per_pound INTO v_points_per_pound
    FROM loyalty_settings WHERE id = 1;
    
    v_points := FLOOR(p_amount * v_points_per_pound);
    RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- Calculate available discount
CREATE OR REPLACE FUNCTION calculate_available_discount(p_client_id UUID)
RETURNS TABLE(
    points_balance INTEGER,
    usable_points INTEGER,
    discount_amount NUMERIC
) AS $$
DECLARE
    v_balance INTEGER;
    v_increment INTEGER;
    v_point_value NUMERIC;
    v_usable INTEGER;
    v_discount NUMERIC;
    v_enrolled BOOLEAN;
BEGIN
    -- Check if enrolled in loyalty program
    SELECT c.points_balance, c.loyalty_enrolled INTO v_balance, v_enrolled
    FROM clients c WHERE c.id = p_client_id;
    
    IF v_balance IS NULL OR v_enrolled IS NOT TRUE THEN
        RETURN QUERY SELECT 0, 0, 0::NUMERIC;
        RETURN;
    END IF;
    
    SELECT redemption_increment, point_value 
    INTO v_increment, v_point_value
    FROM loyalty_settings WHERE id = 1;
    
    v_usable := (v_balance / v_increment) * v_increment;
    v_discount := v_usable * v_point_value;
    
    RETURN QUERY SELECT v_balance, v_usable, v_discount;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATOMIC POINTS UPDATE FUNCTION (CRITICAL)
-- =====================================================
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
RETURNS UUID AS $$
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
-- ENROLL CLIENT IN LOYALTY PROGRAM
-- =====================================================
CREATE OR REPLACE FUNCTION enroll_client_in_loyalty(
    p_client_id UUID,
    p_signup_source TEXT DEFAULT 'self_signup'
)
RETURNS BOOLEAN AS $$
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
-- REFERRAL VALIDATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION check_referral_validity(p_referral_code TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    referral_id UUID,
    reason TEXT
) AS $$
DECLARE
    v_referral RECORD;
BEGIN
    SELECT * INTO v_referral
    FROM referrals
    WHERE referral_code = p_referral_code;
    
    -- Referral doesn't exist
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Referral code not found';
        RETURN;
    END IF;
    
    -- Already used
    IF v_referral.status NOT IN ('pending') THEN
        RETURN QUERY SELECT FALSE, v_referral.id, 'Referral code already used';
        RETURN;
    END IF;
    
    -- Expired
    IF v_referral.expires_at IS NOT NULL AND v_referral.expires_at < NOW() THEN
        -- Mark as expired
        UPDATE referrals
        SET status = 'expired'
        WHERE id = v_referral.id;
        
        RETURN QUERY SELECT FALSE, v_referral.id, 'Referral code has expired';
        RETURN;
    END IF;
    
    -- Valid!
    RETURN QUERY SELECT TRUE, v_referral.id, 'Valid referral code';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CANCELLATION HANDLER
-- =====================================================
CREATE OR REPLACE FUNCTION handle_booking_cancellation(p_booking_id UUID)
RETURNS void AS $$
DECLARE
    v_cache RECORD;
BEGIN
    SELECT * INTO v_cache
    FROM bookings_cache
    WHERE booking_id = p_booking_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Refund points that were earned
    IF v_cache.points_earned > 0 THEN
        PERFORM update_client_points(
            v_cache.client_id,
            -v_cache.points_earned,
            'refund',
            'refund',
            'Points deducted due to cancelled booking ' || v_cache.booking_reference,
            p_booking_id::TEXT
        );
    END IF;
    
    -- Refund points that were spent
    IF v_cache.points_used > 0 THEN
        PERFORM update_client_points(
            v_cache.client_id,
            v_cache.points_used,
            'refund',
            'refund',
            'Points refunded from cancelled booking ' || v_cache.booking_reference,
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
        v_cache.client_id,
        'Booking Cancelled',
        'Your booking ' || v_cache.booking_reference || ' has been cancelled. Points have been refunded to your account.',
        'booking_cancelled'
    );
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCESS REFERRAL SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION process_referral_signup(
    p_referral_code TEXT,
    p_auth_user_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_team_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_validity RECORD;
    v_referral RECORD;
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
    
    -- Get referral details
    SELECT * INTO v_referral
    FROM referrals
    WHERE id = v_validity.referral_id;
    
    -- Get referee bonus from settings
    SELECT referral_bonus_referee INTO v_referee_bonus
    FROM loyalty_settings WHERE id = 1;
    
    -- Create client record
    -- Note: auth user should already be created by Supabase Auth before calling this
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
        p_team_id,
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
    
    -- Award referee signup bonus (100 points immediately)
    v_transaction_id := update_client_points(
        v_client_id,
        v_referee_bonus,
        'earn',
        'referral_signup',
        'Referral signup bonus from ' || v_referral.referrer_client_id,
        v_referral.id::TEXT
    );
    
    -- Update referral record
    UPDATE referrals
    SET 
        referee_client_id = v_client_id,
        status = 'signed_up',
        referee_signup_points = v_referee_bonus,
        referee_signup_transaction_id = v_transaction_id,
        signed_up_at = NOW()
    WHERE id = v_referral.id;
    
    -- Create notification for referrer
    INSERT INTO notifications (
        client_id,
        title,
        message,
        notification_type
    ) VALUES (
        v_referral.referrer_client_id,
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
        'Welcome!',
        'You''ve received ' || v_referee_bonus || ' bonus points for signing up!',
        'referral_signup'
    );
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCESS FIRST LOYALTY BOOKING
-- =====================================================
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
    
    -- Update booking cache
    UPDATE bookings_cache
    SET 
        earn_transaction_id = v_transaction_id,
        points_earned = v_points_earned,
        is_first_loyalty_booking = (v_first_loyalty_booking IS NULL)
    WHERE booking_id = p_booking_id;
    
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
-- VIEWS
-- =====================================================

-- Loyalty customers summary (only enrolled clients)
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
    COUNT(DISTINCT bc.id) as total_bookings,
    COALESCE(SUM(bc.total_amount), 0) as total_spend,
    MAX(bc.booked_at) as last_booking_date
    
FROM clients c
LEFT JOIN loyalty_transactions lt ON c.id = lt.client_id
LEFT JOIN referrals r ON c.id = r.referrer_client_id
LEFT JOIN bookings_cache bc ON c.id = bc.client_id AND bc.booking_status IN ('confirmed', 'completed')
WHERE c.loyalty_enrolled = TRUE
GROUP BY c.id;

-- Recent points activity
CREATE OR REPLACE VIEW recent_points_activity AS
SELECT 
    c.email,
    c.first_name,
    c.last_name,
    lt.transaction_type,
    lt.source_type,
    lt.points,
    lt.balance_after,
    lt.description,
    lt.created_at
FROM loyalty_transactions lt
JOIN clients c ON lt.client_id = c.id
WHERE lt.created_at >= NOW() - INTERVAL '30 days'
  AND c.loyalty_enrolled = TRUE
ORDER BY lt.created_at DESC;

-- Top referrers leaderboard
CREATE OR REPLACE VIEW top_referrers AS
SELECT 
    c.id,
    c.email,
    c.first_name,
    c.last_name,
    COUNT(r.id) as total_referrals,
    COUNT(CASE WHEN r.status = 'signed_up' THEN 1 END) as signups,
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
    SUM(CASE WHEN r.status = 'completed' THEN r.referrer_booking_points ELSE 0 END) as points_earned_from_referrals
FROM clients c
LEFT JOIN referrals r ON c.id = r.referrer_client_id
WHERE c.loyalty_enrolled = TRUE
GROUP BY c.id
HAVING COUNT(r.id) > 0
ORDER BY completed_referrals DESC, signups DESC;

-- Monthly points summary
CREATE OR REPLACE VIEW monthly_points_summary AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(DISTINCT client_id) as active_customers,
    COUNT(CASE WHEN transaction_type = 'earn' THEN 1 END) as earning_transactions,
    COUNT(CASE WHEN transaction_type = 'spend' THEN 1 END) as redemption_transactions,
    SUM(CASE WHEN transaction_type = 'earn' THEN points ELSE 0 END) as total_points_earned,
    SUM(CASE WHEN transaction_type = 'spend' THEN ABS(points) ELSE 0 END) as total_points_redeemed,
    SUM(CASE WHEN source_type = 'purchase' THEN purchase_amount ELSE 0 END) as total_purchase_amount
FROM loyalty_transactions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Points expiring soon (only if expiry enabled)
CREATE OR REPLACE VIEW points_expiring_soon AS
SELECT 
    c.id,
    c.email,
    c.first_name,
    c.last_name,
    c.points_balance,
    MIN(lt.created_at) as oldest_points_date,
    ls.points_expire_after_days,
    (
        ls.points_expire_after_days - 
        EXTRACT(DAY FROM NOW() - MIN(lt.created_at))
    )::INTEGER as days_remaining
FROM clients c
JOIN loyalty_transactions lt ON c.id = lt.client_id
CROSS JOIN loyalty_settings ls
WHERE lt.transaction_type = 'earn'
  AND lt.points > 0
  AND c.points_balance > 0
  AND c.loyalty_enrolled = TRUE
  AND ls.points_expire_after_days IS NOT NULL
GROUP BY c.id, ls.points_expire_after_days
HAVING (
    ls.points_expire_after_days - 
    EXTRACT(DAY FROM NOW() - MIN(lt.created_at))
) <= 30
AND (
    ls.points_expire_after_days - 
    EXTRACT(DAY FROM NOW() - MIN(lt.created_at))
) > 0
ORDER BY days_remaining ASC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE loyalty_transactions IS 'Complete audit trail of all loyalty point movements';
COMMENT ON TABLE referrals IS 'Friend referral tracking - referee gets 100pts on signup, referrer gets 100pts when referee books';
COMMENT ON TABLE notifications IS 'In-app notifications for loyalty customers';
COMMENT ON FUNCTION update_client_points IS 'Atomic function to update points - USE THIS for all point changes to prevent race conditions';
COMMENT ON FUNCTION enroll_client_in_loyalty IS 'Enroll a client in the loyalty program';
COMMENT ON FUNCTION check_referral_validity IS 'Validates referral code and returns validity status';
COMMENT ON FUNCTION handle_booking_cancellation IS 'Handles point refunds when bookings are cancelled';

-- =====================================================
-- END OF SCHEMA V3.0
-- =====================================================

-- Summary of Changes from V2.1:
-- - Removed loyalty_customers table
-- - Added 7 loyalty fields to clients table
-- - All foreign keys now reference clients(id) instead of loyalty_customers(id)
-- - Function renamed: update_customer_points → update_client_points
-- - New function: enroll_client_in_loyalty (for auto-enrollment and self-signup)
-- - Updated all views to filter by loyalty_enrolled = TRUE
-- - Simpler architecture: 8 tables instead of 9
-- - Less JOINs needed for most queries
-- - All core functionality preserved