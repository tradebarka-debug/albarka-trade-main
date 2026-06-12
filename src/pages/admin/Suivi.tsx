import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Suivi = () => {
  const [trackingCode, setTrackingCode] = useState("");
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!trackingCode) return;

    setLoading(true);

   const { data, error } = await supabase
  .from("service_requests" as any)
  .select("*")
  .eq("tracking_code", trackingCode)
  .single();

    if (!error) {
      setRequestData(data);
    } else {
      setRequestData(null);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-yellow-500">
        Suivi de demande
      </h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Entrez votre numéro de suivi"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          className="w-full p-3 rounded bg-gray-900 border border-yellow-500"
        />

        <button
          onClick={handleSearch}
          className="bg-yellow-500 text-black px-6 rounded font-bold"
        >
          Rechercher
        </button>
      </div>

      {loading && <p>Recherche...</p>}

      {requestData && (
        <div className="border border-yellow-500 p-6 rounded">
          <p><strong>Nom :</strong> {requestData.name}</p>
          <p><strong>Téléphone :</strong> {requestData.phone}</p>
          <p><strong>Service :</strong> {requestData.service_type}</p>
          <p><strong>Message :</strong> {requestData.message}</p>
          <p><strong>Code :</strong> {requestData.tracking_code}</p>
          <p><strong>Statut :</strong> {requestData.status}</p>
        </div>
      )}
    </div>
  );
};

export default Suivi;