BEGIN;
CREATE SCHEMA IF NOT EXISTS private;

CREATE INDEX IF NOT EXISTS orders_customer_history_idx ON public.orders(customer_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS deliveries_order_tracking_idx ON public.deliveries(order_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS orders_tracking_upper_idx ON public.orders(upper(tracking_number));

-- Ownership is already assigned from auth.uid() by definir_client_commande.
-- Do not attach old orders using an unverified phone number or a tracking code.
CREATE OR REPLACE FUNCTION private.guard_finished_customer_order()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN

  IF OLD.status = 'completed' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Une commande terminée ne peut pas être rouverte';
  END IF;
  IF OLD.delivery_status = 'delivered' OR OLD.delivery_completed_at IS NOT NULL THEN
    IF NEW.delivery_status IS DISTINCT FROM OLD.delivery_status
       OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IS DISTINCT FROM 'completed') THEN
      RAISE EXCEPTION 'Une livraison terminée ne peut plus changer de statut';
    END IF;
    NEW.delivery_completed_at := OLD.delivery_completed_at;
  ELSIF NEW.delivery_status = 'delivered' THEN
    NEW.delivery_completed_at := now();
  ELSE
    NEW.delivery_completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_finished_customer_order() FROM PUBLIC;
CREATE TRIGGER guard_finished_customer_order BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.guard_finished_customer_order();

CREATE OR REPLACE FUNCTION public.controler_progression_livraison()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.order_id IS DISTINCT FROM OLD.order_id THEN
    RAISE EXCEPTION 'Une livraison ne peut pas être déplacée vers une autre commande';
  END IF;
  IF OLD.status = 'delivered' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.driver_id IS DISTINCT FROM OLD.driver_id) THEN
    RAISE EXCEPTION 'Une livraison terminée ne peut pas être rouverte ou réattribuée';
  END IF;
  IF OLD.status = 'delivered' THEN
    NEW.completed_at := OLD.completed_at;
    NEW.delivery_time := OLD.delivery_time;
  END IF;
  -- An order completed by dispatch also closes its driver's delivery.
  IF NEW.status = 'delivered' AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = NEW.order_id
      AND (o.delivery_status = 'delivered' OR o.delivery_completed_at IS NOT NULL)
  ) THEN
    NEW.completed_at := coalesce(OLD.completed_at, now());
    RETURN NEW;
  END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF auth.uid() = OLD.driver_id AND NOT (
    (OLD.status = 'pending' AND NEW.status = 'accepted') OR
    (OLD.status = 'accepted' AND NEW.status IN ('picked_up', 'in_progress')) OR
    (OLD.status = 'picked_up' AND NEW.status = 'in_progress') OR
    (OLD.status = 'in_progress' AND NEW.status = 'delivered')
  ) THEN
    RAISE EXCEPTION 'Respectez les étapes : acceptée, récupérée, en route, livrée';
  END IF;
  IF NEW.status = 'accepted' THEN NEW.accepted_at := coalesce(OLD.accepted_at, now()); END IF;
  IF NEW.status = 'picked_up' THEN NEW.pickup_time := coalesce(OLD.pickup_time, now()); END IF;
  IF NEW.status = 'in_progress' THEN NEW.started_at := coalesce(OLD.started_at, now()); END IF;
  IF NEW.status = 'delivered' THEN NEW.completed_at := coalesce(OLD.completed_at, now()); END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS verifier_progression_livraison ON public.deliveries;
CREATE TRIGGER verifier_progression_livraison BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.controler_progression_livraison();

-- Enforce ownership before an insertion can update the associated order.
DROP POLICY IF EXISTS "Client peut créer une livraison" ON public.deliveries;
CREATE POLICY "Client peut créer une livraison" ON public.deliveries FOR INSERT TO authenticated
WITH CHECK (status = 'pending' AND (driver_id IS NULL OR public.is_eligible_delivery_driver(driver_id))
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = (SELECT auth.uid())
    AND o.delivery_status NOT IN ('delivered', 'cancelled') AND o.delivery_completed_at IS NULL));

CREATE OR REPLACE FUNCTION private.sync_delivery_status_to_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE mapped_status text; current_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO current_order FROM public.orders WHERE id = NEW.order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF current_order.delivery_status = 'delivered' OR current_order.delivery_completed_at IS NOT NULL THEN
    IF NEW.status <> 'delivered' THEN RAISE EXCEPTION 'Cette commande est déjà livrée'; END IF;
    RETURN NEW;
  END IF;
  mapped_status := CASE NEW.status
    WHEN 'pending' THEN CASE WHEN NEW.driver_id IS NOT NULL THEN 'assigned' ELSE 'pending' END
    WHEN 'accepted' THEN 'assigned'
    WHEN 'picked_up' THEN 'picked_up'
    WHEN 'in_progress' THEN 'on_the_way'
    WHEN 'on_the_way' THEN 'on_the_way'
    WHEN 'delivered' THEN 'delivered'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE NULL END;
  IF mapped_status IS NULL THEN RAISE EXCEPTION 'Statut de livraison invalide'; END IF;
  UPDATE public.orders SET delivery_status = mapped_status WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.sync_delivery_status_to_order() FROM PUBLIC;
DROP TRIGGER IF EXISTS sync_delivery_status_to_order ON public.deliveries;
CREATE TRIGGER sync_delivery_status_to_order AFTER INSERT OR UPDATE OF status, driver_id ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION private.sync_delivery_status_to_order();

-- Broadcast only invalidations, never an order row, contact details or GPS data.
-- Public channels retain guest tracking; all data is reread through the limited RPC.
CREATE OR REPLACE FUNCTION private.notify_customer_tracking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE tracked record;
BEGIN
  IF NEW.tracking_number IS NOT NULL THEN
    PERFORM realtime.send('{}'::jsonb, 'changed', 'customer-tracking:' || NEW.tracking_number, false);
  END IF;
  IF NEW.customer_id IS NOT NULL THEN
    PERFORM realtime.send('{}'::jsonb, 'changed', 'customer-orders:' || NEW.customer_id::text, false);
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.delivery_status IS DISTINCT FROM OLD.delivery_status
    OR NEW.restaurant_confirmation_status IS DISTINCT FROM OLD.restaurant_confirmation_status) THEN
    FOR tracked IN SELECT o.tracking_number FROM public.orders o
      WHERE o.restaurant_id = NEW.restaurant_id
        AND o.restaurant_outlet_id IS NOT DISTINCT FROM NEW.restaurant_outlet_id
        AND o.created_at > NEW.created_at
        AND (o.created_at AT TIME ZONE 'Africa/Abidjan')::date = (NEW.created_at AT TIME ZONE 'Africa/Abidjan')::date
        AND o.delivery_status NOT IN ('delivered', 'cancelled')
        AND o.status NOT IN ('completed', 'cancelled') AND o.tracking_number IS NOT NULL
    LOOP
      PERFORM realtime.send('{}'::jsonb, 'changed', 'customer-tracking:' || tracked.tracking_number, false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.notify_customer_tracking() FROM PUBLIC;
CREATE TRIGGER notify_customer_tracking AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.notify_customer_tracking();

CREATE OR REPLACE FUNCTION private.notify_customer_driver_location()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE tracked record;
BEGIN
  FOR tracked IN SELECT o.tracking_number FROM public.deliveries d JOIN public.orders o ON o.id = d.order_id
    WHERE d.driver_id = NEW.driver_id AND d.id = NEW.current_delivery_id
      AND d.status NOT IN ('delivered', 'cancelled') AND o.delivery_status NOT IN ('delivered', 'cancelled')
      AND o.tracking_number IS NOT NULL
  LOOP
    PERFORM realtime.send('{}'::jsonb, 'changed', 'customer-tracking:' || tracked.tracking_number, false);
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.notify_customer_driver_location() FROM PUBLIC;
CREATE TRIGGER notify_customer_driver_location AFTER INSERT OR UPDATE ON public.driver_status
FOR EACH ROW EXECUTE FUNCTION private.notify_customer_driver_location();

CREATE OR REPLACE FUNCTION private.close_driver_deliveries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.delivery_status = 'delivered' AND OLD.delivery_status IS DISTINCT FROM 'delivered' THEN
    UPDATE public.deliveries SET status = 'delivered'
      WHERE order_id = NEW.id AND status IS DISTINCT FROM 'delivered';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.close_driver_deliveries() FROM PUBLIC;
CREATE TRIGGER close_driver_deliveries AFTER UPDATE OF delivery_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.close_driver_deliveries();
COMMIT;
