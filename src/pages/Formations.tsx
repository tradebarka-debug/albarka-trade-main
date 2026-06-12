import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  Target, 
  BookOpen,
  Award,
  ArrowRight,
  Quote,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  trainingPrograms, 
  trainingSessions, 
  testimonials, 
  type TrainingProgram, 
  type TrainingSession 
} from "@/data/formations";

const Formations = () => {
  const [selectedTraining, setSelectedTraining] = useState<TrainingProgram | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [testimonialPage, setTestimonialPage] = useState(0);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    education: "",
    message: "",
    sessionId: "",
  });

  const categories = useMemo(() => {
    const cats = [...new Set(trainingPrograms.map(t => t.category))];
    return ["all", ...cats];
  }, []);

  const filteredPrograms = useMemo(() => {
    if (activeCategory === "all") return trainingPrograms;
    return trainingPrograms.filter(t => t.category === activeCategory);
  }, [activeCategory]);

  const getSessionsForTraining = (trainingId: string) => {
    return trainingSessions.filter(s => s.trainingId === trainingId);
  };

  const getTestimonialsForTraining = (trainingId: string) => {
    return testimonials.filter(t => t.trainingId === trainingId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSessionSelect = (sessionId: string) => {
    setFormData(prev => ({ ...prev, sessionId }));
    const session = trainingSessions.find(s => s.id === sessionId);
    setSelectedSession(session || null);
  };

  const handleRegister = (training: TrainingProgram) => {
    setSelectedTraining(training);
    setShowRegistrationDialog(true);
    setFormData(prev => ({ ...prev, sessionId: "" }));
    setSelectedSession(null);
  };

  const handleSubmitRegistration = () => {
    if (!formData.name || !formData.phone || !formData.sessionId) {
      toast.error("Veuillez remplir tous les champs obligatoires et choisir une session");
      return;
    }
    toast.success("Inscription envoyée avec succès! Nous vous contacterons pour les détails.");
    setShowRegistrationDialog(false);
    setSelectedTraining(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      age: "",
      education: "",
      message: "",
      sessionId: "",
    });
  };

  const formatDateRange = (start: string, end: string) => {
    return `${format(parseISO(start), "d MMM", { locale: fr })} - ${format(parseISO(end), "d MMM yyyy", { locale: fr })}`;
  };

  const getStatusBadge = (status: TrainingSession["status"]) => {
    switch (status) {
      case "open":
        return <Badge className="bg-secondary text-secondary-foreground">Inscriptions ouvertes</Badge>;
      case "full":
        return <Badge variant="destructive">Complet</Badge>;
      case "upcoming":
        return <Badge variant="outline">Prochainement</Badge>;
    }
  };

  const testimonialsPerPage = 3;
  const totalTestimonialPages = Math.ceil(testimonials.length / testimonialsPerPage);
  const visibleTestimonials = testimonials.slice(
    testimonialPage * testimonialsPerPage,
    (testimonialPage + 1) * testimonialsPerPage
  );

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary/10 via-background to-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <span className="text-secondary font-medium text-sm uppercase tracking-wider">
              Centre de Formation Professionnelle
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2">
              Formations Professionnelles
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Développez vos compétences avec nos formations certifiantes. 
              Des programmes pratiques adaptés au marché de l'emploi burkinabè.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="font-semibold">{trainingPrograms.length} formations</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
                <Award className="w-5 h-5 text-secondary" />
                <span className="font-semibold">Certifications reconnues</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
                <Users className="w-5 h-5 text-accent" />
                <span className="font-semibold">+500 formés</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Tabs */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="programs" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8">
              <TabsTrigger value="programs" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Programmes
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendrier
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-2">
                <Star className="w-4 h-4" />
                Témoignages
              </TabsTrigger>
            </TabsList>

            {/* Programs Tab */}
            <TabsContent value="programs">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat === "all" ? "Toutes" : cat}
                  </Button>
                ))}
              </div>

              {/* Programs Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program, index) => (
                  <div
                    key={program.id}
                    className="bg-card rounded-xl border border-border overflow-hidden card-hover animate-fade-in flex flex-col"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{program.category}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {program.duration}
                        </Badge>
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-2">
                        {program.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {program.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{program.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{program.price}</span>
                        <span className="text-xs text-muted-foreground">
                          {getSessionsForTraining(program.id).filter(s => s.status === "open").length} session(s) ouverte(s)
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-border p-4 bg-muted/30 flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedTraining(program)}
                      >
                        Détails
                      </Button>
                      <Button 
                        className="flex-1 gap-1"
                        onClick={() => handleRegister(program)}
                      >
                        S'inscrire
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <h2 className="font-display text-2xl font-bold mb-6">Calendrier des Sessions 2026</h2>
              <div className="space-y-4">
                {trainingPrograms.map((program) => {
                  const sessions = getSessionsForTraining(program.id);
                  return (
                    <div 
                      key={program.id}
                      className="bg-card rounded-xl border border-border p-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <Badge variant="secondary" className="mb-2">{program.category}</Badge>
                          <h3 className="font-display text-lg font-bold text-foreground">
                            {program.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Durée: {program.duration} • {program.price}
                          </p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sessions.map((session) => (
                          <div 
                            key={session.id}
                            className={`p-4 rounded-lg border ${
                              session.status === "full" 
                                ? "bg-destructive/5 border-destructive/20" 
                                : session.status === "open"
                                ? "bg-secondary/5 border-secondary/20"
                                : "bg-muted/50 border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {formatDateRange(session.startDate, session.endDate)}
                              </span>
                              {getStatusBadge(session.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>
                                {session.spotsAvailable}/{session.totalSpots} places disponibles
                              </span>
                            </div>
                            {session.status === "open" && (
                              <Button 
                                size="sm" 
                                className="w-full mt-3"
                                onClick={() => {
                                  setSelectedTraining(program);
                                  setFormData(prev => ({ ...prev, sessionId: session.id }));
                                  setSelectedSession(session);
                                  setShowRegistrationDialog(true);
                                }}
                              >
                                Réserver ma place
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Testimonials Tab */}
            <TabsContent value="testimonials">
              <h2 className="font-display text-2xl font-bold mb-6">
                Ce que disent nos anciens participants
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {visibleTestimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className="bg-card rounded-xl border border-border p-6 animate-fade-in relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < testimonial.rating ? "text-accent fill-accent" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="text-foreground mb-4 text-sm leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="border-t border-border pt-4">
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {testimonial.trainingTitle}
                      </Badge>
                      {testimonial.currentJob && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {testimonial.currentJob}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTestimonialPage(p => Math.max(0, p - 1))}
                  disabled={testimonialPage === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {testimonialPage + 1} sur {totalTestimonialPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTestimonialPage(p => Math.min(totalTestimonialPages - 1, p + 1))}
                  disabled={testimonialPage >= totalTestimonialPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Vous cherchez un emploi ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Découvrez nos offres d'emploi et rejoignez l'équipe Albarka Trade International.
          </p>
          <Link to="/recrutement">
            <Button size="lg" variant="outline" className="gap-2">
              <Briefcase className="w-5 h-5" />
              Voir les offres d'emploi
            </Button>
          </Link>
        </div>
      </section>

      {/* Training Details Dialog */}
      <Dialog open={!!selectedTraining && !showRegistrationDialog} onOpenChange={() => setSelectedTraining(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{selectedTraining?.category}</Badge>
              <Badge variant="outline">{selectedTraining?.duration}</Badge>
            </div>
            <DialogTitle className="font-display text-2xl">
              {selectedTraining?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {selectedTraining?.location}
              </span>
              <span className="font-semibold text-primary">{selectedTraining?.price}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Full Description */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Description
              </h4>
              <p className="text-muted-foreground text-sm">{selectedTraining?.fullDescription}</p>
            </div>

            {/* Objectives */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Objectifs
              </h4>
              <ul className="space-y-1">
                {selectedTraining?.objectives.map((obj, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            {/* Modules */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Modules de formation
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedTraining?.modules.map((module, i) => (
                  <div key={i} className="bg-muted rounded-lg px-3 py-2 text-sm">
                    {module}
                  </div>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Public cible
              </h4>
              <ul className="space-y-1">
                {selectedTraining?.targetAudience.map((target, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {target}
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Prérequis
              </h4>
              <ul className="space-y-1">
                {selectedTraining?.prerequisites.map((prereq, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>

            {/* Certification */}
            <div className="bg-secondary/10 rounded-lg p-4 flex items-center gap-3">
              <Award className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-xs text-muted-foreground">Certification délivrée</p>
                <p className="font-semibold">{selectedTraining?.certification}</p>
              </div>
            </div>

            {/* Testimonials for this training */}
            {selectedTraining && getTestimonialsForTraining(selectedTraining.id).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  Témoignages
                </h4>
                <div className="space-y-3">
                  {getTestimonialsForTraining(selectedTraining.id).slice(0, 2).map((t) => (
                    <div key={t.id} className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < t.rating ? "text-accent fill-accent" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">"{t.text}"</p>
                      <p className="text-xs font-medium">— {t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedTraining(null)}>
              Fermer
            </Button>
            <Button className="flex-1 gap-2" onClick={() => handleRegister(selectedTraining!)}>
              S'inscrire maintenant
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Inscription - {selectedTraining?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTraining?.location} • {selectedTraining?.duration} • {selectedTraining?.price}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Session Selection */}
            <div>
              <Label htmlFor="session">Choisir une session *</Label>
              <Select value={formData.sessionId} onValueChange={handleSessionSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionnez une session" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTraining && getSessionsForTraining(selectedTraining.id)
                    .filter(s => s.status !== "full")
                    .map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {formatDateRange(session.startDate, session.endDate)} 
                        ({session.spotsAvailable} places)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedSession && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSession.spotsAvailable} places restantes sur {selectedSession.totalSpots}
                </p>
              )}
            </div>

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
              <Label htmlFor="education">Niveau d'études</Label>
              <Input
                id="education"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="Ex: BEPC, BAC, Licence..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Ajoutez un message ou précisez vos attentes..."
                className="mt-1"
                rows={3}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              * Champs obligatoires. Nous vous contacterons dans les 48h pour confirmer votre inscription.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRegistrationDialog(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSubmitRegistration}>
                Confirmer l'inscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Formations;
