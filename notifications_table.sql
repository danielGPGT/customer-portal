-- ===============================
-- INTERNAL NOTIFICATIONS TABLE (Phase 1)
-- ===============================
-- In-app notification centre for staff: booking_created, contract_deadline (derived), pto_fulfillment.
-- Named internal_notifications to avoid conflict with client-facing notifications table.
-- Contract deadlines are derived at read time; this table stores event-based notifications.

CREATE TABLE IF NOT EXISTS public.internal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Type and content
  type TEXT NOT NULL, -- 'booking_created', etc.
  title TEXT NOT NULL,
  message TEXT,
  link_path TEXT,
  link_id TEXT, -- e.g. booking_id for idempotency / linking

  -- Read state
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Extra refs (booking_id, contract_id, etc.)
  metadata JSONB DEFAULT '{}'
);

-- Indexes for bell dropdown and "See all" page
CREATE INDEX IF NOT EXISTS idx_internal_notifications_team_id ON public.internal_notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_created_at ON public.internal_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_read_at ON public.internal_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_team_created ON public.internal_notifications(team_id, created_at DESC);

-- Idempotency: one row per (team_id, type, link_id). For booking_created, one per booking.
-- NULL link_id is allowed (multiple rows with same type and null link_id).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_notifications_team_type_link_key') THEN
    ALTER TABLE public.internal_notifications
      ADD CONSTRAINT internal_notifications_team_type_link_key UNIQUE (team_id, type, link_id);
  END IF;
END $$;

COMMENT ON TABLE public.internal_notifications IS 'Internal portal notifications for staff (booking created, etc.). Contract deadlines are derived at read time. Distinct from client-facing notifications.';

-- RLS: team members can select/update only their team's notifications
ALTER TABLE public.internal_notifications ENABLE ROW LEVEL SECURITY;

-- Select: user must be in the team
CREATE POLICY "Team members can view team internal notifications"
  ON public.internal_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = internal_notifications.team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- Insert: only via service role or from backend (e.g. after booking create). For app inserts we allow if user is in team.
CREATE POLICY "Team members can insert internal notifications for their team"
  ON public.internal_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = internal_notifications.team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- Update: e.g. mark as read
CREATE POLICY "Team members can update team internal notifications"
  ON public.internal_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = internal_notifications.team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- No delete policy: only service or no delete from UI for Phase 1
-- CREATE POLICY "Team members can delete ..." if needed later
