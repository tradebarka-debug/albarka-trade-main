import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, MapPin, MessageCircle, Snowflake, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type PublicTruck = {
  id: number;
  title: string;
  vehicle_type: string | null;
  brand: string | null;
  model: string | null;
  vehicle_condition: string | null;
  registration_country: string | null;
  registration_city: string | null;
  payload_tons: number | null;
  loading_volume_m3: number | null;
  has_air_conditioning: boolean;
  has_gps: boolean;
  rental_with_driver: boolean | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  km_rate: number | null;
  security_deposit: number | null;
  available_from: string | null;
  available_until: string | null;
  image_urls: string[];
  organization_name: string;
  organization_city: string | null;
  organization_telephone: string | null;
  organization_whatsapp: string | null;
};

const money = (value: number | null) => value == null ? null : `${Number(value).toLocaleString("fr-FR")} FCFA`;

export default function TruckRentals() {
  const [trucks, setTrucks] = useState<PublicTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: loadError } = await (supabase as any).rpc("get_public_available_trucks");
      if (!active) return;
      setTrucks((data || []) as PublicTruck[]);
      setError(loadError?.message || "");
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return <main className="min-h-screen bg-background pb-16">
    <section className="border-b bg-gradient-to-br from-primary/15 via-background to-secondary/10 py-14">
      <div className="container mx-auto px-4">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Retour à l’accueil</Link>
        <p className="font-semibold uppercase tracking-wider text-primary">Location professionnelle</p>
        <h1 className="mt-2 text-3xl font-bold md:text-5xl">Camions disponibles</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Comparez les capacités et les tarifs des camions proposés par nos compagnies de transport partenaires.</p>
      </div>
    </section>
    <section className="container mx-auto px-4 py-10">
      {loading ? <p className="py-16 text-center text-muted-foreground">Chargement des camions disponibles…</p> : error ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">Impossible de charger les camions : {error}</div> : trucks.length === 0 ? <div className="rounded-2xl border bg-card p-10 text-center"><Truck className="mx-auto h-12 w-12 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold">Aucun camion disponible actuellement</h2><p className="mt-2 text-muted-foreground">Les nouveaux camions actifs apparaîtront automatiquement ici.</p></div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{trucks.map(truck => {
        const phone = String(truck.organization_whatsapp || truck.organization_telephone || "").replace(/\D/g, "");
        const message = `Bonjour, je souhaite louer le camion « ${truck.title} » (référence ${truck.id}) publié sur Albarka Trade.`;
        const prices = [["Jour", truck.daily_rate], ["Semaine", truck.weekly_rate], ["Mois", truck.monthly_rate], ["Kilomètre", truck.km_rate]].filter(([, value]) => value != null) as [string, number][];
        return <article key={truck.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="aspect-[16/10] bg-muted">{truck.image_urls?.[0] ? <img src={truck.image_urls[0]} alt={truck.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Truck className="h-16 w-16 text-muted-foreground" /></div>}</div>
          <div className="space-y-4 p-5">
            <div><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{truck.title}</h2><span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-700">Disponible</span></div><p className="mt-1 text-sm text-muted-foreground">{[truck.vehicle_type, truck.brand, truck.model].filter(Boolean).join(" · ") || "Camion professionnel"}</p></div>
            <div className="grid grid-cols-2 gap-2 text-sm"><p>Charge : <strong>{truck.payload_tons ?? "—"} t</strong></p><p>Volume : <strong>{truck.loading_volume_m3 ?? "—"} m³</strong></p><p className="flex items-center gap-1"><MapPin className="h-4 w-4" />{truck.organization_city || "Localisation à confirmer"}</p><p>{truck.rental_with_driver ? "Avec chauffeur" : "Sans chauffeur"}</p>{truck.has_gps && <p className="flex items-center gap-1"><BadgeCheck className="h-4 w-4 text-primary" />GPS</p>}{truck.has_air_conditioning && <p className="flex items-center gap-1"><Snowflake className="h-4 w-4 text-primary" />Climatisation</p>}</div>
            {prices.length > 0 && <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-sm">{prices.map(([label, value]) => <p key={label}><span className="text-muted-foreground">{label}</span><br /><strong>{money(value)}</strong></p>)}</div>}
            <p className="text-sm text-muted-foreground">Proposé par <strong className="text-foreground">{truck.organization_name}</strong></p>
            {phone ? <a href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700"><MessageCircle className="mr-2 h-5 w-5" />Demander la location</a> : <Button asChild className="w-full"><Link to="/contact">Demander la location</Link></Button>}
          </div>
        </article>;
      })}</div>}
    </section>
  </main>;
}
