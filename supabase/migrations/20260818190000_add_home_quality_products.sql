ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_home_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_sort_order integer;

CREATE INDEX IF NOT EXISTS products_home_featured_country_idx
  ON public.products(country_id, home_sort_order)
  WHERE is_home_featured = true;

CREATE OR REPLACE FUNCTION public.enforce_home_featured_products_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  featured_count integer;
BEGIN
  IF NEW.is_home_featured IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT count(*)
    INTO featured_count
    FROM public.products
   WHERE country_id = NEW.country_id
     AND is_home_featured = true
     AND id <> NEW.id;

  IF featured_count >= 5 THEN
    RAISE EXCEPTION 'Un pays ne peut pas avoir plus de 5 produits de qualité sur l''accueil.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_home_featured_products_limit ON public.products;
CREATE TRIGGER enforce_home_featured_products_limit
  BEFORE INSERT OR UPDATE OF is_home_featured, country_id
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_home_featured_products_limit();

