// src/pages/RepresentantHome.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    UserPlus,
    LogIn,
    DollarSign,
    Users,
    TrendingUp,
    Globe,
} from "lucide-react";

export default function RepresentantHome() {
    const packs = [
        { name: "Starter", price: "30 000 FCFA" },
        { name: "Bronze", price: "55 000 FCFA" },
        { name: "Argent", price: "95 000 FCFA" },
        { name: "Or", price: "160 000 FCFA" },
        { name: "Platine", price: "320 000 FCFA" },
        { name: "Diamant", price: "520 000 FCFA" },
    ];

    return (
        <div className="min-h-screen bg-white">

            {/* HERO */}
            <section className="bg-gradient-to-r from-green-700 to-green-500 text-white">
                <div className="container mx-auto px-6 py-24 text-center">

                    <h1 className="text-5xl font-bold mb-6">
                        Devenez Représentant Officiel Albarka Trade
                    </h1>

                    <p className="text-xl max-w-3xl mx-auto mb-10">
                        Rejoignez le réseau Albarka Trade et développez votre activité
                        grâce à nos produits, services et opportunités de commissions.
                    </p>

                    <div className="flex justify-center gap-4 flex-wrap">

                        <Link to="/devenir-representant">
                            <Button size="lg">
                                <UserPlus className="mr-2 h-5 w-5" />
                                S'inscrire
                            </Button>
                        </Link>

                        <Link to="/connexion-representant">
                            <Button size="lg" variant="secondary">
                                <LogIn className="mr-2 h-5 w-5" />
                                Se connecter
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* AVANTAGES */}

            <section className="py-20">
                <div className="container mx-auto px-6">

                    <h2 className="text-3xl font-bold text-center mb-12">
                        Pourquoi rejoindre Albarka ?
                    </h2>

                    <div className="grid md:grid-cols-4 gap-6">

                        <div className="border rounded-xl p-6 text-center">
                            <DollarSign className="mx-auto mb-4 text-green-600" size={45} />
                            <h3 className="font-bold">Commissions</h3>
                        </div>

                        <div className="border rounded-xl p-6 text-center">
                            <Users className="mx-auto mb-4 text-green-600" size={45} />
                            <h3 className="font-bold">Réseau</h3>
                        </div>

                        <div className="border rounded-xl p-6 text-center">
                            <TrendingUp className="mx-auto mb-4 text-green-600" size={45} />
                            <h3 className="font-bold">Croissance</h3>
                        </div>

                        <div className="border rounded-xl p-6 text-center">
                            <Globe className="mx-auto mb-4 text-green-600" size={45} />
                            <h3 className="font-bold">International</h3>
                        </div>

                    </div>
                </div>
            </section>

            {/* PACKS */}

            <section className="bg-gray-100 py-20">

                <div className="container mx-auto px-6">

                    <h2 className="text-3xl font-bold text-center mb-12">
                        Nos Packs
                    </h2>

                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5">

                        {packs.map((pack) => (
                            <div
                                key={pack.name}
                                className="bg-white rounded-xl shadow p-6 text-center"
                            >
                                <h3 className="font-bold text-lg">{pack.name}</h3>

                                <p className="text-green-700 font-bold mt-3">
                                    {pack.price}
                                </p>

                                <Button className="mt-5 w-full">
                                    Voir
                                </Button>
                            </div>
                        ))}

                    </div>

                </div>

            </section>

        </div>
    );
}