import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, PackageCheck, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type DeliveryStatus = "pending" | "assigned" | "picked_up" | "on_the_way" | "delivered" | "cancelled";

const deliveryLabels: Record<DeliveryStatus, string> = {
  pending: "À préparer", assigned: "Livreur assigné", picked_up: "Colis récupéré",
  on_the_way: "En livraison", delivered: "Livrée", cancelled: "Annulée",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any).from("orders").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Impossible de charger les commandes.");
    else {
      setOrders(data || []);
      setDrafts(Object.fromEntries((data || []).map((order: any) => [order.id, {
        courier_name: order.courier_name || "", courier_phone: order.courier_phone || "",
        delivery_distance_km: order.delivery_distance_km?.toString() || "",
        delivery_fee: order.delivery_fee?.toString() || "0", delivery_notes: order.delivery_notes || "",
        delivery_status: order.delivery_status || "pending",
      }])));
    }
    setIsLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const updateDraft = (orderId: string, field: string, value: string) =>
    setDrafts((current) => ({ ...current, [orderId]: { ...current[orderId], [field]: value } }));

  const saveDelivery = async (order: any, markDelivered = false) => {
    const draft = drafts[order.id];
    const deliveryStatus = (markDelivered ? "delivered" : draft.delivery_status) as DeliveryStatus;
    const { error } = await (supabase as any).from("orders").update({
      courier_name: draft.courier_name || null, courier_phone: draft.courier_phone || null,
      delivery_distance_km: draft.delivery_distance_km === "" ? null : Number(draft.delivery_distance_km),
      delivery_fee: Number(draft.delivery_fee || 0), delivery_notes: draft.delivery_notes || null,
      delivery_status: deliveryStatus, delivery_completed_at: deliveryStatus === "delivered" ? new Date().toISOString() : null,
    }).eq("id", order.id);
    if (error) { toast.error("La livraison n'a pas pu être enregistrée."); return; }
    toast.success(markDelivered ? "Livraison marquée comme terminée." : "Informations de livraison enregistrées.");
    loadOrders();
  };

  const statusClass = (status: DeliveryStatus) => {
    if (status === "delivered") return "bg-green-500/15 text-green-700 border-green-500/30";
    if (status === "cancelled") return "bg-red-500/15 text-red-700 border-red-500/30";
    if (status === "on_the_way") return "bg-blue-500/15 text-blue-700 border-blue-500/30";
    return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-foreground">Commandes et livraisons</h1><p className="text-muted-foreground mt-1">Assignez un livreur, définissez le tarif et suivez chaque commande jusqu'à la livraison.</p></div>
    {isLoading ? <p className="text-muted-foreground">Chargement des commandes...</p> : orders.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucune commande à livrer.</div> : <div className="space-y-4">
      {orders.map((order) => {
        const draft = drafts[order.id] || {};
        const deliveryStatus = (order.delivery_status || "pending") as DeliveryStatus;
        return <article key={order.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-lg">{order.customer_name || "Client"}</h2><Badge variant="outline" className={statusClass(deliveryStatus)}>{deliveryLabels[deliveryStatus]}</Badge></div>
            <p className="text-sm text-muted-foreground">Commande #{order.id.slice(0, 8)} · Paiement : {order.status || "pending"}</p>
            <p className="text-sm"><strong>Suivi :</strong> <span className="font-mono">{order.tracking_number || "Création en cours"}</span></p>
            <p className="text-sm flex gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />{order.address || "Adresse non renseignée"}{order.delivery_area ? ` — ${order.delivery_area}` : ""}</p>
            <p className="text-sm">{order.telephone || "Téléphone non renseigné"} · {Number(order.total || 0).toLocaleString("fr-FR")} FCFA</p>
            {order.delivery_latitude && order.delivery_longitude && <p className="text-xs text-green-700">Position GPS reçue du client.</p>}
          </div>{deliveryStatus === "delivered" && <p className="flex items-center gap-2 text-sm font-medium text-green-700"><CheckCircle2 className="w-4 h-4" />Terminée le {new Date(order.delivery_completed_at || order.delivery_updated_at).toLocaleString("fr-FR")}</p>}</div>
          <div className="grid gap-4 mt-5 pt-5 border-t border-border md:grid-cols-2 xl:grid-cols-4">
            <div><Label>Livreur</Label><Input className="mt-1" value={draft.courier_name || ""} onChange={(e) => updateDraft(order.id, "courier_name", e.target.value)} placeholder="Nom du livreur" /></div>
            <div><Label>Téléphone livreur</Label><Input className="mt-1" value={draft.courier_phone || ""} onChange={(e) => updateDraft(order.id, "courier_phone", e.target.value)} placeholder="Ex. +226 ..." /></div>
            <div><Label>Distance (km)</Label><Input className="mt-1" type="number" min="0" step="0.1" value={draft.delivery_distance_km || ""} onChange={(e) => updateDraft(order.id, "delivery_distance_km", e.target.value)} placeholder="À calculer" /></div>
            <div><Label>Tarif livraison (FCFA)</Label><Input className="mt-1" type="number" min="0" value={draft.delivery_fee || "0"} onChange={(e) => updateDraft(order.id, "delivery_fee", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Statut de livraison</Label><select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.delivery_status || "pending"} onChange={(e) => updateDraft(order.id, "delivery_status", e.target.value)}>{(Object.keys(deliveryLabels) as DeliveryStatus[]).map((status) => <option key={status} value={status}>{deliveryLabels[status]}</option>)}</select></div>
            <div className="md:col-span-2"><Label>Note de suivi</Label><Input className="mt-1" value={draft.delivery_notes || ""} onChange={(e) => updateDraft(order.id, "delivery_notes", e.target.value)} placeholder="Ex. client appelé, arrivée prévue à 14 h" /></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5"><Button onClick={() => saveDelivery(order)} className="gap-2"><Truck className="w-4 h-4" />Enregistrer le suivi</Button>{deliveryStatus !== "delivered" && <Button variant="outline" onClick={() => saveDelivery(order, true)} className="gap-2"><PackageCheck className="w-4 h-4" />Livraison terminée</Button>}</div>
        </article>;
      })}
    </div>}
  </div>;
};

export default AdminOrders;
