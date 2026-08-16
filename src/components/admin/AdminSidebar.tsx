import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  GraduationCap, 
  Wrench, 
  Briefcase,
  ChevronLeft,
  LogOut,
  Home,
  Users,
  CreditCard,
  Bus,
  UtensilsCrossed,
  Factory,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const menuItems = [
  { path: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/admin/produits", label: "Produits", icon: Package },
  { path: "/admin/fast-food", label: "Menu Fast Food", icon: UtensilsCrossed, permission: "manage_restaurants" },
  { path: "/admin/restaurants", label: "Restaurants partenaires", icon: UtensilsCrossed, permission: "manage_restaurants" },
  { path: "/admin/menus", label: "Menus restaurants", icon: UtensilsCrossed, permission: "manage_restaurants" },
  { path: "/admin/formations", label: "Formations", icon: GraduationCap },
  { path: "/admin/services", label: "Services", icon: Wrench },
  { path: "/admin/emplois", label: "Offres d'emploi", icon: Briefcase },
  { path: "/admin/applications", label: "Candidatures emplois", icon: Briefcase },
  { path: "/admin/candidature", label: "Candidatures spontanées", icon: Briefcase },
  { path: "/admin/paiements", label: "Paiements", icon: CreditCard },
  { path: "/admin/service-requests", label: "Demandes de services", icon: Wrench },
  { path: "/admin/orders", label: "Commandes", icon: Package },
  { path: "/admin/liquidation", label: "Liquidation", icon: Package },
  { path: "/admin/admin-partners", label: "Fournisseurs", icon: Users, permission: "manage_suppliers" },
  { path: "/admin/usines", label: "Usines partenaires", icon: Factory, permission: "manage_factories" },
  { path: "/admin/repertoire-partenaires", label: "Répertoire partenaires", icon: ClipboardList },
  { path: "/admin/voyages", label: "Voyages & Courriers", icon: Bus },
  { path: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

const AdminSidebar = () => {
  const location = useLocation();
  const { signOut, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.path === "/admin/utilisateurs") {
      return hasPermission("manage_team_accounts") || hasPermission("create_users");
    }

    return !item.permission || hasPermission(item.permission);
  });

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div>
            <h2 className="font-display font-bold text-lg text-primary">Admin</h2>
            <p className="text-xs text-muted-foreground">Albarka Trade</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Home className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Retour au site</span>}
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
