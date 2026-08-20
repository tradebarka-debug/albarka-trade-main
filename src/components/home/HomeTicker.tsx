import { BadgeCheck, MapPin, ShieldCheck, Truck } from "lucide-react";

const messages = [
  { icon: BadgeCheck, text: "Partenaires vérifiés" },
  { icon: Truck, text: "Livraison et services" },
  { icon: MapPin, text: "Des offres près de chez vous" },
  { icon: ShieldCheck, text: "Achats en toute confiance" },
];

export default function HomeTicker() {
  return <section className="overflow-hidden border-y border-primary/20 bg-primary text-primary-foreground" aria-label="Les avantages Albarka Trade"><div className="home-ticker flex w-max items-center py-2.5">{[...messages, ...messages].map(({ icon: Icon, text }, index) => <div key={`${text}-${index}`} className="flex shrink-0 items-center gap-2 px-7 text-xs font-semibold uppercase tracking-wider md:px-12 md:text-sm"><Icon className="h-4 w-4" aria-hidden="true" /><span>{text}</span><span className="ml-5 text-primary-foreground/50" aria-hidden="true">◆</span></div>)}</div></section>;
}
