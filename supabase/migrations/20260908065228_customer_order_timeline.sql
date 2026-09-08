BEGIN;
DROP FUNCTION IF EXISTS public.get_order_delivery_tracking(text);
CREATE FUNCTION public.get_order_delivery_tracking(p_tracking_number text)
RETURNS TABLE (
  tracking_number text, delivery_status text, delivery_updated_at timestamptz,
  delivery_completed_at timestamptz, queue_number integer, people_ahead bigint,
  restaurant_name text, delivery_distance_km numeric, delivery_fee numeric,
  disposable_kit_fee numeric, status text, payment_status text,
  restaurant_confirmation_status text, requires_delivery boolean, created_at timestamptz,
  total numeric, courier_name text, courier_phone text, courier_latitude numeric,
  courier_longitude numeric, courier_location_at timestamptz, estimated_arrival_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.tracking_number,
    CASE WHEN o.delivery_completed_at IS NOT NULL OR o.delivery_status = 'delivered' THEN 'delivered'
      WHEN o.delivery_status = 'accepted' THEN 'assigned'
      WHEN o.delivery_status = 'in_progress' THEN 'on_the_way'
      ELSE o.delivery_status END,
    o.delivery_updated_at, o.delivery_completed_at, o.queue_number,
    CASE WHEN o.restaurant_id IS NULL OR o.status IN ('completed', 'cancelled')
      OR o.delivery_status IN ('delivered', 'cancelled') OR o.delivery_completed_at IS NOT NULL THEN 0
    ELSE (SELECT count(*) FROM public.orders previous
      WHERE previous.restaurant_id = o.restaurant_id
        AND previous.restaurant_outlet_id IS NOT DISTINCT FROM o.restaurant_outlet_id
        AND previous.created_at < o.created_at
        AND (previous.created_at AT TIME ZONE 'Africa/Abidjan')::date = (o.created_at AT TIME ZONE 'Africa/Abidjan')::date
        AND coalesce(previous.delivery_status, 'pending') NOT IN ('delivered', 'cancelled')
        AND coalesce(previous.status, 'pending') NOT IN ('completed', 'cancelled')
        AND previous.delivery_completed_at IS NULL
        AND coalesce(previous.restaurant_confirmation_status, 'pending') NOT IN ('rejected', 'expired')) END,
    r.name, o.delivery_distance_km, o.delivery_fee, o.disposable_kit_fee,
    o.status, o.payment_status, o.restaurant_confirmation_status, o.requires_delivery, o.created_at,
    CASE WHEN access.is_owner THEN o.total END,
    CASE WHEN access.is_owner AND access.is_active THEN coalesce(p.nom, o.courier_name) END,
    CASE WHEN access.is_owner AND access.is_active THEN coalesce(p.telephone, o.courier_phone) END,
    CASE WHEN location.is_fresh THEN ds.latitude END,
    CASE WHEN location.is_fresh THEN ds.longitude END,
    CASE WHEN location.is_fresh THEN ds.last_seen_at END,
    CASE WHEN access.is_owner AND access.is_active AND o.delivery_status IN ('on_the_way', 'in_progress')
      AND d.started_at IS NOT NULL AND d.estimated_delivery_minutes > 0
      THEN d.started_at + make_interval(mins => d.estimated_delivery_minutes) END
  FROM public.orders o
  LEFT JOIN public.restaurant_partners r ON r.id = o.restaurant_id
  LEFT JOIN LATERAL (SELECT delivery.* FROM public.deliveries delivery WHERE delivery.order_id = o.id
    ORDER BY delivery.created_at DESC, delivery.id DESC LIMIT 1) d ON true
  LEFT JOIN public.profiles p ON p.id = d.driver_id
  LEFT JOIN public.driver_status ds ON ds.driver_id = d.driver_id AND ds.current_delivery_id = d.id
  CROSS JOIN LATERAL (SELECT o.customer_id = auth.uid() AS is_owner,
    o.delivery_status IN ('assigned', 'accepted', 'picked_up', 'on_the_way', 'in_progress')
      AND o.delivery_completed_at IS NULL AND coalesce(o.status, '') <> 'cancelled' AS is_active) access
  CROSS JOIN LATERAL (SELECT access.is_owner AND access.is_active
    AND ds.last_seen_at BETWEEN now() - interval '2 minutes' AND now()
    AND ds.latitude BETWEEN -90 AND 90 AND ds.longitude BETWEEN -180 AND 180 AS is_fresh) location
  WHERE upper(o.tracking_number) = upper(trim(p_tracking_number)) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_order_delivery_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_delivery_tracking(text) TO anon, authenticated;
COMMIT;
