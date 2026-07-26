import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RepresentantLayout from "@/components/representant/RepresentantLayout";

export default function ProfilRepresentant() {
    return (
    
    <RepresentantLayout title="Mon Profil">

            <h1 className="text-3xl font-bold mb-6">
                Mon Profil
            </h1>

            <Card className="max-w-3xl">
                <CardContent className="p-6 space-y-4">

                    <div>
                        <strong>Nom :</strong> —
                    </div>

                    <div>
                        <strong>Prénom :</strong> —
                    </div>

                    <div>
                        <strong>Téléphone :</strong> —
                    </div>

                    <div>
                        <strong>Email :</strong> —
                    </div>

                    <div>
                        <strong>Pays :</strong> —
                    </div>

                    <div>
                        <strong>Code Représentant :</strong> ATI-REP-000001
                    </div>

                    <div>
                        <strong>Code PIN :</strong> ••••••
                    </div>

                    <Button className="mt-2">
                        Modifier mon Code PIN
                    </Button>

                    <div>
                        <strong>Code Parrain :</strong> —
                    </div>
                    <div>
                        <strong>Statut :</strong> 🟢 Compte actif
                    </div>

                    <Button className="mt-4">
                        Modifier mon profil
                    </Button>

                </CardContent>
            </Card>

       </RepresentantLayout>
    );
}