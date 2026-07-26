import { Globe, Truck, Users } from "lucide-react";

const isBurkina = Number(localStorage.getItem("country_id") || "1") === 1;
const countryName = isBurkina ? "Burkina Faso" : "Côte d'Ivoire";
const AboutSection = () => {
  return (
    <section className="section-padding bg-card">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in max-w-xl">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              À Propos de Albarka Trade
            </span>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-6">
              QUI SOMMES-<span className="text-primary">NOUS</span> ?
            </h2>
            <div className="section-divider mb-6" />
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              <span className="text-primary font-semibold">Albarka Trade International</span>{" "}
              est un hub de distribution, de services et de recrutement qui connecte entreprises,
              producteurs et professionnels à des opportunités réelles{" "}
              {isBurkina
                ? "au Burkina Faso et dans la sous-région."
                : "en Côte d'Ivoire et en Afrique de l'Ouest."}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {isBurkina
                ? "Vous voulez vendre plus et dominer votre marché au Burkina Faso ? Lancez votre produit rapidement, développez vos ventes et créez un réseau commercial puissant."
                : "Vous voulez développer votre activité en Côte d'Ivoire ? Lancez votre produit rapidement, développez vos ventes et créez un réseau commercial puissant."
              }
            </p>
            <p className="text-base md:text-lg lg:text-xl font-semibold mb-10 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {isBurkina
                ? "Une plateforme unique pour distribuer, vendre et recruter efficacement au Burkina Faso."
                : "Une plateforme unique pour distribuer, vendre et recruter efficacement en Côte d'Ivoire."
              }
            </p>
            <button
              onClick={() => window.location.href = "/Devenir-representant"}
              className="mt-10 mb-12 px-8 py-4 bg-primary text-black text-1.9xl font-bold rounded-xl shadow-lg hover:scale-105 transition duration-300 flex items-center gap-3"
            >
              🚀 Devenir Représentant Officiel Albarka
            </button>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center sm:text-left">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Globe className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Import et Export</h4>
                <p className="text-sm text-muted-foreground">Commerce international</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Truck className="w-7 h-7 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Logistique</h4>
                <p className="text-sm text-muted-foreground">Distribution fiable</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Users className="w-7 h-7 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Partenariats</h4>
                <p className="text-sm text-muted-foreground">Support dédié</p>
              </div>
            </div>
          </div>

          {/* Right Content - Stats */}
          <div className="grid grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-background rounded-2xl p-8 text-center card-hover border border-border">
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{isBurkina ? "10+" : "15+"}</p>
              <p className="text-muted-foreground">Années d'expérience</p>
            </div>
            <div className="bg-background rounded-2xl p-8 text-center card-hover border border-border">
              <p className="text-4xl md:text-5xl font-bold text-secondary mb-2">{isBurkina ? "500+" : "1000+"}</p>
              <p className="text-muted-foreground">Clients satisfaits</p>
            </div>
            <div className="bg-background rounded-2xl p-8 text-center card-hover border border-border">
              <p className="text-4xl md:text-5xl font-bold text-accent mb-2">{isBurkina ? "+3" : "1"}</p>
              <p className="text-muted-foreground">Pays desservis</p>
            </div>
            <div className="bg-background rounded-2xl p-8 text-center card-hover border border-border">
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">100%</p>
              <p className="text-muted-foreground"> qualité garantie</p>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default AboutSection;