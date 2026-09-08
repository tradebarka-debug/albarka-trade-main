export const orderSteps = [
  "Précommande envoyée",
  "Disponibilité confirmée par le cuisinier",
  "Paiement en attente",
  "Paiement confirmé par le caissier",
  "Commande en préparation",
  "Commande prête",
  "Livreur attribué",
  "Commande récupérée",
  "Livreur en route",
  "Livraison terminée",
] as const;

export interface TrackingState {
  restaurant_confirmation_status?: string | null;
  payment_status?: string | null;
  status?: string | null;
  delivery_status?: string | null;
  delivery_completed_at?: string | null;
  requires_delivery?: boolean;
}

export function getOrderProgress(order?: TrackingState | null) {
  const blocked = (label: string) => ({ label, step: -1, blocked: true });
  if (!order) return { label: "Suivi indisponible", step: -1, blocked: false };
  if (order.delivery_status === "delivered" || order.delivery_completed_at) {
    return { label: orderSteps[9], step: 9, blocked: false };
  }
  if (order.status === "completed" && order.requires_delivery === false) {
    return { label: "Commande terminée", step: 5, blocked: false };
  }
  if (order.status === "cancelled" || order.delivery_status === "cancelled") return blocked("Commande annulée");
  if (order.restaurant_confirmation_status === "rejected") return blocked("Précommande refusée");
  if (order.restaurant_confirmation_status === "expired") return blocked("Précommande expirée");
  if (order.payment_status === "rejected") return blocked("Paiement refusé");

  // A later operational milestone is evidence of progress; pending delivery
  // must never hide the restaurant or cashier's current status.
  const deliverySteps: Record<string, number> = { assigned: 6, accepted: 6, picked_up: 7, in_progress: 8, on_the_way: 8, delivered: 9 };
  let step = deliverySteps[order.delivery_status ?? ""];
  // A driver can be selected during checkout. Assignment alone must not
  // skip restaurant confirmation, payment or preparation in the timeline.
  if (step === 6 && order.restaurant_confirmation_status === "pending") step = 0;
  else if (step === 6 && order.payment_status === "pending") step = 2;
  else if (step === 6 && order.status === "preparing") step = 4;
  else if (step === 6 && ["pending", "confirmed"].includes(order.status ?? "") && order.payment_status === "confirmed") step = 3;
  if (step === undefined) {
    if (order.status === "ready" || order.status === "completed") step = 5;
    else if (order.status === "preparing") step = 4;
    else if (order.payment_status === "confirmed") step = 3;
    else if (order.restaurant_confirmation_status === "accepted") step = order.payment_status === "pending" ? 2 : 1;
    else if (order.restaurant_confirmation_status === "pending") step = 0;
    else if (order.payment_status === "pending") step = 2;
    else return { label: "Commande enregistrée", step: -1, blocked: false };
  }
  return { label: orderSteps[step], step, blocked: false };
}

export interface TrackingResult extends TrackingState {
  tracking_number: string;
  queue_number?: number | null;
  people_ahead?: number | null;
  restaurant_name?: string | null;
  total?: number | null;
  created_at?: string;
  delivery_fee?: number | null;
  delivery_updated_at?: string | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  courier_latitude?: number | null;
  courier_longitude?: number | null;
  courier_location_at?: string | null;
  estimated_arrival_at?: string | null;
}

// Keep a confirmed completion and ignore responses from an older request.
export function mergeTracking(previous: TrackingResult | undefined, next: TrackingResult): TrackingResult {
  if (!previous) return next;
  const wasDelivered = previous.delivery_status === "delivered" || !!previous.delivery_completed_at;
  const isDelivered = next.delivery_status === "delivered" || !!next.delivery_completed_at;
  if (wasDelivered && !isDelivered) return previous;
  if (previous.status === "completed" && previous.requires_delivery === false && next.status !== "completed") return previous;
  if (!isDelivered && Date.parse(previous.delivery_updated_at ?? "") > Date.parse(next.delivery_updated_at ?? "")) return previous;
  return next;
}

export function getCourierLocation(result: TrackingResult, now = Date.now()) {
  if (["delivered", "cancelled"].includes(result.delivery_status ?? "") || result.delivery_completed_at) return null;
  const { courier_latitude: lat, courier_longitude: lng } = result;
  const age = now - Date.parse(result.courier_location_at ?? "");
  if (lat == null || lng == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180 || !Number.isFinite(age) || age < 0 || age > 120000) return null;
  return { latitude: Number(lat), longitude: Number(lng) };
}

export function getArrivalMinutes(result: TrackingResult, now = Date.now()) {
  if (!["on_the_way", "in_progress"].includes(result.delivery_status ?? "") || result.delivery_completed_at) return null;
  const remaining = Date.parse(result.estimated_arrival_at ?? "") - now;
  return Number.isFinite(remaining) && remaining > 0 ? Math.ceil(remaining / 60000) : null;
}
