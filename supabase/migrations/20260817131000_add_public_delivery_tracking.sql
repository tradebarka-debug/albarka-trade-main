-- This function exposes only the information needed to track a delivery.
-- Customer names, addresses, phones and payment details remain private.
CREATE OR REPLACE FUNCTION public.get_order_delivery_tracking(p_tracking_number text)
RETURNS TABLE (
  tracking_number text,
  delivery_status text,
  delivery_updated_at timestamptz,
  delivery_completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.tracking_number, o.delivery_status, o.delivery_updated_at, o.delivery_completed_at
  FROM public.orders o
  WHERE upper(o.tracking_number) = upper(trim(p_tracking_number))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_delivery_tracking(text) TO anon, authenticated;
