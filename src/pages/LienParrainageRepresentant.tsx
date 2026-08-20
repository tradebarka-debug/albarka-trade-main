import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { Button } from "@/components/ui/button";
import { useRepresentant } from "@/hooks/useRepresentant";
import { toast } from "sonner";

export default function LienParrainageRepresentant() {
  const { representant } = useRepresentant();
  const lien = `${window.location.origin}/offres?promo=${encodeURIComponent(representant?.code ?? "")}`;

  return (
    <RepresentantLayout title="Mon Lien de Parrainage">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-black mb-6">
          Mon Lien de Parrainage
        </h1>

        <p className="text-gray-600 mb-6">
          Partagez ce lien : le client choisira la boutique ou un restaurant partenaire et votre code sera conservé.
        </p>

        <div className="border rounded-xl p-5 bg-gray-50 break-all">
          {lien}
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Clics</p>
            <h2 className="text-3xl font-bold text-blue-600">
              0
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Inscriptions</p>
            <h2 className="text-3xl font-bold text-green-600">
              {representant?.nombre_filleuls ?? 0}
            </h2>
          </div>

          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500">Taux de conversion</p>
            <h2 className="text-3xl font-bold text-orange-500">
              0%
            </h2>
          </div>

        </div>

        <Button className="mt-8" onClick={() => { void navigator.clipboard.writeText(lien); toast.success("Lien copié"); }}>
          Copier mon lien
        </Button>

      </div>

    </RepresentantLayout>
  );
}
