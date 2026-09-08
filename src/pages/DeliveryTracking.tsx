import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, PackageSearch, Phone, RefreshCw, Search, Ticket, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getArrivalMinutes, getCourierLocation, getOrderProgress, mergeTracking, orderSteps, TrackingResult } from "@/lib/orderTracking";

type SavedOrder = Pick<TrackingResult, "tracking_number" | "queue_number" | "restaurant_name" | "total" | "created_at">;
const trackingClient = supabase as unknown as SupabaseClient;
const rpc = (name: string, params: Record<string, unknown>) => trackingClient.rpc(name, params);

function readSavedOrders(): SavedOrder[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("albarka_customer_orders") || "[]");
    if (Array.isArray(parsed) && parsed.length) return parsed.filter(order => typeof order?.tracking_number === "string");
    const last = localStorage.getItem("last_order_tracking_number");
    return last ? [{ tracking_number: last }] : [];
  } catch { return []; }
}

export default function DeliveryTracking() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <main className="container p-8">Chargement du suivi…</main>;
  // Discard the previous account's history and pending requests on sign-out/account switch.
  return <CustomerTracking key={user?.id ?? "guest"} userId={user?.id} />;
}

function CustomerTracking({ userId }: { userId?: string }) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [extraOrders, setExtraOrders] = useState<SavedOrder[]>(() => userId ? [] : readSavedOrders());
  const [orders, setOrders] = useState<SavedOrder[]>(extraOrders);
  const [results, setResults] = useState<Record<string, TrackingResult>>({});
  const [message, setMessage] = useState("");
  const [syncError, setSyncError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [live, setLive] = useState(false);
  const mounted = useRef(true);
  const running = useRef(false);
  const rerun = useRef(false);
  const extras = useRef(extraOrders);
  extras.current = extraOrders;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (running.current) { rerun.current = true; return; }
    running.current = true;
    setIsLoading(true);
    try {
      do {
        rerun.current = false;
        const accountOrders: SavedOrder[] = [];
        if (userId) {
          // Read all pages instead of losing older orders at the API's row limit.
          for (let offset = 0; ; offset += 100) {
            const { data, error } = await trackingClient.from("orders")
              .select("tracking_number, queue_number, total, created_at")
              .eq("customer_id", userId).not("tracking_number", "is", null)
              .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 99);
            if (error) throw error;
            accountOrders.push(...(data || []));
            if (!mounted.current) return;
            if (!data || data.length < 100) break;
          }
        }
        const nextOrders = [...new Map([...extras.current, ...accountOrders].map(order => [order.tracking_number, order])).values()]
          .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
        const entries: [string, TrackingResult][] = [];
        let failed = false;
        // Bound concurrent requests when a customer has a long history.
        for (let offset = 0; offset < nextOrders.length; offset += 6) {
          await Promise.all(nextOrders.slice(offset, offset + 6).map(async order => {
            try {
              const { data, error } = await rpc("get_order_delivery_tracking", { p_tracking_number: order.tracking_number });
              if (error || !data?.[0]) { failed = true; return; }
              entries.push([order.tracking_number, data[0]]);
            } catch { failed = true; }
          }));
          if (!mounted.current) return;
        }
        if (!mounted.current) return;
        setOrders(nextOrders);
        setResults(previous => {
          const next = { ...previous };
          entries.forEach(([tracking, result]) => { next[tracking] = mergeTracking(previous[tracking], result); });
          return next;
        });
        setSyncError(failed ? "Mise à jour partielle. Les dernières informations reçues restent affichées ; nouvelle tentative automatique." : "");
      } while (rerun.current && mounted.current);
    } catch {
      if (mounted.current) setSyncError("Connexion interrompue. Les dernières informations restent affichées ; nouvelle tentative automatique.");
    } finally {
      running.current = false;
      if (mounted.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh, extraOrders]);
  const topics = orders.map(order => `customer-tracking:${order.tracking_number}`).sort().join("|");
  useEffect(() => {
    let active = true;
    const names = topics ? topics.split("|") : [];
    if (userId) names.push(`customer-orders:${userId}`);
    const connected = new Set<string>();
    const channels = names.map(name => supabase.channel(name)
      .on("broadcast", { event: "changed" }, () => { void refresh(); })
      .subscribe(status => {
        if (!active) return;
        if (status === "SUBSCRIBED") { connected.add(name); void refresh(); }
        else connected.delete(name);
        setLive(names.length > 0 && connected.size === names.length);
      }));
    // Recovery for missed events, reconnection, and time-sensitive GPS/ETA values.
    const interval = window.setInterval(() => { void refresh(); }, 15000);
    const wake = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
      channels.forEach(channel => { void supabase.removeChannel(channel); });
    };
  }, [topics, userId, refresh]);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    const tracking = trackingNumber.trim().toUpperCase();
    if (!tracking || searching) return;
    setSearching(true); setMessage("");
    try {
      const { data, error } = await rpc("get_order_delivery_tracking", { p_tracking_number: tracking });
      if (!mounted.current) return;
      if (error) throw error;
      if (!data?.[0]) { setMessage("Aucune commande trouvée avec ce numéro."); return; }
      const result: TrackingResult = data[0];
      setResults(previous => ({ ...previous, [tracking]: mergeTracking(previous[tracking], result) }));
      const nextOrders = [{ tracking_number: tracking, restaurant_name: result.restaurant_name }, ...extras.current.filter(order => order.tracking_number !== tracking)];
      setExtraOrders(nextOrders);
      if (!userId) {
        try { localStorage.setItem("albarka_customer_orders", JSON.stringify(nextOrders)); }
        catch { setMessage("Commande retrouvée. Ce navigateur ne permet pas d'enregistrer l'historique."); }
      }
      setTrackingNumber("");
    } catch { if (mounted.current) setMessage("Recherche indisponible. Vérifiez votre connexion puis réessayez."); }
    finally { if (mounted.current) setSearching(false); }
  };

  return <main className="min-h-screen py-10 pb-28 md:py-16"><div className="container mx-auto max-w-3xl px-4">
    <div className="text-center"><Truck className="mx-auto mb-4 h-12 w-12 text-primary" /><h1 className="text-3xl font-bold">Espace suivi client</h1><p className="mt-2 text-muted-foreground">Retrouvez vos commandes, votre ticket et leur avancement.</p></div>
    <div className="mt-8 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Mes commandes</h2><p className="text-sm text-muted-foreground">{orders.length} commande(s)</p></div><Button variant="outline" size="sm" onClick={() => void refresh()} disabled={isLoading} className="gap-2"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Actualiser</Button></div>
    <p className="mt-2 text-sm text-muted-foreground">{userId ? "Vos commandes sont retrouvées depuis votre compte, même sur un autre téléphone." : <>Connectez-vous au <Link to="/auth" className="text-primary underline">compte utilisé pour commander</Link> pour retrouver votre historique. Sans connexion, seuls les numéros enregistrés sur cet appareil sont affichés.</>}</p>
    <p role="status" className="mt-2 text-xs text-muted-foreground">{live ? "Suivi en direct · actualisation automatique" : "Actualisation automatique toutes les 15 secondes · connexion au suivi en direct…"}</p>
    {syncError && <p role="alert" className="mt-3 text-sm text-amber-700">{syncError}</p>}
    {orders.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-muted-foreground"><PackageSearch className="mx-auto mb-3 h-10 w-10" /><p>{isLoading ? "Chargement de vos commandes…" : "Aucune commande à afficher."}</p></div> : <div className="mt-5 space-y-4">{orders.map(saved => <OrderCard key={saved.tracking_number} saved={saved} result={results[saved.tracking_number]} loading={isLoading && !results[saved.tracking_number]} />)}</div>}
    <section className="mt-10 rounded-2xl border bg-card p-5"><h2 className="font-bold">Retrouver une commande par numéro</h2><form onSubmit={search} className="mt-4 flex flex-col gap-2 sm:flex-row"><Input aria-label="Numéro de suivi" value={trackingNumber} onChange={event => setTrackingNumber(event.target.value)} placeholder="Ex. AT-LIV-1234ABCD" className="font-mono" /><Button disabled={searching} className="gap-2"><Search className="h-4 w-4" />Rechercher</Button></form>{message && <p role="status" className="mt-3 text-sm text-destructive">{message}</p>}</section>
  </div></main>;
}

function OrderCard({ saved, result, loading }: { saved: SavedOrder; result?: TrackingResult; loading: boolean }) {
  const progress = getOrderProgress(result);
  const delivered = progress.step === 9;
  const finished = delivered || (result?.status === "completed" && result.requires_delivery === false);
  const location = result ? getCourierLocation(result) : null;
  const minutes = result ? getArrivalMinutes(result) : null;
  const steps = result?.requires_delivery === false ? orderSteps.slice(0, 6) : orderSteps;
  const createdAt = result?.created_at || saved.created_at;
  const total = result?.total ?? saved.total;
  const phone = result?.courier_phone?.replace(/[^+\d]/g, "");
  return <article className="rounded-2xl border bg-card p-5 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0"><p className="truncate font-mono text-xs text-muted-foreground">{saved.tracking_number}</p><h3 className="mt-1 text-lg font-bold">{result?.restaurant_name || saved.restaurant_name || "Commande Albarka"}</h3>{createdAt && <p className="mt-1 text-xs text-muted-foreground">Commandée le {new Date(createdAt).toLocaleString("fr-FR")}</p>}</div>
      <span aria-live="polite" className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${finished ? "bg-green-500/15 text-green-700" : progress.blocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{loading ? "Actualisation…" : progress.label}</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric icon={<Ticket />} label="Ticket" value={String(result?.queue_number ?? saved.queue_number ?? "—")} />
      <Metric icon={<PackageSearch />} label="File d’attente" value={finished || progress.blocked ? "Terminée" : result?.people_ahead != null ? `${result.people_ahead} commande${Number(result.people_ahead) === 1 ? "" : "s"} avant la vôtre` : "Indisponible"} />
      <Metric icon={<Truck />} label="Livraison" value={result?.delivery_fee != null ? `${Number(result.delivery_fee).toLocaleString("fr-FR")} F` : "—"} />
      <Metric icon={<CheckCircle2 />} label="Total" value={total != null ? `${Number(total).toLocaleString("fr-FR")} F` : "—"} />
    </div>
    {result && !progress.blocked && !finished && (result.courier_name || result.courier_phone) && <section className="mt-4 space-y-2 rounded-xl bg-muted/50 p-4" aria-label="Votre livreur">
      <p className="font-semibold">Votre livreur : {result.courier_name || "Livreur attribué"}</p>
      {phone && <a href={`tel:${phone}`} className="flex items-center gap-2 text-primary underline"><Phone className="h-4 w-4" />{result.courier_phone}</a>}
      {location ? <a href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary underline"><MapPin className="h-4 w-4" />Voir sa position récente</a> : <p className="text-sm text-muted-foreground">Position actuelle non disponible.</p>}
      {minutes != null ? <p className="text-sm">Arrivée estimée dans environ {minutes} min.</p> : <p className="text-sm text-muted-foreground">Heure d’arrivée non disponible.</p>}
    </section>}
    {result && <ol aria-label="Avancement de la commande" className="mt-5 space-y-2">{steps.map((label, index) => <li key={label} aria-current={index === progress.step ? "step" : undefined} className={`flex items-center gap-3 text-sm ${index === progress.step ? "font-semibold text-primary" : index < progress.step ? "text-green-700" : "text-muted-foreground"}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">{index < progress.step || (finished && index === progress.step) ? <CheckCircle2 className="h-4 w-4" aria-label="Étape terminée" /> : index + 1}</span>{label}{index === progress.step && <span className="sr-only"> (étape actuelle)</span>}</li>)}</ol>}
    {result?.delivery_completed_at ? <p className="mt-4 text-xs text-green-700">Livrée le {new Date(result.delivery_completed_at).toLocaleString("fr-FR")}</p> : result?.delivery_updated_at && <p className="mt-4 text-xs text-muted-foreground">Dernière mise à jour : {new Date(result.delivery_updated_at).toLocaleString("fr-FR")}</p>}
  </article>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl bg-muted/50 p-3"><span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span><p className="mt-2 text-xs text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>;
}
