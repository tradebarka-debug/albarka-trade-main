import { useState, useEffect } from "react";

export default function CountrySelector() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const syncCountry = () => {
      const country = localStorage.getItem("country_id");
      setOpen(!country);
    };

    syncCountry();

    window.addEventListener("country-changed", syncCountry);
    window.addEventListener("storage", syncCountry);

    return () => {
      window.removeEventListener("country-changed", syncCountry);
      window.removeEventListener("storage", syncCountry);
    };
  }, []);

  const selectCountry = (id: number) => {
    localStorage.setItem("selectedCountry", id.toString());
    localStorage.setItem("country_id", id.toString());
    window.dispatchEvent(new CustomEvent("country-changed"));
    setOpen(false);
    window.location.reload();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto p-8 relative">

        {/* En-tête */}
        <div className="flex-1 text-center">

          <img
            src="/maskable-icon.png"
            alt="Albarka Trade"
           className="w-16 h-16 object-contain mt-12"
          />

          <div>
            <h1 className="text-3xl font-bold text-green-900 text-center leading-tight">
              Bienvenue sur
              <br />
              Albarka Trade
            </h1>

            <p className="text-center text-lg text-gray-600 mt-3 leading-7">
              La plateforme de référence
              <br />
              pour acheter, vendre et développer votre activité.
            </p>

          </div>


        </div>
        {/* Description */}
        <p className="text-center text-gray-600 mt-8 mb-8 text-lg">
          Sélectionnez votre pays pour continuer.
        </p>

        {/* Burkina Faso */}
        <button
          type="button"
          onClick={() => selectCountry(1)}
          className="w-full py-4 rounded-xl bg-green-700 hover:bg-green-800 shadow-lg hover:scale-105 transition-all duration-300 text-white font-bold text-xl mb-4"
        >
          🇧🇫 Burkina Faso
        </button>

        {/* Côte d'Ivoire */}
        <button
          type="button"
          onClick={() => selectCountry(2)}
          className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-700 shadow-lg hover:scale-105 transition-all duration-300 text-white font-bold text-xl"
        >
          🇨🇮 Côte d'Ivoire
        </button>
        {/* Pied */}
        <p className="text-center text-xs text-gray-400 mt-8">
          © Albarka Trade International
        </p>

      </div>
    </div>
  );
}