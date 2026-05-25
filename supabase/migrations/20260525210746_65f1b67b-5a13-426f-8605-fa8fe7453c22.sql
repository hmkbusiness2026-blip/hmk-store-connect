-- =========================
-- product_images
-- =========================
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  package_id text,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_images_game_pkg_unique
  ON public.product_images (game_id, COALESCE(package_id, ''));

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read product_images" ON public.product_images
  FOR SELECT USING (true);
CREATE POLICY "Admins insert product_images" ON public.product_images
  FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins update product_images" ON public.product_images
  FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins delete product_images" ON public.product_images
  FOR DELETE USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- order_reviews
-- =========================
CREATE TABLE IF NOT EXISTS public.order_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  rating int NOT NULL DEFAULT 5,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User read own order review" ON public.order_reviews
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all order reviews" ON public.order_reviews
  FOR SELECT USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "User insert own order review" ON public.order_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_order_review_rating()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be 1-5';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER order_reviews_validate
  BEFORE INSERT OR UPDATE ON public.order_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_review_rating();

-- =========================
-- login_attempts + RPCs
-- =========================
CREATE TABLE IF NOT EXISTS public.login_attempts (
  phone text PRIMARY KEY,
  failed_count int NOT NULL DEFAULT 0,
  lock_until timestamptz,
  lock_level int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- No public policies; access only via SECURITY DEFINER RPCs.

CREATE OR REPLACE FUNCTION public.check_login_lock(_phone text)
RETURNS TABLE(locked boolean, lock_until timestamptz, hours_remaining int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  _row public.login_attempts%ROWTYPE;
BEGIN
  SELECT * INTO _row FROM public.login_attempts WHERE phone = _phone;
  IF NOT FOUND OR _row.lock_until IS NULL OR _row.lock_until <= now() THEN
    RETURN QUERY SELECT false, NULL::timestamptz, 0;
  ELSE
    RETURN QUERY SELECT true, _row.lock_until,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (_row.lock_until - now()))/3600)::int);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.record_failed_login(_phone text)
RETURNS TABLE(locked boolean, lock_until timestamptz, hours int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  _row public.login_attempts%ROWTYPE;
  _new_count int;
  _new_level int;
  _hours int;
  _until timestamptz;
BEGIN
  SELECT * INTO _row FROM public.login_attempts WHERE phone = _phone;

  -- If currently locked, just return the lock info
  IF FOUND AND _row.lock_until IS NOT NULL AND _row.lock_until > now() THEN
    RETURN QUERY SELECT true, _row.lock_until,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (_row.lock_until - now()))/3600)::int);
    RETURN;
  END IF;

  _new_count := COALESCE(_row.failed_count, 0) + 1;

  IF _new_count >= 4 THEN
    -- escalate lock level
    _new_level := COALESCE(_row.lock_level, 0) + 1;
    -- 1st lock = 24h, subsequent = 48h
    _hours := CASE WHEN _new_level <= 1 THEN 24 ELSE 48 END;
    _until := now() + (_hours || ' hours')::interval;

    INSERT INTO public.login_attempts(phone, failed_count, lock_until, lock_level, updated_at)
    VALUES (_phone, 0, _until, _new_level, now())
    ON CONFLICT (phone) DO UPDATE
      SET failed_count = 0,
          lock_until = _until,
          lock_level = _new_level,
          updated_at = now();

    RETURN QUERY SELECT true, _until, _hours;
  ELSE
    INSERT INTO public.login_attempts(phone, failed_count, updated_at)
    VALUES (_phone, _new_count, now())
    ON CONFLICT (phone) DO UPDATE
      SET failed_count = _new_count, updated_at = now();
    RETURN QUERY SELECT false, NULL::timestamptz, 0;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reset_login_attempts(_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.login_attempts
    SET failed_count = 0, lock_until = NULL, updated_at = now()
    WHERE phone = _phone;
END $$;

GRANT EXECUTE ON FUNCTION public.check_login_lock(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_login_attempts(text) TO anon, authenticated;