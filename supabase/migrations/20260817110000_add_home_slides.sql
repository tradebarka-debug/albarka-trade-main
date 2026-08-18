CREATE TABLE IF NOT EXISTS public.home_slides (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url text NOT NULL,
  title text NOT NULL,
  subtitle text,
  text text,
  button_label text,
  button_link text,
  country text NOT NULL DEFAULT 'all' CHECK (country IN ('all', 'burkina_faso', 'cote_ivoire')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active home slides" ON public.home_slides FOR SELECT USING (is_active OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Admins can insert home slides" ON public.home_slides FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Admins can update home slides" ON public.home_slides FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Admins can delete home slides" ON public.home_slides FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));
INSERT INTO storage.buckets (id, name, public) VALUES ('home-slides', 'home-slides', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Anyone can view home slide images" ON storage.objects FOR SELECT USING (bucket_id = 'home-slides');
CREATE POLICY "Admins can upload home slide images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'home-slides' AND public.is_platform_admin(auth.uid()));
CREATE POLICY "Admins can update home slide images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'home-slides' AND public.is_platform_admin(auth.uid())) WITH CHECK (bucket_id = 'home-slides' AND public.is_platform_admin(auth.uid()));
CREATE POLICY "Admins can delete home slide images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'home-slides' AND public.is_platform_admin(auth.uid()));
