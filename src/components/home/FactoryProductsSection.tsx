import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FactoryProduct = {
  id: number;
  name: string;
  category: string | null;
  price: number;
  unit: string | null;
  description: string | null;
  image: string | null;
  factories: { company_name: string } | null;
};

const FactoryProductsSection = () => {
  const [products, setProducts] = useState<FactoryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await (supabase.from("factory_products" as any) as any)
        .select("id, name, category, price, unit, description, image, factories(company_name)")
        .eq("status", "active")
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) console.error("Impossible de charger les produits des usines", error);
      else setProducts(data ?? []);
      setLoading(false);
    };
    void loadProducts();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Usines partenaires</span>
          <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Produits de nos <span className="text-primary">usines partenaires</span>
          </h2>
          <div className="section-divider mx-auto my-6" />
          <p className="text-lg text-muted-foreground">Découvrez les produits proposés par nos partenaires industriels.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Chargement des produits…</div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
                <div className="aspect-square overflow-hidden bg-muted">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="mb-1 text-sm font-medium text-primary">{product.factories?.company_name ?? "Usine partenaire"}</p>
                  <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                  {product.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="font-bold text-primary">{new Intl.NumberFormat("fr-FR").format(product.price)} FCFA</span>
                    {product.unit && <span className="text-xs text-muted-foreground">{product.unit}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FactoryProductsSection;
