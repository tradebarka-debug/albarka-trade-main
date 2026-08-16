import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Domain = "Fournisseur" | "Usine" | "Restaurant";

type PartnerRow = {
  id: string;
  domain: Domain;
  name: string;
  country: string | null;
  city: string | null;
  scope: "local" | "international" | null;
  status: string | null;
  certified: boolean;
};

const domainStyles: Record<Domain, string> = {
  Fournisseur: "bg-blue-500/15 text-blue-500",
  Usine: "bg-purple-500/15 text-purple-500",
  Restaurant: "bg-orange-500/15 text-orange-500",
};

const AdminPartnersDirectory = () => {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [domainFilter, setDomainFilter] = useState<"all" | Domain>("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "local" | "international">("all");
  const [search, setSearch] = useState("");

  const loadPartners = async () => {
    setLoading(true);
    const [suppliersRes, factoriesRes, restaurantsRes] = await Promise.all([
      supabase.from("suppliers" as any).select("id, company_name, country, city, scope, status, certified"),
      supabase.from("factories" as any).select("id, company_name, country, city, scope, status, certified"),
      supabase.from("restaurant_partners" as any).select("id, name, country, location, is_active"),
    ]);

    if (suppliersRes.error) { console.error(suppliersRes.error); toast.error("Impossible de charger les fournisseurs"); }
    if (factoriesRes.error) console.error(factoriesRes.error);
    if (restaurantsRes.error) { console.error(restaurantsRes.error); toast.error("Impossible de charger les restaurants"); }

    const suppliers: PartnerRow[] = (suppliersRes.data ?? []).map((row: any) => ({
      id: `supplier-${row.id}`,
      domain: "Fournisseur",
      name: row.company_name ?? "—",
      country: row.country,
      city: row.city,
      scope: row.scope === "international" ? "international" : "local",
      status: row.status === "active" ? "Actif" : "Masqué",
      certified: Boolean(row.certified),
    }));

    const factories: PartnerRow[] = (factoriesRes.data ?? []).map((row: any) => ({
      id: `factory-${row.id}`,
      domain: "Usine",
      name: row.company_name ?? "—",
      country: row.country,
      city: row.city,
      scope: row.scope === "international" ? "international" : "local",
      status: row.status === "active" ? "Actif" : "Masqué",
      certified: Boolean(row.certified),
    }));

    const restaurants: PartnerRow[] = (restaurantsRes.data ?? []).map((row: any) => ({
      id: `restaurant-${row.id}`,
      domain: "Restaurant",
      name: row.name ?? "—",
      country: row.country,
      city: row.location,
      scope: null,
      status: row.is_active ? "Actif" : "Masqué",
      certified: false,
    }));

    setPartners([...suppliers, ...factories, ...restaurants]);
    setLoading(false);
  };

  useEffect(() => { void loadPartners(); }, []);

  const filteredPartners = useMemo(() => {
    const term = search.trim().toLowerCase();
    return partners.filter((partner) => {
      if (domainFilter !== "all" && partner.domain !== domainFilter) return false;
      if (scopeFilter !== "all" && partner.scope !== scopeFilter) return false;
      if (term && !partner.name.toLowerCase().includes(term) && !(partner.country ?? "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [partners, domainFilter, scopeFilter, search]);

  const countByDomain = (domain: Domain) => partners.filter((partner) => partner.domain === domain).length;

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Fournisseurs</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{countByDomain("Fournisseur")}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Usines</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{countByDomain("Usine")}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Restaurants</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{countByDomain("Restaurant")}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Répertoire des partenaires</CardTitle>
            <p className="text-sm text-muted-foreground">{filteredPartners.length} / {partners.length} partenaire(s)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Rechercher un partenaire ou un pays…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            <div className="flex rounded-lg border p-1">
              <button type="button" onClick={() => setDomainFilter("all")} className={`rounded-md px-3 py-1.5 text-sm ${domainFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Tous</button>
              <button type="button" onClick={() => setDomainFilter("Fournisseur")} className={`rounded-md px-3 py-1.5 text-sm ${domainFilter === "Fournisseur" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Fournisseurs</button>
              <button type="button" onClick={() => setDomainFilter("Usine")} className={`rounded-md px-3 py-1.5 text-sm ${domainFilter === "Usine" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Usines</button>
              <button type="button" onClick={() => setDomainFilter("Restaurant")} className={`rounded-md px-3 py-1.5 text-sm ${domainFilter === "Restaurant" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Restaurants</button>
            </div>
            <div className="flex rounded-lg border p-1">
              <button type="button" onClick={() => setScopeFilter("all")} className={`rounded-md px-3 py-1.5 text-sm ${scopeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Toutes portées</button>
              <button type="button" onClick={() => setScopeFilter("local")} className={`rounded-md px-3 py-1.5 text-sm ${scopeFilter === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Locaux</button>
              <button type="button" onClick={() => setScopeFilter("international")} className={`rounded-md px-3 py-1.5 text-sm ${scopeFilter === "international" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Internationaux</button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Chargement…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-2">Partenaire</th><th className="p-2">Domaine</th><th className="p-2">Portée</th><th className="p-2">Pays / Ville</th><th className="p-2">Statut</th></tr></thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="border-b align-top">
                      <td className="p-2 font-medium">{partner.name}{partner.certified && <span className="ml-2 text-xs font-semibold text-yellow-500">✓ Certifié</span>}</td>
                      <td className="p-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${domainStyles[partner.domain]}`}>{partner.domain}</span></td>
                      <td className="p-2">{partner.scope === "international" ? "🌍 International" : partner.scope === "local" ? "📍 Local" : "—"}</td>
                      <td className="p-2">{partner.country}{partner.city ? ` / ${partner.city}` : ""}</td>
                      <td className="p-2">{partner.status}</td>
                    </tr>
                  ))}
                  {filteredPartners.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Aucun partenaire ne correspond à ces filtres.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartnersDirectory;
