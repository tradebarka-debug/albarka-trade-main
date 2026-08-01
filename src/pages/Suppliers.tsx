
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useEffect, useState, useRef } from "react";

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Tous");
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadSuppliers();
    }, []);
    useEffect(() => {
        const container = scrollRef.current;

        if (!container) return;

        const interval = setInterval(() => {
            const maxScroll =
                container.scrollWidth - container.clientWidth;

            if (container.scrollLeft >= maxScroll) {
                container.scrollLeft = 0;
            } else {
                container.scrollLeft += 1;
            }
        }, 40);

        return () => clearInterval(interval);
    }, [suppliers]);
    const loadSuppliers = async () => {
        const selectedcountry =
            Number(localStorage.getItem("country_id")) || 1;
            console.log("country_id =", selectedcountry);

        const { data, error } = await (supabase as any)
            .from("suppliers")
            .select("*")
            .eq("country_id", selectedcountry);

        const { data: productsData, error: productsError } = await (supabase as any)
            .from("products")
            .select("*")
            .eq("country_id", selectedcountry);


        setProducts(productsData || []);
       
        if (!error) {
            setSuppliers(data || []);
           
        }
    };
    const getFlag = (Country: string) => {
        switch (Country) {
            case "Burkina Faso":
                return "🇧🇫";

            case "Thaïlande":
                return "🇹🇭";

            case "Chine":
                return "🇨🇳";

            case "Côte d'Ivoire":
                return "🇨🇮";

            case "Mali":
                return "🇲🇱";

            case "Niger":
                return "🇳🇪";

            case "Togo":
                return "🇹🇬";

            case "Bénin":
                return "🇧🇯";

            case "Ghana":
                return "🇬🇭";
        }
    };

    const filteredSuppliers =
        selectedCategory === "Tous"
            ? suppliers
            : suppliers.filter((supplier: any) =>
                supplier.category === selectedCategory
            );

    return (
        <div className="container mx-auto py-10 px-4 overflow-x-hidden">
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-4xl font-bold text-white">
                    Réseau de Partenaires

                </h1>

                <p className="text-gray-400 mt-2">
                    Produits alimentaires, boissons, restauration, services et fournisseurs partenaires
                </p>
            </div>
            <div className="flex justify-center mb-6">
                <div className="inline-flex gap-3 bg-red-500 p-4 rounded-xl">
                    <button
                        onClick={() => setSelectedCategory("Tous")}
                        className="bg-yellow-500 text-black px-4 py-2 rounded-lg"
                    >
                        Tous
                    </button>

                    <button
                        onClick={() => setSelectedCategory("Fournisseurs")}
                        className={
                            selectedCategory === "Fournisseurs"
                                ? "bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold"
                                : "bg-gray-800 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700"
                        }
                    >
                        Fournisseurs
                    </button>
                    <button
                        onClick={() => navigate("/liquidation")}
                        className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
                    >
                        Liquidation
                    </button>
                    <button
                        onClick={() => setSelectedCategory("Restaurants")}
                        className={
                            selectedCategory === "Restaurants"
                                ? "bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold"
                                : "bg-gray-800 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700"
                        }
                    >
                        Restaurants
                    </button>
                    <button
                        onClick={() => navigate("/fast-food")}
                        className={
                            selectedCategory === "Fast Food"
                                ? "bg-yellow-500 text-black px-3 py-2 rounded-lg text-sm font-bold"
                                : "bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
                        }
                    >
                        Fast Food
                    </button>
                    <button
                        onClick={() => navigate("/voyages")}
                        className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
                    >
                        Compagnie de Voyages
                    </button>
                    <button
                        onClick={() => navigate("/livraisons")}
                        className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
                    >
                        Livreurs
                    </button>
                </div>
            </div>
            <div
                ref={scrollRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 px-4"
            >
                {filteredSuppliers.map((supplier: any) => {
                    const supplierProducts = products.filter(
                        (product: any) => product.supplier_id === supplier.id
                    );

                    return (
                        <div
                            key={supplier.id}
                            onClick={() => navigate(`/supplier/${supplier.id}`)}
                            className="bg-[#1f1f1f] rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition"
                        >
                            <img
                                src={supplier.logo_url}
                                alt={supplier.company_name}
                                className="w-full h-56 object-cover"
                            />

                            <div className="p-4">
                                <h2 className="text-2xl font-bold text-white">
                                    {supplier.company_name}
                                </h2>

                                <p className="text-yellow-400 mt-1">
                                    {getFlag(supplier.country)} {supplier.country}
                                </p>

                                <p className="text-gray-400 mt-2">
                                    {supplier.category}
                                </p>

                                <p className="text-gray-300 mt-3 line-clamp-2">
                                    {supplier.description}
                                </p>

                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-yellow-400 font-semibold">
                                        {supplierProducts.length} produits
                                    </span>

                                    <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg">
                                        Voir
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Suppliers;