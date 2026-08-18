-- Canonical convention: every relation uses the lowercase foreign key country_id.
-- Never use Country_id or a country name as the source of truth.
INSERT INTO public.countries (name, iso_code, currency, phone_code) VALUES
  ('Burkina Faso', 'BF', 'XOF', '+226'), ('Côte d''Ivoire', 'CI', 'XOF', '+225'),
  ('Mali', 'ML', 'XOF', '+223'), ('Niger', 'NE', 'XOF', '+227'), ('Togo', 'TG', 'XOF', '+228'),
  ('Bénin', 'BJ', 'XOF', '+229'), ('Ghana', 'GH', 'GHS', '+233'), ('Sénégal', 'SN', 'XOF', '+221'),
  ('Guinée', 'GN', 'GNF', '+224'), ('Nigeria', 'NG', 'NGN', '+234')
ON CONFLICT (name) DO UPDATE SET iso_code = EXCLUDED.iso_code, currency = EXCLUDED.currency, phone_code = EXCLUDED.phone_code;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier_products' AND column_name = 'Country_id') THEN
    ALTER TABLE public.supplier_products RENAME COLUMN "Country_id" TO country_id;
  END IF;
END $$;

ALTER TABLE public.supplier_products ADD COLUMN IF NOT EXISTS country_id bigint REFERENCES public.countries(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS country_id bigint REFERENCES public.countries(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS country_id bigint REFERENCES public.countries(id);
ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS country_id bigint REFERENCES public.countries(id);
ALTER TABLE public.home_slides ADD COLUMN IF NOT EXISTS country_id bigint REFERENCES public.countries(id);

UPDATE public.suppliers s SET country_id = c.id FROM public.countries c WHERE s.country_id IS NULL AND lower(s.country) = lower(c.name);
UPDATE public.supplier_products p SET country_id = s.country_id FROM public.suppliers s WHERE p.country_id IS NULL AND p.supplier_id::text = s.id::text;
UPDATE public.partner_applications a SET country_id = c.id FROM public.countries c WHERE a.country_id IS NULL AND lower(a.country) = lower(c.name);

CREATE INDEX IF NOT EXISTS supplier_products_country_id_idx ON public.supplier_products(country_id);
CREATE INDEX IF NOT EXISTS orders_country_id_idx ON public.orders(country_id);
CREATE INDEX IF NOT EXISTS partner_applications_country_id_idx ON public.partner_applications(country_id);
