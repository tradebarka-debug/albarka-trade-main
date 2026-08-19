
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_NAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rolePermissionDefaults: Record<string, string[]> = {
  general_management: ["create_users", "manage_team_accounts", "view_team_overview", "manage_restaurants", "manage_suppliers", "manage_factories"],
  directeur_general: ["create_users", "manage_team_accounts", "view_team_overview", "manage_restaurants", "manage_suppliers", "manage_factories"],
  directeur_generale: ["create_users", "manage_team_accounts", "view_team_overview", "manage_restaurants", "manage_suppliers", "manage_factories"],
  directeur_commercial: ["create_users", "manage_team_accounts", "view_team_overview", "manage_restaurants", "manage_suppliers", "manage_factories"],
  direction_commerciale: ["create_users", "manage_team_accounts", "view_team_overview", "manage_restaurants", "manage_suppliers", "manage_factories"],
  responsable_commercial: ["create_users", "manage_team_accounts", "view_team_overview", "manage_restaurants", "manage_suppliers", "manage_factories"],
  commercial_manager: ["create_users", "manage_team_accounts", "view_team_overview", "manage_restaurants", "manage_suppliers", "manage_factories"],
  agent_commercial: ["create_partners", "manage_restaurants", "manage_suppliers", "manage_factories"],
  agent_commerciale: ["create_partners", "manage_restaurants", "manage_suppliers", "manage_factories"],
  commercial_agent: ["create_partners", "manage_restaurants", "manage_suppliers", "manage_factories"],
  sales_agent: ["create_partners", "manage_restaurants", "manage_suppliers", "manage_factories"],
};

const allowedOrigins = [
  "https://albarka-trade.lovable.app",
  "https://albarka-trade.com",
  "https://www.albarka-trade.com",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|10\.153\.198\.191|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
  const allowedOrigin = allowedOrigins.includes(origin) || isLocalOrigin
    ? origin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

function validateInput(data: {
  email?: string;
  password?: string;
  full_name?: string;
}) {
  const errors: string[] = [];

  if (data.email !== undefined) {
    if (
      typeof data.email !== "string" ||
      !EMAIL_REGEX.test(data.email)
    ) {
      errors.push("Adresse email invalide");
    }

    if (data.email.length > 255) {
      errors.push("Email trop long");
    }
  }

  if (data.password !== undefined && data.password !== "") {
    if (
      typeof data.password !== "string" ||
      data.password.length < MIN_PASSWORD_LENGTH
    ) {
      errors.push(
        `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`
      );
    }

    if (data.password.length > 128) {
      errors.push("Mot de passe trop long");
    }
  }

  if (data.full_name !== undefined) {
    if (typeof data.full_name !== "string") {
      errors.push("Nom invalide");
    } else if (data.full_name.length > MAX_NAME_LENGTH) {
      errors.push(
        `Le nom doit contenir moins de ${MAX_NAME_LENGTH} caractères`
      );
    }
  }

  return errors;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        { error: "Authorization manquante" },
        401,
        corsHeaders
      );
    }

    const supabaseUser = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !currentUser) {
      return jsonResponse(
        { error: "Utilisateur non authentifié" },
        401,
        corsHeaders
      );
    }

    /*
     * ---------------------------------------------------------
     * Récupération du profil du demandeur
     * ---------------------------------------------------------
     */

    const { data: requesterProfile, error: requesterError } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `
          id,
          role,
          organization_id,
          organization_role_id,
          country_id,
          is_active
        `
        )
        .eq("id", currentUser.id)
        .maybeSingle();

    if (requesterError) {
      throw requesterError;
    }

    if (!requesterProfile) {
      return jsonResponse(
        { error: "Profil utilisateur introuvable" },
        403,
        corsHeaders
      );
    }

    let requesterOrganizationRole: { name: string; code: string } | null = null;
    if (requesterProfile.organization_role_id) {
      const { data: requesterRoleRow, error: requesterRoleError } =
        await supabaseAdmin
          .from("organization_roles")
          .select("name, code")
          .eq("id", requesterProfile.organization_role_id)
          .maybeSingle();
      if (requesterRoleError) throw requesterRoleError;
      requesterOrganizationRole = requesterRoleRow ?? null;
    }

    let requesterOrganizationType: string | null = null;
    if (requesterProfile.organization_id) {
      const { data: requesterOrganization, error: requesterOrganizationError } =
        await supabaseAdmin
          .from("organizations")
          .select("organization_type")
          .eq("id", requesterProfile.organization_id)
          .maybeSingle();
      if (requesterOrganizationError) throw requesterOrganizationError;
      requesterOrganizationType = requesterOrganization?.organization_type ?? null;
    }

    /*
     * ---------------------------------------------------------
     * Vérification des permissions
     * ---------------------------------------------------------
     */

    const { data: systemAdmin } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    const requesterRoleCode = requesterOrganizationRole?.code;
    const effectiveRoleCode = requesterRoleCode ?? requesterProfile.role;
    const normalizedRoleCode = String(effectiveRoleCode ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[ -]+/g, "_");
    const isManagementRole =
      [
        "general_management",
        "directeur_general",
        "directeur_generale",
        "pdg",
        "president",
        "ceo",
        "direction_general",
      ].includes(normalizedRoleCode) &&
      // Le code de poste "ceo"/"pdg" est réutilisé par chaque organisation
      // partenaire (fournisseur, restaurant, usine...). Seul le PDG/la
      // direction de l'organisation Albarka Trade elle-même doit obtenir
      // les droits d'administration interne.
      requesterOrganizationType === "albarka_trade";
    const isSystemAdmin = !!systemAdmin || requesterProfile.role === "admin";

    const { data: requesterPermissions, error: permissionsError } =
      await supabaseAdmin
        .from("role_permissions")
        .select("permission_id")
        .eq(
          "organization_role_id",
          requesterProfile.organization_role_id
        );

    if (permissionsError) {
      throw permissionsError;
    }

    const requesterPermissionIds = (requesterPermissions || [])
      .map((item: any) => item.permission_id)
      .filter((id: unknown) => id !== null && id !== undefined);

    const permissionCodes = new Set<string>();
    if (requesterPermissionIds.length > 0) {
      const { data: permissionRows, error: permissionRowsError } =
        await supabaseAdmin
          .from("permissions")
          .select("id, code")
          .in("id", requesterPermissionIds);
      if (permissionRowsError) throw permissionRowsError;
      (permissionRows || []).forEach((row: any) => {
        if (row.code) permissionCodes.add(row.code);
      });
    }
    const defaultPermissions =
      // Ces codes de poste correspondent a l'organigramme interne Albarka
      // Trade : ne jamais les appliquer a un poste d'une organisation
      // partenaire, meme en cas d'homonymie de code.
      requesterOrganizationType === "albarka_trade"
        ? rolePermissionDefaults[normalizedRoleCode] ?? []
        : [];
    defaultPermissions.forEach((permission) => permissionCodes.add(permission));

    const { data: organizationRoles, error: organizationRolesError } =
      await supabaseAdmin
        .from("organization_roles")
        .select("id, organization_id, parent_role_id");

    if (organizationRolesError) {
      throw organizationRolesError;
    }

    const roleById = new Map<number, any>(
      (organizationRoles || []).map((role: any) => [Number(role.id), role])
    );
    const hasManagedRoles =
      (organizationRoles || []).some(
        (role: any) =>
          Number(role.parent_role_id) ===
          Number(requesterProfile.organization_role_id)
      ) &&
      // Un PDG/manager partenaire a toujours des postes subalternes dans SA
      // propre organisation : ça ne doit donner des droits d'administration
      // interne (creer/gerer des comptes, ouvrir un compte partenaire dans
      // une autre organisation) que pour un manager Albarka Trade lui-même.
      requesterOrganizationType === "albarka_trade";

    const isSubordinateRole = (targetRoleId: number | null | undefined) => {
      if (isSystemAdmin) {
        return true;
      }

      if (!requesterProfile.organization_role_id || !targetRoleId) {
        return false;
      }

      let currentRole = roleById.get(Number(targetRoleId));
      const visitedRoles = new Set<number>();

      while (currentRole?.parent_role_id) {
        const parentRoleId = Number(currentRole.parent_role_id);
        if (parentRoleId === Number(requesterProfile.organization_role_id)) {
          return true;
        }

        if (visitedRoles.has(parentRoleId)) {
          break;
        }

        visitedRoles.add(parentRoleId);
        currentRole = roleById.get(parentRoleId);
      }

      return false;
    };

    const isGlobalManager = isSystemAdmin || isManagementRole;
    const isInRequesterScope = (organizationId: number | null, countryId: number | null) =>
      isGlobalManager || (
        Number(organizationId) === Number(requesterProfile.organization_id) &&
        (!requesterProfile.country_id || Number(countryId) === Number(requesterProfile.country_id))
      );

    const canManageProfile = (profile: any) =>
      isInRequesterScope(profile.organization_id, profile.country_id) &&
      isSubordinateRole(profile.organization_role_id);
    const isPartnerPdg = (profile: any) =>
      ["ceo", "pdg", "general_management"].includes(
        roleById.get(Number(profile.organization_role_id))?.code
      );
    const canApprovePendingPartner = (profile: any) =>
      !profile.is_active &&
      isPartnerPdg(profile) &&
      (isGlobalManager ||
        permissionCodes.has("approve_organization") ||
        permissionCodes.has("manage_partners"));

    const hasPermission = (permission: string) =>
      isSystemAdmin ||
      permissionCodes.has(permission) ||
      ((isManagementRole || hasManagedRoles) && [
        "create_users",
        "manage_team_accounts",
        "delete_users",
      ].includes(permission));
    const canOpenPartnerAccount =
      isGlobalManager ||
      hasManagedRoles ||
      permissionCodes.has("create_partners") ||
      permissionCodes.has("manage_partners");

    const { action, ...params } = await req.json();

    if (action === "auth_context") {
      return jsonResponse(
        {
          organization_role_code: requesterRoleCode || null,
          organization_role_name: requesterOrganizationRole?.name || null,
          profile_role: requesterProfile.role || null,
          permission_codes: [...permissionCodes],
          is_system_admin: isSystemAdmin,
          is_management_role: isManagementRole,
          has_managed_roles: hasManagedRoles,
          is_internal_organization: requesterOrganizationType === "albarka_trade",
        },
        200,
        corsHeaders
      );
    }

    if (action === "config") {
      const [organizationsResult, countriesResult, rolesResult, profilesResult] =
        await Promise.all([
          supabaseAdmin
            .from("organizations")
            .select("id, name, organization_type, country_id, actif")
            .order("name"),
          supabaseAdmin.from("countries").select("id, name").order("name"),
          supabaseAdmin
            .from("organization_roles")
            .select("id, name, code, organization_id, parent_role_id")
            .order("id"),
          supabaseAdmin
            .from("profiles")
            .select("id, nom, email, organization_id, organization_role_id, country_id, is_active")
            .order("nom"),
        ]);

      if (organizationsResult.error) throw organizationsResult.error;
      if (countriesResult.error) throw countriesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const scopedOrganizations = canOpenPartnerAccount
        ? organizationsResult.data || []
        : (organizationsResult.data || []).filter(
            (organization: any) =>
              Number(organization.id) === Number(requesterProfile.organization_id)
          );
      const scopedCountries = canOpenPartnerAccount
        ? countriesResult.data || []
        : (countriesResult.data || []).filter(
            (country: any) =>
              !requesterProfile.country_id ||
              Number(country.id) === Number(requesterProfile.country_id)
          );
      const scopedRoles = canOpenPartnerAccount
        ? rolesResult.data || []
        : (rolesResult.data || []).filter(
            (role: any) =>
              Number(role.organization_id) === Number(requesterProfile.organization_id)
          );

      return jsonResponse(
        {
          organizations: scopedOrganizations,
          countries: scopedCountries,
          organization_roles: scopedRoles,
          profiles: profilesResult.data || [],
          current_profile: requesterProfile,
          can_open_partner_account: canOpenPartnerAccount,
        },
        200,
        corsHeaders
      );
    }

    /*
     * =========================================================
     * LIST
     * =========================================================
     */

    if (action === "list") {
      if (
        !hasPermission("manage_team_accounts") &&
        !hasPermission("create_users")
      ) {
        return jsonResponse(
          { error: "Permission insuffisante" },
          403,
          corsHeaders
        );
      }

      let query = supabaseAdmin
        .from("profiles")
        .select(
          `
          id,
          email,
          nom,
          role,
          created_at,
          organization_id,
          organization_role_id,
          manager_user_id,
          country_id,
          is_active
        `
        )
        .order("created_at", { ascending: false });

      /*
       * Un utilisateur organisationnel ne voit que son organisation.
       */
      if (!isGlobalManager && requesterProfile.organization_id) {
        query = query.eq(
          "organization_id",
          requesterProfile.organization_id
        );
      }

      /*
       * Si le demandeur possède un pays, il reste dans son périmètre.
       */
      if (!isGlobalManager && requesterProfile.country_id) {
        query = query.eq(
          "country_id",
          requesterProfile.country_id
        );
      }

      const { data: profiles, error: profilesError } =
        await query;

      if (profilesError) {
        throw profilesError;
      }

      // Jointure manuelle en JS plutot qu'un embed relationnel PostgREST :
      // organizations/organization_roles/countries sont des tables drift
      // (creees hors migration) dont les FK ne sont pas toujours reconnues
      // par le cache de schema, ce qui fait echouer un select embarque.
      const [organizationsAllResult, organizationRolesAllResult, countriesAllResult] =
        await Promise.all([
          supabaseAdmin.from("organizations").select("id, name"),
          supabaseAdmin.from("organization_roles").select("id, name, code, parent_role_id"),
          supabaseAdmin.from("countries").select("id, name"),
        ]);

      if (organizationsAllResult.error) throw organizationsAllResult.error;
      if (organizationRolesAllResult.error) throw organizationRolesAllResult.error;
      if (countriesAllResult.error) throw countriesAllResult.error;

      const organizationsById = new Map(
        (organizationsAllResult.data || []).map((org: any) => [Number(org.id), org])
      );
      const organizationRolesByIdMap = new Map(
        (organizationRolesAllResult.data || []).map((role: any) => [Number(role.id), role])
      );
      const countriesById = new Map(
        (countriesAllResult.data || []).map((country: any) => [Number(country.id), country])
      );

      const users = (profiles || [])
        .filter((profile: any) =>
          isSystemAdmin ||
          (isManagementRole && isInRequesterScope(profile.organization_id, profile.country_id)) ||
          canManageProfile(profile) ||
          (hasPermission("manage_team_accounts") &&
            ["commercial", "agent_commercial", "agent_commerciale", "commercial_agent", "sales_agent"].includes(String(profile.role || "").toLowerCase()) &&
            isInRequesterScope(profile.organization_id, profile.country_id)) ||
          canApprovePendingPartner(profile) ||
          profile.id === currentUser.id
        )
        .map((profile: any) => {
          const organizationRole = organizationRolesByIdMap.get(Number(profile.organization_role_id));
          const organization = organizationsById.get(Number(profile.organization_id));
          const country = countriesById.get(Number(profile.country_id));

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.nom || "",
            created_at: profile.created_at,
            last_sign_in_at: null,
            role: profile.role,
            organization_id: profile.organization_id,
            organization_name: organization?.name || null,
            organization_role_id: profile.organization_role_id,
            organization_role_name: organizationRole?.name || null,
            organization_role_code: organizationRole?.code || null,
            parent_role_id: organizationRole?.parent_role_id || null,
            manager_user_id: profile.manager_user_id || null,
            country_id: profile.country_id || null,
            country_name: country?.name || null,
            is_active: profile.is_active,
          };
        });

      return jsonResponse(
        { users },
        200,
        corsHeaders
      );
    }

    /*
     * =========================================================
     * CREATE
     * =========================================================
     */

    if (action === "create") {
      if (
        !hasPermission("create_users") &&
        !hasPermission("manage_team_accounts") &&
        !hasPermission("create_partners")
      ) {
        return jsonResponse(
          { error: "Vous n'avez pas l'autorisation de créer un compte" },
          403,
          corsHeaders
        );
      }

      const {
        email,
        password,
        full_name,
        organization_id,
        organization_role_id,
        country_id,
        manager_user_id,
      } = params;

      const validationErrors = validateInput({
        email,
        password,
        full_name,
      });

      if (validationErrors.length > 0) {
        return jsonResponse(
          { error: validationErrors.join(", ") },
          400,
          corsHeaders
        );
      }

      if (!organization_id) {
        return jsonResponse(
          { error: "L'organisation est obligatoire" },
          400,
          corsHeaders
        );
      }

      if (!organization_role_id) {
        return jsonResponse(
          { error: "Le poste est obligatoire" },
          400,
          corsHeaders
        );
      }

      /*
       * Vérification organisation
       * (les comptes créateurs de partenaires peuvent ouvrir un compte
       * dans une autre organisation, ex: PDG d'un fournisseur)
       */
      if (
        !isSystemAdmin &&
        !canOpenPartnerAccount &&
        Number(organization_id) !==
          Number(requesterProfile.organization_id)
      ) {
        return jsonResponse(
          { error: "Vous ne pouvez pas créer un compte dans cette organisation" },
          403,
          corsHeaders
        );
      }

      /*
       * Récupération du rôle depuis la base.
       */
      const { data: organizationRole, error: roleError } =
        await supabaseAdmin
          .from("organization_roles")
          .select(
            "id, name, code, organization_id, parent_role_id"
          )
          .eq("id", organization_role_id)
          .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      if (!organizationRole) {
        return jsonResponse(
          { error: "Poste introuvable" },
          400,
          corsHeaders
        );
      }

      if (
        Number(organizationRole.organization_id) !==
        Number(organization_id)
      ) {
        return jsonResponse(
          { error: "Ce poste n'appartient pas à cette organisation" },
          400,
          corsHeaders
        );
      }

      const isPartnerPdg = ["ceo", "pdg", "general_management"].includes(
        organizationRole.code
      );
      if (!isSubordinateRole(Number(organization_role_id)) &&
        !(canOpenPartnerAccount && isPartnerPdg)) {
        return jsonResponse(
          { error: "Vous ne pouvez créer que des postes subalternes à votre fonction" },
          403,
          corsHeaders
        );
      }

      /*
       * Le Directeur général peut être global.
       * Les autres postes doivent avoir un pays.
       */
      if (
        organizationRole.code !== "general_management" &&
        !country_id
      ) {
        return jsonResponse(
          { error: "Le pays est obligatoire pour ce poste" },
          400,
          corsHeaders
        );
      }

      /*
       * Le pays du demandeur limite la création.
       */
      if (
        !isSystemAdmin &&
        requesterProfile.country_id &&
        Number(country_id) !==
          Number(requesterProfile.country_id)
      ) {
        return jsonResponse(
          { error: "Vous ne pouvez créer un compte que dans votre pays" },
          403,
          corsHeaders
        );
      }

      /*
       * Vérification du responsable.
       */
      if (manager_user_id) {
        const { data: manager, error: managerError } =
          await supabaseAdmin
            .from("profiles")
            .select(
              `
              id,
              organization_id,
              country_id,
              organization_role_id,
              is_active
            `
            )
            .eq("id", manager_user_id)
            .maybeSingle();

        if (managerError) {
          throw managerError;
        }

        if (!manager) {
          return jsonResponse(
            { error: "Responsable introuvable" },
            400,
            corsHeaders
          );
        }

        if (!isInRequesterScope(manager.organization_id, manager.country_id) && !isSystemAdmin) {
          return jsonResponse(
            { error: "Le responsable est hors de votre zone de gestion" },
            400,
            corsHeaders
          );
        }

        if (!manager.is_active) {
          return jsonResponse(
            { error: "Le responsable est désactivé" },
            400,
            corsHeaders
          );
        }

        if (
          country_id &&
          manager.country_id &&
          Number(manager.country_id) !== Number(country_id)
        ) {
          return jsonResponse(
            { error: "Le responsable doit appartenir au même pays" },
            400,
            corsHeaders
          );
        }

        if (!isSystemAdmin && manager.id !== currentUser.id && !canManageProfile(manager)) {
          return jsonResponse(
            { error: "Le responsable n'appartient pas à votre chaîne hiérarchique" },
            403,
            corsHeaders
          );
        }
      }

      /*
       * Création Auth
       */
      const {
        data: newAuthUser,
        error: createError,
      } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name,
          },
        });

      if (createError) {
        throw createError;
      }

      if (!newAuthUser.user) {
        throw new Error("Le compte utilisateur n'a pas été créé");
      }

      const newUserId = newAuthUser.user.id;

      /*
       * Création du profil.
       *
       * Le trigger on_auth_user_created insère déjà une ligne profiles
       * dès la création du compte Auth : on utilise upsert pour compléter
       * cette ligne au lieu d'entrer en conflit avec elle.
       *
       * profiles.role est un enum métier (admin/restaurant/alimentaire/livreur)
       * qui n'a pas de valeur générique "user" : on le laisse à null pour
       * les comptes organisationnels, le vrai poste est organization_role_id.
       */
      const { error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .upsert({
            id: newUserId,
            email,
            nom: full_name,
            role: null,
            organization_id,
            organization_role_id,
            manager_user_id:
              manager_user_id || null,
            country_id:
              organizationRole.code === "general_management"
                ? null
                : country_id,
            is_active:
              canOpenPartnerAccount && isPartnerPdg && !isGlobalManager
                ? false
                : true,
          });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw profileError;
      }

      /*
       * Accès organisation / pays.
       */
      const { error: scopeError } =
        await supabaseAdmin
          .from("access_scopes")
          .insert({
            user_id: newUserId,
            organization_id,
            country_id:
              organizationRole.code === "general_management"
                ? null
                : country_id,
            scope_type: "organization",
            scope_id: organization_id,
            actif: true,
          });

      if (scopeError) {
        console.error(
          "Erreur access_scope:",
          scopeError
        );
      }

      /*
       * user_roles reste utilisé pour la compatibilité
       * avec l'ancien système.
       */
      await supabaseAdmin
        .from("user_roles")
        .upsert(
          {
            user_id: newUserId,
            role: "user",
          },
          {
            onConflict: "user_id",
          }
        );

      return jsonResponse(
        {
          success: true,
          user: newAuthUser.user,
        },
        200,
        corsHeaders
      );
    }

    /*
     * =========================================================
     * UPDATE
     * =========================================================
     */

    if (action === "update") {
      if (
        !hasPermission("manage_team_accounts") &&
        !hasPermission("create_users") &&
        !hasPermission("approve_organization")
      ) {
        return jsonResponse(
          { error: "Permission insuffisante" },
          403,
          corsHeaders
        );
      }

      const {
        userId,
        email,
        password,
        full_name,
        organization_id,
        organization_role_id,
        country_id,
        manager_user_id,
        is_active,
      } = params;

      if (!userId) {
        return jsonResponse(
          { error: "Utilisateur manquant" },
          400,
          corsHeaders
        );
      }

      /*
       * Vérifier le profil cible.
       */
      const { data: targetProfile, error: targetError } =
        await supabaseAdmin
          .from("profiles")
          .select(
            `
            id,
            organization_id,
            country_id,
            organization_role_id,
            manager_user_id,
            is_active
          `
          )
          .eq("id", userId)
          .maybeSingle();

      if (targetError) {
        throw targetError;
      }

      if (!targetProfile) {
        return jsonResponse(
          { error: "Profil utilisateur introuvable" },
          404,
          corsHeaders
        );
      }

      const canApproveTarget = canApprovePendingPartner(targetProfile);
      if (!canManageProfile(targetProfile) && !canApproveTarget) {
        return jsonResponse(
          { error: "Vous ne pouvez gérer que les utilisateurs subalternes de votre zone" },
          403,
          corsHeaders
        );
      }

      const requestedRoleId = organization_role_id ?? targetProfile.organization_role_id;
      if (!isSubordinateRole(Number(requestedRoleId)) && !canApproveTarget) {
        return jsonResponse(
          { error: "Vous ne pouvez attribuer que des postes subalternes à votre fonction" },
          403,
          corsHeaders
        );
      }

      if (!canManageProfile(targetProfile) && !canApproveTarget) {
        return jsonResponse(
          { error: "Vous ne pouvez supprimer que les utilisateurs subalternes de votre zone" },
          403,
          corsHeaders
        );
      }

      if (
        !isSystemAdmin &&
        !canApproveTarget &&
        Number(targetProfile.organization_id) !==
          Number(requesterProfile.organization_id)
      ) {
        return jsonResponse(
          { error: "Accès interdit à cet utilisateur" },
          403,
          corsHeaders
        );
      }

      if (
        !isSystemAdmin &&
        !canApproveTarget &&
        requesterProfile.country_id &&
        targetProfile.country_id &&
        Number(targetProfile.country_id) !==
          Number(requesterProfile.country_id)
      ) {
        return jsonResponse(
          { error: "Cet utilisateur appartient à un autre pays" },
          403,
          corsHeaders
        );
      }

      /*
       * Mise à jour Auth.
       */
      const authUpdate: Record<string, unknown> = {
        user_metadata: {
          full_name,
        },
      };

      if (email) {
        authUpdate.email = email;
      }

      if (password) {
        authUpdate.password = password;
      }

      if (is_active !== undefined) {
        authUpdate.ban_duration = is_active
          ? "none"
          : "876000h";
      }

      const { data: updatedAuthUser, error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(
          userId,
          authUpdate
        );

      if (authUpdateError) {
        throw authUpdateError;
      }

      /*
       * Mise à jour profile.
       */
      const profileUpdate: Record<string, unknown> = {
        email,
        nom: full_name,
      };

      if (organization_id !== undefined) {
        profileUpdate.organization_id = organization_id;
      }

      if (organization_role_id !== undefined) {
        profileUpdate.organization_role_id =
          organization_role_id;
      }

      if (country_id !== undefined) {
        profileUpdate.country_id =
          country_id || null;
      }

      if (manager_user_id !== undefined) {
        profileUpdate.manager_user_id =
          manager_user_id || null;
      }

      if (is_active !== undefined) {
        profileUpdate.is_active = is_active;
      }

      const { error: profileUpdateError } =
        await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      /*
       * Synchronisation access_scope.
       */
      const finalOrganizationId =
        organization_id ??
        targetProfile.organization_id;

      const finalRoleId =
        organization_role_id ??
        targetProfile.organization_role_id;

      const { data: finalRole } =
        await supabaseAdmin
          .from("organization_roles")
          .select("code")
          .eq("id", finalRoleId)
          .maybeSingle();

      await supabaseAdmin
        .from("access_scopes")
        .delete()
        .eq("user_id", userId)
        .eq("organization_id", finalOrganizationId);

      await supabaseAdmin
        .from("access_scopes")
        .insert({
          user_id: userId,
          organization_id: finalOrganizationId,
          country_id:
            finalRole?.code === "general_management"
              ? null
              : country_id ?? targetProfile.country_id,
          scope_type: "organization",
          scope_id: finalOrganizationId,
          actif:
            is_active !== undefined
              ? is_active
              : targetProfile.is_active,
        });

      return jsonResponse(
        {
          success: true,
          user: updatedAuthUser.user,
        },
        200,
        corsHeaders
      );
    }

    /*
     * =========================================================
     * DELETE
     * =========================================================
     */

    if (action === "delete") {
      if (!hasPermission("delete_users")) {
        return jsonResponse(
          {
            error:
              "Vous n'avez pas l'autorisation de supprimer un utilisateur",
          },
          403,
          corsHeaders
        );
      }

      const { userId } = params;

      if (!userId) {
        return jsonResponse(
          { error: "Utilisateur manquant" },
          400,
          corsHeaders
        );
      }

      if (userId === currentUser.id) {
        return jsonResponse(
          {
            error:
              "Vous ne pouvez pas supprimer votre propre compte",
          },
          400,
          corsHeaders
        );
      }

      const { data: targetProfile } =
        await supabaseAdmin
          .from("profiles")
          .select(
            "id, organization_id, country_id"
          )
          .eq("id", userId)
          .maybeSingle();

      if (
        !isSystemAdmin &&
        targetProfile &&
        Number(targetProfile.organization_id) !==
          Number(requesterProfile.organization_id)
      ) {
        return jsonResponse(
          { error: "Utilisateur hors de votre organisation" },
          403,
          corsHeaders
        );
      }

      await supabaseAdmin
        .from("access_scopes")
        .delete()
        .eq("user_id", userId);

      await supabaseAdmin
        .from("user_management")
        .delete()
        .or(
          `manager_user_id.eq.${userId},managed_user_id.eq.${userId}`
        );

      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(
          userId
        );

      if (deleteError) {
        throw deleteError;
      }

      return jsonResponse(
        { success: true },
        200,
        corsHeaders
      );
    }

    return jsonResponse(
      { error: "Action invalide" },
      400,
      corsHeaders
    );
  } catch (error) {
    console.error("manage-users error:", error);

    // Les erreurs Postgrest ne sont pas des instances d'Error mais ont un champ "message".
    const message =
      (error as any)?.message ||
      (error instanceof Error ? error.message : null) ||
      "Une erreur est survenue";

    return jsonResponse(
      { error: message },
      500,
      corsHeaders
    );
  }
});
