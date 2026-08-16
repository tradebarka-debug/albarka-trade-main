import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";

const Contact = () => {
  const countryId = Number(localStorage.getItem("country_id")) || 1;
  const isBurkina = countryId === 1;
  const phone = isBurkina ? "+226 02 02 94 94" : "+225 07 14 14 66 30";
  const whatsapp = isBurkina ? "22602029494" : "2250714146630";
  const address = isBurkina ? "Ouagadougou, Burkina Faso" : "Abidjan, Côte d'Ivoire";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.message) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      await emailjs.sendForm(
        "service_izftpo2",
        "template_wfaklgq",
        formRef.current,
        "Y0PA6mF1STpDecYjV"
      );

      toast.success("Message envoyé avec succès! Nous vous répondrons bientôt.");

      setFormData({
        name: "",
        email: "",
        phone: "",
        experience: "",
        subject: "",
        message: "",
      });

    } catch (error) {
      console.log(error);
      toast.error("Erreur lors de l'envoi du message");
    }

    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-2xl">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Contact
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2">
              Contactez-nous
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Une question, une demande de devis ou besoin d'informations?
              Notre équipe est à votre écoute.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="font-display text-xl font-bold">Informations</h2>

              <div className="space-y-4">
                <a
                  href={`tel:${whatsapp}`}
                  className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border card-hover"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Téléphone</h3>
                    <p className="text-muted-foreground">{phone}</p>
                    <p className="text-sm text-primary mt-1">Appeler maintenant →</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border card-hover"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6 text-emerald" />
                  </div>
                  <div>
                    <h3 className="font-semibold">WhatsApp</h3>
                    <p className="text-muted-foreground">{phone}</p>
                    <p className="text-sm text-emerald mt-1">Écrire sur WhatsApp →</p>
                  </div>
                </a>

                <a
                  href="mailto:contact@albarkatrade.com"
                  className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border card-hover"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground">contact@albarkatrade.com</p>
                    <p className="text-sm text-secondary mt-1">Envoyer un email →</p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Adresse</h3>
                    <p className="text-muted-foreground">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Horaires</h3>
                    <p className="text-muted-foreground">Lun - Sam: 8h - 18h</p>
                    <p className="text-muted-foreground">Dim: Fermé</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <h2 className="font-display text-xl font-bold mb-6">
                  Envoyez-nous un message
                </h2>

                <form ref={formRef} onSubmit={handleSubmit} className="grid gap-6">
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

                  <div>
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="votre@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Expérience</Label>
                    <Textarea
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre expérience..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Ex: Demande de devis, Question..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Écrivez votre message ici..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="orangeMoney"
                    size="lg"
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
