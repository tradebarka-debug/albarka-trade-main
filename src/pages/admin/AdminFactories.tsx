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

const defaultForm = { company_name: "", category: "Usine", country: "Burkina Faso", city: "", email: "", telephone: "", whatsapp: "", website: "", description: "", logo: "", status: "active", certified: false, scope: "local" as "local" | "international" };
type FactoryForm = typeof defaultForm;
type FactoryRow = FactoryForm & { id: number; created_at: string };
const factoriesTable = supabase.from("factories" as any) as any;

const AdminFactories = () => {
  const [factories, setFactories] = useState<FactoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FactoryForm>(defaultForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<"all" | "local" | "international">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFactories = async () => {
    setLoading(true);
    const { data, error } = await factoriesTable.select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Impossible de charger les usines"); }
    else setFactories(data ?? []);
    setLoading(false);
  };
  useEffect(() => { void loadFactories(); }, []);

  const resetForm = () => {
    setEditingId(null); setForm(defaultForm); setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const closeDialog = () => { setDialogOpen(false); resetForm(); };
  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (factory: FactoryRow) => {
    setEditingId(factory.id);
    setForm({ company_name: factory.company_name ?? "", category: factory.category ?? "Usine", country: factory.country ?? "Burkina Faso", city: factory.city ?? "", email: factory.email ?? "", telephone: factory.telephone ?? "", whatsapp: factory.whatsapp ?? "", website: factory.website ?? "", description: factory.description ?? "", logo: factory.logo ?? "", status: factory.status ?? "active", certified: factory.certified ?? false, scope: (factory as any).scope === "international" ? "international" : "local" });
    setImageFile(null); setImagePreview(factory.logo || null); setDialogOpen(true);
  };
  const update = <K extends keyof FactoryForm>(key: K, value: FactoryForm[K]) => setForm((current) => ({ ...current, [key]: value }));
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
    const path = `factories/${uniqueName}.${extension}`;
    const { error } = await supabase.storage.from("factory-logos").upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("factory-logos").getPublicUrl(path).data.publicUrl;
  };
  const saveFactory = async () => {
    if (!form.company_name.trim()) { toast.error("Le nom de l’usine est obligatoire"); return; }
    setSaving(true);
    try {
      const logo = imageFile ? await uploadImage(imageFile) : form.logo;
      const payload = { company_name: form.company_name.trim(), category: "Usine", country: form.country.trim(), city: form.city.trim(), email: form.email.trim(), telephone: form.telephone.trim(), whatsapp: form.whatsapp.trim(), website: form.website.trim(), description: form.description.trim(), logo, status: form.status, certified: form.certified, scope: form.scope };
      const { error } = editingId ? await factoriesTable.update(payload).eq("id", editingId) : await factoriesTable.insert(payload);
      if (error) throw error;
      toast.success(editingId ? "Usine modifiée" : "Usine ajoutée"); closeDialog(); void loadFactories();
    } catch (error) {
      console.error(error);
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Erreur lors de la sauvegarde de l’usine";
      toast.error(message);
    }
    finally { setSaving(false); }
  };
  const deleteFactory = async (id: number) => {
    if (!window.confirm("Supprimer cette usine ?")) return;
    const { error } = await factoriesTable.delete().eq("id", id);
    if (error) { toast.error("Suppression impossible"); return; }
    toast.success("Usine supprimée"); void loadFactories();
  };
  const factoryCount = useMemo(() => factories.length, [factories]);
  const filteredFactories = useMemo(() => scopeFilter === "all" ? factories : factories.filter((factory) => ((factory as any).scope ?? "local") === scopeFilter), [factories, scopeFilter]);

  return <div className="space-y-6 p-6 md:p-8">
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><CardTitle>Usines partenaires</CardTitle><p className="text-sm text-muted-foreground">{filteredFactories.length} / {factoryCount} usine(s) enregistrée(s)</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <button type="button" onClick={() => setScopeFilter("all")} className={`rounded-md px-3 py-1.5 text-sm ${scopeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Toutes</button>
            <button type="button" onClick={() => setScopeFilter("local")} className={`rounded-md px-3 py-1.5 text-sm ${scopeFilter === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Locales</button>
            <button type="button" onClick={() => setScopeFilter("international")} className={`rounded-md px-3 py-1.5 text-sm ${scopeFilter === "international" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Internationales</button>
          </div>
          <Button onClick={openCreate}>Ajouter une usine</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Chargement…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="p-2">Entreprise</th><th className="p-2">Catégorie</th><th className="p-2">Pays / Ville</th><th className="p-2">Portée</th><th className="p-2">Contact</th><th className="p-2">Statut</th><th className="p-2 text-right">Actions</th></tr></thead>
              <tbody>
                {filteredFactories.map((factory) => (
                  <tr key={factory.id} className="border-b align-top">
                    <td className="p-2 font-medium">{factory.company_name}</td>
                    <td className="p-2">{factory.category}</td>
                    <td className="p-2">{factory.country} / {factory.city}</td>
                    <td className="p-2">{(factory as any).scope === "international" ? "🌍 International" : "📍 Local"}</td>
                    <td className="p-2"><div>{factory.telephone}</div><div>{factory.email}</div></td>
                    <td className="p-2"><div>{factory.status === "active" ? "Public" : "Masqué"}</div>{factory.certified && <span className="font-semibold text-yellow-500">✓ Certifié</span>}</td>
                    <td className="space-x-2 p-2 text-right"><Button variant="outline" size="sm" onClick={() => openEdit(factory)}>Modifier</Button><Button variant="destructive" size="sm" onClick={() => void deleteFactory(factory.id)}>Supprimer</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{editingId ? "Modifier l’usine" : "Ajouter une usine"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Entreprise *"><Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} /></Field>
          <Field label="Catégorie"><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></Field>
          <Field label="Pays"><Input value={form.country} onChange={(e) => update("country", e.target.value)} /></Field>
          <Field label="Ville"><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="Téléphone"><Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} /></Field>
          <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Site web"><Input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} /></Field>
          <Field label="Portée" className="md:col-span-2">
            <div className="flex rounded-lg border p-1 w-fit">
              <button type="button" onClick={() => update("scope", "local")} className={`rounded-md px-4 py-1.5 text-sm ${form.scope === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>📍 Local</button>
              <button type="button" onClick={() => update("scope", "international")} className={`rounded-md px-4 py-1.5 text-sm ${form.scope === "international" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>🌍 International</button>
            </div>
          </Field>
          <div className="space-y-2 md:col-span-2">
            <Label>Logo de l’usine</Label>
            {imagePreview ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                <img src={imagePreview} alt="Aperçu du logo" className="h-full w-full object-contain" />
                <Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2" onClick={removeImage}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary">
                <ImageIcon className="mb-2 h-9 w-9" /><span className="text-xs">JPG, PNG, WebP<br />5 Mo maximum</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectImage} />
          </div>
          <Field label="Description" className="md:col-span-2"><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} /></Field>
          <Toggle label="Certifiée" description="Affiche un badge de certification" checked={form.certified} onChange={(checked) => update("certified", checked)} />
          <Toggle label="Visible côté public" description="Cette usine sera affichée sur la page publique" checked={form.status === "active"} onChange={(checked) => update("status", checked ? "active" : "hidden")} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={closeDialog}>Annuler</Button>
          <Button onClick={() => void saveFactory()} disabled={saving}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
};
const Field = ({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) => <div className={`space-y-2 ${className ?? ""}`}><Label>{label}</Label>{children}</div>;
const Toggle = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) => <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2"><div><Label>{label}</Label><p className="text-sm text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} /></div>;
export default AdminFactories;
