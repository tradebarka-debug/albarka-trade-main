
CREATE POLICY "Block anonymous access"
  ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);
