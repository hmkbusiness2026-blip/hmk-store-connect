
-- Enable pgcrypto for digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- admin_profiles
-- =========================================================
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  vodafone_cash TEXT,
  instapay_id TEXT,
  vault_key_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads own profile"
  ON public.admin_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin inserts own profile"
  ON public.admin_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admin updates own profile"
  ON public.admin_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all admin profiles"
  ON public.admin_profiles FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER admin_profiles_updated
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- admin_shifts
-- =========================================================
CREATE TABLE public.admin_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open | closed
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_reason TEXT, -- end | handover
  start_smile NUMERIC,
  start_wallet NUMERIC,
  start_instapay NUMERIC,
  start_smile_note TEXT,
  start_wallet_note TEXT,
  start_instapay_note TEXT,
  end_smile NUMERIC,
  end_wallet NUMERIC,
  end_instapay NUMERIC,
  end_smile_note TEXT,
  end_wallet_note TEXT,
  end_instapay_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one open shift at any time across the system
CREATE UNIQUE INDEX admin_shifts_one_open ON public.admin_shifts ((1)) WHERE status = 'open';
CREATE INDEX admin_shifts_admin_idx ON public.admin_shifts (admin_id);

ALTER TABLE public.admin_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read shifts"
  ON public.admin_shifts FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

-- =========================================================
-- shift_handovers
-- =========================================================
CREATE TABLE public.shift_handovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES public.admin_shifts(id) ON DELETE CASCADE,
  from_admin UUID NOT NULL,
  to_admin UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX shift_handovers_to_admin_idx ON public.shift_handovers (to_admin, status);

ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read handovers"
  ON public.shift_handovers FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

-- =========================================================
-- Helpers
-- =========================================================
CREATE OR REPLACE FUNCTION public._hash_vault(_key TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(coalesce(_key,''), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.set_vault_key(_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can set vault key';
  END IF;
  IF coalesce(length(_key),0) < 4 THEN
    RAISE EXCEPTION 'Vault key too short';
  END IF;
  INSERT INTO public.admin_profiles (user_id, vault_key_hash)
    VALUES (auth.uid(), public._hash_vault(_key))
  ON CONFLICT (user_id) DO UPDATE
    SET vault_key_hash = EXCLUDED.vault_key_hash, updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.update_admin_profile(_full_name TEXT, _vodafone TEXT, _instapay TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins';
  END IF;
  INSERT INTO public.admin_profiles (user_id, full_name, vodafone_cash, instapay_id)
    VALUES (auth.uid(), _full_name, _vodafone, _instapay)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        vodafone_cash = EXCLUDED.vodafone_cash,
        instapay_id = EXCLUDED.instapay_id,
        updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.verify_vault_key(_user_id UUID, _key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = _user_id
      AND vault_key_hash IS NOT NULL
      AND vault_key_hash = public._hash_vault(_key)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_on_duty()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_shifts WHERE status = 'open');
$$;

CREATE OR REPLACE FUNCTION public.get_active_admin()
RETURNS TABLE (admin_id UUID, full_name TEXT, vodafone_cash TEXT, instapay_id TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.admin_id, p.full_name, p.vodafone_cash, p.instapay_id
  FROM public.admin_shifts s
  LEFT JOIN public.admin_profiles p ON p.user_id = s.admin_id
  WHERE s.status = 'open'
  LIMIT 1;
$$;

-- Open shift
CREATE OR REPLACE FUNCTION public.open_shift(
  _vault_key TEXT,
  _start_smile NUMERIC, _start_wallet NUMERIC, _start_instapay NUMERIC,
  _start_smile_note TEXT, _start_wallet_note TEXT, _start_instapay_note TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _shift_id UUID;
BEGIN
  IF NOT public.is_admin_or_owner(_uid) THEN
    RAISE EXCEPTION 'Only admins can open a shift';
  END IF;
  IF NOT public.verify_vault_key(_uid, _vault_key) THEN
    RAISE EXCEPTION 'Invalid vault key';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_shifts WHERE status='open') THEN
    RAISE EXCEPTION 'Another shift is already open';
  END IF;
  INSERT INTO public.admin_shifts (
    admin_id, status, start_smile, start_wallet, start_instapay,
    start_smile_note, start_wallet_note, start_instapay_note
  ) VALUES (
    _uid, 'open', _start_smile, _start_wallet, _start_instapay,
    _start_smile_note, _start_wallet_note, _start_instapay_note
  ) RETURNING id INTO _shift_id;
  RETURN _shift_id;
END $$;

-- Close shift
CREATE OR REPLACE FUNCTION public.close_shift(
  _vault_key TEXT,
  _end_smile NUMERIC, _end_wallet NUMERIC, _end_instapay NUMERIC,
  _end_smile_note TEXT, _end_wallet_note TEXT, _end_instapay_note TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _shift_id UUID;
BEGIN
  IF NOT public.is_admin_or_owner(_uid) THEN
    RAISE EXCEPTION 'Only admins';
  END IF;
  IF NOT public.verify_vault_key(_uid, _vault_key) THEN
    RAISE EXCEPTION 'Invalid vault key';
  END IF;
  SELECT id INTO _shift_id FROM public.admin_shifts WHERE status='open' AND admin_id=_uid;
  IF _shift_id IS NULL THEN
    RAISE EXCEPTION 'You have no open shift';
  END IF;
  UPDATE public.admin_shifts SET
    status='closed', closed_at=now(), closed_reason='end',
    end_smile=_end_smile, end_wallet=_end_wallet, end_instapay=_end_instapay,
    end_smile_note=_end_smile_note, end_wallet_note=_end_wallet_note, end_instapay_note=_end_instapay_note
  WHERE id=_shift_id;
  RETURN _shift_id;
END $$;

-- Request handover (from admin closes their values, target must accept with their vault key + start values)
CREATE OR REPLACE FUNCTION public.request_handover(
  _to_admin UUID,
  _vault_key TEXT,
  _end_smile NUMERIC, _end_wallet NUMERIC, _end_instapay NUMERIC,
  _end_smile_note TEXT, _end_wallet_note TEXT, _end_instapay_note TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _shift_id UUID;
  _handover_id UUID;
BEGIN
  IF NOT public.is_admin_or_owner(_uid) THEN RAISE EXCEPTION 'Only admins'; END IF;
  IF _to_admin = _uid THEN RAISE EXCEPTION 'Cannot hand over to yourself'; END IF;
  IF NOT public.is_admin_or_owner(_to_admin) THEN RAISE EXCEPTION 'Target is not an admin'; END IF;
  IF NOT public.verify_vault_key(_uid, _vault_key) THEN RAISE EXCEPTION 'Invalid vault key'; END IF;
  SELECT id INTO _shift_id FROM public.admin_shifts WHERE status='open' AND admin_id=_uid;
  IF _shift_id IS NULL THEN RAISE EXCEPTION 'You have no open shift'; END IF;

  -- Record end values on current shift but keep it open until target accepts
  UPDATE public.admin_shifts SET
    end_smile=_end_smile, end_wallet=_end_wallet, end_instapay=_end_instapay,
    end_smile_note=_end_smile_note, end_wallet_note=_end_wallet_note, end_instapay_note=_end_instapay_note
  WHERE id=_shift_id;

  INSERT INTO public.shift_handovers (shift_id, from_admin, to_admin, status)
    VALUES (_shift_id, _uid, _to_admin, 'pending')
  RETURNING id INTO _handover_id;

  INSERT INTO public.notifications (user_id, title, message)
    VALUES (_to_admin, 'طلب تسليم شفت', 'لديك طلب تسليم شفت بانتظار القبول');

  RETURN _handover_id;
END $$;

-- Accept handover: closes previous shift, opens new one for target admin
CREATE OR REPLACE FUNCTION public.accept_handover(
  _handover_id UUID,
  _vault_key TEXT,
  _start_smile NUMERIC, _start_wallet NUMERIC, _start_instapay NUMERIC,
  _start_smile_note TEXT, _start_wallet_note TEXT, _start_instapay_note TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _h RECORD;
  _new_shift UUID;
BEGIN
  IF NOT public.is_admin_or_owner(_uid) THEN RAISE EXCEPTION 'Only admins'; END IF;
  SELECT * INTO _h FROM public.shift_handovers WHERE id=_handover_id;
  IF NOT FOUND OR _h.to_admin <> _uid OR _h.status <> 'pending' THEN
    RAISE EXCEPTION 'Invalid handover';
  END IF;
  IF NOT public.verify_vault_key(_uid, _vault_key) THEN RAISE EXCEPTION 'Invalid vault key'; END IF;

  -- Close previous shift
  UPDATE public.admin_shifts SET
    status='closed', closed_at=now(), closed_reason='handover'
  WHERE id=_h.shift_id;

  -- Open new shift for target admin
  INSERT INTO public.admin_shifts (
    admin_id, status, start_smile, start_wallet, start_instapay,
    start_smile_note, start_wallet_note, start_instapay_note
  ) VALUES (
    _uid, 'open', _start_smile, _start_wallet, _start_instapay,
    _start_smile_note, _start_wallet_note, _start_instapay_note
  ) RETURNING id INTO _new_shift;

  UPDATE public.shift_handovers SET status='accepted', responded_at=now() WHERE id=_handover_id;

  INSERT INTO public.notifications (user_id, title, message)
    VALUES (_h.from_admin, 'تم قبول التسليم', 'تم قبول طلب تسليم الشفت');

  RETURN _new_shift;
END $$;

CREATE OR REPLACE FUNCTION public.reject_handover(_handover_id UUID, _vault_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _h RECORD;
BEGIN
  SELECT * INTO _h FROM public.shift_handovers WHERE id=_handover_id;
  IF NOT FOUND OR _h.to_admin <> _uid OR _h.status <> 'pending' THEN
    RAISE EXCEPTION 'Invalid handover';
  END IF;
  IF NOT public.verify_vault_key(_uid, _vault_key) THEN RAISE EXCEPTION 'Invalid vault key'; END IF;

  UPDATE public.shift_handovers SET status='rejected', responded_at=now() WHERE id=_handover_id;

  -- Clear end values on shift since rejected
  UPDATE public.admin_shifts SET
    end_smile=NULL, end_wallet=NULL, end_instapay=NULL,
    end_smile_note=NULL, end_wallet_note=NULL, end_instapay_note=NULL
  WHERE id=_h.shift_id;

  INSERT INTO public.notifications (user_id, title, message)
    VALUES (_h.from_admin, 'تم رفض التسليم', 'تم رفض طلب تسليم الشفت');
END $$;

-- List other admins (for handover picker)
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (user_id UUID, full_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id, COALESCE(ap.full_name, '')
  FROM public.user_roles ur
  LEFT JOIN public.admin_profiles ap ON ap.user_id = ur.user_id
  WHERE ur.role::text IN ('admin','owner')
    AND ur.user_id <> auth.uid();
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_handovers;
