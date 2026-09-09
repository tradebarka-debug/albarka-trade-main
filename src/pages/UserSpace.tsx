import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { LogOut, ShoppingBag, Store, Trash2, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const UserSpace = () => {
  const { user, signOut, canAccessAdmin, organizationRoleCode, organizationRoleName, isLoading } = useAuth();
  const { toast } = useToast();
  const [showDeletionRequest, setShowDeletionRequest] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [sendingDeletion, setSendingDeletion] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRestaurantManager, setIsRestaurantManager] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadUserRole = async () => {
      const { data, error } = await (
        supabase.from("profiles") as any
      )
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!error) {
        setUserRole(data?.role || null);
      }

      const { data: isManager, error: restaurantError } = await (
        supabase as any
      ).rpc("is_restaurant_manager");

      if (!restaurantError) {
        setIsRestaurantManager(isManager === true);
      }
    };
    void loadUserRole();
  }, [user?.id]);
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fullName = user.user_metadata?.full_name || "Utilisateur";
  const isDeliveryDriver = userRole === "livreur" || organizationRoleCode === "delivery_driver";

  const requestOwnDeletion = async () => {
    if (deletionReason.trim().length < 5) {
      toast({ title: "Motif trop court", description: "Expliquez votre demande en quelques mots.", variant: "destructive" });
      return;
    }
    setSendingDeletion(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "request_deletion", reason: deletionReason } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Demande envoyée", description: "Votre compte reste actif jusqu'à la décision de l'administration Albarka." });
      setDeletionReason(""); setShowDeletionRequest(false);
    } catch (error: any) {
      toast({ title: "Demande impossible", description: error?.message || "Veuillez réessayer.", variant: "destructive" });
    } finally { setSendingDeletion(false); }
  };

  const deletionContent = <>

            <p className="text-sm text-muted-foreground">Personne ne peut supprimer son propre compte directement. Vous pouvez envoyer une demande motivée à l'administration.</p>
            {!showDeletionRequest ? <Button variant="outline" onClick={() => setShowDeletionRequest(true)}><Trash2 className="h-4 w-4" />Demander la suppression</Button> : <div className="space-y-3">
              <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={deletionReason} onChange={event => setDeletionReason(event.target.value)} placeholder="Pourquoi souhaitez-vous supprimer ce compte ?" />
              <div className="flex gap-2"><Button variant="outline" onClick={() => setShowDeletionRequest(false)}>Annuler</Button><Button variant="destructive" disabled={sendingDeletion} onClick={() => void requestOwnDeletion()}>Envoyer à l'administration</Button></div>
            </div>}
  </>;

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
            {isDeliveryDriver && (
              <Button variant="outline" asChild>
                <Link to="/espace-livreur">
                  <Truck className="h-4 w-4" />
                  Ouvrir mon espace livreur
                </Link>
              </Button>
            )}
            {isRestaurantManager && (
              <Button variant="outline" asChild>
                <Link to="/espace-restaurant">
                  <Store className="h-4 w-4" />
                  Ouvrir mon espace restaurant
                </Link>
              </Button>
            )}
            {organizationRoleName && !isDeliveryDriver && (
              <Button variant="outline" asChild>
                <Link to="/organisation">
                  <User className="h-4 w-4" />
                  Ouvrir mon espace organisation
                </Link>
              </Button>
)}
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

        {!isLoading && ((canAccessAdmin || userRole === "admin") ? (
          <details className="md:col-span-2 mt-2">
            <summary className="w-fit cursor-pointer rounded text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Demander la suppression de mon compte
            </summary>
            <div className="mt-3 max-w-xl space-y-3">{deletionContent}</div>
          </details>
        ) : (
          <Card className="md:col-span-2 border-destructive/30">
            <CardHeader><CardTitle className="text-base">Suppression du compte</CardTitle></CardHeader>
            <CardContent className="space-y-3">{deletionContent}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default UserSpace;
