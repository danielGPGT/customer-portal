-- Migration: Case-insensitive email lookup and optional normalize
-- Prevents duplicate clients when the same email is used with different casing (e.g. John@x.com vs john@x.com).

-- 1. Update link_client_to_clerk_user to match email case-insensitively
--    (Callers now send lowercase; this finds existing rows stored with any case.)
CREATE OR REPLACE FUNCTION link_client_to_clerk_user(
    p_clerk_user_id TEXT,
    p_email TEXT
)
RETURNS TABLE (
    id UUID,
    clerk_user_id TEXT,
    team_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    status TEXT,
    points_balance INTEGER,
    lifetime_points_earned INTEGER,
    lifetime_points_spent INTEGER,
    loyalty_enrolled BOOLEAN,
    loyalty_enrolled_at TIMESTAMPTZ,
    loyalty_signup_source TEXT,
    first_loyalty_booking_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id UUID;
BEGIN
    SELECT c.id INTO v_client_id
    FROM clients c
    WHERE c.clerk_user_id = p_clerk_user_id
    LIMIT 1;

    IF v_client_id IS NULL AND p_email IS NOT NULL THEN
        SELECT c.id INTO v_client_id
        FROM clients c
        WHERE LOWER(TRIM(c.email)) = LOWER(TRIM(p_email))
        LIMIT 1;
    END IF;

    IF v_client_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE clients
    SET
        clerk_user_id = p_clerk_user_id,
        updated_at = NOW()
    WHERE clients.id = v_client_id;

    RETURN QUERY
    SELECT
        c.id, c.clerk_user_id, c.team_id, c.email, c.first_name, c.last_name, c.phone,
        c.status, c.points_balance, c.lifetime_points_earned, c.lifetime_points_spent,
        c.loyalty_enrolled, c.loyalty_enrolled_at, c.loyalty_signup_source,
        c.first_loyalty_booking_at, c.created_at, c.updated_at
    FROM clients c
    WHERE c.id = v_client_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Optional: normalize existing client emails to lowercase (run if you want DB consistency)
--    Uncomment and run in a separate step after backing up. Merge duplicates first if needed.
/*
UPDATE clients
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND email <> LOWER(TRIM(email));
*/
