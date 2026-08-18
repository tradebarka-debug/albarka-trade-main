import { useEffect, useState } from "react";
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

const Paiement = () => {
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
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [requiresDelivery, setRequiresDelivery] = useState(true);
  const [disposableKits, setDisposableKits] = useState(false);
  const [kitQuantity, setKitQuantity] = useState(1);
  const [restaurantConfig, setRestaurantConfig] = useState<any>(null);
  const restaurantId = items.find((item) => item.restaurantId)?.restaurantId || null;

  useEffect(() => {
    if (!restaurantId) { setRestaurantConfig(null); return; }
    void (async () => {
      const { data } = await (supabase.from("restaurant_partners") as any)
        .select("id,name,whatsapp,telephone,payment_phone,payment_beneficiary,latitude,longitude,delivery_fee,delivery_fee_per_km,disposable_kit_fee")
        .eq("id", restaurantId)
        .maybeSingle();
      setRestaurantConfig(data);
    })();
  }, [restaurantId]);

  const distanceKm = coordinates && restaurantConfig?.latitude != null && restaurantConfig?.longitude != null
    ? haversineDistance(coordinates.latitude, coordinates.longitude, Number(restaurantConfig.latitude), Number(restaurantConfig.longitude))
    : 0;
  const deliveryFee = requiresDelivery && restaurantId
    ? Math.ceil(Number(restaurantConfig?.delivery_fee || 0) + distanceKm * Number(restaurantConfig?.delivery_fee_per_km || 0))
    : 0;
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

  const captureLocation = () => {
    if (!window.isSecureContext) {
      setShowManualLocation(true);
      toast.error("La position automatique est bloquée sur une adresse HTTP locale. Utilisez HTTPS ou saisissez les coordonnées manuellement.");
      return;
    }
    if (!navigator.geolocation) {
      setShowManualLocation(true);
      toast.error("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setIsLocating(false);
        toast.success("Position ajoutée à votre livraison.");
      },
      (error) => {
        setIsLocating(false);
        setShowManualLocation(true);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Autorisation refusée. Activez la localisation pour ce site ou saisissez les coordonnées manuellement.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("La recherche de position a expiré. Réessayez à l'extérieur ou saisissez-la manuellement.");
        } else {
          toast.error("Position indisponible. Vous pouvez saisir les coordonnées manuellement.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const saveManualLocation = () => {
    const latitude = Number(manualLatitude.replace(",", "."));
    const longitude = Number(manualLongitude.replace(",", "."));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast.error("Saisissez une latitude et une longitude valides.");
      return;
    }
    setCoordinates({ latitude, longitude });
    toast.success("Position manuelle enregistrée.");
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshot || !user) return null;

    const fileExt = screenshot.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, screenshot);

    if (error) {
      console.error('Error uploading screenshot:', error);
      return null;
    }

    return fileName;
  };

  const sendWhatsAppNotification = (order: { tracking_number?: string | null; queue_number?: number | null }, restaurantDetails: any) => {
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

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // wa.me est le lien universel officiel WhatsApp : fonctionne sur mobile
    // (ouvre l'app) comme sur desktop (ouvre WhatsApp Web ou propose l'app).
    const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;

    // Redirection directe de l'onglet courant : window.open("_blank") est
    // souvent bloqué par le navigateur une fois qu'un await a eu lieu avant
    // l'appel (perte du contexte "geste utilisateur").
    window.location.href = whatsappUrl;
    return true;
  };
  const appliedPromoCode =
    location.state?.appliedPromoCode ||
    localStorage.getItem("promoCode") ||
    "";
  const handleSubmitOrder = async () => {
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

      if (selectedMethod !== "cash_on_delivery" && !formData.transactionRef) {
        toast.error("Veuillez entrer la référence de transaction");
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

      setIsSubmitting(true);

      // L'upload de la capture necessite un compte connecte (chemin de
      // stockage prefixe par user.id) ; en invite, la commande est quand
      // meme enregistree, juste sans capture jointe.
      const screenshotUrl = selectedMethod !== "cash_on_delivery" && user ? await uploadScreenshot() : null;

      // La commande doit toujours etre enregistree, connecte ou non,
      // sinon elle n'apparait jamais dans "Gestion des paiements".
      const { data: order, error: paymentError } = await (supabase as any)
        .from("orders")
        .insert({
          customer_name: formData.name,
          telephone: formData.phone,
          address: formData.address,
          items: JSON.stringify(items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, unit_price: item.price, restaurant_id: item.restaurantId || null }))),
          total: orderTotal,
          payment_method: selectedMethod,
          transaction_ref: selectedMethod === "cash_on_delivery" ? null : formData.transactionRef,
          status: "pending",
          promo_code: appliedPromoCode || null,
          screenshot: screenshotUrl,
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
          disposable_kit_quantity: disposableKits ? Math.max(1, kitQuantity) : 0,
          disposable_kit_fee: disposableKitFee,
        })
        .select("id, tracking_number, queue_number")
        .single();

      if (paymentError) {
        console.error('Error saving payment request:', paymentError);
        toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
        setIsSubmitting(false);
        return;
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
      sendWhatsAppNotification(order || {}, notificationRestaurant);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
      setIsSubmitting(false);
    }
  };

  const basePaymentMethod = paymentMethods.find(m => m.id === selectedMethod)!;
  const selectedPaymentMethod = restaurantId && selectedMethod !== "cash_on_delivery"
    ? {
        ...basePaymentMethod,
        number: restaurantConfig?.payment_phone || "Non configuré",
        beneficiary: restaurantConfig?.payment_beneficiary || restaurantConfig?.name || "Restaurant partenaire",
        ussd: "",
      }
    : basePaymentMethod;


    if (items.length === 0 && step !== 3) {
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
            {step === 1 && (
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">Position de livraison</p>
                        <p className="text-sm text-muted-foreground">Facultatif, mais recommandé pour permettre au livreur de vous trouver.</p>
                      </div>
                      <Button type="button" variant="outline" onClick={captureLocation} disabled={isLocating} className="gap-2">
                        <LocateFixed className="w-4 h-4" />
                        {isLocating ? "Localisation..." : coordinates ? "Position ajoutée" : "Ajouter ma position"}
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
                    <button type="button" className="mt-3 text-sm font-medium text-muted-foreground underline" onClick={() => setShowManualLocation((visible) => !visible)}>
                      {showManualLocation ? "Masquer l'option avancée" : "Option avancée : saisir les coordonnées"}
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
                        {requiresDelivery && <div className="flex justify-between"><span>Distance estimée</span><strong>{distanceKm ? `${distanceKm.toFixed(1)} km` : "Ajoutez votre position GPS"}</strong></div>}
                        <div className="flex justify-between"><span>Frais de livraison</span><strong>{formatPrice(deliveryFee)}</strong></div>
                        {disposableKits && <div className="flex justify-between"><span>Kits jetables</span><strong>{formatPrice(disposableKitFee)}</strong></div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => setStep(2)}
                    disabled={!formData.name || !formData.phone || !formData.address}
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
