
CREATE OR REPLACE FUNCTION public.inventory_adjust(p_game_id text, p_package text, p_delta integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.inventory(game_id, package_name, stock)
  VALUES (p_game_id, p_package, GREATEST(p_delta, 0))
  ON CONFLICT (game_id, package_name)
  DO UPDATE SET stock = GREATEST(public.inventory.stock + p_delta, 0), updated_at = now();
END $$;
REVOKE EXECUTE ON FUNCTION public.inventory_adjust(text, text, integer) FROM PUBLIC, anon, authenticated;

-- Auto idle marker
CREATE OR REPLACE FUNCTION public.mark_idle_sessions()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.staff_sessions
  SET is_idle = true
  WHERE ended_at IS NULL
    AND last_ping < now() - interval '10 minutes'
    AND is_idle = false;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_idle_sessions() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('mark-idle-sessions', '* * * * *', $$ SELECT public.mark_idle_sessions(); $$);
