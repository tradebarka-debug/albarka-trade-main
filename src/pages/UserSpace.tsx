import { Navigate, Link } from "react-router-dom";
import { LogOut, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const UserSpace = () => {
  const { user, signOut, canAccessAdmin, organizationRoleName } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fullName = user.user_metadata?.full_name || "Utilisateur";

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Mon espace utilisateur</h1>
          <p className="text-muted-foreground">Bienvenue, {fullName}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mes informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><strong>Nom :</strong> {fullName}</p>
            <p><strong>Email :</strong> {user.email}</p>
            {organizationRoleName && <p><strong>Grade :</strong> {organizationRoleName}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accès rapides</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/panier">
                <ShoppingBag className="h-4 w-4" />
                Voir mon panier
              </Link>
            </Button>
            {organizationRoleName && <Button variant="outline" asChild>
              <Link to="/organisation">
                <User className="h-4 w-4" />
                Ouvrir mon espace organisation
              </Link>
            </Button>}
            {canAccessAdmin && <Button variant="outline" asChild>
              <Link to="/admin">
                <User className="h-4 w-4" />
                Ouvrir mon espace administratif
              </Link>
            </Button>}
            <Button variant="outline" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default UserSpace;