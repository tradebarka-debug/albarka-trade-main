-- Columns required by the existing admin forms.
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Ouvert',
  ADD COLUMN IF NOT EXISTS requirements text;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Actif';
