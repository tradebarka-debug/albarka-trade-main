import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const labels: Record<string, string> = { restaurant: "Restaurant", commercial: "Commercial", courier: "Livreur", representative: "Représentant" };
export default function AdminPartnerApplications() {
  const [items, setItems] = useState<any[]>([]); const [notes, setNotes] = useState<Record<string, string>>({});
  const load = async () => { const { data, error } = await (supabase.from("partner_applications") as any).select("*").order("created_at", { ascending: false }); if (error) toast.error("Impossible de charger les demandes"); else setItems(data || []); };
  useEffect(() => { void load(); }, []);
  const review = async (item: any, status: "approved" | "rejected") => { const { error } = await (supabase.from("partner_applications") as any).update({ status, admin_notes: notes[item.id] || null }).eq("id", item.id); if (error) { toast.error("Mise à jour impossible"); return; } toast.success(status === "approved" ? "Demande validée et code créé." : "Demande refusée."); void load(); };
  return <div className="space-y-6 p-6 md:p-8"><div><h1 className="text-3xl font-bold">Demandes partenaires</h1><p className="text-muted-foreground">Validez les restaurants, commerciaux, livreurs et représentants.</p></div><div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="outline">{labels[item.application_type]}</Badge><h2 className="mt-2 text-lg font-semibold">{item.company_name || item.full_name}</h2><p className="text-sm text-muted-foreground">{item.full_name} · {item.phone} · {[item.city, item.country].filter(Boolean).join(", ")}</p></div><Badge className={item.status === "approved" ? "bg-green-600" : item.status === "rejected" ? "bg-red-600" : "bg-amber-500"}>{item.status}</Badge></div><p className="mt-4 whitespace-pre-line text-sm">{item.message || "Sans message"}</p>{item.referral_code && <p className="mt-2 text-sm">Parrainage : <strong>{item.referral_code}</strong></p>}{item.partner_code && <p className="mt-2 text-sm text-primary">Code partenaire : <strong>{item.partner_code}</strong></p>}<Textarea className="mt-4" value={notes[item.id] || item.admin_notes || ""} onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })} placeholder="Note interne / réponse" />{item.status === "pending" && <div className="mt-4 flex gap-2"><Button onClick={() => void review(item, "approved")} className="gap-2"><Check className="h-4 w-4" />Valider</Button><Button variant="destructive" onClick={() => void review(item, "rejected")} className="gap-2"><X className="h-4 w-4" />Refuser</Button></div>}</article>)}{items.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Aucune demande.</p>}</div></div>;
}
