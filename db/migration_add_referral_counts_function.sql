-- Migration: Add optimized referral counts function
-- This function gets all referral counts in one query instead of 3 separate count queries

CREATE OR REPLACE FUNCTION get_referral_counts(p_client_id UUID)
RETURNS TABLE(
    total_friends_referred INTEGER,
    current_year_referrals INTEGER,
    last_year_referrals INTEGER
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
    WITH referral_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status IN ('completed', 'signed_up'))::INTEGER as total,
            COUNT(*) FILTER (
                WHERE status IN ('completed', 'signed_up')
                AND created_at >= v_current_year_start
                AND created_at < v_now
            )::INTEGER as current_year,
            COUNT(*) FILTER (
                WHERE status IN ('completed', 'signed_up')
                AND created_at >= v_last_year_start
                AND created_at < v_last_year_end
            )::INTEGER as last_year
        FROM referrals
        WHERE referrer_client_id = p_client_id
    )
    SELECT 
        COALESCE(total, 0),
        COALESCE(current_year, 0),
        COALESCE(last_year, 0)
    FROM referral_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_referral_counts IS 'Optimized function to get all referral counts in one query instead of 3 separate count queries';

