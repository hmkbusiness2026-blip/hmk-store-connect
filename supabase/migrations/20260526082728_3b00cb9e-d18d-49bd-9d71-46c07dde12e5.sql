
DROP POLICY IF EXISTS "Admins subscribe shift channels" ON realtime.messages;

CREATE POLICY "Scoped realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    -- Staff-only operational channels
    WHEN realtime.topic() IN (
      'shift_state',
      'admin_shifts',
      'admin_shifts_watch',
      'shift_handovers',
      'handovers-watch',
      'inbox-realtime'
    ) THEN public.is_admin_or_owner(auth.uid())

    -- Public store status (signed-in users can listen for store open/close)
    WHEN realtime.topic() = 'store_status_changes' THEN true

    -- Per-user notification channel: notifications_<auth.uid()>
    WHEN realtime.topic() = ('notifications_' || auth.uid()::text) THEN true

    -- Default deny
    ELSE false
  END
);
