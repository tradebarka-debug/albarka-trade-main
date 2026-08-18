ALTER TABLE public.supplier_products
  ADD COLUMN IF NOT EXISTS category text;
