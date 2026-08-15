import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { Button } from "@/components/ui/button";
import { useRepresentant } from "@/hooks/useRepresentant";

export default function PackRepresentant() {
  const { representant } = useRepresentant();

  return (
    <RepresentantLayout title="Mon Pack">
      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Mon Pack
        </h1>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="border rounded-xl p-6">

            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Pack actuel
            </h2>

            <p className="text-3xl font-bold text-gray-900">
              {representant?.pack || "-"}
            </p>

            <p className="mt-4 text-gray-900">
              Statut :
              <span className="font-bold text-green-600">
                {" "}{representant?.statut || "-"}
              </span>
            </p>

            <p className="mt-2 text-gray-900">
              Date d'activation :
              <strong>{" "}{representant?.date_activation || "-"}</strong>
            </p>

            <p className="mt-2 text-gray-900">
              Date d'expiration :
              <strong>{" "}{representant?.date_expiration || "-"}</strong>
            </p>

          </div>

          <div className="border rounded-xl p-6">

            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Avantages
            </h2>

            <ul className="space-y-3 text-gray-900">
              <li>✅ Commissions sur les ventes</li>
              <li>✅ Bonus de parrainage</li>
              <li>✅ Tableau de bord complet</li>
              <li>✅ QR Code personnel</li>
              <li>✅ Support prioritaire</li>
            </ul>

            <Button
              className="mt-8 w-full"
              onClick={() =>
                (window.location.href = "/representant/renouveler-pack")
              }
            >
              Renouveler mon Pack
            </Button>

          </div>

        </div>

      </div>
    </RepresentantLayout>
  );
}