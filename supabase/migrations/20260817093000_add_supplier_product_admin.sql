-- Champs et accès nécessaires à la gestion des produits des fournisseurs.
ALTER TABLE public.supplier_products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0);

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can insert supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can update supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can delete supplier products" ON public.supplier_products;

CREATE POLICY "Public can view active supplier products"
ON public.supplier_products FOR SELECT
USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert supplier products"
ON public.supplier_products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can update supplier products"
ON public.supplier_products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can delete supplier products"
ON public.supplier_products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-products', 'supplier-products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view supplier product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload supplier product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update supplier product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete supplier product images" ON storage.objects;

CREATE POLICY "Anyone can view supplier product images"
ON storage.objects FOR SELECT USING (bucket_id = 'supplier-products');

CREATE POLICY "Authenticated can upload supplier product images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'supplier-products' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can update supplier product images"
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'supplier-products' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'supplier-products' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can delete supplier product images"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'supplier-products' AND public.has_role(auth.uid(), 'admin'));
