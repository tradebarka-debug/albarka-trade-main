ALTER TABLE public.city_distances ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.city_distances FROM anon, authenticated;
GRANT SELECT ON TABLE public.city_distances TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read active city distances" ON public.city_distances;
CREATE POLICY "Public can read active city distances"
ON public.city_distances FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE);

ALTER VIEW public.v_city_distances SET (security_invoker = true);

REVOKE ALL ON TABLE public.v_city_distances FROM anon, authenticated;
GRANT SELECT ON TABLE public.v_city_distances TO anon, authenticated;
