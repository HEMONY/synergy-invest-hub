CREATE TABLE public.request_private_details (
  request_id UUID PRIMARY KEY REFERENCES public.property_requests(id) ON DELETE CASCADE,
  owner_phone TEXT NOT NULL DEFAULT '',
  location_details TEXT NOT NULL DEFAULT '',
  property_details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_private_details TO authenticated;
GRANT ALL ON public.request_private_details TO service_role;

ALTER TABLE public.request_private_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "private_details_insert_owner" ON public.request_private_details
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = request_id AND r.owner_id = auth.uid()));

CREATE POLICY "private_details_update_scoped" ON public.request_private_details
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "private_details_delete_scoped" ON public.request_private_details
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "private_details_select_scoped" ON public.request_private_details
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
  OR EXISTS (
    SELECT 1 FROM public.funding_interests i
    WHERE i.request_id = request_private_details.request_id
      AND i.investor_id = auth.uid()
      AND i.status = 'commission_paid'
  )
);

CREATE TRIGGER update_request_private_details_updated_at
BEFORE UPDATE ON public.request_private_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.funding_interests
  ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_location TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS scope_of_work TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS proposed_works TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS warranty TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMPTZ;

CREATE POLICY "interests_update_request_owner" ON public.funding_interests
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = funding_interests.request_id AND r.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = funding_interests.request_id AND r.owner_id = auth.uid()));