CREATE OR REPLACE FUNCTION public.assign_restaurant_order_outlet()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

DROP TRIGGER IF EXISTS assign_restaurant_order_outlet_before_insert ON public.orders;
CREATE TRIGGER assign_restaurant_order_outlet_before_insert
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.assign_restaurant_order_outlet();

REVOKE ALL ON FUNCTION public.assign_restaurant_order_outlet() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_restaurant_order_outlet() TO service_role;
