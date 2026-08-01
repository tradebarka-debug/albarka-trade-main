import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function ConnexionRepresentant() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

 const handleLogin = async () => {
  if (!code || !pin) {
    alert("Veuillez renseigner votre Code Représentant et votre Code PIN.");
    return;
  }

  const { data, error } = await supabase
    .from("representants")
    .select("*")
    .eq("code", code)
    .eq("pin", pin)
    .single();

  if (error || !data) {
    alert("Code représentant ou Code PIN incorrect.");
    return;
  }

  localStorage.setItem("representantId", data.id);
  localStorage.setItem("representantCode", data.code);
  localStorage.setItem("representantEmail", data.email);

 navigate("/dashboard-representant");
};
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardContent className="p-8">

          <h1 className="text-3xl font-bold text-center mb-2">
            Connexion
          </h1>

          <p className="text-center text-gray-500 mb-8">
            Espace Représentant Albarka
          </p>

          <div className="space-y-5">

            <div>
              <label className="font-medium">
                Code Représentant
              </label>

              <div className="relative mt-2">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                <Input
                  className="pl-10"
                  placeholder="ATI-REP-000001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="font-medium">
                Code PIN
              </label>

              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                <Input
                  type="password"
                  className="pl-10"
                  placeholder="******"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
            </div>
            <div className="text-center mt-2 mb-6">
              <Link
                to="/mot-de-passe-oublie"
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Button
              className="w-full h-12 text-lg"
              onClick={handleLogin}
            >
              Se connecter
            </Button>

          </div>

        </CardContent>
      </Card>
    </div>
  );
}