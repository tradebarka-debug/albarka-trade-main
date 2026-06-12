import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Bus, Calendar, MapPin, Users, QrCode, Phone, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Voyages = () => {
  const { data: transportCompanies = [] } = useQuery({
    queryKey: ["transport_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_companies")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: courierServices = [] } = useQuery({
    queryKey: ["courier_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_services")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [formData, setFormData] = useState({
    company: "",
    departure: "",
    destination: "",
    date: "",
    passengers: "1",
    name: "",
    phone: "",
  });
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCourrier, setSelectedCourrier] = useState<{ name: string; startingPrice: number } | null>(null);
  const [courrierForm, setCourrierForm] = useState({ name: "", phone: "", description: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitBooking = () => {
    if (!formData.company || !formData.departure || !formData.destination || !formData.date || !formData.name || !formData.phone) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setShowPayment(true);
  };

  const handleConfirmPayment = () => {
    toast.success("Demande de réservation envoyée! Nous vous contacterons pour confirmer.");
    setShowPayment(false);
    setFormData({
      company: "",
      departure: "",
      destination: "",
      date: "",
      passengers: "1",
      name: "",
      phone: "",
    });
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-emerald/10 via-background to-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <span className="text-emerald font-medium text-sm uppercase tracking-wider">
              Réservation
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2">
              Voyages et Courriers
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Réservez vos billets de bus et profitez de notre service de collecte 
              et livraison de courriers au Burkina Faso.
            </p>
          </div>
        </div>
      </section>

      {/* Transport Companies */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground mb-4">Compagnies partenaires</p>
          <div className="flex flex-wrap gap-4">
            {transportCompanies.map((company: any) => (
              <div
                key={company.id}
                className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full"
              >
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-6 h-6 rounded object-contain" />
                ) : (
                  <span className="text-xl">{company.logo}</span>
                )}
                <span className="text-sm font-medium">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {!showPayment ? (
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center">
                    <Bus className="w-6 h-6 text-emerald" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Réserver un Voyage</h2>
                    <p className="text-sm text-muted-foreground">Remplissez le formulaire ci-dessous</p>
                  </div>
                </div>

                <div className="grid gap-5">
                  {/* Company */}
                  <div>
                    <Label>Compagnie de transport *</Label>
                    <Select
                      value={formData.company}
                      onValueChange={(value) => handleSelectChange("company", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choisir une compagnie" />
                      </SelectTrigger>
                      <SelectContent>
                        {transportCompanies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.logo} {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Departure & Destination */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Ville de départ *</Label>
                      <Select
                        value={formData.departure}
                        onValueChange={(value) => handleSelectChange("departure", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Départ" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinations.map((d: any) => (
                            <SelectItem key={d.id} value={d.name}>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {d.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Ville d'arrivée *</Label>
                      <Select
                        value={formData.destination}
                        onValueChange={(value) => handleSelectChange("destination", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinations.map((d: any) => (
                            <SelectItem key={d.id} value={d.name}>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {d.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date & Passengers */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date de voyage *</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Nombre de passagers *</Label>
                      <Select
                        value={formData.passengers}
                        onValueChange={(value) => handleSelectChange("passengers", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {num} passager{num > 1 ? "s" : ""}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
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
                  </div>

                  <Button
                    variant="emerald"
                    size="lg"
                    className="w-full mt-4"
                    onClick={handleSubmitBooking}
                  >
                    Continuer vers le paiement
                  </Button>
                </div>
              </div>
            ) : (
              /* Payment Section */
              <div className="bg-primary/5 rounded-2xl p-6 md:p-8 border-2 border-primary/20 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Paiement Orange Money
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Effectuez le paiement et entrez la référence de transaction
                  </p>
                </div>

                {/* Booking Summary */}
                <div className="bg-card rounded-xl p-5 mb-6">
                  <h3 className="font-semibold mb-3">Résumé de la réservation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compagnie</span>
                      <span>{transportCompanies.find((c: any) => c.id === formData.company)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trajet</span>
                      <span>{formData.departure} → {formData.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{formData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Passagers</span>
                      <span>{formData.passengers}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-card rounded-xl p-6 max-w-xs mx-auto mb-6">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <QrCode className="w-24 h-24 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">QR Code Orange Money</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Numéro Orange Money</p>
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-xl font-bold">+226 02 02 94 94</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" size="lg" onClick={() => setShowPayment(false)}>
                    Retour
                  </Button>
                  <Button variant="orangeMoney" size="lg" onClick={handleConfirmPayment}>
                    J'ai effectué le paiement
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Courriers & Liaison Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Courriers et Liaison
              </h2>
              <p className="text-muted-foreground">
                Service de collecte et livraison de courriers
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courierServices.map((service: any) => (
              <div
                key={service.id}
                className="bg-card rounded-xl p-6 border border-border card-hover cursor-pointer group"
                onClick={() =>
                  setSelectedCourrier({ name: service.name, startingPrice: service.starting_price })
                }
              >
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                <div className="flex items-center justify-end">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Demander
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courrier Request Dialog */}
      <Dialog open={!!selectedCourrier} onOpenChange={() => setSelectedCourrier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Demande de Courrier
            </DialogTitle>
            <DialogDescription>
              {selectedCourrier?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="courrier-name">Nom complet *</Label>
              <Input
                id="courrier-name"
                value={courrierForm.name}
                onChange={(e) => setCourrierForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Votre nom"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="courrier-phone">Téléphone *</Label>
              <Input
                id="courrier-phone"
                value={courrierForm.phone}
                onChange={(e) => setCourrierForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+226 XX XX XX XX"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="courrier-desc">Description du besoin *</Label>
              <Textarea
                id="courrier-desc"
                value={courrierForm.description}
                onChange={(e) => setCourrierForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre besoin en courrier..."
                className="mt-1"
                rows={4}
              />
            </div>
            <Button
              variant="orangeMoney"
              className="w-full"
              onClick={() => {
                if (!courrierForm.name || !courrierForm.phone || !courrierForm.description) {
                  toast.error("Veuillez remplir tous les champs");
                  return;
                }
                toast.success("Demande de courrier envoyée! Nous vous contacterons bientôt.");
                setSelectedCourrier(null);
                setCourrierForm({ name: "", phone: "", description: "" });
              }}
            >
              Envoyer la demande
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Voyages;
