-- Add SELECT policy for users to view only their own payment contacts
CREATE POLICY "Users can view their own payment contacts" 
ON public.payment_request_contacts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.payment_requests pr 
    WHERE pr.id = payment_request_contacts.payment_request_id 
    AND pr.user_id = auth.uid()
  )
);