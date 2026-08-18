import { useEffect, useRef, useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emptySupplier = { company_name: "", country: "Burkina Faso", city: "", location_details: "", categories: "", description: "", telephone: "", whatsapp: "", email: "", website: "", catalog_url: "", commercial_terms: "", logo: "", status: "active", certified: false, partner_status: "partner", scope: "local" };

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptySupplier);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const table = supabase.from("suppliers") as any;

  const load = async () => { const { data, error } = await table.select("*").order("created_at", { ascending: false }); if (error) toast.error("Impossible de charger les fournisseurs"); else setSuppliers(data || []); };
  useEffect(() => { void load(); }, []);
  const set = (key: string, value: any) => setForm((old: any) => ({ ...old, [key]: value }));
  const close = () => { setOpen(false); setEditingId(null); setForm(emptySupplier); setImageFile(null); setPreview(null); if (fileInput.current) fileInput.current.value = ""; };
  const create = () => { close(); setOpen(true); };
  const edit = (supplier: any) => { setEditingId(supplier.id); setForm({ ...emptySupplier, ...supplier }); setPreview(supplier.logo || null); setImageFile(null); setOpen(true); };
  const selectLogo = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { toast.error("Choisissez une image de 5 Mo maximum"); return; } setImageFile(file); setPreview(URL.createObjectURL(file)); };
  const uploadLogo = async (file: File) => { const ext = file.name.split(".").pop() || "png"; const path = `suppliers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`; const { error } = await supabase.storage.from("supplier-logos").upload(path, file, { contentType: file.type }); if (error) throw error; return supabase.storage.from("supplier-logos").getPublicUrl(path).data.publicUrl; };
  const save = async () => {
    if (!form.company_name.trim()) { toast.error("Le nom de l'entreprise est obligatoire"); return; }
    setSaving(true);
    try {
      const logo = imageFile ? await uploadLogo(imageFile) : form.logo;
      const payload = { ...form, company_name: form.company_name.trim(), logo, category: "Fournisseur" };
      delete payload.id; delete payload.created_at; delete payload.country_id;
      const { error } = editingId ? await table.update(payload).eq("id", editingId) : await table.insert(payload);
      if (error) throw error;
      toast.success(editingId ? "Vitrine fournisseur modifiée" : "Fournisseur ajouté"); close(); void load();
    } catch (error: any) { toast.error(error?.message || "Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  };
  const remove = async (id: number) => { if (!window.confirm("Supprimer ce fournisseur et sa vitrine ?")) return; const { error } = await table.delete().eq("id", id); if (error) toast.error("Suppression impossible"); else { toast.success("Fournisseur supprimé"); void load(); } };

  return <div className="space-y-6 p-6 md:p-8">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold">Vitrines fournisseurs</h1><p className="text-muted-foreground">Entreprise, catalogue, coordonnées et conditions commerciales.</p></div><Button onClick={create}><Plus className="mr-2 h-4 w-4" />Ajouter un fournisseur</Button></div>
    <Card><CardHeader><CardTitle>{suppliers.length} fournisseur(s)</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Entreprise</th><th className="p-3">Pays / localisation</th><th className="p-3">Catégories</th><th className="p-3">Statut</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id} className="border-b"><td className="p-3"><div className="flex items-center gap-3">{supplier.logo ? <img src={supplier.logo} alt="" className="h-10 w-10 rounded object-contain" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}<div><p className="font-medium">{supplier.company_name}</p><p className="text-xs text-muted-foreground">{supplier.telephone || supplier.email || "Sans coordonnées"}</p></div></div></td><td className="p-3">{supplier.country || "-"}<br /><span className="text-muted-foreground">{supplier.city || supplier.location_details || "-"}</span></td><td className="p-3">{supplier.categories || "-"}</td><td className="p-3"><p>{supplier.status === "active" ? "Public" : "Masqué"}</p><p className="text-xs text-primary">{supplier.partner_status || "partner"}{supplier.certified ? " · Certifié" : ""}</p></td><td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => edit(supplier)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => void remove(supplier.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table>{suppliers.length === 0 && <p className="p-8 text-center text-muted-foreground">Aucun fournisseur enregistré.</p>}</div></CardContent></Card>
    <Dialog open={open} onOpenChange={(value) => value ? setOpen(true) : close()}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Modifier la vitrine" : "Nouvelle vitrine fournisseur"}</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2">
      <Field label="Entreprise *"><Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} /></Field><Field label="Pays"><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></Field><Field label="Ville / zone"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field><Field label="Localisation détaillée"><Input value={form.location_details} onChange={(e) => set("location_details", e.target.value)} placeholder="Quartier, rue, repère" /></Field><Field label="Catégories"><Input value={form.categories} onChange={(e) => set("categories", e.target.value)} placeholder="Ex. Riz, boissons, emballages" /></Field><Field label="Statut partenaire"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.partner_status} onChange={(e) => set("partner_status", e.target.value)}><option value="partner">Partenaire</option><option value="verified">Vérifié</option><option value="premium">Premium</option></select></Field>
      <Field label="Téléphone"><Input value={form.telephone} onChange={(e) => set("telephone", e.target.value)} /></Field><Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field><Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field><Field label="Site web"><Input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} /></Field><Field label="Lien catalogue (optionnel)" className="md:col-span-2"><Input type="url" value={form.catalog_url} onChange={(e) => set("catalog_url", e.target.value)} placeholder="https://..." /></Field>
      <div className="space-y-2 md:col-span-2"><Label>Logo</Label>{preview ? <div className="relative h-28 w-28 overflow-hidden rounded-lg border"><img src={preview} alt="Aperçu" className="h-full w-full object-contain" /><Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => { setImageFile(null); setPreview(null); set("logo", ""); }}><X className="h-3 w-3" /></Button></div> : <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}><ImageIcon className="mr-2 h-4 w-4" />Télécharger un logo</Button>}<input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={selectLogo} /></div>
      <Field label="Présentation de l'entreprise" className="md:col-span-2"><Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field><Field label="Conditions commerciales" className="md:col-span-2"><Textarea rows={3} value={form.commercial_terms} onChange={(e) => set("commercial_terms", e.target.value)} placeholder="Minimum de commande, délais, zones desservies, modalités de paiement..." /></Field>
      <Toggle label="Visible publiquement" checked={form.status === "active"} onChange={(checked) => set("status", checked ? "active" : "inactive")} /><Toggle label="Fournisseur certifié" checked={form.certified} onChange={(checked) => set("certified", checked)} />
    </div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={close}>Annuler</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Sauvegarde..." : "Sauvegarder"}</Button></div></DialogContent></Dialog>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}</div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between rounded-lg border p-3"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>; }
