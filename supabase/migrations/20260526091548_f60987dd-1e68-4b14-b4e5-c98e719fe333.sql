CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _rec_new jsonb;
  _rec_old jsonb;
  _entity_id text;
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    _rec_old := to_jsonb(OLD);
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    _rec_new := to_jsonb(NEW);
  END IF;

  -- Try common identifier columns without assuming a specific one exists
  _entity_id := COALESCE(
    (CASE WHEN TG_OP='DELETE' THEN _rec_old ELSE _rec_new END) ->> 'id',
    (CASE WHEN TG_OP='DELETE' THEN _rec_old ELSE _rec_new END) ->> 'key',
    (CASE WHEN TG_OP='DELETE' THEN _rec_old ELSE _rec_new END) ->> 'user_id'
  );

  INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id, before, after)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, _entity_id, _rec_old, _rec_new);

  RETURN COALESCE(NEW, OLD);
END $function$;