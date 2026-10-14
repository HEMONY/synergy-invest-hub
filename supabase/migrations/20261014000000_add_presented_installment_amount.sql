ALTER TABLE public.funding_interests
  ADD COLUMN IF NOT EXISTS presented_installment_amount NUMERIC;