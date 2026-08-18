import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Factory = { id: number; company_name: string };
type FactoryProduct = {
  id: number; factory_id: number; name: string; category: string | null; price: number;
  unit: string | null; description: string | null; image: string | null; in_stock: boolean;
  stock_quantity: number; status: "active" | "hidden";
};
const emptyForm = { name: "", category: "", price: "", unit: "", description: "", in_stock: true, stock_quantity: "0", status: "active" as "active" | "hidden" };
const factoryProductsTable = supabase.from("factory_products" as any) as any;

export default function AdminFactoryProducts() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [products, setProducts] = useState<FactoryProduct[]>([]);
  const [factoryId, setFactoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FactoryProduct | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFactories = async () => {
    const { data, error } = await (supabase.from("factories" as any) as any).select("id, company_name").order("company_name");
    if (error) toast.error("Impossible de charger les usines");
    else setFactories(data ?? []);
  };
  const loadProducts = async () => {
    setLoading(true);
    const query = factoryProductsTable.select("*").order("created_at", { ascending: false });
    const { data, error } = factoryId ? await query.eq("factory_id", Number(factoryId)) : await query;
    if (error) toast.error("Impossible de charger les produits des usines");
    else setProducts(data ?? []);
    setLoading(false);
  };
  useEffect(() => { void loadFactories(); }, []);
  useEffect(() => { void loadProducts(); }, [factoryId]);

  const resetDialog = () => {
    setEditingProduct(null); setForm(emptyForm); setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const openCreate = () => {
    if (!factoryId) { toast.error("Sélectionnez d’abord une usine partenaire"); return; }
    resetDialog(); setDialogOpen(true);
  };
  const openEdit = (product: FactoryProduct) => {
    setEditingProduct(product);
    setForm({ name: product.name, category: product.category ?? "", price: String(product.price), unit: product.unit ?? "", description: product.description ?? "", in_stock: product.in_stock, stock_quantity: String(product.stock_quantity), status: product.status ?? "active" });
    setImageFile(null); setImagePreview(product.image); setDialogOpen(true);
  };
  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum"); event.target.value = ""; return;
    }
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };
  const removeImage = () => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const uploadImage = async (file: File) => {
    const extension = file.name.split(".").pop() || "png";
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const { error } = await supabase.storage.from("factory-products").upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("factory-products").getPublicUrl(path).data.publicUrl;
  };
  const saveProduct = async () => {
    if (!factoryId || !form.name.trim() || !form.price) { toast.error("L’usine, le nom et le prix sont obligatoires"); return; }
    setSaving(true);
    try {
      const image = imageFile ? await uploadImage(imageFile) : imagePreview;
      const payload = { factory_id: Number(factoryId), name: form.name.trim(), category: form.category.trim() || null, price: Number(form.price), unit: form.unit.trim() || null, description: form.description.trim() || null, image, in_stock: form.in_stock, stock_quantity: Number(form.stock_quantity) || 0, status: form.status };
      const { error } = editingProduct ? await factoryProductsTable.update(payload).eq("id", editingProduct.id) : await factoryProductsTable.insert(payload);
      if (error) throw error;
      toast.success(editingProduct ? "Produit modifié" : "Produit ajouté");
      setDialogOpen(false); resetDialog(); void loadProducts();
    } catch (error) {
      console.error(error); toast.error("Erreur lors de la sauvegarde du produit");
    } finally { setSaving(false); }
  };
  const deleteProduct = async (id: number) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    const { error } = await factoryProductsTable.delete().eq("id", id);
    if (error) { toast.error("Suppression impossible"); return; }
    toast.success("Produit supprimé"); void loadProducts();
  };
  const factoryName = (id: number) => factories.find((factory) => factory.id === id)?.company_name ?? "Usine inconnue";
  const formatPrice = (price: number) => `${new Intl.NumberFormat("fr-FR").format(price)} FCFA`;

  return <div className="space-y-6 p-6 md:p-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><h1 className="text-3xl font-display font-bold">Produits des usines</h1><p className="text-muted-foreground">Ajoutez et gérez les produits proposés par chaque usine partenaire.</p></div>
      <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Ajouter un produit</Button>
    </div>
    <Card><CardHeader><CardTitle className="text-base">Usine partenaire</CardTitle></CardHeader><CardContent>
      <select value={factoryId} onChange={(event) => setFactoryId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:max-w-md">
        <option value="">Toutes les usines</option>
        {factories.map((factory) => <option key={factory.id} value={factory.id}>{factory.company_name}</option>)}
      </select>
    </CardContent></Card>
    <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b text-left"><th className="p-3">Produit</th><th className="p-3">Usine</th><th className="p-3">Catégorie</th><th className="p-3">Prix</th><th className="p-3">Stock</th><th className="p-3">Visibilité</th><th className="p-3 text-right">Actions</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Chargement…</td></tr> : products.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun produit enregistré.</td></tr> : products.map((product) => <tr key={product.id} className="border-b align-middle">
        <td className="p-3"><div className="flex items-center gap-3">{product.image ? <img src={product.image} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-muted"><ImageIcon className="h-4 w-4" /></div>}<div><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.unit || "-"}</p></div></div></td>
        <td className="p-3">{factoryName(product.factory_id)}</td><td className="p-3">{product.category || "-"}</td><td className="p-3 font-medium">{formatPrice(product.price)}</td><td className="p-3">{product.in_stock ? `${product.stock_quantity} disponible(s)` : "Rupture"}</td><td className="p-3">{product.status === "active" ? "Public" : "Masqué"}</td>
        <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => void deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button></td>
      </tr>)}</tbody>
    </table></div></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDialog(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle></DialogHeader><div className="space-y-4">
      <div className="space-y-2"><Label>Image du produit</Label>{imagePreview ? <div className="relative h-40 overflow-hidden rounded-lg border"><img src={imagePreview} alt="Aperçu" className="h-full w-full object-cover" /><Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2" onClick={removeImage}><X className="h-4 w-4" /></Button></div> : <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary"><ImageIcon className="mb-2 h-7 w-7" /><span className="text-sm">Télécharger une image</span><span className="text-xs">JPG, PNG, WebP — 5 Mo maximum</span></button>}<input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectImage} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Nom du produit *"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Catégorie"><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field><Field label="Prix (FCFA) *"><Input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field><Field label="Unité"><Input value={form.unit} placeholder="Ex. sac de 25 kg" onChange={(event) => setForm({ ...form, unit: event.target.value })} /></Field><Field label="Quantité en stock"><Input type="number" min="0" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} /></Field></div>
      <Field label="Description"><Textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><div className="flex items-center justify-between rounded-lg border p-3"><Label>En stock</Label><Switch checked={form.in_stock} onCheckedChange={(checked) => setForm({ ...form, in_stock: checked })} /></div><div className="flex items-center justify-between rounded-lg border p-3"><div><Label>Visible côté public</Label><p className="text-sm text-muted-foreground">Le produit sera affiché lorsqu’il est public.</p></div><Switch checked={form.status === "active"} onCheckedChange={(checked) => setForm({ ...form, status: checked ? "active" : "hidden" })} /></div>
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button><Button onClick={() => void saveProduct()} disabled={saving}>{saving && <Upload className="mr-2 h-4 w-4 animate-pulse" />}{editingProduct ? "Modifier" : "Ajouter"}</Button></div>
    </div></DialogContent></Dialog>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
