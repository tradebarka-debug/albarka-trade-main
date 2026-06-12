import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

// ── Transport Companies Tab ──
const CompaniesTab = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", logo: "🚌" });
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

      // Upload logo if a new file was selected
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(filePath, logoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
        logo_url = urlData.publicUrl;
      }

      if (editing?.id) {
        const { error } = await supabase
          .from("transport_companies")
          .update({ name: form.name, logo: form.logo, logo_url })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transport_companies")
          .insert({ name: form.name, logo: form.logo, logo_url });
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
    },
    onError: () => { setUploading(false); toast.error("Erreur lors de la sauvegarde"); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("transport_companies")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transport_companies"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transport_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport_companies"] });
      toast.success("Compagnie supprimée");
    },
  });

  const openEdit = (company?: any) => {
    setForm(company ? { name: company.name, logo: company.logo || "🚌" } : { name: "", logo: "🚌" });
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
        <Button size="sm" onClick={() => openEdit()}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
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
                  <img src={c.logo_url} alt={c.name} className="w-10 h-10 rounded object-contain" />
                ) : (
                  <span className="text-xl">{c.logo}</span>
                )}
              </TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <Switch checked={c.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, is_active: v })} />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier" : "Ajouter"} une compagnie</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Emoji (fallback)</Label><Input value={form.logo} onChange={(e) => setForm(p => ({ ...p, logo: e.target.value }))} className="mt-1" /></div>
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
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending || uploading}>
              {uploading ? "Envoi en cours..." : "Sauvegarder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Destinations Tab ──
const DestinationsTab = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("destinations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing?.id) {
        const { error } = await supabase.from("destinations").update({ name }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("destinations").insert({ name });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast.success(editing?.id ? "Destination modifiée" : "Destination ajoutée");
      setEditing(null);
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("destinations").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["destinations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("destinations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast.success("Destination supprimée");
    },
  });

  const openEdit = (dest?: any) => {
    setName(dest?.name || "");
    setEditing(dest || {});
  };

  if (isLoading) return <p className="text-muted-foreground p-4">Chargement...</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Destinations</h3>
        <Button size="sm" onClick={() => openEdit()}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ville</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {destinations.map((d: any) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell>
                <Switch checked={d.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: d.id, is_active: v })} />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier" : "Ajouter"} une destination</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nom de la ville *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!name || saveMutation.isPending}>Sauvegarder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Courier Services Tab ──
const CourierServicesTab = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", starting_price: 0 });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["courier_services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courier_services").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, description: form.description, starting_price: form.starting_price };
      if (editing?.id) {
        const { error } = await supabase.from("courier_services").update(payload).eq("id", editing.id);
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
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("courier_services").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courier_services"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courier_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier_services"] });
      toast.success("Service supprimé");
    },
  });

  const openEdit = (svc?: any) => {
    setForm(svc ? { name: svc.name, description: svc.description || "", starting_price: svc.starting_price } : { name: "", description: "", starting_price: 0 });
    setEditing(svc || {});
  };

  if (isLoading) return <p className="text-muted-foreground p-4">Chargement...</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Services Courriers</h3>
        <Button size="sm" onClick={() => openEdit()}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Prix (FCFA)</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{s.description}</TableCell>
              <TableCell>{Number(s.starting_price).toLocaleString()} FCFA</TableCell>
              <TableCell>
                <Switch checked={s.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: s.id, is_active: v })} />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier" : "Ajouter"} un service</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} /></div>
            <div><Label>Prix de départ (FCFA)</Label><Input type="number" value={form.starting_price} onChange={(e) => setForm(p => ({ ...p, starting_price: Number(e.target.value) }))} className="mt-1" /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>Sauvegarder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Main Page ──
const AdminVoyages = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bus className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-bold">Voyages & Courriers</h1>
      </div>

      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies" className="gap-2"><Bus className="w-4 h-4" />Compagnies</TabsTrigger>
          <TabsTrigger value="destinations" className="gap-2"><MapPin className="w-4 h-4" />Destinations</TabsTrigger>
          <TabsTrigger value="courriers" className="gap-2"><Mail className="w-4 h-4" />Courriers</TabsTrigger>
        </TabsList>
        <TabsContent value="companies"><CompaniesTab /></TabsContent>
        <TabsContent value="destinations"><DestinationsTab /></TabsContent>
        <TabsContent value="courriers"><CourierServicesTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVoyages;
