import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { Button } from "@/components/ui/button";

export default function PackRepresentant() {
  return (
    <RepresentantLayout title="Mon Pack">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-8">
          Mon Pack
        </h1>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="border rounded-xl p-6">

            <h2 className="text-xl font-bold mb-4">
              Pack actuel
            </h2>

            <p className="text-3xl font-bold text-green-700">
              Diamant
            </p>

            <p className="mt-4">
              Statut :
              <span className="font-bold text-green-600">
                {" "}Compte actif
              </span>
            </p>

            <p className="mt-2">
              Date d'activation :
              <strong> 15/07/2026</strong>
            </p>

            <p className="mt-2">
              Date d'expiration :
              <strong> 15/07/2027</strong>
            </p>

          </div>

          <div className="border rounded-xl p-6">

            <h2 className="text-xl font-bold mb-4">
              Avantages
            </h2>

            <ul className="space-y-3">

              <li>✅ Commissions sur les ventes</li>

              <li>✅ Bonus de parrainage</li>

              <li>✅ Tableau de bord complet</li>

              <li>✅ QR Code personnel</li>

              <li>✅ Support prioritaire</li>

            </ul>

            <Button className="mt-8 w-full">
              Renouveler mon Pack
            </Button>

          </div>

        </div>

      </div>

    </RepresentantLayout>
  );
}