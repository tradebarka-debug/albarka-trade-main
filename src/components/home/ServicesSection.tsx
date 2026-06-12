import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Globe, HeadphonesIcon } from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "Logistique",
    description: "Transport et distribution de marchandises à travers le Burkina Faso et la sous-région",
    color: "primary",
  },
  {
    icon: Globe,
    title: "Import & Export",
    description: "Commerce international avec des partenaires de confiance dans le monde entier",
    color: "secondary",
  },
  {
    icon: HeadphonesIcon,
    title: "Support Partenaires",
    description: "Accompagnement personnalisé pour producteurs et distributeurs",
    color: "accent",
  },
];

const ServicesSection = () => {
  return (
    <section className="section-padding bg-card">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
            Services
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Nos <span className="text-secondary">Services</span>
          </h2>
          <div className="section-divider mx-auto mb-6" style={{ background: 'linear-gradient(135deg, hsl(152 60% 35%) 0%, hsl(152 50% 45%) 100%)' }} />
          <p className="text-muted-foreground text-lg">
            Des solutions professionnelles adaptées à vos besoins commerciaux
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group bg-background rounded-2xl p-8 border border-border card-hover text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-20 h-20 rounded-2xl bg-${service.color}/10 flex items-center justify-center mb-6 mx-auto group-hover:bg-${service.color}/20 transition-colors`}>
                <service.icon className={`w-10 h-10 text-${service.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link to="/services">
            <Button className="btn-secondary-glow gap-2 h-12 px-8 text-lg rounded-lg">
              Découvrir tous nos services
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;