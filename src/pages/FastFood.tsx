import { UtensilsCrossed, Clock, MapPin, Phone, Star, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useFastFoodItems } from "@/hooks/useFastFoodItems";
import fastFoodImage from "@/assets/hero-fastfood-new.jpeg";
import logoHalal from "@/assets/logo-halal.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const FastFood = () => {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const { addItem } = useCart();
  const { items, isLoading } = useFastFoodItems();

  // Group active items by category
  const activeItems = items.filter((i) => i.is_active);
  const categories = [...new Set(activeItems.map((i) => i.category))];
  const groupedItems = categories.map((cat) => ({
    title: cat,
    items: activeItems.filter((i) => i.category === cat)
  }));

  const handleAddToCart = (item: { id: string; name: string; price: number; image: string | null; }) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image || fastFoodImage,
      unit: "plat"
    });
    toast.success(`${item.name} ajouté au panier`);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  const handleCheckout = () => {
    navigate("/paiement", {
      state: {
        appliedPromoCode: promoCode
      }
    });
  };
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <img
          src={fastFoodImage}
          alt="Albarka Fast Food - Restauration rapide à Ouagadougou"
          className="w-full h-full object-cover object-center"
        />
        <img
          src={logoHalal}
          alt="Certifié Halal"
          className="absolute top-6 right-6 w-20 h-20 md:w-24 md:h-24 drop-shadow-lg z-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 text-primary mb-3">
              <UtensilsCrossed className="w-7 h-7" />
              <span className="font-semibold uppercase tracking-wider text-xs">Restauration</span>
            </div>
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3">
              <span className="gradient-text">Albarka Fast Food</span> Halal
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl font-serif md:text-lg">
            </p>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-5 h-5 text-secondary shrink-0" />
              <span>Ouvert tous les jours : <strong className="text-foreground">10h - 00h</strong></span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 text-secondary shrink-0" />
              <span>Ouagadougou, Burkina Faso</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="w-5 h-5 text-secondary shrink-0" />
              <span>+226 02 30 15 15</span>
            </div>
            <a href="tel:+226 02 30 15 15">
              <Button className="btn-primary-glow gap-2 h-11 px-6 rounded-lg">
                <Phone className="w-4 h-4" />
                Commander maintenant
              </Button>
            </a>
          </div>
        </div>
      </section>
      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Code promo partenaire"
          value={promoCode}
          onChange={(e) => {
            setPromoCode(e.target.value);
            localStorage.setItem("promoCode", e.target.value);
          }}
          className="w-full p-3 rounded-lg border border-yellow-500 bg-black text-white"
        />

        {promoCode && (
          <p className="text-sm text-yellow-400">
            Code partenaire saisi : {promoCode}
          </p>
        )}
      </div>
      {/* Menu */}
      <section className="section-padding">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Notre <span className="gradient-text">Menu</span>
            </h2>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-muted-foreground text-lg">
              Découvrez notre sélection de plats préparés avec soin
            </p>
          </div>

          {isLoading ?
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Chargement du menu...</span>
            </div> :
            groupedItems.length === 0 ?
              <div className="text-center py-12">
                <p className="text-muted-foreground">Le menu est en cours de préparation...</p>
              </div> :

              <div className="space-y-12">
                {groupedItems.map((category) =>
                  <div key={category.title}>
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      {category.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {category.items.map((item, index) =>
                        <div
                          key={item.id}
                          className="group bg-card rounded-2xl overflow-hidden shadow-sm border border-border card-hover animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}>

                          {/* Item Image - CORRECTION ICI */}
                          <div className="aspect-square bg-white relative overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover object-[50%_20%] transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <UtensilsCrossed className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="p-5">
                            <h4 className="font-semibold text-lg text-foreground">{item.name}</h4>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 mt-1">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xl font-bold text-primary">
                                {formatPrice(item.price)}
                              </p>
                              <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => handleAddToCart(item)}>

                                <Plus className="w-4 h-4" />
                                Ajouter
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
          }
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card border-t border-border">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            commandez maintenant.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Appelez-nous directement pour commander ou passez nous voir au restaurant.
          </p>

          <Button onClick={handleCheckout} className="btn-primary-glow gap-2 h-12 px-8 text-lg rounded-lg">
            <Phone className="w-5 h-5" />
            Appeler pour commander
          </Button>
        </div>
      </section>
    </main>);

};

export default FastFood;

