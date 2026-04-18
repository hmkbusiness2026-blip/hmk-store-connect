
-- 1) notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins insert any notification"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 2) store_status (single-row)
CREATE TABLE public.store_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_open BOOLEAN NOT NULL DEFAULT false,
  admin_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read store status"
  ON public.store_status FOR SELECT
  USING (true);

CREATE POLICY "Admins update store status"
  ON public.store_status FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins insert store status"
  ON public.store_status FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- seed a default row
INSERT INTO public.store_status (is_open, admin_name) VALUES (false, null);

-- 3) site_config (key/value)
CREATE TABLE public.site_config (
  key TEXT NOT NULL PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_config"
  ON public.site_config FOR SELECT
  USING (true);

CREATE POLICY "Admins write site_config insert"
  ON public.site_config FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins write site_config update"
  ON public.site_config FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 4) site-assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Admins upload site-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
  );

CREATE POLICY "Admins update site-assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site-assets'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
  );

CREATE POLICY "Admins delete site-assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site-assets'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
  );
