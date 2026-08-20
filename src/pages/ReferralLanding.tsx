import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ShoppingBag, Store } from "lucide-react";

export default function ReferralLanding() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("promo")?.trim().toUpperCase() || "";
  const suffix = code ? `?promo=${encodeURIComponent(code)}` : "";

  return <main className="min-h-[75vh] bg-gradient-to-b from-primary/10 to-background px-4 py-12 md:py-20"><div className="mx-auto max-w-4xl text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Albarka Trade</p><h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Que souhaitez-vous découvrir ?</h1><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Choisissez votre espace. Votre code promo sera conservé automatiquement.</p>{code && <p className="mx-auto mt-5 w-fit rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">Code : {code}</p>}<div className="mt-10 grid gap-6 md:grid-cols-2"><Choice to={`/boutique${suffix}`} icon={<ShoppingBag className="h-10 w-10" />} title="Boutique Albarka" text="Produits, promotions et bons plans." /><Choice to={`/restaurants-partenaires${suffix}`} icon={<Store className="h-10 w-10" />} title="Restaurants partenaires" text="Choisir un restaurant et consulter son menu." /></div></div></main>;
}

function Choice({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link to={to} className="group rounded-3xl border bg-card p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span><h2 className="mt-5 text-2xl font-bold">{title}</h2><p className="mt-2 text-muted-foreground">{text}</p><span className="mt-6 inline-flex items-center gap-2 font-semibold text-primary">Continuer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>;
}
