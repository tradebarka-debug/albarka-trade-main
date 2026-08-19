import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationPortal, Warehouse, OrganizationProduct, MenuItem } from "@/hooks/useOrganizationPortal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Store, Package, Users, LogOut, ImageIcon, X, UtensilsCrossed, ClipboardList, Wallet, TrendingUp, LocateFixed, MapPin } from "lucide-react";

const emptyWarehouseForm = { id: null as number | null, name: "", address: "", latitude: "", longitude: "" };
const emptyProductForm = { id: null as number | null, name: "", description: "", category: "", price: "", unit: "", image: "" };
const emptyRestaurantForm = { name: "", description: "", location: "", hours: "", telephone: "", image_url: "" };
const emptyMenuItemForm = { id: null as string | null, name: "", description: "", price: "", image_url: "", is_available: true };
const emptyEmployeeForm = { full_name: "", email: "", password: "", organization_role_id: "", restaurant_outlet_id: "" };
const emptyOutletForm = { id: null as number | null, name: "", neighborhood: "", address: "", telephone: "", is_active: true };

async function uploadProductImage(file: File) {
  const extension = file.name.split(".").pop() || "png";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `products/${uniqueName}.${extension}`;
  const { error } = await supabase.storage.from("organization-products").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("organization-products").getPublicUrl(path).data.publicUrl;
}

async function uploadMenuOrRestaurantImage(file: File, folder: "menu-items" | "restaurants") {
  const extension = file.name.split(".").pop() || "png";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${folder}/${uniqueName}.${extension}`;
  const { error } = await supabase.storage.from("organization-products").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("organization-products").getPublicUrl(path).data.publicUrl;
}

export default function OrganisationDashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, loading, error, refetch, callAction } = useOrganizationPortal();

  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouseForm);
  const [warehouseLocating, setWarehouseLocating] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurantForm);
  const [restaurantImageFile, setRestaurantImageFile] = useState<File | null>(null);
  const [restaurantImagePreview, setRestaurantImagePreview] = useState<string | null>(null);
  const [restaurantInitialized, setRestaurantInitialized] = useState(false);
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState(emptyMenuItemForm);
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [financeForm, setFinanceForm] = useState({ entry_type: "expense", category: "", amount: "", payment_method: "cash", description: "" });
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [outletDialogOpen, setOutletDialogOpen] = useState(false);
  const [outletForm, setOutletForm] = useState(emptyOutletForm);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <h1 className="text-xl font-bold text-destructive">Accès impossible</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => void signOut()} variant="outline">Se déconnecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { organization, warehouses, products, employees, roles = [], outlets = [], stock, performance, restaurant, menuItems, restaurantOrders = [], cashSessions = [], financialEntries = [], isPdg, roleCode, capabilities } = data;
  const isRestaurant = (organization as any)?.organization_type === "restaurant";
  const openCashSession = cashSessions.find((session) => session.status === "open");
  const totalIncome = financialEntries.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalExpenses = financialEntries.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const employeeRoles = roles.filter((role) => !["ceo", "pdg", "president", "directeur_general", "directeur_generale", "general_management"].includes(role.code.toLowerCase()));

  const createEmployee = async () => {
    if (!employeeForm.full_name.trim() || !employeeForm.email.trim() || !employeeForm.organization_role_id || !employeeForm.restaurant_outlet_id || employeeForm.password.length < 8) {
      toast({ title: "Informations incomplètes", description: "Renseignez le nom, l'e-mail, le poste et un mot de passe d'au moins 8 caractères.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await callAction("create_organization_employee", { ...employeeForm, organization_role_id: Number(employeeForm.organization_role_id), restaurant_outlet_id: Number(employeeForm.restaurant_outlet_id) });
      toast({ title: "Compte créé", description: "L'employé est maintenant rattaché à votre organisation." });
      setEmployeeForm(emptyEmployeeForm);
      setEmployeeDialogOpen(false);
      await refetch();
    } catch (employeeError: any) {
      toast({ title: "Création impossible", description: employeeError?.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const saveOutlet = async () => {
    if (!outletForm.name.trim()) return;
    setSubmitting(true);
    try {
      await callAction("upsert_restaurant_outlet", outletForm);
      toast({ title: outletForm.id ? "Point de vente modifié" : "Point de vente créé" });
      setOutletForm(emptyOutletForm); setOutletDialogOpen(false); await refetch();
    } catch (outletError: any) {
      toast({ title: "Enregistrement impossible", description: outletError?.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (isRestaurant && !restaurantInitialized) {
    setRestaurantInitialized(true);
    setRestaurantForm({
      name: restaurant?.name ?? (organization as any)?.name ?? "",
      description: restaurant?.description ?? "",
      location: restaurant?.location ?? "",
      hours: restaurant?.hours ?? "",
      telephone: restaurant?.telephone ?? "",
      image_url: restaurant?.image_url ?? "",
    });
    setRestaurantImagePreview(restaurant?.image_url ?? null);
  }

  const stockFor = (warehouseId: number, productId: number) =>
    stock.find((s) => s.warehouse_id === warehouseId && s.organization_product_id === productId)?.quantity ?? 0;

  const openWarehouseDialog = (warehouse?: Warehouse) => {
    setWarehouseForm(
      warehouse
        ? {
            id: warehouse.id,
            name: warehouse.name,
            address: warehouse.address ?? "",
            latitude: warehouse.latitude?.toString() ?? "",
            longitude: warehouse.longitude?.toString() ?? "",
          }
        : emptyWarehouseForm
    );
    setWarehouseDialogOpen(true);
  };

  const submitWarehouse = async () => {
    if (!warehouseForm.name.trim()) {
      toast({ title: "Erreur", description: "Le nom du magasin est obligatoire", variant: "destructive" });
      return;
    }
    const latitude = Number(warehouseForm.latitude.replace(",", "."));
    const longitude = Number(warehouseForm.longitude.replace(",", "."));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast({ title: "Position GPS obligatoire", description: "Utilisez le bouton GPS pour enregistrer une position valide.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await callAction("upsert_warehouse", {
        id: warehouseForm.id,
        name: warehouseForm.name,
        address: warehouseForm.address || null,
        latitude,
        longitude,
      });
      toast({ title: "Magasin enregistré" });
      setWarehouseDialogOpen(false);
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openProductDialog = (product?: OrganizationProduct) => {
    setProductForm(
      product
        ? {
            id: product.id,
            name: product.name,
            description: product.description ?? "",
            category: product.category ?? "",
            price: String(product.price),
            unit: product.unit ?? "",
            image: product.image ?? "",
          }
        : emptyProductForm
    );
    setProductImageFile(null);
    setProductImagePreview(product?.image ?? null);
    setProductDialogOpen(true);
  };

  const selectProductImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Choisissez une image JPG, PNG ou WebP de 5 Mo maximum", variant: "destructive" });
      event.target.value = "";
      return;
    }
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const removeProductImage = () => {
    setProductImageFile(null);
    setProductImagePreview(null);
    setProductForm({ ...productForm, image: "" });
  };

  const submitProduct = async () => {
    if (!productForm.name.trim()) {
      toast({ title: "Erreur", description: "Le nom du produit est obligatoire", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const image = productImageFile ? await uploadProductImage(productImageFile) : productForm.image;
      await callAction("upsert_product", {
        id: productForm.id,
        name: productForm.name,
        description: productForm.description || null,
        category: productForm.category || null,
        price: Number(productForm.price) || 0,
        unit: productForm.unit || null,
        image: image || null,
      });
      toast({ title: "Produit enregistré" });
      setProductDialogOpen(false);
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStock = async (warehouseId: number, productId: number, quantity: string) => {
    try {
      await callAction("set_stock", {
        warehouse_id: warehouseId,
        organization_product_id: productId,
        quantity: Number(quantity) || 0,
      });
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const selectRestaurantImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Choisissez une image JPG, PNG ou WebP de 5 Mo maximum", variant: "destructive" });
      event.target.value = "";
      return;
    }
    setRestaurantImageFile(file);
    setRestaurantImagePreview(URL.createObjectURL(file));
  };

  const submitRestaurantProfile = async () => {
    if (!restaurantForm.name.trim()) {
      toast({ title: "Erreur", description: "Le nom du restaurant est obligatoire", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const image_url = restaurantImageFile
        ? await uploadMenuOrRestaurantImage(restaurantImageFile, "restaurants")
        : restaurantForm.image_url;
      await callAction("upsert_restaurant_profile", { ...restaurantForm, image_url: image_url || null });
      toast({ title: "Fiche restaurant enregistrée" });
      setRestaurantImageFile(null);
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openMenuItemDialog = (item?: MenuItem) => {
    setMenuItemForm(
      item
        ? {
            id: item.id,
            name: item.name,
            description: item.description ?? "",
            price: String(item.price),
            image_url: item.image_url ?? "",
            is_available: item.is_available ?? true,
          }
        : emptyMenuItemForm
    );
    setMenuImageFile(null);
    setMenuImagePreview(item?.image_url ?? null);
    setMenuItemDialogOpen(true);
  };

  const selectMenuImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Choisissez une image JPG, PNG ou WebP de 5 Mo maximum", variant: "destructive" });
      event.target.value = "";
      return;
    }
    setMenuImageFile(file);
    setMenuImagePreview(URL.createObjectURL(file));
  };

  const submitMenuItem = async () => {
    if (!menuItemForm.name.trim()) {
      toast({ title: "Erreur", description: "Le nom du plat est obligatoire", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const image_url = menuImageFile
        ? await uploadMenuOrRestaurantImage(menuImageFile, "menu-items")
        : menuItemForm.image_url;
      await callAction("upsert_menu_item", {
        id: menuItemForm.id,
        name: menuItemForm.name,
        description: menuItemForm.description || null,
        price: Number(menuItemForm.price) || 0,
        image_url: image_url || null,
        is_available: menuItemForm.is_available,
      });
      toast({ title: "Plat enregistré" });
      setMenuItemDialogOpen(false);
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await callAction("delete_menu_item", { id });
      toast({ title: "Plat supprimé" });
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const captureWarehouseLocation = () => {
    if (!window.isSecureContext) {
      toast({
        title: "GPS bloqué par le navigateur",
        description: "Ouvrez cette application avec son adresse HTTPS pour utiliser le GPS en un clic.",
        variant: "destructive",
      });
      return;
    }
    if (!navigator.geolocation) {
      toast({ title: "GPS indisponible", description: "Cet appareil ne fournit pas la géolocalisation.", variant: "destructive" });
      return;
    }

    setWarehouseLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setWarehouseForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setWarehouseLocating(false);
        toast({ title: "Position GPS enregistrée", description: `Précision : environ ${Math.round(coords.accuracy)} m` });
      },
      (locationError) => {
        setWarehouseLocating(false);
        const description = locationError.code === locationError.PERMISSION_DENIED
          ? "Autorisez la localisation pour ce site, puis réessayez."
          : "Impossible d'obtenir la position. Activez le GPS et réessayez.";
        toast({ title: "Localisation impossible", description, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await callAction("update_restaurant_order_status", { order_id: orderId, status });
      toast({ title: "Commande mise à jour" });
      await refetch();
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      await callAction("confirm_restaurant_order_payment", { order_id: orderId, payment_status: paymentStatus });
      toast({ title: "Paiement mis à jour" });
      await refetch(true);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const updateDeliveryStatus = async (orderId: string, deliveryStatus: string) => {
    try {
      await callAction("update_restaurant_delivery_status", { order_id: orderId, delivery_status: deliveryStatus });
      toast({ title: "Livraison mise à jour" });
      await refetch(true);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const openCash = async () => {
    try {
      await callAction("open_cash_session", { opening_balance: Number(openingBalance) || 0 });
      setOpeningBalance(""); toast({ title: "Caisse ouverte" }); await refetch();
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const closeCash = async () => {
    if (!openCashSession) return;
    try {
      await callAction("close_cash_session", { session_id: openCashSession.id, closing_balance: Number(closingBalance) || 0 });
      setClosingBalance(""); toast({ title: "Caisse clôturée" }); await refetch();
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const recordFinancialEntry = async () => {
    if (!financeForm.category.trim() || Number(financeForm.amount) <= 0) return;
    try {
      await callAction("record_financial_entry", { ...financeForm, amount: Number(financeForm.amount) });
      setFinanceForm({ entry_type: "expense", category: "", amount: "", payment_method: "cash", description: "" });
      toast({ title: "Écriture enregistrée" }); await refetch();
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{(organization as any)?.name || "Mon organisation"}</h1>
          <p className="text-muted-foreground">
            Espace {isPdg ? "PDG" : "employé"} — {(organization as any)?.organization_type}
          </p>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4 mr-2" /> Déconnexion
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {isRestaurant ? (
          <>
            <Card><CardContent className="p-6 flex items-center gap-4"><UtensilsCrossed className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Plats au menu</p><p className="text-2xl font-bold">{menuItems.length}</p></div></CardContent></Card>
            <Card><CardContent className="p-6 flex items-center gap-4"><ClipboardList className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Commandes</p><p className="text-2xl font-bold">{restaurantOrders.length}</p></div></CardContent></Card>
            <Card><CardContent className="p-6 flex items-center gap-4"><TrendingUp className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Résultat enregistré</p><p className="text-2xl font-bold">{(totalIncome - totalExpenses).toLocaleString()} F</p></div></CardContent></Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <Store className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Magasins</p>
                  <p className="text-2xl font-bold">{warehouses.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Produits</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Employés</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={isRestaurant ? "restaurant" : "magasins"}>
        <TabsList>
          {isRestaurant ? (
            <>
              <TabsTrigger value="restaurant">Mon restaurant</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="commandes">Commandes</TabsTrigger>
              {capabilities.manageCash && <TabsTrigger value="caisse">Caisse</TabsTrigger>}
              {(capabilities.viewAll || capabilities.manageAccounting) && <TabsTrigger value="comptabilite">Comptabilité</TabsTrigger>}
            </>
          ) : (
            <>
              <TabsTrigger value="magasins">Magasins</TabsTrigger>
              <TabsTrigger value="produits">Produits &amp; Stock</TabsTrigger>
            </>
          )}
          {isPdg && isRestaurant && <TabsTrigger value="points-vente">Points de vente</TabsTrigger>}
          {isPdg && <TabsTrigger value="employes">Employés &amp; Performance</TabsTrigger>}
        </TabsList>

        {isRestaurant && (
          <>
          <TabsContent value="restaurant" className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>Nom du restaurant</Label>
                  <Input
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                    disabled={!isPdg}
                  />
                </div>
                <div>
                  <Label>Localisation</Label>
                  <Input
                    value={restaurantForm.location}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, location: e.target.value })}
                    disabled={!isPdg}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horaires</Label>
                    <Input
                      value={restaurantForm.hours}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, hours: e.target.value })}
                      disabled={!isPdg}
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={restaurantForm.telephone}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, telephone: e.target.value })}
                      disabled={!isPdg}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={restaurantForm.description}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                    disabled={!isPdg}
                  />
                </div>
                {isPdg && (
                  <div>
                    <Label>Photo du restaurant</Label>
                    {restaurantImagePreview ? (
                      <div className="relative mt-2 w-40">
                        <img src={restaurantImagePreview} alt="Aperçu restaurant" className="w-40 h-28 object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={() => { setRestaurantImageFile(null); setRestaurantImagePreview(null); setRestaurantForm({ ...restaurantForm, image_url: "" }); }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-2 flex flex-col items-center justify-center w-40 h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Téléverser</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectRestaurantImage} />
                      </label>
                    )}
                  </div>
                )}
                {isPdg && (
                  <Button onClick={() => void submitRestaurantProfile()} disabled={submitting}>
                    {submitting ? "Enregistrement..." : "Enregistrer la fiche"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commandes" className="space-y-4">
            <Card><CardHeader><CardTitle>Commandes du restaurant</CardTitle></CardHeader><CardContent className="p-0 overflow-x-auto">
              <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Montant</TableHead><TableHead>Moyen</TableHead><TableHead>Paiement</TableHead><TableHead>Livraison</TableHead><TableHead>Préparation</TableHead></TableRow></TableHeader>
                <TableBody>{restaurantOrders.map((order) => <TableRow key={order.id}>
                  <TableCell>{new Date(order.created_at).toLocaleString("fr-FR")}</TableCell><TableCell>{order.customer_name || "—"}<div className="text-xs text-muted-foreground">{order.telephone}</div></TableCell>
                  <TableCell className="font-medium">{Number(order.total || 0).toLocaleString()} FCFA</TableCell><TableCell>{order.payment_method || "—"}</TableCell><TableCell>{capabilities.managePayments ? <select className="h-9 rounded-md border bg-background px-2" value={order.payment_status || "pending"} onChange={(e) => void updatePaymentStatus(order.id, e.target.value)}><option value="pending">En attente</option><option value="confirmed">Confirmé</option><option value="rejected">Refusé</option></select> : <Badge variant={order.payment_status === "confirmed" ? "default" : "secondary"}>{order.payment_status || "pending"}</Badge>}</TableCell><TableCell>{capabilities.manageDelivery ? <select className="h-9 rounded-md border bg-background px-2" value={order.delivery_status || "pending"} onChange={(e) => void updateDeliveryStatus(order.id, e.target.value)}><option value="pending">À affecter</option><option value="assigned">Affectée</option><option value="picked_up">Récupérée</option><option value="on_the_way">En route</option><option value="delivered">Livrée</option><option value="cancelled">Annulée</option></select> : <Badge variant={order.delivery_status === "delivered" ? "default" : "secondary"}>{order.delivery_status || "pending"}</Badge>}</TableCell>
                  <TableCell>{capabilities.manageOrders ? <select className="h-9 rounded-md border bg-background px-2" value={order.status || "pending"} onChange={(e) => void updateOrderStatus(order.id, e.target.value)}><option value="pending">En attente</option><option value="confirmed">Confirmée</option><option value="preparing">En préparation</option><option value="ready">Prête</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select> : <Badge>{order.status || "pending"}</Badge>}</TableCell>
                </TableRow>)}{restaurantOrders.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Aucune commande</TableCell></TableRow>}</TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          {capabilities.manageCash && <TabsContent value="caisse" className="space-y-4">
            <Card><CardHeader><CardTitle><Wallet className="inline h-5 w-5 mr-2" />Caisse</CardTitle></CardHeader><CardContent className="space-y-4">
              {openCashSession ? <><p>Caisse ouverte depuis {new Date(openCashSession.opened_at).toLocaleString("fr-FR")} — Fond initial : {Number(openCashSession.opening_balance).toLocaleString()} FCFA</p><div className="flex gap-3"><Input type="number" placeholder="Solde réellement compté" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} /><Button onClick={() => void closeCash()}>Clôturer la caisse</Button></div></> : <><p className="text-muted-foreground">Aucune caisse ouverte.</p><div className="flex gap-3"><Input type="number" placeholder="Fond de caisse initial" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} /><Button onClick={() => void openCash()}>Ouvrir la caisse</Button></div></>}
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Historique des clôtures</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Ouverture</TableHead><TableHead>Statut</TableHead><TableHead>Attendu</TableHead><TableHead>Compté</TableHead><TableHead>Écart</TableHead></TableRow></TableHeader><TableBody>{cashSessions.map((session) => <TableRow key={session.id}><TableCell>{new Date(session.opened_at).toLocaleString("fr-FR")}</TableCell><TableCell><Badge variant={session.status === "open" ? "default" : "secondary"}>{session.status === "open" ? "Ouverte" : "Clôturée"}</Badge></TableCell><TableCell>{Number(session.expected_balance || 0).toLocaleString()} F</TableCell><TableCell>{Number(session.closing_balance || 0).toLocaleString()} F</TableCell><TableCell>{Number(session.variance || 0).toLocaleString()} F</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </TabsContent>}

          {(capabilities.viewAll || capabilities.manageAccounting) && <TabsContent value="comptabilite" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recettes</p><p className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString()} F</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Dépenses</p><p className="text-2xl font-bold text-red-600">{totalExpenses.toLocaleString()} F</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Résultat</p><p className="text-2xl font-bold">{(totalIncome - totalExpenses).toLocaleString()} F</p></CardContent></Card></div>
            {capabilities.manageAccounting && <Card><CardHeader><CardTitle>Nouvelle écriture</CardTitle></CardHeader><CardContent className="grid md:grid-cols-5 gap-3"><select className="h-10 rounded-md border bg-background px-3" value={financeForm.entry_type} onChange={(e) => setFinanceForm({ ...financeForm, entry_type: e.target.value })}><option value="expense">Dépense</option><option value="income">Recette</option></select><Input placeholder="Catégorie" value={financeForm.category} onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })} /><Input type="number" placeholder="Montant" value={financeForm.amount} onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })} /><select className="h-10 rounded-md border bg-background px-3" value={financeForm.payment_method} onChange={(e) => setFinanceForm({ ...financeForm, payment_method: e.target.value })}><option value="cash">Espèces</option><option value="wave">Wave</option><option value="orange_money">Orange Money</option><option value="bank">Banque</option></select><Button onClick={() => void recordFinancialEntry()}>Enregistrer</Button></CardContent></Card>}
            <Card><CardHeader><CardTitle>Journal financier</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Catégorie</TableHead><TableHead>Paiement</TableHead><TableHead>Montant</TableHead></TableRow></TableHeader><TableBody>{financialEntries.map((entry) => <TableRow key={entry.id}><TableCell>{new Date(entry.occurred_at).toLocaleString("fr-FR")}</TableCell><TableCell>{entry.entry_type === "income" ? "Recette" : "Dépense"}</TableCell><TableCell>{entry.category}</TableCell><TableCell>{entry.payment_method || "—"}</TableCell><TableCell className={entry.entry_type === "income" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{entry.entry_type === "income" ? "+" : "-"}{Number(entry.amount).toLocaleString()} F</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </TabsContent>}
          </>
        )}

        {isRestaurant && (
          <TabsContent value="menu" className="space-y-4">
            {isPdg && (
              <div className="flex justify-end">
                <Button onClick={() => openMenuItemDialog()} disabled={!restaurant}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un plat
                </Button>
              </div>
            )}
            {!restaurant && (
              <p className="text-sm text-muted-foreground">Enregistrez d'abord la fiche de votre restaurant avant d'ajouter des plats.</p>
            )}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Plat</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Disponible</TableHead>
                      {isPdg && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-md border" />
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center rounded-md border bg-muted text-muted-foreground">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.price} FCFA</TableCell>
                        <TableCell>
                          <Badge variant={item.is_available ? "default" : "secondary"}>
                            {item.is_available ? "Disponible" : "Indisponible"}
                          </Badge>
                        </TableCell>
                        {isPdg && (
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => openMenuItemDialog(item)}>Modifier</Button>
                            <Button size="sm" variant="ghost" onClick={() => void deleteMenuItem(item.id)}>Supprimer</Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {menuItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucun plat enregistré
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isRestaurant && (
        <>
        <TabsContent value="magasins" className="space-y-4">
          {isPdg && (
            <div className="flex justify-end">
              <Button onClick={() => openWarehouseDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter un magasin
              </Button>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Coordonnées GPS</TableHead>
                    <TableHead>Statut</TableHead>
                    {isPdg && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell>{w.address || "—"}</TableCell>
                      <TableCell>
                        {w.latitude && w.longitude ? `${w.latitude}, ${w.longitude}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.actif ? "default" : "secondary"}>{w.actif ? "Actif" : "Inactif"}</Badge>
                      </TableCell>
                      {isPdg && (
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => openWarehouseDialog(w)}>Modifier</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {warehouses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucun magasin enregistré
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produits" className="space-y-4">
          {isPdg && (
            <div className="flex justify-end">
              <Button onClick={() => openProductDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter un produit
              </Button>
            </div>
          )}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Prix</TableHead>
                    {warehouses.map((w) => (
                      <TableHead key={w.id}>{w.name}</TableHead>
                    ))}
                    {isPdg && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-md border" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center rounded-md border bg-muted text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.price} FCFA</TableCell>
                      {warehouses.map((w) => (
                        <TableCell key={w.id}>
                          {isPdg ? (
                            <Input
                              type="number"
                              className="w-24"
                              defaultValue={stockFor(w.id, p.id)}
                              onBlur={(e) => void updateStock(w.id, p.id, e.target.value)}
                            />
                          ) : (
                            stockFor(w.id, p.id)
                          )}
                        </TableCell>
                      ))}
                      {isPdg && (
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => openProductDialog(p)}>Modifier</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4 + warehouses.length} className="text-center text-muted-foreground py-8">
                        Aucun produit enregistré
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        </>
        )}

        {isPdg && isRestaurant && (
          <TabsContent value="points-vente" className="space-y-4">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Points de vente</h2><p className="text-sm text-muted-foreground">Une équipe et un suivi séparés pour chaque quartier.</p></div><Button onClick={() => { setOutletForm(emptyOutletForm); setOutletDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Ajouter</Button></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{outlets.map((outlet) => <Card key={outlet.id}><CardHeader><CardTitle className="flex items-center justify-between text-base"><span>{outlet.name}</span>{outlet.is_primary && <Badge>Principal</Badge>}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>{outlet.neighborhood || "Quartier non renseigné"}</p><p className="text-muted-foreground">{outlet.address || "Adresse non renseignée"}</p><p>{outlet.telephone || "Téléphone non renseigné"}</p><Button variant="outline" size="sm" onClick={() => { setOutletForm({ id: outlet.id, name: outlet.name, neighborhood: outlet.neighborhood || "", address: outlet.address || "", telephone: outlet.telephone || "", is_active: outlet.is_active }); setOutletDialogOpen(true); }}>Modifier</Button></CardContent></Card>)}</div>
          </TabsContent>
        )}

        {isPdg && (
          <TabsContent value="employes" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Équipe administrative</h2>
                <p className="text-sm text-muted-foreground">Créez ici les comptes du gérant, du caissier, du cuisinier et du comptable.</p>
              </div>
              <Button onClick={() => setEmployeeDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Créer un compte</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead>Point de vente</TableHead>
                      <TableHead>Ventes (CA)</TableHead>
                      <TableHead>Commandes traitées</TableHead>
                      <TableHead>Recrutements</TableHead>
                      <TableHead>Dernière activité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const role = Array.isArray(emp.organization_roles) ? emp.organization_roles[0] : emp.organization_roles;
                      const empPerf = performance.filter((p) => p.user_id === emp.id);
                      const totalSales = empPerf.reduce((sum, p) => sum + Number(p.sales_amount), 0);
                      const totalOrders = empPerf.reduce((sum, p) => sum + Number(p.orders_handled), 0);
                      const totalRecruited = empPerf.reduce((sum, p) => sum + Number(p.partners_recruited), 0);
                      const lastActivity = empPerf[0]?.last_activity_at;
                      return (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="font-medium">{emp.nom}</div>
                            <div className="text-sm text-muted-foreground">{emp.email}</div>
                          </TableCell>
                          <TableCell>{role?.name || "—"}</TableCell>
                          <TableCell>{outlets.find((outlet) => outlet.id === emp.restaurant_outlet_id)?.name || "Direction générale"}</TableCell>
                          <TableCell>{totalSales.toLocaleString()} FCFA</TableCell>
                          <TableCell>{totalOrders}</TableCell>
                          <TableCell>{totalRecruited}</TableCell>
                          <TableCell>{lastActivity ? new Date(lastActivity).toLocaleDateString("fr-FR") : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {employees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Aucun employé enregistré
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer un compte employé</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom complet</Label><Input value={employeeForm.full_name} onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })} /></div>
            <div><Label>Adresse e-mail</Label><Input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} /></div>
            <div>
              <Label>Poste</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={employeeForm.organization_role_id} onChange={(e) => setEmployeeForm({ ...employeeForm, organization_role_id: e.target.value })}>
                <option value="">Sélectionner un poste</option>
                {employeeRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
            <div><Label>Point de vente</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={employeeForm.restaurant_outlet_id} onChange={(e) => setEmployeeForm({ ...employeeForm, restaurant_outlet_id: e.target.value })}><option value="">Sélectionner un point de vente</option>{outlets.filter((outlet) => outlet.is_active).map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}{outlet.neighborhood ? ` — ${outlet.neighborhood}` : ""}</option>)}</select></div>
            <div><Label>Mot de passe provisoire</Label><Input type="password" minLength={8} value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Au moins 8 caractères. Communiquez-le directement à l'employé.</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEmployeeDialogOpen(false)}>Annuler</Button><Button disabled={submitting} onClick={() => void createEmployee()}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer le compte</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={outletDialogOpen} onOpenChange={setOutletDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{outletForm.id ? "Modifier le point de vente" : "Ajouter un point de vente"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Nom</Label><Input value={outletForm.name} onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })} placeholder="Ex. Chez Ramadan — Kaloum" /></div><div><Label>Quartier</Label><Input value={outletForm.neighborhood} onChange={(e) => setOutletForm({ ...outletForm, neighborhood: e.target.value })} /></div><div><Label>Adresse</Label><Input value={outletForm.address} onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })} /></div><div><Label>Téléphone</Label><Input value={outletForm.telephone} onChange={(e) => setOutletForm({ ...outletForm, telephone: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOutletDialogOpen(false)}>Annuler</Button><Button disabled={submitting || !outletForm.name.trim()} onClick={() => void saveOutlet()}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{warehouseForm.id ? "Modifier le magasin" : "Ajouter un magasin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input value={warehouseForm.latitude} onChange={(e) => setWarehouseForm({ ...warehouseForm, latitude: e.target.value })} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={warehouseForm.longitude} onChange={(e) => setWarehouseForm({ ...warehouseForm, longitude: e.target.value })} />
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full gap-2" onClick={captureWarehouseLocation} disabled={warehouseLocating}>
              {warehouseLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {warehouseLocating ? "Recherche de la position..." : "Utiliser ma position GPS"}
            </Button>
            {warehouseForm.latitude && warehouseForm.longitude && (
              <p className="flex items-center gap-2 text-sm text-green-700"><MapPin className="h-4 w-4" /> Position prête à être enregistrée.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => void submitWarehouse()} disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productForm.id ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix (FCFA)</Label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
              </div>
              <div>
                <Label>Unité</Label>
                <Input value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Image du produit</Label>
              {productImagePreview ? (
                <div className="relative mt-2 w-32">
                  <img src={productImagePreview} alt="Aperçu produit" className="w-32 h-32 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={removeProductImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Téléverser</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectProductImage} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void submitProduct()} disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={menuItemDialogOpen} onOpenChange={setMenuItemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{menuItemForm.id ? "Modifier le plat" : "Ajouter un plat"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du plat</Label>
              <Input value={menuItemForm.name} onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Prix (FCFA)</Label>
              <Input type="number" value={menuItemForm.price} onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={menuItemForm.description} onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="menu-item-available"
                checked={menuItemForm.is_available}
                onChange={(e) => setMenuItemForm({ ...menuItemForm, is_available: e.target.checked })}
              />
              <Label htmlFor="menu-item-available">Disponible</Label>
            </div>
            <div>
              <Label>Photo du plat</Label>
              {menuImagePreview ? (
                <div className="relative mt-2 w-32">
                  <img src={menuImagePreview} alt="Aperçu plat" className="w-32 h-32 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => { setMenuImageFile(null); setMenuImagePreview(null); setMenuItemForm({ ...menuItemForm, image_url: "" }); }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Téléverser</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectMenuImage} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void submitMenuItem()} disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
