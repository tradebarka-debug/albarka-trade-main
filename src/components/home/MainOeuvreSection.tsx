import mainOeuvreClair from "../../assets/main-oeuvre.png";
import { Link } from "react-router-dom";
import { Users, ShieldCheck, Clock } from "lucide-react";
import { isBurkina, isCoteIvoire } from "@/data/country";

const MainOeuvreSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <img
            src={mainOeuvreClair}
            alt="Main d’œuvre qualifiée"
            className="w-full rounded-2xl shadow-2xl border border-gray-800 hover:scale-105 transition duration-500"
          />
        </div>

        <div>
          <span className="text-yellow-500 font-semibold uppercase">
            Recrutement
          </span>

          <h2 className="text-3xl md:text-5xl font-bold text-white mt-3 mb-4 leading-tight">
            Main d’<span className="text-yellow-500">œuvre</span> qualifiée
          </h2>

          <p className="text-gray-300 mb-6">
            Des professionnels sélectionnés selon vos besoins dans plusieurs domaines.
            Recrutement rapide, fiable et disponible 24h/24.
          </p>

          <a
            href="https://wa.me/22602029494"
            target="_blank"
            className="block"
          >
            <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition duration-300 cursor-pointer">
              <div className="bg-yellow-500/20 text-yellow-500 p-3 rounded-xl">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-2 tracking-wide">
                  Recrutement rapide
                </h3>
                <p className="text-gray-300">
                  Mise en relation efficace entre employeurs et professionnels qualifiés.
                </p>
              </div>
            </div>
            </a>

            <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition duration-300 cursor-pointer">
              <div className="bg-yellow-500/20 text-yellow-500 p-3 rounded-xl">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-2 tracking-wide">
                  Main d’œuvre qualifiée
                </h3>
                <p className="text-gray-300">
                  Des profils sélectionnés selon vos besoins dans plusieurs domaines.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition duration-300 cursor-pointer">
              <div className="bg-yellow-500/20 text-yellow-500 p-3 rounded-xl">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-2 tracking-wide">
                  Disponible 24h/24
                </h3>
                <p className="text-gray-300">
                  Un accompagnement réactif pour vos demandes de service et de recrutement.
                </p>
              </div>
            </div>
            </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <a
            href="https://wa.me/22602029494"
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            WhatsApp
          </a>

          <Link
            to="/recrutement"
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            Devis
          </Link>

          <Link
            to="/recrutement#offres"
            className="bg-gray-800 hover:bg-black text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            Postuler
          </Link>
        </div>
      </div>
    </section >
  );
};

export default MainOeuvreSection;