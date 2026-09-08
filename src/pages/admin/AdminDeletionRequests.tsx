import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";

type RequestRow = { id: string; target_name: string; target_email: string | null; country_id: number | null; request_kind: "self" | "partner"; reason: string; status: string; created_at: string };
type PartnerAccount = { id: string; nom: string | null; email: string | null; telephone: string | null; organization_name: string | null; country_id: number | null };

const AdminDeletionRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [accounts, setAccounts] = useState<PartnerAccount[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [isMarketing, setIsMarketing] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const invoke = async (action: string, params: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("manage-users", { body: { action, ...params } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const load = async () => {
    setLoading(true);
    try {
      const context = await invoke("auth_context");
      const review = Boolean(context.can_review_account_deletions);
      const marketing = Boolean(context.is_marketing_director);
      setCanReview(review);
      setIsMarketing(marketing);
      const [requestsData, accountsData] = await Promise.all([
        invoke("list_deletion_requests"),
        invoke("list_partner_accounts_for_deletion"),
      ]);
      setRequests(requestsData.requests || []);
      setAccounts(accountsData.accounts || []);
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Chargement impossible", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const requestDeletion = async () => {
    if (!targetId || reason.trim().length < 5) {
      toast({ title: "Informations incomplètes", description: "Choisissez un compte et indiquez un motif précis.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await invoke("request_deletion", { userId: targetId, reason });
      toast({ title: "Demande envoyée", description: "Le PDG/Admin Albarka doit maintenant l'approuver." });
      setTargetId(""); setReason(""); await load();
    } catch (error: any) {
      toast({ title: "Demande impossible", description: error?.message || "Erreur inconnue", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const review = async (requestId: string, decision: "approve" | "reject") => {
    const message = decision === "approve" ? "Approuver et supprimer définitivement ce compte ?" : "Refuser cette demande ?";
    if (!window.confirm(message)) return;
    setSaving(true);
    try {
      await invoke("review_deletion_request", { requestId, decision });
      toast({ title: decision === "approve" ? "Compte supprimé" : "Demande refusée" });
      await load();
    } catch (error: any) {
      toast({ title: "Action impossible", description: error?.message || "Erreur inconnue", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;

  return <div className="space-y-6 p-4 md:p-6">
    <div><h1 className="text-2xl font-bold">Demandes de suppression</h1><p className="text-muted-foreground">Contrôle centralisé des comptes partenaires, par pays ou en vue internationale.</p></div>
    {(isMarketing || canReview) && <section className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" /><h2 className="font-semibold">Nouvelle demande partenaire</h2></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Compte partenaire</Label><Select value={targetId} onValueChange={setTargetId}><SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger><SelectContent>{accounts.map(account => <SelectItem key={account.id} value={account.id}>{account.nom || account.email || account.telephone} — {account.organization_name || "Partenaire"}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Motif</Label><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={reason} onChange={event => setReason(event.target.value)} placeholder="Expliquez la raison de la demande" /></div>
      </div>
      <Button onClick={requestDeletion} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Envoyer au PDG</Button>
    </section>}
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="border-b p-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5" /><h2 className="font-semibold">Historique des demandes</h2>{canReview && <Badge>Vue internationale</Badge>}</div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Compte</th><th className="p-3">Type</th><th className="p-3">Motif</th><th className="p-3">État</th><th className="p-3 text-right">Décision</th></tr></thead><tbody>{requests.map(row => <tr key={row.id} className="border-b last:border-0"><td className="p-3"><div className="font-medium">{row.target_name}</div><div className="text-muted-foreground">{row.target_email || "—"}</div></td><td className="p-3">{row.request_kind === "self" ? "Auto-demande" : "Partenaire"}</td><td className="p-3 max-w-md">{row.reason}</td><td className="p-3"><Badge variant={row.status === "pending" ? "secondary" : "outline"}>{row.status}</Badge></td><td className="p-3"><div className="flex justify-end gap-2">{canReview && row.status === "pending" && <><Button size="sm" variant="outline" onClick={() => void review(row.id, "reject")}>Refuser</Button><Button size="sm" variant="destructive" onClick={() => void review(row.id, "approve")}>Approuver</Button></>}</div></td></tr>)}{requests.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucune demande.</td></tr>}</tbody></table></div>
    </section>
  </div>;
};

export default AdminDeletionRequests;
