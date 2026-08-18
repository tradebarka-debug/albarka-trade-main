-- Produits rattachés aux usines partenaires.
CREATE TABLE IF NOT EXISTS public.factory_products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  factory_id bigint NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  unit text,
  description text,
  image text,
  in_stock boolean NOT NULL DEFAULT true,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS factory_products_factory_id_idx ON public.factory_products(factory_id);

ALTER TABLE public.factory_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active factory products"
ON public.factory_products FOR SELECT
USING (status = 'active' OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert factory products"
ON public.factory_products FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update factory products"
ON public.factory_products FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete factory products"
ON public.factory_products FOR DELETE TO authenticated
USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('factory-products', 'factory-products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view factory product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'factory-products');

CREATE POLICY "Authenticated can upload factory product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'factory-products');

CREATE POLICY "Authenticated can update factory product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'factory-products') WITH CHECK (bucket_id = 'factory-products');

CREATE POLICY "Authenticated can delete factory product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'factory-products');
