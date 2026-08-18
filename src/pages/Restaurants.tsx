import { ArrowRight, Store, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";

const Restaurants = () => (
  <main className="min-h-[70vh] bg-background">
    <section className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Où voulez-vous commander ?</p>
        <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Choisissez votre espace restaurant</h1>
        <p className="mt-4 text-muted-foreground">Consultez le menu Fast-food Albarka ou découvrez les menus de nos restaurants partenaires.</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        <ChoiceCard
          to="/fast-food"
          icon={<UtensilsCrossed className="h-10 w-10" />}
          title="Fast-food"
          description="Burgers, grillades, boissons et plats Fast-food Albarka."
        />
        <ChoiceCard
          to="/restaurants-partenaires"
          icon={<Store className="h-10 w-10" />}
          title="Restaurants partenaires"
          description="Découvrez chaque restaurant partenaire et commandez directement dans son menu."
        />
      </div>
    </section>
  </main>
);

const ChoiceCard = ({ to, icon, title, description }: { to: string; icon: React.ReactNode; title: string; description: string }) => (
  <Link to={to} className="group flex min-h-64 flex-col justify-between rounded-3xl border bg-card p-7 shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-xl">
    <div>
      <span className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary">{icon}</span>
      <h2 className="mt-6 text-2xl font-bold">{title}</h2>
      <p className="mt-3 text-muted-foreground">{description}</p>
    </div>
    <span className="mt-7 flex items-center gap-2 font-semibold text-primary">Consulter <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></span>
  </Link>
);

export default Restaurants;
