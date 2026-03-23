-- ================================================================
-- FIX: get_clerk_user_id() connection pooling race condition
-- ================================================================
--
-- PROBLEM:
--   set_clerk_user_id() sets a PostgreSQL session variable via set_config().
--   But PostgREST / PgBouncer connection pooling means the subsequent
--   query (e.g. SELECT from bookings) may execute on a DIFFERENT backend
--   connection where the session variable was never set.
--   Result: get_clerk_user_id() returns NULL → RLS blocks everything → 0 trips.
--
-- FIX:
--   The application already sends "x-clerk-user-id" as a custom HTTP header
--   on every request (see lib/supabase/server.ts). PostgREST exposes request
--   headers as GUC variables: current_setting('request.header.x-clerk-user-id').
--   This is set PER REQUEST, so it is immune to connection pooling issues.
--
--   We add this as the FIRST fallback in get_clerk_user_id(), before the
--   session variable check.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- ================================================================

CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
DECLARE
  v_header TEXT;
  v_jwt_claim TEXT;
  v_session_var TEXT;
BEGIN
  -- 1. Try request header (set by PostgREST from HTTP header, per-request, pool-safe)
  BEGIN
    v_header := current_setting('request.header.x-clerk-user-id', true);
    IF v_header IS NOT NULL AND v_header != '' THEN
      RETURN v_header;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- 2. Try JWT claims (if Clerk JWT is passed to Supabase)
  BEGIN
    v_jwt_claim := current_setting('request.jwt.claims', true)::json->>'sub';
    IF v_jwt_claim IS NOT NULL AND v_jwt_claim != '' THEN
      RETURN v_jwt_claim;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- 3. Fallback: session variable (set by set_clerk_user_id RPC — unreliable with pooling)
  BEGIN
    v_session_var := current_setting('app.clerk_user_id', true);
    IF v_session_var IS NOT NULL AND v_session_var != '' THEN
      RETURN v_session_var;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
