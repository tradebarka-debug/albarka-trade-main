import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Driver = {
  id: string;
  full_name: string;
  organization_role_name?: string | null;
  organization_role_code?: string | null;
  email: string | null;
  telephone: string | null;
  role: string | null;
  is_active: boolean;
};

type Delivery = {
  id: number;
  order_id: string | null;
  driver_id: string | null;
  status: string | null;
  delivery_fee: number | null;
};

const profilesTable = supabase.from("profiles") as any;
const deliveriesTable = supabase.from("deliveries") as any;

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);

    const [
      { data: driversData, error: driversError },
      { data: deliveriesData, error: deliveriesError },
    ] = await Promise.all([
      profilesTable
        .select("id, nom, email, telephone, role, is_active")
        .eq("role", "livreur"),
      deliveriesTable
        .select("id, order_id, driver_id, status, delivery_fee")
        .order("id", { ascending: false }),
    ]);

    if (driversError) {
      toast.error(`Livreurs : ${driversError.message}`);
    }

    if (deliveriesError) {
      toast.error(`Livraisons : ${deliveriesError.message}`);
    }

    setDrivers(
      (driversData ?? []).map((driver: any) => ({
        ...driver,
        full_name: driver.nom || "Livreur sans nom",
      }))
    );
    setDeliveries(deliveriesData ?? []);
    setLoading(false);
  };

  useEffect(() => {
  void loadData();

  const channel = supabase
    .channel("admin-deliveries-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "deliveries",
      },
      () => {
        void loadData();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}, []);

  const toggleDriver = async (driver: Driver) => {
    const { error } = await profilesTable
      .update({ is_active: !driver.is_active })
      .eq("id", driver.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      driver.is_active ? "Livreur désactivé" : "Livreur activé"
    );

    void loadData();
  };

  const assignDriver = async (
    deliveryId: number,
    driverId: string
  ) => {
    const { data, error } = await deliveriesTable
      .update({ driver_id: driverId || null })
      .eq("id", deliveryId)
      .select("id, driver_id")
      .maybeSingle();

    if (error || !data) {
      toast.error(error?.message || "Attribution non enregistrée : accès refusé ou livraison introuvable.");
      return;
    }

    if ((data.driver_id || "") !== driverId) {
      toast.error("Attribution non confirmée par la base de données.");
      return;
    }

    toast.success(
      driverId ? "Livreur attribué" : "Attribution retirée"
    );

    void loadData();
  };

  if (loading) {
    return (
      <main className="p-6 md:p-8">
        <p>Chargement des livreurs...</p>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Gestion des livreurs
        </h1>

        <p className="mt-2 text-muted-foreground">
          Gérez les livreurs et attribuez les livraisons.
        </p>
      </div>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-4 text-xl font-bold">
          Livreurs ({drivers.length})
        </h2>

        {drivers.length === 0 ? (
          <p className="text-muted-foreground">
            Aucun compte livreur enregistré.
          </p>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {driver.full_name || "Livreur sans nom"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {driver.telephone || "Téléphone non renseigné"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {driver.email || "Email non renseigné"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void toggleDriver(driver)}
                  className={`rounded-lg px-4 py-2 font-semibold ${driver.is_active
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                    }`}
                >
                  {driver.is_active ? "Actif" : "Inactif"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-4 text-xl font-bold">
          Attribution des livraisons
        </h2>

        {deliveries.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune livraison disponible.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3">Livraison</th>
                  <th className="p-3">Commande</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Frais</th>
                  <th className="p-3">Livreur attribué</th>
                </tr>
              </thead>

              <tbody>
                {deliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    className="border-b border-border"
                  >
                    <td className="p-3">#{delivery.id}</td>

                    <td className="p-3">
                      {delivery.order_id || "—"}
                    </td>

                    <td className="p-3">
                      {delivery.status === "pending"
                        ? "En attente"
                        : delivery.status === "accepted"
                          ? "Acceptée"
                          : delivery.status === "in_progress"
                            ? "En cours"
                            : delivery.status === "delivered"
                              ? "Livrée"
                              : delivery.status || "En attente"}
                    </td>

                    <td className="p-3">
                      {Number(delivery.delivery_fee || 0).toLocaleString(
                        "fr-FR"
                      )}{" "}
                      FCFA
                    </td>

                    <td className="p-3">
                      <select
                        disabled={delivery.status === "delivered"} value={delivery.driver_id || ""}
                        onChange={(event) =>
                          void assignDriver(
                            delivery.id,
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-border bg-background p-2"
                      >
                        <option value="">Non attribuée</option>

                        {drivers
                          .filter((driver) => driver.is_active)
                          .map((driver) => (
                            <option
                              key={driver.id}
                              value={driver.id}
                            >
                              {driver.full_name || driver.telephone || "Livreur"}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
