import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RestaurantSummary = {
  id: string;
  name: string | null;
  slug: string | null;
  image_url: string | null;
  description: string | null;
  location: string | null;
  category: string | null;
  is_available?: boolean | null;
};

const RestaurantPartners = () => {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const countryId = Number(localStorage.getItem("country_id")) || 1;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await (supabase.from("restaurant_partners") as any)
        .select("id, name, slug, image_url, description, location, category, is_available")
        .eq("country_id", countryId)
        .eq("is_active", true)
        .order("display_order", { ascending: true, nullsFirst: false });

      if (error) {
        console.error(error);
        toast.error("Impossible de charger les restaurants partenaires.");
      }
      setRestaurants((data as RestaurantSummary[]) || []);
      setLoading(false);
    };
    void load();
  }, [countryId]);

  return (
    <main className="min-h-[70vh] bg-background">
      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Restaurants partenaires</p>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Choisissez votre restaurant</h1>
          <p className="mt-4 text-muted-foreground">Ouvrez sa page pour consulter son menu et passer votre commande.</p>
        </div>

        {loading ? (
          <p className="py-16 text-center text-muted-foreground">Chargement des restaurants...</p>
        ) : restaurants.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border p-10 text-center text-muted-foreground">
            <Store className="mx-auto mb-4 h-10 w-10" />Aucun restaurant partenaire disponible dans ce pays pour le moment.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <Link key={restaurant.id} to={`/restaurant/${restaurant.slug}`} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg">
                <div className="h-52 bg-muted">
                  {restaurant.image_url ? <img src={restaurant.image_url} alt={restaurant.name || "Restaurant"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Store className="h-12 w-12 text-muted-foreground" /></div>}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{restaurant.name}</h2><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${restaurant.is_available === false ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700"}`}>{restaurant.is_available === false ? "Indisponible" : "Ouvert"}</span></div>
                  {restaurant.location && <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{restaurant.location}</p>}
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{restaurant.description || restaurant.category || "Consultez le menu du restaurant."}</p>
                  <span className="mt-5 flex items-center gap-2 font-semibold text-primary">Voir le menu <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default RestaurantPartners;
