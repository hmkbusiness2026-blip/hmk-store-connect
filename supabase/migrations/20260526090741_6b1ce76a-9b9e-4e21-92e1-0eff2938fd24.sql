
-- ============================================
-- STORAGE: site-assets bucket — owner/admin full CRUD
-- ============================================
DROP POLICY IF EXISTS "site-assets public read" ON storage.objects;
DROP POLICY IF EXISTS "site-assets owner insert" ON storage.objects;
DROP POLICY IF EXISTS "site-assets owner update" ON storage.objects;
DROP POLICY IF EXISTS "site-assets owner delete" ON storage.objects;

CREATE POLICY "site-assets public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

CREATE POLICY "site-assets owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "site-assets owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "site-assets owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

-- ============================================
-- site_config — ensure owners can DELETE too
-- ============================================
DROP POLICY IF EXISTS "Owners delete site_config" ON public.site_config;
CREATE POLICY "Owners delete site_config"
ON public.site_config FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- product_images — add explicit owner full CRUD (in addition to admin policies)
-- ============================================
DROP POLICY IF EXISTS "Owners full access product_images select" ON public.product_images;
DROP POLICY IF EXISTS "Owners full access product_images insert" ON public.product_images;
DROP POLICY IF EXISTS "Owners full access product_images update" ON public.product_images;
DROP POLICY IF EXISTS "Owners full access product_images delete" ON public.product_images;

CREATE POLICY "Owners full access product_images insert"
ON public.product_images FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners full access product_images update"
ON public.product_images FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners full access product_images delete"
ON public.product_images FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role));
