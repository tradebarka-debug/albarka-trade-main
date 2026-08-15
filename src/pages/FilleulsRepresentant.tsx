import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { useRepresentant } from "@/hooks/useRepresentant";

export default function FilleulsRepresentant() {
  const { representant } = useRepresentant();
  return (
    <RepresentantLayout title="Mes Filleuls">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-8">
          Mes Filleuls
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Nombre de filleuls</p>
            <h2 className="text-4xl font-bold text-green-600">
             {representant?.nombre_filleuls ?? 0}
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Commissions générées</p>
            <h2 className="text-3xl font-bold text-blue-600">
             {representant?.commission_totale?.toLocaleString() ?? "0"} FCFA
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Filleuls actifs</p>
            <h2 className="text-4xl font-bold text-orange-500">
              0
            </h2>
          </div>

        </div>

        <table className="w-full border">

          <thead className="bg-gray-100">

            <tr>
              <th className="border p-3">Nom</th>
              <th className="border p-3">Téléphone</th>
              <th className="border p-3">Pays</th>
              <th className="border p-3">Statut</th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td className="border p-3">Rabo Ibrahim</td>
              <td className="border p-3">+226 XX XX XX XX</td>
              <td className="border p-3">Burkina Faso</td>
              <td className="border p-3 text-green-600">
                Actif
              </td>
            </tr>

          </tbody>

        </table>

      </div>

    </RepresentantLayout>
  );
}