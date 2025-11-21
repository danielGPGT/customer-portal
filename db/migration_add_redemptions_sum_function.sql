-- Migration: Add optimized function to get sum of pending redemptions
-- This replaces the slow SELECT query with a fast aggregation

CREATE OR REPLACE FUNCTION get_pending_redemptions_sum(p_client_id UUID)
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
    v_sum INTEGER;
BEGIN
    SELECT COALESCE(SUM(points_redeemed), 0)::INTEGER
    INTO v_sum
    FROM redemptions
    WHERE client_id = p_client_id
      AND status = 'pending';
    
    RETURN v_sum;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_redemptions_sum IS 'Optimized function to get sum of pending redemption points, bypassing RLS for performance';

