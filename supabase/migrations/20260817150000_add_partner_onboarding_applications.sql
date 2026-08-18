CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_type text NOT NULL CHECK (application_type IN ('restaurant', 'commercial', 'courier', 'representative')),
  company_name text,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  country text,
  city text,
  address text,
  message text,
  referral_code text,
  partner_code text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE OR REPLACE FUNCTION public.set_partner_application_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (NEW.partner_code IS NULL OR btrim(NEW.partner_code) = '') THEN
    NEW.partner_code := 'AT-' || upper(substr(NEW.application_type, 1, 3)) || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));
  END IF;
  IF NEW.status IN ('approved', 'rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_partner_application_code ON public.partner_applications;
CREATE TRIGGER set_partner_application_code
  BEFORE INSERT OR UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_partner_application_code();

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a partner application"
ON public.partner_applications FOR INSERT
WITH CHECK (status = 'pending' AND partner_code IS NULL AND admin_notes IS NULL);

CREATE POLICY "Admins can manage partner applications"
ON public.partner_applications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
