CREATE OR REPLACE FUNCTION public._hash_vault(_key text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT encode(digest(coalesce(_key,''), 'sha256'), 'hex');
$function$;