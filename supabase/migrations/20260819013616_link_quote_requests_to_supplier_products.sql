ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS supplier_product_id BIGINT
REFERENCES public.supplier_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quote_requests_supplier_product_id_idx
ON public.quote_requests (supplier_product_id);

DROP POLICY IF EXISTS "Public can submit quote requests" ON public.quote_requests;

CREATE POLICY "Public can submit quote requests"
ON public.quote_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  (product_id IS NOT NULL OR supplier_product_id IS NOT NULL)
  AND supplier_id IS NOT NULL
  AND length(trim(customer_name)) BETWEEN 2 AND 150
  AND length(trim(telephone)) BETWEEN 5 AND 40
  AND quantity > 0
);
