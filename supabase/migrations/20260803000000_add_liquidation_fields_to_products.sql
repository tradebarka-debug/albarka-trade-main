ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_liquidation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS liquidation_price numeric,
  ADD COLUMN IF NOT EXISTS liquidation_until timestamp with time zone;

UPDATE public.products
SET is_liquidation = false
WHERE is_liquidation IS NULL;

ALTER TABLE public.products
  ADD CONSTRAINT check_liquidation_price_valid
  CHECK (liquidation_price IS NULL OR (liquidation_price >= 0 AND liquidation_price < 1000000000));
