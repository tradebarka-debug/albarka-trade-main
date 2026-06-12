import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminCandidatures = () => {
  const [candidatures, setCandidatures] = useState<any[]>([]);

  const loadCandidatures = async () => {
    const { data, error } = await supabase
      .from("spontaneous_applications" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setCandidatures(data as any[]);
  };

  const updateStatus = async (id: number, status: string) => {
    await supabase
      .from("spontaneous_applications" as any)
      .update({ status })
      .eq("id", id);

    loadCandidatures();
  };

  useEffect(() => {
    loadCandidatures();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Candidatures spontanées</h1>

      <div className="space-y-6">
        {candidatures.map((c) => (
          <div key={c.id} 
             className="border border-yellow-500/20 rounded-xl p-4 bg-[#1a1a1a] shadow-lg max-w-3xl">
            <p><strong>Nom :</strong> {c.full_name}</p>
            <p><strong>Téléphone :</strong> {c.phone}</p>
            <p><strong>Email :</strong> {c.email}</p>
            <p><strong>Profil :</strong> {c.profile}</p>
            <p><strong>Suivi :</strong> {c.tracking_number}</p>
            <p><strong>Statut :</strong> {c.status}</p>

            <div className="flex gap-2 mt-4">
              <button onClick={() => updateStatus(c.id, "nouveau")} className="bg-gray-300 text-black px-3 py-2 rounded">
                Nouveau
              </button>
              <button onClick={() => updateStatus(c.id, "en cours")} className="px-3 py-2 rounded bg-yellow-500">
                En cours
              </button>
              <button onClick={() => updateStatus(c.id, "traité")} className="px-3 py-2 rounded bg-green-600 text-white">
                Traité
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCandidatures;