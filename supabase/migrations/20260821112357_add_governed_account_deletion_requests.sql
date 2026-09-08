INSERT INTO public.permissions (code, name, category)
VALUES
  ('request_account_deletion', 'Demander la suppression d''un compte', 'governance'),
  ('review_account_deletions', 'Approuver les suppressions de comptes', 'governance')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (organization_role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM public.organization_roles role_row
JOIN public.organizations organization_row
  ON organization_row.id = role_row.organization_id
 AND organization_row.organization_type = 'albarka_trade'
JOIN public.permissions permission_row
  ON (
    role_row.code IN ('direction_marketing', 'directeur_marketing')
    AND permission_row.code = 'request_account_deletion'
  ) OR (
    role_row.code IN ('pdg', 'ceo', 'general_management', 'directeur_general', 'directeur_generale')
    AND permission_row.code IN ('request_account_deletion', 'review_account_deletions')
  )
ON CONFLICT DO NOTHING;

CREATE TABLE public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_name text NOT NULL,
  target_email text,
  target_organization_id bigint REFERENCES public.organizations(id) ON DELETE SET NULL,
  country_id bigint REFERENCES public.countries(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_kind text NOT NULL CHECK (request_kind IN ('self', 'partner')),
  reason text NOT NULL CHECK (char_length(trim(reason)) BETWEEN 5 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX account_deletion_one_pending_target_idx
  ON public.account_deletion_requests(target_user_id)
  WHERE status = 'pending' AND target_user_id IS NOT NULL;
CREATE INDEX account_deletion_requests_country_status_idx
  ON public.account_deletion_requests(country_id, status, created_at DESC);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Les opérations passent exclusivement par manage-users. La fonction vérifie
-- le rôle, l'organisation et le pays avant d'utiliser la clé de service.
REVOKE ALL ON TABLE public.account_deletion_requests FROM anon, authenticated;
GRANT ALL ON TABLE public.account_deletion_requests TO service_role;

COMMENT ON TABLE public.account_deletion_requests IS
  'Demandes de suppression : auto-demande ou demande partenaire du marketing, toujours décidée par le PDG/Admin Albarka.';
