
-- 1) Receipts bucket: make private and add owner/staff scoped policies
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;

CREATE POLICY "Users read own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff read all receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND public.is_staff(auth.uid())
);

CREATE POLICY "Users upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2) site-assets: remove broad listing SELECT (public bucket URLs still serve files)
DROP POLICY IF EXISTS "Public read site-assets" ON storage.objects;

-- 3) Handovers: restrict ack to the intended recipient
DROP POLICY IF EXISTS "Staff ack handover" ON public.handovers;
CREATE POLICY "Staff ack own handover"
ON public.handovers FOR UPDATE
USING (public.is_staff(auth.uid()) AND to_user = auth.uid())
WITH CHECK (public.is_staff(auth.uid()) AND to_user = auth.uid());

-- 4) Notifications: drop client self-insert; auto-create on new order via trigger
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;

CREATE OR REPLACE FUNCTION public.notify_order_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, read)
  VALUES (
    NEW.user_id,
    'Order Received',
    'Your ' || NEW.package_name || ' order is being reviewed.',
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_order_created ON public.orders;
CREATE TRIGGER trg_notify_order_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_created();

-- 5) Realtime: stop broadcasting sensitive staff tables
ALTER PUBLICATION supabase_realtime DROP TABLE public.staff_sessions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.handovers;
