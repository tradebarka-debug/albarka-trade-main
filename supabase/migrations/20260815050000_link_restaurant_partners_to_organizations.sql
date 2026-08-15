-- Lien entre une organisation partenaire de type "restaurant" et sa fiche
-- publique existante (restaurant_partners), pour que le dashboard PDG
-- restaurant modifie directement les données affichées sur le site public.
ALTER TABLE public.restaurant_partners ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES public.organizations(id);
