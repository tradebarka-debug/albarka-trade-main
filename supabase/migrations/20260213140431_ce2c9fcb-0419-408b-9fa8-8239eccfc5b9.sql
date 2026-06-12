
-- Table for transport companies
CREATE TABLE public.transport_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text DEFAULT '🚌',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active companies" ON public.transport_companies FOR SELECT USING (true);
CREATE POLICY "Admins can manage companies" ON public.transport_companies FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_transport_companies_updated_at
  BEFORE UPDATE ON public.transport_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for destinations
CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Admins can manage destinations" ON public.destinations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for courier services
CREATE TABLE public.courier_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  starting_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courier services" ON public.courier_services FOR SELECT USING (true);
CREATE POLICY "Admins can manage courier services" ON public.courier_services FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_courier_services_updated_at
  BEFORE UPDATE ON public.courier_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.transport_companies (name, logo) VALUES
  ('Rahimo Transport', '🚌'),
  ('STAF', '🚌'),
  ('TSR', '🚌'),
  ('Rakieta', '🚌'),
  ('FTS', '🚌'),
  ('Elitis Express', '🚌');

INSERT INTO public.destinations (name) VALUES
  ('Ouagadougou'), ('Bobo-Dioulasso'), ('Koudougou'), ('Ouahigouya'),
  ('Banfora'), ('Dédougou'), ('Kaya'), ('Fada N''Gourma'), ('Tenkodogo');

INSERT INTO public.courier_services (name, description, starting_price) VALUES
  ('Collecte de Courriers', 'Récupération de courriers et documents auprès des expéditeurs', 5000),
  ('Livraison de Courriers', 'Envoi et distribution de courriers aux propriétaires', 5000),
  ('Service de Liaison', 'Liaison complète entre expéditeurs et destinataires', 10000);
