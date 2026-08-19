-- Keep delivery coordinates internally consistent. NOT VALID preserves older
-- orders that were created before GPS became mandatory, while enforcing the
-- rules for every new or updated order.
alter table public.orders
  add constraint orders_delivery_coordinates_pair_check
  check (
    (delivery_latitude is null and delivery_longitude is null)
    or
    (delivery_latitude is not null and delivery_longitude is not null)
  ) not valid;

alter table public.orders
  add constraint orders_delivery_latitude_range_check
  check (delivery_latitude is null or delivery_latitude between -90 and 90)
  not valid;

alter table public.orders
  add constraint orders_delivery_longitude_range_check
  check (delivery_longitude is null or delivery_longitude between -180 and 180)
  not valid;

alter table public.orders
  add constraint orders_delivery_coordinates_required_check
  check (
    created_at < timestamptz '2026-08-19 16:55:42+00'
    or not requires_delivery
    or (delivery_latitude is not null and delivery_longitude is not null)
  ) not valid;
