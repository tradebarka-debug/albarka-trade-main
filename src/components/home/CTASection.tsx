import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, MessageCircle, FileText } from "lucide-react";

const CTASection = () => {
  const countryId = Number(localStorage.getItem("country_id") || "1");
  const isBurkina = countryId === 1;
  const isCoteIvoire = countryId === 2;
  const countryName = isBurkina ? "Burkina Faso" : "Côte d'Ivoire";

  return (
    <section className="section-padding">
      <div className="container mx-auto">
        {/* Contact CTA */}
        <div className="bg-card rounded-3xl p-4 sm:p-8 md:p-12 border border-border animate-fade-in overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="min-w-0">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Contact
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
                Contactez-<span className="text-primary">Nous</span>
              </h2>
              <div className="section-divider mb-6" />
              <p className="text-muted-foreground mb-8">
               {`Notre équipe en ${countryName} est à votre disposition pour répondre à toutes vos demandes. Nous vous accompagnons dans tous vos projets.`}
              </p>

              {/* Contact Info */}
              <div className="space-y-4 mb-8">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-semibold text-foreground">{isBurkina ? "+226 02 02 94 94" : "+225 07 14 14 66 30"}</p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="break-all font-semibold text-foreground">contact@albarkatrade.com</p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-semibold text-foreground">{isBurkina ? "Ouagadougou, Burkina Faso" : "Abidjan, Côte d'Ivoire"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - CTA Buttons */}
            <div className="min-w-0 bg-background rounded-2xl p-4 sm:p-8 border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                Démarrez votre projet
              </h3>
              <div className="space-y-4">
                <Link to="/contact" className="block">
                  <Button className="btn-primary-glow h-auto min-h-14 w-full gap-2 whitespace-normal px-3 py-3 text-base sm:gap-3 sm:text-lg rounded-lg">
                    <FileText className="w-5 h-5 shrink-0" />
                    Demander un Devis
                  </Button>
                </Link>
                <a
                  href={
                    isBurkina
                      ? "https://wa.me/22602029494"
                      : "https://wa.me/2250714146630"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="h-auto min-h-14 w-full gap-2 whitespace-normal px-3 py-3 text-base sm:gap-3 sm:text-lg rounded-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all"
                  >
                    <MessageCircle className="w-5 h-5 shrink-0" />
                    Contacter via WhatsApp
                  </Button>
                </a>
                <a href={
                  isBurkina
                    ? "tel:+22602029494"
                    : "tel:+2250714146630"
                } className="block">
                  <Button
                    variant="outline"
                    className="h-auto min-h-14 w-full gap-2 whitespace-normal px-3 py-3 text-base sm:gap-3 sm:text-lg rounded-lg border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    <Phone className="w-5 h-5 shrink-0" />
                    Appeler maintenant
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
