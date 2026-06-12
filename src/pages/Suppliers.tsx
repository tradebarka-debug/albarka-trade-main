
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useEffect, useState, useRef } from "react";

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
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
        const { data, error } = await (supabase as any)
            .from("suppliers")
            .select("*");
        const { data: productsData, error: productsError } = await (supabase as any)
            .from("supplier_products")
            .select("*");

        console.log("productsData =", productsData);
        console.log("productsError =", productsError);
        setProducts(productsData || []);


        if (!error) {
            setSuppliers(data || []);
        }
    };
    const getFlag = (country: string) => {
        switch (country) {
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
    return (
        <div className="container mx-auto py-10">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white">
                    Nos Fournisseurs Partenaires
                </h1>

                <p className="text-gray-400 mt-2">
                    Découvrez nos fournisseurs nationaux et internationaux
                </p>
            </div>
            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                    width: "100%",
                    overflowX: "auto",
                    scrollBehavior: "smooth"
                }}
            >
                {suppliers.map((supplier: any) => {
                    const product = products.find(
                        (p: any) => Number(p.supplier_id) == supplier.id
                    );
                    console.log("supplier.id=", supplier.id);
                    console.log("Tous les produits:", products);
                    console.log("Image:", product?.image_url);

                    return (
                        <div
                            key={supplier.id}
                            onClick={() => navigate(`/suppliers/${supplier.id}`)}
                            className="min-w-[320px] min-h-[500px] cursor-pointer border border-yellow-500 rounded-xl p-6"
                        >
                            <h2 className="text-xl font-bold text-yellow-400 mb-1">
                                {supplier.company_name}
                            </h2>

                            <p className="text-base text-gray-300 font-medium">
                                {getFlag(supplier.country)} {supplier.country}
                            </p>

                            <p className="text-sm text-gray-300 italic mt-1 leading-5">
                                {supplier.description}

                            </p>

                            <img
                                src={product?.image_url}
                                alt={product?.product_name}
                                className="w-full h-60 object-contain rounded-lg bg-white mt-4"
                            />
                            <p className="text-yellow-400 font-semibold text-sm mt-1">
                                {product?.product_name}
                            </p>
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                                    className="flex-1 bg-yellow-500 text-black py-2 rounded-lg font-bold text-sm"
                                >
                                    Nos produits
                                </button>

                                <a
                                    href={`https://wa.me/${supplier.whatsapp}`}
                                    target="_blank"
                                    className="flex-1 bg-green-600 py-2 rounded-lg text-sm font-bold text-center"
                                >
                                    WhatsApp
                                </a>
                            </div>

                            <div className="mt-2">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-bold ${supplier.status === "Certifié"
                                        ? "bg-green-600 text-white"
                                        : "bg-yellow-500 text-black"
                                        }`}
                                >
                                    {supplier.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="text-center mt-8">
                <button
                    onClick={() => navigate("/suppliers")}
                    className="bg-yellow-500 text-black px-4 py-1 rounded-lg font-bold"
                >
                    Voir tous les fournisseurs
                </button>
            </div>
        </div>
    );
};

export default Suppliers;