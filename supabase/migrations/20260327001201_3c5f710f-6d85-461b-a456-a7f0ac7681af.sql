
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  phone text,
  total_diamonds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'owner'));

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  platform text NOT NULL DEFAULT 'Website',
  rating integer NOT NULL DEFAULT 5,
  review_text text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Auth users can create reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete reviews" ON public.reviews
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete reviews" ON public.reviews
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

-- Rating validation trigger
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_rating_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Initialize new user function (called from app after signup)
CREATE OR REPLACE FUNCTION public.initialize_new_user(p_user_id uuid, p_phone text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.profiles (user_id, phone) VALUES (p_user_id, p_phone)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Add diamonds to user profile (called when order approved)
CREATE OR REPLACE FUNCTION public.add_diamonds(p_user_id uuid, p_diamonds integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles SET total_diamonds = total_diamonds + p_diamonds WHERE user_id = p_user_id;
END;
$$;

-- Owner policies for user_roles management
CREATE POLICY "Owners can read all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'owner'));
