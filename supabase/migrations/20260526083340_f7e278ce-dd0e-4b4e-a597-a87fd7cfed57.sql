
-- 1. Extend product_images for owner CMS overrides
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS price numeric;

-- Ensure (game_id, package_id) is unique so upsert by package works
CREATE UNIQUE INDEX IF NOT EXISTS product_images_game_pkg_unique
  ON public.product_images (game_id, COALESCE(package_id, '__default__'));

-- 2. system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_type  text not null,        -- 'auth' | 'order' | 'shift' | 'handover' | 'security' | 'system'
  action      text not null,        -- short verb e.g. 'login_success', 'order_created'
  actor_id    uuid,
  actor_role  text,
  details     jsonb not null default '{}'::jsonb,
  ip          text,
  user_agent  text
);

CREATE INDEX IF NOT EXISTS system_logs_created_idx ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS system_logs_type_idx ON public.system_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS system_logs_actor_idx ON public.system_logs (actor_id, created_at DESC);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Owners only can read; nobody writes directly (use SECURITY DEFINER RPC / triggers)
DROP POLICY IF EXISTS "Owners read system_logs" ON public.system_logs;
CREATE POLICY "Owners read system_logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Deny client write system_logs" ON public.system_logs;
CREATE POLICY "Deny client write system_logs"
  ON public.system_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 3. log_event helper
CREATE OR REPLACE FUNCTION public.log_event(
  _event_type text,
  _action     text,
  _details    jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid   uuid := auth.uid();
  _role  text;
  _id    uuid;
BEGIN
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _uid LIMIT 1;

  INSERT INTO public.system_logs (event_type, action, actor_id, actor_role, details)
  VALUES (_event_type, _action, _uid, COALESCE(_role,'anonymous'), COALESCE(_details, '{}'::jsonb))
  RETURNING id INTO _id;

  RETURN _id;
END $$;

REVOKE ALL ON FUNCTION public.log_event(text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_event(text, text, jsonb) TO authenticated;

-- 4. Trigger fns
CREATE OR REPLACE FUNCTION public._tr_log_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE _role text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_logs (event_type, action, actor_id, actor_role, details)
    VALUES ('order','order_created', NEW.user_id, 'client',
            jsonb_build_object('order_id', NEW.id,
                               'game', NEW.game_name,
                               'package', NEW.package_name,
                               'price', NEW.price));
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.status,'') <> COALESCE(OLD.status,'') THEN
    SELECT role::text INTO _role FROM public.user_roles WHERE user_id = COALESCE(NEW.processing_by, auth.uid()) LIMIT 1;
    INSERT INTO public.system_logs (event_type, action, actor_id, actor_role, details)
    VALUES ('order','order_status_changed',
            COALESCE(NEW.processing_by, auth.uid()),
            COALESCE(_role,'system'),
            jsonb_build_object('order_id', NEW.id,
                               'from', OLD.status,
                               'to',   NEW.status,
                               'package', NEW.package_name,
                               'price', NEW.price));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_log_orders ON public.orders;
CREATE TRIGGER tr_log_orders
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public._tr_log_orders();

CREATE OR REPLACE FUNCTION public._tr_log_admin_shifts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE _role text;
BEGIN
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = NEW.admin_id LIMIT 1;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_logs (event_type, action, actor_id, actor_role, details)
    VALUES ('shift','shift_opened', NEW.admin_id, COALESCE(_role,'admin'),
            jsonb_build_object('shift_id', NEW.id,
                               'start_smile', NEW.start_smile,
                               'start_wallet', NEW.start_wallet,
                               'start_instapay', NEW.start_instapay));
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.status,'') <> COALESCE(OLD.status,'') AND NEW.status='closed' THEN
    INSERT INTO public.system_logs (event_type, action, actor_id, actor_role, details)
    VALUES ('shift','shift_closed', NEW.admin_id, COALESCE(_role,'admin'),
            jsonb_build_object('shift_id', NEW.id,
                               'reason', NEW.closed_reason,
                               'end_smile', NEW.end_smile,
                               'end_wallet', NEW.end_wallet,
                               'end_instapay', NEW.end_instapay));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_log_admin_shifts ON public.admin_shifts;
CREATE TRIGGER tr_log_admin_shifts
  AFTER INSERT OR UPDATE ON public.admin_shifts
  FOR EACH ROW EXECUTE FUNCTION public._tr_log_admin_shifts();

CREATE OR REPLACE FUNCTION public._tr_log_shift_handovers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_logs (event_type, action, actor_id, actor_role, details)
    VALUES ('handover','handover_requested', NEW.from_admin, 'admin',
            jsonb_build_object('handover_id', NEW.id,
                               'shift_id', NEW.shift_id,
                               'to_admin', NEW.to_admin));
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.status,'') <> COALESCE(OLD.status,'') THEN
    INSERT INTO public.system_logs (event_type, action, actor_id, actor_role, details)
    VALUES ('handover','handover_'||NEW.status, NEW.to_admin, 'admin',
            jsonb_build_object('handover_id', NEW.id,
                               'shift_id', NEW.shift_id,
                               'from_admin', NEW.from_admin));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_log_shift_handovers ON public.shift_handovers;
CREATE TRIGGER tr_log_shift_handovers
  AFTER INSERT OR UPDATE ON public.shift_handovers
  FOR EACH ROW EXECUTE FUNCTION public._tr_log_shift_handovers();

-- 5. Allow owners to subscribe to system_logs realtime channel
DROP POLICY IF EXISTS "Scoped realtime subscriptions" ON realtime.messages;
CREATE POLICY "Scoped realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() IN (
      'shift_state','admin_shifts','admin_shifts_watch',
      'shift_handovers','handovers-watch','inbox-realtime',
      'system_logs'
    ) THEN public.is_admin_or_owner(auth.uid())
    WHEN realtime.topic() = 'store_status_changes' THEN true
    WHEN realtime.topic() = ('notifications_' || auth.uid()::text) THEN true
    ELSE false
  END
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
