import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  const { user, canAccessAdmin, hasPermission, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits d'accès à cette page.</p>
        </div>
      </div>
    );
  }

  const isUserManagementPage = location.pathname.startsWith("/admin/utilisateurs");
  if (isUserManagementPage && !hasPermission("manage_team_accounts") && !hasPermission("create_users")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Permission insuffisante</h1>
          <p className="text-muted-foreground">Votre grade ne permet pas de gérer les comptes administratifs.</p>
        </div>
      </div>
    );
  }

  const restrictedAdminRoutes = [
    { prefix: "/admin/restaurants", permission: "manage_restaurants" },
    { prefix: "/admin/menus", permission: "manage_restaurants" },
    { prefix: "/admin/fast-food", permission: "manage_restaurants" },
    { prefix: "/admin/admin-partners", permission: "manage_suppliers" },
    { prefix: "/admin/fournisseurs", permission: "manage_suppliers" },
  ];
  const restrictedRoute = restrictedAdminRoutes.find((route) =>
    location.pathname.startsWith(route.prefix)
  );

  if (restrictedRoute && !hasPermission(restrictedRoute.permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Permission insuffisante</h1>
          <p className="text-muted-foreground">Votre poste ne permet pas de gérer cet espace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
