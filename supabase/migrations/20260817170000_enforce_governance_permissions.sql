-- Server-side permission check. UI visibility is never considered authorization.
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role::text = 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.organization_roles r ON r.id = p.organization_role_id AND r.actif = true
    JOIN public.role_permissions rp ON rp.organization_role_id = r.id AND rp.actif = true
    JOIN public.permissions perm ON perm.id = rp.permission_id AND perm.actif = true
    WHERE p.id = _user_id AND p.is_active = true AND perm.code = _permission
  );
$$;

INSERT INTO public.permissions (code, name, category) VALUES
  ('access_admin', 'Accès administration', 'governance'),
  ('manage_team_accounts', 'Gérer son équipe', 'governance'),
  ('review_partners', 'Valider les partenaires', 'commercial'),
  ('create_partners', 'Créer des partenaires', 'commercial'),
  ('manage_commercial_content', 'Gérer promotions et contenus', 'marketing'),
  ('manage_operations', 'Gérer commandes et livraisons', 'operations'),
  ('view_sales_reports', 'Consulter les ventes', 'commercial')
ON CONFLICT (code) DO NOTHING;

-- Minimal, non-escalating standard role mapping. Extra rights must be granted
-- explicitly through role_permissions by a PDG/system administrator.
INSERT INTO public.role_permissions (organization_role_id, permission_id)
SELECT r.id, p.id
FROM public.organization_roles r
JOIN public.permissions p ON (r.code IN ('pdg', 'ceo', 'general_management') AND p.code IN ('access_admin','manage_team_accounts','review_partners','manage_commercial_content','manage_operations','view_sales_reports'))
   OR (r.code IN ('direction_marketing', 'directeur_marketing') AND p.code IN ('access_admin','manage_commercial_content','view_sales_reports'))
   OR (r.code IN ('responsable_commercial', 'commercial_manager') AND p.code IN ('access_admin','manage_team_accounts','review_partners','view_sales_reports'))
   OR (r.code IN ('agent_commercial', 'commercial_agent', 'sales_agent') AND p.code IN ('access_admin','create_partners'))
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Admins can manage partner applications" ON public.partner_applications;
CREATE POLICY "Authorized staff can read partner applications"
ON public.partner_applications FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'review_partners'));
CREATE POLICY "Authorized staff can review partner applications"
ON public.partner_applications FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'review_partners'))
WITH CHECK (public.has_permission(auth.uid(), 'review_partners'));
