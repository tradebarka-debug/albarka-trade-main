-- Create order_items table to store cart items with payments
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_request_id uuid NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can create order items for their own payments
CREATE POLICY "Users can create order items for their payments"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payment_requests pr
    WHERE pr.id = payment_request_id
    AND pr.user_id = auth.uid()
  )
);

-- Users can view their own order items
CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.payment_requests pr
    WHERE pr.id = payment_request_id
    AND pr.user_id = auth.uid()
  )
);

-- Admins can manage all order items
CREATE POLICY "Admins can manage order items"
ON public.order_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to decrement stock when payment is approved
CREATE OR REPLACE FUNCTION public.decrement_stock_on_payment_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Decrement stock for all items in this order
    UPDATE public.products p
    SET 
      stock_quantity = GREATEST(0, p.stock_quantity - oi.quantity),
      in_stock = CASE 
        WHEN p.stock_quantity - oi.quantity <= 0 THEN false 
        ELSE p.in_stock 
      END
    FROM public.order_items oi
    WHERE oi.payment_request_id = NEW.id
    AND p.id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on payment_requests
CREATE TRIGGER trigger_decrement_stock_on_approval
AFTER UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_payment_approval();