import RepresentantLayout from "@/components/representant/RepresentantLayout";

export default function FAQRepresentant() {
  return (
    <RepresentantLayout title="FAQ">

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-black mb-8">
          Questions fréquentes
        </h1>

        <div className="space-y-6">

          <div className="border rounded-xl p-5">
            <h2 className="font-bold text-black text-lg">
              Comment recevoir mes commissions ?
            </h2>
            <p className="mt-2 text-gray-600">
              Les commissions validées peuvent être retirées depuis la page « Mes Commissions », selon les conditions d'Albarka Trade.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h2 className="font-bold text-black text-lg">
              Comment parrainer un nouveau représentant ?
            </h2>
            <p className="mt-2 text-gray-600">
              Partagez votre lien de parrainage ou votre QR Code personnel. Toute inscription effectuée via votre lien sera rattachée à votre compte.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h2 className="font-bold text-black text-lg">
              Comment renouveler mon pack ?
            </h2>
            <p className="mt-2 text-gray-600">
              Rendez-vous dans « Acheter un Pack » pour choisir un nouveau pack ou renouveler votre abonnement.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h2 className="font-bold text-black text-lg">
              Que faire si j'ai oublié mon Code représentant ou mon PIN ?
            </h2>
            <p className="mt-2 text-gray-600">
              Contactez le service d'assistance afin de vérifier votre identité et réinitialiser vos accès.
            </p>
          </div>

        </div>

      </div>

    </RepresentantLayout>
  );
}