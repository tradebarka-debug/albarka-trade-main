import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import BackButton from "@/components/BackButton";

const SupplierDetails = () => {
    const { id } = useParams();

    const [supplier, setSupplier] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [customerNames, setCustomerNames] = useState<{ [key: string]: string }>({});
    const [phones, setPhones] = useState<{ [key: string]: string }>({});
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const handleQuoteRequest = async (
        productId: number,
        supplierId: number,
        quantity: number
    ) => {


        const { error } = await (supabase as any)
            .from("quote_requests")
            .insert([
                {
                    product_id: productId,
                    supplier_id: supplierId,
                    customer_name: customerNames[productId] || "",
                    phone: phones[productId] || "",
                    quantity: quantity,
                    message: messages[productId] || "",
                },
            ]);

        if (error) {
            console.log(error);
            alert(JSON.stringify(error));
        } else {
            alert("Demande de devis envoyée !");
            setCustomerNames({
        ...customerNames,
        [productId]: ""
    });

    setPhones({
        ...phones,
        [productId]: ""
    });

    setMessages({
        ...messages,
        [productId]: ""
    });

    setQuantities({
        ...quantities,
        [productId]: 1
    });

    setShowQuoteModal(false);
        }
    };

    useEffect(() => {
        const loadSupplier = async () => {
            const { data: supplierProducts } = await (supabase as any)
                .from("products")
                .select("*")
                .eq("supplier_id", id)
            setProducts(supplierProducts || []);
            const { data } = await (supabase as any)
                .from("suppliers")
                .select("*")
                .eq("id", id)
                .single();

            setSupplier(data);
        };

        loadSupplier();
    }, [id]);

    if (!supplier) {
        return <div className="container mx-auto py-10">Chargement...</div>;
    }

    return (
        <div className="container mx-auto py-10">
            <BackButton />
            <h1 className="text-4xl font-bold text-yellow-400">
                {supplier.company_name}
            </h1>

            <p className="mt-3">
                🌍 {supplier.country} - {supplier.city}
            </p>

            <p className="mt-3">
                {supplier.description}
            </p>
            <h2 className="text-3xl font-bold text-yellow-400 mt-10 mb-6">
                Produits disponibles
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="border border-yellow-500 rounded-xl p-3"
                    >
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-40 object-contain rounded-lg bg-white"
                        />

                        <h3 className="text-xl font-bold mt-2 line-clamp-1">
                            {product.name}
                        </h3>

                        <p>{product.description}</p>

                        <p className="text-yellow-400 font-bold mt-2">
                            {product.price} FCFA
                        </p>
                        {/*
                        <input
                            type="text"
                            placeholder="Votre nom"
                            className="w-full p-2 rounded mt-2 text-black"
                            value={customerNames[product.id] || ""}
                            onChange={(e) =>
                                setCustomerNames({
                                    ...customerNames,
                                    [product.id]: e.target.value
                                })
                            }
                        />

                        <input
                            type="tel"
                            placeholder="Téléphone avec indicatif (ex: +226...)"
                            className="w-full p-2 rounded mt-2 text-black"
                            value={phones[product.id] || ""}
                            onChange={(e) =>
                                setPhones({
                                    ...phones,
                                    [product.id]: e.target.value
                                })
                            }
                        />
                        <textarea
                            placeholder="Votre message"
                            className="w-full p-2 rounded mt-2 text-black"
                            value={messages[product.id] || ""}
                            onChange={(e) =>
                                setMessages({
                                    ...messages,
                                    [product.id]: e.target.value
                                })
                            }
                        />
                        <input
                            type="number"
                            min="1"
                            placeholder="Quantité"
                            className="w-full p-2 rounded mt-2 text-black"
                            value={quantities[product.id] || ''}
                            onChange={(e) => setQuantities({ ...quantities, [product.id]: parseInt(e.target.value) || 0 })}
                        />
                        */}

                        <div className="flex gap-2 mt-3">
                            <a
                                href={`https://wa.me/${supplier.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-center text-sm"
                            >
                                WhatsApp
                            </a>

                            <button
                                onClick={() => {
                                    setSelectedProduct(product);
                                    setShowQuoteModal(true);
                                }}
                                className="flex-1 bg-yellow-500 text-black py-2 rounded-lg text-sm font-bold"
                            >
                                Devis
                            </button>
                        </div>
                    </div>
                ))}
                        </div>

            {showQuoteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                    <h2 className="text-xl font-bold mb-4 text-black">
                        Demande de devis
                    </h2>

                    <input
                        type="text"
                        placeholder="Votre nom"
                        className="w-full border p-2 mb-2 text-black"
                        value={customerNames[selectedProduct?.id] || ""}
                        onChange={(e) =>
                            setCustomerNames({
                                ...customerNames,
                                [selectedProduct.id]: e.target.value,
                            })
                        }
                    />

                    <input
                        type="tel"
                        placeholder="Téléphone (+226...)"
                        className="w-full border p-2 mb-2 text-black"
                        value={phones[selectedProduct?.id] || ""}
                        onChange={(e) =>
                            setPhones({
                                ...phones,
                                [selectedProduct.id]: e.target.value,
                            })
                        }
                    />

                    <input
                        type="number"
                        placeholder="Quantité"
                        className="w-full border p-2 mb-2 text-black"
                        value={quantities[selectedProduct?.id] || 1}
                        onChange={(e) =>
                            setQuantities({
                                ...quantities,
                                [selectedProduct.id]: Number(e.target.value),
                            })
                        }
                    />

                    <textarea
                        placeholder="Message"
                        className="w-full border p-2 mb-3 text-black"
                        value={messages[selectedProduct?.id] || ""}
                        onChange={(e) =>
                            setMessages({
                                ...messages,
                                [selectedProduct.id]: e.target.value,
                            })
                        }
                    />

                    <div className="flex gap-2">
                        <button
                            className="flex-1 bg-gray-500 text-white p-2 rounded"
                            onClick={() => setShowQuoteModal(false)}
                        >
                            Annuler
                        </button>

                        <button
                            className="flex-1 bg-yellow-500 text-black p-2 rounded font-bold"
                            onClick={() => {
                                handleQuoteRequest(
                                    selectedProduct.id,
                                    supplier.id,
                                    quantities[selectedProduct.id] || 1
                                );
                                setShowQuoteModal(false);
                            }}
                        >
                            Envoyer
                        </button>
                                        </div>
                </div>
            </div>
            )}

        </div>
    );
};

export default SupplierDetails;