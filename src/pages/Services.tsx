import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Hammer, Wrench, Home, Monitor, Sun, Droplets, Mail, ArrowRight, Phone } from "lucide-react";
import { serviceCategories } from "@/data/services";
import BackButton from "@/components/BackButton";
import { toast } from "sonner";

const iconComponents = {
  Hammer,
  Wrench,
  Home,
  Monitor,
  Sun,
  Droplets,
  Mail,
};

const Services = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmitRequest = async () => {
    if (!formData.name || !formData.phone || !formData.description) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const year = new Date().getFullYear();

    const { data: lastRequest } = await supabase
      .from("service_requests" as any)
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    const nextId = lastRequest ? (lastRequest as any).id + 1 : 1;

    const trackingCode = `ATI-SER-${year}-${String(nextId).padStart(6, "0")}`;

    const { error } = await supabase
      .from("service_requests" as any)
      .insert([
        {
          name: formData.name,
          phone: formData.phone,
          service_type: "Service",
          message: formData.description,
          tracking_code: trackingCode,
          status: "En attente",
        },
      ]);

    if (error) {
      toast.error("Erreur lors de l'enregistrement");
      return;
    }

    toast.success(`Demande envoyée avec succès ! Numéro : ${trackingCode}`);
    const whatsappMessage = `Bonjour,

Je viens de soumettre une demande de service sur Albarka Trade International.

Nom : ${formData.name}
Téléphone : ${formData.phone}
Service : ${selectedService?.service?.name || "Service personnalisé"}
Numéro de suivi : ${trackingCode}

Merci.`;

    window.open(
      `https://wa.me/22602029494?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank"
    );
    setSelectedService(null);
    setFormData({ name: "", phone: "", description: "" });
  };
  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-secondary/10 via-background to-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-2xl">
            <span className="text-secondary font-medium text-sm uppercase tracking-wider">
              Nos Services
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2">
              Services Professionnels
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Une équipe qualifiée pour tous vos projets de construction, artisanat,
              énergie solaire et bien plus encore.
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-12">
            {serviceCategories.map((category, catIndex) => {
              const IconComponent = iconComponents[category.icon as keyof typeof iconComponents];
              return (
                <div
                  key={category.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${catIndex * 0.1}s` }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                      {IconComponent && <IconComponent className="w-7 h-7 text-secondary" />}
                    </div>
                    <div>
                      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                        {category.name}
                      </h2>
                      <p className="text-muted-foreground text-sm">{category.description}</p>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-card rounded-xl p-5 border border-border card-hover cursor-pointer group"
                        onClick={() => setSelectedService({ category: category.name, service })}
                      >
                        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">À partir de</p>
                            <p className="font-bold text-primary">
                              {formatPrice(service.startingPrice)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1 text-primary">
                            Demander
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Banner */}
      <section className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Besoin d'un devis personnalisé?</h3>
                <p className="opacity-80">Contactez-nous pour discuter de votre projet</p>
              </div>
            </div>
            <Button
              variant="orangeMoney"
              onClick={() => {
                setSelectedService({
                  category: "Demande personnalisée",
                  service: {
                    name: "Service personnalisé",
                    description: "Besoin non listé",
                    startingPrice: 0,
                  },
                });
              }}
            >
              Décrire mon besoin
            </Button>
          </div>
        </div>
      </section>

      {/* Service Request Dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Demande de Service
            </DialogTitle>
            <DialogDescription>
              {selectedService?.category} - {selectedService?.service.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Votre nom"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+226 XX XX XX XX"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description du besoin *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez votre projet ou besoin..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Prix indicatif à partir de{" "}
                <span className="font-bold text-primary">
                  {selectedService && formatPrice((selectedService as any).service.startingPrice)}
                </span>
              </p>
            </div>

            <Button
              variant="orangeMoney"
              className="w-full"
              onClick={handleSubmitRequest}
            >
              Envoyer la demande
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Services;
