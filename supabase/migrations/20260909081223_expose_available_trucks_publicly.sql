BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_available_trucks()
RETURNS TABLE(
  id bigint,
  title text,
  vehicle_type text,
  brand text,
  model text,
  vehicle_condition text,
  registration_country text,
  registration_city text,
  payload_tons numeric,
  loading_volume_m3 numeric,
  has_air_conditioning boolean,
  has_gps boolean,
  rental_with_driver boolean,
  daily_rate numeric,
  weekly_rate numeric,
  monthly_rate numeric,
  km_rate numeric,
  security_deposit numeric,
  available_from date,
  available_until date,
  image_urls text[],
  organization_name text,
  organization_city text,
  organization_telephone text,
  organization_whatsapp text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    t.id,
    t.title,
    t.vehicle_type,
    t.brand,
    t.model,
    t.condition,
    t.registration_country,
    t.registration_city,
    t.payload_tons,
    t.loading_volume_m3,
    t.has_air_conditioning,
    t.has_gps,
    t.rental_with_driver,
    t.daily_rate,
    t.weekly_rate,
    t.monthly_rate,
    t.km_rate,
    t.security_deposit,
    t.available_from,
    t.available_until,
    t.image_urls,
    o.name,
    coalesce(t.registration_city, o.address),
    o.telephone,
    o.whatsapp
  FROM public.trucks t
  JOIN public.organizations o ON o.id = t.organization_id
  WHERE t.actif = true
    AND t.availability_status = 'available'
    AND coalesce(o.actif, true) = true
    AND (t.available_from IS NULL OR t.available_from <= current_date)
    AND (t.available_until IS NULL OR t.available_until >= current_date)
  ORDER BY t.created_at DESC, t.id DESC;
$function$;

REVOKE ALL ON FUNCTION public.get_public_available_trucks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_available_trucks() TO anon, authenticated;

COMMIT;
