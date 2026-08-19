CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.assign_restaurant_order_outlet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.restaurant_id IS NOT NULL AND NEW.restaurant_outlet_id IS NULL THEN
    SELECT ro.id INTO NEW.restaurant_outlet_id
    FROM public.restaurant_outlets ro
    WHERE ro.restaurant_id = NEW.restaurant_id
      AND ro.is_primary
      AND ro.is_active
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.assign_restaurant_order_outlet() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.assign_restaurant_order_outlet() TO service_role;

DROP TRIGGER IF EXISTS assign_restaurant_order_outlet_before_insert ON public.orders;
CREATE TRIGGER assign_restaurant_order_outlet_before_insert
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.assign_restaurant_order_outlet();

DROP FUNCTION IF EXISTS public.assign_restaurant_order_outlet();
