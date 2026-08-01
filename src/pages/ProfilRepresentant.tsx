import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RepresentantLayout from "@/components/representant/RepresentantLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilRepresentant() {
    const [representant, setRepresentant] = useState(null);

    useEffect(() => {
        const fetchRepresentant = async () => {
            const representantId = localStorage.getItem("representantId");
            if (!representantId) return;

            const { data, error } = await supabase
                .from("representants")
                .select("*")
                .eq("id", representantId)
                .single();

            if (error) {
                console.error("Error fetching representant:", error);
                return;
            }

            setRepresentant(data ?? null);
        };

        fetchRepresentant();
    }, []);

    return (

        <RepresentantLayout title="Mon Profil">

            <h1 className="text-3xl font-bold mb-6">
                Mon Profil
            </h1>

            <Card className="max-w-3xl">
                <CardContent className="p-6 space-y-4">

                    <div>
                        <strong>Nom :</strong> {representant?.nom}
                    </div>

                    <div>
                        <strong>Prénom :</strong> {representant?.prenom}
                    </div>

                    <div>
                        <strong>Téléphone :</strong> {representant?.telephone}
                    </div>

                    <div>
                        <strong>Email :</strong> {representant?.email}
                    </div>

                    <div>
                        <strong>Pays :</strong> {representant?.pays}
                    </div>

                    <div>
                        <strong>Code Représentant :</strong> {representant?.code}
                    </div>

                    <div>
                        <strong>Code PIN :</strong> ••••
                    </div>

                    <Button
                        className="mt-2"
                        onClick={() => window.location.href = "/representant/nouveau-pin"}
                    >
                        Modifier mon Code PIN
                    </Button>
                    <div>
                        <strong>Code Parrain :</strong> {representant?.code_parrain}
                    </div>
                    <div>
                        <strong>Statut :</strong> {representant?.statut}
                    </div>

                    <Button
                        className="mt-4"
                        onClick={() => window.location.href = "/representant/modifier-profil"}
                    >
                        Modifier mon profil
                    </Button>

                </CardContent>
            </Card>

        </RepresentantLayout>
    );
}