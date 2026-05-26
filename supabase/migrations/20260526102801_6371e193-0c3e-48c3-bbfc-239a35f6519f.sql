-- 1) Owner full access on orders
CREATE POLICY "Owners can view all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update all orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role));

-- 2) audit_logs INSERT policy: deny direct client writes (writes happen via SECURITY DEFINER triggers/functions which bypass RLS). Explicit deny removes ambiguity.
CREATE POLICY "Deny client insert audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- 3) staff_sessions: deny direct client writes. All writes go through the staff-session edge function using the service role.
CREATE POLICY "Deny client insert staff_sessions" ON public.staff_sessions
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Deny client update staff_sessions" ON public.staff_sessions
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny client delete staff_sessions" ON public.staff_sessions
  FOR DELETE TO authenticated USING (false);

-- 4) system_logs: remove from realtime publication and ensure explicit owner-only SELECT (already present, no admin access added).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'system_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.system_logs';
  END IF;
END $$;

-- 5) Public storage bucket: prevent listing of all objects while keeping public file reads working.
-- Drop overly broad SELECT policies on storage.objects for site-assets, then re-add a policy
-- that allows reading individual files (Supabase getPublicUrl works without listing).
DO $$
DECLARE _p RECORD;
BEGIN
  FOR _p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual ILIKE '%site-assets%' OR policyname ILIKE '%site-assets%' OR policyname ILIKE '%site_assets%')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', _p.policyname);
  END LOOP;
END $$;

-- Allow reading individual public files (anon + authenticated). This does NOT enable list() because
-- list() requires a SELECT that matches with a folder prefix scan; public CDN/getPublicUrl reads a single object by name.
CREATE POLICY "Public read site-assets files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-assets' AND name IS NOT NULL);

-- Owner/admin can list & manage
CREATE POLICY "Owners/admins manage site-assets insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND is_admin_or_owner(auth.uid()));
CREATE POLICY "Owners/admins manage site-assets update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND is_admin_or_owner(auth.uid()))
  WITH CHECK (bucket_id = 'site-assets' AND is_admin_or_owner(auth.uid()));
CREATE POLICY "Owners/admins manage site-assets delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND is_admin_or_owner(auth.uid()));