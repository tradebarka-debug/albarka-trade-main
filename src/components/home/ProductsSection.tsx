import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/hooks/useProducts";

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setIsLoading(true);
      const countryId = Number(localStorage.getItem("country_id")) || 1;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("country_id", countryId)
        .eq("is_home_featured", true)
        .order("home_sort_order", { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) console.error("Impossible de charger les produits de qualité:", error);
      setProducts((data || []) as Product[]);
      setIsLoading(false);
    };

    loadFeaturedProducts();
    window.addEventListener("storage", loadFeaturedProducts);
    return () => window.removeEventListener("storage", loadFeaturedProducts);
  }, []);
  if (!isLoading && products.length === 0) return null;
  return <section className="section-padding bg-muted/30"><div className="container mx-auto"><div className="mx-auto mb-10 max-w-2xl text-center"><span className="text-sm font-semibold uppercase tracking-wider text-primary">Nos produits</span><h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">Produits de <span className="text-primary">qualité</span></h2><p className="mt-3 text-muted-foreground">Découvrez les produits disponibles dans votre pays.</p></div>{isLoading ? <p className="text-center text-muted-foreground">Chargement des produits…</p> : <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="aspect-square bg-muted">{product.image_url || product.image ? <img src={product.image_url || product.image || ""} alt={product.name} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Package /></div>}</div><div className="p-5"><p className="text-sm text-primary">{product.category || product.categorie || "Produit"}</p><h3 className="mt-1 text-xl font-bold">{product.name}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p><div className="mt-4 flex items-center justify-between"><span className="font-bold text-primary">{new Intl.NumberFormat("fr-FR").format(product.price)} FCFA</span><Link to="/boutique"><Button size="sm">Voir</Button></Link></div></div></article>)}</div>}<div className="mt-10 text-center"><Link to="/boutique"><Button className="gap-2">Voir tous nos produits <ArrowRight className="h-4 w-4" /></Button></Link></div></div></section>;
}
