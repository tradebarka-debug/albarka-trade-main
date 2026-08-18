ALTER TABLE public.restaurant_partners
  ADD COLUMN IF NOT EXISTS payment_phone text,
  ADD COLUMN IF NOT EXISTS payment_beneficiary text;

UPDATE public.restaurant_partners
SET payment_phone = coalesce(nullif(payment_phone, ''), nullif(whatsapp, ''), telephone),
    payment_beneficiary = coalesce(nullif(payment_beneficiary, ''), name)
WHERE payment_phone IS NULL OR payment_phone = '' OR payment_beneficiary IS NULL OR payment_beneficiary = '';
