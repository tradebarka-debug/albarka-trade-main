-- Supprimer les paiements orphelins (sans user_id)
DELETE FROM public.payment_requests WHERE user_id IS NULL;

-- Rendre user_id obligatoire pour éviter les enregistrements orphelins
ALTER TABLE public.payment_requests ALTER COLUMN user_id SET NOT NULL;