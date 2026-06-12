-- Allow users to delete their own payment screenshots
CREATE POLICY "Users can delete their payment screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to delete any payment screenshot
CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-screenshots' 
  AND has_role(auth.uid(), 'admin'::app_role)
);