-- Delivery details stay on the order so the checkout, payment and delivery teams
-- all work from the same order number.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_country text,
  ADD COLUMN IF NOT EXISTS delivery_area text,
  ADD COLUMN IF NOT EXISTS delivery_latitude numeric,
  ADD COLUMN IF NOT EXISTS delivery_longitude numeric,
  ADD COLUMN IF NOT EXISTS delivery_distance_km numeric,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS courier_phone text,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS delivery_notes text,
  ADD COLUMN IF NOT EXISTS delivery_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivery_completed_at timestamptz;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_status_check
  CHECK (delivery_status IN ('pending', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_number_key
  ON public.orders (tracking_number)
  WHERE tracking_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_order_delivery_tracking_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR btrim(NEW.tracking_number) = '' THEN
    NEW.tracking_number := 'AT-LIV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  END IF;
  NEW.delivery_updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_delivery_tracking_number ON public.orders;
CREATE TRIGGER set_order_delivery_tracking_number
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_delivery_tracking_number();
