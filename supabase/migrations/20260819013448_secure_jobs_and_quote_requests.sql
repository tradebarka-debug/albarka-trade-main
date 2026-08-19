ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.jobs FROM anon, authenticated;
REVOKE ALL ON TABLE public.quote_requests FROM anon, authenticated;

GRANT SELECT ON TABLE public.jobs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.jobs TO authenticated;

GRANT INSERT ON TABLE public.quote_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.quote_requests TO authenticated;

DROP POLICY IF EXISTS "Public can read open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Albarka admins can manage jobs" ON public.jobs;

CREATE POLICY "Public can read open jobs"
ON public.jobs FOR SELECT
TO anon, authenticated
USING (lower(status) = 'ouvert' OR public.is_platform_admin((SELECT auth.uid())));

CREATE POLICY "Albarka admins can manage jobs"
ON public.jobs FOR ALL
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Public can submit quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Albarka admins can manage quote requests" ON public.quote_requests;

CREATE POLICY "Public can submit quote requests"
ON public.quote_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  product_id IS NOT NULL
  AND supplier_id IS NOT NULL
  AND length(trim(customer_name)) BETWEEN 2 AND 150
  AND length(trim(telephone)) BETWEEN 5 AND 40
  AND quantity > 0
);

CREATE POLICY "Albarka admins can manage quote requests"
ON public.quote_requests FOR ALL
TO authenticated
USING (public.is_platform_admin((SELECT auth.uid())))
WITH CHECK (public.is_platform_admin((SELECT auth.uid())));
