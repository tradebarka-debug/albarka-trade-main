-- 1. Add validation constraints to payment_requests table
ALTER TABLE public.payment_requests
  ADD CONSTRAINT check_amount_positive CHECK (amount > 0 AND amount < 100000000),
  ADD CONSTRAINT check_transaction_ref_format CHECK (LENGTH(transaction_reference) BETWEEN 5 AND 50),
  ADD CONSTRAINT check_phone_format CHECK (phone_number IS NULL OR phone_number ~ '^\+?[0-9]{8,15}$');

-- 2. Add validation constraints to products table
ALTER TABLE public.products
  ADD CONSTRAINT check_price_valid CHECK (price >= 0 AND price < 1000000000),
  ADD CONSTRAINT check_name_length CHECK (LENGTH(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT check_description_length CHECK (description IS NULL OR LENGTH(description) <= 2000);

-- 3. Block direct INSERT on profiles (handled by trigger on auth.users)
CREATE POLICY "Block direct profile inserts"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 4. Block DELETE on profiles (users should not delete their profiles directly)
CREATE POLICY "Block profile deletion"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);