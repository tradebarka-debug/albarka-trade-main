-- Les anciens plats sans pays appartiennent au catalogue historique Burkina.
UPDATE public.fastfood_items
SET country_id = 1
WHERE country_id IS NULL;

ALTER TABLE public.fastfood_items
  ALTER COLUMN country_id SET DEFAULT 1,
  ALTER COLUMN country_id SET NOT NULL;

-- Remplace les policies historiques incoherentes par un acces public en lecture
-- et une gestion reservee aux administrateurs de la plateforme.
DROP POLICY IF EXISTS " Allow all" ON public.fastfood_items;
DROP POLICY IF EXISTS "Allow read products" ON public.fastfood_items;
DROP POLICY IF EXISTS "Anyone can view active fastfood items" ON public.fastfood_items;
DROP POLICY IF EXISTS "Admins can manage fastfood items" ON public.fastfood_items;

CREATE POLICY "Public can view active fastfood items"
ON public.fastfood_items FOR SELECT TO anon, authenticated
USING (is_active IS TRUE OR public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Platform admins can insert fastfood items"
ON public.fastfood_items FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Platform admins can update fastfood items"
ON public.fastfood_items FOR UPDATE TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Platform admins can delete fastfood items"
ON public.fastfood_items FOR DELETE TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Allow all read" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Allow insert all" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Public can view active products"
ON public.products FOR SELECT TO anon, authenticated
USING (is_active IS TRUE OR public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Platform admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Platform admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Platform admins can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())));

GRANT SELECT ON public.fastfood_items, public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fastfood_items, public.products TO authenticated;

-- Une liquidation historique ne doit pas empecher la suppression d'un
-- restaurant. Les commandes gardent deja leur historique avec SET NULL.
ALTER TABLE public.liquidations
  DROP CONSTRAINT IF EXISTS liquidations_restaurant_id_fkey;
ALTER TABLE public.liquidations
  ADD CONSTRAINT liquidations_restaurant_id_fkey
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurant_partners(id)
  ON DELETE SET NULL;
