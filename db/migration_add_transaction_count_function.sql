-- Migration: Add optimized transaction count function
-- This function gets the transaction count much faster than a SELECT COUNT(*) with RLS

CREATE OR REPLACE FUNCTION get_transaction_count(p_client_id UUID)
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER
    INTO v_count
    FROM loyalty_transactions
    WHERE client_id = p_client_id;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_transaction_count IS 'Optimized function to get transaction count, bypassing RLS for performance';

