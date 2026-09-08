BEGIN;
-- is_available records the driver's explicit choice; current_delivery_id records occupation.
CREATE OR REPLACE FUNCTION public.get_driver_options(restaurant_latitude double precision, restaurant_longitude double precision, client_latitude double precision, client_longitude double precision)
 RETURNS TABLE(driver_id uuid, driver_name text, is_available boolean, is_busy boolean, distance_to_restaurant_km numeric, restaurant_to_client_km numeric, total_distance_km numeric, estimated_minutes integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH calculated AS (
    SELECT
      p.id AS driver_id,
      p.nom::text AS driver_name,
      (ds.is_available AND ds.current_delivery_id IS NULL) AS is_available,
      (ds.current_delivery_id IS NOT NULL) AS is_busy,

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
    JOIN public.driver_status ds
      ON ds.driver_id = p.id

    WHERE p.role = 'livreur'
      AND p.is_active = true
      AND ds.latitude IS NOT NULL
      AND ds.longitude IS NOT NULL
      AND ds.is_available = true
  )

  SELECT
    calculated.driver_id,
    calculated.driver_name,
    calculated.is_available,
    calculated.is_busy,
    calculated.distance_to_restaurant_km,
    calculated.restaurant_to_client_km,
    ROUND(
      calculated.distance_to_restaurant_km
      + calculated.restaurant_to_client_km,
      2
    ) AS total_distance_km,
    CEIL(
      (
        calculated.distance_to_restaurant_km
        + calculated.restaurant_to_client_km
      ) / 25 * 60
    )::integer AS estimated_minutes

  FROM calculated
  ORDER BY
    calculated.is_available DESC,
    total_distance_km ASC;
$function$
;
CREATE OR REPLACE FUNCTION public.is_eligible_delivery_driver(candidate_driver_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.driver_status ds
      ON ds.driver_id = p.id
    WHERE p.id = candidate_driver_id
      AND p.role = 'livreur'
      AND p.is_active = true
      AND ds.is_available = true
  );
$function$
;
CREATE OR REPLACE FUNCTION public.mark_driver_busy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    UPDATE public.driver_status
    SET
      current_delivery_id = COALESCE(current_delivery_id, NEW.id)
    WHERE driver_id = NEW.driver_id;
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.release_driver_after_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  next_delivery_id bigint;
BEGIN
  IF NEW.status IN ('delivered', 'cancelled')
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.driver_id IS NOT NULL THEN

    SELECT d.id
    INTO next_delivery_id
    FROM public.deliveries d
    WHERE d.driver_id = NEW.driver_id
      AND d.id <> NEW.id
      AND d.status NOT IN ('delivered', 'cancelled')
    ORDER BY d.created_at ASC
    LIMIT 1;

    UPDATE public.driver_status
    SET
      current_delivery_id = next_delivery_id
    WHERE driver_id = NEW.driver_id
      AND current_delivery_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$
;

-- Existing SELECT/INSERT/UPDATE policies are restricted to driver_id = auth.uid().
-- No inactivity timeout is introduced, and no existing driver's choice is reset.
COMMIT;
