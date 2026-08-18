ALTER TABLE public.restaurant_partners
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS delivery_fee_per_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disposable_kit_fee numeric NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurant_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_delivery boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS disposable_kits boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disposable_kit_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disposable_kit_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS queue_number integer;

CREATE INDEX IF NOT EXISTS orders_restaurant_queue_idx
  ON public.orders(restaurant_id, created_at, queue_number);

CREATE OR REPLACE FUNCTION public.set_restaurant_queue_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.restaurant_id IS NOT NULL AND NEW.queue_number IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.restaurant_id::text || current_date::text));
    SELECT coalesce(max(o.queue_number), 0) + 1
      INTO NEW.queue_number
      FROM public.orders o
     WHERE o.restaurant_id = NEW.restaurant_id
       AND o.created_at >= current_date
       AND o.created_at < current_date + interval '1 day';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_restaurant_queue_number ON public.orders;
CREATE TRIGGER set_restaurant_queue_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_restaurant_queue_number();

-- PostgreSQL ne permet pas de changer les colonnes OUT avec CREATE OR REPLACE.
-- Supprimer d'abord l'ancienne signature, puis recréer la fonction enrichie.
DROP FUNCTION IF EXISTS public.get_order_delivery_tracking(text);

CREATE FUNCTION public.get_order_delivery_tracking(p_tracking_number text)
RETURNS TABLE (
  tracking_number text,
  delivery_status text,
  delivery_updated_at timestamptz,
  delivery_completed_at timestamptz,
  queue_number integer,
  people_ahead bigint,
  restaurant_name text,
  delivery_distance_km numeric,
  delivery_fee numeric,
  disposable_kit_fee numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.tracking_number,
    o.delivery_status,
    o.delivery_updated_at,
    o.delivery_completed_at,
    o.queue_number,
    CASE WHEN o.restaurant_id IS NULL THEN 0 ELSE (
      SELECT count(*) FROM public.orders previous
       WHERE previous.restaurant_id = o.restaurant_id
         AND previous.created_at < o.created_at
         AND previous.created_at >= date_trunc('day', o.created_at)
         AND coalesce(previous.delivery_status, 'pending') NOT IN ('delivered', 'cancelled')
    ) END,
    r.name,
    o.delivery_distance_km,
    o.delivery_fee,
    o.disposable_kit_fee
  FROM public.orders o
  LEFT JOIN public.restaurant_partners r ON r.id = o.restaurant_id
  WHERE upper(o.tracking_number) = upper(trim(p_tracking_number))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_delivery_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_delivery_tracking(text) TO anon, authenticated;
