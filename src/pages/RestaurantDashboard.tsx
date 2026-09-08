import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Preorder = {
  id: string;
  tracking_number?: string | null;
  queue_number?: number | null;
  customer_name?: string | null;
  telephone?: string | null;
  address?: string | null;
  total?: number | null;
  items?: unknown;
  restaurant_confirmation_status: string;
  restaurant_rejection_reason?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
};
const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const loadPreorders = useCallback(async () => {
    setLoading(true);

    const { data, error } = await (supabase as any).rpc(
      "get_my_restaurant_preorders"
    );

    if (error) {
      console.error("Erreur chargement précommandes :", error);
      toast.error("Impossible de charger les précommandes.");
      setPreorders([]);
    } else {
      setPreorders(Array.isArray(data) ? data : []);
    }

    setLoading(false);
  }, []);
   useEffect(() => {
  if (!user) return;

  void loadPreorders();

  const intervalId = window.setInterval(() => {
    void loadPreorders();
  }, 10000);

  return () => window.clearInterval(intervalId);
}, [user, loadPreorders]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const respondToPreorder = async (
    orderId: string,
    accept: boolean
  ) => {
    let rejectionReason: string | null = null;

    if (!accept) {
      rejectionReason = window.prompt(
        "Pourquoi cette précommande est-elle refusée ?"
      );

      if (!rejectionReason?.trim()) {
        toast.error("Veuillez indiquer le motif du refus.");
        return;
      }
    }

    setRespondingId(orderId);

    const { error } = await (supabase as any).rpc(
      "respond_restaurant_preorder",
      {
        p_order_id: orderId,
        p_accept: accept,
        p_rejection_reason: rejectionReason,
      }
    );

    if (error) {
      console.error("Erreur réponse restaurant :", error);
      toast.error(error.message || "Impossible d'enregistrer la réponse.");
      setRespondingId(null);
      return;
    }

    toast.success(
      accept
        ? "Précommande acceptée. Le client peut maintenant payer."
        : "Précommande refusée."
    );

    setRespondingId(null);
    await loadPreorders();
  };

  const formatItems = (value: unknown) => {
    try {
      const parsed =
        typeof value === "string" ? JSON.parse(value) : value;

      if (!Array.isArray(parsed)) return "Aucun plat";

      return parsed
        .map(
          (item: any) =>
            `${item.name || "Plat"} × ${item.quantity || 1}`
        )
        .join(", ");
    } catch {
      return "Plats non disponibles";
    }
  };

  const statusLabel = (status: string) => {
    if (status === "pending") return "En attente de votre réponse";
    if (status === "accepted") return "Acceptée";
    if (status === "rejected") return "Refusée";
    if (status === "expired") return "Expirée";
    return status;
  };

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Espace restaurant</h1>
          <p className="text-muted-foreground">
            Confirmez la disponibilité des plats avant le paiement.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadPreorders()}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Actualiser
        </Button>
      </div>
           {loading && preorders.length === 0 ? (
        <p>Chargement des précommandes...</p>
      ) : preorders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aucune précommande pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {preorders.map((preorder) => (
            <Card key={preorder.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>
                    Ticket N° {preorder.queue_number || "—"}
                  </CardTitle>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {statusLabel(
                      preorder.restaurant_confirmation_status
                    )}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p>
                  <strong>Suivi :</strong>{" "}
                  {preorder.tracking_number || "En cours"}
                </p>

                <p>
                  <strong>Client :</strong>{" "}
                  {preorder.customer_name || "Non renseigné"}
                </p>

                <p>
                  <strong>Téléphone :</strong>{" "}
                  {preorder.telephone || "Non renseigné"}
                </p>

                <p>
                  <strong>Adresse :</strong>{" "}
                  {preorder.address || "Non renseignée"}
                </p>

                <p>
                  <strong>Plats :</strong>{" "}
                  {formatItems(preorder.items)}
                </p>

                <p>
                  <strong>Total :</strong>{" "}
                  {Number(preorder.total || 0).toLocaleString("fr-FR")} FCFA
                </p>

                {preorder.restaurant_rejection_reason && (
                  <p className="text-destructive">
                    <strong>Motif du refus :</strong>{" "}
                    {preorder.restaurant_rejection_reason}
                  </p>
                )}

                {preorder.restaurant_confirmation_status === "pending" && (
                  <div className="flex flex-wrap gap-3 pt-3">
                    <Button
                      onClick={() =>
                        void respondToPreorder(preorder.id, true)
                      }
                      disabled={respondingId === preorder.id}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accepter les plats
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() =>
                        void respondToPreorder(preorder.id, false)
                      }
                      disabled={respondingId === preorder.id}
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
           )}
    </main>
  );
};

export default RestaurantDashboard;