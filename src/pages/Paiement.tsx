import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Upload, Phone, MapPin, LocateFixed } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updatePartnerStats } from "@/utils/promoCode";
import { any } from "zod";

type PaymentMethod = "orange_money" | "wave" | "moov_money" | "cash_on_delivery";

interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  number: string;
  beneficiary: string;
  ussd: string;
}

const paymentMethods: PaymentMethodInfo[] = [
  {
    id: "orange_money",
    name: "Orange Money",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    number: "+226 76 32 23 36",
    beneficiary: "Groupe Mam Commerce International",
    ussd: "*144*10*76322336*", // montant ajouté dynamiquement
  },
  {
    id: "wave",
    name: "Wave",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    number: "+226 76 32 23 36",
    beneficiary: "Rabo Souleymane",
    ussd: "",
  },
  {
    id: "moov_money",
    name: "Moov Money",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    number: "+226 02 02 94 94",
    beneficiary: "Groupe Mam Commerce International",
    ussd: "*555*5*02029494*", // montant ajouté dynamiquement
  },
  {
    id: "cash_on_delivery",
    name: "Paiement à la livraison",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    number: "",
    beneficiary: "",
    ussd: "",
  },
];
type DriverOption = {
  driver_id: string;
  driver_name: string;
  is_available: boolean;
  is_busy: boolean;
  distance_to_restaurant_km: number;
  restaurant_to_client_km: number;
  total_distance_km: number;
  estimated_minutes: number;
};
const Paiement = () => {
  const [driverOptions, setDriverOptions] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [driversLoading, setDriversLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("orange_money");
  const [formData, setFormData] = useState({
    country: "CI",
    name: "",
    phone: "",
    commune: "",
    address: "",
    transactionRef: "",
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const automaticLocationRequested = useRef(false);
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [preorderId, setPreorderId] = useState<string | null>(null);
  const [preorderStatus, setPreorderStatus] = useState<  "idle" | "pending" | "accepted" | "rejected" >("idle");
  const [preorderLoading, setPreorderLoading] = useState(false);
  const [preorderError, setPreorderError] = useState("");
  const [preorderExpiresAt, setPreorderExpiresAt] = useState<number | null>(null);
  const [waitingSeconds, setWaitingSeconds] = useState(600);
  const [whatsappNotificationUrl, setWhatsappNotificationUrl] = useState("");
  const [requiresDelivery, setRequiresDelivery] = useState(true);
  const [disposableKits, setDisposableKits] = useState(false);
  const [kitQuantity, setKitQuantity] = useState(1);
  const [restaurantConfig, setRestaurantConfig] = useState<any>(null);
  const [restaurantConfigLoading, setRestaurantConfigLoading] = useState(false);
  const [restaurantConfigMissing, setRestaurantConfigMissing] = useState(false);
  const restaurantId = items.find((item) => item.restaurantId)?.restaurantId || null;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pending_preorder_context") || "null");
      if (!saved?.id || !saved?.expiresAt || saved.expiresAt <= Date.now()) return;
      setPreorderId(saved.id);
      setPreorderStatus("pending");
      setPreorderExpiresAt(saved.expiresAt);
      setWhatsappNotificationUrl(saved.whatsappUrl || "");
      if (saved.formData) setFormData(saved.formData);
      if (saved.coordinates) setCoordinates(saved.coordinates);
      if (saved.selectedDriverId) setSelectedDriverId(saved.selectedDriverId);
      if (typeof saved.requiresDelivery === "boolean") setRequiresDelivery(saved.requiresDelivery);
      if (typeof saved.disposableKits === "boolean") setDisposableKits(saved.disposableKits);
      if (Number.isFinite(saved.kitQuantity)) setKitQuantity(saved.kitQuantity);
    } catch {
      localStorage.removeItem("pending_preorder_context");
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) { setRestaurantConfig(null); setRestaurantConfigMissing(false); return; }
    setRestaurantConfigLoading(true);
    setRestaurantConfigMissing(false);
    void (async () => {
      const { data, error } = await (supabase.from("restaurant_partners") as any)
        .select("id,name,whatsapp,telephone,payment_phone,payment_beneficiary,latitude,longitude,delivery_fee,delivery_fee_per_km,disposable_kit_fee")
        .eq("id", restaurantId)
        .maybeSingle();
      setRestaurantConfig(data);
      setRestaurantConfigMissing(Boolean(error) || !data);
      setRestaurantConfigLoading(false);
    })();
  }, [restaurantId]);

  const distanceKm = coordinates && restaurantConfig?.latitude != null && restaurantConfig?.longitude != null
    ? haversineDistance(coordinates.latitude, coordinates.longitude, Number(restaurantConfig.latitude), Number(restaurantConfig.longitude))
    : 0;
  const isDistanceSuspicious = requiresDelivery && distanceKm > 100;
  const deliveryFee =
    requiresDelivery && restaurantConfig && coordinates && !isDistanceSuspicious
      ? distanceKm <= 0.8
        ? 125
        : distanceKm <= 1
          ? 175
          : distanceKm <= 1.5
            ? 200
            : distanceKm <= 2
              ? 250
              : distanceKm <= 3
                ? 400
                : distanceKm <= 5
                  ? 500
                  : distanceKm <= 6
                    ? 600
                    : distanceKm <= 7
                      ? 700
                      : distanceKm <= 8
                        ? 800
                        : distanceKm <= 10
                          ? 1000
                          : distanceKm <= 12
                            ? 1200
                            : distanceKm <= 15
                              ? 1500
                              : distanceKm <= 17
                                ? 1700
                                : distanceKm <= 20
                                  ? 2000
                                  : 0
      : 0;
  useEffect(() => {
    if (
      !requiresDelivery ||
      !coordinates ||
      restaurantConfig?.latitude == null ||
      restaurantConfig?.longitude == null
    ) {
      setDriverOptions([]);
      setSelectedDriverId("");
      return;
    }

    let cancelled = false;

    const loadDriverOptions = async () => {
      setDriversLoading(true);

      const { data, error } = await (supabase as any).rpc(
        "get_driver_options",
        {
          restaurant_latitude: Number(restaurantConfig.latitude),
          restaurant_longitude: Number(restaurantConfig.longitude),
          client_latitude: Number(coordinates.latitude),
          client_longitude: Number(coordinates.longitude),
        }
      );

      if (!cancelled) {
        if (error) {
          console.error("Erreur chargement livreurs :", error);
          setDriverOptions([]);
        } else {
          const options = (data || []) as DriverOption[];
          setDriverOptions(options);

          setSelectedDriverId((current) =>
            options.some((driver) => driver.driver_id === current)
              ? current
              : options[0]?.driver_id || ""
          );
        }

        setDriversLoading(false);
      }
    };

    void loadDriverOptions();

    return () => {
      cancelled = true;
    };
  }, [
    requiresDelivery,
    coordinates?.latitude,
    coordinates?.longitude,
    restaurantConfig?.latitude,
    restaurantConfig?.longitude,
  ]);
  const disposableKitFee = disposableKits ? Math.max(1, kitQuantity) * Number(restaurantConfig?.disposable_kit_fee || 0) : 0;
  const orderTotal = totalPrice + deliveryFee + disposableKitFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const captureLocation = useCallback(() => {
    if (!window.isSecureContext) {
      toast.error("La position automatique est bloquée sur une adresse HTTP locale. Utilisez HTTPS ou saisissez les coordonnées manuellement.");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationAccuracy(position.coords.accuracy);
        setIsLocating(false);
        toast.success("Position ajoutée à votre livraison.");
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Autorisation refusée. Autorisez la localisation dans votre navigateur, puis appuyez sur Réessayer.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("La recherche a pris trop de temps. Activez le GPS puis appuyez sur Réessayer.");
        } else {
          toast.error("Position indisponible. Activez le GPS puis appuyez sur Réessayer.");
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  const saveManualLocation = () => {
    const latitude = Number(manualLatitude.replace(",", "."));
    const longitude = Number(manualLongitude.replace(",", "."));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast.error("Saisissez une latitude et une longitude valides.");
      return;
    }
    setCoordinates({ latitude, longitude });
    setLocationAccuracy(null);
    setShowManualLocation(false);
    toast.success("Position manuelle enregistrée.");
  };

  const uploadScreenshot = async (userId: string): Promise<string | null> => {
    if (!screenshot) return null;

    const fileExt = screenshot.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("payment-screenshots")
      .upload(fileName, screenshot);

    if (error) {
      console.error("Error uploading screenshot:", error);
      return null;
    }

    return fileName;
  };

  const buildWhatsAppNotificationUrl = (order: { tracking_number?: string | null; queue_number?: number | null }, restaurantDetails: any) => {
    const restaurantPhone = String(restaurantDetails?.whatsapp || restaurantDetails?.telephone || "").replace(/\D/g, "");
    if (!restaurantPhone) return false;
    const methodName = paymentMethods.find(m => m.id === selectedMethod)?.name || selectedMethod;

    const message = `🔔 *Nouvelle commande — ${restaurantDetails?.name || "Restaurant partenaire"}*

🎫 *Ticket:* ${order.queue_number ? `N° ${order.queue_number}` : "En cours"}
🔎 *Suivi:* ${order.tracking_number || "En cours"}

👤 *Client:* ${formData.name}
📱 *Téléphone:* ${formData.phone}
 🏙️ *Commune:* ${formData.commune}
📍 *Adresse:* ${formData.address}

💰 *Montant:* ${formatPrice(orderTotal)}
💳 *Méthode:* ${methodName}
${selectedMethod === "cash_on_delivery" ? "💵 *Paiement prévu à la livraison*" : `🔢 *Réf. Transaction:* ${formData.transactionRef}`}
🚚 *Livraison:* ${requiresDelivery ? `${distanceKm ? `${distanceKm.toFixed(1)} km · ` : ""}${formatPrice(deliveryFee)}` : "Retrait sur place"}
🍴 *Kits jetables:* ${disposableKits ? `${kitQuantity} · ${formatPrice(disposableKitFee)}` : "Non"}

📦 *Articles:*
${items.map(item => `• ${item.name} x${item.quantity} = ${formatPrice(item.price * item.quantity)}`).join('\n')}

⏰ Merci de confirmer la prise en charge de cette commande.`;

    // wa.me est le lien universel officiel WhatsApp : fonctionne sur mobile
    // (ouvre l'app) comme sur desktop (ouvre WhatsApp Web ou propose l'app).
    const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;

    // Redirection directe de l'onglet courant : window.open("_blank") est
    // souvent bloqué par le navigateur une fois qu'un await a eu lieu avant
    // l'appel (perte du contexte "geste utilisateur").
    return whatsappUrl;
  };
  const appliedPromoCode =
    location.state?.appliedPromoCode ||
    localStorage.getItem("promoCode") ||
    "";
    const createPreorder = async () => {
  try {
    if (
      !formData.name ||
      !formData.phone ||
      !formData.commune ||
      !formData.address
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (
      restaurantId &&
      (
        restaurantConfigLoading ||
        restaurantConfigMissing ||
        !restaurantConfig
      )
    ) {
      toast.error(
        restaurantConfigLoading
          ? "Chargement du restaurant en cours."
          : "Restaurant introuvable."
      );
      return;
    }

    if (requiresDelivery && !coordinates) {
      toast.error(
        "La position GPS est obligatoire pour la livraison."
      );
      return;
    }

    if (requiresDelivery && !selectedDriverId) {
      toast.error("Veuillez choisir un livreur.");
      return;
    }

    if (isDistanceSuspicious) {
      toast.error("La position du restaurant semble incorrecte.");
      return;
    }

    setPreorderLoading(true);
    setPreorderError("");

    let activeUser = user;

    if (!activeUser) {
      const { data, error } =
        await supabase.auth.signInAnonymously();

      if (error || !data.user) {
        throw new Error(
          "Impossible de sécuriser la précommande."
        );
      }

      activeUser = data.user;
    }

    const { data: order, error: orderError } =
      await (supabase as any)
        .from("orders")
        .insert({
          customer_name: formData.name,
          telephone: formData.phone,
          address: formData.address,
          items: JSON.stringify(
            items.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              restaurant_id: item.restaurantId || null,
            }))
          ),
          total: orderTotal,
          payment_method: "pending_confirmation",
          transaction_ref: null,
          status: "pending",
          payment_status: "pending",
          promo_code: appliedPromoCode || null,
          screenshot: null,
          delivery_country: formData.country,
          delivery_area: formData.commune,
          delivery_latitude: coordinates?.latitude ?? null,
          delivery_longitude: coordinates?.longitude ?? null,
          delivery_distance_km: distanceKm || null,
          delivery_fee: deliveryFee,
          delivery_status: "pending",
          restaurant_id: restaurantId,
          requires_delivery: requiresDelivery,
          disposable_kits: disposableKits,
          disposable_kit_quantity: disposableKits
            ? Math.max(1, kitQuantity)
            : 0,
          disposable_kit_fee: disposableKitFee,
          restaurant_confirmation_status: "pending",
        })
        .select("id, tracking_number, queue_number")
        .single();

    if (orderError || !order) {
      throw new Error(
        orderError?.message ||
        "Impossible de créer la précommande."
      );
    }

    let confirmationRequired = false;

    for (const item of items) {
      const match = String(item.id).match(/(\d+)$/);
      const menuItemId = match ? Number(match[1]) : 0;

      if (!menuItemId) {
        throw new Error(
          `Identifiant invalide pour le plat ${item.name}.`
        );
      }

      const { data, error } = await (supabase as any).rpc(
        "reserve_restaurant_item",
        {
          p_order_id: order.id,
          p_menu_item_id: menuItemId,
          p_quantity: item.quantity,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data?.requires_confirmation) {
        confirmationRequired = true;
      }
    }

    // Enregistrer la précommande avant le paiement pour le suivi client.
    if (order.tracking_number) {
      try {
        const stored = JSON.parse(localStorage.getItem("albarka_customer_orders") || "[]");
        const summary = { tracking_number: order.tracking_number, queue_number: order.queue_number, restaurant_name: restaurantConfig?.name || "Commande Albarka", total: orderTotal, created_at: new Date().toISOString() };
        localStorage.setItem("albarka_customer_orders", JSON.stringify([summary, ...(Array.isArray(stored) ? stored : []).filter((saved: { tracking_number: string }) => saved.tracking_number !== order.tracking_number)].slice(0, 20)));
        localStorage.setItem("last_order_tracking_number", order.tracking_number);
      } catch (error) { console.error("Historique client indisponible", error); }
    }
    setPreorderId(order.id);
    setTrackingNumber(order.tracking_number || "");
    setQueueNumber(order.queue_number || null);

    localStorage.setItem(
      "pending_preorder_id",
      order.id
    );

    if (confirmationRequired) {
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const whatsappUrl = buildWhatsAppNotificationUrl(order, restaurantConfig) || "";
      setPreorderStatus("pending");
      setPreorderExpiresAt(expiresAt);
      setWaitingSeconds(600);
      setWhatsappNotificationUrl(whatsappUrl);
      localStorage.setItem("pending_preorder_context", JSON.stringify({
        id: order.id, expiresAt, whatsappUrl, formData, coordinates, selectedDriverId,
        requiresDelivery, disposableKits, kitQuantity,
      }));
      toast.success(
        "Précommande envoyée. En attente du restaurant."
      );

    } else {
      setPreorderStatus("accepted");
      toast.success(
        "Plats réservés. Vous pouvez maintenant payer."
      );
      setStep(2);
    }
  } catch (error: any) {
    console.error("Erreur précommande :", error);
    setPreorderError(
      error?.message || "Précommande impossible."
    );
    toast.error(
      error?.message || "Précommande impossible."
    );
  } finally {
    setPreorderLoading(false);
  }
};
useEffect(() => {
  if (!preorderId || preorderStatus !== "pending") {
    return;
  }

  const checkPreorderStatus = async () => {
    const { data, error } = await (supabase as any)
      .from("orders")
      .select(
        "restaurant_confirmation_status, restaurant_rejection_reason"
      )
      .eq("id", preorderId)
      .maybeSingle();

    if (error || !data) {
      setPreorderError(error?.message || "Impossible de vérifier la réponse du cuisinier.");
      return;
    }
    setPreorderError("");

    if (data.restaurant_confirmation_status === "accepted") {
      setPreorderStatus("accepted");
      setPreorderExpiresAt(null);
      localStorage.removeItem("pending_preorder_context");
      toast.success(
        "Le restaurant a confirmé les plats. Vous pouvez payer."
      );
      setStep(2);
    }

    if (data.restaurant_confirmation_status === "rejected") {
      setPreorderStatus("rejected");
      setPreorderExpiresAt(null);
      localStorage.removeItem("pending_preorder_context");
      setPreorderError(
        data.restaurant_rejection_reason ||
          "Le restaurant a refusé la précommande."
      );
      toast.error(
        data.restaurant_rejection_reason ||
          "Le restaurant a refusé la précommande."
      );
    }
  };

  void checkPreorderStatus();

  const intervalId = window.setInterval(() => {
    void checkPreorderStatus();
  }, 3000);

  return () => {
    window.clearInterval(intervalId);
  };
}, [preorderId, preorderStatus]);
useEffect(() => {
  if (preorderStatus !== "pending" || !preorderExpiresAt) return;
  const updateCountdown = () => {
    const remaining = Math.max(0, Math.ceil((preorderExpiresAt - Date.now()) / 1000));
    setWaitingSeconds(remaining);
    if (remaining === 0) {
      setPreorderStatus("rejected");
      setPreorderError("Le délai de confirmation de 10 minutes est expiré. Veuillez recommencer la commande.");
      localStorage.removeItem("pending_preorder_context");
    }
  };
  updateCountdown();
  const timer = window.setInterval(updateCountdown, 1000);
  return () => window.clearInterval(timer);
}, [preorderStatus, preorderExpiresAt]);
  const handleSubmitOrder = async () => {
    try {
    if (!preorderId || preorderStatus !== "accepted") {
  toast.error(
    "Le restaurant doit confirmer les plats avant le paiement."
  );
  return;
}
      if (
        !formData.name ||
        !formData.phone ||
        !formData.commune ||
        !formData.address
      ) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      if (selectedMethod !== "cash_on_delivery" && !formData.transactionRef) {
        toast.error("Veuillez entrer la référence de transaction");
        return;
      }

      if (restaurantId && (restaurantConfigLoading || restaurantConfigMissing || !restaurantConfig)) {
        toast.error(restaurantConfigLoading
          ? "Chargement du restaurant en cours. Réessayez dans un instant."
          : "Ce panier utilise un ancien compte restaurant supprimé. Videz le panier puis ajoutez à nouveau les plats du restaurant Ramadan.");
        return;
      }

      if (restaurantId && selectedMethod !== "cash_on_delivery" && !restaurantConfig?.payment_phone) {
        toast.error("Le restaurant n'a pas encore configuré son numéro de réception des paiements. Choisissez le paiement à la livraison.");
        return;
      }

      if (selectedMethod !== "cash_on_delivery" && !screenshot) {
        toast.error("Veuillez ajouter la capture d'écran de votre paiement");
        return;
      }

      if (requiresDelivery && !coordinates) {
        toast.error("La position GPS est obligatoire pour une livraison. Ajoutez votre position avant de continuer.");
        setStep(1);
        return;
      }

      if (isDistanceSuspicious) {
        toast.error("La position enregistrée pour le restaurant semble incorrecte. La commande est bloquée pour éviter des frais de livraison erronés.");
        return;
      }

      setIsSubmitting(true);

      let activeUser = user;

      if (!activeUser) {
        const { data: anonymousData, error: anonymousError } =
          await supabase.auth.signInAnonymously();

        if (anonymousError || !anonymousData.user) {
          console.error("Anonymous authentication error:", anonymousError);
          toast.error("Impossible de sécuriser la commande. Veuillez réessayer.");
          setIsSubmitting(false);
          return;
        }

        activeUser = anonymousData.user;
      }

      const screenshotUrl =
        selectedMethod !== "cash_on_delivery"
          ? await uploadScreenshot(activeUser.id)
          : null;

      if (selectedMethod !== "cash_on_delivery" && !screenshotUrl) {
        toast.error("Échec de l’envoi de la capture d’écran. Veuillez réessayer.");
        setIsSubmitting(false);
        return;
      }

      // La commande doit toujours etre enregistree, connecte ou non,
      // sinon elle n'apparait jamais dans "Gestion des paiements".
      const {
  data: paymentRows,
  error: paymentError,
} = await (supabase as any).rpc(
  "submit_preorder_payment",
  {
    p_order_id: preorderId,
    p_payment_method: selectedMethod,
    p_transaction_ref:
      selectedMethod === "cash_on_delivery"
        ? null
        : formData.transactionRef,
    p_screenshot:
      selectedMethod === "cash_on_delivery"
        ? null
        : screenshotUrl,
  }
);

const order = Array.isArray(paymentRows)
  ? paymentRows[0]
  : paymentRows;

      if (paymentError) {
        console.error('Error saving payment request:', paymentError);
        toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
        setIsSubmitting(false);
        return;
      }
      if (requiresDelivery) {
        const { error: deliveryError } = await (supabase as any)
          .from("deliveries")
          .insert({
            order_id: preorderId,
            driver_id: selectedDriverId || null,
            distance_km: distanceKm,
            pickup_latitude: Number(restaurantConfig?.latitude),
            pickup_longitude: Number(restaurantConfig?.longitude),
            delivery_latitude: coordinates?.latitude ?? null,
            delivery_longitude: coordinates?.longitude ?? null,
            status: "pending",
            delivery_fee: deliveryFee,
          });

        if (deliveryError) {
          console.error("Erreur création livraison :", deliveryError);
          toast.error(deliveryError.message || "Commande enregistrée, mais livraison non créée.");
        }
      }
      setTrackingNumber(order?.tracking_number || "");
      setQueueNumber(order?.queue_number || null);
      if (order?.tracking_number) {
        localStorage.setItem("last_order_tracking_number", order.tracking_number);
        try {
          const savedOrders = JSON.parse(localStorage.getItem("albarka_customer_orders") || "[]");
          const orderSummary = { tracking_number: order.tracking_number, queue_number: order.queue_number || null, restaurant_name: restaurantConfig?.name || "Commande Albarka", total: orderTotal, created_at: new Date().toISOString() };
          const nextOrders = [orderSummary, ...(Array.isArray(savedOrders) ? savedOrders : []).filter((saved: any) => saved.tracking_number !== order.tracking_number)].slice(0, 20);
          localStorage.setItem("albarka_customer_orders", JSON.stringify(nextOrders));
        } catch (storageError) {
          console.error("Impossible d'enregistrer l'historique client:", storageError);
        }
      }

      // Envoyer notification WhatsApp à l'admin
      // commission partenaire desactivée ici.
      // Elle sera ajoutée seulement après validation du paiement par l'admin.
      clearCart();
      localStorage.removeItem("promoCode");
      toast.success("Commande envoyée avec succès!");
      setIsSubmitting(false);
      setStep(3);
      // La commande est déjà enregistrée avant la redirection vers le restaurant.
      let notificationRestaurant = restaurantConfig;
      if (!notificationRestaurant?.whatsapp && restaurantId) {
        const { data } = await (supabase.from("restaurant_partners") as any)
          .select("name,whatsapp,telephone")
          .eq("id", restaurantId)
          .maybeSingle();
        notificationRestaurant = data;
      }
      setWhatsappNotificationUrl(buildWhatsAppNotificationUrl(order || {}, notificationRestaurant) || "");
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (step !== 1 || !requiresDelivery || coordinates || automaticLocationRequested.current) return;
    automaticLocationRequested.current = true;
    const timer = window.setTimeout(() => captureLocation(), 500);
    return () => window.clearTimeout(timer);
  }, [captureLocation, coordinates, requiresDelivery, step]);

  const basePaymentMethod = paymentMethods.find(m => m.id === selectedMethod)!;
  const selectedPaymentMethod = restaurantId && selectedMethod !== "cash_on_delivery"
    ? {
      ...basePaymentMethod,
      number: restaurantConfig?.payment_phone || "Non configuré",
      beneficiary: restaurantConfig?.payment_beneficiary || restaurantConfig?.name || "Restaurant partenaire",
      ussd: "",
    }
    : basePaymentMethod;


  if (items.length === 0 && step !== 3 && preorderStatus !== "pending") {
    navigate("/panier");
    return null;
  }

  return (
    <main className="min-h-screen py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5 flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => step === 1 ? navigate("/panier") : step === 2 ? setStep(1) : navigate("/")}
            >
              ← {step === 1 ? "Retour au panier" : step === 2 ? "Retour aux informations" : "Retour à l'accueil"}
            </Button>
          </div>
          {/* Progress Steps */}
          {appliedPromoCode && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-6">
              Code partenaire appliqué : <strong>{appliedPromoCode}</strong>
            </div>
          )}
          <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 md:w-24 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Delivery Info */}
          {step === 1 && preorderStatus === "pending" && (
            <div className="rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-sm md:p-8" role="status">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">⏳</div>
              <h2 className="mt-5 text-2xl font-bold">En attente de la confirmation du cuisinier</h2>
              <p className="mt-3 text-muted-foreground">Cette page vérifie automatiquement la réponse. Elle ouvrira le paiement dès que le cuisinier acceptera la précommande.</p>
              <p className="mt-5 font-mono text-3xl font-bold text-primary">{String(Math.floor(waitingSeconds / 60)).padStart(2, "0")}:{String(waitingSeconds % 60).padStart(2, "0")}</p>
              <p className="mt-1 text-sm text-muted-foreground">Temps restant sur les 10 minutes</p>
              {preorderError && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{preorderError}</p>}
              {whatsappNotificationUrl && <a href={whatsappNotificationUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"><Phone className="mr-2 h-5 w-5" />Envoyer les détails au cuisinier sur WhatsApp</a>}
              <p className="mt-4 text-xs text-muted-foreground">Gardez cette page ouverte. WhatsApp s’ouvre séparément et ne ferme plus cette attente.</p>
            </div>
          )}
          {step === 1 && preorderStatus !== "pending" && (
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Informations de Livraison
              </h2>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Votre nom complet"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays *</Label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full rounded-md border p-3 text-black"
                  >
                    <option value="CI">🇨🇮 Côte d'Ivoire (+225)</option>
                    <option value="BF">🇧🇫 Burkina Faso (+226)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone">Numéro de téléphone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={
                      formData.country === "CI"
                        ? "+225 XX XX XX XX XX"
                        : "+226 XX XX XX XX"
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="commune">Commune *</Label>

                  <select
                    id="commune"
                    name="commune"
                    value={formData.commune}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full rounded-md border p-3 text-black"
                  >
                    <option value="">Sélectionnez une commune</option>

                    {formData.country === "CI" ? (
                      <>
                        <option value="Cocody">Cocody</option>
                        <option value="Yopougon">Yopougon</option>
                        <option value="Marcory">Marcory</option>
                        <option value="Treichville">Treichville</option>
                        <option value="Plateau">Plateau</option>
                        <option value="Adjamé">Adjamé</option>
                        <option value="Abobo">Abobo</option>
                        <option value="Koumassi">Koumassi</option>
                        <option value="Port-Bouët">Port-Bouët</option>
                        <option value="Bingerville">Bingerville</option>
                      </>
                    ) : (
                      <>
                        <option value="Secteur 10">Secteur 10</option>
                        <option value="Secteur 11">Secteur 11</option>
                        <option value="Secteur 12">Secteur 12</option>
                        <option value="Ouaga 2000">Ouaga 2000</option>
                        <option value="Tampouy">Tampouy</option>
                        <option value="Pissy">Pissy</option>
                        <option value="Karpala">Karpala</option>
                        <option value="Zogona">Zogona</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <Label htmlFor="address">Adresse de livraison *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={
                      formData.country === "CI"
                        ? "Commune, quartier, rue, repères (ex: Cocody Angré, près de la CNPS)"
                        : "Secteur, quartier, rue, repères (ex: Secteur 10, près de Marina Market)"
                    }
                    className="mt-1.5"
                    rows={3}
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    {formData.country === "CI"
                      ? "Exemple : Cocody Angré 8ème tranche, près de la CNPS"
                      : "Exemple : Ouagadougou, Secteur 10, près de Marina Market"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-medium">Position de livraison</p>
                      <p className="text-sm text-muted-foreground">Validez la demande du navigateur. Votre position sera enregistrée automatiquement, sans saisir de coordonnées.</p>
                    </div>
                    <Button type="button" onClick={captureLocation} disabled={isLocating} className="min-h-14 w-full gap-2 text-base">
                      <LocateFixed className="w-4 h-4" />
                      {isLocating ? "Recherche de votre position..." : coordinates ? "Position enregistrée" : "Autoriser et enregistrer ma position"}
                    </Button>
                  </div>
                  {coordinates && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
                      <MapPin className="w-4 h-4" /> Position enregistrée pour le suivi de la livraison.
                    </p>
                  )}
                  {!coordinates && (
                    <div className="mt-3 grid gap-2">
                      {(restaurantConfig?.whatsapp || restaurantConfig?.telephone) && (
                        <a href={`https://wa.me/${String(restaurantConfig.whatsapp || restaurantConfig.telephone).replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, je passe une commande Albarka. Je vais maintenant vous envoyer ma position actuelle.")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-center text-base font-bold text-white">
                          <Phone className="mr-2 h-5 w-5" /> Partager ma position sur WhatsApp
                        </a>
                      )}
                      <div className="rounded-lg bg-green-500/10 p-3 text-sm">
                        <p className="font-semibold">Après l'ouverture de WhatsApp :</p>
                        <p className="mt-1">1. Appuyez sur 📎 ou +</p>
                        <p>2. Choisissez « Localisation »</p>
                        <p>3. Appuyez sur « Envoyer votre position actuelle »</p>
                        <p className="mt-2 text-xs text-muted-foreground">Votre panier restera enregistré lorsque vous reviendrez sur cette page.</p>
                      </div>
                    </div>
                  )}
                  <button type="button" className="mt-3 text-xs font-medium text-muted-foreground underline" onClick={() => setShowManualLocation((visible) => !visible)}>
                    {showManualLocation ? "Masquer l'assistance avancée" : "Le GPS ne fonctionne pas ? Assistance avancée"}
                  </button>
                  {showManualLocation && (
                    <div className="mt-3 grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-2">
                      <div><Label htmlFor="manualLatitude">Latitude</Label><Input id="manualLatitude" inputMode="decimal" value={manualLatitude} onChange={(event) => setManualLatitude(event.target.value)} placeholder="Ex. 5.3599" /></div>
                      <div><Label htmlFor="manualLongitude">Longitude</Label><Input id="manualLongitude" inputMode="decimal" value={manualLongitude} onChange={(event) => setManualLongitude(event.target.value)} placeholder="Ex. -4.0083" /></div>
                      <Button type="button" variant="secondary" className="sm:col-span-2" onClick={saveManualLocation}>Enregistrer ces coordonnées</Button>
                      <p className="text-xs text-muted-foreground sm:col-span-2">Vous pouvez obtenir ces valeurs en maintenant le doigt sur votre position dans Google Maps.</p>
                    </div>
                  )}
                </div>
                {restaurantId && (
                  <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4" checked={requiresDelivery} onChange={(event) => setRequiresDelivery(event.target.checked)} />
                      <span><strong>Livraison à domicile</strong><span className="block text-sm text-muted-foreground">Frais calculés selon la distance depuis le restaurant.</span></span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4" checked={disposableKits} onChange={(event) => { setDisposableKits(event.target.checked); if (event.target.checked) setKitQuantity(Math.max(1, totalItems)); }} />
                      <span className="flex-1"><strong>Ajouter des kits jetables</strong><span className="block text-sm text-muted-foreground">Facturés {formatPrice(Number(restaurantConfig?.disposable_kit_fee || 0))} par personne.</span></span>
                    </label>
                    {disposableKits && <div><Label htmlFor="kitQuantity">Nombre de personnes</Label><Input id="kitQuantity" className="mt-1 w-32" type="number" min="1" value={kitQuantity} onChange={(event) => setKitQuantity(Math.max(1, Number(event.target.value) || 1))} /></div>}
                    <div className="space-y-1 border-t pt-3 text-sm">
                      {requiresDelivery && <div className="flex justify-between"><span>Distance estimée</span><strong className={isDistanceSuspicious ? "text-destructive" : ""}>{distanceKm ? `${distanceKm.toFixed(1)} km` : "Ajoutez votre position GPS"}</strong></div>}
                      {requiresDelivery && locationAccuracy != null && <div className="flex justify-between text-xs text-muted-foreground"><span>Précision GPS</span><span>± {Math.round(locationAccuracy)} m</span></div>}
                      {isDistanceSuspicious && <p className="text-sm text-destructive">La position GPS du restaurant semble incorrecte. Aucun frais ne sera calculé tant qu’elle n’est pas corrigée.</p>}
                      <div className="flex justify-between"><span>Frais de livraison</span><strong>{isDistanceSuspicious ? "À vérifier" : formatPrice(deliveryFee)}</strong></div>
                      {disposableKits && <div className="flex justify-between"><span>Kits jetables</span><strong>{formatPrice(disposableKitFee)}</strong></div>}
                    </div>
                  </div>
                )}
              </div>
              {requiresDelivery && (
                <div className="mb-6 rounded-xl border border-border p-4">
                  <h3 className="mb-3 text-lg font-bold">
                    Choisissez votre livreur
                  </h3>

                  {driversLoading ? (
                    <p>Recherche des livreurs...</p>
                  ) : driverOptions.length === 0 ? (
                    <p className="text-muted-foreground">
                      Aucun livreur localisé actuellement.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {driverOptions.map((driver) => (
                        <button
                          type="button"
                          key={driver.driver_id}
                          onClick={() => setSelectedDriverId(driver.driver_id)}
                          className={`w-full rounded-lg border p-4 text-left transition ${selectedDriverId === driver.driver_id
                            ? "border-green-500 bg-green-500/10 ring-2 ring-green-500"
                            : "border-border"
                            }`}
                        >
                          <div className="flex justify-between gap-3">
                            <strong>{driver.driver_name}</strong>

                            <span
                              className={
                                driver.is_available
                                  ? "text-green-500"
                                  : "text-orange-500"
                              }
                            >
                              {driver.is_available
                                ? "Disponible"
                                : "Déjà en livraison"}
                            </span>
                          </div>

                          <p className="mt-2">
                            Arrivée au restaurant :{" "}
                            {driver.distance_to_restaurant_km} km
                          </p>

                          <p>
                            Trajet total : {driver.total_distance_km} km
                          </p>

                          <p className="font-semibold">
                            Temps estimé : {driver.estimated_minutes} minutes
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-8 flex justify-end">
                <Button
                  variant="default"
                  size="lg"
                 onClick={() => void createPreorder()}
                  disabled={!formData.name || !formData.phone || !formData.address || (requiresDelivery && !coordinates) || (requiresDelivery && !selectedDriverId)}
                >
                  Continuer vers le paiement

                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Mobile Money Payment */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              {/* Order Summary - compact */}
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-semibold mb-3">🛒 Votre commande</h3>
                <div className="space-y-1.5 mb-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} x{item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-semibold mb-3 text-lg">
                  💳 Comment voulez-vous payer ?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === method.id
                        ? `${method.bgColor} ${method.borderColor} border-2 ring-2 ring-offset-2 ring-primary/30`
                        : "border-border hover:border-primary/30"
                        }`}
                    >
                      <p className={`font-bold text-base ${selectedMethod === method.id ? method.color : "text-foreground"}`}>
                        {method.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step-by-step Instructions for novices */}
              <div className={`rounded-2xl p-5 md:p-8 border-2 ${selectedPaymentMethod.bgColor} ${selectedPaymentMethod.borderColor}`}>
                {selectedMethod === "cash_on_delivery" ? (
                  <div className="rounded-xl border border-primary/30 bg-card p-6 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-primary" />
                    <h2 className="mt-4 text-xl font-bold">Payez à la réception</h2>
                    <p className="mt-2 text-muted-foreground">Aucune capture d'écran ni référence de transaction n'est nécessaire. Préparez {formatPrice(orderTotal)} lors de la livraison.</p>
                  </div>
                ) : (<>
                  <h2 className="font-display text-xl font-bold text-foreground mb-6 text-center">
                    📱 Comment payer en 3 étapes
                  </h2>

                  {/* ÉTAPE 1 */}
                  <div className="bg-card rounded-xl p-5 mb-4 border border-border">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${selectedMethod === 'orange_money' ? 'bg-orange-500' : selectedMethod === 'wave' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>1</span>
                      <div>
                        <p className="font-bold text-base">Envoyez l'argent à ce numéro</p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Numéro du destinataire</p>
                        <p className="text-2xl font-bold tracking-wide">{selectedPaymentMethod.number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Au nom de</p>
                        <p className="font-semibold">{selectedPaymentMethod.beneficiary}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${selectedPaymentMethod.bgColor}`}>
                        <p className="text-xs text-muted-foreground">Montant à envoyer</p>
                        <p className={`text-xl font-bold ${selectedPaymentMethod.color}`}>{formatPrice(orderTotal)}</p>
                      </div>

                      {/* Action principale : ouvrir l'app de paiement */}
                      {selectedPaymentMethod.ussd ? (
                        <a
                          href={`tel:${encodeURIComponent(selectedPaymentMethod.ussd + orderTotal + '#')}`}
                          className={`block w-full py-4 rounded-xl text-white font-bold text-lg text-center transition-opacity hover:opacity-90 ${selectedMethod === 'orange_money' ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                        >
                          📲 Ouvrir {selectedPaymentMethod.name} pour payer
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPaymentMethod.number.replace(/\s/g, ''));
                            toast.success(`Numéro copié ! Ouvrez ${selectedPaymentMethod.name} et faites le transfert.`);
                          }}
                          className="block w-full py-4 rounded-xl bg-blue-500 text-white font-bold text-lg text-center transition-opacity hover:opacity-90"
                        >
                          📋 Copier le numéro de paiement
                        </button>
                      )}

                      <p className="text-xs text-muted-foreground">
                        👆 Appuyez sur le bouton, faites le transfert, puis revenez ici
                      </p>
                    </div>
                  </div>

                  {/* ÉTAPE 2 */}
                  <div className="bg-card rounded-xl p-5 mb-4 border border-border">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${selectedMethod === 'orange_money' ? 'bg-orange-500' : selectedMethod === 'wave' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>2</span>
                      <div>
                        <p className="font-bold text-base">Faites une capture d'écran</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Après le paiement, prenez une <strong>photo de l'écran</strong> qui montre que le transfert est réussi
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                      <p>💡 <strong>Astuce :</strong> Sur votre téléphone, appuyez en même temps sur le bouton <strong>power + volume bas</strong> pour prendre une capture d'écran</p>
                    </div>
                  </div>

                  {/* ÉTAPE 3 */}
                  <div className="bg-card rounded-xl p-5 mb-4 border border-border">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${selectedMethod === 'orange_money' ? 'bg-orange-500' : selectedMethod === 'wave' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>3</span>
                      <div>
                        <p className="font-bold text-base">Revenez ici et envoyez la preuve</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ajoutez la capture d'écran et le code reçu par SMS
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="transactionRef" className="text-sm font-semibold">
                          Code de transaction (reçu par SMS)
                        </Label>
                        <Input
                          id="transactionRef"
                          name="transactionRef"
                          value={formData.transactionRef}
                          onChange={handleInputChange}
                          placeholder="Ex: MP240101XXXXXX"
                          className="mt-1.5 text-base h-12"
                        />
                      </div>

                      <div>
                        <Label htmlFor="screenshot" className="text-sm font-semibold">
                          📸 Ajoutez la capture d'écran
                        </Label>
                        <div className="mt-2">
                          <label
                            htmlFor="screenshot"
                            className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${screenshot
                              ? 'border-green-500 bg-green-500/5'
                              : `${selectedPaymentMethod.borderColor} hover:bg-muted/50`
                              }`}
                          >
                            {screenshot ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-6 h-6" />
                                <span className="font-medium text-sm">{screenshot.name}</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                                <p className="text-sm font-medium text-muted-foreground">Appuyez ici pour choisir la photo</p>
                              </div>
                            )}
                            <Input
                              id="screenshot"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alternative WhatsApp */}
                  <div className="bg-card rounded-xl p-4 mb-6 border border-border text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      🤔 <strong>C'est trop compliqué ?</strong> Envoyez simplement la capture par WhatsApp :
                    </p>
                    <a
                      href={`https://wa.me/22602029494?text=${encodeURIComponent("Bonjour, je souhaite envoyer la preuve de mon paiement pour ma commande de " + formatPrice(orderTotal) + ".")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-base font-semibold transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Envoyer par WhatsApp
                    </a>
                  </div>
                </>)}

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className={`w-full h-14 text-lg font-bold ${selectedMethod === 'orange_money'
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : selectedMethod === 'wave'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : selectedMethod === 'moov_money'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-primary hover:bg-primary/90'
                      } text-white`}
                  >
                    {isSubmitting ? "Envoi en cours..." : "✅ Confirmer ma commande"}
                  </Button>
                  <Button variant="ghost" size="lg" onClick={() => setStep(1)} className="w-full">
                    ← Retour
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-14 h-14 text-secondary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Commande Envoyée!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                {selectedMethod === "cash_on_delivery"
                  ? "Votre commande a été enregistrée. Vous réglerez le montant au moment de la livraison."
                  : "Votre commande a été enregistrée avec succès. Notre équipe vérifiera votre paiement et vous contactera pour confirmer la livraison."}
              </p>

              <div className="bg-card rounded-xl p-6 max-w-md mx-auto mb-8 border border-border">
                <h3 className="font-semibold mb-4">Statut de la commande</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                    <span>{selectedMethod === "cash_on_delivery" ? "Commande reçue — paiement prévu à la livraison" : "En attente de vérification du paiement"}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Nous vous contacterons dans les 10 minutes pour confirmer votre commande
                </p>
              </div>

              {trackingNumber && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 max-w-md mx-auto mb-8">
                  <p className="text-sm text-muted-foreground">Numéro de suivi livraison</p>
                  <p className="font-mono text-xl font-bold text-primary mt-1">{trackingNumber}</p>
                  <p className="text-xs text-muted-foreground mt-2">Conservez ce numéro : il permet à notre équipe de suivre votre livraison.</p>
                </div>
              )}

              {queueNumber && (
                <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-5 max-w-md mx-auto mb-8">
                  <p className="text-sm text-muted-foreground">Votre ticket restaurant</p>
                  <p className="font-mono text-3xl font-bold text-secondary mt-1">N° {queueNumber}</p>
                  <p className="text-xs text-muted-foreground mt-2">Ouvrez le suivi pour connaître le nombre de commandes devant vous.</p>
                </div>
              )}

              {trackingNumber && <Button variant="outline" size="lg" className="mb-3" onClick={() => navigate("/suivi-livraison")}>Suivre ma livraison</Button>}

              <Button variant="default" size="lg" onClick={() => navigate("/")}>
                Retour à l'accueil
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRadians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lon2 - lon1);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default Paiement;
