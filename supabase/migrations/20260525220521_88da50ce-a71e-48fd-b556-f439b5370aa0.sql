
-- 1) transfer_number on admin_profiles
ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS transfer_number text;

-- 2) Allow owner to update transfer_number via existing update RPC: create a dedicated helper
CREATE OR REPLACE FUNCTION public.update_owner_transfer_number(_transfer_number text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins/owners';
  END IF;
  INSERT INTO public.admin_profiles (user_id, transfer_number)
    VALUES (auth.uid(), _transfer_number)
  ON CONFLICT (user_id) DO UPDATE
    SET transfer_number = EXCLUDED.transfer_number, updated_at = now();
END $$;

-- 3) Today's live stats
CREATE OR REPLACE FUNCTION public.owner_today_stats()
RETURNS TABLE(active_admin_id uuid, active_admin_name text, revenue_today numeric, orders_today integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins/owners';
  END IF;
  RETURN QUERY
    SELECT
      (SELECT s.admin_id FROM public.admin_shifts s WHERE s.status='open' LIMIT 1) AS active_admin_id,
      (SELECT COALESCE(ap.full_name,'') FROM public.admin_shifts s
         LEFT JOIN public.admin_profiles ap ON ap.user_id = s.admin_id
         WHERE s.status='open' LIMIT 1) AS active_admin_name,
      COALESCE((SELECT SUM(price) FROM public.orders
                 WHERE status='completed' AND updated_at::date = CURRENT_DATE), 0) AS revenue_today,
      COALESCE((SELECT COUNT(*)::int FROM public.orders
                 WHERE created_at::date = CURRENT_DATE), 0) AS orders_today;
END $$;

-- 4) Admin performance
CREATE OR REPLACE FUNCTION public.owner_admin_performance()
RETURNS TABLE(admin_id uuid, full_name text, accepted integer, rejected integer, success_rate numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins/owners';
  END IF;
  RETURN QUERY
    SELECT ur.user_id,
           COALESCE(ap.full_name,'') AS full_name,
           COALESCE(SUM(CASE WHEN o.status='completed' THEN 1 ELSE 0 END),0)::int AS accepted,
           COALESCE(SUM(CASE WHEN o.status='rejected' THEN 1 ELSE 0 END),0)::int AS rejected,
           CASE WHEN COALESCE(SUM(CASE WHEN o.status IN ('completed','rejected') THEN 1 ELSE 0 END),0) = 0
                THEN 0
                ELSE ROUND(
                  100.0 * SUM(CASE WHEN o.status='completed' THEN 1 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN o.status IN ('completed','rejected') THEN 1 ELSE 0 END),0),
                  1)
           END AS success_rate
    FROM public.user_roles ur
    LEFT JOIN public.admin_profiles ap ON ap.user_id = ur.user_id
    LEFT JOIN public.orders o ON o.processing_by = ur.user_id
    WHERE ur.role::text IN ('admin','owner')
    GROUP BY ur.user_id, ap.full_name
    ORDER BY success_rate DESC NULLS LAST;
END $$;

-- 5) Product order stats
CREATE OR REPLACE FUNCTION public.owner_product_stats()
RETURNS TABLE(game_name text, package_name text, orders_count integer, revenue numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins/owners';
  END IF;
  RETURN QUERY
    SELECT o.game_name, o.package_name,
           COUNT(*)::int AS orders_count,
           COALESCE(SUM(CASE WHEN o.status='completed' THEN o.price ELSE 0 END),0) AS revenue
    FROM public.orders o
    GROUP BY o.game_name, o.package_name
    ORDER BY orders_count DESC;
END $$;

-- 6) Shift history for a given admin
CREATE OR REPLACE FUNCTION public.owner_admin_shift_history(_admin_id uuid)
RETURNS TABLE(
  id uuid, status text, opened_at timestamptz, closed_at timestamptz,
  start_smile numeric, start_wallet numeric, start_instapay numeric,
  end_smile numeric, end_wallet numeric, end_instapay numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins/owners';
  END IF;
  RETURN QUERY
    SELECT s.id, s.status, s.opened_at, s.closed_at,
           s.start_smile, s.start_wallet, s.start_instapay,
           s.end_smile, s.end_wallet, s.end_instapay
    FROM public.admin_shifts s
    WHERE s.admin_id = _admin_id
    ORDER BY s.opened_at DESC
    LIMIT 200;
END $$;

-- 7) List ALL admins (including self) for owner dropdowns
CREATE OR REPLACE FUNCTION public.owner_list_all_admins()
RETURNS TABLE(user_id uuid, full_name text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ur.user_id, COALESCE(ap.full_name,'') AS full_name, ur.role::text
  FROM public.user_roles ur
  LEFT JOIN public.admin_profiles ap ON ap.user_id = ur.user_id
  WHERE ur.role::text IN ('admin','owner');
$$;

-- 8) Seed default product images per game
INSERT INTO public.product_images (game_id, package_id, image_url)
VALUES
  ('hok',  NULL, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=512&q=80'),
  ('mlbb', NULL, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=512&q=80')
ON CONFLICT DO NOTHING;
