import { UtensilsCrossed, Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import fastFoodImage from "@/assets/hero-fastfood-new.jpeg";
import logoHalal from "@/assets/logo-halal.png";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const restaurantsData = [
  {
    name: "Restaurant Délice",
    slug: "delice",
    image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    description: "Découvrez nos plats du jour et spécialités maison"
  },

  {
    name: "Espace Gourmand",
    slug: "gourmand",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    description: "Cuisine africaine et européenne"
  },

  {
    name: "Royal Restaurant",
    slug: "royal",
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    description: "Cuisine royale et plats savoureux"
  },

  {
    name: "Savana Food",
    slug: "savana",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    description: "Fast food moderne et délicieux"
  },

  {
    name: "Palace Gourmet",
    slug: "palace",
    image_url: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9",
    description: "Des repas gourmets préparés avec soin"
  },

  {
    name: "Valencia Grill",
    slug: "valencia",
    image_url: "https://images.unsplash.com/photo-1552566626-52f8b828add9",
    description: "Grillades et burgers spéciaux"
  },

  {
    name: "Africa Grill",
    slug: "africa",
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    description: "Cuisine africaine authentique"
  },

  {
    name: "Golden Food",
    slug: "golden",
    image_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
    description: "Menus rapides et délicieux"
  },

  {
    name: "Express Chicken",
    slug: "express-chicken",
    image_url: "https://images.unsplash.com/photo-1562967916-eb82221dfb92",
    description: "Poulets braisés et frits"
  },

  {
    name: "Burger House",
    slug: "burger-house",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    description: "Burgers gourmands et tacos"
  },
];


const FastFoodSection = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState(
  Number(localStorage.getItem("country_id")) || 1
);
  const [restaurants, setRestaurants] = useState(restaurantsData);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<number | null>(null);

  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current !== null) {
      window.clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  const startAutoScroll = () => {
    if (autoScrollTimerRef.current !== null) return;

    const container = scrollRef.current;
    if (!container) return;

    autoScrollTimerRef.current = window.setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft >= maxScroll) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += 1;
      }
    }, 40);
  };

  const scrollLeft = () => {
    const container = scrollRef.current;
    if (!container) return;

    stopAutoScroll();
    container.scrollBy({
      left: -Math.max(container.clientWidth * 0.9, 260),
      behavior: "smooth",
    });
    window.setTimeout(startAutoScroll, 1200);
  };
  const scrollRight = () => {
    const container = scrollRef.current;
    if (!container) return;

    stopAutoScroll();
    container.scrollBy({
      left: Math.max(container.clientWidth * 0.9, 260),
      behavior: "smooth",
    });
    window.setTimeout(startAutoScroll, 1200);
  };
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);

      const [{ data, error }, { data: menuData, error: menuError }] = await Promise.all([
        supabase.from("restaurant_partners" as any).select("*").eq("country_id", selectedCountry).eq("is_active", true).order("display_order"),
        supabase.from("restaurant_menu_items" as any).select("*").eq("country_id", selectedCountry).eq("is_available", true),
      ]);

      if (!error && data) {
        setRestaurants(data as any);
      }
      if (!menuError && menuData) setMenuItems(menuData as any[]);

      setLoading(false);
    };

    fetchRestaurants();
  }, [selectedCountry]);
  useEffect(() => {
    startAutoScroll();

    return () => {
      stopAutoScroll();
    };
  }, [restaurants]);

  if (loading) {
    return <div className="text-white p-10">Chargement...</div>;
  }

  return (
  <>
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Restauration
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 leading-tight">
            nos restaurants partenaires
          </h2>
          <div className="section-divider mx-auto mb-6" />
          <p className="text-muted-foreground text-lg">
            Decouvrez nos meilleurs restaurants partenaires
          </p>
        </div>
        <div className="flex justify-center -mt-2 mb-6">
          <Link
            to="/restaurants-partenaires"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
          >
            Découvrir nos restaurants partenaires
          </Link>
        </div>

        <div className="hidden md:flex justify-between items-center px-8 mb-2">
          <button
            onClick={scrollLeft}
            className="bg-yellow-500 text-black w-12 h-12 rounded-full font-bold text-xl"
          >
            ←
          </button>

          <button
            onClick={scrollRight}
            className="bg-yellow-500 text-black w-12 h-12 rounded-full font-bold text-xl"
          >
            →
          </button>
        </div>
        <div ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-10"
          style={{
            width: "100%",
            overflowX: "auto",
            scrollBehavior: "smooth"
          }}
        >
          {restaurants.map((restaurant: any, index) => {
            const restaurantMenu = menuItems.filter((item) => String(item.restaurant_id) === String(restaurant.id));
            return (
            <a

              key={index}
              href={`/restaurant/${restaurant.slug}`}
              className="group bg-card rounded-2xl overflow-hidden border border-border hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl transition-all duration-500 min-w-[76vw] sm:min-w-[340px] md:min-w-[380px] md:max-w-[380px] flex-shrink-0 snap-center"
            >
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 76vw, 380px"
                className="h-44 w-full object-cover transition duration-700 group-hover:scale-105 md:h-52"
              />

              <div className="p-5">
                <h3 className="text-2xl font-bold text-white break-words">
                  {restaurant.name}
                </h3>

                <p className="text-yellow-400 mt-2">
                  {restaurant.description}
                </p>

                {restaurantMenu.length > 0 && (
                  <div className="mt-4 rounded-xl bg-background/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Menu disponible</p>
                    <div className="space-y-2">
                      {restaurantMenu.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate text-foreground">{item.name}</span>
                          <span className="shrink-0 font-semibold text-primary">{new Intl.NumberFormat("fr-FR").format(Number(item.price) || 0)} FCFA</span>
                        </div>
                      ))}
                    </div>
                    {restaurantMenu.length > 3 && <p className="mt-2 text-xs text-muted-foreground">+ {restaurantMenu.length - 3} autre(s) plat(s)</p>}
                  </div>
                )}

                <button className="mt-5 w-full bg-yellow-400 text-black py-3 rounded-xl font-bold">
                  Voir les plats
                </button>
              </div>
            </a>
          )})}
        </div>

      </div>
    </section>
  </>
  );
};

export default FastFoodSection;
