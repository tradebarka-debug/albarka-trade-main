import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { Button } from "@/components/ui/button";

export default function AcheterPackRepresentant() {
  return (
    <RepresentantLayout title="Acheter un Pack">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-8">
          Acheter ou Renouveler un Pack
        </h1>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="border rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold">Découverte</h2>
            <p className="text-3xl font-bold text-green-600 mt-4">
              100 000 FCFA
            </p>
            <Button className="mt-6 w-full">
              Choisir
            </Button>
          </div>

          <div className="border-2 border-green-600 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold">Visibilité</h2>
            <p className="text-3xl font-bold text-green-600 mt-4">
              500 000 FCFA
            </p>
            <Button className="mt-6 w-full">
              Choisir
            </Button>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold">Premium</h2>
            <p className="text-3xl font-bold text-green-600 mt-4">
              800 000 FCFA
            </p>
            <Button className="mt-6 w-full">
              Choisir
            </Button>
          </div>

        </div>

      </div>

    </RepresentantLayout>
  );
}