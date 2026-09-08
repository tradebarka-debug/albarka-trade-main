-- Read-only fixtures: no functions installed and no business data changed.
WITH fixture_orders AS (SELECT * FROM jsonb_populate_recordset(NULL::public.orders, '[{"id":"00000000-0000-0000-0000-000000000002","tracking_number":"TEST-CURRENT","customer_id":"00000000-0000-0000-0000-000000000001","restaurant_id":"00000000-0000-0000-0000-000000000003","created_at":"2026-09-08T10:00:00Z","status":"ready","delivery_status":"in_progress","requires_delivery":true},{"id":"00000000-0000-0000-0000-000000000010","tracking_number":"TEST-0","restaurant_id":"00000000-0000-0000-0000-000000000003","created_at":"2026-09-08T09:00:00Z","status":"pending","delivery_status":"pending","restaurant_confirmation_status":"accepted"},{"id":"00000000-0000-0000-0000-000000000011","tracking_number":"TEST-1","restaurant_id":"00000000-0000-0000-0000-000000000003","created_at":"2026-09-08T09:00:00Z","status":"completed","delivery_status":"pending","restaurant_confirmation_status":"accepted"},{"id":"00000000-0000-0000-0000-000000000012","tracking_number":"TEST-2","restaurant_id":"00000000-0000-0000-0000-000000000003","created_at":"2026-09-08T09:00:00Z","status":"cancelled","delivery_status":"pending","restaurant_confirmation_status":"accepted"},{"id":"00000000-0000-0000-0000-000000000013","tracking_number":"TEST-3","restaurant_id":"00000000-0000-0000-0000-000000000003","created_at":"2026-09-08T09:00:00Z","status":"pending","delivery_status":"pending","restaurant_confirmation_status":"rejected"}]')),
fixture_deliveries AS (SELECT d.* FROM jsonb_populate_recordset(NULL::public.deliveries, '[{"id":1,"order_id":"00000000-0000-0000-0000-000000000002","driver_id":"00000000-0000-0000-0000-000000000004","status":"in_progress","created_at":"2026-09-08T10:00:00Z","estimated_delivery_minutes":15}]') d),
fixture_profiles AS (SELECT * FROM jsonb_populate_recordset(NULL::public.profiles, '[{"id":"00000000-0000-0000-0000-000000000004","nom":"Livreur test","telephone":"+123456789"}]')),
fixture_driver_status AS (SELECT * FROM jsonb_populate_recordset(NULL::public.driver_status,
  jsonb_build_array(jsonb_build_object('driver_id','00000000-0000-0000-0000-000000000004','current_delivery_id',1,'latitude',0,'longitude',0,'last_seen_at',now())))),
owner_result (tracking_number, delivery_status, delivery_updated_at, delivery_completed_at, queue_number, people_ahead, restaurant_name, delivery_distance_km, delivery_fee, disposable_kit_fee, status, payment_status, restaurant_confirmation_status, requires_delivery, created_at, total, courier_name, courier_phone, courier_latitude, courier_longitude, courier_location_at, estimated_arrival_at) AS (SELECT o.tracking_number,
    CASE WHEN o.delivery_completed_at IS NOT NULL OR o.delivery_status = 'delivered' THEN 'delivered'
      WHEN o.delivery_status = 'accepted' THEN 'assigned'
      WHEN o.delivery_status = 'in_progress' THEN 'on_the_way'
      ELSE o.delivery_status END,
    o.delivery_updated_at, o.delivery_completed_at, o.queue_number,
    CASE WHEN o.restaurant_id IS NULL OR o.status IN ('completed', 'cancelled')
      OR o.delivery_status IN ('delivered', 'cancelled') OR o.delivery_completed_at IS NOT NULL THEN 0
    ELSE (SELECT count(*) FROM fixture_orders previous
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
  FROM fixture_orders o
  LEFT JOIN public.restaurant_partners r ON r.id = o.restaurant_id
  LEFT JOIN LATERAL (SELECT delivery.* FROM fixture_deliveries delivery WHERE delivery.order_id = o.id
    ORDER BY delivery.created_at DESC, delivery.id DESC LIMIT 1) d ON true
  LEFT JOIN fixture_profiles p ON p.id = d.driver_id
  LEFT JOIN fixture_driver_status ds ON ds.driver_id = d.driver_id AND ds.current_delivery_id = d.id
  CROSS JOIN LATERAL (SELECT o.customer_id = '00000000-0000-0000-0000-000000000001'::uuid AS is_owner,
    o.delivery_status IN ('assigned', 'accepted', 'picked_up', 'on_the_way', 'in_progress')
      AND o.delivery_completed_at IS NULL AND coalesce(o.status, '') <> 'cancelled' AS is_active) access
  CROSS JOIN LATERAL (SELECT access.is_owner AND access.is_active
    AND ds.last_seen_at BETWEEN now() - interval '2 minutes' AND now()
    AND ds.latitude BETWEEN -90 AND 90 AND ds.longitude BETWEEN -180 AND 180 AS is_fresh) location
  WHERE upper(o.tracking_number) = upper(trim('TEST-CURRENT')) LIMIT 1),
guest_result (tracking_number, delivery_status, delivery_updated_at, delivery_completed_at, queue_number, people_ahead, restaurant_name, delivery_distance_km, delivery_fee, disposable_kit_fee, status, payment_status, restaurant_confirmation_status, requires_delivery, created_at, total, courier_name, courier_phone, courier_latitude, courier_longitude, courier_location_at, estimated_arrival_at) AS (SELECT o.tracking_number,
    CASE WHEN o.delivery_completed_at IS NOT NULL OR o.delivery_status = 'delivered' THEN 'delivered'
      WHEN o.delivery_status = 'accepted' THEN 'assigned'
      WHEN o.delivery_status = 'in_progress' THEN 'on_the_way'
      ELSE o.delivery_status END,
    o.delivery_updated_at, o.delivery_completed_at, o.queue_number,
    CASE WHEN o.restaurant_id IS NULL OR o.status IN ('completed', 'cancelled')
      OR o.delivery_status IN ('delivered', 'cancelled') OR o.delivery_completed_at IS NOT NULL THEN 0
    ELSE (SELECT count(*) FROM fixture_orders previous
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
  FROM fixture_orders o
  LEFT JOIN public.restaurant_partners r ON r.id = o.restaurant_id
  LEFT JOIN LATERAL (SELECT delivery.* FROM fixture_deliveries delivery WHERE delivery.order_id = o.id
    ORDER BY delivery.created_at DESC, delivery.id DESC LIMIT 1) d ON true
  LEFT JOIN fixture_profiles p ON p.id = d.driver_id
  LEFT JOIN fixture_driver_status ds ON ds.driver_id = d.driver_id AND ds.current_delivery_id = d.id
  CROSS JOIN LATERAL (SELECT o.customer_id = NULL::uuid AS is_owner,
    o.delivery_status IN ('assigned', 'accepted', 'picked_up', 'on_the_way', 'in_progress')
      AND o.delivery_completed_at IS NULL AND coalesce(o.status, '') <> 'cancelled' AS is_active) access
  CROSS JOIN LATERAL (SELECT access.is_owner AND access.is_active
    AND ds.last_seen_at BETWEEN now() - interval '2 minutes' AND now()
    AND ds.latitude BETWEEN -90 AND 90 AND ds.longitude BETWEEN -180 AND 180 AS is_fresh) location
  WHERE upper(o.tracking_number) = upper(trim('TEST-CURRENT')) LIMIT 1)
SELECT 'queue_excludes_completed_cancelled_rejected' AS test, people_ahead = 1 AS passed FROM owner_result
UNION ALL SELECT 'legacy_driver_status_is_normalized', delivery_status = 'on_the_way' FROM owner_result
UNION ALL SELECT 'owner_sees_assigned_driver', courier_name = 'Livreur test' AND courier_phone = '+123456789' FROM owner_result
UNION ALL SELECT 'owner_sees_fresh_zero_coordinates', courier_latitude = 0 AND courier_longitude = 0 FROM owner_result
UNION ALL SELECT 'guest_cannot_read_driver_contact_or_gps', courier_name IS NULL AND courier_phone IS NULL AND courier_latitude IS NULL AND courier_longitude IS NULL FROM guest_result;
