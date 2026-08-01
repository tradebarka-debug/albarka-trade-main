import { Link } from "react-router-dom";

export default function Representant() {
  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-6">

      <div className="w-full max-w-lg bg-card border border-primary/20 rounded-2xl p-8 text-center">

        <div className="text-6xl mb-6">🚀</div>

        <h1 className="text-4xl font-bold text-primary mb-4">
          Espace Représentant
        </h1>

        <p className="text-gray-300 mb-10">
          Bienvenue dans l'espace des représentants officiels Albarka Trade.
          Choisissez une option pour continuer.
        </p>

        <Link
          to="/inscription-representant"
          className="block w-full bg-primary text-black text-xl font-bold py-4 rounded-xl mb-5 hover:scale-105 transition"
        >
          📝 S'inscrire
        </Link>

        <Link
          to="/connexion-representant"
          className="block w-full border-2 border-primary text-primary text-xl font-bold py-4 rounded-xl hover:bg-primary hover:text-black transition"
        >
          🔑 Se connecter
        </Link>

      </div>

    </div>
  );
}