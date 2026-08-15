-- Bucket pour les images des produits du catalogue de chaque organisation
-- partenaire (upload fait directement par le PDG connecté).
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-products', 'organization-products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Voir les images produits organisation" ON storage.objects;
DROP POLICY IF EXISTS "Utilisateurs connectes uploadent images produits organisation" ON storage.objects;
DROP POLICY IF EXISTS "Utilisateurs connectes modifient images produits organisation" ON storage.objects;
DROP POLICY IF EXISTS "Utilisateurs connectes suppriment images produits organisation" ON storage.objects;

CREATE POLICY "Voir les images produits organisation"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-products');

CREATE POLICY "Utilisateurs connectes uploadent images produits organisation"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-products');

CREATE POLICY "Utilisateurs connectes modifient images produits organisation"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-products');

CREATE POLICY "Utilisateurs connectes suppriment images produits organisation"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'organization-products');
