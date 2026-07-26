import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { Button } from "@/components/ui/button";

export default function AssistanceRepresentant() {
  return (
    <RepresentantLayout title="Assistance">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-6">
          Centre d'assistance
        </h1>

        <p className="text-gray-600 mb-8">
          Notre équipe est disponible pour vous accompagner.
        </p>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">
              Téléphone
            </h2>
            <p>+225 XX XX XX XX XX</p>
          </div>

          <div className="border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">
              Email
            </h2>
            <p>contact@albarka-trade.com</p>
          </div>

          <div className="border rounded-xl p-6 md:col-span-2">
            <h2 className="text-xl font-bold mb-4">
              Besoin d'aide ?
            </h2>

            <textarea
              className="w-full border rounded-lg p-3 h-40"
              placeholder="Décrivez votre problème..."
            />

            <Button className="mt-4">
              Envoyer ma demande
            </Button>

          </div>

        </div>

      </div>

    </RepresentantLayout>
  );
}