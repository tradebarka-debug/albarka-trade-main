-- Information displayed on a supplier's public commercial storefront.
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS location_details text,
  ADD COLUMN IF NOT EXISTS categories text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS partner_status text NOT NULL DEFAULT 'partner',
  ADD COLUMN IF NOT EXISTS commercial_terms text,
  ADD COLUMN IF NOT EXISTS catalog_url text;

ALTER TABLE public.suppliers
  DROP CONSTRAINT IF EXISTS suppliers_partner_status_check;

ALTER TABLE public.suppliers
  ADD CONSTRAINT suppliers_partner_status_check
  CHECK (partner_status IN ('partner', 'verified', 'premium'));
