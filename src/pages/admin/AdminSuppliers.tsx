import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const defaultForm = { company_name: "", category: "Fournisseur", country: "Burkina Faso", city: "", email: "", telephone: "", whatsapp: "", website: "", description: "", logo: "", status: "active", certified: false };
type SupplierForm = typeof defaultForm;
type SupplierRow = SupplierForm & { id: number; created_at: string };
const suppliersTable = supabase.from("suppliers") as any;

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierForm>(defaultForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data, error } = await suppliersTable.select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Impossible de charger les fournisseurs"); }
    else setSuppliers(data ?? []);
    setLoading(false);
  };
  useEffect(() => { void loadSuppliers(); }, []);

  const resetForm = () => {
    setEditingId(null); setForm(defaultForm); setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const closeDialog = () => { setDialogOpen(false); resetForm(); };
  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (supplier: SupplierRow) => {
    setEditingId(supplier.id);
    setForm({ company_name: supplier.company_name ?? "", category: supplier.category ?? "Fournisseur", country: supplier.country ?? "Burkina Faso", city: supplier.city ?? "", email: supplier.email ?? "", telephone: supplier.telephone ?? "", whatsapp: supplier.whatsapp ?? "", website: supplier.website ?? "", description: supplier.description ?? "", logo: supplier.logo ?? "", status: supplier.status ?? "active", certified: supplier.certified ?? false });
    setImageFile(null); setImagePreview(supplier.logo || null); setDialogOpen(true);
  };
  const update = <K extends keyof SupplierForm>(key: K, value: SupplierForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum"); event.target.value = ""; return; }
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };
  const removeImage = () => { setImageFile(null); setImagePreview(null); update("logo", ""); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const uploadImage = async (file: File) => {
    const extension = file.name.split(".").pop() || "png";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const path = `suppliers/${uniqueName}.${extension}`;
    const { error } = await supabase.storage.from("supplier-logos").upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("supplier-logos").getPublicUrl(path).data.publicUrl;
  };
  const saveSupplier = async () => {
    if (!form.company_name.trim()) { toast.error("Le nom de l’entreprise est obligatoire"); return; }
    setSaving(true);
    try {
      const logo = imageFile ? await uploadImage(imageFile) : form.logo;
      const payload = { company_name: form.company_name.trim(), category: "Fournisseur", country: form.country.trim(), city: form.city.trim(), email: form.email.trim(), telephone: form.telephone.trim(), whatsapp: form.whatsapp.trim(), website: form.website.trim(), description: form.description.trim(), logo, status: form.status, certified: form.certified };
      const { error } = editingId ? await suppliersTable.update(payload).eq("id", editingId) : await suppliersTable.insert(payload);
      if (error) throw error;
      toast.success(editingId ? "Fournisseur modifié" : "Fournisseur ajouté"); closeDialog(); void loadSuppliers();
    } catch (error) {
      console.error(error);
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Erreur lors de la sauvegarde du fournisseur";
      toast.error(message);
    }
    finally { setSaving(false); }
  };
  const deleteSupplier = async (id: number) => {
    if (!window.confirm("Supprimer ce fournisseur ?")) return;
    const { error } = await suppliersTable.delete().eq("id", id);
    if (error) { toast.error("Suppression impossible"); return; }
    toast.success("Fournisseur supprimé"); void loadSuppliers();
  };
  const supplierCount = useMemo(() => suppliers.length, [suppliers]);

  return <div className="space-y-6 p-6 md:p-8"><Card><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle>Gestion des fournisseurs</CardTitle><p className="text-sm text-muted-foreground">{supplierCount} fournisseur(s) enregistré(s)</p></div><Button onClick={openCreate}>Ajouter un fournisseur</Button></CardHeader><CardContent>{loading ? <p className="text-muted-foreground">Chargement…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Entreprise</th><th className="p-2">Catégorie</th><th className="p-2">Pays / Ville</th><th className="p-2">Contact</th><th className="p-2">Statut</th><th className="p-2 text-right">Actions</th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id} className="border-b align-top"><td className="p-2 font-medium">{supplier.company_name}</td><td className="p-2">{supplier.category}</td><td className="p-2">{supplier.country} / {supplier.city}</td><td className="p-2"><div>{supplier.telephone}</div><div>{supplier.email}</div></td><td className="p-2"><div>{supplier.status === "active" ? "Public" : "Masqué"}</div>{supplier.certified && <span className="font-semibold text-yellow-500">✓ Certifié</span>}</td><td className="space-x-2 p-2 text-right"><Button variant="outline" size="sm" onClick={() => openEdit(supplier)}>Modifier</Button><Button variant="destructive" size="sm" onClick={() => void deleteSupplier(supplier.id)}>Supprimer</Button></td></tr>)}</tbody></table></div>}</CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : closeDialog()}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Entreprise *"><Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} /></Field><Field label="Catégorie"><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></Field><Field label="Pays"><Input value={form.country} onChange={(e) => update("country", e.target.value)} /></Field><Field label="Ville"><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></Field><Field label="Téléphone"><Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} /></Field><Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} /></Field><Field label="Email"><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field><Field label="Site web"><Input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} /></Field><div className="space-y-2 md:col-span-2"><Label>Logo du fournisseur</Label>{imagePreview ? <div className="relative h-32 w-32 overflow-hidden rounded-lg border"><img src={imagePreview} alt="Aperçu du logo" className="h-full w-full object-contain" /><Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2" onClick={removeImage}><X className="h-4 w-4" /></Button></div> : <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary"><ImageIcon className="mb-2 h-9 w-9" /><span className="text-xs">JPG, PNG, WebP<br />5 Mo maximum</span></button>}<input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectImage} /></div><Field label="Description" className="md:col-span-2"><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} /></Field><Toggle label="Statut public" description="Visible sur la page fournisseurs" checked={form.status === "active"} onChange={(checked) => update("status", checked ? "active" : "inactive")} /><Toggle label="Fournisseur certifié" description="Afficher le badge certifié sur la page fournisseurs" checked={form.certified} onChange={(checked) => update("certified", checked)} /></div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={closeDialog} disabled={saving}>Annuler</Button><Button onClick={() => void saveSupplier()} disabled={saving}>{saving ? "Sauvegarde…" : "Sauvegarder"}</Button></div></DialogContent></Dialog>
  </div>;
};
const Field = ({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) => <div className={`space-y-2 ${className ?? ""}`}><Label>{label}</Label>{children}</div>;
const Toggle = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) => <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2"><div><Label>{label}</Label><p className="text-sm text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} /></div>;
export default AdminSuppliers;
