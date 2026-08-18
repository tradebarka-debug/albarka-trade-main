-- Les administrateurs historiques peuvent être reconnus depuis profiles.role
-- alors que les comptes récents utilisent user_roles. Cette fonction couvre les deux cas.
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND role::text = 'admin'
    );
$$;

DROP POLICY IF EXISTS "Public can view active supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can insert supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can update supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can delete supplier products" ON public.supplier_products;

CREATE POLICY "Public can view active supplier products"
ON public.supplier_products FOR SELECT
USING (status = 'active' OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Authenticated can insert supplier products"
ON public.supplier_products FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Authenticated can update supplier products"
ON public.supplier_products FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Authenticated can delete supplier products"
ON public.supplier_products FOR DELETE TO authenticated
USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can upload supplier product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update supplier product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete supplier product images" ON storage.objects;

CREATE POLICY "Authenticated can upload supplier product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'supplier-products' AND public.is_platform_admin(auth.uid()));

CREATE POLICY "Authenticated can update supplier product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'supplier-products' AND public.is_platform_admin(auth.uid()))
WITH CHECK (bucket_id = 'supplier-products' AND public.is_platform_admin(auth.uid()));

CREATE POLICY "Authenticated can delete supplier product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'supplier-products' AND public.is_platform_admin(auth.uid()));
