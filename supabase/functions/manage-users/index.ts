
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_NAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const allowedOrigin = allowedOrigins.includes(origin)
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

    const isSystemAdmin = !!systemAdmin;

    const { data: requesterPermissions, error: permissionsError } =
      await supabaseAdmin
        .from("role_permissions")
        .select(
          `
          permissions (
            code
          )
        `
        )
        .eq(
          "organization_role_id",
          requesterProfile.organization_role_id
        );

    if (permissionsError) {
      throw permissionsError;
    }

    const permissionCodes = new Set(
      (requesterPermissions || [])
        .map((item: any) => item.permissions?.code)
        .filter(Boolean)
    );

    const hasPermission = (permission: string) =>
      isSystemAdmin || permissionCodes.has(permission);

    const { action, ...params } = await req.json();

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
          is_active,
          organizations (
            id,
            name
          ),
          organization_roles (
            id,
            name,
            code,
            parent_role_id
          ),
          countries (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: false });

      /*
       * Un utilisateur organisationnel ne voit que son organisation.
       */
      if (!isSystemAdmin && requesterProfile.organization_id) {
        query = query.eq(
          "organization_id",
          requesterProfile.organization_id
        );
      }

      /*
       * Si le demandeur possède un pays, il reste dans son périmètre.
       */
      if (!isSystemAdmin && requesterProfile.country_id) {
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

      const users = (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.nom || "",
        created_at: profile.created_at,
        last_sign_in_at: null,
        role: profile.role,
        organization_id: profile.organization_id,
        organization_name:
          profile.organizations?.name || null,
        organization_role_id:
          profile.organization_role_id,
        organization_role_name:
          profile.organization_roles?.name || null,
        organization_role_code:
          profile.organization_roles?.code || null,
        parent_role_id:
          profile.organization_roles?.parent_role_id || null,
        manager_user_id:
          profile.manager_user_id || null,
        country_id:
          profile.country_id || null,
        country_name:
          profile.countries?.name || null,
        is_active:
          profile.is_active,
      }));

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
        !hasPermission("manage_team_accounts")
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
       */
      if (
        !isSystemAdmin &&
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

        if (
          Number(manager.organization_id) !==
          Number(organization_id)
        ) {
          return jsonResponse(
            { error: "Le responsable appartient à une autre organisation" },
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
       * On conserve "user" pour le rôle système.
       * Le véritable poste métier est organization_role_id.
       */
      const { error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .insert({
            id: newUserId,
            email,
            nom: full_name,
            role: "user",
            organization_id,
            organization_role_id,
            manager_user_id:
              manager_user_id || null,
            country_id:
              organizationRole.code === "general_management"
                ? null
                : country_id,
            is_active: true,
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
        !hasPermission("create_users")
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

      if (
        !isSystemAdmin &&
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

    const message =
      error instanceof Error
        ? error.message
        : "Une erreur est survenue";

    return jsonResponse(
      { error: message },
      500,
      corsHeaders
    );
  }
});