import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const defaultForm = {
  company_name: "",
  category: "Fournisseurs",
  country: "Burkina Faso",
  city: "",
  email: "",
  telephone: "",
  whatsapp: "",
  website: "",
  description: "",
  logo: "",
  status: "active",
  country_id: 1,
};

type SupplierForm = typeof defaultForm;

type SupplierRow = {
  id: number;
  company_name: string | null;
  category: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  telephone: string | null;
  whatsapp: string | null;
  website: string | null;
  description: string | null;
  logo: string | null;
  status: string | null;
  country_id: number | null;
};

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierForm>(defaultForm);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Impossible de charger les fournisseurs");
      setLoading(false);
      return;
    }

    setSuppliers((data as SupplierRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, country_id: Number(localStorage.getItem("country_id") || 1) });
    setDialogOpen(true);
  };

  const openEdit = (supplier: SupplierRow) => {
    setEditingId(supplier.id);
    setForm({
      company_name: supplier.company_name || "",
      category: supplier.category || "Fournisseurs",
      country: supplier.country || "Burkina Faso",
      city: supplier.city || "",
      email: supplier.email || "",
      telephone: supplier.telephone || "",
      whatsapp: supplier.whatsapp || "",
      website: supplier.website || "",
      description: supplier.description || "",
      logo: supplier.logo || "",
      status: supplier.status || "active",
      country_id: supplier.country_id || Number(localStorage.getItem("country_id") || 1),
    });
    setDialogOpen(true);
  };

  const saveSupplier = async () => {
    if (!form.company_name.trim()) {
      toast.error("Le nom de l’entreprise est obligatoire");
      return;
    }

    const payload = {
      company_name: form.company_name.trim(),
      category: form.category.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim(),
      whatsapp: form.whatsapp.trim(),
      website: form.website.trim(),
      description: form.description.trim(),
      logo: form.logo.trim(),
      status: form.status.trim(),
      country_id: Number(form.country_id),
    };

    if (editingId) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", editingId);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de la modification");
        return;
      }
      toast.success("Fournisseur modifié");
    } else {
      const { error } = await supabase.from("suppliers").insert(payload);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de l’ajout");
        return;
      }
      toast.success("Fournisseur ajouté");
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...defaultForm, country_id: Number(localStorage.getItem("country_id") || 1) });
    loadSuppliers();
  };

  const deleteSupplier = async (id: number) => {
    const confirmed = window.confirm("Supprimer ce fournisseur ?");
    if (!confirmed) return;

    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Suppression impossible");
      return;
    }

    toast.success("Fournisseur supprimé");
    loadSuppliers();
  };

  const supplierCount = useMemo(() => suppliers.length, [suppliers]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Gestion des fournisseurs</CardTitle>
            <p className="text-sm text-muted-foreground">{supplierCount} fournisseur(s) enregistré(s)</p>
          </div>
          <Button onClick={openCreate}>Ajouter un fournisseur</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Entreprise</th>
                    <th className="p-2">Catégorie</th>
                    <th className="p-2">Pays / Ville</th>
                    <th className="p-2">Contact</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b align-top">
                      <td className="p-2 font-medium">{supplier.company_name}</td>
                      <td className="p-2">{supplier.category}</td>
                      <td className="p-2">{supplier.country} / {supplier.city}</td>
                      <td className="p-2">
                        <div>{supplier.telephone}</div>
                        <div>{supplier.email}</div>
                        <div>{supplier.whatsapp}</div>
                      </td>
                      <td className="p-2">{supplier.status}</td>
                      <td className="p-2 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(supplier)}>Modifier</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteSupplier(supplier.id)}>Supprimer</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entreprise *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Site web</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Logo URL</Label>
              <Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2 md:col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Statut public</Label>
                <p className="text-sm text-muted-foreground">Visible sur la page fournisseurs</p>
              </div>
              <Switch checked={form.status === "active"} onCheckedChange={(checked) => setForm({ ...form, status: checked ? "active" : "inactive" })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <div className="pb-8">
        
            </div>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveSupplier}>Sauvegarder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSuppliers;
