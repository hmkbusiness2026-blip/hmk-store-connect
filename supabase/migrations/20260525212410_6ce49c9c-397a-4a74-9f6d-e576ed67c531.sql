
-- PRO articles (Event Tables)
CREATE TABLE public.pro_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pro_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed read published pro_articles"
ON public.pro_articles FOR SELECT TO authenticated
USING (published = true OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins insert pro_articles"
ON public.pro_articles FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins update pro_articles"
ON public.pro_articles FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins delete pro_articles"
ON public.pro_articles FOR DELETE TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER trg_pro_articles_updated
BEFORE UPDATE ON public.pro_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRO emote codes
CREATE TABLE public.pro_emote_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  image_url TEXT,
  admin_notes TEXT,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pro_emote_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed read active emote codes"
ON public.pro_emote_codes FOR SELECT TO authenticated
USING (active = true OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins insert emote codes"
ON public.pro_emote_codes FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins update emote codes"
ON public.pro_emote_codes FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins delete emote codes"
ON public.pro_emote_codes FOR DELETE TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER trg_pro_emote_codes_updated
BEFORE UPDATE ON public.pro_emote_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- get_pro_status RPC
CREATE OR REPLACE FUNCTION public.get_pro_status()
RETURNS TABLE(
  total_spent NUMERIC,
  tier TEXT,
  duration_days INT,
  expires_at TIMESTAMPTZ,
  days_remaining INT,
  is_pro BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid UUID := auth.uid();
  _spent NUMERIC := 0;
  _last TIMESTAMPTZ;
  _days INT := 0;
  _tier TEXT := 'none';
  _expires TIMESTAMPTZ;
  _remaining INT := 0;
BEGIN
  IF _uid IS NULL THEN
    RETURN QUERY SELECT 0::numeric, 'none'::text, 0, NULL::timestamptz, 0, false;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(price),0), MAX(updated_at)
    INTO _spent, _last
    FROM public.orders
    WHERE user_id = _uid AND status = 'completed';

  IF _spent >= 10000 THEN
    _days := 180; _tier := 'gold';
  ELSIF _spent >= 5000 THEN
    _days := 90; _tier := 'silver';
  ELSIF _spent >= 250 THEN
    _days := 60; _tier := 'bronze';
  END IF;

  IF _days > 0 AND _last IS NOT NULL THEN
    _expires := _last + (_days || ' days')::interval;
    _remaining := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (_expires - now()))/86400)::int);
  END IF;

  RETURN QUERY SELECT _spent, _tier, _days, _expires, _remaining, (_remaining > 0);
END $$;
