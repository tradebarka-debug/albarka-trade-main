-- Le formulaire d'inscription representant collecte pays/ville en texte libre
-- mais la table n'avait que country_id/city_id (FK non utilisees par le code
-- actuel). On ajoute les colonnes texte pour ne pas perdre ces informations.
ALTER TABLE public.representants ADD COLUMN IF NOT EXISTS pays TEXT;
ALTER TABLE public.representants ADD COLUMN IF NOT EXISTS ville TEXT;
