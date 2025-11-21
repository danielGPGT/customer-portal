-- Migration: Add optimized points stats aggregation function
-- This function calculates all stats in one database query instead of fetching thousands of rows

CREATE OR REPLACE FUNCTION get_points_stats(p_client_id UUID)
RETURNS TABLE(
    current_year_spent INTEGER,
    last_year_spent INTEGER,
    current_year_earned INTEGER,
    last_year_earned INTEGER,
    current_year_purchase_points INTEGER,
    last_year_purchase_points INTEGER,
    points_by_purchase INTEGER,
    points_by_referral INTEGER,
    points_by_refund INTEGER,
    points_by_adjustment INTEGER
) 
SECURITY DEFINER
AS $$
DECLARE
    v_current_year_start TIMESTAMP;
    v_last_year_start TIMESTAMP;
    v_last_year_end TIMESTAMP;
    v_now TIMESTAMP;
BEGIN
    v_now := NOW();
    v_current_year_start := DATE_TRUNC('year', v_now);
    v_last_year_start := DATE_TRUNC('year', v_now - INTERVAL '1 year');
    v_last_year_end := v_current_year_start;

    RETURN QUERY
    WITH stats AS (
        SELECT 
            -- Current year spent
            COALESCE(SUM(CASE 
                WHEN transaction_type = 'spend' 
                AND created_at >= v_current_year_start 
                AND created_at < v_now 
                THEN ABS(points) ELSE 0 END), 0)::INTEGER as cy_spent,
            
            -- Last year spent
            COALESCE(SUM(CASE 
                WHEN transaction_type = 'spend' 
                AND created_at >= v_last_year_start 
                AND created_at < v_last_year_end 
                THEN ABS(points) ELSE 0 END), 0)::INTEGER as ly_spent,
            
            -- Current year earned
            COALESCE(SUM(CASE 
                WHEN transaction_type = 'earn' 
                AND created_at >= v_current_year_start 
                AND created_at < v_now 
                THEN points ELSE 0 END), 0)::INTEGER as cy_earned,
            
            -- Last year earned
            COALESCE(SUM(CASE 
                WHEN transaction_type = 'earn' 
                AND created_at >= v_last_year_start 
                AND created_at < v_last_year_end 
                THEN points ELSE 0 END), 0)::INTEGER as ly_earned,
            
            -- Current year purchase points
            COALESCE(SUM(CASE 
                WHEN source_type = 'purchase' 
                AND transaction_type = 'earn' 
                AND created_at >= v_current_year_start 
                AND created_at < v_now 
                THEN points ELSE 0 END), 0)::INTEGER as cy_purchase,
            
            -- Last year purchase points
            COALESCE(SUM(CASE 
                WHEN source_type = 'purchase' 
                AND transaction_type = 'earn' 
                AND created_at >= v_last_year_start 
                AND created_at < v_last_year_end 
                THEN points ELSE 0 END), 0)::INTEGER as ly_purchase,
            
            -- Points by source (all time)
            COALESCE(SUM(CASE 
                WHEN source_type = 'purchase' 
                AND transaction_type = 'earn' 
                THEN points ELSE 0 END), 0)::INTEGER as by_purchase,
            
            COALESCE(SUM(CASE 
                WHEN (source_type = 'referral_signup' OR source_type = 'referral_booking') 
                AND transaction_type = 'earn' 
                THEN points ELSE 0 END), 0)::INTEGER as by_referral,
            
            COALESCE(SUM(CASE 
                WHEN source_type = 'refund' 
                AND transaction_type = 'earn' 
                THEN points ELSE 0 END), 0)::INTEGER as by_refund,
            
            COALESCE(SUM(CASE 
                WHEN source_type = 'manual_adjustment' 
                AND transaction_type = 'earn' 
                THEN points ELSE 0 END), 0)::INTEGER as by_adjustment
            
        FROM loyalty_transactions
        WHERE client_id = p_client_id
    )
    SELECT 
        cy_spent,
        ly_spent,
        cy_earned,
        ly_earned,
        cy_purchase,
        ly_purchase,
        by_purchase,
        by_referral,
        by_refund,
        by_adjustment
    FROM stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_points_stats IS 'Optimized function to calculate all points stats in one query instead of fetching thousands of rows';

