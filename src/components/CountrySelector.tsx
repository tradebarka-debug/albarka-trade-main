import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Country = { id: number; name: string; iso_code: string | null };
const flags: Record<string, string> = { BF: "🇧🇫", CI: "🇨🇮", ML: "🇲🇱", NE: "🇳🇪", TG: "🇹🇬", BJ: "🇧🇯", GH: "🇬🇭", SN: "🇸🇳", GN: "🇬🇳", NG: "🇳🇬" };

export default function CountrySelector() {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const sync = () => setOpen(!localStorage.getItem("country_id"));
    sync(); window.addEventListener("country-changed", sync); window.addEventListener("storage", sync);
    void (async () => { const { data, error } = await (supabase.from("countries") as any).select("id,name,iso_code").order("name"); if (error) console.error("Impossible de charger les pays", error); setCountries(data || []); })();
    return () => { window.removeEventListener("country-changed", sync); window.removeEventListener("storage", sync); };
  }, []);
  const select = (id: number) => { localStorage.setItem("country_id", String(id)); window.dispatchEvent(new CustomEvent("country-changed")); setOpen(false); window.location.reload(); };
  if (!open) return null;
  const visibleCountries = countries.filter((country) => country.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><h1 className="text-center text-2xl font-bold text-green-950">Choisissez votre pays</h1><p className="mt-2 text-center text-sm text-gray-600">Recherchez puis cliquez sur votre pays.</p><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un pays..." className="mt-5 h-12 w-full rounded-xl border border-gray-300 px-4 text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20" /><div className="mt-4 grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">{visibleCountries.map((country) => <button key={country.id} type="button" onClick={() => select(country.id)} className="rounded-xl border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900 transition hover:border-green-700 hover:bg-green-50">{flags[country.iso_code || ""] || "🌍"} {country.name}</button>)}</div>{countries.length === 0 && <p className="mt-6 text-center text-sm text-gray-500">Chargement des pays disponibles…</p>}{countries.length > 0 && visibleCountries.length === 0 && <p className="mt-6 text-center text-sm text-gray-500">Aucun pays trouvé.</p>}</div></div>;
}
