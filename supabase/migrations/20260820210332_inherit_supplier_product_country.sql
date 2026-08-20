UPDATE public.supplier_products AS product
SET country_id = supplier.country_id
FROM public.suppliers AS supplier
WHERE product.country_id IS NULL
  AND product.supplier_id::text = supplier.id::text
  AND supplier.country_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.inherit_supplier_product_country()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  SELECT supplier.country_id INTO NEW.country_id
  FROM public.suppliers AS supplier
  WHERE supplier.id::text = NEW.supplier_id::text;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inherit_supplier_product_country ON public.supplier_products;
CREATE TRIGGER inherit_supplier_product_country
BEFORE INSERT OR UPDATE OF supplier_id ON public.supplier_products
FOR EACH ROW EXECUTE FUNCTION public.inherit_supplier_product_country();

REVOKE ALL ON FUNCTION public.inherit_supplier_product_country() FROM PUBLIC, anon, authenticated;
