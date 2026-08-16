import { useEffect, useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type RestaurantRow = { id: string; name: string | null };
type MenuItemRow = {
  id: string;
  restaurant_id: string | null;
  country_id: number | null;
  country: string | null;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean | null;
};

const countryLabel = (countryId: number) => (countryId === 2 ? "Côte d'Ivoire" : "Burkina Faso");

const defaultForm = {
  restaurant_id: "",
  name: "",
  description: "",
  price: "",
  image_url: "",
  is_available: true,
};

const RestaurantMenus = () => {
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(Number(localStorage.getItem("country_id") || 1));
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    const [{ data: restaurantsData, error: restaurantsError }, { data: menuData, error: menuError }] = await Promise.all([
      supabase.from("restaurant_partners" as any).select("id, name").eq("country_id", selectedCountry),
      supabase.from("restaurant_menu_items" as any).select("*").eq("country_id", selectedCountry).order("id", { ascending: false }),
    ]);

    if (restaurantsError) console.error(restaurantsError);
    if (menuError) {
      console.error(menuError);
      toast.error("Impossible de charger les menus");
    }

    setRestaurants((restaurantsData as RestaurantRow[]) || []);
    setMenuItems((menuData as MenuItemRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [selectedCountry]);

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    resetImage();
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItemRow) => {
    setEditingId(item.id);
    setForm({
      restaurant_id: item.restaurant_id || "",
      name: item.name || "",
      description: item.description || "",
      price: item.price != null ? String(item.price) : "",
      image_url: item.image_url || "",
      is_available: item.is_available ?? true,
    });
    setImageFile(null);
    setImagePreview(item.image_url || null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(defaultForm);
    resetImage();
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
    const path = `menus/${uniqueName}.${extension}`;
    const { error } = await supabase.storage.from("restaurant-images").upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("restaurant-images").getPublicUrl(path).data.publicUrl;
  };

  const saveMenuItem = async () => {
    if (!form.restaurant_id) {
      toast.error("Choisissez un restaurant");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Le nom du plat est obligatoire");
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
      restaurant_id: form.restaurant_id,
      country_id: selectedCountry,
      country: countryLabel(selectedCountry),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      image_url: imageUrl,
      is_available: form.is_available,
    };

    if (editingId) {
      const { error } = await supabase.from("restaurant_menu_items" as any).update(payload).eq("id", editingId);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de la modification");
        return;
      }
      toast.success("Menu modifié");
    } else {
      const { error } = await supabase.from("restaurant_menu_items" as any).insert(payload);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de l’ajout");
        return;
      }
      toast.success("Menu ajouté");
    }

    closeDialog();
    void loadData();
  };

  const deleteMenuItem = async (id: string) => {
    if (!window.confirm("Supprimer ce plat du menu ?")) return;
    const { error } = await supabase.from("restaurant_menu_items" as any).delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Plat supprimé");
    void loadData();
  };

  const restaurantName = (restaurantId: string | null) =>
    restaurants.find((restaurant) => restaurant.id === restaurantId)?.name || "—";

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Menus restaurants</CardTitle>
            <p className="text-sm text-muted-foreground">{menuItems.length} plat(s) référencé(s)</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(Number(e.target.value))}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value={1}>🇧🇫 Burkina Faso</option>
              <option value={2}>🇨🇮 Côte d'Ivoire</option>
            </select>
            <Button onClick={openCreate}>Ajouter un plat</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : menuItems.length === 0 ? (
            <p className="text-muted-foreground">Aucun plat enregistré pour ce pays.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {menuItems.map((item) => (
                <div key={item.id} className="rounded-xl border bg-card p-4 space-y-3">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name || "Plat"} className="h-40 w-full rounded-lg object-cover" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{restaurantName(item.restaurant_id)}</p>
                  </div>
                  <p className="text-sm line-clamp-3">{item.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.price} FCFA</span>
                    <span className="text-xs rounded-full bg-muted px-2 py-1">{item.is_available ? "Disponible" : "Indisponible"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => void deleteMenuItem(item.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le plat" : "Ajouter un plat"}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Restaurant *</Label>
              <select
                value={form.restaurant_id}
                onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Choisir un restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nom du plat *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prix (FCFA)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Image du plat</Label>
              {imagePreview ? (
                <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border">
                  <img src={imagePreview} alt="Aperçu du plat" className="h-full w-full object-cover" />
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
            <div className="space-y-2 md:col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Disponible</Label>
                <p className="text-sm text-muted-foreground">Ce plat sera visible et commandable côté public</p>
              </div>
              <Switch checked={form.is_available} onCheckedChange={(checked) => setForm({ ...form, is_available: checked })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={() => void saveMenuItem()}>Sauvegarder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantMenus;
