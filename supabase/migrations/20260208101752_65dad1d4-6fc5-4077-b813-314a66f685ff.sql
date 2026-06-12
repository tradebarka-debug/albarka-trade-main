-- Create a separate table for sensitive payment contact details (phone numbers)
CREATE TABLE IF NOT EXISTS public.payment_request_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_request_contacts_one_per_request UNIQUE (payment_request_id)
);

-- Enable RLS
ALTER TABLE public.payment_request_contacts ENABLE ROW LEVEL SECURITY;

-- Policies: users can INSERT their own contact record but cannot read it back; admins can manage
CREATE POLICY "Admins can manage payment contacts"
ON public.payment_request_contacts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can create their own payment contact"
ON public.payment_request_contacts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Validate that the contact record belongs to the referenced payment request
CREATE OR REPLACE FUNCTION public.validate_payment_request_contact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.payment_requests pr
    WHERE pr.id = NEW.payment_request_id
      AND pr.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'payment_request_id does not belong to user_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_payment_request_contact_on_write ON public.payment_request_contacts;
CREATE TRIGGER validate_payment_request_contact_on_write
BEFORE INSERT OR UPDATE ON public.payment_request_contacts
FOR EACH ROW
EXECUTE FUNCTION public.validate_payment_request_contact();

-- Backfill existing phone numbers into the new table (if any exist)
INSERT INTO public.payment_request_contacts (payment_request_id, user_id, phone_number)
SELECT pr.id, pr.user_id, pr.phone_number
FROM public.payment_requests pr
WHERE pr.phone_number IS NOT NULL
  AND pr.user_id IS NOT NULL
ON CONFLICT (payment_request_id) DO NOTHING;

-- Remove phone numbers from payment_requests to prevent exposure via user SELECT policies
ALTER TABLE public.payment_requests
DROP COLUMN IF EXISTS phone_number;