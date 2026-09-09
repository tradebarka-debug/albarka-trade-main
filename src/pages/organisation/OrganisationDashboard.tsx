import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationPortal, Warehouse, OrganizationProduct, MenuItem, Truck } from "@/hooks/useOrganizationPortal";
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
import { Loader2, Plus, Store, Package, Users, LogOut, ImageIcon, X, UtensilsCrossed, ClipboardList, Wallet, TrendingUp, LocateFixed, MapPin, Eye, EyeOff, KeyRound, Truck as TruckIcon } from "lucide-react";

const emptyWarehouseForm = { id: null as number | null, name: "", address: "", latitude: "", longitude: "" };
const emptyProductForm = { id: null as number | null, name: "", description: "", category: "", price: "", unit: "", image: "" };
const emptyRestaurantForm = { name: "", description: "", location: "", hours: "", telephone: "", image_url: "", latitude: "", longitude: "" };
const emptyMenuItemForm = { id: null as string | null, name: "", description: "", price: "", image_url: "", is_available: true };
const emptyEmployeeForm = { full_name: "", email: "", telephone: "", password: "", organization_role_id: "", restaurant_outlet_id: "" };
const emptyOutletForm = { id: null as number | null, name: "", neighborhood: "", address: "", telephone: "", is_active: true };
const emptyTruckForm = {
  id: null as number | null,
  title: "", vehicle_type: "", brand: "", model: "", year_built: "",
  registration_number: "", registration_country: "", registration_city: "", condition: "", availability_status: "available",
  axle_count: "", wheel_count: "", fuel_type: "", transmission_type: "", engine_power: "", mileage_km: "",
  payload_tons: "", max_weight_kg: "", length_m: "", width_m: "", height_m: "", loading_volume_m3: "",
  suspension_type: "", has_air_conditioning: false, has_gps: false, tire_condition: "",
  last_service_date: "", next_inspection_date: "",
  rental_with_driver: false, daily_rate: "", weekly_rate: "", monthly_rate: "", km_rate: "", security_deposit: "",
  available_from: "", available_until: "",
  has_registration_certificate: false, has_insurance: false, has_inspection_certificate: false, has_tax_sticker: false,
  has_driver_license: false, has_transport_authorization: false, has_customs_document: false,
  image_urls: ["", "", "", ""] as string[],
  actif: true,
};

const truckAvailabilityLabel: Record<string, string> = {
  available: "Disponible", reserved: "Réservé", on_mission: "En mission", maintenance: "Maintenance", disabled: "Hors service",
};

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

async function uploadTruckImage(file: File) {
  const extension = file.name.split(".").pop() || "png";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `trucks/${uniqueName}.${extension}`;
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
  const [restaurantLocating, setRestaurantLocating] = useState(false);
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState(emptyMenuItemForm);
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [respondingPreorderId, setRespondingPreorderId] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [financeForm, setFinanceForm] = useState({ entry_type: "expense", category: "", amount: "", payment_method: "cash", description: "" });
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [outletDialogOpen, setOutletDialogOpen] = useState(false);
  const [outletForm, setOutletForm] = useState(emptyOutletForm);
  const [truckDialogOpen, setTruckDialogOpen] = useState(false);
  const [truckDetailOpen, setTruckDetailOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [truckForm, setTruckForm] = useState(emptyTruckForm);
  const [truckImageFiles, setTruckImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [truckImagePreviews, setTruckImagePreviews] = useState<(string | null)[]>([null, null, null, null]);

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

  const { organization, warehouses, products, employees, roles = [], outlets = [], stock, performance, restaurant, menuItems, restaurantOrders = [], cashSessions = [], financialEntries = [], isPdg, roleCode, capabilities, trucks = [] } = data;
  const isRestaurant = (organization as any)?.organization_type === "restaurant";
  const openCashSession = cashSessions.find((session) => session.status === "open");
  const totalIncome = financialEntries.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalExpenses = financialEntries.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const employeeRoles = roles.filter((role) => !["ceo", "pdg", "president", "directeur_general", "directeur_generale", "general_management"].includes(role.code.toLowerCase()));

  const createEmployee = async () => {
    if (!employeeForm.full_name.trim() || !employeeForm.email.trim() || !employeeForm.telephone.trim() || !employeeForm.organization_role_id || !employeeForm.restaurant_outlet_id || employeeForm.password.length < 6) {
      toast({ title: "Informations incomplètes", description: "Renseignez le nom, l'e-mail, le téléphone, le poste et un mot de passe d'au moins 6 caractères.", variant: "destructive" });
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
      latitude: restaurant?.latitude?.toString() ?? "",
      longitude: restaurant?.longitude?.toString() ?? "",
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
    const latitude = Number(restaurantForm.latitude.replace(",", "."));
    const longitude = Number(restaurantForm.longitude.replace(",", "."));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast({ title: "Position GPS invalide", description: "Utilisez le bouton GPS ou renseignez une latitude et une longitude valides.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const image_url = restaurantImageFile
        ? await uploadMenuOrRestaurantImage(restaurantImageFile, "restaurants")
        : restaurantForm.image_url;
      await callAction("upsert_restaurant_profile", { ...restaurantForm, latitude, longitude, image_url: image_url || null });
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

  const captureRestaurantLocation = () => {
    if (!window.isSecureContext) {
      toast({ title: "GPS bloqué", description: "Utilisez une adresse HTTPS ou saisissez les coordonnées manuellement.", variant: "destructive" });
      return;
    }
    if (!navigator.geolocation) {
      toast({ title: "GPS indisponible", description: "Cet appareil ne fournit pas la géolocalisation.", variant: "destructive" });
      return;
    }
    setRestaurantLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setRestaurantForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }));
        setRestaurantLocating(false);
        toast({ title: "Position du restaurant ajoutée", description: `Précision : environ ${Math.round(coords.accuracy)} m` });
      },
      (locationError) => {
        setRestaurantLocating(false);
        toast({ title: "Localisation impossible", description: locationError.code === locationError.PERMISSION_DENIED ? "Autorisez la localisation pour ce site, puis réessayez." : "Activez le GPS ou saisissez les coordonnées manuellement.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
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
        toast({
          title: "Motif obligatoire",
          description: "Veuillez indiquer le motif du refus.",
          variant: "destructive",
        });
        return;
      }
    }

    setRespondingPreorderId(orderId);

    try {
      await callAction("respond_restaurant_preorder", {
        order_id: orderId,
        accept,
        rejection_reason: rejectionReason,
      });

      toast({
        title: accept
          ? "Précommande acceptée"
          : "Précommande refusée",
        description: accept
          ? "Le client peut maintenant effectuer le paiement."
          : "Le client sera informé du refus.",
      });

      await refetch();
    } catch (responseError: any) {
      toast({
        title: "Réponse impossible",
        description:
          responseError?.message || "Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setRespondingPreorderId(null);
    }
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

  const openTruckDialog = (truck?: Truck) => {
    setTruckForm(
      truck
        ? {
            id: truck.id,
            title: truck.title,
            vehicle_type: truck.vehicle_type ?? "",
            brand: truck.brand ?? "",
            model: truck.model ?? "",
            year_built: truck.year_built?.toString() ?? "",
            registration_number: truck.registration_number ?? "",
            registration_country: truck.registration_country ?? "",
            registration_city: truck.registration_city ?? "",
            condition: truck.condition ?? "",
            availability_status: truck.availability_status ?? "available",
            axle_count: truck.axle_count?.toString() ?? "",
            wheel_count: truck.wheel_count?.toString() ?? "",
            fuel_type: truck.fuel_type ?? "",
            transmission_type: truck.transmission_type ?? "",
            engine_power: truck.engine_power ?? "",
            mileage_km: truck.mileage_km?.toString() ?? "",
            payload_tons: truck.payload_tons?.toString() ?? "",
            max_weight_kg: truck.max_weight_kg?.toString() ?? "",
            length_m: truck.length_m?.toString() ?? "",
            width_m: truck.width_m?.toString() ?? "",
            height_m: truck.height_m?.toString() ?? "",
            loading_volume_m3: truck.loading_volume_m3?.toString() ?? "",
            suspension_type: truck.suspension_type ?? "",
            has_air_conditioning: truck.has_air_conditioning ?? false,
            has_gps: truck.has_gps ?? false,
            tire_condition: truck.tire_condition ?? "",
            last_service_date: truck.last_service_date ?? "",
            next_inspection_date: truck.next_inspection_date ?? "",
            rental_with_driver: truck.rental_with_driver ?? false,
            daily_rate: truck.daily_rate?.toString() ?? "",
            weekly_rate: truck.weekly_rate?.toString() ?? "",
            monthly_rate: truck.monthly_rate?.toString() ?? "",
            km_rate: truck.km_rate?.toString() ?? "",
            security_deposit: truck.security_deposit?.toString() ?? "",
            available_from: truck.available_from ?? "",
            available_until: truck.available_until ?? "",
            has_registration_certificate: truck.has_registration_certificate ?? false,
            has_insurance: truck.has_insurance ?? false,
            has_inspection_certificate: truck.has_inspection_certificate ?? false,
            has_tax_sticker: truck.has_tax_sticker ?? false,
            has_driver_license: truck.has_driver_license ?? false,
            has_transport_authorization: truck.has_transport_authorization ?? false,
            has_customs_document: truck.has_customs_document ?? false,
            image_urls: [0, 1, 2, 3].map((i) => truck.image_urls?.[i] ?? ""),
            actif: truck.actif ?? true,
          }
        : emptyTruckForm
    );
    const existingImages = truck?.image_urls ?? [];
    setTruckImageFiles([null, null, null, null]);
    setTruckImagePreviews([0, 1, 2, 3].map((i) => existingImages[i] ?? null));
    setTruckDialogOpen(true);
  };

  const openTruckDetail = (truck: Truck) => {
    setSelectedTruck(truck);
    setTruckDetailOpen(true);
  };

  const selectTruckImage = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Choisissez une image JPG, PNG ou WebP de 5 Mo maximum", variant: "destructive" });
      event.target.value = "";
      return;
    }
    setTruckImageFiles((files) => files.map((f, i) => (i === index ? file : f)));
    setTruckImagePreviews((previews) => previews.map((p, i) => (i === index ? URL.createObjectURL(file) : p)));
  };

  const removeTruckImage = (index: number) => {
    setTruckImageFiles((files) => files.map((f, i) => (i === index ? null : f)));
    setTruckImagePreviews((previews) => previews.map((p, i) => (i === index ? null : p)));
    setTruckForm((form) => ({ ...form, image_urls: form.image_urls.map((url, i) => (i === index ? "" : url)) }));
  };

  const submitTruck = async () => {
    if (!truckForm.title.trim()) {
      toast({ title: "Erreur", description: "Le nom/titre de l'annonce est obligatoire", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const uploadedUrls = await Promise.all(
        truckImageFiles.map((file, i) => (file ? uploadTruckImage(file) : Promise.resolve(truckForm.image_urls[i] ?? null)))
      );
      const image_urls = uploadedUrls.filter((url): url is string => Boolean(url));
      await callAction("upsert_truck", {
        id: truckForm.id,
        title: truckForm.title,
        vehicle_type: truckForm.vehicle_type || null,
        brand: truckForm.brand || null,
        model: truckForm.model || null,
        year_built: truckForm.year_built ? Number(truckForm.year_built) : null,
        registration_number: truckForm.registration_number || null,
        registration_country: truckForm.registration_country || null,
        registration_city: truckForm.registration_city || null,
        condition: truckForm.condition || null,
        availability_status: truckForm.availability_status,
        axle_count: truckForm.axle_count ? Number(truckForm.axle_count) : null,
        wheel_count: truckForm.wheel_count ? Number(truckForm.wheel_count) : null,
        fuel_type: truckForm.fuel_type || null,
        transmission_type: truckForm.transmission_type || null,
        engine_power: truckForm.engine_power || null,
        mileage_km: truckForm.mileage_km ? Number(truckForm.mileage_km) : null,
        payload_tons: truckForm.payload_tons ? Number(truckForm.payload_tons) : null,
        max_weight_kg: truckForm.max_weight_kg ? Number(truckForm.max_weight_kg) : null,
        length_m: truckForm.length_m ? Number(truckForm.length_m) : null,
        width_m: truckForm.width_m ? Number(truckForm.width_m) : null,
        height_m: truckForm.height_m ? Number(truckForm.height_m) : null,
        loading_volume_m3: truckForm.loading_volume_m3 ? Number(truckForm.loading_volume_m3) : null,
        suspension_type: truckForm.suspension_type || null,
        has_air_conditioning: truckForm.has_air_conditioning,
        has_gps: truckForm.has_gps,
        tire_condition: truckForm.tire_condition || null,
        last_service_date: truckForm.last_service_date || null,
        next_inspection_date: truckForm.next_inspection_date || null,
        rental_with_driver: truckForm.rental_with_driver,
        daily_rate: truckForm.daily_rate ? Number(truckForm.daily_rate) : null,
        weekly_rate: truckForm.weekly_rate ? Number(truckForm.weekly_rate) : null,
        monthly_rate: truckForm.monthly_rate ? Number(truckForm.monthly_rate) : null,
        km_rate: truckForm.km_rate ? Number(truckForm.km_rate) : null,
        security_deposit: truckForm.security_deposit ? Number(truckForm.security_deposit) : null,
        available_from: truckForm.available_from || null,
        available_until: truckForm.available_until || null,
        has_registration_certificate: truckForm.has_registration_certificate,
        has_insurance: truckForm.has_insurance,
        has_inspection_certificate: truckForm.has_inspection_certificate,
        has_tax_sticker: truckForm.has_tax_sticker,
        has_driver_license: truckForm.has_driver_license,
        has_transport_authorization: truckForm.has_transport_authorization,
        has_customs_document: truckForm.has_customs_document,
        image_urls,
        actif: truckForm.actif,
      });
      toast({ title: "Camion enregistré" });
      setTruckDialogOpen(false);
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTruck = async (id: number) => {
    try {
      await callAction("delete_truck", { id });
      toast({ title: "Camion supprimé" });
      setTruckDetailOpen(false);
      await refetch();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen min-w-0 space-y-6 overflow-x-hidden bg-muted/30 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{(organization as any)?.name || "Mon organisation"}</h1>
          <p className="text-muted-foreground">
            Espace {isPdg ? "PDG" : "employé"} — {(organization as any)?.organization_type}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline"><Link to="/compte/changer-mot-de-passe"><KeyRound className="mr-2 h-4 w-4" />Changer le mot de passe</Link></Button>
          <Button variant="outline" onClick={() => void signOut()}><LogOut className="h-4 w-4 mr-2" /> Déconnexion</Button>
        </div>
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
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <TruckIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Camions</p>
              <p className="text-2xl font-bold">{trucks.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={isRestaurant ? "restaurant" : "magasins"} className="min-w-0">
        <TabsList className="h-auto w-full justify-start overflow-x-auto overscroll-x-contain">
          {isRestaurant ? (
            <>
              <TabsTrigger value="restaurant">Mon restaurant</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="precommandes">
                Précommandes
            </TabsTrigger>
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
          <TabsTrigger value="logistique">Logistique</TabsTrigger>
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
                  <div className="space-y-3 rounded-xl border p-4">
                    <Label>Coordonnées GPS du restaurant</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input inputMode="decimal" value={restaurantForm.latitude} onChange={(e) => setRestaurantForm({ ...restaurantForm, latitude: e.target.value })} placeholder="Latitude, ex. 12.3714" disabled={!isPdg} />
                      <Input inputMode="decimal" value={restaurantForm.longitude} onChange={(e) => setRestaurantForm({ ...restaurantForm, longitude: e.target.value })} placeholder="Longitude, ex. -1.5197" disabled={!isPdg} />
                    </div>
                    {isPdg && <Button type="button" variant="outline" className="w-full gap-2" onClick={captureRestaurantLocation} disabled={restaurantLocating}>{restaurantLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}{restaurantLocating ? "Recherche de la position..." : "Utiliser ma position GPS"}</Button>}
                    {restaurantForm.latitude && restaurantForm.longitude && <p className="flex items-center gap-2 text-sm text-green-700"><MapPin className="h-4 w-4" /> Position prête à être enregistrée.</p>}
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
<TabsContent value="precommandes" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>Précommandes à confirmer</CardTitle>
    </CardHeader>

    <CardContent className="space-y-4">
      {restaurantOrders.filter(
        (order) =>
          order.restaurant_confirmation_status === "pending"
      ).length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">
          Aucune précommande en attente.
        </p>
      ) : (
        restaurantOrders
          .filter(
            (order) =>
              order.restaurant_confirmation_status === "pending"
          )
          .map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-bold">
                    Ticket N° {order.queue_number || "—"}
                  </p>

                  <Badge variant="secondary">
                    En attente de confirmation
                  </Badge>
                </div>

                <p>
                  <strong>Client :</strong>{" "}
                  {order.customer_name || "Non renseigné"}
                </p>

                <p>
                  <strong>Téléphone :</strong>{" "}
                  {order.telephone || "Non renseigné"}
                </p>

                <p>
                  <strong>Adresse :</strong>{" "}
                  {order.address || "Non renseignée"}
                </p>

                <p>
                  <strong>Total :</strong>{" "}
                  {Number(order.total || 0).toLocaleString("fr-FR")} FCFA
                </p>

                {capabilities.manageOrders && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      onClick={() =>
                        void respondToPreorder(order.id, true)
                      }
                      disabled={respondingPreorderId === order.id}
                    >
                      Accepter les plats
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() =>
                        void respondToPreorder(order.id, false)
                      }
                      disabled={respondingPreorderId === order.id}
                    >
                      Refuser
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
      )}
    </CardContent>
  </Card>
</TabsContent>
            <TabsContent value="commandes" className="space-y-4">
              <Card><CardHeader><CardTitle>Commandes du restaurant</CardTitle></CardHeader><CardContent className="p-0 overflow-x-auto">
                <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Montant</TableHead><TableHead>Moyen</TableHead><TableHead>Paiement</TableHead><TableHead>Livraison</TableHead><TableHead>Préparation</TableHead></TableRow></TableHeader>
                  <TableBody>{restaurantOrders.map((order) => <TableRow key={order.id}>
                    <TableCell>{new Date(order.created_at).toLocaleString("fr-FR")}</TableCell><TableCell>{order.customer_name || "—"}<div className="text-xs text-muted-foreground">{order.telephone}</div></TableCell>
                    <TableCell className="font-medium">{Number(order.total || 0).toLocaleString()} FCFA</TableCell><TableCell>{order.payment_method || "—"}</TableCell><TableCell>{capabilities.managePayments ? <select className="h-9 rounded-md border bg-background px-2" value={order.payment_status || "pending"} onChange={(e) => void updatePaymentStatus(order.id, e.target.value)}><option value="pending">En attente</option><option value="confirmed">Confirmé</option><option value="rejected">Refusé</option></select> : <Badge variant={order.payment_status === "confirmed" ? "default" : "secondary"}>{order.payment_status || "pending"}</Badge>}</TableCell><TableCell>{capabilities.manageDelivery ? <select className="h-9 rounded-md border bg-background px-2" disabled={order.delivery_status === "delivered"} value={order.delivery_status || "pending"} onChange={(e) => void updateDeliveryStatus(order.id, e.target.value)}><option value="pending">À affecter</option><option value="assigned">Affectée</option><option value="picked_up">Récupérée</option><option value="on_the_way">En route</option><option value="delivered">Livrée</option><option value="cancelled">Annulée</option></select> : <Badge variant={order.delivery_status === "delivered" ? "default" : "secondary"}>{order.delivery_status || "pending"}</Badge>}</TableCell>
                    <TableCell>{capabilities.manageOrders ? <select className="h-9 rounded-md border bg-background px-2" disabled={order.delivery_status === "delivered" || order.status === "completed"} value={order.status || "pending"} onChange={(e) => void updateOrderStatus(order.id, e.target.value)}><option value="pending">En attente</option><option value="confirmed">Confirmée</option><option value="preparing">En préparation</option><option value="ready">Prête</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select> : <Badge>{order.status || "pending"}</Badge>}</TableCell>
                  </TableRow>)}{restaurantOrders.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Aucune commande</TableCell></TableRow>}</TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            {capabilities.manageCash && <TabsContent value="caisse" className="space-y-4">
              <Card><CardHeader><CardTitle><Wallet className="inline h-5 w-5 mr-2" />Caisse</CardTitle></CardHeader><CardContent className="space-y-4">
                {openCashSession ? <><p>Caisse ouverte depuis {new Date(openCashSession.opened_at).toLocaleString("fr-FR")} — Fond initial : {Number(openCashSession.opening_balance).toLocaleString()} FCFA</p><div className="flex flex-col gap-3 sm:flex-row"><Input type="number" placeholder="Solde réellement compté" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} /><Button className="shrink-0" onClick={() => void closeCash()}>Clôturer la caisse</Button></div></> : <><p className="text-muted-foreground">Aucune caisse ouverte.</p><div className="flex flex-col gap-3 sm:flex-row"><Input type="number" placeholder="Fond de caisse initial" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} /><Button className="shrink-0" onClick={() => void openCash()}>Ouvrir la caisse</Button></div></>}
              </CardContent></Card>
              <Card className="min-w-0"><CardHeader><CardTitle>Historique des clôtures</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Ouverture</TableHead><TableHead>Statut</TableHead><TableHead>Attendu</TableHead><TableHead>Compté</TableHead><TableHead>Écart</TableHead></TableRow></TableHeader><TableBody>{cashSessions.map((session) => <TableRow key={session.id}><TableCell>{new Date(session.opened_at).toLocaleString("fr-FR")}</TableCell><TableCell><Badge variant={session.status === "open" ? "default" : "secondary"}>{session.status === "open" ? "Ouverte" : "Clôturée"}</Badge></TableCell><TableCell>{Number(session.expected_balance || 0).toLocaleString()} F</TableCell><TableCell>{Number(session.closing_balance || 0).toLocaleString()} F</TableCell><TableCell>{Number(session.variance || 0).toLocaleString()} F</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
            </TabsContent>}

            {(capabilities.viewAll || capabilities.manageAccounting) && <TabsContent value="comptabilite" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recettes</p><p className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString()} F</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Dépenses</p><p className="text-2xl font-bold text-red-600">{totalExpenses.toLocaleString()} F</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Résultat</p><p className="text-2xl font-bold">{(totalIncome - totalExpenses).toLocaleString()} F</p></CardContent></Card></div>
              {capabilities.manageAccounting && <Card><CardHeader><CardTitle>Nouvelle écriture</CardTitle></CardHeader><CardContent className="grid md:grid-cols-5 gap-3"><select className="h-10 rounded-md border bg-background px-3" value={financeForm.entry_type} onChange={(e) => setFinanceForm({ ...financeForm, entry_type: e.target.value })}><option value="expense">Dépense</option><option value="income">Recette</option></select><Input placeholder="Catégorie" value={financeForm.category} onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })} /><Input type="number" placeholder="Montant" value={financeForm.amount} onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })} /><select className="h-10 rounded-md border bg-background px-3" value={financeForm.payment_method} onChange={(e) => setFinanceForm({ ...financeForm, payment_method: e.target.value })}><option value="cash">Espèces</option><option value="wave">Wave</option><option value="orange_money">Orange Money</option><option value="bank">Banque</option></select><Button onClick={() => void recordFinancialEntry()}>Enregistrer</Button></CardContent></Card>}
              <Card className="min-w-0"><CardHeader><CardTitle>Journal financier</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Catégorie</TableHead><TableHead>Paiement</TableHead><TableHead>Montant</TableHead></TableRow></TableHeader><TableBody>{financialEntries.map((entry) => <TableRow key={entry.id}><TableCell>{new Date(entry.occurred_at).toLocaleString("fr-FR")}</TableCell><TableCell>{entry.entry_type === "income" ? "Recette" : "Dépense"}</TableCell><TableCell>{entry.category}</TableCell><TableCell>{entry.payment_method || "—"}</TableCell><TableCell className={entry.entry_type === "income" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{entry.entry_type === "income" ? "+" : "-"}{Number(entry.amount).toLocaleString()} F</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
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

        <TabsContent value="logistique" className="space-y-4">
          {capabilities.manageLogistics && (
            <div className="flex justify-end">
              <Button onClick={() => openTruckDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter un camion
              </Button>
            </div>
          )}
          {!capabilities.manageLogistics && (
            <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800">
              Consultation uniquement. L’enregistrement et la modification des camions sont réservés à l’administrateur, au PDG ou au responsable de l’organisation.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck) => (
              <Card
                key={truck.id}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() => openTruckDetail(truck)}
              >
                <div className="grid grid-cols-2 gap-0.5 bg-muted">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square overflow-hidden bg-muted">
                      {truck.image_urls[i] ? (
                        <img src={truck.image_urls[i]} alt={`${truck.title} ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{truck.title}</p>
                    <Badge variant={truck.availability_status === "available" ? "default" : "secondary"}>
                      {truckAvailabilityLabel[truck.availability_status] || truck.availability_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {truck.vehicle_type || "Type non renseigné"}{truck.brand ? ` — ${truck.brand}` : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
            {trucks.length === 0 && (
              <p className="col-span-full py-8 text-center text-muted-foreground">Aucun camion enregistré</p>
            )}
          </div>
        </TabsContent>

        {isPdg && isRestaurant && (
          <TabsContent value="points-vente" className="space-y-4">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Points de vente</h2><p className="text-sm text-muted-foreground">Une équipe et un suivi séparés pour chaque quartier.</p></div><Button onClick={() => { setOutletForm(emptyOutletForm); setOutletDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Ajouter</Button></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{outlets.map((outlet) => <Card key={outlet.id}><CardHeader><CardTitle className="flex items-center justify-between text-base"><span>{outlet.name}</span>{outlet.is_primary && <Badge>Principal</Badge>}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>{outlet.neighborhood || "Quartier non renseigné"}</p><p className="text-muted-foreground">{outlet.address || "Adresse non renseignée"}</p><p>{outlet.telephone || "Téléphone non renseigné"}</p><Button variant="outline" size="sm" onClick={() => { setOutletForm({ id: outlet.id, name: outlet.name, neighborhood: outlet.neighborhood || "", address: outlet.address || "", telephone: outlet.telephone || "", is_active: outlet.is_active }); setOutletDialogOpen(true); }}>Modifier</Button></CardContent></Card>)}</div>
          </TabsContent>
        )}

        {isPdg && (
          <TabsContent value="employes" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Équipe administrative</h2>
                <p className="text-sm text-muted-foreground">Créez ici les comptes du gérant, du caissier, du cuisinier et du comptable.</p>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => setEmployeeDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Créer un compte</Button>
            </div>
            <Card>
              <CardContent className="overflow-x-auto p-0">
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
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle>Créer un compte employé</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom complet</Label><Input value={employeeForm.full_name} onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })} /></div>
            <div><Label>Adresse e-mail</Label><Input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} /></div>
            <div><Label>Numéro de téléphone</Label><Input type="tel" value={employeeForm.telephone} onChange={(e) => setEmployeeForm({ ...employeeForm, telephone: e.target.value })} placeholder="Ex. +2250712345678" /><p className="mt-1 text-xs text-muted-foreground">Utilisez l'indicatif du pays afin de permettre la connexion par téléphone.</p></div>
            <div>
              <Label>Poste</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={employeeForm.organization_role_id} onChange={(e) => setEmployeeForm({ ...employeeForm, organization_role_id: e.target.value })}>
                <option value="">Sélectionner un poste</option>
                {employeeRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
            <div><Label>Point de vente</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={employeeForm.restaurant_outlet_id} onChange={(e) => setEmployeeForm({ ...employeeForm, restaurant_outlet_id: e.target.value })}><option value="">Sélectionner un point de vente</option>{outlets.filter((outlet) => outlet.is_active).map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}{outlet.neighborhood ? ` — ${outlet.neighborhood}` : ""}</option>)}</select></div>
            <div><Label>Mot de passe</Label><div className="relative"><Input type={showEmployeePassword ? "text" : "password"} minLength={6} value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} className="pr-11" /><button type="button" onClick={() => setShowEmployeePassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground" aria-label={showEmployeePassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showEmployeePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="mt-1 text-xs text-muted-foreground">Au moins 6 caractères. L'employé pourra ensuite le modifier.</p></div>
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

      <Dialog open={truckDetailOpen} onOpenChange={setTruckDetailOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
          {selectedTruck && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                  <span>{selectedTruck.title}</span>
                  <Badge variant={selectedTruck.availability_status === "available" ? "default" : "secondary"}>
                    {truckAvailabilityLabel[selectedTruck.availability_status] || selectedTruck.availability_status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-md border bg-muted">
                      {selectedTruck.image_urls[i] ? (
                        <img src={selectedTruck.image_urls[i]} alt={`${selectedTruck.title} ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Informations générales</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <p><span className="text-muted-foreground">Type : </span>{selectedTruck.vehicle_type || "—"}</p>
                    <p><span className="text-muted-foreground">Marque : </span>{selectedTruck.brand || "—"}</p>
                    <p><span className="text-muted-foreground">Modèle : </span>{selectedTruck.model || "—"}</p>
                    <p><span className="text-muted-foreground">Année : </span>{selectedTruck.year_built || "—"}</p>
                    <p><span className="text-muted-foreground">Immatriculation : </span>{selectedTruck.registration_number || "—"}</p>
                    <p><span className="text-muted-foreground">Pays / Ville : </span>{[selectedTruck.registration_country, selectedTruck.registration_city].filter(Boolean).join(" / ") || "—"}</p>
                    <p><span className="text-muted-foreground">État : </span>{selectedTruck.condition || "—"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Caractéristiques techniques</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <p><span className="text-muted-foreground">Essieux : </span>{selectedTruck.axle_count ?? "—"}</p>
                    <p><span className="text-muted-foreground">Roues : </span>{selectedTruck.wheel_count ?? "—"}</p>
                    <p><span className="text-muted-foreground">Carburant : </span>{selectedTruck.fuel_type || "—"}</p>
                    <p><span className="text-muted-foreground">Transmission : </span>{selectedTruck.transmission_type || "—"}</p>
                    <p><span className="text-muted-foreground">Puissance moteur : </span>{selectedTruck.engine_power || "—"}</p>
                    <p><span className="text-muted-foreground">Kilométrage : </span>{selectedTruck.mileage_km ?? "—"} km</p>
                    <p><span className="text-muted-foreground">Charge utile : </span>{selectedTruck.payload_tons ?? "—"} t</p>
                    <p><span className="text-muted-foreground">PTAC : </span>{selectedTruck.max_weight_kg ?? "—"} kg</p>
                    <p><span className="text-muted-foreground">Dimensions (L×l×H) : </span>{[selectedTruck.length_m, selectedTruck.width_m, selectedTruck.height_m].map((v) => v ?? "—").join(" × ")} m</p>
                    <p><span className="text-muted-foreground">Volume utile : </span>{selectedTruck.loading_volume_m3 ?? "—"} m³</p>
                    <p><span className="text-muted-foreground">Suspension : </span>{selectedTruck.suspension_type || "—"}</p>
                    <p><span className="text-muted-foreground">Climatisation : </span>{selectedTruck.has_air_conditioning ? "Oui" : "Non"}</p>
                    <p><span className="text-muted-foreground">GPS : </span>{selectedTruck.has_gps ? "Oui" : "Non"}</p>
                    <p><span className="text-muted-foreground">État des pneus : </span>{selectedTruck.tire_condition || "—"}</p>
                    <p><span className="text-muted-foreground">Dernier entretien : </span>{selectedTruck.last_service_date || "—"}</p>
                    <p><span className="text-muted-foreground">Prochain contrôle technique : </span>{selectedTruck.next_inspection_date || "—"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Conditions de location</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <p><span className="text-muted-foreground">Avec chauffeur : </span>{selectedTruck.rental_with_driver ? "Oui" : "Non"}</p>
                    <p><span className="text-muted-foreground">Tarif journalier : </span>{selectedTruck.daily_rate ?? "—"}</p>
                    <p><span className="text-muted-foreground">Tarif hebdomadaire : </span>{selectedTruck.weekly_rate ?? "—"}</p>
                    <p><span className="text-muted-foreground">Tarif mensuel : </span>{selectedTruck.monthly_rate ?? "—"}</p>
                    <p><span className="text-muted-foreground">Tarif au km : </span>{selectedTruck.km_rate ?? "—"}</p>
                    <p><span className="text-muted-foreground">Caution : </span>{selectedTruck.security_deposit ?? "—"}</p>
                    <p><span className="text-muted-foreground">Disponible du : </span>{selectedTruck.available_from || "—"}</p>
                    <p><span className="text-muted-foreground">Disponible jusqu'au : </span>{selectedTruck.available_until || "—"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Documents requis</h3>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <p>{selectedTruck.has_registration_certificate ? "✓" : "✗"} Carte grise</p>
                    <p>{selectedTruck.has_insurance ? "✓" : "✗"} Assurance</p>
                    <p>{selectedTruck.has_inspection_certificate ? "✓" : "✗"} Contrôle technique</p>
                    <p>{selectedTruck.has_tax_sticker ? "✓" : "✗"} Vignette</p>
                    <p>{selectedTruck.has_driver_license ? "✓" : "✗"} Permis de conduire</p>
                    <p>{selectedTruck.has_transport_authorization ? "✓" : "✗"} Autorisation de transport</p>
                    <p>{selectedTruck.has_customs_document ? "✓" : "✗"} Document douanier</p>
                  </div>
                </div>
              </div>
              {capabilities.manageLogistics && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => { setTruckDetailOpen(false); openTruckDialog(selectedTruck); }}>Modifier</Button>
                  <Button variant="destructive" onClick={() => void deleteTruck(selectedTruck.id)}>Supprimer</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={truckDialogOpen} onOpenChange={setTruckDialogOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{truckForm.id ? "Modifier le camion" : "Ajouter un camion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>Photos (4 emplacements)</Label>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i}>
                    {truckImagePreviews[i] ? (
                      <div className="relative aspect-square">
                        <img src={truckImagePreviews[i]!} alt={`Photo ${i + 1}`} className="h-full w-full rounded-lg border object-cover" />
                        <button
                          type="button"
                          onClick={() => removeTruckImage(i)}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/50">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="mt-1 text-xs text-muted-foreground">Photo {i + 1}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => selectTruckImage(i, e)} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Informations générales</h3>
              <div>
                <Label>Nom / titre de l'annonce</Label>
                <Input value={truckForm.title} onChange={(e) => setTruckForm({ ...truckForm, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type de véhicule</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={truckForm.vehicle_type} onChange={(e) => setTruckForm({ ...truckForm, vehicle_type: e.target.value })}>
                    <option value="">Sélectionner</option>
                    <option value="semi_remorque">Camion semi-remorque</option>
                    <option value="tracteur_routier">Tracteur routier</option>
                    <option value="remorque">Semi-remorque</option>
                    <option value="plateau">Camion plateau</option>
                    <option value="benne">Benne</option>
                    <option value="citerne">Citerne</option>
                    <option value="frigorifique">Véhicule frigorifique</option>
                    <option value="porte_conteneur">Porte-conteneur</option>
                  </select>
                </div>
                <div>
                  <Label>État</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={truckForm.condition} onChange={(e) => setTruckForm({ ...truckForm, condition: e.target.value })}>
                    <option value="">Sélectionner</option>
                    <option value="neuf">Neuf</option>
                    <option value="tres_bon_etat">Très bon état</option>
                    <option value="bon_etat">Bon état</option>
                    <option value="etat_moyen">État moyen</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marque</Label><Input value={truckForm.brand} onChange={(e) => setTruckForm({ ...truckForm, brand: e.target.value })} /></div>
                <div><Label>Modèle</Label><Input value={truckForm.model} onChange={(e) => setTruckForm({ ...truckForm, model: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Année de fabrication</Label><Input type="number" value={truckForm.year_built} onChange={(e) => setTruckForm({ ...truckForm, year_built: e.target.value })} /></div>
                <div>
                  <Label>Disponibilité</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={truckForm.availability_status} onChange={(e) => setTruckForm({ ...truckForm, availability_status: e.target.value })}>
                    <option value="available">Disponible</option>
                    <option value="reserved">Réservé</option>
                    <option value="on_mission">En mission</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="disabled">Hors service</option>
                  </select>
                </div>
              </div>
              <div><Label>Numéro d'immatriculation</Label><Input value={truckForm.registration_number} onChange={(e) => setTruckForm({ ...truckForm, registration_number: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pays d'immatriculation</Label><Input value={truckForm.registration_country} onChange={(e) => setTruckForm({ ...truckForm, registration_country: e.target.value })} /></div>
                <div><Label>Ville d'immatriculation</Label><Input value={truckForm.registration_city} onChange={(e) => setTruckForm({ ...truckForm, registration_city: e.target.value })} /></div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Caractéristiques techniques</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nombre d'essieux</Label><Input type="number" value={truckForm.axle_count} onChange={(e) => setTruckForm({ ...truckForm, axle_count: e.target.value })} /></div>
                <div><Label>Nombre de roues</Label><Input type="number" value={truckForm.wheel_count} onChange={(e) => setTruckForm({ ...truckForm, wheel_count: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type de carburant</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={truckForm.fuel_type} onChange={(e) => setTruckForm({ ...truckForm, fuel_type: e.target.value })}>
                    <option value="">Sélectionner</option>
                    <option value="diesel">Diesel</option>
                    <option value="essence">Essence</option>
                    <option value="gaz">Gaz (GPL/GNV)</option>
                    <option value="electrique">Électrique</option>
                    <option value="hybride">Hybride</option>
                  </select>
                </div>
                <div>
                  <Label>Type de transmission</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={truckForm.transmission_type} onChange={(e) => setTruckForm({ ...truckForm, transmission_type: e.target.value })}>
                    <option value="">Sélectionner</option>
                    <option value="manuelle">Manuelle</option>
                    <option value="automatique">Automatique</option>
                    <option value="semi_automatique">Semi-automatique</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Puissance moteur</Label><Input value={truckForm.engine_power} onChange={(e) => setTruckForm({ ...truckForm, engine_power: e.target.value })} placeholder="Ex. 420 ch" /></div>
                <div><Label>Kilométrage</Label><Input type="number" value={truckForm.mileage_km} onChange={(e) => setTruckForm({ ...truckForm, mileage_km: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Charge utile (tonnes)</Label><Input type="number" value={truckForm.payload_tons} onChange={(e) => setTruckForm({ ...truckForm, payload_tons: e.target.value })} /></div>
                <div><Label>Poids total autorisé (kg)</Label><Input type="number" value={truckForm.max_weight_kg} onChange={(e) => setTruckForm({ ...truckForm, max_weight_kg: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Longueur (m)</Label><Input type="number" value={truckForm.length_m} onChange={(e) => setTruckForm({ ...truckForm, length_m: e.target.value })} /></div>
                <div><Label>Largeur (m)</Label><Input type="number" value={truckForm.width_m} onChange={(e) => setTruckForm({ ...truckForm, width_m: e.target.value })} /></div>
                <div><Label>Hauteur (m)</Label><Input type="number" value={truckForm.height_m} onChange={(e) => setTruckForm({ ...truckForm, height_m: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Volume de chargement (m³)</Label><Input type="number" value={truckForm.loading_volume_m3} onChange={(e) => setTruckForm({ ...truckForm, loading_volume_m3: e.target.value })} /></div>
                <div><Label>Type de suspension</Label><Input value={truckForm.suspension_type} onChange={(e) => setTruckForm({ ...truckForm, suspension_type: e.target.value })} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2"><input type="checkbox" id="truck-ac" checked={truckForm.has_air_conditioning} onChange={(e) => setTruckForm({ ...truckForm, has_air_conditioning: e.target.checked })} /><Label htmlFor="truck-ac">Climatisation</Label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="truck-gps" checked={truckForm.has_gps} onChange={(e) => setTruckForm({ ...truckForm, has_gps: e.target.checked })} /><Label htmlFor="truck-gps">GPS / géolocalisation</Label></div>
              </div>
              <div><Label>État des pneus</Label><Input value={truckForm.tire_condition} onChange={(e) => setTruckForm({ ...truckForm, tire_condition: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date du dernier entretien</Label><Input type="date" value={truckForm.last_service_date} onChange={(e) => setTruckForm({ ...truckForm, last_service_date: e.target.value })} /></div>
                <div><Label>Date du prochain contrôle technique</Label><Input type="date" value={truckForm.next_inspection_date} onChange={(e) => setTruckForm({ ...truckForm, next_inspection_date: e.target.value })} /></div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Conditions de location</h3>
              <div className="flex items-center gap-2"><input type="checkbox" id="truck-driver" checked={truckForm.rental_with_driver} onChange={(e) => setTruckForm({ ...truckForm, rental_with_driver: e.target.checked })} /><Label htmlFor="truck-driver">Location avec chauffeur</Label></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tarif journalier</Label><Input type="number" value={truckForm.daily_rate} onChange={(e) => setTruckForm({ ...truckForm, daily_rate: e.target.value })} /></div>
                <div><Label>Tarif hebdomadaire</Label><Input type="number" value={truckForm.weekly_rate} onChange={(e) => setTruckForm({ ...truckForm, weekly_rate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tarif mensuel</Label><Input type="number" value={truckForm.monthly_rate} onChange={(e) => setTruckForm({ ...truckForm, monthly_rate: e.target.value })} /></div>
                <div><Label>Tarif au kilomètre</Label><Input type="number" value={truckForm.km_rate} onChange={(e) => setTruckForm({ ...truckForm, km_rate: e.target.value })} /></div>
              </div>
              <div><Label>Montant de la caution</Label><Input type="number" value={truckForm.security_deposit} onChange={(e) => setTruckForm({ ...truckForm, security_deposit: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date de début de disponibilité</Label><Input type="date" value={truckForm.available_from} onChange={(e) => setTruckForm({ ...truckForm, available_from: e.target.value })} /></div>
                <div><Label>Date de fin de disponibilité</Label><Input type="date" value={truckForm.available_until} onChange={(e) => setTruckForm({ ...truckForm, available_until: e.target.value })} /></div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Documents requis</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2"><input type="checkbox" id="doc-carte-grise" checked={truckForm.has_registration_certificate} onChange={(e) => setTruckForm({ ...truckForm, has_registration_certificate: e.target.checked })} /><Label htmlFor="doc-carte-grise">Carte grise</Label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="doc-assurance" checked={truckForm.has_insurance} onChange={(e) => setTruckForm({ ...truckForm, has_insurance: e.target.checked })} /><Label htmlFor="doc-assurance">Assurance</Label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="doc-controle" checked={truckForm.has_inspection_certificate} onChange={(e) => setTruckForm({ ...truckForm, has_inspection_certificate: e.target.checked })} /><Label htmlFor="doc-controle">Contrôle technique</Label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="doc-vignette" checked={truckForm.has_tax_sticker} onChange={(e) => setTruckForm({ ...truckForm, has_tax_sticker: e.target.checked })} /><Label htmlFor="doc-vignette">Vignette</Label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="doc-permis" checked={truckForm.has_driver_license} onChange={(e) => setTruckForm({ ...truckForm, has_driver_license: e.target.checked })} /><Label htmlFor="doc-permis">Permis de conduire</Label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="doc-autorisation" checked={truckForm.has_transport_authorization} onChange={(e) => setTruckForm({ ...truckForm, has_transport_authorization: e.target.checked })} /><Label htmlFor="doc-autorisation">Autorisation de transport</Label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="doc-douane" checked={truckForm.has_customs_document} onChange={(e) => setTruckForm({ ...truckForm, has_customs_document: e.target.checked })} /><Label htmlFor="doc-douane">Document douanier</Label></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTruckDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => void submitTruck()} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
