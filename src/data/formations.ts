export interface TrainingProgram {
  id: string;
  title: string;
  category: string;
  duration: string;
  location: string;
  price: string;
  description: string;
  fullDescription: string;
  modules: string[];
  objectives: string[];
  targetAudience: string[];
  prerequisites: string[];
  certification: string;
}

export interface TrainingSession {
  id: string;
  trainingId: string;
  startDate: string;
  endDate: string;
  spotsAvailable: number;
  totalSpots: number;
  status: "open" | "full" | "upcoming";
}

export interface Testimonial {
  id: string;
  name: string;
  photo?: string;
  trainingId: string;
  trainingTitle: string;
  rating: number;
  text: string;
  date: string;
  currentJob?: string;
}

export const trainingPrograms: TrainingProgram[] = [
  {
    id: "maconnerie",
    title: "Formation Maçonnerie",
    category: "Construction & BTP",
    duration: "3 mois",
    location: "Ouagadougou",
    price: "150 000 FCFA",
    description: "Apprenez les techniques de maçonnerie traditionnelle et moderne.",
    fullDescription: "Cette formation complète vous permet d'acquérir toutes les compétences nécessaires pour devenir un maçon professionnel. Vous apprendrez les techniques traditionnelles africaines ainsi que les méthodes modernes de construction, avec un accent particulier sur la lecture de plans et la sécurité sur chantier.",
    modules: [
      "Fondamentaux de la maçonnerie",
      "Lecture de plans et schémas",
      "Techniques de construction traditionnelles",
      "Construction moderne et béton armé",
      "Sécurité sur chantier",
      "Finitions et enduits",
    ],
    objectives: [
      "Maîtriser les techniques de base de la maçonnerie",
      "Savoir lire et interpréter des plans de construction",
      "Construire des murs, fondations et structures",
      "Appliquer les normes de sécurité sur chantier",
    ],
    targetAudience: [
      "Jeunes sans emploi cherchant un métier",
      "Apprentis maçons souhaitant se perfectionner",
      "Personnes en reconversion professionnelle",
    ],
    prerequisites: [
      "Aucun diplôme requis",
      "Bonne condition physique",
      "Engagement et sérieux requises",
    ],
    certification: "Certificat de Maçon Professionnel - Niveau 1",
  },
  {
    id: "electricite",
    title: "Formation Électricité Bâtiment",
    category: "Énergie",
    duration: "2 mois",
    location: "Ouagadougou",
    price: "120 000 FCFA",
    description: "Formation complète en installation électrique résidentielle et commerciale.",
    fullDescription: "Devenez électricien bâtiment qualifié grâce à notre formation intensive. Vous apprendrez à réaliser des installations électriques conformes aux normes, du câblage à la mise en service, en passant par le dépannage et la maintenance.",
    modules: [
      "Bases de l'électricité et électronique",
      "Schémas et plans électriques",
      "Installation électrique résidentielle",
      "Installation commerciale et industrielle",
      "Normes de sécurité et habilitations",
      "Dépannage et maintenance",
    ],
    objectives: [
      "Comprendre les principes fondamentaux de l'électricité",
      "Réaliser des installations électriques conformes",
      "Diagnostiquer et réparer les pannes",
      "Respecter les normes de sécurité",
    ],
    targetAudience: [
      "Jeunes diplômés ou non",
      "Techniciens en reconversion",
      "Apprentis électriciens",
    ],
    prerequisites: [
      "Niveau BEPC souhaité",
      "Aucune expérience requise",
      "Intérêt pour les métiers techniques",
    ],
    certification: "Certificat d'Électricien Bâtiment",
  },
  {
    id: "solaire",
    title: "Formation Énergie Solaire",
    category: "Énergie",
    duration: "1 mois",
    location: "Ouagadougou",
    price: "100 000 FCFA",
    description: "Maîtrisez l'installation et la maintenance des systèmes solaires.",
    fullDescription: "L'énergie solaire est l'avenir de l'Afrique ! Cette formation vous prépare à installer, dimensionner et maintenir des systèmes solaires photovoltaïques pour particuliers et entreprises. Un secteur en pleine croissance avec d'excellentes perspectives d'emploi.",
    modules: [
      "Principes de l'énergie solaire photovoltaïque",
      "Composants des systèmes solaires",
      "Dimensionnement des installations",
      "Installation de panneaux solaires",
      "Câblage et connexions",
      "Maintenance préventive et corrective",
    ],
    objectives: [
      "Comprendre le fonctionnement des systèmes solaires",
      "Dimensionner une installation selon les besoins",
      "Installer des panneaux et équipements",
      "Assurer la maintenance des systèmes",
    ],
    targetAudience: [
      "Électriciens souhaitant se spécialiser",
      "Techniciens en énergie",
      "Personnes intéressées par les énergies renouvelables",
    ],
    prerequisites: [
      "Bases en électricité recommandées",
      "Capacité à travailler en hauteur",
      "Motivation pour les énergies vertes",
    ],
    certification: "Certificat de Technicien Solaire",
  },
  {
    id: "plomberie",
    title: "Formation Plomberie",
    category: "Construction & BTP",
    duration: "2 mois",
    location: "Ouagadougou / Bobo-Dioulasso",
    price: "130 000 FCFA",
    description: "Devenez plombier professionnel avec notre formation pratique.",
    fullDescription: "La plomberie est un métier essentiel et très demandé. Notre formation pratique vous apprend tous les aspects du métier : installation sanitaire, raccordements, réparations et dépannage. Vous serez prêt à travailler dès la fin de la formation.",
    modules: [
      "Bases de la plomberie",
      "Lecture de plans sanitaires",
      "Installation des équipements sanitaires",
      "Raccordements et soudure",
      "Réparation et dépannage",
      "Normes et réglementations",
    ],
    objectives: [
      "Installer des équipements sanitaires complets",
      "Réaliser des raccordements étanches",
      "Diagnostiquer et réparer les fuites",
      "Respecter les normes d'hygiène et de sécurité",
    ],
    targetAudience: [
      "Jeunes à la recherche d'un métier",
      "Aide-plombiers souhaitant se qualifier",
      "Personnes en reconversion",
    ],
    prerequisites: [
      "Aucun diplôme requis",
      "Habileté manuelle",
      "Bonne condition physique",
    ],
    certification: "Certificat de Plombier Professionnel",
  },
  {
    id: "informatique",
    title: "Formation Informatique Bureautique",
    category: "Informatique",
    duration: "1 mois",
    location: "Ouagadougou",
    price: "75 000 FCFA",
    description: "Maîtrisez les outils bureautiques essentiels pour le monde professionnel.",
    fullDescription: "Dans le monde professionnel actuel, la maîtrise des outils informatiques est indispensable. Cette formation vous permet d'acquérir les compétences bureautiques recherchées par les employeurs : traitement de texte, tableurs, présentations et communication en ligne.",
    modules: [
      "Initiation à l'informatique",
      "Microsoft Word - Traitement de texte",
      "Microsoft Excel - Tableurs et calculs",
      "Microsoft PowerPoint - Présentations",
      "Internet et messagerie professionnelle",
      "Gestion des fichiers et sécurité",
    ],
    objectives: [
      "Utiliser un ordinateur de manière autonome",
      "Créer des documents professionnels",
      "Gérer des données avec Excel",
      "Communiquer efficacement par email",
    ],
    targetAudience: [
      "Débutants en informatique",
      "Employés souhaitant se perfectionner",
      "Chercheurs d'emploi",
    ],
    prerequisites: [
      "Savoir lire et écrire",
      "Aucune expérience informatique requise",
    ],
    certification: "Attestation de Compétences Bureautiques",
  },
  {
    id: "conduite",
    title: "Formation Conduite Professionnelle",
    category: "Services",
    duration: "1 mois",
    location: "Ouagadougou",
    price: "200 000 FCFA",
    description: "Obtenez votre permis de conduire professionnel catégorie B/C.",
    fullDescription: "Cette formation complète vous prépare à obtenir votre permis de conduire professionnel et à exercer le métier de chauffeur. Elle inclut le code de la route, la conduite pratique intensive, les bases de mécanique et la sécurité routière.",
    modules: [
      "Code de la route complet",
      "Conduite pratique véhicule léger",
      "Conduite poids lourds (option)",
      "Mécanique de base",
      "Sécurité routière",
      "Gestion des situations d'urgence",
    ],
    objectives: [
      "Obtenir le permis de conduire catégorie B",
      "Maîtriser la conduite en ville et sur route",
      "Connaître les bases de la mécanique auto",
      "Adopter une conduite sécuritaire",
    ],
    targetAudience: [
      "Personnes souhaitant obtenir leur permis",
      "Futurs chauffeurs professionnels",
      "Livreurs et coursiers",
    ],
    prerequisites: [
      "Âge minimum 18 ans",
      "Casier judiciaire vierge",
      "Certificat médical d'aptitude",
    ],
    certification: "Permis de conduire catégorie B/C",
  },
  {
    id: "vente",
    title: "Formation sur la Vente",
    category: "Commerce",
    duration: "1 mois",
    location: "Ouagadougou",
    price: "150 000 FCFA",
    description: "Maîtrisez l'art de la vente et boostez votre carrière commerciale avec notre formation certifiante.",
    fullDescription: "Cette formation complète, pratique et adaptée au marché africain vous permet de développer toutes les compétences nécessaires pour exceller dans le domaine commercial. Apprenez les techniques de négociation, le marketing digital, la gestion de la relation client et bien plus encore.",
    modules: [
      "Techniques de Négociation Commerciale",
      "Marketing et Stratégie de Vente",
      "Gestion de la Relation Client (CRM)",
      "Communication Persuasive",
      "E-commerce et Vente en Ligne",
      "Leadership Commercial et Management",
    ],
    objectives: [
      "Maîtriser les techniques de négociation avancées",
      "Développer une stratégie marketing efficace",
      "Fidéliser et gérer un portefeuille clients",
      "Utiliser les outils digitaux pour la vente",
    ],
    targetAudience: [
      "Commerciaux et vendeurs souhaitant se perfectionner",
      "Entrepreneurs et créateurs d'entreprise",
      "Étudiants en commerce et marketing",
      "Toute personne souhaitant développer ses compétences en vente",
    ],
    prerequisites: [
      "Aucun diplôme requis",
      "Motivation et ambition commerciale",
      "Intérêt pour le domaine de la vente",
    ],
    certification: "Certificat de Spécialiste en Vente - Albarka Trade",
  },
];

export const trainingSessions: TrainingSession[] = [
  // Maçonnerie sessions
  { id: "mac-1", trainingId: "maconnerie", startDate: "2026-02-03", endDate: "2026-04-30", spotsAvailable: 8, totalSpots: 15, status: "open" },
  { id: "mac-2", trainingId: "maconnerie", startDate: "2026-05-04", endDate: "2026-07-31", spotsAvailable: 15, totalSpots: 15, status: "upcoming" },
  { id: "mac-3", trainingId: "maconnerie", startDate: "2026-09-01", endDate: "2026-11-30", spotsAvailable: 15, totalSpots: 15, status: "upcoming" },
  
  // Électricité sessions
  { id: "elec-1", trainingId: "electricite", startDate: "2026-01-20", endDate: "2026-03-20", spotsAvailable: 3, totalSpots: 12, status: "open" },
  { id: "elec-2", trainingId: "electricite", startDate: "2026-04-01", endDate: "2026-05-31", spotsAvailable: 12, totalSpots: 12, status: "upcoming" },
  { id: "elec-3", trainingId: "electricite", startDate: "2026-07-01", endDate: "2026-08-31", spotsAvailable: 12, totalSpots: 12, status: "upcoming" },
  
  // Solaire sessions
  { id: "sol-1", trainingId: "solaire", startDate: "2026-02-10", endDate: "2026-03-10", spotsAvailable: 5, totalSpots: 10, status: "open" },
  { id: "sol-2", trainingId: "solaire", startDate: "2026-04-15", endDate: "2026-05-15", spotsAvailable: 10, totalSpots: 10, status: "upcoming" },
  { id: "sol-3", trainingId: "solaire", startDate: "2026-06-01", endDate: "2026-07-01", spotsAvailable: 10, totalSpots: 10, status: "upcoming" },
  
  // Plomberie sessions
  { id: "plomb-1", trainingId: "plomberie", startDate: "2026-02-17", endDate: "2026-04-17", spotsAvailable: 0, totalSpots: 12, status: "full" },
  { id: "plomb-2", trainingId: "plomberie", startDate: "2026-05-01", endDate: "2026-06-30", spotsAvailable: 12, totalSpots: 12, status: "upcoming" },
  { id: "plomb-3", trainingId: "plomberie", startDate: "2026-08-01", endDate: "2026-09-30", spotsAvailable: 12, totalSpots: 12, status: "upcoming" },
  
  // Informatique sessions
  { id: "info-1", trainingId: "informatique", startDate: "2026-01-27", endDate: "2026-02-27", spotsAvailable: 6, totalSpots: 20, status: "open" },
  { id: "info-2", trainingId: "informatique", startDate: "2026-03-10", endDate: "2026-04-10", spotsAvailable: 20, totalSpots: 20, status: "upcoming" },
  { id: "info-3", trainingId: "informatique", startDate: "2026-05-05", endDate: "2026-06-05", spotsAvailable: 20, totalSpots: 20, status: "upcoming" },
  
  // Conduite sessions
  { id: "cond-1", trainingId: "conduite", startDate: "2026-02-01", endDate: "2026-03-01", spotsAvailable: 4, totalSpots: 8, status: "open" },
  { id: "cond-2", trainingId: "conduite", startDate: "2026-03-15", endDate: "2026-04-15", spotsAvailable: 8, totalSpots: 8, status: "upcoming" },
  { id: "cond-3", trainingId: "conduite", startDate: "2026-05-01", endDate: "2026-06-01", spotsAvailable: 8, totalSpots: 8, status: "upcoming" },
  
  // Vente sessions
  { id: "vent-1", trainingId: "vente", startDate: "2026-03-01", endDate: "2026-03-31", spotsAvailable: 10, totalSpots: 20, status: "open" },
  { id: "vent-2", trainingId: "vente", startDate: "2026-05-01", endDate: "2026-05-31", spotsAvailable: 20, totalSpots: 20, status: "upcoming" },
  { id: "vent-3", trainingId: "vente", startDate: "2026-07-01", endDate: "2026-07-31", spotsAvailable: 20, totalSpots: 20, status: "upcoming" },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Moussa Ouédraogo",
    trainingId: "maconnerie",
    trainingTitle: "Formation Maçonnerie",
    rating: 5,
    text: "Grâce à cette formation, j'ai pu créer ma propre entreprise de construction. Les formateurs sont très compétents et la pratique sur chantier m'a donné la confiance nécessaire pour me lancer. Je recommande vivement !",
    date: "2025-11-15",
    currentJob: "Chef d'entreprise - Construction Moussa & Fils",
  },
  {
    id: "t2",
    name: "Fatimata Compaoré",
    trainingId: "electricite",
    trainingTitle: "Formation Électricité Bâtiment",
    rating: 5,
    text: "En tant que femme, je pensais que ce métier n'était pas pour moi. Albarka m'a prouvé le contraire ! Aujourd'hui je suis électricienne qualifiée et je travaille sur de grands chantiers. Une formation qui change la vie.",
    date: "2025-10-20",
    currentJob: "Électricienne - Entreprise SOGEBAT",
  },
  {
    id: "t3",
    name: "Ibrahim Sawadogo",
    trainingId: "solaire",
    trainingTitle: "Formation Énergie Solaire",
    rating: 5,
    text: "L'énergie solaire est l'avenir au Burkina ! La formation m'a permis de comprendre tous les aspects techniques. Maintenant je travaille pour une grande entreprise d'installation solaire avec un bon salaire.",
    date: "2025-09-05",
    currentJob: "Technicien Solaire - SolarBurkina SA",
  },
  {
    id: "t4",
    name: "Adama Traoré",
    trainingId: "plomberie",
    trainingTitle: "Formation Plomberie",
    rating: 4,
    text: "Formation très pratique avec beaucoup d'exercices sur le terrain. Les formateurs prennent le temps d'expliquer. J'aurais aimé plus de temps sur la soudure, mais globalement excellent !",
    date: "2025-08-12",
    currentJob: "Plombier indépendant",
  },
  {
    id: "t5",
    name: "Salamata Zongo",
    trainingId: "informatique",
    trainingTitle: "Formation Informatique Bureautique",
    rating: 5,
    text: "Je n'avais jamais touché un ordinateur avant cette formation. Maintenant je maîtrise Word, Excel et Internet. Ça m'a permis de trouver un emploi de secrétaire. Merci Albarka !",
    date: "2025-07-28",
    currentJob: "Secrétaire Administrative",
  },
  {
    id: "t6",
    name: "Boureima Kaboré",
    trainingId: "conduite",
    trainingTitle: "Formation Conduite Professionnelle",
    rating: 5,
    text: "Formation sérieuse et complète. Le moniteur est patient et professionnel. J'ai eu mon permis du premier coup et je travaille maintenant comme chauffeur de bus. Formation que je conseille à tous !",
    date: "2025-06-15",
    currentJob: "Chauffeur de bus - SOTRACO",
  },
  {
    id: "t7",
    name: "Wendlassida Ouédraogo",
    trainingId: "maconnerie",
    trainingTitle: "Formation Maçonnerie",
    rating: 5,
    text: "Après des années de petit travail sans qualification, cette formation m'a ouvert des portes. Les techniques modernes enseignées sont très demandées sur le marché. Excellent investissement !",
    date: "2025-05-20",
    currentJob: "Maçon qualifié - Constructions Modernes",
  },
  {
    id: "t8",
    name: "Aïssata Diallo",
    trainingId: "solaire",
    trainingTitle: "Formation Énergie Solaire",
    rating: 4,
    text: "Très bonne formation avec des équipements modernes. Le secteur solaire recrute beaucoup au Burkina. J'ai trouvé du travail une semaine après ma certification !",
    date: "2025-04-10",
    currentJob: "Technicienne Solaire",
  },
  {
    id: "t9",
    name: "Ousmane Kaboré",
    trainingId: "vente",
    trainingTitle: "Formation sur la Vente",
    rating: 5,
    text: "Cette formation a transformé ma carrière. Les techniques de négociation apprises m'ont permis de doubler mon chiffre d'affaires en quelques mois. Les formateurs sont passionnés et expérimentés.",
    date: "2025-12-10",
    currentJob: "Directeur Commercial - Albarka Distribution",
  },
];
