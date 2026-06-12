-- Create storage bucket for job images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('job-images', 'job-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Policies for job-images bucket
CREATE POLICY "Public can view job images"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-images');

CREATE POLICY "Admins can upload job images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update job images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'job-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete job images"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-images' AND public.has_role(auth.uid(), 'admin'));