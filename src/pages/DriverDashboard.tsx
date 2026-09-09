import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, PackageCheck } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const driverClient = supabase as unknown as SupabaseClient;
type Delivery = { id: number; order_id: string | null; status: string | null; delivery_fee: number | null };
const statusLabels: Record<string, string> = { pending: "À accepter", accepted: "Acceptée", picked_up: "Commande récupérée", in_progress: "En route", on_the_way: "En route", delivered: "Livrée", cancelled: "Annulée" };
const nextStatus: Record<string, { status: string; label: string }> = {
  pending: { status: "accepted", label: "Accepter la livraison" },
  assigned: { status: "accepted", label: "Accepter la livraison" },
  accepted: { status: "picked_up", label: "Commande récupérée" },
  picked_up: { status: "in_progress", label: "Je suis en route" },
  in_progress: { status: "delivered", label: "Livraison terminée" },
};
const managementActions = [
  { from: ["accepted"], status: "picked_up", label: "Commande récupérée" },
  { from: ["picked_up"], status: "in_progress", label: "Je suis en route" },
  { from: ["in_progress", "on_the_way"], status: "delivered", label: "Livraison terminée" },
];

export default function DriverDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveriesError, setDeliveriesError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [currentDeliveryId, setCurrentDeliveryId] = useState<number | null>(null);
  const [hasStoredLocation, setHasStoredLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const lastPositionSent = useRef(0);
  const availabilityVersion = useRef(0);
  const loadSequence = useRef(0);
  const availabilitySaving = useRef(false);
  const knownDeliveryIds = useRef<Set<number> | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);
  const activeDelivery = deliveries.find(delivery => delivery.id === currentDeliveryId && !["delivered", "cancelled"].includes(delivery.status ?? ""));
  const manageableDelivery = activeDelivery ?? deliveries.find(delivery => !["delivered", "cancelled"].includes(delivery.status ?? ""));

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const version = availabilityVersion.current;
    const sequence = ++loadSequence.current;
    const [deliveryResult, statusResult] = await Promise.all([
      driverClient.from("deliveries").select("id, order_id, status, delivery_fee").eq("driver_id", user.id).order("id", { ascending: false }),
      driverClient.from("driver_status").select("is_available, current_delivery_id, latitude, longitude").eq("driver_id", user.id).maybeSingle(),
    ]);
    if (sequence !== loadSequence.current) return;
    if (deliveryResult.error) {
      setDeliveriesError(`Accès aux livraisons refusé : ${deliveryResult.error.message}`);
      toast.error("Impossible d’actualiser vos livraisons.");
    }
    else {
      setDeliveriesError("");
      const nextDeliveries = deliveryResult.data || [];
      const previousIds = knownDeliveryIds.current;
      if (previousIds) {
        const newlyAssigned = nextDeliveries.filter(delivery => !previousIds.has(delivery.id) && !["delivered", "cancelled"].includes(delivery.status ?? ""));
        if (newlyAssigned.length) {
          toast.success(newlyAssigned.length === 1 ? `Nouvelle livraison #${newlyAssigned[0].id} attribuée` : `${newlyAssigned.length} nouvelles livraisons attribuées`);
        }
      }
      knownDeliveryIds.current = new Set(nextDeliveries.map(delivery => delivery.id));
      setDeliveries(nextDeliveries);
    }
    if (version === availabilityVersion.current && !availabilitySaving.current) {
      setAvailabilityError(!!statusResult.error);
      if (!statusResult.error) {
        setIsAvailable(statusResult.data?.is_available === true);
        setCurrentDeliveryId(statusResult.data?.current_delivery_id ?? null);
        setHasStoredLocation(statusResult.data?.latitude != null && statusResult.data?.longitude != null);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    const channel = supabase.channel(`driver-deliveries:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `driver_id=eq.${user.id}` }, () => { void load(); }).subscribe();
    const interval = window.setInterval(() => { void load(); }, 15000);
    return () => { window.clearInterval(interval); void supabase.removeChannel(channel); };
  }, [load, user]);

  const activeId = activeDelivery?.id;
  useEffect(() => {
    if (!sharing || !user || !activeId) { setSharing(false); return; }
    if (!navigator.geolocation) { toast.error("Géolocalisation indisponible."); setSharing(false); return; }
    let active = true;
    let sending = false;
    lastPositionSent.current = 0;
    const watch = navigator.geolocation.watchPosition(async position => {
      if (!active || sending || Date.now() - lastPositionSent.current < 15000) return;
      sending = true;
      const { error } = await driverClient.from("driver_status").update({
        latitude: position.coords.latitude, longitude: position.coords.longitude, last_seen_at: new Date().toISOString(),
      }).eq("driver_id", user.id).eq("current_delivery_id", activeId);
      sending = false;
      if (!active) return;
      if (error) { toast.error("Position non transmise. Réessayez le partage."); setSharing(false); }
      else lastPositionSent.current = Date.now();
    }, () => {
      if (active) { toast.error("Autorisez la localisation pour partager votre position."); setSharing(false); }
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
    return () => { active = false; navigator.geolocation.clearWatch(watch); };
  }, [sharing, user, activeId]);

  const toggleAvailability = async () => {
    if (!user || isAvailable === null || availabilityError || availabilitySaving.current) return;
    availabilitySaving.current = true;
    ++availabilityVersion.current;
    setLocationLoading(true);
    const finish = () => {
      availabilitySaving.current = false;
      ++availabilityVersion.current;
      setLocationLoading(false);
    };
    const save = async (coordinates?: GeolocationCoordinates) => {
      try {
        const locationValues = coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : {};
        const query = isAvailable
          ? driverClient.from("driver_status").update({ is_available: false }).eq("driver_id", user.id)
          : driverClient.from("driver_status").upsert({ driver_id: user.id, is_available: true,
              ...locationValues, last_seen_at: new Date().toISOString() });
        const { data, error } = await query.select("is_available, current_delivery_id, latitude, longitude").single();
        if (error || !data) throw error || new Error("Disponibilité non enregistrée");
        setIsAvailable(data.is_available === true);
        setCurrentDeliveryId(data.current_delivery_id ?? null);
        setHasStoredLocation(data.latitude != null && data.longitude != null);
        setAvailabilityError(false);
      } catch { toast.error("Disponibilité non enregistrée. Réessayez."); }
      finally { finish(); }
    };
    if (isAvailable) { await save(); return; }
    if (!navigator.geolocation) { toast.error("Géolocalisation indisponible."); finish(); return; }
    navigator.geolocation.getCurrentPosition(position => { void save(position.coords); },
      () => {
        navigator.geolocation.getCurrentPosition(position => { void save(position.coords); }, () => {
          if (hasStoredLocation) {
            toast.info("GPS immédiat indisponible : votre dernière position enregistrée est conservée.");
            void save();
          } else {
            toast.error("Impossible d’obtenir votre position GPS. Autorisez la localisation dans le navigateur.");
            finish();
          }
        }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 });
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  };
  const updateStatus = async (delivery: Delivery, status: string) => {
    if (saving != null || !user) return;
    setSaving(delivery.id);
    const { data, error } = await driverClient.from("deliveries").update({ status })
      .eq("id", delivery.id).eq("driver_id", user.id).eq("status", delivery.status).select("id");
    if (error || !data?.length) toast.error(error?.message || "Cette livraison a changé. Les informations ont été actualisées.");
    await load();
    setSaving(null);
  };

  const pendingCount = deliveries.filter(delivery => ["pending", "assigned"].includes(delivery.status ?? "")).length;

  if (loading) return <main className="p-6">Chargement de vos livraisons…</main>;
  return <main className="min-h-screen bg-background p-6 md:p-10"><div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold">Espace livreur</h1><p className="mt-2 text-muted-foreground">Consultez les livraisons qui vous sont attribuées.</p></div>{pendingCount > 0 && <div role="status" className="flex w-fit items-center gap-2 rounded-full bg-amber-500/15 px-4 py-2 font-semibold text-amber-700"><Bell className="h-4 w-4" />{pendingCount} livraison{pendingCount > 1 ? "s" : ""} à accepter</div>}</div>
    <section className="space-y-3 rounded-xl border p-5"><h2 className="text-xl font-bold">Ma disponibilité</h2>
      <button onClick={() => void toggleAvailability()} disabled={locationLoading || isAvailable === null || availabilityError} className="rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50">{locationLoading ? "Enregistrement…" : availabilityError ? "Disponibilité non chargée" : isAvailable === null ? "Chargement…" : isAvailable ? "Me rendre indisponible" : "Je suis disponible"}</button>
      {availabilityError && <p role="alert" className="text-sm text-destructive">Impossible de lire votre disponibilité. <button className="underline" onClick={() => void load()}>Réessayer</button></p>}
      {activeDelivery && <p className="text-sm">Livraison en cours. Votre choix de disponibilité est conservé pour la suite.</p>}
      {activeDelivery && <div className="space-y-2"><p className="text-sm text-muted-foreground">Partagez votre position avec le client de votre livraison en cours tant que cette page reste ouverte.</p><button className="rounded-lg border px-4 py-2 font-semibold" onClick={() => setSharing(value => !value)}>{sharing ? "Arrêter le partage de position" : "Partager ma position pendant la livraison"}</button></div>}
    </section>
    <section className="rounded-xl border p-5"><h2 className="text-xl font-bold">Gestion de la livraison</h2><p className="mt-1 text-sm text-muted-foreground">{manageableDelivery ? `Livraison #${manageableDelivery.id} · ${statusLabels[manageableDelivery.status ?? ""] || manageableDelivery.status || "En attente"}` : "Aucune livraison active. Les boutons seront disponibles dès qu’une livraison vous sera attribuée."}</p><div className="mt-4 grid gap-2 sm:grid-cols-3">{managementActions.map(action => { const enabled = Boolean(manageableDelivery && action.from.includes(manageableDelivery.status ?? "")); return <button key={action.status} type="button" disabled={!enabled || saving != null} onClick={() => manageableDelivery && void updateStatus(manageableDelivery, action.status)} className="rounded-lg border bg-background px-3 py-3 text-sm font-semibold transition enabled:border-primary enabled:bg-primary enabled:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45">{saving === manageableDelivery?.id && enabled ? "Enregistrement…" : action.label}</button>; })}</div></section>
    <section className="rounded-xl border p-5"><h2 className="mb-4 text-xl font-bold">Mes livraisons ({deliveries.length})</h2>
      {deliveriesError ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><p className="font-semibold">Vos livraisons ne peuvent pas être chargées.</p><p className="mt-1 break-words">{deliveriesError}</p><button className="mt-3 font-semibold underline" onClick={() => void load()}>Réessayer</button></div> : !deliveries.length ? <p className="text-muted-foreground">Aucune livraison ne vous est attribuée.</p> : <div className="space-y-4">{deliveries.map(delivery => {
        const action = nextStatus[delivery.status ?? ""];
        return <div key={delivery.id} className={`space-y-2 rounded-lg border p-4 ${["pending", "assigned"].includes(delivery.status ?? "") ? "border-amber-500/50 bg-amber-500/5" : ""}`}><div className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary" /><p className="font-bold">Livraison #{delivery.id}</p></div><p>Commande : {delivery.order_id || "—"}</p><p>Statut : {statusLabels[delivery.status ?? ""] || delivery.status || "En attente"}</p><p>Frais : {Number(delivery.delivery_fee || 0).toLocaleString("fr-FR")} FCFA</p>{action && <button disabled={saving != null} onClick={() => void updateStatus(delivery, action.status)} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto">{saving === delivery.id ? "Enregistrement…" : action.label}</button>}</div>;
      })}</div>}
    </section>
  </div></main>;
}
