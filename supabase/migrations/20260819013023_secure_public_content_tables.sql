-- Tables exposees par la Data API : activer RLS avant de reduire les droits.
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Retirer notamment TRUNCATE, REFERENCES et TRIGGER des roles web, puis ne
-- rendre que les operations reellement utilisees par le site.
REVOKE ALL ON TABLE public.applications FROM anon, authenticated;
REVOKE ALL ON TABLE public.cities FROM anon, authenticated;
REVOKE ALL ON TABLE public.formations FROM anon, authenticated;
REVOKE ALL ON TABLE public.services FROM anon, authenticated;

GRANT INSERT ON TABLE public.applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.applications TO authenticated;

GRANT SELECT ON TABLE public.cities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.cities TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.cities_id_seq TO authenticated;

GRANT SELECT ON TABLE public.formations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.formations TO authenticated;

GRANT SELECT ON TABLE public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.services TO authenticated;

DROP POLICY IF EXISTS "Public can submit pending applications" ON public.applications;
DROP POLICY IF EXISTS "Albarka admins can read applications" ON public.applications;
DROP POLICY IF EXISTS "Albarka admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Albarka admins can delete applications" ON public.applications;

CREATE POLICY "Public can submit pending applications"
ON public.applications FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'En attente');

CREATE POLICY "Albarka admins can read applications"
ON public.applications FOR SELECT
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Albarka admins can update applications"
ON public.applications FOR UPDATE
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Albarka admins can delete applications"
ON public.applications FOR DELETE
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Public can read active cities" ON public.cities;
DROP POLICY IF EXISTS "Albarka admins can manage cities" ON public.cities;

CREATE POLICY "Public can read active cities"
ON public.cities FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE OR public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Albarka admins can manage cities"
ON public.cities FOR ALL
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Public can read formations" ON public.formations;
DROP POLICY IF EXISTS "Albarka admins can manage formations" ON public.formations;

CREATE POLICY "Public can read formations"
ON public.formations FOR SELECT
TO anon, authenticated
USING (TRUE);

CREATE POLICY "Albarka admins can manage formations"
ON public.formations FOR ALL
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Public can read active services" ON public.services;
DROP POLICY IF EXISTS "Albarka admins can manage services" ON public.services;

CREATE POLICY "Public can read active services"
ON public.services FOR SELECT
TO anon, authenticated
USING (lower(status) = 'actif' OR public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Albarka admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));
