ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'confirmed', 'rejected'));

CREATE INDEX IF NOT EXISTS orders_restaurant_created_idx
ON public.orders (restaurant_id, created_at DESC)
WHERE restaurant_id IS NOT NULL;
