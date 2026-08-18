-- These public tables already have policies. Enabling RLS makes those policies
-- effective and prevents direct Data API access from bypassing them.
ALTER TABLE public.courier_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fastfood_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spontaneous_applications ENABLE ROW LEVEL SECURITY;
