import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "../integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Briefcase, MapPin, Clock, Users, Send, GraduationCap, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";

const jobListings = [
  {
    id: "maçon",
    title: "Maçon qualifié",
    category: "Construction & BTP",
    location: "Ouagadougou",
    type: "CDD",
    description: "Nous recherchons un maçon expérimenté pour rejoindre notre équipe de construction.",
    requirements: [
      "Minimum 3 ans d'expérience",
      "Maîtrise des techniques de maçonnerie",
      "Lecture de plans",
      "Travail en équipe",
    ],
  },
  {
    id: "plombier",
    title: "Plombier",
    category: "Construction & BTP",
    location: "Ouagadougou - Bobo-Dioulasso",
    type: "CDD",
    description: "Poste de plombier pour installations et réparations.",
    requirements: [
      "Expérience en plomberie",
      "Connaissance des normes",
      "Permis de conduire souhaité",
    ],
  },
  {
    id: "electricien",
    title: "Électricien",
    category: "Énergie",
    location: "Ouagadougou",
    type: "CDD",
    description: "Électricien pour installations résidentielles et commerciales.",
    requirements: [
      "Formation en électricité",
      "Habilitations électriques",
      "Minimum 2 ans d'expérience",
    ],
  },

  {
    id: "peintre",
    title: "Peintre Bâtiment",
    category: "Construction & BTP",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Travaux de peinture intérieure/extérieure.",
    requirements: ["Bonne finition"]
  },
  {
    id: "soudeur",
    title: "Soudeur",
    category: "Artisanat & Industrie",
    location: "Ouagadougou",
    type: "CDD",
    description: "Travaux de soudure métallique.",
    requirements: ["Expérience requise"]
  },
  {
    id: "menuisier",
    title: "Menuisier",
    category: "Artisanat & Industrie",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Fabrication et pose de meubles.",
    requirements: ["Expérience en menuiserie"]
  },
  {
    id: "technicien-solaire",
    title: "Technicien Solaire",
    category: "Énergie",
    location: "National",
    type: "CDD",
    description: "Installation de panneaux solaires.",
    requirements: ["Connaissance en solaire"]
  },
  {
    id: "informaticien",
    title: "Technicien Informatique",
    category: "Informatique",
    location: "Ouagadougou",
    type: "CDD",
    description: "Maintenance et support informatique.",
    requirements: ["Compétences techniques"]
  },
  {
    id: "infographe",
    title: "Infographe",
    category: "Informatique",
    location: "Ouagadougou",
    type: "CDD",
    description: "Création de visuels et design.",
    requirements: ["Maîtrise des outils design"]
  },
  {
    id: "coursier",
    title: "Coursier",
    category: "Transport",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Livraison rapide.",
    requirements: ["Connaissance de la ville"]
  },
  {
    id: "cuisinier",
    title: "Cuisinier Professionnel",
    category: "Restauration",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Préparation de repas.",
    requirements: ["Expérience en cuisine"]
  },
  {
    id: "mecanicien",
    title: "Mécanicien Auto",
    category: "Garage",
    location: "Ouagadougou",
    type: "CDD",
    description: "Réparation automobile.",
    requirements: ["Expérience mécanique"]
  },
  {
    id: "agent-commercial",
    title: "Agent Commercial",
    category: "Commerce",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Vente et prospection.",
    requirements: ["Bonne communication"]
  },
  {
    id: "nettoyage",
    title: "Agent de Nettoyage",
    category: "Services",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Nettoyage de locaux.",
    requirements: ["Sérieux"]
  },
  {
    id: "menage",
    title: "Femme de Ménage",
    category: "Services",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Entretien maison.",
    requirements: ["Discrétion"]
  },
  {
    id: "chauffeur",
    title: "Chauffeur Professionnel",
    category: "Services",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Chauffeur pour transport de personnes et livraisons.",
    requirements: [
      "Permis de conduire catégorie B/C",
      "Bonne connaissance de la ville",
      "Casier judiciaire vierge",
    ],
  },
  {
    id: "gardien",
    title: "Agent de Sécurité",
    category: "Services",
    location: "Ouagadougou",
    type: "Temps plein",
    description: "Gardien pour surveillance de sites.",
    requirements: [
      "Expérience en sécurité appréciée",
      "Disponibilité de nuit",
      "Bonne condition physique",
    ],
  },
  {
    id: "technicien-solaire",
    title: "Technicien Énergie Solaire",
    category: "Énergie",
    location: "National",
    type: "CDD",
    description: "Installation et maintenance de systèmes solaires.",
    requirements: [
      "Formation en énergie solaire",
      "Expérience en installation",
      "Permis de conduire",
    ],
  },
];

const trainingPrograms = [
  {
    id: "maconnerie",
    title: "Formation Maçonnerie",
    category: "Construction & BTP",
    duration: "3 mois",
    location: "Ouagadougou",
    price: "150 000 FCFA",
    description: "Apprenez les techniques de maçonnerie traditionnelle et moderne.",
    modules: [
      "Fondamentaux de la maçonnerie",
      "Lecture de plans",
      "Techniques de construction",
      "Sécurité sur chantier",
    ],
  },
  {
    id: "electricite",
    title: "Formation Électricité Bâtiment",
    category: "Énergie",
    duration: "2 mois",
    location: "Ouagadougou",
    price: "120 000 FCFA",
    description: "Formation complète en installation électrique résidentielle et commerciale.",
    modules: [
      "Bases de l'électricité",
      "Installation électrique",
      "Normes de sécurité",
      "Dépannage et maintenance",
    ],
  },
  {
    id: "solaire",
    title: "Formation Énergie Solaire",
    category: "Énergie",
    duration: "1 mois",
    location: "Ouagadougou",
    price: "100 000 FCFA",
    description: "Maîtrisez l'installation et la maintenance des systèmes solaires.",
    modules: [
      "Principes de l'énergie solaire",
      "Installation de panneaux",
      "Dimensionnement des systèmes",
      "Maintenance préventive",
    ],
  },
  {
    id: "plomberie",
    title: "Formation Plomberie",
    category: "Construction & BTP",
    duration: "2 mois",
    location: "Ouagadougou - Bobo-Dioulasso",
    price: "130 000 FCFA",
    description: "Devenez plombier professionnel avec notre formation pratique.",
    modules: [
      "Bases de la plomberie",
      "Installation sanitaire",
      "Réparation et dépannage",
      "Normes et réglementations",
    ],
  },
  {
    id: "informatique",
    title: "Formation Informatique Bureautique",
    category: "Informatique",
    duration: "1 mois",
    location: "Ouagadougou",
    price: "75 000 FCFA",
    description: "Maîtrisez les outils bureautiques essentiels pour le monde professionnel.",
    modules: [
      "Word et traitement de texte",
      "Excel et tableurs",
      "PowerPoint",
      "Internet et messagerie",
    ],
  },
  {
    id: "conduite",
    title: "Formation Conduite Professionnelle",
    category: "Services",
    duration: "1 mois",
    location: "Ouagadougou",
    price: "200 000 FCFA",
    description: "Obtenez votre permis de conduire professionnel catégorie B/C.",
    modules: [
      "Code de la route",
      "Conduite pratique",
      "Mécanique de base",
      "Sécurité routière",
    ],
  },
];

const Recrutement = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [position, setPosition] = useState("");
  const [education, setEducation] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState("");
  const [selectedJob, setSelectedJob] = useState<typeof jobListings[0] | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<typeof trainingPrograms[0] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    gender: "",
    education: "",
    experience: "",
    message: "",
  });
  const [trainingFormData, setTrainingFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    gender: "",
    education: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleTrainingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTrainingFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmitApplication = async () => {
    const year = new Date().getFullYear();
    const uniqueNumber = Date.now().toString().slice(-6);
    const trackingCode = `ATI-REC-${year}-${uniqueNumber}`;
    if (!formData.name || !formData.phone || !formData.experience) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const { error } = await supabase
      .from("applications" as any)
      .insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          age: formData.age,
          gender: formData.gender,
          education: formData.education,
          experience: formData.experience,
          message: formData.message,
          tracking_code: trackingCode,
          status: "En attente",
        },
      ]);

    if (error) {
      console.log("SUPABASE ERROR:", error);
      toast.error(error.message || "Erreur Supabase");
      return;
    }
    toast.success(`Candidature envoyée avec succès ! Votre numéro de suivi est : ${trackingCode}`);
    const whatsappMessage = `
Bonjour,

Je viens de soumettre ma candidature sur Albarka Trade International.

Nom : ${formData.name}
Téléphone : ${formData.phone}
Email : ${formData.email}
Ville : ${formData.city}
Âge : ${formData.age}
Genre : ${formData.gender}
Poste recherché : ${selectedJob?.title || "Candidature spontanée"}
Niveau d'étude : ${formData.education}
Expérience : ${formData.experience}

Message :
${formData.message}

Numéro de suivi :
${trackingCode}
`;

    window.open(
      `https://wa.me/22602029494?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank"
    );
    setFullName("");
    setPhone("");
    setEmail("");
    setProfile("");
    setSelectedJob(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      age: "",
      gender: "",
      education: "",
      experience: "",
      message: "",
    });
  };

  const handleSubmitTrainingRegistration = () => {
    const year = new Date().getFullYear();
    const trackingCode = `ATI-FOR-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!trainingFormData.name || !trainingFormData.phone) {
      toast.success(`Inscription envoyée avec succès ! Votre numéro de suivi est : ${trackingCode}`);
      return;
    }
    toast.success("Inscription envoyée avec succès! Nous vous contacterons pour les détails.");
    setSelectedTraining(null);
    setTrainingFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      age: "",
      gender: "",
      education: "",
      message: "",
    });
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Carrières & Formations
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2">
              Opportunités d'Emploi et Formations
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Rejoignez l'équipe Albarka Trade International ou développez vos compétences
              avec nos formations professionnelles.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Briefcase, value: `${jobListings.length}`, label: "Postes disponibles" },
              { icon: GraduationCap, value: `${trainingPrograms.length}`, label: "Formations" },
              { icon: Users, value: "50+", label: "Colaborateurs" },
              { icon: Clock, value: "48h", label: "Délai de réponse" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs for Jobs and Training */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Emplois
              </TabsTrigger>
              <TabsTrigger value="training" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                Formations
              </TabsTrigger>
            </TabsList>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Nous recrutons des professionnels qualifiés dans plusieurs domaines. </h2>
              <p className="text-sm md:text-base text-gray-400">Pour répondre efficacement aux besoins de nos clients.</p>
              <div className="grid gap-4">
                {jobListings.map((job, index) => (
                  <div
                    key={job.id}
                    className="bg-card rounded-xl p-5 md:p-6 border border-border card-hover animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded">
                            {job.category}
                          </span>
                          <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                            {job.type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg text-foreground mb-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <Button
                        variant="default"
                        onClick={() => setSelectedJob(job)}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Postuler
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10 mb-12 p-6 border border-yellow-500/30 rounded-2xl bg-black/30">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Vous ne trouvez pas votre domaine d’activité ?
                </h3>

                <p className="text-gray-300 mb-5">
                  Déposez une candidature spontanée et notre équipe analysera votre profil.
                </p>

                <button
                  onClick={() => {
                    document
                      .getElementById("formulaire-spontane")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}

                  className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
                >
                  Candidature spontanée
                </button>
              </div>
              <div className="grid gap-4">
                {trainingPrograms.map((training, index) => (
                  <div
                    key={training.id}
                    className="bg-card rounded-xl p-5 md:p-6 border border-border card-hover animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="bg-secondary/20 text-secondary-foreground text-xs font-medium px-2 py-1 rounded">
                            {training.category}
                          </span>
                          <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {training.duration}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg text-foreground mb-1">
                          {training.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {training.location}
                          </span>
                          <span className="font-semibold text-primary">
                            {training.price}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedTraining(training)}
                        className="gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        S'inscrire
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

            </TabsContent>
          </Tabs>
        </div>
      </section>
      <div
        id="formulaire-spontane"
        className="mt-16 p-6 rounded-2xl border border-yellow-500/30 bg-black/40"
      >
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          Formulaire de candidature spontanée
        </h3>

        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />

          <input
            type="tel"
            placeholder="Téléphone WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />

          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />
          <input
            type="text"
            placeholder="Ville"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />

          <input
            type="number"
            placeholder="Âge"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          >
            <option value="">Genre</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>

          <input
            type="text"
            placeholder="Poste recherché"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />

          <input
            type="text"
            placeholder="Niveau d'étude"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />
          <textarea
            placeholder="Présentez votre profil..."
            rows={5}
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border"
          />


          <button
            type="button"
            onClick={async () => {
              const trackingNumber = `ATI-REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
              const { error } = await supabase
                .from("spontaneous_applications" as any)
                .insert([
                  {
                    tracking_number: trackingNumber,
                    full_name: fullName,
                    phone: phone,
                    email: email,
                    profile: profile,
                    status: "nouveau",
                  },
                ]);
              if (error) {
                alert(JSON.stringify(error));
                console.log(error);
                return;
              }

              const message = `
Nouvelle candidature spontanée reçue

Nom : ${fullName}
Téléphone : ${phone}
Email : ${email}
Ville : ${city}
Âge : ${age}
Genre : ${formData.gender}
Poste recherché : ${position}
Niveau d'étude : ${education}

Profil :
${profile}

Numéro de suivi :
${trackingNumber}
`;

              window.open(
                `https://wa.me/22602029494?text=${encodeURIComponent(message)}`,
                "_blank"
              );
              setFullName("");
              setPhone("");
              setEmail("");
              setProfile("");
            }}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 rounded-xl transition"
          >
            Envoyer ma candidature
          </button>
        </div>
      </div>
      {/* Application Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Postuler - {selectedJob?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.location} • {selectedJob?.type}
            </DialogDescription>
          </DialogHeader>

          {/* Job Details */}
          <div className="bg-muted rounded-lg p-4 my-4">
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">{selectedJob?.description}</p>
            <h4 className="font-medium mb-2">Exigences</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {selectedJob?.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Application Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Votre nom complet"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="email">Email</Label>
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
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Ex : Ouagadougou"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="age">Âge</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Ex : 25"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender">Genre</Label>

            <select
  id="gender"
  name="gender"
  value={formData.gender}
  onChange={(e) =>
    setFormData({
      ...formData,
      gender: e.target.value,
    })
  }
  className="w-full p-3 rounded-lg bg-background border border-border"
>
                <option value="">Sélectionnez le genre</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
            <div>
              <Label htmlFor="education">Niveau d'étude</Label>
              <Input
                id="education"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="Ex : BAC, BEPC, BAC+2"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="experience">Expérience professionnelle *</Label>
              <Textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Décrivez votre expérience pertinente..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Ajoutez un message..."
                className="mt-1"
                rows={2}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              * Vous pouvez aussi envoyer votre CV par WhatsApp au +226 02 02 94 94 avec votre nom et le poste pour lequel vous postulez.
            </p>

            <Button
              variant="orangeMoney"
              className="w-full"
              onClick={handleSubmitApplication}
            >
              Envoyer ma candidature
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Training Registration Dialog */}
      <Dialog open={!!selectedTraining} onOpenChange={() => setSelectedTraining(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              S'inscrire - {selectedTraining?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTraining?.duration} • {selectedTraining?.location}
            </DialogDescription>
          </DialogHeader>

          {/* Training Details */}
          <div className="bg-muted rounded-lg p-4 my-4">
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">{selectedTraining?.description}</p>
            <h4 className="font-medium mb-2">Programme</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {selectedTraining?.modules.map((module, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  {module}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-lg font-bold text-primary">{selectedTraining?.price}</p>
              <p className="text-xs text-muted-foreground">Paiement en plusieurs tranches possible</p>
            </div>
          </div>

          {/* Registration Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="training-name">Nom complet *</Label>
              <Input
                id="training-name"
                name="name"
                value={trainingFormData.name}
                onChange={handleTrainingInputChange}
                placeholder="Votre nom complet"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="training-phone">Téléphone *</Label>
                <Input
                  id="training-phone"
                  name="phone"
                  value={trainingFormData.phone}
                  onChange={handleTrainingInputChange}
                  placeholder="+226 XX XX XX XX"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="training-email">Email</Label>
                <Input
                  id="training-email"
                  name="email"
                  type="email"
                  value={trainingFormData.email}
                  onChange={handleTrainingInputChange}
                  placeholder="votre@email.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="education">Niveau d'études</Label>
              <Input
                id="education"
                name="education"
                value={trainingFormData.education}
                onChange={handleTrainingInputChange}
                placeholder="Ex: BEPC, BAC, Licence..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="training-message">Message (optionnel)</Label>
              <Textarea
                id="training-message"
                name="message"
                value={trainingFormData.message}
                onChange={handleTrainingInputChange}
                placeholder="Questions ou remarques..."
                className="mt-1"
                rows={2}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              * Nous vous contacterons pour confirmer votre inscription et les modalités de paiement.
            </p>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleSubmitTrainingRegistration}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Confirmer mon inscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Recrutement;
