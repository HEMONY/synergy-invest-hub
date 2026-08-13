-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  account_type TEXT NOT NULL DEFAULT 'owner' CHECK (account_type IN ('owner','investor')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- roles
CREATE TYPE public.app_role AS ENUM ('admin','supervisor','owner','investor');
CREATE TABLE public.user_roles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- property requests
CREATE TABLE public.property_requests (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT ('#' || (floor(random() * 9000) + 1000)::int::text),
  property_type TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  damage_description TEXT NOT NULL DEFAULT '',
  rehab_cost NUMERIC NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 6,
  funding_needed NUMERIC NOT NULL DEFAULT 0,
  expected_return NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review','published','matched','rejected')),
  stage_index INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_requests TO authenticated;
GRANT ALL ON public.property_requests TO service_role;
ALTER TABLE public.property_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests_select_published" ON public.property_requests FOR SELECT TO anon, authenticated
  USING (status IN ('published','matched'));
CREATE POLICY "requests_select_own" ON public.property_requests FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "requests_insert_own" ON public.property_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "requests_update_own" ON public.property_requests FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "requests_delete_own" ON public.property_requests FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'project',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_property_requests_updated_at BEFORE UPDATE ON public.property_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _account_type TEXT := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'owner');
BEGIN
  IF _account_type NOT IN ('owner','investor') THEN
    _account_type := 'owner';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NEW.raw_user_meta_data ->> 'phone',
    _account_type
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _account_type::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();