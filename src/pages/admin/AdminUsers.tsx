import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Loader2,
  Shield,
  User,
  Power,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

/* =========================================================
   HELPERS
========================================================= */

// Les erreurs d'edge function n'exposent pas le message réel (juste
// "non-2xx status code"); on va le chercher dans le corps de la réponse.
async function getFunctionErrorMessage(error: any, fallback: string) {
  const response = error?.context;
  if (response && typeof response.json === "function") {
    try {
      const body = await response.clone().json();
      if (body?.error) return mapBackendErrorMessage(body.error as string);
    } catch {
      // corps non-JSON, on ignore
    }
  }
  return mapBackendErrorMessage(error?.message || fallback);
}

function mapBackendErrorMessage(message: string) {
  if (!message) return message;

  if (message.includes("A user with this email address has already been registered")) {
    return "Un compte existe deja avec cet email.";
  }

  if (message.includes("Invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  return message;
}

/* =========================================================
   TYPES
========================================================= */

interface Organization {
  id: number;
  name: string;
  organization_type?: string | null;
  country_id?: number | null;
  actif?: boolean | null;
}

interface Country {
  id: number;
  name: string;
}

interface OrganizationRole {
  id: number;
  name: string;
  code: string;
  organization_id: number;
  parent_role_id: number | null;
}

interface ProfileOption {
  id: string;
  nom: string | null;
  email: string | null;
  organization_id: number | null;
  organization_role_id: number | null;
  country_id: number | null;
  is_active: boolean;
}

interface UserData {
  id: string;
  email: string;
  telephone: string | null;
  full_name: string;
  created_at: string;
  last_sign_in_at: string | null;

  role: string;

  organization_id: number | null;
  organization_name: string | null;

  organization_role_id: number | null;
  organization_role_name: string | null;
  organization_role_code?: string | null;

  parent_role_id?: number | null;

  manager_user_id?: string | null;

  country_id?: number | null;
  country_name?: string | null;

  is_active: boolean;
}

interface UserFormData {
  email: string;
  telephone: string;
  password: string;
  full_name: string;

  organization_id: number | null;
  organization_role_id: number | null;
  country_id: number | null;
  manager_user_id: string | null;

  is_active: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

const AdminUsers = () => {
  const { session, user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  /* ---------------------------------------------------------
     DATA
  --------------------------------------------------------- */

  const [users, setUsers] = useState<UserData[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [organizationRoles, setOrganizationRoles] = useState<
    OrganizationRole[]
  >([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [canOpenPartnerAccount, setCanOpenPartnerAccount] = useState(false);

  /* ---------------------------------------------------------
     STATE
  --------------------------------------------------------- */

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    telephone: "",
    password: "",
    full_name: "",
    organization_id: null,
    organization_role_id: null,
    country_id: null,
    manager_user_id: null,
    is_active: true,
  });

  const currentProfile = profiles.find(
    (profile) => profile.id === currentUser?.id
  );

  const isSubordinateRole = (targetRoleId: number) => {
    if (isAdmin) {
      return true;
    }

    const targetRole = organizationRoles.find(
      (item) => Number(item.id) === Number(targetRoleId)
    );
    if (
      canOpenPartnerAccount &&
      ["ceo", "pdg", "general_management"].includes(targetRole?.code || "")
    ) {
      return true;
    }

    if (!currentProfile?.organization_role_id) {
      return false;
    }

    const pendingRoleIds = [Number(currentProfile.organization_role_id)];
    const visitedRoleIds = new Set<number>();

    while (pendingRoleIds.length > 0) {
      const parentRoleId = pendingRoleIds.shift();
      if (!parentRoleId || visitedRoleIds.has(parentRoleId)) continue;
      visitedRoleIds.add(parentRoleId);

      const childRoles = organizationRoles.filter(
        (item) => Number(item.parent_role_id) === parentRoleId
      );
      if (childRoles.some((item) => Number(item.id) === Number(targetRoleId))) {
        return true;
      }
      pendingRoleIds.push(...childRoles.map((item) => Number(item.id)));
    }

    return false;
  };

  /* =========================================================
     CHARGEMENT DES DONNÉES DE CONFIGURATION
  ========================================================= */

  const fetchConfiguration = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "config" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOrganizations(
        (data?.organizations || []) as Organization[]
      );

      setCountries(
        (data?.countries || []) as Country[]
      );

      setOrganizationRoles(
        (data?.organization_roles || []) as OrganizationRole[]
      );

      setProfiles(
        (data?.profiles || []) as ProfileOption[]
      );
      setCanOpenPartnerAccount(Boolean(data?.can_open_partner_account));
    } catch (error: any) {
      console.error("Erreur configuration AdminUsers:", error);

      toast({
        title: "Erreur",
        description: await getFunctionErrorMessage(
          error,
          "Impossible de charger la configuration"
        ),
        variant: "destructive",
      });
    }
  };

  /* =========================================================
     CHARGEMENT DES UTILISATEURS
  ========================================================= */

  const fetchUsers = async () => {
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke("manage-users", {
          body: {
            action: "list",
          },
        });

      if (error) {
        throw error;
      }

      setUsers(data?.users || []);
    } catch (error: any) {
      console.error("Erreur chargement utilisateurs:", error);

      toast({
        title: "Erreur",
        description: await getFunctionErrorMessage(
          error,
          "Impossible de charger les utilisateurs"
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     INITIALISATION
  ========================================================= */

  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      await Promise.all([
        fetchUsers(),
        fetchConfiguration(),
      ]);
    };

    load();
  }, [session]);

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setFormData({
      email: "",
      telephone: "",
      password: "",
      full_name: "",
      organization_id: null,
      organization_role_id: null,
      country_id: null,
      manager_user_id: null,
      is_active: true,
    });

    setEditingUser(null);
  };

  /* =========================================================
     OUVRIR CRÉATION
  ========================================================= */

  const openCreateDialog = () => {
    resetForm();

    /*
     * Si l'utilisateur actuel appartient à une organisation,
     * on la sélectionne automatiquement.
     */
    if (currentProfile?.organization_id) {
      setFormData((previous) => ({
        ...previous,
        organization_id:
          currentProfile.organization_id,
        country_id:
          currentProfile.country_id || null,
      }));
    }

    setIsDialogOpen(true);
  };

  /* =========================================================
     OUVRIR MODIFICATION
  ========================================================= */

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);

    setFormData({
      email: user.email || "",
      telephone: user.telephone || "",
      password: "",
      full_name: user.full_name || "",
      organization_id: user.organization_id,
      organization_role_id:
        user.organization_role_id,
      country_id: user.country_id || null,
      manager_user_id:
        user.manager_user_id || null,
      is_active: user.is_active !== false,
    });

    setIsDialogOpen(true);
  };

  /* =========================================================
     RÔLES DE L'ORGANISATION SÉLECTIONNÉE
  ========================================================= */

  const availableRoles = useMemo(() => {
    if (!formData.organization_id) {
      return [];
    }

    return organizationRoles
      .filter(
        (role) =>
          Number(role.organization_id) ===
          Number(formData.organization_id) &&
          isSubordinateRole(role.id)
      )
      .sort((firstRole, secondRole) => {
        const firstIsPdg = ["ceo", "pdg", "general_management"].includes(firstRole.code);
        const secondIsPdg = ["ceo", "pdg", "general_management"].includes(secondRole.code);
        return Number(secondIsPdg) - Number(firstIsPdg) || firstRole.name.localeCompare(secondRole.name, "fr");
      });
  }, [
    organizationRoles,
    formData.organization_id,
    canOpenPartnerAccount,
    isSubordinateRole,
  ]);

  /* =========================================================
     RÔLE SÉLECTIONNÉ
  ========================================================= */

  const selectedRole = useMemo(() => {
    if (!formData.organization_role_id) {
      return null;
    }

    return (
      organizationRoles.find(
        (role) =>
          Number(role.id) ===
          Number(formData.organization_role_id)
      ) || null
    );
  }, [
    organizationRoles,
    formData.organization_role_id,
  ]);

  /* =========================================================
     RESPONSABLES DISPONIBLES
  ========================================================= */

  const availableManagers = useMemo(() => {
    if (
      !formData.organization_id ||
      !selectedRole
    ) {
      return [];
    }

    /*
     * Le responsable doit normalement avoir le
     * parent_role_id du poste sélectionné.
     */
    if (!selectedRole.parent_role_id) {
      return [];
    }

    return profiles.filter((profile) => {
      if (!profile.is_active) {
        return false;
      }

      if (
        Number(profile.organization_id) !==
        Number(formData.organization_id)
      ) {
        return false;
      }

      if (
        Number(profile.organization_role_id) !==
        Number(selectedRole.parent_role_id)
      ) {
        return false;
      }

      /*
       * Le responsable peut être global
       * (exemple : Direction générale).
       */
      if (
        formData.country_id &&
        profile.country_id &&
        Number(profile.country_id) !==
          Number(formData.country_id)
      ) {
        return false;
      }

      return true;
    });
  }, [
    profiles,
    selectedRole,
    formData.organization_id,
    formData.country_id,
  ]);

  /* =========================================================
     CHANGEMENT ORGANISATION
  ========================================================= */

  const handleOrganizationChange = (
    value: string
  ) => {
    const organizationId = Number(value);

    setFormData((previous) => ({
      ...previous,
      organization_id: organizationId,
      organization_role_id: null,
      country_id: null,
      manager_user_id: null,
    }));
  };

  /* =========================================================
     CHANGEMENT RÔLE
  ========================================================= */

  const handleRoleChange = (
    value: string
  ) => {
    const roleId = Number(value);

    const role = organizationRoles.find(
      (item) => Number(item.id) === roleId
    );

    setFormData((previous) => ({
      ...previous,
      organization_role_id: roleId,
      manager_user_id: null,

      /*
       * Direction générale = accès global.
       */
      country_id:
        role?.code === "general_management"
          ? null
          : previous.country_id,
    }));
  };

  /* =========================================================
     CHANGEMENT PAYS
  ========================================================= */

  const handleCountryChange = (
    value: string
  ) => {
    const countryId = Number(value);

    setFormData((previous) => ({
      ...previous,
      country_id: countryId,
      manager_user_id: null,
    }));
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast({
        title: "Nom obligatoire",
        description:
          "Veuillez renseigner le nom complet.",
        variant: "destructive",
      });

      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email obligatoire",
        description:
          "Veuillez renseigner l'adresse email.",
        variant: "destructive",
      });

      return;
    }

    if (!formData.organization_id) {
      toast({
        title: "Organisation obligatoire",
        description:
          "Veuillez sélectionner une organisation.",
        variant: "destructive",
      });

      return;
    }

    if (!formData.organization_role_id) {
      toast({
        title: "Poste obligatoire",
        description:
          "Veuillez sélectionner un poste.",
        variant: "destructive",
      });

      return;
    }

    if (
      selectedRole?.code !==
        "general_management" &&
      !formData.country_id
    ) {
      toast({
        title: "Pays obligatoire",
        description:
          "Veuillez sélectionner le pays du compte.",
        variant: "destructive",
      });

      return;
    }

    if (
      !editingUser &&
      !formData.password
    ) {
      toast({
        title: "Mot de passe obligatoire",
        description:
          "Veuillez renseigner un mot de passe.",
        variant: "destructive",
      });

      return;
    }

    const normalizedTelephone = formData.telephone.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedTelephone)) {
      toast({ title: "Téléphone invalide", description: "Utilisez l'indicatif du pays, par exemple +2250712345678.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const action = editingUser
        ? "update"
        : "create";

      const payload = {
        action,

        ...(editingUser
          ? {
              userId: editingUser.id,
            }
          : {}),

        email: formData.email,
        telephone: normalizedTelephone,
        password:
          formData.password || undefined,
        full_name: formData.full_name,

        organization_id:
          formData.organization_id,

        organization_role_id:
          formData.organization_role_id,

        country_id:
          selectedRole?.code ===
          "general_management"
            ? null
            : formData.country_id,

        manager_user_id:
          formData.manager_user_id || null,

        is_active:
          formData.is_active,
      };

      const { data, error } =
        await supabase.functions.invoke(
          "manage-users",
          {
            body: payload,
          }
        );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: editingUser
          ? "Utilisateur modifié"
          : "Utilisateur créé",

        description: editingUser
          ? "Les informations ont été mises à jour."
          : "Le compte a été créé avec succès.",
      });

      setIsDialogOpen(false);
      resetForm();

      await Promise.all([
        fetchUsers(),
        fetchConfiguration(),
      ]);
    } catch (error: any) {
      console.error(
        "Erreur création/modification:",
        error
      );

      toast({
        title: "Erreur",
        description: await getFunctionErrorMessage(
          error,
          "Une erreur est survenue."
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     ACTIVATION / DÉSACTIVATION
  ========================================================= */

  const toggleUserStatus = async (
    user: UserData
  ) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Action impossible",
        description:
          "Vous ne pouvez pas désactiver votre propre compte.",
        variant: "destructive",
      });

      return;
    }

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "manage-users",
          {
            body: {
              action: "update",
              userId: user.id,

              email: user.email,
              full_name: user.full_name,

              organization_id:
                user.organization_id,

              organization_role_id:
                user.organization_role_id,

              country_id:
                user.country_id || null,

              manager_user_id:
                user.manager_user_id || null,

              is_active:
                !user.is_active,
            },
          }
        );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: user.is_active
          ? "Compte désactivé"
          : "Compte activé",

        description: user.is_active
          ? `${user.full_name} est temporairement désactivé.`
          : `${user.full_name} est de nouveau actif.`,
      });

      await Promise.all([
        fetchUsers(),
        fetchConfiguration(),
      ]);
    } catch (error: any) {
      console.error(
        "Erreur activation/désactivation:",
        error
      );

      toast({
        title: "Erreur",
        description: await getFunctionErrorMessage(
          error,
          "Impossible de modifier le statut."
        ),
        variant: "destructive",
      });
    }
  };

  /* =========================================================
     SUPPRESSION
  ========================================================= */

  const handleDelete = async (
    user: UserData
  ) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Action impossible",
        description:
          "Vous ne pouvez pas supprimer votre propre compte.",
        variant: "destructive",
      });

      return;
    }

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "manage-users",
          {
            body: {
              action: "delete",
              userId: user.id,
            },
          }
        );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Utilisateur supprimé",
        description:
          "Le compte a été définitivement supprimé.",
      });

      setDeleteTarget(null);

      await Promise.all([
        fetchUsers(),
        fetchConfiguration(),
      ]);
    } catch (error: any) {
      console.error(
        "Erreur suppression:",
        error
      );

      toast({
        title: "Erreur",
        description: await getFunctionErrorMessage(
          error,
          "Impossible de supprimer l'utilisateur."
        ),
        variant: "destructive",
      });
    }
  };

  /* =========================================================
     STATISTIQUES
  ========================================================= */

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveUsers = users.filter(
    (user) => !user.is_active
  ).length;

  const adminUsers = users.filter(
    (user) =>
      user.role === "admin" ||
      ["general_management", "directeur_general", "directeur_generale"].includes(
        (user.organization_role_code || "").toLowerCase()
      )
  ).length;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Gestion des utilisateurs
          </h1>

          <p className="text-muted-foreground">
            Gérez les comptes, postes, pays,
            responsables et statuts depuis
            l'administration.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Total utilisateurs
              </p>

              <p className="text-2xl font-bold">
                {totalUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Actifs */}

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Power className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Actifs
              </p>

              <p className="text-2xl font-bold">
                {activeUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Désactivés */}

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Power className="w-5 h-5 text-orange-600" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Désactivés
              </p>

              <p className="text-2xl font-bold">
                {inactiveUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Administrateurs */}

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Direction
              </p>

              <p className="text-2xl font-bold">
                {adminUsers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          DIALOG CREATION / MODIFICATION
      ===================================================== */}

      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingUser
                  ? "Modifier l'utilisateur"
                  : "Créer un utilisateur"}
              </DialogTitle>

              <DialogDescription>
                Configurez le compte directement
                depuis l'administration.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-5">
              {/* -------------------------------------------------
                  NOM
              ------------------------------------------------- */}

              <div className="grid gap-2">
                <Label htmlFor="full_name">
                  Nom complet
                </Label>

                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      full_name:
                        e.target.value,
                    })
                  }
                  placeholder="Kaza Rose"
                  required
                />
              </div>

              {/* -------------------------------------------------
                  EMAIL
              ------------------------------------------------- */}

              <div className="grid gap-2">
                <Label htmlFor="email">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email:
                        e.target.value,
                    })
                  }
                  placeholder="email@exemple.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telephone">Numéro de téléphone</Label>
                <Input id="telephone" type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} placeholder="+2250712345678" required />
                <p className="text-xs text-muted-foreground">Ce numéro permettra aussi de se connecter au compte.</p>
              </div>

              {/* -------------------------------------------------
                  PASSWORD
              ------------------------------------------------- */}

              <div className="grid gap-2">
                <Label htmlFor="password">
                  Mot de passe{" "}
                  {editingUser &&
                    "(laisser vide pour ne pas changer)"}
                </Label>

                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••" required={!editingUser} minLength={6} className="pr-11" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>

              {/* -------------------------------------------------
                  ORGANISATION
              ------------------------------------------------- */}

              <div className="grid gap-2">
                <Label>
                  Organisation
                </Label>

                <Select
                  value={
                    formData.organization_id
                      ? String(
                          formData.organization_id
                        )
                      : undefined
                  }
                  onValueChange={
                    handleOrganizationChange
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une organisation" />
                  </SelectTrigger>

                  <SelectContent>
                    {organizations
                      .filter(
                        (organization) =>
                          organization.actif !== false &&
                          (isAdmin || canOpenPartnerAccount || Number(organization.id) === Number(currentProfile?.organization_id))
                      )
                      .map((organization) => (
                        <SelectItem
                          key={organization.id}
                          value={String(
                            organization.id
                          )}
                        >
                          {organization.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* -------------------------------------------------
                  POSTE
              ------------------------------------------------- */}

              <div className="grid gap-2">
                <Label>
                  Poste / Fonction
                </Label>

                <Select
                  value={
                    formData.organization_role_id
                      ? String(
                          formData.organization_role_id
                        )
                      : undefined
                  }
                  onValueChange={
                    handleRoleChange
                  }
                  disabled={
                    !formData.organization_id
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.organization_id
                          ? "Sélectionner un poste"
                          : "Sélectionnez d'abord l'organisation"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {availableRoles.map(
                      (role) => (
                        <SelectItem
                          key={role.id}
                          value={String(
                            role.id
                          )}
                        >
                          {role.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                {availableRoles.length === 0 &&
                  formData.organization_id && (
                    <p className="text-xs text-muted-foreground">
                      Aucun poste configuré pour
                      cette organisation.
                    </p>
                  )}
              </div>

              {/* -------------------------------------------------
                  PAYS
              ------------------------------------------------- */}

              {selectedRole?.code !==
                "general_management" && (
                <div className="grid gap-2">
                  <Label>
                    Pays
                  </Label>

                  <Select
                    value={
                      formData.country_id
                        ? String(
                            formData.country_id
                          )
                        : undefined
                    }
                    onValueChange={
                      handleCountryChange
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le pays" />
                    </SelectTrigger>

                    <SelectContent>
                      {countries
                        .filter(
                          (country) =>
                            isAdmin || canOpenPartnerAccount || Number(country.id) === Number(currentProfile?.country_id)
                        )
                        .map(
                        (country) => (
                          <SelectItem
                            key={country.id}
                            value={String(
                              country.id
                            )}
                          >
                            {country.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* -------------------------------------------------
                  RESPONSABLE
              ------------------------------------------------- */}

              {selectedRole?.parent_role_id && (
                <div className="grid gap-2">
                  <Label>
                    Responsable hiérarchique
                  </Label>

                  <Select
                    value={
                      formData.manager_user_id ||
                      undefined
                    }
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        manager_user_id:
                          value,
                      })
                    }
                    disabled={
                      availableManagers.length ===
                      0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          availableManagers.length
                            ? "Sélectionner le responsable"
                            : "Aucun responsable disponible"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {availableManagers.map(
                        (manager) => (
                          <SelectItem
                            key={manager.id}
                            value={manager.id}
                          >
                            {manager.nom ||
                              manager.email ||
                              "Utilisateur"}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  {selectedRole.parent_role_id && (
                    <p className="text-xs text-muted-foreground">
                      Le responsable est
                      déterminé selon la
                      hiérarchie du poste.
                    </p>
                  )}
                </div>
              )}

              {/* -------------------------------------------------
                  STATUT
              ------------------------------------------------- */}

              <div className="grid gap-2">
                <Label>
                  Statut du compte
                </Label>

                <Select
                  value={
                    formData.is_active
                      ? "active"
                      : "inactive"
                  }
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      is_active:
                        value === "active",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="active">
                      Actif
                    </SelectItem>

                    <SelectItem value="inactive">
                      Désactivé
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setIsDialogOpen(false)
                }
              >
                Annuler
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}

                {editingUser
                  ? "Enregistrer"
                  : "Créer le compte"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          TABLE UTILISATEURS
      ===================================================== */}

      <div className="bg-card rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />

            <h3 className="text-lg font-semibold">
              Aucun utilisateur
            </h3>

            <p className="text-muted-foreground">
              Créez votre premier utilisateur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Utilisateur
                  </TableHead>

                  <TableHead>
                    Poste
                  </TableHead>

                  <TableHead>
                    Pays
                  </TableHead>

                  <TableHead>
                    Statut
                  </TableHead>

                  <TableHead>
                    Création
                  </TableHead>

                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                  >
                    {/* UTILISATEUR */}

                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user.full_name ||
                            "—"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>

                    {/* POSTE */}

                    <TableCell>
                      <Badge
                        variant={
                          ["general_management", "directeur_general", "directeur_generale"].includes(
                            (user.organization_role_code || "").toLowerCase()
                          )
                            ? "default"
                            : "secondary"
                        }
                        className="gap-1"
                      >
                        {user.organization_role_code ===
                        "general_management" ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}

                        {user.organization_role_name ||
                          user.role ||
                          "Utilisateur"}
                      </Badge>
                    </TableCell>

                    {/* PAYS */}

                    <TableCell>
                      {user.country_name ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />

                          {user.country_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Global
                        </span>
                      )}
                    </TableCell>

                    {/* STATUT */}

                    <TableCell>
                      <Badge
                        variant={
                          user.is_active
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.is_active
                          ? "Actif"
                          : "Désactivé"}
                      </Badge>
                    </TableCell>

                    {/* DATE */}

                    <TableCell>
                      {format(
                        new Date(
                          user.created_at
                        ),
                        "dd MMM yyyy",
                        {
                          locale: fr,
                        }
                      )}
                    </TableCell>

                    {/* ACTIONS */}

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* MODIFIER */}

                        <Button
                          variant="ghost"
                          size="icon"
                          title="Modifier"
                          onClick={() =>
                            openEditDialog(
                              user
                            )
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        {/* ACTIVER / DÉSACTIVER */}

                        {user.id !==
                          currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={
                              user.is_active
                                ? "Désactiver"
                                : "Activer"
                            }
                            onClick={() =>
                              toggleUserStatus(
                                user
                              )
                            }
                          >
                            <Power
                              className={`w-4 h-4 ${
                                user.is_active
                                  ? "text-orange-500"
                                  : "text-green-600"
                              }`}
                            />
                          </Button>
                        )}

                        {/* SUPPRIMER */}

                        {user.id !==
                          currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            onClick={() =>
                              setDeleteTarget(
                                user
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* =====================================================
          CONFIRMATION SUPPRESSION
      ===================================================== */}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer l'utilisateur ?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Cette action est irréversible.

              {deleteTarget && (
                <>
                  <br />
                  <br />

                  Le compte{" "}
                  <strong>
                    {deleteTarget.email}
                  </strong>{" "}
                  sera définitivement supprimé.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Annuler
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  handleDelete(
                    deleteTarget
                  );
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
