import { Hammer, Wrench, Zap, Paintbrush, Car, Shield, Home, Monitor, Sun, Droplets, Mail } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  startingPrice: number;
}

export const serviceCategories = [
  {
    id: "btp",
    name: "Construction et BTP",
    description: "Maçonnerie, plomberie, électricité, peinture et plus",
    icon: "Hammer",
    services: [
      { id: "maconnerie", name: "Maçonnerie", description: "Construction, rénovation, fondations", startingPrice: 50000 },
      { id: "plomberie", name: "Plomberie", description: "Dépannage urgent, installation, entretien", startingPrice: 15000 },
      { id: "electricite", name: "Électricité", description: "Installation, dépannage, câblage complet", startingPrice: 20000 },
      { id: "peinture", name: "Peinture", description: "Peinture intérieure et extérieure", startingPrice: 25000 },
      { id: "carrelage", name: "Carrelage", description: "Pose carreaux, dallage", startingPrice: 20000 },
      { id: "etancheite", name: "Étanchéité", description: "Toiture, terrasse, protection contre fuite", startingPrice: 50000 },
      { id: "terrassement", name: "Terrassement", description: "Nivellement terrain, préparation chantier", startingPrice: 80000 },
    ],
  },
  {
    id: "artisanat",
    name: "Artisanat et Industrie",
    description: "Menuiserie, soudure, verrerie, métallurgie",
    icon: "Wrench",
    services: [
      { id: "menuiserie", name: "Menuiserie", description: "Meubles, portes, fenêtres sur mesure", startingPrice: 30000 },
      { id: "soudure", name: "Soudure", description: "Travaux de soudure et métallurgie", startingPrice: 20000 },
      { id: "verrerie", name: "Verrerie", description: "Installation de vitres et miroirs", startingPrice: 15000 },
      { id: "aluminium", name: "Aluminium", description: "Baies vitrées, fenêtres modernes", startingPrice: 50000 },
      { id: "serrurerie", name: "Serrurerie", description: "Sécurité portes, dépannage serrures", startingPrice: 10000 },
      { id: "climatisation", name: "Climatisation", description: "Installation et maintenance clim", startingPrice: 40000 },
    ],
  },
  {
    id: "services-domestiques",
    name: "Services Domestiques",
    description: "Chauffeur, gardien, ménage",
    icon: "Home",
    services: [
      { id: "chauffeur", name: "Chauffeur", description: "Service de chauffeur privé professionnel", startingPrice: 100000 },
      { id: "gardien", name: "Gardiennage", description: "Surveillance 24h/24", startingPrice: 75000 },
      { id: "menage", name: "Ménage", description: "Service de nettoyage maison, bureau", startingPrice: 50000 },
      { id: "jardinier", name: "Jardinage", description: "Entretien espaces verts", startingPrice: 15000 },
    ],
  },
  {
    id: "it",
    name: "IT et Design",
    description: "Développement, design graphique, maintenance, marketing",
    icon: "Monitor",
    services: [
      { id: "web", name: "Création site web", description: "Sites vitrine, e-commerce", startingPrice: 250000 },
      { id: "mobile", name: "Application mobile", description: "Android & iOS", startingPrice: 500000 },
      { id: "marketing", name: "Marketing digital", description: "Publicité Facebook & Google", startingPrice: 50000 },
      { id: "design", name: "Design Graphique", description: "Logo, flyers, branding", startingPrice: 25000 },
      { id: "seo", name: "Référencement SEO", description: "Optimisation Google", startingPrice: 100000 },
      { id: "maintenance", name: "Maintenance IT", description: "Support et dépannage informatique", startingPrice: 10000 },
    ],
  },
  {
    id: "energie",
    name: "Énergie Solaire",
    description: "Installation et maintenance de panneaux solaires",
    icon: "Sun",
    services: [
      { id: "installation-solaire", name: "Installation Solaire", description: "Panneaux et systèmes complets", startingPrice: 500000 },
      { id: "maintenance-solaire", name: "Maintenance Solaire", description: "Entretien et réparation", startingPrice: 25000 },
    ],
  },
  {
    id: "courriers",
    name: "Courriers et Liaison",
    description: "Service de collecte et livraison de courriers",
    icon: "Mail",
    services: [
      { id: "collecte-courrier", name: "Collecte de Courriers", description: "Récupération de courriers et documents", startingPrice: 2000 },
      { id: "livraison-courrier", name: "Livraison de Courriers", description: "Envoi et distribution de courriers aux propriétaires", startingPrice: 2000 },
      { id: "liaison", name: "Service de Liaison", description: "Liaison complète entre expéditeurs et destinataires", startingPrice: 10000 },
      { id: "marchandise", name: "Transport marchandises", description: "Transport sécurisé", startingPrice: 30000 },
      { id: "moto", name: "Moto livraison", description: "Livraison express", startingPrice: 2500 },
    ],
  },
  {
    id: "food",
    name: "Restauration",
    description: "Repas, livraison, traiteur",
    icon: "Utensils",
    services: [
      { id: "livraison_repas", name: "Livraison repas", description: "Repas chaud livré", startingPrice: 2000 },
      { id: "traiteur", name: "Traiteur", description: "Événements, mariages", startingPrice: 100000 },
      { id: "grillade", name: "Grillades", description: "Poulet, viande grillée", startingPrice: 4000 },
    ],
    },
    {
     id: "securite",
     name: "Sécurité",
     description: "Protection et surveillance",
     icon: "Shield",
     services: [
      { id: "camera", name: "Vidéosurveillance", description: "Installation caméras", startingPrice: 100000 },
      { id: "alarme", name: "Alarme", description: "Installation systèmes sécurité", startingPrice: 50000 },
      { id: "gardiennage_pro", name: "Gardiennage pro", description: "Sécurité entreprise", startingPrice: 100000 },
    ],
  },
  {
    id: "nettoyage",
    name: "Nettoyage et Forage",
    description: "Services de nettoyage industriel et forage de puits",
    icon: "Droplets",
    services: [
      { id: "nettoyage-industriel", name: "Nettoyage Industriel", description: "Bureaux, usines, entrepôts", startingPrice: 100000 },
      { id: "forage", name: "Forage de Puits", description: "Forage et installation de pompes", startingPrice: 1500000 },
    ],
  },
];

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer,
  Wrench,
  Zap,
  Paintbrush,
  Car,
  Shield,
  Home,
  Monitor,
  Sun,
  Droplets,
  Mail,
};
