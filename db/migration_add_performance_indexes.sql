-- Migration: Add performance indexes for points page queries
-- These indexes will dramatically speed up the loyalty_transactions queries

-- Indexes for date range queries (used heavily in stats calculations)
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_date_type 
ON loyalty_transactions(client_id, created_at DESC, transaction_type);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_date_source 
ON loyalty_transactions(client_id, created_at DESC, source_type, transaction_type);

-- Composite index for year-over-year queries
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_type_date 
ON loyalty_transactions(client_id, transaction_type, created_at DESC);

-- Index for source type filtering
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_source_type 
ON loyalty_transactions(client_id, source_type, transaction_type) 
WHERE transaction_type = 'earn';

-- Index for bookings lookups
CREATE INDEX IF NOT EXISTS idx_bookings_id_deleted 
ON bookings(id) 
WHERE deleted_at IS NULL;

-- Index for referrals date filtering (optimized for count queries)
CREATE INDEX IF NOT EXISTS idx_referrals_client_status_date 
ON referrals(referrer_client_id, status, created_at DESC);

-- Additional index for referrals count queries (covers the IN clause)
CREATE INDEX IF NOT EXISTS idx_referrals_client_status_created 
ON referrals(referrer_client_id, created_at DESC, status);

-- Index for redemptions status lookup
CREATE INDEX IF NOT EXISTS idx_redemptions_client_status 
ON redemptions(client_id, status) 
WHERE status = 'pending';

-- Additional index for redemptions queries (covers the common filter pattern)
CREATE INDEX IF NOT EXISTS idx_redemptions_client_status_points 
ON redemptions(client_id, status, points_redeemed) 
WHERE status = 'pending';

COMMENT ON INDEX idx_loyalty_transactions_client_date_type IS 'Optimizes year-over-year stats queries on points page';
COMMENT ON INDEX idx_loyalty_transactions_client_date_source IS 'Optimizes purchase points queries';
COMMENT ON INDEX idx_loyalty_transactions_client_type_date IS 'Optimizes transaction type filtering with dates';
COMMENT ON INDEX idx_loyalty_transactions_client_source_type IS 'Optimizes points by source breakdown queries';

