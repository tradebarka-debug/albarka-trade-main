import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Clock, MapPin, MessageCircle, ShoppingCart, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const RestaurantPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addItem, totalItems, totalPrice } = useCart();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const countryFromLink = Number(searchParams.get("country"));
  const [selectedCountry, setSelectedCountry] = useState(countryFromLink || Number(localStorage.getItem("country_id")) || 1);
  const countryName = selectedCountry === 2 ? "Côte d’Ivoire" : "Burkina Faso";

  useEffect(() => {
    if (countryFromLink) localStorage.setItem("country_id", String(countryFromLink));
    const loadRestaurant = async () => {
      setRestaurant(null);
      const { data: restaurantData } = await (supabase.from("restaurant_partners") as any).select("*").eq("slug", slug).eq("country_id", selectedCountry).maybeSingle();
      setRestaurant(restaurantData);
      if (!restaurantData) { setMenuItems([]); return; }
      const { data: menuData, error: menuError } = await (supabase.from("restaurant_menu_items") as any).select("*").eq("restaurant_id", restaurantData.id).eq("country_id", selectedCountry).eq("is_available", true).order("display_order", { ascending: true });
      if (menuError) {
        console.error("Erreur de chargement du menu restaurant:", menuError);
        toast.error("Le menu du restaurant n'a pas pu être chargé.");
      }
      setMenuItems(menuData ?? []);
    };
    void loadRestaurant();
  }, [countryFromLink, selectedCountry, slug]);

  const addDishToCart = (dish: any) => {
    addItem({ id: `restaurant-${restaurant.id}-${dish.id}`, name: dish.name, price: Number(dish.price) || 0, image: dish.image_url || "/placeholder.svg", unit: "Plat", restaurantId: restaurant.id });
    toast.success(`${dish.name} ajouté au panier`);
  };

  if (!restaurant) return <div className="min-h-screen p-10 text-center text-muted-foreground">Restaurant introuvable ou indisponible dans ce pays.</div>;
  const whatsapp = String(restaurant.whatsapp || restaurant.telephone || "").replace(/\D/g, "");
  const deliveryFee = Number(restaurant.delivery_fee) || 0;

  return <main className="min-h-screen bg-background pb-12">
    <div className="border-b bg-card p-4"><div className="container mx-auto flex items-center justify-between gap-3"><Button variant="outline" className="gap-2" onClick={() => navigate("/panier")}><ShoppingCart className="h-4 w-4" />Panier ({totalItems})</Button><select value={selectedCountry} onChange={(event) => { const country = Number(event.target.value); setSelectedCountry(country); localStorage.setItem("country_id", String(country)); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value={1}>Burkina Faso</option><option value={2}>Côte d’Ivoire</option></select></div></div>
    <div className="container mx-auto px-4 py-8">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm"><div className="relative h-64 md:h-96">{restaurant.image_url ? <img src={restaurant.image_url} alt={restaurant.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">Photo du restaurant</div>}<span className="absolute left-5 top-5 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">Partenaire Albarka</span></div>
        <div className="p-6 md:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row"><div><h1 className="text-3xl font-bold text-foreground md:text-5xl">{restaurant.name}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{restaurant.description}</p></div><span className={`h-fit rounded-full px-4 py-2 text-sm font-bold ${restaurant.is_available === false ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700"}`}>{restaurant.is_available === false ? "Indisponible" : "Disponible"}</span></div>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><Info icon={<MapPin />} label="Localisation" value={`${restaurant.location || "Zone non précisée"} · ${restaurant.country || countryName}`} /><Info icon={<Clock />} label="Horaires" value={restaurant.hours || "Non précisés"} /><Info icon={<Truck />} label="Livraison" value={deliveryFee ? `${new Intl.NumberFormat("fr-FR").format(deliveryFee)} FCFA` : "Gratuite"} /><Info icon={<Clock />} label="Temps estimé" value={restaurant.estimated_delivery_time || "À confirmer"} /></div>
          <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => document.getElementById("menu-restaurant")?.scrollIntoView({ behavior: "smooth" })} className="gap-2"><ShoppingCart className="h-4 w-4" />Commander en ligne</Button>{totalItems > 0 && <Button variant="outline" onClick={() => navigate("/panier")} className="gap-2">Voir le panier · {new Intl.NumberFormat("fr-FR").format(totalPrice)} FCFA</Button>}{whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite contacter ${restaurant.name}.`)}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="gap-2 border-green-600 text-green-700"><MessageCircle className="h-4 w-4" />Contacter sur WhatsApp</Button></a>}</div>
        </div>
      </div>
      <section id="menu-restaurant" className="mt-10 scroll-mt-24"><div className="mb-6 flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Menu</p><h2 className="mt-1 text-3xl font-bold">Choisissez vos plats</h2></div><span className="text-sm text-muted-foreground">{menuItems.length} plat(s) disponible(s)</span></div>
        {menuItems.length === 0 ? <p className="rounded-xl border p-8 text-center text-muted-foreground">Aucun plat disponible pour le moment.</p> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{menuItems.map((dish) => <article key={dish.id} className="overflow-hidden rounded-2xl border bg-card"><div className="h-48 bg-muted">{dish.image_url && <img src={dish.image_url} alt={dish.name} className="h-full w-full object-cover" />}</div><div className="p-5"><h3 className="text-xl font-bold">{dish.name}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{dish.description}</p><div className="mt-5 flex items-center justify-between gap-3"><span className="text-lg font-bold text-primary">{new Intl.NumberFormat("fr-FR").format(Number(dish.price) || 0)} FCFA</span><Button onClick={() => addDishToCart(dish)} disabled={restaurant.is_available === false} className="gap-2"><ShoppingCart className="h-4 w-4" />Ajouter</Button></div></div></article>)}</div>}
      </section>
    </div>
    {totalItems > 0 && <div className="fixed inset-x-0 bottom-16 z-40 px-4 md:bottom-5"><Button size="lg" onClick={() => navigate("/panier")} className="mx-auto flex w-full max-w-md gap-2 shadow-2xl"><ShoppingCart className="h-5 w-5" />Voir le panier ({totalItems}) · {new Intl.NumberFormat("fr-FR").format(totalPrice)} FCFA</Button></div>}
  </main>;
};

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3 rounded-xl bg-muted/50 p-3"><span className="mt-0.5 text-primary">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-foreground">{value}</p></div></div>; }

export default RestaurantPage;
