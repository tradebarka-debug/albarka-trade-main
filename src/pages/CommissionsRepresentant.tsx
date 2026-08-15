import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { Button } from "@/components/ui/button";
import { useRepresentant } from "@/hooks/useRepresentant";

export default function CommissionsRepresentant() {
  const { representant } = useRepresentant();
  return (
    <RepresentantLayout title="Mes Commissions">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-black mb-8">
          Mes Commissions
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div className="border rounded-xl p-6">
            <p className="text-gray-500">Solde disponible</p>
            <h2 className="text-3xl font-bold text-green-600">
              {representant?.commission_disponible?.toLocaleString() ?? "0"} FCFA
            </h2>
          </div>

          <div className="border rounded-xl p-6">
            <p className="text-gray-500">En attente</p>
            <h2 className="text-3xl font-bold text-orange-500">
              0 FCFA
            </h2>
          </div>

          <div className="border rounded-xl p-6">
            <p className="text-gray-500">Total gagné</p>
            <h2 className="text-3xl font-bold text-blue-600">
              {representant?.commission_totale?.toLocaleString() ?? "0"} FCFA
            </h2>
          </div>

        </div>

        <h2 className="text-xl font-bold mb-4">
          Historique
        </h2>

        <table className="w-full border">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Référence</th>
              <th className="p-3 border">Montant</th>
              <th className="p-3 border">Statut</th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td className="border p-3">15/07/2026</td>
              <td className="border p-3">CMD-00001</td>
              <td className="border p-3">25 000 FCFA</td>
              <td className="border p-3 text-green-600">Payée</td>
            </tr>

          </tbody>

        </table>

        <Button className="mt-8">
          Demander un retrait
        </Button>

      </div>

    </RepresentantLayout>
  );
}