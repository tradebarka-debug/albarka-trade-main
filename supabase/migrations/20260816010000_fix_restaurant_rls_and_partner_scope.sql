-- 1) Corrige le chargement de "Restaurants partenaires" / "Menus restaurants"
-- dans l'espace admin : ces tables ont ete creees hors migration (drift) et
-- n'avaient donc aucune policy RLS explicite, ce qui bloquait le SELECT.
ALTER TABLE public.restaurant_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active restaurant partners" ON public.restaurant_partners;
DROP POLICY IF EXISTS "Admins can insert restaurant partners" ON public.restaurant_partners;
DROP POLICY IF EXISTS "Admins can update restaurant partners" ON public.restaurant_partners;
DROP POLICY IF EXISTS "Admins can delete restaurant partners" ON public.restaurant_partners;

CREATE POLICY "Public can view active restaurant partners"
ON public.restaurant_partners FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated');

CREATE POLICY "Admins can insert restaurant partners"
ON public.restaurant_partners FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update restaurant partners"
ON public.restaurant_partners FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete restaurant partners"
ON public.restaurant_partners FOR DELETE
TO authenticated
USING (true);

ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view available menu items" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.restaurant_menu_items;

CREATE POLICY "Public can view available menu items"
ON public.restaurant_menu_items FOR SELECT
USING (is_available = true OR public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated');

CREATE POLICY "Admins can insert menu items"
ON public.restaurant_menu_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update menu items"
ON public.restaurant_menu_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete menu items"
ON public.restaurant_menu_items FOR DELETE
TO authenticated
USING (true);

-- 2) Stockage d'images pour restaurants/menus (upload direct au lieu d'une URL).
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete restaurant images" ON storage.objects;

CREATE POLICY "Anyone can view restaurant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated can upload restaurant images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated can update restaurant images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated can delete restaurant images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-images');

-- 3) Portee locale/internationale pour les fournisseurs (classement admin).
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'local' CHECK (scope IN ('local', 'international'));

-- 4) Nouvelle rubrique "Usines partenaires" (locales et internationales),
-- calquee sur le fonctionnement de la table suppliers.
CREATE TABLE IF NOT EXISTS public.factories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_name text NOT NULL,
  category text NOT NULL DEFAULT 'Usine',
  country text,
  city text,
  email text,
  telephone text,
  whatsapp text,
  website text,
  description text,
  logo text,
  status text NOT NULL DEFAULT 'active',
  certified boolean NOT NULL DEFAULT false,
  scope text NOT NULL DEFAULT 'local' CHECK (scope IN ('local', 'international')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active factories" ON public.factories;
DROP POLICY IF EXISTS "Admins can insert factories" ON public.factories;
DROP POLICY IF EXISTS "Admins can update factories" ON public.factories;
DROP POLICY IF EXISTS "Admins can delete factories" ON public.factories;

CREATE POLICY "Public can view active factories"
ON public.factories FOR SELECT
USING (status = 'active' OR public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated');

CREATE POLICY "Admins can insert factories"
ON public.factories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update factories"
ON public.factories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete factories"
ON public.factories FOR DELETE
TO authenticated
USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('factory-logos', 'factory-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view factory logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload factory logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update factory logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete factory logos" ON storage.objects;

CREATE POLICY "Anyone can view factory logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'factory-logos');

CREATE POLICY "Authenticated can upload factory logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'factory-logos');

CREATE POLICY "Authenticated can update factory logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'factory-logos');

CREATE POLICY "Authenticated can delete factory logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'factory-logos');
