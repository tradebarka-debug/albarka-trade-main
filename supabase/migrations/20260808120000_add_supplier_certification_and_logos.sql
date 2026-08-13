-- This project may be connected to a Supabase database that has not received
-- the original role-management migration. Create its required objects safely.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'app_role' AND namespace.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- The frontend checks the signed-in user's own role to show the admin entry.
-- Keep roles private: each user can read only their own row.
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  )
$$;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS certified boolean NOT NULL DEFAULT false;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;

CREATE POLICY "Public can view active suppliers"
ON public.suppliers FOR SELECT
USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert suppliers"
ON public.suppliers FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update suppliers"
ON public.suppliers FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-logos', 'supplier-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view supplier logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload supplier logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update supplier logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete supplier logos" ON storage.objects;

CREATE POLICY "Anyone can view supplier logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'supplier-logos');

CREATE POLICY "Admins can upload supplier logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'supplier-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update supplier logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'supplier-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete supplier logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'supplier-logos' AND public.has_role(auth.uid(), 'admin'));
