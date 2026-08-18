import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, PackageSearch, RefreshCw, Search, Ticket, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const labels: Record<string, string> = {
  pending: "Commande en préparation",
  assigned: "Livreur assigné",
  picked_up: "Commande récupérée par le livreur",
  on_the_way: "Commande en cours de livraison",
  delivered: "Livraison terminée",
  cancelled: "Commande annulée",
};

type SavedOrder = { tracking_number: string; queue_number?: number | null; restaurant_name?: string; total?: number; created_at?: string };

const readSavedOrders = (): SavedOrder[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem("albarka_customer_orders") || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { /* historique absent */ }
  const lastTracking = localStorage.getItem("last_order_tracking_number");
  return lastTracking ? [{ tracking_number: lastTracking }] : [];
};

const DeliveryTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(readSavedOrders);
  const [results, setResults] = useState<Record<string, any>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchTracking = async (tracking: string) => {
    const { data, error } = await (supabase as any).rpc("get_order_delivery_tracking", { p_tracking_number: tracking });
    return error || !data?.[0] ? null : data[0];
  };

  const refreshOrders = async (orders = savedOrders) => {
    if (orders.length === 0) return;
    setIsLoading(true);
    const entries = await Promise.all(orders.map(async (order) => [order.tracking_number, await fetchTracking(order.tracking_number)] as const));
    setResults(Object.fromEntries(entries.filter(([, result]) => result)));
    setIsLoading(false);
  };

  useEffect(() => { void refreshOrders(savedOrders); }, []);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    const tracking = trackingNumber.trim().toUpperCase();
    if (!tracking) return;
    setIsLoading(true); setMessage("");
    const result = await fetchTracking(tracking);
    setIsLoading(false);
    if (!result) { setMessage("Aucune commande trouvée avec ce numéro."); return; }
    const nextOrders = [{ tracking_number: tracking, restaurant_name: result.restaurant_name }, ...savedOrders.filter((order) => order.tracking_number !== tracking)].slice(0, 20);
    setSavedOrders(nextOrders);
    setResults((current) => ({ ...current, [tracking]: result }));
    localStorage.setItem("albarka_customer_orders", JSON.stringify(nextOrders));
    setTrackingNumber("");
  };

  return <main className="min-h-screen py-10 pb-28 md:py-16"><div className="container mx-auto max-w-3xl px-4">
    <div className="text-center"><Truck className="mx-auto mb-4 h-12 w-12 text-primary" /><h1 className="text-3xl font-bold">Espace suivi client</h1><p className="mt-2 text-muted-foreground">Retrouvez vos commandes, votre ticket et l'avancement de la livraison.</p></div>
    <div className="mt-8 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Mes commandes</h2><p className="text-sm text-muted-foreground">{savedOrders.length} commande(s) sur cet appareil</p></div><Button variant="outline" size="sm" onClick={() => refreshOrders()} disabled={isLoading} className="gap-2"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Actualiser</Button></div>
    {savedOrders.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-muted-foreground"><PackageSearch className="mx-auto mb-3 h-10 w-10" /><p>Aucune commande enregistrée sur cet appareil.</p></div> : <div className="mt-5 space-y-4">{savedOrders.map((saved) => <OrderCard key={saved.tracking_number} saved={saved} result={results[saved.tracking_number]} loading={isLoading && !results[saved.tracking_number]} />)}</div>}
    <section className="mt-10 rounded-2xl border bg-card p-5"><h2 className="font-bold">Ajouter une commande</h2><p className="mt-1 text-sm text-muted-foreground">Pour une commande passée sur un autre téléphone.</p><form onSubmit={search} className="mt-4 flex flex-col gap-2 sm:flex-row"><Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Ex. AT-LIV-1234ABCD" className="font-mono" /><Button disabled={isLoading} className="gap-2"><Search className="h-4 w-4" />Rechercher</Button></form>{message && <p className="mt-3 text-sm text-destructive">{message}</p>}</section>
  </div></main>;
};

function OrderCard({ saved, result, loading }: { saved: SavedOrder; result: any; loading: boolean }) {
  const status = result?.delivery_status || "pending";
  const delivered = status === "delivered";
  return <article className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="truncate font-mono text-xs text-muted-foreground">{saved.tracking_number}</p><h3 className="mt-1 text-lg font-bold">{result?.restaurant_name || saved.restaurant_name || "Commande Albarka"}</h3>{saved.created_at && <p className="mt-1 text-xs text-muted-foreground">Commandée le {new Date(saved.created_at).toLocaleString("fr-FR")}</p>}</div><span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${delivered ? "bg-green-500/15 text-green-700" : status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{loading ? "Actualisation..." : labels[status] || "Commande enregistrée"}</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={<Ticket />} label="Ticket" value={String(result?.queue_number || saved.queue_number || "—")} /><Metric icon={<PackageSearch />} label="Devant vous" value={String(result?.people_ahead ?? "—")} /><Metric icon={<Truck />} label="Livraison" value={result?.delivery_fee != null ? `${Number(result.delivery_fee).toLocaleString("fr-FR")} F` : "—"} /><Metric icon={<CheckCircle2 />} label="Total" value={saved.total != null ? `${Number(saved.total).toLocaleString("fr-FR")} F` : "—"} /></div>{result?.delivery_updated_at && <p className="mt-4 text-xs text-muted-foreground">Dernière mise à jour : {new Date(result.delivery_updated_at).toLocaleString("fr-FR")}</p>}</article>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl bg-muted/50 p-3"><span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span><p className="mt-2 text-xs text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>; }

export default DeliveryTracking;
