-- Final security pass: lock down RPC-like internal functions and make every
-- database function resolve objects through an explicit, trusted search path.

ALTER FUNCTION public.generate_booking_number() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_qr_code() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
ALTER FUNCTION public.create_user_management_link(uuid, uuid, bigint) SET search_path = pg_catalog, public;
ALTER FUNCTION public.sync_user_management() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_commercial_referral_code() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_commission() SET search_path = pg_catalog, public;
ALTER FUNCTION public.enforce_home_featured_products_limit() SET search_path = pg_catalog, public;
ALTER FUNCTION public.check_withdrawal_amount() SET search_path = pg_catalog, public;
ALTER FUNCTION public.check_wallet_balance() SET search_path = pg_catalog, public;
ALTER FUNCTION public.approve_withdrawal(bigint, uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.sync_profile_access_scope() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sync_product_liquidation() SET search_path = pg_catalog, public;

-- These functions are internal trigger helpers, not public RPC endpoints.
REVOKE ALL ON FUNCTION public.generate_booking_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_qr_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_user_management_link(uuid, uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_user_management() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_commercial_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_commission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_home_featured_products_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_withdrawal_amount() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_wallet_balance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_access_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_product_liquidation() FROM PUBLIC, anon, authenticated;

-- Withdrawal approval must only be performed by trusted server-side code.
REVOKE ALL ON FUNCTION public.approve_withdrawal(bigint, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(bigint, uuid) TO service_role;

-- Role helpers remain callable by RLS, but may only inspect the caller's own
-- identity. This prevents using SECURITY DEFINER RPC calls to probe other users.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role::text = _role
    );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _user_id = (SELECT auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role::text = 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.profiles p
        JOIN public.organization_roles r ON r.id = p.organization_role_id AND r.actif = true
        JOIN public.role_permissions rp ON rp.organization_role_id = r.id AND rp.actif = true
        JOIN public.permissions perm ON perm.id = rp.permission_id AND perm.actif = true
        WHERE p.id = _user_id AND p.is_active = true AND perm.code = _permission
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _user_id = (SELECT auth.uid())
    AND (
      public.has_role(_user_id, 'admin')
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = _user_id AND role::text = 'admin'
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_supplier_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _user_id = (SELECT auth.uid())
    AND (
      public.is_platform_admin(_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.profiles profile
        JOIN public.role_permissions role_permission
          ON role_permission.organization_role_id = profile.organization_role_id
         AND role_permission.actif = true
        JOIN public.permissions permission
          ON permission.id = role_permission.permission_id
        WHERE profile.id = _user_id
          AND permission.code = 'manage_suppliers'
      )
    );
$$;
