-- Fix 1: property_requests_status_check was missing 'in_progress' and 'completed',
-- which are the statuses the app sets when an admin updates project progress.
-- This caused: "new row for relation property_requests violates check constraint
-- property_requests_status_check" whenever a project's progress was increased or
-- the "اكتمل المشروع" button was used.
ALTER TABLE public.property_requests
  DROP CONSTRAINT IF EXISTS property_requests_status_check;

ALTER TABLE public.property_requests
  ADD CONSTRAINT property_requests_status_check
  CHECK (status IN ('review', 'published', 'matched', 'in_progress', 'completed', 'rejected'));

-- Fix 2: notify_owner_on_interest() used DOUBLE-quoted text ("شركة غقارية مهتمه بطلبك")
-- for the notification title. In PostgreSQL, double quotes denote an identifier,
-- not a string literal, so this INSERT failed every time an investor/real-estate
-- company expressed interest in a request (silently breaking the notification and
-- surfacing as an error on the interest action). Also fixes two typos
-- (غقارية -> عقارية, مهتمه -> مهتمة, الغمل -> العمل).
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
    VALUES (
      _owner,
      'request',
      'شركة عقارية مهتمة بطلبك',
      'قامت شركة عقارية موثوقة بإبداء رغبة في العمل في الطلب رقم ' || COALESCE(_code, '') || ' وجارٍ مراجعة الربط من الإدارة.'
    );
  END IF;
  RETURN NEW;
END; $$;
