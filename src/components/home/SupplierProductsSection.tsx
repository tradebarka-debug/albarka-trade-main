import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SupplierProduct = { id: number; supplier_id: string; product_name: string; category: string | null; price: string | null; minimum_order: string | null; description: string | null; image_url: string | null };
type Supplier = { id: number; company_name: string };

export default function SupplierProductsSection() {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadProducts = async () => {
      const [productsResult, suppliersResult] = await Promise.all([
        (supabase.from("supplier_products") as any).select("id, supplier_id, product_name, category, price, minimum_order, description, image_url").eq("status", "active").eq("in_stock", true).order("created_at", { ascending: false }).limit(6),
        (supabase.from("suppliers") as any).select("id, company_name").eq("status", "active"),
      ]);
      if (productsResult.error) console.error("Impossible de charger les produits fournisseurs", productsResult.error); else setProducts(productsResult.data ?? []);
      if (suppliersResult.error) console.error("Impossible de charger les fournisseurs", suppliersResult.error); else setSuppliers(suppliersResult.data ?? []);
      setLoading(false);
    };
    void loadProducts();
  }, []);
  const supplierName = (supplierId: string) => suppliers.find((supplier) => String(supplier.id) === String(supplierId))?.company_name ?? "Fournisseur partenaire";
  if (!loading && products.length === 0) return null;
  return <section className="section-padding bg-muted/30"><div className="container mx-auto"><div className="mx-auto mb-12 max-w-2xl text-center"><span className="text-sm font-semibold uppercase tracking-wider text-primary">Fournisseurs partenaires</span><h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">Produits de nos <span className="text-primary">fournisseurs</span></h2><div className="section-divider mx-auto my-6" /><p className="text-lg text-muted-foreground">Une sélection de produits disponibles auprès de nos fournisseurs partenaires.</p></div>{loading ? <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Chargement des produits…</div> : <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"><div className="aspect-square overflow-hidden bg-muted">{product.image_url ? <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>}</div><div className="flex flex-1 flex-col p-5"><p className="mb-1 text-sm font-medium text-primary">{supplierName(product.supplier_id)}</p><h3 className="text-xl font-bold text-foreground">{product.product_name}</h3>{product.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}<div className="mt-4 flex items-end justify-between gap-3"><span className="font-bold text-primary">{product.price || "Prix sur demande"}</span>{product.minimum_order && <span className="text-xs text-muted-foreground">Min. {product.minimum_order}</span>}</div></div></article>)}</div>}</div></section>;
}
