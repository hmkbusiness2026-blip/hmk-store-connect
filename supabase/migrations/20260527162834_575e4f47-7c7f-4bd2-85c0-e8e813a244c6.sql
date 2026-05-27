ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mlbb_id text,
  ADD COLUMN IF NOT EXISTS mlbb_server text,
  ADD COLUMN IF NOT EXISTS hok_uid text;