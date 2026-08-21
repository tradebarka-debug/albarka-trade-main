import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Search, X, ImageIcon, Upload, Loader2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useFastFoodItems, FastFoodItem, FastFoodFormData, fastFoodCategories } from "@/hooks/useFastFoodItems";

const AdminFastFood = () => {
  const [countryId, setCountryId] = useState(1);
  const { items, isLoading, createItem, updateItem, deleteItem } = useFastFoodItems(countryId);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    slug: "",
    image_url: "",
    description: "",
  });
  useEffect(() => {
    const savedRestaurants = localStorage.getItem("restaurants");

    if (savedRestaurants) {
      setRestaurants(JSON.parse(savedRestaurants));
    }
  }, []);
  const addRestaurant = () => {
    const updatedRestaurants = [...restaurants, newRestaurant];

    setRestaurants(updatedRestaurants);

    localStorage.setItem(
      "restaurants",
      JSON.stringify(updatedRestaurants)
    );

    setNewRestaurant({
      name: "",
      slug: "",
      image_url: "",
      description: "",
    });
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FastFoodItem | null>(null);
  const [formData, setFormData] = useState<FastFoodFormData>({
    name: "", description: "", price: "", category: "Burgers", isActive: true, sortOrder: "0", countryId: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDialog = (item?: FastFoodItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        category: item.category,
        isActive: item.is_active,
        sortOrder: item.sort_order.toString(),
        countryId: item.country_id || countryId,
      });
      setImagePreview(item.image || null);
    } else {
      setEditingItem(null);
      setFormData({ name: "", description: "", price: "", category: "Burgers", isActive: true, sortOrder: "0", countryId });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Fichier trop volumineux", description: "L'image ne doit pas dépasser 5 Mo", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `fastfood/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('fastfood-images').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('fastfood-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({ title: "Erreur", description: "Nom et prix sont obligatoires", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      let imageUrl: string | null | undefined = undefined;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      if (editingItem) {
        await updateItem(editingItem.id, formData, imageUrl);
        toast({ title: "Plat modifié", description: "Le plat a été mis à jour" });
      } else {
        await createItem(formData, imageUrl || null);
        toast({ title: "Plat ajouté", description: "Le nouveau plat a été créé" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!window.confirm("Supprimer définitivement ce plat ?")) return;
      await deleteItem(id);
      toast({ title: "Plat supprimé", description: "Le plat a été supprimé" });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="bg-zinc-900 p-6 rounded-2xl">
       
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Menu Fast Food</h1>
          <p className="text-muted-foreground">Gérez les {items.length} plats du menu</p>
        </div>
        <Select value={String(countryId)} onValueChange={(value) => setCountryId(Number(value))}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Pays" /></SelectTrigger>
          <SelectContent><SelectItem value="1">Burkina Faso</SelectItem><SelectItem value="2">Côte d’Ivoire</SelectItem></SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="btn-primary-glow">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un plat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Modifier le plat" : "Nouveau plat"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Modifiez les informations du plat." : "Ajoutez un nouveau plat au menu."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Image Upload */}
              <div>
                <Label>Photo du plat</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                      <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={removeImage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Cliquez pour ajouter une image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP (max 5 Mo)</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                </div>
              </div>

              <div>
                <Label htmlFor="name">Nom du plat *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Burger Classic" />
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                  <SelectContent>
                    {fastFoodCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Pays de publication</Label>
                <Select value={String(formData.countryId)} onValueChange={(value) => setFormData({ ...formData, countryId: Number(value) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Burkina Faso</SelectItem><SelectItem value="2">Côte d’Ivoire</SelectItem></SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prix (FCFA) *</Label>
                  <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} onWheel={(e) => e.currentTarget.blur()} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="2500" />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Ordre d'affichage</Label>
                  <Input id="sortOrder" type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} onWheel={(e) => e.currentTarget.blur()} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Ingrédients, garnitures..." rows={3} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Actif (visible dans le menu)</Label>
                <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>Annuler</Button>
                <Button onClick={handleSave} className="btn-primary-glow" disabled={isUploading}>
                  {isUploading ? (<><Upload className="w-4 h-4 mr-2 animate-pulse" />Sauvegarde...</>) : (editingItem ? "Modifier" : "Ajouter")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-xs text-muted-foreground">Total plats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {fastFoodCategories.map((cat) => (
          <Card key={cat} className="bg-card/50">
            <CardContent className="p-4">
              <div>
                <p className="text-2xl font-bold">{items.filter(i => i.category === cat).length}</p>
                <p className="text-xs text-muted-foreground">{cat}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher un plat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {fastFoodCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Ordre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun plat trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                        {item.image ? (
  <img
    src={item.image}
    alt={item.name}
    className="w-12 h-12 rounded-md object-cover"
  />
) : (
  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
    <ImageIcon className="w-5 h-5 text-muted-foreground" />
  </div>
)}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                    <TableCell>{formatPrice(item.price)}</TableCell>
                    <TableCell>{item.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "outline"}>
                        {item.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFastFood;
