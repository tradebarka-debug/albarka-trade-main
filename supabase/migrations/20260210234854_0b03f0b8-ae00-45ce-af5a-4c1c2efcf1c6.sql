
-- Fix user_roles RLS: convert user/admin view policies to PERMISSIVE 
-- and keep the anonymous block as RESTRICTIVE for defense-in-depth

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block anonymous role access" ON public.user_roles;

-- Re-create as PERMISSIVE for authenticated users
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Explicitly deny anonymous access (RESTRICTIVE on anon role)
CREATE POLICY "Block anonymous role access"
  ON public.user_roles
  FOR ALL
  TO anon
  USING (false);
