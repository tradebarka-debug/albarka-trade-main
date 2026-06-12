-- Create storage bucket for formation images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('formation-images', 'formation-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-images', 'service-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Policies for formation-images bucket
CREATE POLICY "Public can view formation images"
ON storage.objects FOR SELECT
USING (bucket_id = 'formation-images');

CREATE POLICY "Admins can upload formation images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'formation-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update formation images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'formation-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete formation images"
ON storage.objects FOR DELETE
USING (bucket_id = 'formation-images' AND public.has_role(auth.uid(), 'admin'));

-- Policies for service-images bucket
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Admins can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update service images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete service images"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));