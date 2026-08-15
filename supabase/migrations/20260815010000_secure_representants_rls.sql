-- La table representants (codes, PIN, telephone, piece d'identite, commissions)
-- avait le RLS DESACTIVE : elle etait lisible/modifiable en entier via la cle
-- publique anon. On active le RLS et on n'autorise que le backend (service role)
-- a y acceder ; l'authentification code+PIN doit passer par une edge function
-- (comme manage-users) et non par un appel direct depuis le navigateur.
ALTER TABLE public.representants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bloquer l'acces public direct" ON public.representants;
CREATE POLICY "Bloquer l'acces public direct"
  ON public.representants
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
