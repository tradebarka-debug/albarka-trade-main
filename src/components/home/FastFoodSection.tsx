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

      const { data, error } = await supabase
        .from("restaurant_partners" as any)
        .select("*")
        .eq("country_id", selectedCountry);

      if (!error && data) {
        setRestaurants(data as any);
      }

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
            to="/restaurant/delice"
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
          {restaurants.map((restaurant, index) => (
            <a

              key={index}
              href={`/restaurant/${restaurant.slug}`}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:scale-105 transition-all duration-300 min-w-[80vw] md:min-w-[420px] md:max-w-[380px] flex-shrink-0 snap-center"
            >
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-full h-52 object-cover"
              />

              <div className="p-5">
                <h3 className="text-2xl font-bold text-white break-words">
                  {restaurant.name}
                </h3>

                <p className="text-yellow-400 mt-2">
                  {restaurant.description}
                </p>

                <button className="mt-5 w-full bg-yellow-400 text-black py-3 rounded-xl font-bold">
                  Voir les plats
                </button>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  </>
  );
};

export default FastFoodSection;
