BEGIN;

CREATE OR REPLACE FUNCTION public.get_driver_options(
  restaurant_latitude double precision,
  restaurant_longitude double precision,
  client_latitude double precision,
  client_longitude double precision
)
RETURNS TABLE(
  driver_id uuid,
  driver_name text,
  is_available boolean,
  is_busy boolean,
  distance_to_restaurant_km numeric,
  restaurant_to_client_km numeric,
  total_distance_km numeric,
  estimated_minutes integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  WITH calculated AS (
    SELECT
      p.id AS driver_id,
      p.nom::text AS driver_name,
      public.calculate_distance_km(
        ds.latitude::double precision,
        ds.longitude::double precision,
        restaurant_latitude,
        restaurant_longitude
      ) AS distance_to_restaurant_km,
      public.calculate_distance_km(
        restaurant_latitude,
        restaurant_longitude,
        client_latitude,
        client_longitude
      ) AS restaurant_to_client_km
    FROM public.profiles p
    JOIN public.driver_status ds ON ds.driver_id = p.id
    WHERE p.role = 'livreur'
      AND p.is_active = true
      AND ds.is_available = true
      AND ds.current_delivery_id IS NULL
      AND ds.latitude IS NOT NULL
      AND ds.longitude IS NOT NULL
  )
  SELECT
    calculated.driver_id,
    calculated.driver_name,
    true,
    false,
    calculated.distance_to_restaurant_km,
    calculated.restaurant_to_client_km,
    round(calculated.distance_to_restaurant_km + calculated.restaurant_to_client_km, 2),
    ceil((calculated.distance_to_restaurant_km + calculated.restaurant_to_client_km) / 25 * 60)::integer
  FROM calculated
  ORDER BY calculated.distance_to_restaurant_km ASC, calculated.driver_id ASC;
$function$;

CREATE OR REPLACE FUNCTION public.is_eligible_delivery_driver(candidate_driver_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.driver_status ds ON ds.driver_id = p.id
    WHERE p.id = candidate_driver_id
      AND p.role = 'livreur'
      AND p.is_active = true
      AND ds.is_available = true
      AND ds.current_delivery_id IS NULL
      AND ds.latitude IS NOT NULL
      AND ds.longitude IS NOT NULL
  );
$function$;

CREATE OR REPLACE FUNCTION public.mark_driver_busy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.driver_id IS NOT NULL
     AND OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
    UPDATE public.driver_status
    SET current_delivery_id = NULL
    WHERE driver_id = OLD.driver_id
      AND current_delivery_id = OLD.id;
  END IF;

  IF NEW.driver_id IS NOT NULL
     AND NEW.status NOT IN ('delivered', 'cancelled') THEN
    UPDATE public.driver_status
    SET current_delivery_id = NEW.id
    WHERE driver_id = NEW.driver_id
      AND current_delivery_id IS NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS mark_driver_busy_after_assignment ON public.deliveries;
CREATE TRIGGER mark_driver_busy_after_assignment
AFTER INSERT OR UPDATE OF driver_id ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.mark_driver_busy();

DROP TRIGGER IF EXISTS release_driver_after_delivery_status ON public.deliveries;
CREATE TRIGGER release_driver_after_delivery_status
AFTER UPDATE OF status ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.release_driver_after_delivery();

UPDATE public.driver_status ds
SET current_delivery_id = (
  SELECT d.id AS delivery_id
  FROM public.deliveries d
  WHERE d.driver_id = ds.driver_id
    AND d.status NOT IN ('delivered', 'cancelled')
  ORDER BY d.created_at ASC, d.id ASC
  LIMIT 1
)
WHERE ds.current_delivery_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.deliveries d
    WHERE d.driver_id = ds.driver_id
      AND d.status NOT IN ('delivered', 'cancelled')
  );

REVOKE ALL ON FUNCTION public.get_driver_options(double precision, double precision, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_driver_options(double precision, double precision, double precision, double precision) TO authenticated;
REVOKE ALL ON FUNCTION public.is_eligible_delivery_driver(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_eligible_delivery_driver(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.mark_driver_busy() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_driver_after_delivery() FROM PUBLIC;

COMMIT;
