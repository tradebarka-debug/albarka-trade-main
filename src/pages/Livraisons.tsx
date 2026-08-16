import { ArrowRight, MapPin, Phone, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

const Livraisons = () => {
  const countryId = Number(localStorage.getItem("country_id")) || 1;
  const phone = countryId === 2 ? "+225 07 14 14 66 30" : "+226 02 02 94 94";
  const whatsapp = countryId === 2 ? "2250714146630" : "22602029494";
  const address = countryId === 2 ? "Abidjan, Côte d'Ivoire" : "Ouagadougou, Burkina Faso";

  return (
    <main className="bg-background min-h-screen text-foreground">
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-3xl">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Réseau de partenaires</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Livreurs</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Une solution de livraison rapide et fiable pour accompagner vos commandes, vos clients et vos partenaires efficacement.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto px-4 grid gap-6 md:grid-cols-3">
          <div className="bg-card border border-border rounded-2xl p-6">
            <Truck className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">Livraison rapide</h2>
            <p className="text-muted-foreground">
              Une logistique réactive pour garantir la fiabilité de vos livraisons et la satisfaction de vos clients.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <Phone className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">Contact direct</h2>
            <p className="text-muted-foreground">Contactez-nous pour organiser une livraison ou demander plus d’informations.</p>
            <a href={`tel:${whatsapp}`} className="text-primary font-semibold mt-3 inline-block">{phone}</a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <MapPin className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">Zone de service</h2>
            <p className="text-muted-foreground">{address}</p>
          </div>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="container mx-auto px-4 text-center">
          <Link to="/contact">
            <Button className="btn-primary-glow gap-2 h-12 px-8 text-lg rounded-lg">
              Nous contacter
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Livraisons;
