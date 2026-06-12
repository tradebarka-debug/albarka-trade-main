
-- Create fast food menu items table
CREATE TABLE public.fastfood_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL DEFAULT 'Burgers',
  image text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fastfood_items ENABLE ROW LEVEL SECURITY;

-- Public read access for active items
CREATE POLICY "Anyone can view active fastfood items"
ON public.fastfood_items
FOR SELECT
USING (true);

-- Admin full access
CREATE POLICY "Admins can manage fastfood items"
ON public.fastfood_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_fastfood_items_updated_at
BEFORE UPDATE ON public.fastfood_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for fastfood images
INSERT INTO storage.buckets (id, name, public) VALUES ('fastfood-images', 'fastfood-images', true);

-- Storage policies
CREATE POLICY "Anyone can view fastfood images"
ON storage.objects FOR SELECT
USING (bucket_id = 'fastfood-images');

CREATE POLICY "Admins can upload fastfood images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fastfood-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update fastfood images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fastfood-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete fastfood images"
ON storage.objects FOR DELETE
USING (bucket_id = 'fastfood-images' AND has_role(auth.uid(), 'admin'::app_role));
