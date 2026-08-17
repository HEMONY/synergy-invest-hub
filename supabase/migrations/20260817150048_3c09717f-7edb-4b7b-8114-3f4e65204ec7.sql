ALTER TABLE public.property_requests
  ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 0;