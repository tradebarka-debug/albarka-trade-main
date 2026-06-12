
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

CREATE POLICY "Anyone can view company logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Admins can upload company logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update company logos" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete company logos" ON storage.objects FOR DELETE USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Add logo_url column
ALTER TABLE public.transport_companies ADD COLUMN logo_url text;
