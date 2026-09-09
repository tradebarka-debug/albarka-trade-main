BEGIN;

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS pickup_latitude numeric,
  ADD COLUMN IF NOT EXISTS pickup_longitude numeric,
  ADD COLUMN IF NOT EXISTS delivery_latitude numeric,
  ADD COLUMN IF NOT EXISTS delivery_longitude numeric;

ALTER TABLE public.deliveries
  DROP CONSTRAINT IF EXISTS deliveries_pickup_coordinates_pair_check,
  ADD CONSTRAINT deliveries_pickup_coordinates_pair_check CHECK (
    (pickup_latitude IS NULL AND pickup_longitude IS NULL)
    OR (pickup_latitude IS NOT NULL AND pickup_longitude IS NOT NULL)
  ),
  DROP CONSTRAINT IF EXISTS deliveries_delivery_coordinates_pair_check,
  ADD CONSTRAINT deliveries_delivery_coordinates_pair_check CHECK (
    (delivery_latitude IS NULL AND delivery_longitude IS NULL)
    OR (delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL)
  ),
  DROP CONSTRAINT IF EXISTS deliveries_pickup_latitude_range_check,
  ADD CONSTRAINT deliveries_pickup_latitude_range_check
    CHECK (pickup_latitude IS NULL OR pickup_latitude BETWEEN -90 AND 90),
  DROP CONSTRAINT IF EXISTS deliveries_pickup_longitude_range_check,
  ADD CONSTRAINT deliveries_pickup_longitude_range_check
    CHECK (pickup_longitude IS NULL OR pickup_longitude BETWEEN -180 AND 180),
  DROP CONSTRAINT IF EXISTS deliveries_delivery_latitude_range_check,
  ADD CONSTRAINT deliveries_delivery_latitude_range_check
    CHECK (delivery_latitude IS NULL OR delivery_latitude BETWEEN -90 AND 90),
  DROP CONSTRAINT IF EXISTS deliveries_delivery_longitude_range_check,
  ADD CONSTRAINT deliveries_delivery_longitude_range_check
    CHECK (delivery_longitude IS NULL OR delivery_longitude BETWEEN -180 AND 180);

COMMIT;
