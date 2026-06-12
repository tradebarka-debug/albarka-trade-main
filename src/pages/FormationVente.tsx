import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  Target,
  BookOpen,
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
  Star,
  Quote,
  Briefcase,
  BarChart3,
  Handshake,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

const modules = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Fondamentaux de la Vente",
    description: "Psychologie de l'acheteur, cycle de vente, prospection et prise de contact efficace.",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Techniques de Négociation",
    description: "Argumentation commerciale, traitement des objections, techniques de closing.",
  },
  {
    icon: <Handshake className="w-6 h-6" />,
    title: "Relation Client",
    description: "Fidélisation, service après-vente, gestion des réclamations et satisfaction client.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Marketing & Stratégie Commerciale",
    description: "Étude de marché, positionnement, stratégies de prix et canaux de distribution.",
  },
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    title: "Vente en Ligne & Réseaux Sociaux",
    description: "E-commerce, vente sur les réseaux sociaux, marketing digital et publicité en ligne.",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Gestion d'Équipe Commerciale",
    description: "Leadership, motivation d'équipe, tableaux de bord et suivi des performances.",
  },
];

const objectives = [
  "Maîtriser les techniques de vente modernes adaptées au marché africain",
  "Savoir prospecter et convertir efficacement des clients",
  "Négocier avec confiance et conclure des ventes",
  "Gérer et fidéliser un portefeuille clients",
  "Utiliser les outils digitaux pour booster ses ventes",
  "Créer et piloter une stratégie commerciale performante",
];

const targetAudience = [
  "Entrepreneurs et commerçants souhaitant augmenter leurs ventes",
  "Jeunes diplômés cherchant une carrière dans le commerce",
  "Commerciaux souhaitant perfectionner leurs techniques",
  "Responsables d'équipes de vente",
  "Toute personne souhaitant se lancer dans la vente",
];

const testimonials = [
  {
    name: "Ousmane Kaboré",
    rating: 5,
    text: "Cette formation a transformé mon approche commerciale. Mes ventes ont augmenté de 40% en 3 mois après la formation. Les techniques enseignées sont directement applicables.",
    job: "Gérant de boutique - Marché Rood Woko",
  },
  {
    name: "Mariam Ouédraogo",
    rating: 5,
    text: "Excellente formation ! J'ai appris à utiliser les réseaux sociaux pour vendre mes produits. Aujourd'hui, 60% de mes ventes viennent d'Internet grâce aux techniques apprises.",
    job: "Vendeuse en ligne - Mode africaine",
  },
  {
    name: "Abdoulaye Sanou",
    rating: 5,
    text: "Le module sur la négociation m'a beaucoup aidé. Je sais maintenant comment convaincre mes clients et conclure des ventes plus importantes. Formation très pratique !",
    job: "Commercial - Société de distribution",
  },
];

const sessions = [
  { id: "vente-1", startDate: "3 Mars 2026", endDate: "3 Avril 2026", spots: 7, total: 15, status: "open" as const },
  { id: "vente-2", startDate: "1 Mai 2026", endDate: "1 Juin 2026", spots: 15, total: 15, status: "upcoming" as const },
  { id: "vente-3", startDate: "1 Août 2026", endDate: "1 Sept 2026", spots: 15, total: 15, status: "upcoming" as const },
];

const FormationVente = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    education: "",
    message: "",
  });

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour vous inscrire");
      navigate("/auth");
      return;
    }
    if (!formData.name || !formData.phone || !selectedSessionId) {
      toast.error("Veuillez remplir tous les champs obligatoires et choisir une session");
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from("formation_registrations").insert({
      user_id: user.id,
      session_id: selectedSessionId,
      full_name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      education: formData.education || null,
      message: formData.message || null,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
      console.error(error);
      return;
    }
    toast.success("Inscription envoyée avec succès ! Nous vous contacterons sous 24h.");
    setShowRegistration(false);
    setFormData({ name: "", email: "", phone: "", city: "", age: "", education: "", message: "" });
    setSelectedSessionId("");
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80"
            alt="Formation sur la vente"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/85 to-blue-800/60" />
        </div>
        <div className="container mx-auto relative z-10 px-4 py-20">
          <div className="max-w-2xl animate-fade-in">
            <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 mb-6 text-sm px-4 py-2">
              Formation Certifiante
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight font-display">
              Formation sur la <span className="text-secondary">Vente</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-4 leading-relaxed max-w-xl">
              Développez votre confiance, maîtrisez les techniques de vente et apprenez à convaincre avec méthode.
              Une formation pratique, complète et adaptée aux réalités du marché africain.
            </p>
            <div className="flex flex-wrap gap-6 mb-8 text-white/80 text-sm">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-secondary" /> Durée : 1 mois</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary" /> Ouagadougou</span>
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-secondary" /> Certification</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="btn-secondary-glow gap-2 h-12 px-8 text-lg rounded-lg"
                onClick={() => setShowRegistration(true)}
              >
                S'inscrire maintenant
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-lg rounded-lg border-white/30 text-white hover:bg-white/10"
                onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
              >
                Voir le programme
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Key Stats */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center" >
            <div>
              <p className="text-3xl font-bold text-primary">150 000</p>
              <p className="text-muted-foreground text-sm mt-1">FCFA seulement</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">+200</p>
              <p className="text-muted-foreground text-sm mt-1">Participants formés</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">95%</p>
              <p className="text-muted-foreground text-sm mt-1">Taux de satisfaction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">6</p>
              <p className="text-muted-foreground text-sm mt-1">Modules complets</p>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-16 mb-12 px-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10 text-center shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Qu’est-ce que le rejet ?
              </h2>

              <div className="space-y-5">
                <p className="text-lg md:text-xl font-semibold text-white">
                  Un état émotionnel.
                </p>

                <p className="text-lg md:text-xl text-gray-300">
                  Une réaction de protection.
                </p>

                <p className="text-lg md:text-xl font-bold text-yellow-400">
                  Ce n’est pas un jugement personnel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-secondary font-medium text-sm uppercase tracking-wider">Programme Complet</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              6 Modules de Formation
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Un programme structuré pour vous donner toutes les compétences commerciales nécessaires.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6 card-hover animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  {mod.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{mod.title}</h3>
                <p className="text-muted-foreground text-sm">{mod.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-secondary font-medium text-sm uppercase tracking-wider">Ce que vous apprendrez</span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-2 mb-6">
                Objectifs de la Formation
              </h2>
              <div className="space-y-4">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <p className="text-foreground">{obj}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-secondary font-medium text-sm uppercase tracking-wider">À qui s'adresse cette formation</span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-2 mb-6">
                Public Cible
              </h2>
              <div className="space-y-4">
                {targetAudience.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-secondary font-medium text-sm uppercase tracking-wider">Prochaines Dates</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              Sessions Disponibles
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`bg-card rounded-xl border p-6 text-center ${session.status === "open" ? "border-secondary/40 ring-1 ring-secondary/20" : "border-border"
                  }`}
              >
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">{session.startDate}</p>
                <p className="text-muted-foreground text-sm mb-3">au {session.endDate}</p>
                <Badge className={session.status === "open" ? "bg-secondary text-secondary-foreground" : ""} variant={session.status === "open" ? "default" : "outline"}>
                  {session.status === "open" ? "Inscriptions ouvertes" : "Prochainement"}
                </Badge>
                <p className="text-sm text-muted-foreground mt-3">
                  <Users className="w-4 h-4 inline mr-1" />
                  {session.spots}/{session.total} places
                </p>
                {session.status === "open" && (
                  <Button
                    className="w-full mt-4 gap-1"
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setShowRegistration(true);
                    }}
                  >
                    Réserver ma place <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-secondary font-medium text-sm uppercase tracking-wider">Témoignages</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              Ils ont suivi la formation
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 relative">
                <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < t.rating ? "text-accent fill-accent" : "text-muted"}`} />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div className="border-t border-border pt-3">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Briefcase className="w-3 h-3" /> {t.job}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Prêt à booster vos compétences en vente ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Inscrivez-vous dès maintenant et transformez votre carrière commerciale.
            Places limitées pour chaque session.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2 h-12 px-8" onClick={() => setShowRegistration(true)}>
              S'inscrire à la formation
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link to="/formations">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8">
                <BookOpen className="w-5 h-5" />
                Voir toutes les formations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Registration Dialog */}
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Inscription - Formation Vente</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire pour réserver votre place.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input id="name" name="name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Votre nom complet" />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+226 XX XX XX XX" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="votre@email.com" />
            </div>
            <div>
              <Label htmlFor="education">Niveau d'études</Label>
              <Input id="education" name="education" value={formData.education} onChange={(e) => setFormData(p => ({ ...p, education: e.target.value }))} placeholder="Ex: BAC, BTS, Licence..." />
            </div>
            <div>
              <Label>Session souhaitée *</Label>
              <div className="grid gap-2 mt-2">
                {sessions.filter(s => s.status === "open").map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedSessionId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="session"
                      value={s.id}
                      checked={selectedSessionId === s.id}
                      onChange={() => setSelectedSessionId(s.id)}
                      className="accent-primary"
                    />
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.startDate} - {s.endDate}</p>
                      <p className="text-xs text-muted-foreground">{s.spots} places restantes</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea id="message" name="message" value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} placeholder="Questions ou remarques..." rows={3} />
            </div>
            <Button className="w-full gap-2" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Confirmer l'inscription"}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main >
  );
};

export default FormationVente;
