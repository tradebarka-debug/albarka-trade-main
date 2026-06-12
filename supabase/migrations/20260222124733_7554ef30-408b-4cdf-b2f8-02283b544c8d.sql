
CREATE TABLE public.formation_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  formation_name TEXT NOT NULL DEFAULT 'Formation Vente',
  session_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  education TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.formation_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own registrations"
ON public.formation_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own registrations"
ON public.formation_registrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
ON public.formation_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update registrations"
ON public.formation_registrations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete registrations"
ON public.formation_registrations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_formation_registrations_updated_at
BEFORE UPDATE ON public.formation_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
