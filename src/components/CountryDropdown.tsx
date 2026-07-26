import { useState } from "react";

export default function CountryDropdown() {
  const [open, setOpen] = useState(false);

  const countries = [
    { id: 1, code: "BF", flag: "🇧🇫", name: "Burkina Faso" },
    { id: 2, code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
    { id: 3, code: "GH", flag: "🇬🇭", name: "Ghana" },
    { id: 4, code: "TG", flag: "🇹🇬", name: "Togo" },
    { id: 5, code: "BJ", flag: "🇧🇯", name: "Bénin" },
    { id: 6, code: "ML", flag: "🇲🇱", name: "Mali" },
    { id: 7, code: "NE", flag: "🇳🇪", name: "Niger" },
    { id: 8, code: "SN", flag: "🇸🇳", name: "Sénégal" },
    { id: 9, code: "GN", flag: "🇬🇳", name: "Guinée" },
    { id: 10, code: "NG", flag: "🇳🇬", name: "Nigeria" },
  ];

  const current =
    Number(localStorage.getItem("country_id")) || 1;

  const selectCountry = (id: number) => {
    localStorage.setItem("country_id", id.toString());
    localStorage.setItem("selectedCountry", id.toString());
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-[#2B221C] border border-[#D4A017] px-3 py-2 text-white hover:bg-[#3A2F28]"
      >
        🌍
        <span className="text-xs font-semibold">
          {countries.find(c => c.id === current)?.code}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1F1A17] border border-[#D4A017] shadow-2xl overflow-hidden z-50">

          {countries.map((country) => (
            <button
              key={country.id}
              onClick={() => selectCountry(country.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition

              ${
                current === country.id
                  ? "bg-[#D4A017] text-black font-bold"
                  : "text-white hover:bg-[#D4A017] hover:text-black"
              }`}
            >
              <span className="text-xl">{country.flag}</span>

              <span>{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}