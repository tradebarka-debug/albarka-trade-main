-- Aligne la sécurité SQL sur la permission métier utilisée par l'administration.
CREATE OR REPLACE FUNCTION public.can_manage_supplier_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.profiles profile
      JOIN public.role_permissions role_permission
        ON role_permission.organization_role_id = profile.organization_role_id
       AND role_permission.actif = true
      JOIN public.permissions permission
        ON permission.id = role_permission.permission_id
      WHERE profile.id = _user_id
        AND permission.code = 'manage_suppliers'
    );
$$;

DROP POLICY IF EXISTS "Authenticated can insert supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can update supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated can delete supplier products" ON public.supplier_products;

CREATE POLICY "Authenticated can insert supplier products"
ON public.supplier_products FOR INSERT TO authenticated
WITH CHECK (public.can_manage_supplier_products(auth.uid()));

CREATE POLICY "Authenticated can update supplier products"
ON public.supplier_products FOR UPDATE TO authenticated
USING (public.can_manage_supplier_products(auth.uid()))
WITH CHECK (public.can_manage_supplier_products(auth.uid()));

CREATE POLICY "Authenticated can delete supplier products"
ON public.supplier_products FOR DELETE TO authenticated
USING (public.can_manage_supplier_products(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can upload supplier product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update supplier product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete supplier product images" ON storage.objects;

CREATE POLICY "Authenticated can upload supplier product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'supplier-products' AND public.can_manage_supplier_products(auth.uid()));

CREATE POLICY "Authenticated can update supplier product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'supplier-products' AND public.can_manage_supplier_products(auth.uid()))
WITH CHECK (bucket_id = 'supplier-products' AND public.can_manage_supplier_products(auth.uid()));

CREATE POLICY "Authenticated can delete supplier product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'supplier-products' AND public.can_manage_supplier_products(auth.uid()));
