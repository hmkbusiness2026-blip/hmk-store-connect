
-- 1. Lock down SECURITY DEFINER functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Anonymous-callable (auth lockout flow happens pre-login)
GRANT EXECUTE ON FUNCTION public.check_login_lock(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_login_attempts(text) TO anon, authenticated;

-- Signed-in user callable (function bodies enforce ownership / public-data semantics)
GRANT EXECUTE ON FUNCTION public.get_pro_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_on_duty() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_active_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_new_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_diamonds(uuid, integer) TO authenticated;

-- Admin/owner-only RPCs (internal checks already enforce role; restrict callable surface too)
GRANT EXECUTE ON FUNCTION public.open_shift(text, numeric, numeric, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_shift(text, numeric, numeric, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_handover(uuid, text, numeric, numeric, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_handover(uuid, text, numeric, numeric, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_handover(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_vault_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_vault_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_profile(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_owner_transfer_number(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_today_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_admin_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_admin_shift_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_list_all_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_product_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_adjust(text, text, integer) TO authenticated;

-- 2. admin_shifts / shift_handovers — re-assert strict RLS
DROP POLICY IF EXISTS "Admins read shifts" ON public.admin_shifts;
DROP POLICY IF EXISTS "Admins insert shifts" ON public.admin_shifts;
DROP POLICY IF EXISTS "Admins update shifts" ON public.admin_shifts;
CREATE POLICY "Admin/Owner select shifts" ON public.admin_shifts FOR SELECT TO authenticated USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/Owner insert shifts" ON public.admin_shifts FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/Owner update shifts" ON public.admin_shifts FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid())) WITH CHECK (public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins read handovers" ON public.shift_handovers;
DROP POLICY IF EXISTS "Admins insert handovers" ON public.shift_handovers;
DROP POLICY IF EXISTS "Admins update handovers" ON public.shift_handovers;
CREATE POLICY "Admin/Owner select handovers" ON public.shift_handovers FOR SELECT TO authenticated USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/Owner insert handovers" ON public.shift_handovers FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/Owner update handovers" ON public.shift_handovers FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid())) WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- 3. receipts storage bucket policies
DROP POLICY IF EXISTS "Receipts insert by authed" ON storage.objects;
DROP POLICY IF EXISTS "Receipts read by staff" ON storage.objects;
DROP POLICY IF EXISTS "Receipts update admin only" ON storage.objects;
DROP POLICY IF EXISTS "Receipts delete admin only" ON storage.objects;
CREATE POLICY "Receipts insert by authed" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Receipts read by staff" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Receipts update admin only" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid()))
  WITH CHECK (bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Receipts delete admin only" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid()));

-- 4. login_attempts — full client lockdown (RPCs bypass via SECURITY DEFINER)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny client select login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Deny client insert login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Deny client update login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Deny client delete login_attempts" ON public.login_attempts;
CREATE POLICY "Deny client select login_attempts" ON public.login_attempts FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Deny client insert login_attempts" ON public.login_attempts FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny client update login_attempts" ON public.login_attempts FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny client delete login_attempts" ON public.login_attempts FOR DELETE TO anon, authenticated USING (false);

-- 5. realtime.messages — restrict shift channels to admin/owner
DROP POLICY IF EXISTS "Admins subscribe shift channels" ON realtime.messages;
CREATE POLICY "Admins subscribe shift channels" ON realtime.messages FOR SELECT TO authenticated
  USING (
    CASE
      WHEN realtime.topic() IN ('shift_state','admin_shifts','shift_handovers')
        THEN public.is_admin_or_owner(auth.uid())
      ELSE true
    END
  );
