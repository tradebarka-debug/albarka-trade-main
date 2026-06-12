import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminServiceRequests = () => {
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from("service_requests" as any)
            .select("*")
            .order("id", { ascending: false });

        if (!error && data) {
            setRequests(data);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        const { error } = await supabase
            .from("service_requests" as any)
            .update({ status })
            .eq("id", id);

        if (!error) {
            fetchRequests();
        }
    };

    const deleteRequest = async (id: number) => {
        await supabase
            .from("service_requests" as any)
            .delete()
            .eq("id", id);

        fetchRequests();
    };

    return (
        <div className="p-6 text-white">
            <h1 className="text-3xl font-bold mb-6">Demandes de services</h1>

            <div className="space-y-4">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className="bg-black/40 border border-yellow-500 rounded-lg p-4"
                    >
                        <p><strong>Nom :</strong> {request.name}</p>
                        <p><strong>Téléphone :</strong> {request.phone}</p>
                        <p><strong>Service :</strong> {request.service_type}</p>
                        <p><strong>Message :</strong> {request.message}</p>
                        <p><strong>Code :</strong> {request.tracking_code}</p>
                        <p><strong>Date :</strong>{" "}{new Date(request.created_at).toLocaleString("fr-FR")}
                        </p>

                        <div className="mt-3">
                            <label className="font-bold mr-2">Statut :</label>
                            <select
                                value={request.status || "En attente"}
                                onChange={(e) => updateStatus(request.id, e.target.value)}
                                className={`rounded px-3 py-2 text-white font-bold
                                ${request.status === "En attente"
                                        ? "bg-yellow-500"
                                        : request.status === "En cours"
                                            ? "bg-blue-600"
                                            : "bg-green-600"}`}
                            >
                                <option value="En attente">En attente</option>
                                <option value="En cours">En cours</option>
                                <option value="Terminé">Terminé</option>
                            </select>
                            <button
                                onClick={() => {
                                    if (window.confirm("Supprimer cette demande ?")) {
                                        deleteRequest(request.id);
                                    }
                                }}
                                className="ml-3 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-bold"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
};

export default AdminServiceRequests;