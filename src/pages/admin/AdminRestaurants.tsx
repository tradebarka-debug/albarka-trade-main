import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";



const Adminrestaurant_partners = () => {
  const [restaurant_partners, setrestaurant_partners] = useState([]);
  const [editing, setEditing] = useState<string | null>(null);
  const startEditing = (restaurant: any) => {
    console.log("modifier cliqué", restaurant);
    setEditing(restaurant.id);
    setName(restaurant.name);
    setSlug(restaurant.slug);
    setImageUrl(restaurant.image_url);
    setDescription(restaurant.description);
  };
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from("restaurant_partners" as any)
      .select("*");
    console.log("error=", error);
    console.log("Restaurants chargés=", data);

    if (error) {
      console.log("error=", error);
    } else {
      setrestaurant_partners(data || []);
      console.log(data);
    }
  };
  const addRestaurant = async () => {
    if (!imageUrl) {
      alert("veuillez saisir une image URL");
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("restaurant_partners" as any)
        .update({
          name,
          slug,
          image_url: imageUrl,
          description,
        })
        .eq("id", editing);

      if (!error) {
        fetchRestaurants();
        setEditing(null);
        setName("");
        setSlug("");
        setImageUrl("");
        setDescription("");
      }

      return;
    }
    const { error } = await supabase
      .from("restaurant_partners" as any)
      .insert([
        {
          name,
          slug,
          image_url: imageUrl,
          description,
          is_active: true,
        },
      ]);
    console.log("Ajout lancé");

    if (error) {
      console.log(error);
    } else {
      fetchRestaurants();

      setName("");
      setSlug("");
      setImageUrl("");
      setDescription("");
    }
  };
  const deleteRestaurant = async (id: string) => {
    const confirmDelete = window.confirm(
      "Supprimer ce restaurant ?"
    );

    if (!confirmDelete) return;

    const result = await supabase
      .from("restaurant_partners" as any)
      .delete()
      .eq("id", id);


    fetchRestaurants();
  };
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="bg-zinc-900 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">
          restaurant_partners
        </h2>

        <input
          type="text"
          placeholder="Nom"
          className="w-full p-3 rounded mb-3 text-black"
          value={name}
          onChange={(e) => {
            const value = e.target.value;
            setName(value);
            setSlug(
              value
                .toLowerCase()
                .replace(/\s+/g, "-")
            );
          }}
        />

        <input
          type="text"
          placeholder="Slug"
          className="w-full p-3 rounded mb-3 text-black"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <input
          type="text"
          placeholder="Image URL"
          className="w-full p-3 rounded mb-3 text-black"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="w-full p-3 rounded mb-3 text-black"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
          onClick={addRestaurant}
        >
          {editing ? "Modifier" : "Ajouter"}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {restaurant_partners.map((restaurant_partners: any, index) => (
          <div
            key={index}
            className="bg-zinc-900 rounded-2xl overflow-hidden"
          >
            {restaurant_partners.image_url && (
              <img
                src={restaurant_partners.image_url}
                alt={restaurant_partners.name}
                className="w-full h-52 object-cover"
              />
            )}

            <div className="p-4">
              <h3 className="text-2xl font-bold">
                {restaurant_partners.name}
              </h3>

              <p className="text-yellow-400 mt-2">
                {restaurant_partners.description}
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  className="bg-blue-500 text-white px-3 py-2 rounded"
                  onClick={() => startEditing(restaurant_partners)}
                >
                  Modifier
                </button>

                <button
                  className="bg-red-500 text-white px-3 py-2 rounded"
                  onClick={() =>
                    deleteRestaurant(restaurant_partners.id)
                  }
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Adminrestaurant_partners;