import RepresentantLayout from "@/components/representant/RepresentantLayout";

export default function PerformancesRepresentant() {
  return (
    <RepresentantLayout title="Mes Performances">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-8">
          Mes Performances
        </h1>

        <div className="grid md:grid-cols-4 gap-6">

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Ventes réalisées</p>
            <h2 className="text-4xl font-bold text-green-600">
              128
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Clients obtenus</p>
            <h2 className="text-4xl font-bold text-blue-600">
              96
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Filleuls</p>
            <h2 className="text-4xl font-bold text-orange-500">
              18
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Chiffre d'affaires généré</p>
            <h2 className="text-2xl font-bold text-purple-600">
              8 750 000 FCFA
            </h2>
          </div>

        </div>

      </div>

    </RepresentantLayout>
  );
}