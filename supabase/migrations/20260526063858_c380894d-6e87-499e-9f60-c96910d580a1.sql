
-- 1. Explicit admin/owner-only policies for admin_shifts
CREATE POLICY "Admins insert shifts" ON public.admin_shifts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins update shifts" ON public.admin_shifts
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- 2. Explicit admin/owner-only policies for shift_handovers
CREATE POLICY "Admins insert handovers" ON public.shift_handovers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins update handovers" ON public.shift_handovers
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- 3. login_attempts: explicit deny for all client access (RPCs use SECURITY DEFINER and bypass RLS)
CREATE POLICY "Deny client select login_attempts" ON public.login_attempts
  FOR SELECT TO authenticated, anon
  USING (false);

CREATE POLICY "Deny client insert login_attempts" ON public.login_attempts
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Deny client update login_attempts" ON public.login_attempts
  FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny client delete login_attempts" ON public.login_attempts
  FOR DELETE TO authenticated, anon
  USING (false);

-- 4. Receipts storage bucket: customers insert only, admins/owners full control
DROP POLICY IF EXISTS "Users update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete receipts" ON storage.objects;

CREATE POLICY "Admins update receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid()))
  WITH CHECK (bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins delete receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid()));

-- 5. Realtime: restrict subscription to admin/owner for sensitive shift channels
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins subscribe shift channels" ON realtime.messages;
CREATE POLICY "Admins subscribe shift channels" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    CASE
      WHEN realtime.topic() IN ('shift_state', 'admin_shifts', 'shift_handovers')
        THEN public.is_admin_or_owner(auth.uid())
      ELSE true
    END
  );

-- Remove sensitive tables from the default postgres_changes publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_shifts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_shifts';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shift_handovers'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.shift_handovers';
  END IF;
END $$;
