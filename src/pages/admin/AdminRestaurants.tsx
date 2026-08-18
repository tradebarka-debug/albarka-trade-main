import { useEffect, useRef, useState } from "react";
import { Copy, Download, ImageIcon, QrCode, X } from "lucide-react";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type RestaurantPartnerRow = {
  id: string;
  name: string | null;
  slug: string | null;
  image_url: string | null;
  description: string | null;
  location: string | null;
  hours: string | null;
  telephone: string | null;
  whatsapp?: string | null;
  payment_phone?: string | null;
  payment_beneficiary?: string | null;
  delivery_fee?: number | null;
  delivery_fee_per_km?: number | null;
  disposable_kit_fee?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  estimated_delivery_time?: string | null;
  is_available?: boolean | null;
  category: string | null;
  country: string | null;
  country_id: number | null;
  is_active: boolean | null;
  display_order: number | null;
};

const defaultForm = {
  name: "",
  slug: "",
  image_url: "",
  description: "",
  location: "",
  hours: "",
  telephone: "",
  whatsapp: "",
  payment_phone: "",
  payment_beneficiary: "",
  delivery_fee: 0,
  delivery_fee_per_km: 0,
  disposable_kit_fee: 0,
  latitude: "",
  longitude: "",
  estimated_delivery_time: "",
  is_available: true,
  category: "Restaurant",
  country: "Burkina Faso",
  country_id: 1,
  is_active: true,
  display_order: 0,
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<RestaurantPartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrRestaurant, setQrRestaurant] = useState<RestaurantPartnerRow | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("restaurant_partners")
      .select("*")
      .order("display_order", { ascending: true, nullsFirst: false });

    if (error) {
      console.error(error);
      toast.error("Impossible de charger les restaurants partenaires");
      setLoading(false);
      return;
    }

    setRestaurants((data as RestaurantPartnerRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, country_id: Number(localStorage.getItem("country_id") || 1) });
    resetImage();
    setDialogOpen(true);
  };

  const openEdit = (restaurant: RestaurantPartnerRow) => {
    setEditingId(restaurant.id);
    setForm({
      name: restaurant.name || "",
      slug: restaurant.slug || "",
      image_url: restaurant.image_url || "",
      description: restaurant.description || "",
      location: restaurant.location || "",
      hours: restaurant.hours || "",
      telephone: restaurant.telephone || "",
      whatsapp: restaurant.whatsapp || "",
      payment_phone: restaurant.payment_phone || "",
      payment_beneficiary: restaurant.payment_beneficiary || "",
      delivery_fee: restaurant.delivery_fee ?? 0,
      delivery_fee_per_km: restaurant.delivery_fee_per_km ?? 0,
      disposable_kit_fee: restaurant.disposable_kit_fee ?? 0,
      latitude: restaurant.latitude != null ? String(restaurant.latitude) : "",
      longitude: restaurant.longitude != null ? String(restaurant.longitude) : "",
      estimated_delivery_time: restaurant.estimated_delivery_time || "",
      is_available: restaurant.is_available ?? true,
      category: restaurant.category || "Restaurant",
      country: restaurant.country || "Burkina Faso",
      country_id: restaurant.country_id || Number(localStorage.getItem("country_id") || 1),
      is_active: restaurant.is_active ?? true,
      display_order: restaurant.display_order ?? 0,
    });
    setImageFile(null);
    setImagePreview(restaurant.image_url || null);
    setDialogOpen(true);
  };

  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum");
      event.target.value = "";
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((current) => ({ ...current, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file: File) => {
    const extension = file.name.split(".").pop() || "png";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const path = `restaurants/${uniqueName}.${extension}`;
    const { error } = await supabase.storage.from("restaurant-images").upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("restaurant-images").getPublicUrl(path).data.publicUrl;
  };

  const saveRestaurant = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom du restaurant est obligatoire");
      return;
    }

    let imageUrl = form.image_url.trim();
    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l’envoi de l’image");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      image_url: imageUrl,
      description: form.description.trim(),
      location: form.location.trim(),
      hours: form.hours.trim(),
      telephone: form.telephone.trim(),
      whatsapp: form.whatsapp.trim(),
      payment_phone: form.payment_phone.trim(),
      payment_beneficiary: form.payment_beneficiary.trim(),
      delivery_fee: Number(form.delivery_fee) || 0,
      delivery_fee_per_km: Number(form.delivery_fee_per_km) || 0,
      disposable_kit_fee: Number(form.disposable_kit_fee) || 0,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      estimated_delivery_time: form.estimated_delivery_time.trim(),
      is_available: form.is_available,
      category: form.category.trim(),
      country: form.country.trim(),
      country_id: Number(form.country_id),
      is_active: form.is_active,
      display_order: Number(form.display_order),
    };

    if (editingId) {
      const { error } = await supabase.from("restaurant_partners").update(payload).eq("id", editingId);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de la modification");
        return;
      }
      toast.success("Restaurant modifié");
    } else {
      const { error } = await supabase.from("restaurant_partners").insert(payload);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de l’ajout");
        return;
      }
      toast.success("Restaurant ajouté");
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...defaultForm, country_id: Number(localStorage.getItem("country_id") || 1) });
    resetImage();
    loadRestaurants();
  };

  const deleteRestaurant = async (id: string) => {
    const confirmDelete = window.confirm("Supprimer ce restaurant partenaire ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("restaurant_partners").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Suppression impossible");
      return;
    }

    toast.success("Restaurant supprimé");
    loadRestaurants();
  };

  const restaurantUrl = qrRestaurant?.slug
    ? `${window.location.origin}/restaurant/${qrRestaurant.slug}${qrRestaurant.country_id ? `?country=${qrRestaurant.country_id}` : ""}`
    : "";

  const copyRestaurantUrl = async () => {
    await navigator.clipboard.writeText(restaurantUrl);
    toast.success("Lien du restaurant copié");
  };

  const downloadQrCode = () => {
    const svg = document.getElementById("restaurant-qr-code");
    if (!svg || !qrRestaurant) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${qrRestaurant.slug || "restaurant"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Restaurants partenaires</CardTitle>
            <p className="text-sm text-muted-foreground">{restaurants.length} restaurant(s) référencé(s)</p>
          </div>
          <Button onClick={openCreate}>Ajouter un restaurant</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="rounded-xl border bg-card p-4 space-y-3">
                  {restaurant.image_url && (
                    <img src={restaurant.image_url} alt={restaurant.name || "Restaurant"} className="h-40 w-full rounded-lg object-cover" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">{restaurant.location}</p>
                  </div>
                  <p className="text-sm line-clamp-3">{restaurant.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs rounded-full bg-muted px-2 py-1">{restaurant.country}</span>
                    <span className="text-xs rounded-full bg-muted px-2 py-1">{restaurant.is_active ? "Actif" : "Inactif"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(restaurant)}>Modifier</Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setQrRestaurant(restaurant)} disabled={!restaurant.slug}><QrCode className="h-4 w-4" /> QR et lien</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteRestaurant(restaurant.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le restaurant" : "Ajouter un restaurant"}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, name: value, slug: value.toLowerCase().replace(/\s+/g, "-") });
              }} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Adresse / localité</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp du restaurant</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="22670000000" />
            </div>
            <div className="space-y-2">
              <Label>Numéro de réception des paiements</Label>
              <Input value={form.payment_phone} onChange={(e) => setForm({ ...form, payment_phone: e.target.value })} placeholder="Ex. +225 01 23 45 67 89" />
              <p className="text-xs text-muted-foreground">Numéro Mobile Money affiché aux clients avant l'activation de CinetPay.</p>
            </div>
            <div className="space-y-2">
              <Label>Nom du bénéficiaire du paiement</Label>
              <Input value={form.payment_beneficiary} onChange={(e) => setForm({ ...form, payment_beneficiary: e.target.value })} placeholder="Nom affiché sur le compte Mobile Money" />
            </div>
            <div className="space-y-2">
              <Label>Heures</Label>
              <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Frais de livraison (FCFA)</Label>
              <Input type="number" min="0" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Tarif par kilomètre (FCFA)</Label>
              <Input type="number" min="0" value={form.delivery_fee_per_km} onChange={(e) => setForm({ ...form, delivery_fee_per_km: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Prix d'un kit jetable (FCFA)</Label>
              <Input type="number" min="0" value={form.disposable_kit_fee} onChange={(e) => setForm({ ...form, disposable_kit_fee: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Latitude du restaurant</Label>
              <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="12.3714" />
            </div>
            <div className="space-y-2">
              <Label>Longitude du restaurant</Label>
              <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-1.5197" />
            </div>
            <div className="space-y-2">
              <Label>Temps estimé</Label>
              <Input value={form.estimated_delivery_time} onChange={(e) => setForm({ ...form, estimated_delivery_time: e.target.value })} placeholder="30 à 45 min" />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ordre affichage</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
              <div><Label>Disponible pour les commandes</Label><p className="text-sm text-muted-foreground">Les clients pourront ajouter les plats au panier.</p></div>
              <Switch checked={form.is_available} onCheckedChange={(is_available) => setForm({ ...form, is_available })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Image du restaurant</Label>
              {imagePreview ? (
                <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border">
                  <img src={imagePreview} alt="Aperçu du restaurant" className="h-full w-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2" onClick={removeImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full max-w-xs flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary"
                >
                  <ImageIcon className="mb-2 h-9 w-9" />
                  <span className="text-xs">JPG, PNG, WebP<br />5 Mo maximum</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectImage} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2 md:col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Visible côté public</Label>
                <p className="text-sm text-muted-foreground">Ce restaurant sera affiché sur la page public</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveRestaurant}>Sauvegarder</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(qrRestaurant)} onOpenChange={(open) => !open && setQrRestaurant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR code de {qrRestaurant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-center">
            <p className="text-sm text-muted-foreground">Le client scanne ce code et arrive directement sur la page et le menu de ce restaurant.</p>
            <div className="mx-auto w-fit rounded-2xl border bg-white p-5">
              {restaurantUrl && <QRCode id="restaurant-qr-code" value={restaurantUrl} size={220} />}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-left text-sm break-all">{restaurantUrl}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="gap-2" onClick={copyRestaurantUrl}><Copy className="h-4 w-4" />Copier le lien</Button>
              <Button className="gap-2" onClick={downloadQrCode}><Download className="h-4 w-4" />Télécharger le QR</Button>
            </div>
            {window.location.hostname === "localhost" && <p className="text-xs text-amber-700">Attention : ce QR utilise actuellement localhost. Sur le site publié, il utilisera automatiquement l’adresse publique du site.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRestaurants;
