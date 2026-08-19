-- Une organisation restaurant ne doit piloter qu'une seule fiche publique.
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_partners_one_per_organization
ON public.restaurant_partners (organization_id)
WHERE organization_id IS NOT NULL;
