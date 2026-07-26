import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";

interface Props {
  children: ReactNode;
  title?: string;
}

export default function RepresentantLayout({
  children,
  title = "Espace Représentant",
}: Props) {
  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold">
              Albarka Trade
            </h1>

            <p className="text-sm opacity-90">
              {title}
            </p>
          </div>

          <div className="flex items-center gap-6">

            <Link
              to="/dashboard-representant"
              className="flex items-center gap-2 hover:text-yellow-300"
            >
              <ArrowLeft size={20} />
              Retour
            </Link>

            <Link
              to="/"
              className="flex items-center gap-2 hover:text-red-300"
            >
              <LogOut size={20} />
              Déconnexion
            </Link>

          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>

    </div>
  );
}