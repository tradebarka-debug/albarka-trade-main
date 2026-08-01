import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";


const restaurants = {
    delice: {
        name: "Restaurant Délice",
        image:
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
        phone: "+226 60 00 00 01",
        products: [
            { name: "Poulet braisé", price: "4500 FCFA" },
            { name: "Riz sauce", price: "3000 FCFA" },
            { name: "Poisson grillé", price: "5000 FCFA" },
        ],
    },

    gourmand: {
        name: "Espace Gourmand",
        image:
            "https://images.unsplash.com/photo-1552566626-52f8b828add9",
        phone: "+226 60 00 00 02",
        products: [
            { name: "Spaghetti chef", price: "3500 FCFA" },
            { name: "Attiéké poisson", price: "4500 FCFA" },
            { name: "Dessert maison", price: "2000 FCFA" },
        ],
    },

    royal: {
        name: "Royal Restaurant",
        image:
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        phone: "+226 60 00 00 03",
        products: [
            { name: "Poulet royal", price: "6000 FCFA" },
            { name: "Riz gras", price: "3000 FCFA" },
            { name: "Poisson frit", price: "5000 FCFA" },
        ],
    },

    savana: {
        name: "Savana Food",
        image:
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        phone: "+226 60 00 00 04",
        products: [
            { name: "Hamburger", price: "4000 FCFA" },
            { name: "Brochettes", price: "3500 FCFA" },
            { name: "Spaghetti viande", price: "3000 FCFA" },
        ],
    },

    palace: {
        name: "Palace Gourmet",
        image:
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
        phone: "+226 60 00 00 05",
        products: [
            { name: "Tchep poulet", price: "5000 FCFA" },
            { name: "Attiéké poisson", price: "4500 FCFA" },
            { name: "Dessert maison", price: "2500 FCFA" },
        ],
    },

    valencia: {
        name: "Valencia Grill",
        image:
            "https://images.unsplash.com/photo-1552566626-52f8b828add9",
        phone: "+226 60 00 00 06",
        products: [
            { name: "Burger spécial", price: "3500 FCFA" },
            { name: "Tacos viande", price: "4000 FCFA" },
            { name: "Poulet frit", price: "5000 FCFA" },
        ],
    },

    africa: {
        name: "Africa Grill",
        image:
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        phone: "+226 60 00 00 07",
        products: [
            { name: "Alloco viande", price: "3000 FCFA" },
            { name: "Poulet bicyclette", price: "8000 FCFA" },
            { name: "Attiéké poisson", price: "4500 FCFA" },
        ],
    },

    golden: {
        name: "Golden Food",
        image:
            "https://images.unsplash.com/photo-1559339352-11d035aa65de",
        phone: "+226 60 00 00 08",
        products: [
            { name: "Pizza spéciale", price: "6500 FCFA" },
            { name: "Hamburger", price: "4000 FCFA" },
            { name: "Brochettes", price: "3500 FCFA" },
        ],
    },

    "express-chicken": {
        name: "Express Chicken",
        image:
            "https://images.unsplash.com/photo-1562967916-eb82221dfb92",
        phone: "+226 60 00 00 09",
        products: [
            { name: "Poulet frit", price: "4000 FCFA" },
            { name: "Chicken burger", price: "3500 FCFA" },
            { name: "Frites", price: "1500 FCFA" },
        ],
    },

    "burger-house": {
        name: "Burger House",
        image:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        phone: "+226 60 00 00 10",
        products: [
            { name: "Burger spécial", price: "3500 FCFA" },
            { name: "Double burger", price: "5000 FCFA" },
            { name: "Tacos", price: "3000 FCFA" },
        ],
    },
};

const RestaurantPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState<any[]>([]);
    const [restaurant_partners, setrestaurant_partners] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(
  Number(localStorage.getItem("country_id")) || 1
);

    const restaurant = restaurant_partners.find((item: any) => item.slug === slug
    );


    const fetchRestaurant = async () => {

        const selectedCountry =
  Number(localStorage.getItem("country_id")) || 1;

const { data, error } = await supabase
    .from("restaurant_partners")
    .select("*")
    .eq("country_id", selectedCountry);
        setrestaurant_partners(data || []);

        const currentRestaurant = data?.find(
            (item: any) => item.slug === slug
        );

       if (!currentRestaurant) {
    setMenuItems([]);
    return;
}

        const { data: menuData } = await supabase
            .from("restaurant_menu_items")
            .select("*")
            .eq("restaurant_id", currentRestaurant.id)
            .eq("country_id", currentRestaurant.country_id);

        setMenuItems(menuData || []);
    };
    useEffect(() => {
    fetchRestaurant();
}, [selectedCountry, slug]);
    const { addItem } = useCart();

    const addToCart = (item: any) => {
        addItem(item);
    };
    if (!restaurant) {
        return (
            <div className="text-white p-10">
                Restaurant introuvable
            </div>
        );
    }
    return (
        <>
            <select

                value={selectedCountry}
                onChange={(e) => {
  const value = Number(e.target.value);
  setSelectedCountry(value);
  localStorage.setItem("country_id", value.toString());
}}
                className="w-full p-3 rounded text-black mb-4"
            >
                <option value={1}>🇧🇫 Burkina Faso</option>
                <option value={2}>🇨🇮 Côte d'Ivoire</option>
            </select>

            <div className="min-h-screen bg-black text-white p-6">
                <div className="max-w-6xl mx-auto">

                    <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="w-full h-[400px] object-cover rounded-2xl"
                    />

                    <div className="mt-6">
                        <h1 className="text-5xl font-bold">
                            {restaurant.name}
                        </h1>

                        <p className="text-yellow-400 text-2xl mt-3">
                            {restaurant.phone}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                        {menuItems.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"
                            >
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-48 object-cover rounded-xl mb-4"
                                />
                                <h2 className="text-2xl font-semibold">
                                    {item.name}
                                </h2>
                                <p className="text-gray-300 mt-2">
                                    {item.description}
                                </p>
                                <p className="text-yellow-400 text-xl mt-3">
                                    {item.price} FCFA
                                </p>

                                <div className="mt-5 flex gap-2">
                                    <a
                                        href={`https://wa.me/${restaurant.whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold text-center"
                                    >
                                        WhatsApp
                                    </a>

                                    <button
                                        onClick={() => {
                                            addToCart(item);
                                            navigate("/panier");
                                        }}
                                        className="flex-1 bg-yellow-400 text-black py-3 rounded-xl font-bold"
                                    >
                                        Commander
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div >
        </>
    );

};

export default RestaurantPage;