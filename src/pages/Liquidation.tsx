import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, PackageOpen, Phone, Loader2, Percent, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface LiquidationProduct {
  id: string;
  name: string;
  description: string | null;
  category?: string;
  price: number;
  liquidation_price?: number | null;
  image_url?: string | null;
  unit?: string | null;
  liquidation_until?: string | null;
}

const calculateDiscount = (price?: number, liquidationPrice?: number | null) => {
  if (!price || !liquidationPrice) return 0;
  return Math.round(((price - liquidationPrice) / price) * 100);
};

const Liquidation = () => {
  const countryId = Number(localStorage.getItem("country_id")) || 1;
  const phone = countryId === 2 ? "+225 07 14 14 66 30" : "+226 02 02 94 94";
  const whatsapp = countryId === 2 ? "2250714146630" : "22602029494";
  const address = countryId === 2 ? "Abidjan, Côte d'Ivoire" : "Ouagadougou, Burkina Faso";
  const [items, setItems] = useState<LiquidationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLiquidationProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("country_id", countryId)
        .eq("is_liquidation", true)
        .order("name", { ascending: true });

      if (!error) {
        const activeItems = (data || []).filter((item) => {
          if (!item.liquidation_until) return true;
          return new Date(item.liquidation_until) >= new Date();
        }) as LiquidationProduct[];

        setItems(activeItems);
      }

      setLoading(false);
    };

    fetchLiquidationProducts();
  }, [countryId]);

  const getTimeRemaining = (deadline?: string | null) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - now;
    if (diff <= 0) return "Expirée";

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const featuredItems = useMemo(() => items.slice(0, 3), [items]);

  return (
    <main className="bg-background min-h-screen text-foreground">
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Réseau de partenaires</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Liquidation</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Découvrez nos solutions de liquidation pour les entreprises, les commerces et les distributeurs en quête de produits de qualité, à des conditions avantageuses.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-destructive/15 text-destructive px-3 py-1 text-sm font-semibold">Offres limitées</span>
              <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">Mise à jour dynamique</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto px-4 grid gap-6 md:grid-cols-3">
          <div className="bg-card border border-border rounded-2xl p-6">
            <PackageOpen className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">Stock sécurisé</h2>
            <p className="text-muted-foreground">
              Une sélection de produits adaptés à votre activité, avec un suivi sérieux et des offres attractives.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <Phone className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">Contact direct</h2>
            <p className="text-muted-foreground">Appelez-nous directement pour obtenir des informations et passer votre commande.</p>
            <a href={`tel:${whatsapp}`} className="text-primary font-semibold mt-3 inline-block">{phone}</a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <MapPin className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">Zone de service</h2>
            <p className="text-muted-foreground">{address}</p>
          </div>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Offres en liquidation</h2>
            <span className="text-sm text-muted-foreground">{items.length} offre(s) active(s)</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Chargement des offres...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              Aucune offre de liquidation disponible pour ce pays pour le moment.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredItems.map((item) => {
                const timeRemaining = getTimeRemaining(item.liquidation_until);
                return (
                  <div key={item.id} className="group bg-gradient-to-b from-card to-card/70 border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    {item.image_url && (
                      <div className="h-48 bg-white flex items-center justify-center p-4">
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    )}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-semibold">Liquidation</span>
                        <span className="text-xs text-muted-foreground">{item.category || "Produit"}</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{item.description || "Produit disponible à prix réduit pour une mise en marché rapide."}</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through text-muted-foreground">{item.price.toLocaleString("fr-FR")} FCFA</span>
                        <span className="font-semibold text-primary">{(item.liquidation_price ?? item.price).toLocaleString("fr-FR")} FCFA</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-600 px-3 py-1 text-xs font-semibold">
                          <Percent className="w-3 h-3" />
                          {calculateDiscount(item.price, item.liquidation_price)}% de remise
                        </div>
                        {timeRemaining && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                            <Clock3 className="w-3 h-3" />
                            {timeRemaining}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="container mx-auto px-4 text-center">
          <Link to="/contact">
            <Button className="btn-primary-glow gap-2 h-12 px-8 text-lg rounded-lg">
              Demander un devis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Liquidation;
