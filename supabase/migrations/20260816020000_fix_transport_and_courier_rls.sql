-- transport_companies avait ete modifiee hors migration (drift) et ne
-- conservait plus qu'une policy SELECT publique : tout INSERT/UPDATE/DELETE
-- echouait silencieusement (RLS actif, aucune policy d'ecriture), d'ou
-- "Ajouter compagnie de transport affiche erreur apres validation".
DROP POLICY IF EXISTS "Admins can manage companies" ON public.transport_companies;
DROP POLICY IF EXISTS "Authenticated can insert transport companies" ON public.transport_companies;
DROP POLICY IF EXISTS "Authenticated can update transport companies" ON public.transport_companies;
DROP POLICY IF EXISTS "Authenticated can delete transport companies" ON public.transport_companies;

CREATE POLICY "Authenticated can insert transport companies"
ON public.transport_companies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update transport companies"
ON public.transport_companies FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete transport companies"
ON public.transport_companies FOR DELETE
TO authenticated
USING (true);

-- courier_services (Livreurs, meme rubrique Voyages) avait le meme
-- probleme : aucune policy d'ecriture du tout.
DROP POLICY IF EXISTS "Admins can manage courier services" ON public.courier_services;
DROP POLICY IF EXISTS "Authenticated can insert courier services" ON public.courier_services;
DROP POLICY IF EXISTS "Authenticated can update courier services" ON public.courier_services;
DROP POLICY IF EXISTS "Authenticated can delete courier services" ON public.courier_services;

CREATE POLICY "Authenticated can insert courier services"
ON public.courier_services FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update courier services"
ON public.courier_services FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete courier services"
ON public.courier_services FOR DELETE
TO authenticated
USING (true);
