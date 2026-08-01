import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";

export default function RepresentantHome() {
  return (
    <div className="min-h-screen bg-[#14110F] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">

        <img
          src="/logo.png"
          alt="Albarka Trade"
          className="w-28 h-28 mx-auto mb-8"
        />

        <h1 className="text-5xl font-bold text-orange-500 mb-6">
          Devenir Représentant
          <br />
          Albarka Trade
        </h1>

        <p className="text-xl text-gray-300 mb-12">
          Rejoignez le réseau international des représentants Albarka Trade
          et développez votre activité grâce à notre plateforme.
        </p>

        <div className="space-y-6">

          <Link to="/inscription-representant">
            <Button className="w-full h-16 text-xl bg-orange-500 hover:bg-orange-600">
              <UserPlus className="mr-3 h-6 w-6" />
              S'inscrire
            </Button>
          </Link>

          <Link to="/connexion-representant">
            <Button
              variant="outline"
              className="w-full h-16 text-xl"
            >
              <LogIn className="mr-3 h-6 w-6" />
              Se connecter
            </Button>
          </Link>

        </div>

      </div>
    </div>
  );
}