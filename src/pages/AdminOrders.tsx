import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminOrders = () => {
    const updateOrderStatus = async (id: string, status: string) => {
        const { data: order } = await (supabase as any)
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (!order || order.status !== "pending") {
            alert("Cette commande est déjà traitée.");
            return;
        }

        await (supabase as any)
            .from("orders")
            .update({ status })
            .eq("id", id);

        if (status === "validated" && order.promo_code) {
            const { data: partner } = await (supabase as any)
                .from("partners")
                .select("*")
                .eq("code", order.promo_code)
                .single();

            if (partner) {
                const commissionGain = Math.round(Number(order.total) * 0.02);

                await (supabase as any)
                    .from("partners")
                    .update({
                        sales: Number(partner.sales || 0) + 1,
                        commission: Number(partner.commission || 0) + commissionGain,
                    })
                    .eq("id", partner.id);
            }
        }

        window.location.reload();
    };
    const [orders, setOrders] = useState<any[]>([]);

    const loadOrders = async () => {
        const { data, error } = await (supabase as any)
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) setOrders(data || []);
    };

    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <h1 className="text-3xl font-bold text-orange-400 mb-6">
                Commandes clients
            </h1>

            <div className="overflow-x-auto">
                <table className="w-full border border-orange-500">
                    <thead className="bg-orange-500 text-black">
                        <tr>
                            <th className="p-3 text-left">Client</th>
                            <th className="p-3 text-left">Téléphone</th>
                            <th className="p-3 text-left">Adresse</th>
                            <th className="p-3 text-left">Montant</th>
                            <th className="p-3 text-left">Paiement</th>
                            <th className="p-3 text-left">Référence</th>
                            <th className="p-3 text-left">Code promo</th>
                            <th className="p-3 text-left">Statut</th>
                            <th className="p-3 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-t border-orange-900">
                                <td className="p-3">{order.customer_name}</td>
                                <td className="p-3">{order.phone}</td>
                                <td className="p-3">{order.address}</td>
                                <td className="p-3 text-orange-400 font-bold">
                                    {Number(order.total).toLocaleString()} FCFA
                                </td>
                                <td className="p-3">{order.payment_method}</td>
                                <td className="p-3">{order.transaction_ref}</td>
                                <td className="p-3">{order.promo_code || "-"}</td>
                                <td className="p-3">{order.status}</td>
                                <td className="p-3 flex gap-2">
                                    {order.status === "pending" && (
                                        <>
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "validated")}
                                                className="bg-green-600 text-white px-3 py-1 rounded"
                                            >
                                                Valider
                                            </button>

                                            <button
                                                onClick={() => updateOrderStatus(order.id, "rejected")}
                                                className="bg-red-600 text-white px-3 py-1 rounded"
                                            >
                                                Refuser
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrders;