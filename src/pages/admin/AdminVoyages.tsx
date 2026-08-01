import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, MapPin, Mail, Plus, Pencil, Trash2, Upload, Image } from "lucide-react";
import { toast } from "sonner";

const CompaniesTab = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    nom: "",
    description: "",
    phone: "",
    email: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["transport_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_companies")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let logo_url = editing?.logo_url || null;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        const filePath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(filePath, logoFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(filePath);
        logo_url = urlData.publicUrl;
      }

      const payload = {
        nom: form.nom,
        description: form.description,
        telephone: form.phone,
        email: form.email,
        logo_url,
      };

      if (editing?.id) {
        const { error } = await supabase
          .from("transport_companies")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transport_companies")
          .insert(payload);
        if (error) throw error;
      }

      setUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport_companies"] });
      toast.success(editing?.id ? "Compagnie modifiée" : "Compagnie ajoutée");
      setEditing(null);
      setLogoFile(null);
      setLogoPreview(null);
      setForm({ nom: "", description: "", phone: "", email: "" });
    },
    onError: () => {
      setUploading(false);
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: number; actif: boolean }) => {
      const { error } = await supabase
        .from("transport_companies")
        .update({ actif })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transport_companies"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("transport_companies")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport_companies"] });
      toast.success("Compagnie supprimée");
    },
  });

  const openEdit = (company?: any) => {
    setForm(
      company
        ? {
          nom: company.nom || "",
          description: company.description || "",
          phone: company.telephone || "",
          email: company.email || "",
        }
        : { nom: "", description: "", phone: "", email: "" }
    );
    setLogoFile(null);
    setLogoPreview(company?.logo_url || null);
    setEditing(company || {});
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) return <p className="text-muted-foreground p-4">Chargement...</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Compagnies de transport</h3>
        <Button size="sm" onClick={() => openEdit()}>
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell>
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.nom} className="w-10 h-10 rounded object-contain" />
                ) : (
                  <span className="text-xl">🚌</span>
                )}
              </TableCell>
              <TableCell className="font-medium">{c.nom}</TableCell>
              <TableCell>
                <Switch
                  checked={Boolean(c.actif)}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, actif: v })}
                />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(c.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier" : "Ajouter"} une compagnie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label>Logo (image)</Label>
              <div className="mt-1 flex items-center gap-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded border object-contain" />
                ) : (
                  <div className="w-14 h-14 rounded border border-dashed flex items-center justify-center text-muted-foreground">
                    <Image className="w-6 h-6" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Input type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                  <span className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" /> Choisir
                  </span>
                </label>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => saveMutation.mutate()}
              disabled={!form.nom || saveMutation.isPending || uploading}
            >
              {uploading ? "Envoi en cours..." : "Sauvegarder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const RoutesTab = () => {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    company_id: "",
    country_id: "1",
    departure_city_id: "",
    destination_city_id: "",
    departure_time: "",
    arrival_time: "",
    price: 0,
    available_seats: 50,
    active: true,
  });

  // =========================
  // ROUTES
  // =========================

  const {
    data: routes = [],
    isLoading,
  } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select(`
          *,
          transport_companies(nom),
          departure:cities!routes_departure_city_id_fkey(id,name),
          destination:cities!routes_destination_city_id_fkey(id,name)
        `)
        .order("id", { ascending: false });

      if (error) throw error;

      return data;
    },
  });

  // =========================
  // COMPAGNIES
  // =========================

  const { data: companies = [] } = useQuery({
    queryKey: ["transport_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_companies")
        .select("*")
        .eq("actif", true)
        .order("nom");

      if (error) throw error;

      return data;
    },
  });

  // =========================
  // VILLES
  // =========================

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;

      return data;
    },
  });
  // =========================
  // OUVRIR LE FORMULAIRE
  // =========================

  const openEdit = (route?: any) => {
    if (route) {
      setForm({
        company_id: String(route.company_id),
        country_id: String(route.country_id ?? "1"),
        departure_city_id: String(route.departure_city_id),
        destination_city_id: String(route.destination_city_id),
        departure_time: route.departure_time || "",
        arrival_time: route.arrival_time || "",
        price: route.price || 0,
        available_seats: route.available_seats || 50,
        active: route.active,
      });

      setEditing(route);
    } else {
      setForm({
        company_id: "",
        country_id: "1",
        departure_city_id: "",
        destination_city_id: "",
        departure_time: "",
        arrival_time: "",
        price: 0,
        available_seats: 50,
        active: true,
      });

      setEditing({});
    }
  };

  // =========================
  // SAUVEGARDE
  // =========================

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: Number(form.company_id),
        departure_city_id: Number(form.departure_city_id),
        destination_city_id: Number(form.destination_city_id),
        departure_time: form.departure_time,
        arrival_time: form.arrival_time,
        price: Number(form.price),
        available_seats: Number(form.available_seats),
      country_id: Number(form.country_id),
        active: form.active,
      };

      if (editing?.id) {
        const { error } = await supabase
          .from("routes")
          .update(payload)
          .eq("id", editing.id);

        if (error) { console.error(error); throw error; }
      } else {
        const { error } = await supabase
          .from("routes")
          .insert(payload);

        if (error) throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["routes"],
      });

      toast.success(
        editing?.id
          ? "Route modifiée"
          : "Route ajoutée"
      );

      setEditing(null);
    },

    onError: (error: any) => {
      console.error(error);

      toast.error(
        error?.message ||
        error?.error_description ||
        JSON.stringify(error)
      );
    },
  });

  // =========================
  // SUPPRESSION
  // =========================

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("routes")
        .delete()
        .eq("id", id);

      if (error) {
        console.log(error);
        throw new Error(error.message);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["routes"],
      });

      toast.success("Route supprimée");
    },

    onError: () => {
      toast.error("Suppression impossible");
    },
  });

  if (isLoading) {
    return (
      <p className="p-4 text-muted-foreground">
        Chargement...
      </p>
    );
  }
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Routes</h3>

        <Button size="sm" onClick={() => openEdit()}>
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Compagnie</TableHead>
            <TableHead>Départ</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Heure départ</TableHead>
            <TableHead>Heure arrivée</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Places</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {routes.map((route: any) => (
            <TableRow key={route.id}>
              <TableCell>
                {route.transport_companies?.nom}
              </TableCell>

              <TableCell>
                {route.departure?.name}
              </TableCell>

              <TableCell>
                {route.destination?.name}
              </TableCell>

              <TableCell>
                {route.departure_time}
              </TableCell>

              <TableCell>
                {route.arrival_time}
              </TableCell>

              <TableCell>
                {route.price} FCFA
              </TableCell>

              <TableCell>
                {route.available_seats}
              </TableCell>

              <TableCell>
                {route.active ? "Active" : "Inactive"}
              </TableCell>

              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(route)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(route.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={editing !== null}
        onOpenChange={() => setEditing(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id
                ? "Modifier une route"
                : "Ajouter une route"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <div>
              <Label>Compagnie</Label>

              <Select
                value={form.company_id}
                onValueChange={(value) =>
                  setForm({ ...form, company_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une compagnie" />
                </SelectTrigger>

                <SelectContent>
                  {companies.map((company: any) => (
                    <SelectItem
                      key={company.id}
                      value={String(company.id)}
                    >
                      {company.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div>
  <Label>Pays</Label>

  <Select
    value={form.country_id}
    onValueChange={(value) =>
      setForm({ ...form, country_id: value })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Choisir un pays" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="1">Burkina Faso</SelectItem>
      <SelectItem value="2">Côte d'Ivoire</SelectItem>
      <SelectItem value="3">Ghana</SelectItem>
      <SelectItem value="4">Togo</SelectItem>
      <SelectItem value="5">Bénin</SelectItem>
      <SelectItem value="6">Mali</SelectItem>
      <SelectItem value="7">Niger</SelectItem>
      <SelectItem value="8">Sénégal</SelectItem>
      <SelectItem value="9">Guinée</SelectItem>
    </SelectContent>
  </Select>
</div>
              <Label>Ville de départ</Label>

              <Select
                value={form.departure_city_id}
                onValueChange={(value) =>
                  setForm({ ...form, departure_city_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ville de départ" />
                </SelectTrigger>

                <SelectContent>
                  {cities.map((city: any) => (
                    <SelectItem
                      key={city.id}
                      value={String(city.id)}
                    >
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ville de destination</Label>

              <Select
                value={form.destination_city_id}
                onValueChange={(value) =>
                  setForm({ ...form, destination_city_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ville de destination" />
                </SelectTrigger>

                <SelectContent>
                  {cities.map((city: any) => (
                    <SelectItem
                      key={city.id}
                      value={String(city.id)}
                    >
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Heure de départ</Label>

              <Input
                type="time"
                value={form.departure_time}
                onChange={(e) =>
                  setForm({
                    ...form,
                    departure_time: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Heure d'arrivée</Label>

              <Input
                type="time"
                value={form.arrival_time}
                onChange={(e) =>
                  setForm({
                    ...form,
                    arrival_time: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Prix (FCFA)</Label>

              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <Label>Places disponibles</Label>

              <Input
                type="number"
                value={form.available_seats}
                onChange={(e) =>
                  setForm({
                    ...form,
                    available_seats: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Route active</Label>

              <Switch
                checked={form.active}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    active: checked,
                  })
                }
              />
            </div>

            <Button
              className="w-full"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              Sauvegarder
            </Button>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const CourierServicesTab = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    starting_price: 0,
    company_id: "",
    departure_city_id: "",
    destination_city_id: "",
    estimated_delivery_time: "",
    max_weight: 0,
    is_active: true,
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["transport_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_companies")
        .select("id, nom")
        .order("nom");

      if (error) throw error;
      return data;
    },
  });
  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["courier_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_services")
        .select(`
        *,
        transport_companies(nom),
        departure:cities!courier_services_departure_city_fk(name),
        destination:cities!courier_services_destination_city_fk(name)
      `)
        .order("created_at");

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        starting_price: Number(form.starting_price),
        company_id: Number(form.company_id),
        departure_city_id: Number(form.departure_city_id),
        destination_city_id: Number(form.destination_city_id),
        estimated_delivery_time: form.estimated_delivery_time,
        max_weight: Number(form.max_weight),
        is_active: form.is_active,
      };

      if (editing?.id) {
        const { error } = await supabase
          .from("courier_services")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courier_services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier_services"] });
      toast.success(editing?.id ? "Service modifié" : "Service ajouté");
      setEditing(null);
      setForm({
        name: "",
        description: "",
        starting_price: 0,
        company_id: "",
        departure_city_id: "",
        destination_city_id: "",
        estimated_delivery_time: "",
        max_weight: 0,
        is_active: true,
      });
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from("courier_services").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courier_services"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("courier_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier_services"] });
      toast.success("Service supprimé");
    },
  });

  const openEdit = (svc?: any) => {
    setForm(
      svc
        ? {
          name: svc.name || "",
          description: svc.description || "",
          starting_price: svc.starting_price || 0,
          company_id: String(svc.company_id || ""),
          departure_city_id: String(svc.departure_city_id || ""),
          destination_city_id: String(svc.destination_city_id || ""),
          estimated_delivery_time: svc.estimated_delivery_time || "",
          max_weight: svc.max_weight || 0,
          is_active: svc.is_active ?? true,
        }
        : {
          name: "",
          description: "",
          starting_price: 0,
          company_id: "",
          departure_city_id: "",
          destination_city_id: "",
          estimated_delivery_time: "",
          max_weight: 0,
          is_active: true,
        }
    );

    setEditing(svc || {});
  };

  if (isLoading) return <p className="text-muted-foreground p-4">Chargement...</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Services Courriers</h3>
        <Button size="sm" onClick={() => openEdit()}>
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Compagnie</TableHead>
            <TableHead>Départ</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Délai</TableHead>
            <TableHead>Poids</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">
                {s.name}
              </TableCell>

              <TableCell>
                {s.transport_companies?.nom}
              </TableCell>

              <TableCell>
                {s.departure?.name}
              </TableCell>

              <TableCell>
                {s.destination?.name}
              </TableCell>

              <TableCell>
                {Number(s.starting_price).toLocaleString()} FCFA
              </TableCell>

              <TableCell>
                {s.estimated_delivery_time}
              </TableCell>

              <TableCell>
                {s.max_weight} Kg
              </TableCell>
              <TableCell>
                <Switch
                  checked={Boolean(s.is_active)}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: s.id, is_active: v })}
                />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(s.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier" : "Ajouter"} un service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Prix de départ (FCFA)</Label>
              <div>
                <Label>Compagnie</Label>

                <Select
                  value={form.company_id}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, company_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une compagnie" />
                  </SelectTrigger>

                  <SelectContent>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ville de départ</Label>

                <Select
                  value={form.departure_city_id}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, departure_city_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ville de départ" />
                  </SelectTrigger>

                  <SelectContent>
                    {cities.map((city: any) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ville de destination</Label>

                <Select
                  value={form.destination_city_id}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, destination_city_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ville de destination" />
                  </SelectTrigger>

                  <SelectContent>
                    {cities.map((city: any) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Délai estimé</Label>

                <Input
                  value={form.estimated_delivery_time}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estimated_delivery_time: e.target.value,
                    }))
                  }
                  placeholder="Ex : 24 heures"
                />
              </div>

              <div>
                <Label>Poids maximum (Kg)</Label>

                <Input
                  type="number"
                  value={form.max_weight}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      max_weight: Number(e.target.value),
                    }))
                  }
                />
              </div>
              
            </div>
           
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const AdminVoyages = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bus className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-bold">Voyages & Courriers</h1>
      </div>

      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies" className="gap-2">
            <Bus className="w-4 h-4" />
            Compagnies
          </TabsTrigger>
          <TabsTrigger value="routes" className="gap-2">
            <MapPin className="w-4 h-4" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="courriers" className="gap-2">
            <Mail className="w-4 h-4" />
            Courriers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="companies"><CompaniesTab /></TabsContent>
        <TabsContent value="routes"><RoutesTab /></TabsContent>
        <TabsContent value="courriers"><CourierServicesTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVoyages;


