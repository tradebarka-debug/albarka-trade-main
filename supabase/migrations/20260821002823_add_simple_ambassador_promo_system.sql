CREATE TABLE IF NOT EXISTS public.ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  password_hash text NOT NULL,
  promo_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  default_commission_rate numeric(5,2) NOT NULL DEFAULT 5 CHECK (default_commission_rate BETWEEN 0 AND 100),
  total_orders integer NOT NULL DEFAULT 0,
  total_commission numeric(14,2) NOT NULL DEFAULT 0,
  available_commission numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ambassadors_contact_required CHECK (
    NULLIF(btrim(phone), '') IS NOT NULL OR NULLIF(btrim(email), '') IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ambassadors_phone_unique
  ON public.ambassadors (lower(btrim(phone))) WHERE NULLIF(btrim(phone), '') IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ambassadors_email_unique
  ON public.ambassadors (lower(btrim(email))) WHERE NULLIF(btrim(email), '') IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.promo_commission_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  boutique_default_rate numeric(5,2) NOT NULL DEFAULT 5 CHECK (boutique_default_rate BETWEEN 0 AND 100),
  restaurant_default_rate numeric(5,2) NOT NULL DEFAULT 5 CHECK (restaurant_default_rate BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.promo_commission_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ambassador_commission_rate numeric(5,2)
  CHECK (ambassador_commission_rate BETWEEN 0 AND 100);

ALTER TABLE public.restaurant_menu_items
  ADD COLUMN IF NOT EXISTS ambassador_commission_rate numeric(5,2)
  CHECK (ambassador_commission_rate BETWEEN 0 AND 100);

CREATE TABLE IF NOT EXISTS public.ambassador_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.ambassadors(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_total numeric(14,2) NOT NULL DEFAULT 0,
  commission_amount numeric(14,2) NOT NULL DEFAULT 0,
  calculation_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS ambassador_commissions_ambassador_id_idx
  ON public.ambassador_commissions (ambassador_id, created_at DESC);

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block direct ambassador access" ON public.ambassadors;
CREATE POLICY "Block direct ambassador access"
  ON public.ambassadors FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Public can read promo commission defaults" ON public.promo_commission_settings;
CREATE POLICY "Public can read promo commission defaults"
  ON public.promo_commission_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage promo commission defaults" ON public.promo_commission_settings;
CREATE POLICY "Admins manage promo commission defaults"
  ON public.promo_commission_settings FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Block direct ambassador commission access" ON public.ambassador_commissions;
CREATE POLICY "Block direct ambassador commission access"
  ON public.ambassador_commissions FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

GRANT SELECT ON public.promo_commission_settings TO anon;
GRANT SELECT, UPDATE ON public.promo_commission_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambassadors TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambassador_commissions TO service_role;

CREATE OR REPLACE FUNCTION public.credit_ambassador_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  ambassador_row public.ambassadors%ROWTYPE;
  item jsonb;
  item_rate numeric(5,2);
  default_rate numeric(5,2);
  line_total numeric(14,2);
  commission_total numeric(14,2) := 0;
  details jsonb := '[]'::jsonb;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM 'confirmed'
     OR OLD.payment_status IS NOT DISTINCT FROM 'confirmed'
     OR NULLIF(btrim(NEW.promo_code), '') IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO ambassador_row
  FROM public.ambassadors
  WHERE upper(promo_code) = upper(btrim(NEW.promo_code)) AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(COALESCE(NEW.items::jsonb, '[]'::jsonb))
  LOOP
    line_total := COALESCE((item->>'unit_price')::numeric, 0) * COALESCE((item->>'quantity')::numeric, 0);

    IF NULLIF(item->>'restaurant_id', '') IS NOT NULL THEN
      SELECT COALESCE(
        (SELECT ambassador_commission_rate FROM public.restaurant_menu_items WHERE id::text = item->>'id' LIMIT 1),
        (SELECT restaurant_default_rate FROM public.promo_commission_settings WHERE id = 1),
        ambassador_row.default_commission_rate
      ) INTO item_rate;
    ELSE
      SELECT COALESCE(
        (SELECT ambassador_commission_rate FROM public.products WHERE id::text = item->>'id' LIMIT 1),
        (SELECT boutique_default_rate FROM public.promo_commission_settings WHERE id = 1),
        ambassador_row.default_commission_rate
      ) INTO item_rate;
    END IF;

    item_rate := COALESCE(item_rate, 0);
    commission_total := commission_total + round(line_total * item_rate / 100, 2);
    details := details || jsonb_build_array(jsonb_build_object(
      'item_id', item->>'id', 'name', item->>'name', 'amount', line_total,
      'rate', item_rate, 'commission', round(line_total * item_rate / 100, 2)
    ));
  END LOOP;

  INSERT INTO public.ambassador_commissions
    (ambassador_id, order_id, order_total, commission_amount, calculation_details)
  VALUES
    (ambassador_row.id, NEW.id, COALESCE(NEW.total, 0), commission_total, details)
  ON CONFLICT (order_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.ambassadors
    SET total_orders = total_orders + 1,
        total_commission = total_commission + commission_total,
        available_commission = available_commission + commission_total,
        updated_at = now()
    WHERE id = ambassador_row.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_ambassador_commission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS credit_ambassador_commission_on_payment ON public.orders;
CREATE TRIGGER credit_ambassador_commission_on_payment
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.credit_ambassador_commission();
