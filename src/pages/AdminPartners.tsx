import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
type Partner = {
  id: string;
  name: string;
  code: string;
  sales: number;
  commission: number;
  level: string;
  status: string;
};

const AdminPartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);

useEffect(() => {
  const loadPartners = async () => {
    const { data } = await (supabase as any)
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });

    setPartners(data || []);
  };

  loadPartners();
}, []);
  return (
    <div className="min-h-screen bg-black text-white p-6">
      
      <h1 className="text-3xl font-bold text-orange-400 mb-6">
        Tableau des Partenaires
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full border border-orange-500 rounded-lg overflow-hidden">
          
          <thead className="bg-orange-500 text-black">
            <tr>
              <th className="p-3 text-left">Partenaire</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Ventes</th>
              <th className="p-3 text-left">Commission</th>
              <th className="p-3 text-left">Niveau</th>
              <th className="p-3 text-left">Statut</th>
            </tr>
          </thead>

          <tbody>
            {partners.map((partner) => (
              <tr
                key={partner.id}
                className="border-b border-orange-900 hover:bg-orange-950"
              >
                <td className="p-3">{partner.name}</td>

                <td className="p-3 text-orange-400 font-bold">
                  {partner.code}
                </td>

                <td className="p-3">
                  {partner.sales}
                </td>

                <td className="p-3 text-green-400 font-bold">
                  {partner.commission.toLocaleString()} FCFA
                </td>

                <td className="p-3">
                {partner.level}
                </td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      partner.status === "active"
                        ? "bg-green-500 text-black"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {partner.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default AdminPartners;