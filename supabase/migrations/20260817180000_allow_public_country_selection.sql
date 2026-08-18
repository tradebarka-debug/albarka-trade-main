-- The country selector is displayed before a visitor has an authenticated role.
-- Country names are public reference data; management remains restricted.
DROP POLICY IF EXISTS "Public can read active countries" ON public.countries;
CREATE POLICY "Public can read active countries"
ON public.countries FOR SELECT
USING (COALESCE(is_active, true));
