import { useEffect, useState } from "react";
import { Percent, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type RateItem = { id: string | number; name: string | null; price: number | null; ambassador_commission_rate: number | null };

export default function AdminPromoCommissions() {
  const [defaults, setDefaults] = useState({ boutique_default_rate: 5, restaurant_default_rate: 5 });
  const [products, setProducts] = useState<RateItem[]>([]);
  const [menus, setMenus] = useState<RateItem[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [settingsResult, productsResult, menusResult] = await Promise.all([
      (supabase.from("promo_commission_settings" as any) as any).select("boutique_default_rate,restaurant_default_rate").eq("id", 1).single(),
      (supabase.from("products" as any) as any).select("id,name,price,ambassador_commission_rate").order("name"),
      (supabase.from("restaurant_menu_items" as any) as any).select("id,name,price,ambassador_commission_rate").order("name"),
    ]);
    if (settingsResult.data) setDefaults(settingsResult.data);
    setProducts(productsResult.data || []);
    setMenus(menusResult.data || []);
    if (settingsResult.error || productsResult.error || menusResult.error) toast.error("Impossible de charger tous les taux de commission.");
  };

  useEffect(() => { void load(); }, []);

  const saveDefaults = async () => {
    setSaving(true);
    const { error } = await (supabase.from("promo_commission_settings" as any) as any).update({ ...defaults, updated_at: new Date().toISOString() }).eq("id", 1);
    setSaving(false);
    if (error) toast.error("Enregistrement impossible");
    else toast.success("Taux généraux enregistrés");
  };

  const saveItem = async (table: "products" | "restaurant_menu_items", item: RateItem) => {
    const { error } = await (supabase.from(table as any) as any).update({ ambassador_commission_rate: item.ambassador_commission_rate }).eq("id", item.id);
    if (error) toast.error("Taux non enregistré");
    else toast.success("Taux du produit enregistré");
  };

  return <div className="space-y-7 p-4 md:p-8"><div><h1 className="flex items-center gap-2 text-3xl font-bold"><Percent className="h-7 w-7 text-primary" />Commissions des codes promo</h1><p className="mt-1 text-muted-foreground">Les taux particuliers remplacent le taux général. Laissez vide pour utiliser le taux général.</p></div>
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-bold">Taux généraux</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><RateField label="Boutique Albarka" value={defaults.boutique_default_rate} onChange={(value) => setDefaults({ ...defaults, boutique_default_rate: value ?? 0 })} /><RateField label="Restaurants partenaires" value={defaults.restaurant_default_rate} onChange={(value) => setDefaults({ ...defaults, restaurant_default_rate: value ?? 0 })} /></div><Button className="mt-4" onClick={() => void saveDefaults()} disabled={saving}><Save className="mr-2 h-4 w-4" />Enregistrer les taux généraux</Button></section>
    <RateList title="Produits de la boutique" items={products} setItems={setProducts} onSave={(item) => saveItem("products", item)} />
    <RateList title="Menus des restaurants" items={menus} setItems={setMenus} onSave={(item) => saveItem("restaurant_menu_items", item)} />
  </div>;
}

function RateList({ title, items, setItems, onSave }: { title: string; items: RateItem[]; setItems: (items: RateItem[]) => void; onSave: (item: RateItem) => Promise<void> }) {
  return <section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 space-y-3">{items.map((item, index) => <div key={item.id} className="grid items-center gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_150px_auto]"><div><p className="font-medium">{item.name || "Sans nom"}</p><p className="text-xs text-muted-foreground">{item.price != null ? `${new Intl.NumberFormat("fr-FR").format(item.price)} FCFA` : "Prix non défini"}</p></div><RateField label="Taux particulier" optional value={item.ambassador_commission_rate} onChange={(value) => { const next = [...items]; next[index] = { ...item, ambassador_commission_rate: value }; setItems(next); }} /><Button size="sm" variant="outline" onClick={() => void onSave(item)}><Save className="mr-2 h-4 w-4" />Sauver</Button></div>)}{items.length === 0 && <p className="py-5 text-center text-muted-foreground">Aucun élément.</p>}</div></section>;
}

function RateField({ label, value, onChange, optional = false }: { label: string; value: number | null; onChange: (value: number | null) => void; optional?: boolean }) {
  return <label className="block text-sm"><span className="mb-1 block text-muted-foreground">{label}</span><div className="relative"><Input type="number" min="0" max="100" step="0.01" placeholder={optional ? "Taux général" : "0"} value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? null : Math.min(100, Math.max(0, Number(event.target.value))))} className="pr-9" /><Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /></div></label>;
}
