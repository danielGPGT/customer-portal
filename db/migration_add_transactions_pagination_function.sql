-- Migration: Add optimized function for paginated transactions
-- This replaces the slow SELECT with ORDER BY and RANGE with a fast function

CREATE OR REPLACE FUNCTION get_transactions_paginated(
    p_client_id UUID,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    transaction_type TEXT,
    points INTEGER,
    balance_after INTEGER,
    source_type TEXT,
    source_reference_id TEXT,
    description TEXT,
    purchase_amount NUMERIC,
    purchase_currency TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_page_size;
    
    RETURN QUERY
    SELECT 
        lt.id,
        lt.transaction_type,
        lt.points,
        lt.balance_after,
        lt.source_type,
        lt.source_reference_id,
        lt.description,
        lt.purchase_amount,
        lt.purchase_currency,
        lt.created_at
    FROM loyalty_transactions lt
    WHERE lt.client_id = p_client_id
    ORDER BY lt.created_at DESC, lt.id DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_transactions_paginated IS 'Optimized function to get paginated transactions, bypassing RLS for performance';

