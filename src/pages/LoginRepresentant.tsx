import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function LoginRepresentant() {
    const navigate = useNavigate();

    const [code, setCode] = useState("");
    const [pin, setPin] = useState("");

    const connexion = async () => {
        const { data, error } = await supabase.functions.invoke("representant-auth", {
            body: { action: "login", code, pin },
        });

        if (error || data?.error || !data?.representant) {
            alert(data?.error || "Code représentant ou PIN incorrect.");
            return;
        }

        localStorage.setItem("representantCode", data.representant.code);
        localStorage.setItem("representantSessionToken", data.sessionToken);
        navigate("/dashboard-representant");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-primary">

                <h1 className="text-3xl text-primary font-bold text-center mb-8">
                    Connexion Représentant
                </h1>

                <input
                    className="w-full p-4 rounded-xl mb-4"
                    placeholder="Code représentant"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />

                <input
                    type="password"
                    className="w-full p-4 rounded-xl mb-6"
                    placeholder="Code PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                />

                <div className="text-right mb-4">
                    <Link
                        to="/mot-de-passe-oublie"
                        className="text-sm text-primary hover:underline"
                    >
                        Mot de passe oublié ?
                    </Link>
                </div>
                
                <button
                    onClick={connexion}
                    className="w-full bg-primary text-black p-4 rounded-xl font-bold"
                >
                    Se connecter
                </button>


                <div className="text-center mt-4">
                    <Link
                        to="/inscription-representant"
                        className="text-white"
                    >
                        S'inscrire
                    </Link>
                </div>

            </div>
        </div>
    );
}