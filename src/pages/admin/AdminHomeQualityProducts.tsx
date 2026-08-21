import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, Pencil, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  { id: 1, name: "Burkina Faso" },
  { id: 2, name: "Côte d'Ivoire" },
];

type EditForm = { name: string; category: string; price: string; unit: string; description: string };

export default function AdminHomeQualityProducts() {
  const [countryId, setCountryId] = useState("1");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<EditForm>({ name: "", category: "", price: "", unit: "", description: "" });
  const { toast } = useToast();

  const featuredCount = useMemo(() => products.filter((product) => product.is_home_featured).length, [products]);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("country_id", Number(countryId))
      .order("is_home_featured", { ascending: false })
      .order("home_sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) toast({ title: "Erreur", description: "Impossible de charger les produits de ce pays.", variant: "destructive" });
    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, [countryId]);

  const toggleFeatured = async (product: Product, checked: boolean) => {
    if (checked && featuredCount >= 5) {
      toast({ title: "Limite atteinte", description: "Vous pouvez afficher au maximum 5 produits par pays.", variant: "destructive" });
      return;
    }

    setSavingId(product.id);
    const nextOrder = checked
      ? Math.max(0, ...products.filter((item) => item.is_home_featured).map((item) => item.home_sort_order || 0)) + 1
      : null;
    const { error } = await supabase.from("products").update({ is_home_featured: checked, home_sort_order: nextOrder }).eq("id", product.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, is_home_featured: checked, home_sort_order: nextOrder } : item));
      toast({ title: checked ? "Produit ajouté à l'accueil" : "Produit retiré de l'accueil" });
    }
    setSavingId(null);
  };

  const changeOrder = async (product: Product, order: string) => {
    const value = Math.min(5, Math.max(1, Number(order) || 1));
    setSavingId(product.id);
    const { error } = await supabase.from("products").update({ home_sort_order: value }).eq("id", product.id);
    if (!error) setProducts((current) => current.map((item) => item.id === product.id ? { ...item, home_sort_order: value } : item));
    else toast({ title: "Erreur", description: error.message, variant: "destructive" });
    setSavingId(null);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({ name: product.name, category: product.category || "", price: String(product.price), unit: product.unit || "", description: product.description || "" });
  };

  const saveProduct = async () => {
    if (!editing || !form.name.trim() || !form.price) return;
    setSavingId(editing.id);
    const changes = { name: form.name.trim(), category: form.category.trim(), price: Number(form.price), unit: form.unit.trim() || null, description: form.description.trim() || null };
    const { error } = await supabase.from("products").update(changes).eq("id", editing.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setProducts((current) => current.map((item) => item.id === editing.id ? { ...item, ...changes } : item));
      setEditing(null);
      toast({ title: "Produit mis à jour" });
    }
    setSavingId(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold">Nos produits de qualité</h1>
          <p className="mt-1 text-muted-foreground">Choisissez et modifiez les produits présentés sur la page d'accueil.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <div className="w-full sm:w-64"><Label>Pays à administrer</Label><Select value={countryId} onValueChange={setCountryId}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{COUNTRIES.map((country) => <SelectItem key={country.id} value={String(country.id)}>{country.name}</SelectItem>)}</SelectContent></Select></div>
          <Button asChild><Link to="/admin/produits">Ajouter un produit</Link></Button>
        </div>
      </div>

      <Card><CardContent className="flex items-center justify-between p-4"><span>Produits affichés pour {COUNTRIES.find((country) => String(country.id) === countryId)?.name}</span><Badge variant={featuredCount >= 5 ? "destructive" : "default"}>{featuredCount} / 5</Badge></CardContent></Card>

      {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : products.length === 0 ? <Card><CardContent className="p-10 text-center text-muted-foreground">Aucun produit n'est enregistré pour ce pays. Ajoutez-le d'abord dans la rubrique Produits.</CardContent></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className={product.is_home_featured ? "border-primary" : ""}>
              <CardContent className="space-y-4 p-4">
                <div className="flex gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {product.image_url || product.image ? <img className="h-full w-full object-contain" src={product.image_url || product.image || ""} alt={product.name} /> : <Package className="text-muted-foreground" />}
                  </div>
                  <div className="min-w-0"><p className="truncate font-bold">{product.name}</p><p className="text-sm text-muted-foreground">{product.category || "Sans catégorie"}</p><p className="mt-1 font-semibold text-primary">{new Intl.NumberFormat("fr-FR").format(product.price)} FCFA</p></div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-3">
                  <div><Label htmlFor={`featured-${product.id}`}>Afficher sur l'accueil</Label>{product.is_home_featured && <p className="text-xs text-muted-foreground">Position 1 à 5</p>}</div>
                  <div className="flex items-center gap-2">
                    {product.is_home_featured && <Input aria-label="Position" type="number" min="1" max="5" className="w-16" value={product.home_sort_order || 1} onChange={(event) => changeOrder(product, event.target.value)} />}
                    {savingId === product.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Switch id={`featured-${product.id}`} checked={Boolean(product.is_home_featured)} disabled={!product.is_home_featured && featuredCount >= 5} onCheckedChange={(checked) => toggleFeatured(product, checked)} />}
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => openEdit(product)}><Pencil className="mr-2 h-4 w-4" />Modifier les informations</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Modifier le produit</DialogTitle><DialogDescription>Ces changements seront visibles sur l'accueil et dans la boutique.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom *</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div><Label>Catégorie</Label><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Prix *</Label><Input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div><div><Label>Unité</Label><Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></div></div>
            <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
            <Button className="w-full" disabled={savingId === editing?.id || !form.name.trim() || !form.price} onClick={saveProduct}><Save className="mr-2 h-4 w-4" />Enregistrer les modifications</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
