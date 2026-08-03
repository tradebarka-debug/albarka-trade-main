import { useEffect, useState } from "react";
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
  category: string | null;
  country: string | null;
  country_id: number | null;
  is_active: boolean | null;
  sort_order: number | null;
};

const defaultForm = {
  name: "",
  slug: "",
  image_url: "",
  description: "",
  location: "",
  hours: "",
  telephone: "",
  category: "Restaurant",
  country: "Burkina Faso",
  country_id: 1,
  is_active: true,
  sort_order: 0,
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<RestaurantPartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("restaurant_partners")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false });

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

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, country_id: Number(localStorage.getItem("country_id") || 1) });
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
      category: restaurant.category || "Restaurant",
      country: restaurant.country || "Burkina Faso",
      country_id: restaurant.country_id || Number(localStorage.getItem("country_id") || 1),
      is_active: restaurant.is_active ?? true,
      sort_order: restaurant.sort_order ?? 0,
    });
    setDialogOpen(true);
  };

  const saveRestaurant = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom du restaurant est obligatoire");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      image_url: form.image_url.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      hours: form.hours.trim(),
      telephone: form.telephone.trim(),
      category: form.category.trim(),
      country: form.country.trim(),
      country_id: Number(form.country_id),
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
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
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(restaurant)}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteRestaurant(restaurant.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
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
              <Label>Heures</Label>
              <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ordre affichage</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
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
    </div>
  );
};

export default AdminRestaurants;