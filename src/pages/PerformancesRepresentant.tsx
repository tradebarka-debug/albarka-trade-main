import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function PerformancesRepresentant() {
  const [representant, setRepresentant] = useState<any>(null);

  useEffect(() => {
    const codeRepresentant = localStorage.getItem("representantCode");

    if (!codeRepresentant) return;

    const chargerRepresentant = async () => {
      const { data, error } = await supabase
        .from("representants")
        .select("*")
        .eq("code", codeRepresentant)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setRepresentant(data as any);
    };

    chargerRepresentant();
  }, []);
  return (
    <RepresentantLayout title="Mes Performances">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-black mb-8">
          Mes Performances
        </h1>

        <div className="grid md:grid-cols-4 gap-6">

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Ventes réalisées</p>
            <h2 className="text-4xl font-bold text-green-600">
              {representant?.nombre_commandes ?? 0}
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Clients obtenus</p>
            <h2 className="text-4xl font-bold text-blue-600">
              0
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Filleuls</p>
            <h2 className="text-4xl font-bold text-orange-500">
              {representant?.nombre_filleuls ?? 0}
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Chiffre d'affaires généré</p>
            <h2 className="text-2xl font-bold text-purple-600">
              {representant?.gains_totaux?.toLocaleString() ?? "0"} FCFA
            </h2>
          </div>

        </div>

      </div>

    </RepresentantLayout>
  );
}