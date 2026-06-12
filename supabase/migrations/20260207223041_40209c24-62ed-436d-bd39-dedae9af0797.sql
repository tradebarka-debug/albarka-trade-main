-- Block anonymous access to user_roles table
CREATE POLICY "Block anonymous role access"
ON public.user_roles
FOR SELECT
TO anon
USING (false);