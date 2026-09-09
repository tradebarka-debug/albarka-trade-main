BEGIN;

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Livreur consulte ses livraisons" ON public.deliveries;
CREATE POLICY "Livreur consulte ses livraisons"
ON public.deliveries
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Livreur met a jour ses livraisons" ON public.deliveries;
CREATE POLICY "Livreur met a jour ses livraisons"
ON public.deliveries
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = driver_id)
WITH CHECK ((SELECT auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Livreur consulte sa disponibilite" ON public.driver_status;
CREATE POLICY "Livreur consulte sa disponibilite"
ON public.driver_status
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Livreur cree sa disponibilite" ON public.driver_status;
CREATE POLICY "Livreur cree sa disponibilite"
ON public.driver_status
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Livreur modifie sa disponibilite" ON public.driver_status;
CREATE POLICY "Livreur modifie sa disponibilite"
ON public.driver_status
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = driver_id)
WITH CHECK ((SELECT auth.uid()) = driver_id);

GRANT SELECT, UPDATE ON public.deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.driver_status TO authenticated;

COMMIT;
