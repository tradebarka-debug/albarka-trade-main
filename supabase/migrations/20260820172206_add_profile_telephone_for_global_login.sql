ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telephone text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_telephone_unique
  ON public.profiles (telephone)
  WHERE telephone IS NOT NULL AND telephone <> '';
