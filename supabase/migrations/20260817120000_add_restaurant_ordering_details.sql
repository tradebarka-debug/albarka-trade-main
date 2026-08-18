ALTER TABLE public.restaurant_partners
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_delivery_time text,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;
