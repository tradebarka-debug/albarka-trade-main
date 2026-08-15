import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { useRepresentant } from "@/hooks/useRepresentant";

export default function DashboardRepresentant() {
    const { representant } = useRepresentant();
    const menu = [
        {
            title: "👤 Mon Profil",
            route: "/profil-representant",
        },
        {
            title: "📦 Mon Pack",
            route: "/pack-representant",
        },
        {
            title: "💰 Mes Commissions",
            route: "/commissions-representant",
        },
        {
            title: "📈 Mes Performances",
            route: "/performances-representant",
        },
        {
            title: "👥 Mes Filleuls",
            route: "/filleuls-representant",
        },
        {
            title: "🔗 Lien de Parrainage",
            route: "/lien-parrainage",
        },
        {
            title: "📱 QR Code Personnel",
            route: "/qrcode-representant",
        },
        {
            title: "🛒 Acheter un Pack",
            route: "/acheter-pack-representant",
        },
        {
            title: "🆘 Assistance",
            route: "/assistance-representant",
        },
        {
            title: "❓ FAQ",
            route: "/faq-representant",
        },
    ];
    return (
        <RepresentantLayout title="Tableau de bord Représentant">

            <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-8 shadow-xl mb-10">

                <h1 className="text-4xl font-bold">
                    Bienvenue,
                </h1>

                <h2 className="text-3xl font-bold mt-2">
                   {representant?.prenom} {representant?.nom}
                </h2>

                <div className="grid md:grid-cols-3 gap-6 mt-8">

                    <div>
                        <p className="text-sm opacity-80">Code Représentant</p>
                        <p className="text-xl font-bold">
                            {representant?.code}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm opacity-80">
                            Statut du compte
                        </p>

                        <p className="text-xl font-bold text-green-200">
                             {representant?.statut || "En attente"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm opacity-80">
                            Pack actuel
                        </p>

                        <p className="text-xl font-bold">
                           {representant?.pack || "Aucun pack"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm opacity-80">
                            Pays
                        </p>

                        <p className="text-xl">
                            {representant?.pays}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm opacity-80">
                            Téléphone
                        </p>

                        <p className="text-xl">
                            {representant?.telephone}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm opacity-80">
                            Solde disponible
                        </p>

                        <p className="text-2xl font-bold text-yellow-300">
                            {representant?.solde || 0} FCFA
                        </p>
                    </div>

                </div>

            </div>

            <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6">
                    Accès rapide
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menu.map((item) => (
                        <Link key={item.route} to={item.route}>
                            <Card className="hover:shadow-lg transition cursor-pointer">
                                <CardContent className="p-6 font-semibold">
                                    {item.title}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </RepresentantLayout>

    );
}