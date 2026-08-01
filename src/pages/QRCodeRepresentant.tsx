import RepresentantLayout from "@/components/representant/RepresentantLayout";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function QRCodeRepresentant() {
    const [representant, setRepresentant] = useState<any>(null);

    useEffect(() => {
        const code = localStorage.getItem("representantCode");

        if (!code) return;

        const chargerRepresentant = async () => {
            const { data, error } = await supabase
                .from("representants")
                .select("*")
                .eq("code", code)
                .single();

            if (error) {
                console.error(error);
                return;
            }

            setRepresentant(data as any);
        };

        chargerRepresentant();
    }, []);

    const codeRepresentant = representant?.code || "";

const lienParrainage =
`https://albarka-trade.com/inscription-representant?parrain=${codeRepresentant}`;
    return (
        <RepresentantLayout title="Mon QR Code">

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

                <h1 className="text-3xl font-bold text-black mb-6">
                    Mon QR Code
                </h1>

                <p className="text-gray-600 mb-8">
                    Faites scanner ce QR Code pour permettre aux clients ou futurs représentants d'accéder directement à votre lien de parrainage.
                </p>

                <div className="w-64 h-64 mx-auto border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50">
                    <QRCode
                        value={lienParrainage}
                        size={220}
                    />
                </div>

                <div className="mt-8 space-y-4">

                    <Button
                        className="w-full"
                        onClick={() => window.print()}
                    >
                        Télécharger le QR Code
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            navigator.clipboard.writeText(lienParrainage);
                            alert("Lien de parrainage copié.");
                        }}
                    >
                        Copier le lien de parrainage
                    </Button>

                </div>

            </div>

        </RepresentantLayout >
    );
}