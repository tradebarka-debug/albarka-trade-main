import { Package, GraduationCap, Wrench, Briefcase, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const stats = [
  { 
    label: "Produits", 
    value: "24", 
    icon: Package, 
    color: "text-primary",
    bgColor: "bg-primary/10",
    link: "/admin/produits"
  },
  { 
    label: "Formations", 
    value: "8", 
    icon: GraduationCap, 
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    link: "/admin/formations"
  },
  { 
    label: "Services", 
    value: "12", 
    icon: Wrench, 
    color: "text-accent",
    bgColor: "bg-accent/10",
    link: "/admin/services"
  },
  { 
    label: "Offres d'emploi", 
    value: "5", 
    icon: Briefcase, 
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    link: "/admin/emplois"
  },
];

const AdminDashboard = () => {
  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue dans votre espace d'administration
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-secondary" />
                  Gérer
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/admin/produits"
            className="p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors"
          >
            <Package className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold">Ajouter un produit</h3>
            <p className="text-sm text-muted-foreground">
              Nouveau produit dans la boutique
            </p>
          </Link>
          
          <Link 
            to="/admin/formations"
            className="p-4 bg-card border border-border rounded-xl hover:border-secondary transition-colors"
          >
            <GraduationCap className="w-8 h-8 text-secondary mb-3" />
            <h3 className="font-semibold">Ajouter une formation</h3>
            <p className="text-sm text-muted-foreground">
              Nouveau programme de formation
            </p>
          </Link>
          
          <Link 
            to="/admin/services"
            className="p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors"
          >
            <Wrench className="w-8 h-8 text-accent mb-3" />
            <h3 className="font-semibold">Ajouter un service</h3>
            <p className="text-sm text-muted-foreground">
              Nouveau service proposé
            </p>
          </Link>
          
          <Link 
            to="/admin/emplois"
            className="p-4 bg-card border border-border rounded-xl hover:border-blue-500 transition-colors"
          >
            <Briefcase className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold">Publier une offre</h3>
            <p className="text-sm text-muted-foreground">
              Nouvelle offre d'emploi
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
