import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Upload, Phone, QrCode, Smartphone } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updatePartnerStats } from "@/utils/promoCode";
import { any } from "zod";

type PaymentMethod = "orange_money" | "wave" | "moov_money";

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
];

const Paiement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalPrice, clearCart } = useCart();
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

  const uploadScreenshot = async (): Promise<string | null> => {
    console.log("SCREENSHOT =", screenshot);
    console.log("USER =", user);
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

  const sendWhatsAppNotification = () => {
    const adminPhone = "22602029494"; // Numéro admin sans le +
    const methodName = paymentMethods.find(m => m.id === selectedMethod)?.name || selectedMethod;

    const message = `🔔 *Nouvelle commande Albarka Trade*

👤 *Client:* ${formData.name}
📱 *Téléphone:* ${formData.phone}
 🏙️ *Commune:* ${formData.commune}
📍 *Adresse:* ${formData.address}

💰 *Montant:* ${formatPrice(totalPrice)}
💳 *Méthode:* ${methodName}
🔢 *Réf. Transaction:* ${formData.transactionRef}

📦 *Articles:*
${items.map(item => `• ${item.name} x${item.quantity} = ${formatPrice(item.price * item.quantity)}`).join('\n')}

⏰ Merci de vérifier et valider cette commande.`;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const whatsappUrl = isMobile
      ? `whatsapp://send?phone=${adminPhone}&text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?phone=${adminPhone}&text=${encodeURIComponent(message)}`;

    console.log("URL WhatsApp:", whatsappUrl);
    window.open(whatsappUrl, "_blank");
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

      if (!formData.transactionRef) {
        toast.error("Veuillez entrer la référence de transaction");
        return;
      }

      if (!screenshot) {
        toast.error("Veuillez ajouter la capture d'écran de votre paiement");
        return;
      }

      setIsSubmitting(true);

      let screenshotUrl = await uploadScreenshot();
      if (screenshot) {
        if (user) {
          screenshotUrl = await uploadScreenshot();
        }
      }

      // Save payment request to database if user is logged in
      if (user) {
        // Insert payment request (without phone number for security)
        const { data: paymentData, error: paymentError } = await (supabase as any)
          .from("orders")
          .insert({
            customer_name: formData.name,
            phone: formData.phone,
            address: formData.address,
            total: totalPrice,
            payment_method: selectedMethod,
            transaction_ref: formData.transactionRef,
            status: "pending",
            promo_code: appliedPromoCode || null,
            screenshot: screenshotUrl,
          })
          .select("id")
          .single();

        if (paymentError) {
          console.error('Error saving payment request:', paymentError);
          toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
          setIsSubmitting(false);
          return;
        }
         }
        // Store phone number separately in protected table (only admins can read)

        // Save order items for stock tracking



        // Envoyer notification WhatsApp à l'admin
        // commission partenaire desactivée ici.
        // Elle sera ajoutée seulement après validation du paiement par l'admin.
        sendWhatsAppNotification();

        setIsSubmitting(false);
        setStep(3);
        clearCart();
        localStorage.removeItem("promoCode");
        toast.success("Commande envoyée avec succès!");
      } catch (error) {
        console.error('Error submitting order:', error);
        toast.error("Une erreur est survenue. Veuillez réessayer.");
        setIsSubmitting(false);
      }
    } 

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod)!;


    if (items.length === 0 && step !== 3) {
      navigate("/panier");
      return null;
    }

    return (
      <main className="min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
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
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <h3 className="font-semibold mb-3 text-lg">
                    💳 Comment voulez-vous payer ?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <p className={`text-xl font-bold ${selectedPaymentMethod.color}`}>{formatPrice(totalPrice)}</p>
                      </div>

                      {/* Action principale : ouvrir l'app de paiement */}
                      {selectedPaymentMethod.ussd ? (
                        <a
                          href={`tel:${encodeURIComponent(selectedPaymentMethod.ussd + totalPrice + '#')}`}
                          className={`block w-full py-4 rounded-xl text-white font-bold text-lg text-center transition-opacity hover:opacity-90 ${selectedMethod === 'orange_money' ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                        >
                          📲 Ouvrir {selectedPaymentMethod.name} pour payer
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPaymentMethod.number.replace(/\s/g, ''));
                            toast.success("Numéro copié ! Ouvrez l'application Wave et faites le transfert.");
                          }}
                          className="block w-full py-4 rounded-xl bg-blue-500 text-white font-bold text-lg text-center transition-opacity hover:opacity-90"
                        >
                          📋 Copier le numéro et ouvrir Wave
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
                      href={`https://wa.me/22602029494?text=${encodeURIComponent("Bonjour, je souhaite envoyer la preuve de mon paiement pour ma commande de " + formatPrice(totalPrice) + ".")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-base font-semibold transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Envoyer par WhatsApp
                    </a>
                  </div>

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
                          : 'bg-green-500 hover:bg-green-600'
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
                  Votre commande a été enregistrée avec succès. Notre équipe vérifiera votre paiement
                  et vous contactera pour confirmer la livraison.
                </p>

                <div className="bg-card rounded-xl p-6 max-w-md mx-auto mb-8 border border-border">
                  <h3 className="font-semibold mb-4">Statut de la commande</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                      <span>En attente de vérification du paiement</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Nous vous contacterons dans les 10 minutes pour confirmer votre commande
                  </p>
                </div>

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

  export default Paiement;
