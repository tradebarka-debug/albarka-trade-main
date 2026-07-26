import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const RestaurantMenus = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(1);

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCountry]);

  const fetchRestaurants = async () => {
    const { data } = await supabase
  .from("restaurant_partners" as any)
  .select("*")
  .eq("country_id", selectedCountry);

setRestaurants(data || []);
  };

  const handleAddMenu = async () => {
    const { error } = await supabase
      .from("restaurant_menu_items" as any)
      .insert([
        {

          restaurant_id: restaurantId,
          country_id: selectedCountry,
          country: selectedCountry === 1 ? "Burkina Faso" : "Côte d'Ivoire",
          name,
          description,
          price: Number(price),
          image_url: imageUrl,
          is_available: true,
        },
      ]);

    if (error) {
      alert("Erreur");
      console.log(error);
      return;
    }

    alert("Menu ajouté avec succès");

    setRestaurantId("");
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-white">
        Ajouter un menu
      </h1>
      <select
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(Number(e.target.value))}
        className="w-full p-3 rounded text-black"
      >
        <option value={1}>🇧🇫 Burkina Faso</option>
        <option value={2}>🇨🇮 Côte d'Ivoire</option>
      </select>
      <select
        value={restaurantId}
        onChange={(e) => setRestaurantId(e.target.value)}
        className="w-full p-3 rounded text-black"
      >
        <option value="">Choisir un restaurant</option>

        {restaurants.map((restaurant: any) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Nom du plat"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-3 rounded text-black"
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-3 rounded text-black"
      />

      <input
        type="number"
        placeholder="Prix"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-3 rounded text-black"
      />

      <input
        type="text"
        placeholder="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        className="w-full p-3 rounded text-black"
      />

      <button
        onClick={handleAddMenu}
        className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
      >
        Ajouter le menu

      </button>
    </div>
  );
};

export default RestaurantMenus;