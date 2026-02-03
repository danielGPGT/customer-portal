-- ===============================
-- Internal notification: client portal direct insert (per CLIENT_PORTAL_NOTIFICATION_SETUP.md)
-- ===============================
-- When a client saves traveler or flight changes, the client app inserts a row into
-- internal_notifications. RLS allows insert when the current user (Clerk JWT sub or
-- get_clerk_user_id()) is a client for the row's team_id.

-- Remove previous approach (RPC + session-variable policy) if present
DROP POLICY IF EXISTS "Allow client portal booking updated notification" ON public.internal_notifications;
DROP FUNCTION IF EXISTS public.create_internal_notification_booking_updated(UUID);

-- RLS: allow insert when the row's team_id belongs to a client whose clerk_user_id
-- matches the current user (JWT sub when using Clerk JWT with Supabase, or session var from get_clerk_user_id())
CREATE POLICY "Clients can insert booking updated notification for their team"
  ON public.internal_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.team_id = internal_notifications.team_id
        AND (
          c.clerk_user_id = (auth.jwt() ->> 'sub')
          OR c.clerk_user_id = get_clerk_user_id()
        )
    )
  );

COMMENT ON POLICY "Clients can insert booking updated notification for their team" ON public.internal_notifications IS
  'Allows client portal to insert booking_updated_by_client notifications when Supabase receives Clerk JWT (sub = clients.clerk_user_id) or get_clerk_user_id() is set. See db/CLIENT_PORTAL_NOTIFICATION_SETUP.md.';
