
-- 1. Extend role enum (must be its own statement; cannot reference new value in same tx)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator' BEFORE 'admin';

-- 2. Helper: any staff role (uses text comparison so it works even before enum value commits)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('moderator','admin','owner')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','owner')
  )
$$;

-- 3. Audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id, before, after)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP='DELETE' THEN OLD.id::text ELSE NEW.id::text END), NULL),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

-- 4. Soft delete columns
ALTER TABLE public.orders      ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.reviews     ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 5. Staff sessions (single active session per user)
CREATE TABLE public.staff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id text,
  user_agent text,
  ip text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_ping timestamptz NOT NULL DEFAULT now(),
  is_idle boolean NOT NULL DEFAULT false,
  elevated_until timestamptz,
  ended_at timestamptz,
  ended_reason text
);
CREATE UNIQUE INDEX staff_sessions_one_active ON public.staff_sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX staff_sessions_active_ping ON public.staff_sessions(last_ping) WHERE ended_at IS NULL;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read own session" ON public.staff_sessions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins read all sessions" ON public.staff_sessions FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

-- 6. CD keys (single-use elevation tokens)
CREATE TABLE public.staff_cd_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  label text,
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  used_by uuid,
  expires_at timestamptz,
  archived_at timestamptz
);
ALTER TABLE public.staff_cd_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage cd keys read" ON public.staff_cd_keys FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

-- 7. Schedules
CREATE TABLE public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read schedules" ON public.staff_schedules FOR SELECT
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins write schedules ins" ON public.staff_schedules FOR INSERT
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins write schedules upd" ON public.staff_schedules FOR UPDATE
  USING (public.is_admin_or_owner(auth.uid()));

-- 8. Handovers
CREATE TABLE public.handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL,
  to_user uuid,
  notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz
);
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read handovers" ON public.handovers FOR SELECT
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff insert own handover" ON public.handovers FOR INSERT
  WITH CHECK (auth.uid() = from_user AND public.is_staff(auth.uid()));
CREATE POLICY "Staff ack handover" ON public.handovers FOR UPDATE
  USING (public.is_staff(auth.uid()));

-- 9. Inventory
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  package_name text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  low_threshold integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, package_name)
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Staff write inventory ins" ON public.inventory FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff write inventory upd" ON public.inventory FOR UPDATE
  USING (public.is_staff(auth.uid()));

-- 10. Messages (unified inbox)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid,
  channel text NOT NULL DEFAULT 'app',
  direction text NOT NULL DEFAULT 'inbound',
  body text NOT NULL,
  order_id uuid,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'normal',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer read own messages" ON public.messages FOR SELECT
  USING (auth.uid() = customer_id);
CREATE POLICY "Customer insert own message" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = customer_id AND direction = 'inbound');
CREATE POLICY "Staff read all messages" ON public.messages FOR SELECT
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write messages ins" ON public.messages FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff write messages upd" ON public.messages FOR UPDATE
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Order notes
CREATE TABLE public.order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  mentions uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read order notes" ON public.order_notes FOR SELECT
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff insert own note" ON public.order_notes FOR INSERT
  WITH CHECK (auth.uid() = author_id AND public.is_staff(auth.uid()));

-- 12. Audit triggers on key tables
CREATE TRIGGER audit_orders        AFTER INSERT OR UPDATE OR DELETE ON public.orders        FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_user_roles    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_site_config   AFTER INSERT OR UPDATE OR DELETE ON public.site_config   FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_store_status  AFTER INSERT OR UPDATE OR DELETE ON public.store_status  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_staff_cd_keys AFTER INSERT OR UPDATE OR DELETE ON public.staff_cd_keys FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_inventory     AFTER INSERT OR UPDATE OR DELETE ON public.inventory     FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 13. Realtime publication for inbox + handovers
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handovers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_sessions;
