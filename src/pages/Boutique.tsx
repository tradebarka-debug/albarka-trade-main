import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Filter, Loader2 } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import StockIndicator from "@/components/boutique/StockIndicator";
import { findPromoPartner, calculateCommission } from "@/utils/promoCode";
import { supabase } from "@/integrations/supabase/client";

const Boutique = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCart();
  const { products, isLoading } = useProducts();
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [supplierNames, setSupplierNames] = useState<Record<number, string>>({});
  const countryName = Number(localStorage.getItem("country_id") || "1") === 2 ? "Côte d’Ivoire" : "Burkina Faso";

  useEffect(() => {
    const loadSuppliers = async () => {
      const { data } = await (supabase.from("suppliers") as any).select("id, company_name");
      setSupplierNames(Object.fromEntries((data ?? []).map((supplier: any) => [supplier.id, supplier.company_name])));
    };
    void loadSuppliers();
  }, []);

  // Extraire les catégories uniques des produits de la base de données
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category || p.categorie))];
  }, [products]);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category || p.categorie === selectedCategory)
    : products;
  const validatePromoCode = () => {
    if(!promoCode) { setPromoMessage("");
      return null;
      }
      const partner = findPromoPartner(promoCode); 
      if (partner) {
  setPromoMessage(`code valide: ${partner.partnerName} — commission selon niveau`);
  localStorage.setItem("promoCode", promoCode);
  return partner;
}
      setPromoMessage("code promo invalide");
      localStorage.removeItem("promoCode");
      return null;
      };
  const handleAddToCart = (product: Product) => {
    const quantity = Math.max(1, quantities[product.id] || 1);
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || product.image || "/placeholder.svg",
      unit: product.unit || "",
    }, quantity);
    toast.success(`${product.name} ajouté au panier`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Boutique en ligne
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2">
              Produits Alimentaires
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Découvrez notre sélection de produits de qualité : riz, huile, sucre et bien plus encore.
              Paiement facile via Orange Money, Wave , Moov Money et en cryptomonnaie.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 space-y-2">
<input
type="text" 
placeholder="Code promo partenaire"
value={promoCode}
onChange={(e) => setPromoCode(e.target.value)}
onBlur={validatePromoCode}
className="w-full p-3 rounded-lg border border-yellow-500 bg-black text-white"
/>
{promoMessage && (
<p className="text-sm text-yellow-400">
{promoMessage}
</p>
)}
</div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtrer:</span>
            </div>
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Tous
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Chargement des produits...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Aucun produit trouvé dans cette catégorie.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-sm border border-border card-hover animate-fade-in h-full flex flex-col"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Product Image */}
                <div className="h-[260px] bg-white relative overflow-hidden flex items-center justify-center p-6">
                  <img
                    src={product.image_url?.trim() || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                      <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium">
                        Rupture de stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-lg text-foreground">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Conditionnement : {product.unit?.replace(/format:/gi, "").trim() || "Non précisé"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">Pays : {countryName}</p>
                  <p className="text-sm text-muted-foreground mb-1">Fournisseur : {product.supplier_id ? supplierNames[product.supplier_id] || "Non précisé" : "Albarka Trade"}</p>
                  <div className="mb-3">
                    <StockIndicator quantity={product.stock_quantity} inStock={product.in_stock} />
                  </div>
                  <p className={`mb-3 text-sm font-medium ${product.in_stock ? "text-green-600" : "text-destructive"}`}>{product.in_stock ? "Disponibilité : En stock" : "Disponibilité : Rupture de stock"}</p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </p>
                    <div className="flex items-center gap-2">
                      <input aria-label={`Quantité pour ${product.name}`} type="number" min="1" max={Math.max(1, product.stock_quantity)} value={quantities[product.id] || 1} onChange={(event) => setQuantities({ ...quantities, [product.id]: Math.max(1, Math.min(product.stock_quantity || 1, Number(event.target.value) || 1)) })} className="h-9 w-14 rounded-md border bg-background px-2 text-sm" disabled={!product.in_stock} />
                      <Button size="sm" variant="orangeMoney" onClick={() => handleAddToCart(product)} disabled={!product.in_stock} className="gap-2"><ShoppingCart className="w-4 h-4" />Ajouter</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Boutique;
