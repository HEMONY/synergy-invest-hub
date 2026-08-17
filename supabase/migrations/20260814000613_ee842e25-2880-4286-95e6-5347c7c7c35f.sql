ALTER TABLE public.property_requests
  ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'damaged',
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS area_sqm NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS return_notes TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.funding_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.property_requests(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, investor_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_interests TO authenticated;
GRANT ALL ON public.funding_interests TO service_role;

ALTER TABLE public.funding_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interests_select_scoped" ON public.funding_interests
FOR SELECT TO authenticated
USING (
  auth.uid() = investor_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
  OR EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
);

CREATE POLICY "interests_insert_own" ON public.funding_interests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "interests_update_scoped" ON public.funding_interests
FOR UPDATE TO authenticated
USING (auth.uid() = investor_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (auth.uid() = investor_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "interests_delete_own" ON public.funding_interests
FOR DELETE TO authenticated
USING (auth.uid() = investor_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_funding_interests_updated_at
BEFORE UPDATE ON public.funding_interests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "notifications_insert_own" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_owner_on_interest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner UUID;
  _code TEXT;
BEGIN
  SELECT owner_id, code INTO _owner, _code FROM public.property_requests WHERE id = NEW.request_id;
  IF _owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, title, body)
    VALUES (_owner, 'request', "شركة غقارية مهتمه بطلبك",
      'قامت شركة عقارية موثوقة بإبداء رغبة  في الغمل في الطلب رقم ' || COALESCE(_code, '') || ' وجارٍ مراجعة الربط من الإدارة.');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_funding_interest_created
AFTER INSERT ON public.funding_interests
FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_interest();