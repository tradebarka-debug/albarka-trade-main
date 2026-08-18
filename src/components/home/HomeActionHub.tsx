import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Handshake, Search, ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";

const actions = [
  { label: "Acheter", description: "Produits et bons plans", path: "/boutique", icon: ShoppingBag, color: "bg-amber-500" },
  { label: "Commander", description: "Repas et services", path: "/fast-food", icon: UtensilsCrossed, color: "bg-orange-500" },
  { label: "Livrer", description: "Colis et livraisons", path: "/livraisons", icon: Truck, color: "bg-sky-600" },
  { label: "Trouver un fournisseur", description: "Découvrir le réseau", path: "/suppliers", icon: Building2, color: "bg-emerald-600" },
  { label: "Devenir partenaire", description: "Rejoindre le réseau", path: "/devenir-partenaire", icon: Handshake, color: "bg-violet-600" },
];

const HomeActionHub = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(query.trim() ? `/boutique?recherche=${encodeURIComponent(query.trim())}` : "/boutique");
  };
  return (
  <section className="relative z-30 px-4 pb-5 pt-6 md:px-8 md:pt-10">
    <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-card p-5 shadow-xl md:p-8">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Albarka Trade International</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">ALBARKA TRADE</h1>
        <p className="mx-auto mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">La plateforme qui connecte produits, entreprises, restaurants, fournisseurs et services.</p>
      </div>
      <form id="recherche" onSubmit={submitSearch} className="relative mx-auto mb-6 max-w-2xl"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Que recherchez-vous ?" className="h-12 w-full rounded-2xl border border-input bg-background py-3 pl-12 pr-4 text-foreground outline-none ring-primary transition focus:ring-2" /></form>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        {actions.map(({ label, description, path, icon: Icon, color }) => (
          <Link key={label} to={path} className="group rounded-2xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md md:p-4">
            <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white ${color}`}><Icon className="h-5 w-5" /></span>
            <h3 className="font-bold text-foreground">{label}</h3>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
  );
};

export default HomeActionHub;
