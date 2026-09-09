
import { createClient } from "npm:@supabase/supabase-js@2";

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
  const allowedOrigin = allowedOrigins.includes(origin) || isLocalOrigin ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Authorization manquante" }, 401, corsHeaders);
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !currentUser) {
      return jsonResponse({ error: "Utilisateur non authentifié" }, 401, corsHeaders);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, organization_id, organization_role_id, country_id, restaurant_outlet_id, is_active")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile || !profile.organization_id) {
      return jsonResponse({ error: "Aucune organisation associée à ce compte" }, 403, corsHeaders);
    }
    if (!profile.is_active) {
      return jsonResponse({ error: "Compte en attente d'approbation" }, 403, corsHeaders);
    }

    const organizationId = profile.organization_id as number;
    const { data: systemAdminRole, error: systemAdminRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();
    if (systemAdminRoleError) throw systemAdminRoleError;
    const isSystemAdmin = profile.role === "admin" || Boolean(systemAdminRole);
    let roleCode: string | null = null;
    if (profile.organization_role_id) {
      const { data: roleRow, error: roleError } = await supabaseAdmin
        .from("organization_roles")
        .select("code")
        .eq("id", profile.organization_role_id)
        .maybeSingle();
      if (roleError) throw roleError;
      roleCode = roleRow?.code ?? null;
    }
    const isPdg = ["ceo", "pdg", "transport_pdg", "president", "directeur_general", "directeur_generale", "general_management"].includes(
      String(roleCode ?? "").trim().toLowerCase()
    );
    const normalizedRole = String(roleCode ?? "").trim().toLowerCase();
    const capabilities = {
      viewAll: isPdg || ["manager", "accountant"].includes(normalizedRole),
      manageOrders: isPdg || ["manager", "cashier", "cook"].includes(normalizedRole),
      managePayments: isPdg || ["manager", "cashier"].includes(normalizedRole),
      manageDelivery: isPdg || normalizedRole === "manager",
      manageCash: isPdg || ["manager", "cashier"].includes(normalizedRole),
      manageAccounting: isPdg || ["manager", "accountant"].includes(normalizedRole),
      manageTeam: isPdg,
      manageCatalog: isPdg || normalizedRole === "manager",
      manageLogistics: isSystemAdmin || isPdg || normalizedRole === "manager",
    };

    const { action, ...params } = await req.json();
    const resolveOutletId = async (requested?: unknown) => {
      const candidate = profile.restaurant_outlet_id ?? (requested ? Number(requested) : null);
      let query = supabaseAdmin.from("restaurant_outlets").select("id").eq("organization_id", organizationId).eq("is_active", true);
      query = candidate ? query.eq("id", candidate) : query.eq("is_primary", true);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data?.id ? Number(data.id) : null;
    };

    const actionCapability: Record<string, keyof typeof capabilities> = {
      upsert_warehouse: "manageCatalog", delete_warehouse: "manageCatalog",
      upsert_truck: "manageLogistics", delete_truck: "manageLogistics",
      upsert_product: "manageCatalog", delete_product: "manageCatalog", set_stock: "manageCatalog",
      upsert_restaurant_profile: "manageCatalog", upsert_menu_item: "manageCatalog", delete_menu_item: "manageCatalog",
      update_restaurant_order_status: "manageOrders",
      confirm_restaurant_order_payment: "managePayments",
      update_restaurant_delivery_status: "manageDelivery",
      respond_restaurant_preorder: "manageOrders",
      open_cash_session: "manageCash", close_cash_session: "manageCash",
      record_financial_entry: "manageAccounting",
      create_organization_employee: "manageTeam",
      upsert_restaurant_outlet: "manageTeam",
    };
    const requiredCapability = actionCapability[action];
    if (requiredCapability && !capabilities[requiredCapability]) {
      return jsonResponse({ error: "Votre poste ne permet pas cette action" }, 403, corsHeaders);
    }

    if (action === "get_dashboard") {
      const [orgResult, warehousesResult, productsResult, employeesResult, performanceResult, rolesResult, outletsResult, trucksResult] = await Promise.all([
        supabaseAdmin.from("organizations").select("*").eq("id", organizationId).maybeSingle(),
        supabaseAdmin.from("warehouses").select("*").eq("organization_id", organizationId).order("name"),
        supabaseAdmin.from("organization_products").select("*").eq("organization_id", organizationId).order("name"),
        supabaseAdmin
          .from("profiles")
          .select("id, nom, email, is_active, organization_role_id, restaurant_outlet_id")
          .eq("organization_id", organizationId),
        supabaseAdmin
          .from("employee_performance")
          .select("*")
          .eq("organization_id", organizationId)
          .order("period_month", { ascending: false }),
        supabaseAdmin.from("organization_roles").select("id, name, code").eq("organization_id", organizationId),
        supabaseAdmin.from("restaurant_outlets").select("*").eq("organization_id", organizationId).order("is_primary", { ascending: false }).order("name"),
        supabaseAdmin.from("trucks").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
      ]);

      if (orgResult.error) throw orgResult.error;
      if (warehousesResult.error) throw warehousesResult.error;
      if (productsResult.error) throw productsResult.error;
      if (employeesResult.error) throw employeesResult.error;
      if (performanceResult.error) throw performanceResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (outletsResult.error) throw outletsResult.error;
      if (trucksResult.error) throw trucksResult.error;

      const roleById = new Map((rolesResult.data || []).map((r: any) => [Number(r.id), r]));
      const employees = (employeesResult.data || []).map((emp: any) => ({
        ...emp,
        organization_roles: roleById.get(Number(emp.organization_role_id)) ?? null,
      }));
      const visibleEmployees = capabilities.viewAll || capabilities.manageTeam
        ? employees
        : employees.filter((employee: any) => employee.id === currentUser.id);
      const visiblePerformance = capabilities.viewAll || capabilities.manageTeam
        ? performanceResult.data
        : (performanceResult.data || []).filter((row: any) => row.user_id === currentUser.id);

      const warehouseIds = (warehousesResult.data || []).map((w: any) => w.id);
      let stock: any[] = [];
      if (warehouseIds.length > 0) {
        const { data: stockData, error: stockError } = await supabaseAdmin
          .from("warehouse_stock")
          .select("*")
          .in("warehouse_id", warehouseIds);
        if (stockError) throw stockError;
        stock = stockData || [];
      }

      let restaurant: any = null;
      let menuItems: any[] = [];
      let restaurantOrders: any[] = [];
      if ((orgResult.data as any)?.organization_type === "restaurant") {
        const { data: restaurantData, error: restaurantError } = await supabaseAdmin
          .from("restaurant_partners")
          .select("*")
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (restaurantError) throw restaurantError;
        restaurant = restaurantData;

        if (restaurant) {
          const { data: menuData, error: menuError } = await supabaseAdmin
            .from("restaurant_menu_items")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .order("name");
          if (menuError) throw menuError;
          menuItems = menuData || [];

          const { data: orderData, error: orderError } = await supabaseAdmin
            .from("orders")
           .select("id, created_at, customer_name, telephone, address, total, payment_method, payment_status, payment_confirmed_at, transaction_ref, status, items, delivery_status, tracking_number, queue_number, requires_delivery, restaurant_outlet_id, restaurant_confirmation_status, restaurant_rejection_reason, payment_expires_at")
            .eq("restaurant_id", restaurant.id)
            .order("created_at", { ascending: false })
            .limit(200);
          if (orderError) throw orderError;
          restaurantOrders = orderData || [];
        }
      }

      const [cashResult, financeResult, activityResult] = await Promise.all([
        supabaseAdmin.from("organization_cash_sessions").select("*").eq("organization_id", organizationId).order("opened_at", { ascending: false }).limit(30),
        supabaseAdmin.from("organization_financial_entries").select("*").eq("organization_id", organizationId).order("occurred_at", { ascending: false }).limit(200),
        supabaseAdmin.from("organization_activity_events").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
      ]);
      if (cashResult.error) throw cashResult.error;
      if (financeResult.error) throw financeResult.error;
      if (activityResult.error) throw activityResult.error;

      return jsonResponse(
        {
          organization: orgResult.data,
          roles: rolesResult.data,
          outlets: outletsResult.data,
          warehouses: warehousesResult.data,
          trucks: trucksResult.data,
          products: productsResult.data,
          employees: visibleEmployees,
          stock,
          performance: visiblePerformance,
          restaurant,
          menuItems,
          restaurantOrders: isPdg || !profile.restaurant_outlet_id ? restaurantOrders : restaurantOrders.filter((row: any) => Number(row.restaurant_outlet_id) === Number(profile.restaurant_outlet_id)),
          cashSessions: capabilities.viewAll || capabilities.manageCash ? (isPdg || !profile.restaurant_outlet_id ? cashResult.data : (cashResult.data || []).filter((row: any) => Number(row.restaurant_outlet_id) === Number(profile.restaurant_outlet_id))) : [],
          financialEntries: capabilities.viewAll || capabilities.manageAccounting ? (isPdg || !profile.restaurant_outlet_id ? financeResult.data : (financeResult.data || []).filter((row: any) => Number(row.restaurant_outlet_id) === Number(profile.restaurant_outlet_id))) : [],
          activityEvents: capabilities.viewAll ? (isPdg || !profile.restaurant_outlet_id ? activityResult.data : (activityResult.data || []).filter((row: any) => Number(row.restaurant_outlet_id) === Number(profile.restaurant_outlet_id))) : [],
          isPdg,
          roleCode: normalizedRole,
          capabilities,
        },
        200,
        corsHeaders
      );
    }

    if (action === "get_my_performance") {
      const { data, error } = await supabaseAdmin
        .from("employee_performance")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("user_id", currentUser.id)
        .order("period_month", { ascending: false });

      if (error) throw error;
      return jsonResponse({ performance: data, isPdg }, 200, corsHeaders);
    }

    if (action === "create_organization_employee") {
      const fullName = String(params.full_name ?? "").trim();
      const email = String(params.email ?? "").trim().toLowerCase();
      const telephone = String(params.telephone ?? "").replace(/[\s()-]/g, "");
      const password = String(params.password ?? "");
      const roleId = Number(params.organization_role_id);
      const outletId = Number(params.restaurant_outlet_id);

      if (fullName.length < 2) return jsonResponse({ error: "Le nom complet est obligatoire" }, 400, corsHeaders);
      if (!/^\S+@\S+\.\S+$/.test(email)) return jsonResponse({ error: "L'adresse e-mail est invalide" }, 400, corsHeaders);
      if (!/^\+[1-9]\d{7,14}$/.test(telephone)) return jsonResponse({ error: "Le téléphone doit inclure l'indicatif du pays, par exemple +2250712345678" }, 400, corsHeaders);
      if (password.length < 6) return jsonResponse({ error: "Le mot de passe doit contenir au moins 6 caractères" }, 400, corsHeaders);
      if (!Number.isFinite(roleId)) return jsonResponse({ error: "Le poste est obligatoire" }, 400, corsHeaders);
      if (!Number.isFinite(outletId)) return jsonResponse({ error: "Le point de vente est obligatoire" }, 400, corsHeaders);

      const { data: employeeOutlet, error: employeeOutletError } = await supabaseAdmin.from("restaurant_outlets").select("id").eq("id", outletId).eq("organization_id", organizationId).eq("is_active", true).maybeSingle();
      if (employeeOutletError) throw employeeOutletError;
      if (!employeeOutlet) return jsonResponse({ error: "Point de vente introuvable" }, 400, corsHeaders);

      const { data: employeeRole, error: employeeRoleError } = await supabaseAdmin
        .from("organization_roles")
        .select("id, name, code, organization_id")
        .eq("id", roleId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (employeeRoleError) throw employeeRoleError;
      if (!employeeRole) return jsonResponse({ error: "Ce poste n'appartient pas à votre organisation" }, 400, corsHeaders);

      const protectedRoles = ["ceo", "pdg", "president", "directeur_general", "directeur_generale", "general_management"];
      if (protectedRoles.includes(String(employeeRole.code ?? "").trim().toLowerCase())) {
        return jsonResponse({ error: "Le compte PDG ne peut pas être dupliqué depuis cet espace" }, 403, corsHeaders);
      }

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        phone: telephone,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError) return jsonResponse({ error: createError.message }, 400, corsHeaders);
      if (!created.user) throw new Error("Le compte employé n'a pas été créé");

      const newUserId = created.user.id;
      const { error: employeeProfileError } = await supabaseAdmin.from("profiles").upsert({
        id: newUserId,
        email,
        telephone,
        nom: fullName,
        role: null,
        organization_id: organizationId,
        organization_role_id: roleId,
        restaurant_outlet_id: outletId,
        manager_user_id: currentUser.id,
        country_id: profile.country_id ?? null,
        is_active: true,
      });
      if (employeeProfileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw employeeProfileError;
      }

      const setupResults = await Promise.all([
        supabaseAdmin.from("access_scopes").upsert({
          user_id: newUserId,
          organization_id: organizationId,
          country_id: profile.country_id ?? null,
          scope_type: "organization",
          scope_id: organizationId,
          actif: true,
        }),
        supabaseAdmin.from("user_roles").upsert({ user_id: newUserId, role: "user" }, { onConflict: "user_id" }),
        supabaseAdmin.from("organization_activity_events").insert({
          organization_id: organizationId,
          actor_user_id: currentUser.id,
          event_type: "employee_created",
          restaurant_outlet_id: outletId,
          details: { employee_user_id: newUserId, employee_name: fullName, role_id: roleId, role_code: employeeRole.code },
        }),
      ]);

      const setupError = setupResults.find((result) => result.error)?.error;
      if (setupError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw setupError;
      }

      return jsonResponse({ success: true, employee: { id: newUserId, nom: fullName, email, role: employeeRole } }, 201, corsHeaders);
    }

    if (action === "upsert_restaurant_outlet") {
      const id = params.id ? Number(params.id) : null;
      const name = String(params.name ?? "").trim();
      if (!name) return jsonResponse({ error: "Le nom du point de vente est obligatoire" }, 400, corsHeaders);
      const { data: restaurant, error: restaurantError } = await supabaseAdmin.from("restaurant_partners").select("id").eq("organization_id", organizationId).maybeSingle();
      if (restaurantError) throw restaurantError;
      if (!restaurant) return jsonResponse({ error: "Restaurant partenaire introuvable" }, 404, corsHeaders);
      const payload = { organization_id: organizationId, restaurant_id: restaurant.id, name, neighborhood: params.neighborhood ?? null, address: params.address ?? null, telephone: params.telephone ?? null, is_active: params.is_active !== false, created_by: currentUser.id };
      const result = id
        ? await supabaseAdmin.from("restaurant_outlets").update(payload).eq("id", id).eq("organization_id", organizationId).select().single()
        : await supabaseAdmin.from("restaurant_outlets").insert(payload).select().single();
      if (result.error) throw result.error;
      await supabaseAdmin.from("organization_activity_events").insert({ organization_id: organizationId, restaurant_outlet_id: result.data.id, actor_user_id: currentUser.id, event_type: id ? "outlet_updated" : "outlet_created", entity_type: "restaurant_outlet", entity_id: String(result.data.id) });
      return jsonResponse({ success: true, outlet: result.data });
    }
if (action === "respond_restaurant_preorder") {
  const { order_id, accept, rejection_reason } = params as any;

  if (!order_id || typeof accept !== "boolean") {
    return jsonResponse(
      { error: "Réponse de précommande invalide" },
      400,
      corsHeaders
    );
  }

  const { data, error } = await supabaseUser.rpc(
    "respond_restaurant_preorder",
    {
      p_order_id: order_id,
      p_accept: accept,
      p_rejection_reason: accept
        ? null
        : String(rejection_reason ?? "").trim(),
    }
  );

  if (error) throw error;

  return jsonResponse(
    { success: true, result: data },
    200,
    corsHeaders
  );
}
    if (action === "confirm_restaurant_order_payment") {
      const { order_id, payment_status } = params as any;
      if (!["pending", "confirmed", "rejected"].includes(payment_status)) return jsonResponse({ error: "Statut de paiement invalide" }, 400, corsHeaders);
      const { data: restaurant } = await supabaseAdmin.from("restaurant_partners").select("id").eq("organization_id", organizationId).maybeSingle();
      if (!restaurant) return jsonResponse({ error: "Restaurant introuvable" }, 404, corsHeaders);
      const outletId = await resolveOutletId(params.restaurant_outlet_id);
      const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("id,payment_status").eq("id", order_id).eq("restaurant_id", restaurant.id).eq("restaurant_outlet_id", outletId).maybeSingle();
      if (orderError) throw orderError;
      if (!order) return jsonResponse({ error: "Commande introuvable" }, 404, corsHeaders);
      const { error } = await supabaseAdmin.from("orders").update({ payment_status, payment_confirmed_by: payment_status === "pending" ? null : currentUser.id, payment_confirmed_at: payment_status === "pending" ? null : new Date().toISOString() }).eq("id", order.id);
      if (error) throw error;
      await supabaseAdmin.from("organization_activity_events").insert({ organization_id: organizationId, actor_user_id: currentUser.id, event_type: "payment_status_changed", entity_type: "order", entity_id: order.id, details: { previous_status: order.payment_status, payment_status } });
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "update_restaurant_delivery_status") {
      const { order_id, delivery_status } = params as any;
      const allowed = ["pending", "assigned", "picked_up", "on_the_way", "delivered", "cancelled"];
      if (!allowed.includes(delivery_status)) return jsonResponse({ error: "Statut de livraison invalide" }, 400, corsHeaders);
      const { data: restaurant } = await supabaseAdmin.from("restaurant_partners").select("id").eq("organization_id", organizationId).maybeSingle();
      if (!restaurant) return jsonResponse({ error: "Restaurant introuvable" }, 404, corsHeaders);
      const outletId = await resolveOutletId(params.restaurant_outlet_id);
      const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("id,delivery_status,status").eq("id", order_id).eq("restaurant_id", restaurant.id).eq("restaurant_outlet_id", outletId).maybeSingle();
      if (orderError) throw orderError;
      if (!order) return jsonResponse({ error: "Commande introuvable" }, 404, corsHeaders);
      const update: Record<string, unknown> = { delivery_status, delivery_updated_at: new Date().toISOString() };
      if (delivery_status === "delivered") update.delivery_completed_at = new Date().toISOString();
      if (delivery_status === "cancelled") update.status = "cancelled";
      const { error } = await supabaseAdmin.from("orders").update(update).eq("id", order.id);
      if (error) throw error;
      await supabaseAdmin.from("organization_activity_events").insert({ organization_id: organizationId, actor_user_id: currentUser.id, event_type: "delivery_status_changed", entity_type: "order", entity_id: order.id, details: { previous_status: order.delivery_status, delivery_status } });
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "update_restaurant_order_status") {
      const { order_id, status } = params as any;
      const allowedStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
      if (!allowedStatuses.includes(status)) return jsonResponse({ error: "Statut invalide" }, 400, corsHeaders);
      if (normalizedRole === "cook" && !["preparing", "ready"].includes(status)) {
        return jsonResponse({ error: "Le cuisinier peut uniquement signaler la préparation" }, 403, corsHeaders);
      }
      const { data: restaurant } = await supabaseAdmin.from("restaurant_partners").select("id").eq("organization_id", organizationId).maybeSingle();
      if (!restaurant) return jsonResponse({ error: "Restaurant introuvable" }, 404, corsHeaders);
      const outletId = await resolveOutletId(params.restaurant_outlet_id);
      const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("id,total,payment_method,status,restaurant_outlet_id").eq("id", order_id).eq("restaurant_id", restaurant.id).eq("restaurant_outlet_id", outletId).maybeSingle();
      if (orderError) throw orderError;
      if (!order) return jsonResponse({ error: "Commande introuvable" }, 404, corsHeaders);
      const { error: updateError } = await supabaseAdmin.from("orders").update({ status }).eq("id", order.id);
      if (updateError) throw updateError;
      if (status === "completed" && Number(order.total) > 0) {
        const { data: openCash } = await supabaseAdmin.from("organization_cash_sessions").select("id").eq("organization_id", organizationId).eq("restaurant_outlet_id", outletId).eq("status", "open").maybeSingle();
        const { data: existingIncome, error: existingIncomeError } = await supabaseAdmin.from("organization_financial_entries").select("id").eq("organization_id", organizationId).eq("order_id", order.id).eq("entry_type", "income").maybeSingle();
        if (existingIncomeError) throw existingIncomeError;
        if (!existingIncome) {
          const { error: incomeError } = await supabaseAdmin.from("organization_financial_entries").insert({
            organization_id: organizationId, restaurant_outlet_id: outletId, entry_type: "income", category: "sale", amount: Number(order.total),
            payment_method: order.payment_method ?? null, order_id: order.id, cash_session_id: openCash?.id ?? null,
            recorded_by: currentUser.id, description: "Recette de commande",
          });
          if (incomeError) throw incomeError;
        }
      }
      await supabaseAdmin.from("organization_activity_events").insert({ organization_id: organizationId, actor_user_id: currentUser.id, event_type: "order_status_changed", entity_type: "order", entity_id: order.id, details: { previous_status: order.status, status } });
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "open_cash_session") {
      const { opening_balance, notes } = params as any;
      const outletId = await resolveOutletId(params.restaurant_outlet_id);
      if (!outletId) return jsonResponse({ error: "Point de vente obligatoire" }, 400, corsHeaders);
      const { error } = await supabaseAdmin.from("organization_cash_sessions").insert({ organization_id: organizationId, restaurant_outlet_id: outletId, opened_by: currentUser.id, opening_balance: Math.max(0, Number(opening_balance) || 0), notes: notes ?? null });
      if (error) throw error;
      await supabaseAdmin.from("organization_activity_events").insert({ organization_id: organizationId, actor_user_id: currentUser.id, event_type: "cash_session_opened", entity_type: "cash_session" });
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "close_cash_session") {
      const { session_id, closing_balance, notes } = params as any;
      const outletId = await resolveOutletId(params.restaurant_outlet_id);
      if (!outletId) return jsonResponse({ error: "Point de vente obligatoire" }, 400, corsHeaders);
      const { data: session, error: sessionError } = await supabaseAdmin.from("organization_cash_sessions").select("*").eq("id", session_id).eq("organization_id", organizationId).eq("restaurant_outlet_id", outletId).eq("status", "open").maybeSingle();
      if (sessionError) throw sessionError;
      if (!session) return jsonResponse({ error: "Caisse ouverte introuvable" }, 404, corsHeaders);
      const { data: entries, error: entriesError } = await supabaseAdmin.from("organization_financial_entries").select("entry_type,amount,payment_method").eq("cash_session_id", session.id);
      if (entriesError) throw entriesError;
      const cashMovement = (entries || []).filter((entry: any) => String(entry.payment_method ?? "").toLowerCase() === "cash").reduce((sum: number, entry: any) => sum + (entry.entry_type === "income" ? Number(entry.amount) : -Number(entry.amount)), 0);
      const expected = Number(session.opening_balance) + cashMovement;
      const actual = Number(closing_balance) || 0;
      const { error } = await supabaseAdmin.from("organization_cash_sessions").update({ status: "closed", closed_by: currentUser.id, closed_at: new Date().toISOString(), expected_balance: expected, closing_balance: actual, variance: actual - expected, notes: notes ?? session.notes }).eq("id", session.id);
      if (error) throw error;
      await supabaseAdmin.from("organization_activity_events").insert({ organization_id: organizationId, actor_user_id: currentUser.id, event_type: "cash_session_closed", entity_type: "cash_session", entity_id: String(session.id), details: { expected, actual, variance: actual - expected } });
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "record_financial_entry") {
      const { entry_type, category, amount, payment_method, description, occurred_at } = params as any;
      if (!["income", "expense"].includes(entry_type) || !category || Number(amount) <= 0) return jsonResponse({ error: "Écriture financière invalide" }, 400, corsHeaders);
      const outletId = await resolveOutletId(params.restaurant_outlet_id);
      if (!outletId) return jsonResponse({ error: "Point de vente obligatoire" }, 400, corsHeaders);
      const { data: openCash } = await supabaseAdmin.from("organization_cash_sessions").select("id").eq("organization_id", organizationId).eq("restaurant_outlet_id", outletId).eq("status", "open").maybeSingle();
      const { error } = await supabaseAdmin.from("organization_financial_entries").insert({ organization_id: organizationId, restaurant_outlet_id: outletId, entry_type, category, amount: Number(amount), payment_method: payment_method ?? null, description: description ?? null, occurred_at: occurred_at ?? new Date().toISOString(), cash_session_id: openCash?.id ?? null, recorded_by: currentUser.id });
      if (error) throw error;
      await supabaseAdmin.from("organization_activity_events").insert({ organization_id: organizationId, actor_user_id: currentUser.id, event_type: "financial_entry_recorded", entity_type: "financial_entry", details: { entry_type, category, amount: Number(amount) } });
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "upsert_warehouse") {
      const { id, name, address, latitude, longitude, actif } = params as any;
      if (!name) {
        return jsonResponse({ error: "Le nom du magasin est obligatoire" }, 400, corsHeaders);
      }

      const payload = {
        organization_id: organizationId,
        name,
        address: address ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        actif: actif ?? true,
        updated_at: new Date().toISOString(),
      };

      const { error } = id
        ? await supabaseAdmin.from("warehouses").update(payload).eq("id", id).eq("organization_id", organizationId)
        : await supabaseAdmin.from("warehouses").insert(payload);

      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "delete_warehouse") {
      const { id } = params as any;
      const { error } = await supabaseAdmin
        .from("warehouses")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "upsert_truck") {
      const {
        id, title, vehicle_type, brand, model, year_built,
        registration_number, registration_country, registration_city, condition, availability_status,
        axle_count, wheel_count, fuel_type, transmission_type, engine_power, mileage_km,
        payload_tons, max_weight_kg, length_m, width_m, height_m, loading_volume_m3,
        suspension_type, has_air_conditioning, has_gps, tire_condition, last_service_date, next_inspection_date,
        rental_with_driver, daily_rate, weekly_rate, monthly_rate, km_rate, security_deposit,
        available_from, available_until,
        has_registration_certificate, has_insurance, has_inspection_certificate, has_tax_sticker,
        has_driver_license, has_transport_authorization, has_customs_document,
        image_urls, actif,
      } = params as any;

      if (!title) {
        return jsonResponse({ error: "Le nom/titre de l'annonce est obligatoire" }, 400, corsHeaders);
      }

      const payload = {
        organization_id: organizationId,
        title,
        vehicle_type: vehicle_type ?? null,
        brand: brand ?? null,
        model: model ?? null,
        year_built: year_built ?? null,
        registration_number: registration_number ?? null,
        registration_country: registration_country ?? null,
        registration_city: registration_city ?? null,
        condition: condition ?? null,
        availability_status: availability_status ?? "available",
        axle_count: axle_count ?? null,
        wheel_count: wheel_count ?? null,
        fuel_type: fuel_type ?? null,
        transmission_type: transmission_type ?? null,
        engine_power: engine_power ?? null,
        mileage_km: mileage_km ?? null,
        payload_tons: payload_tons ?? null,
        max_weight_kg: max_weight_kg ?? null,
        length_m: length_m ?? null,
        width_m: width_m ?? null,
        height_m: height_m ?? null,
        loading_volume_m3: loading_volume_m3 ?? null,
        suspension_type: suspension_type ?? null,
        has_air_conditioning: has_air_conditioning ?? false,
        has_gps: has_gps ?? false,
        tire_condition: tire_condition ?? null,
        last_service_date: last_service_date ?? null,
        next_inspection_date: next_inspection_date ?? null,
        rental_with_driver: rental_with_driver ?? null,
        daily_rate: daily_rate ?? null,
        weekly_rate: weekly_rate ?? null,
        monthly_rate: monthly_rate ?? null,
        km_rate: km_rate ?? null,
        security_deposit: security_deposit ?? null,
        available_from: available_from ?? null,
        available_until: available_until ?? null,
        has_registration_certificate: has_registration_certificate ?? false,
        has_insurance: has_insurance ?? false,
        has_inspection_certificate: has_inspection_certificate ?? false,
        has_tax_sticker: has_tax_sticker ?? false,
        has_driver_license: has_driver_license ?? false,
        has_transport_authorization: has_transport_authorization ?? false,
        has_customs_document: has_customs_document ?? false,
        image_urls: Array.isArray(image_urls) ? image_urls.slice(0, 4) : [],
        actif: actif ?? true,
        updated_at: new Date().toISOString(),
      };

      const { error } = id
        ? await supabaseAdmin.from("trucks").update(payload).eq("id", id).eq("organization_id", organizationId)
        : await supabaseAdmin.from("trucks").insert(payload);

      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "delete_truck") {
      const { id } = params as any;
      const { error } = await supabaseAdmin
        .from("trucks")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "upsert_product") {
      const { id, name, description, category, price, unit, image, actif } = params as any;
      if (!name) {
        return jsonResponse({ error: "Le nom du produit est obligatoire" }, 400, corsHeaders);
      }

      const payload = {
        organization_id: organizationId,
        name,
        description: description ?? null,
        category: category ?? null,
        price: Number(price) || 0,
        unit: unit ?? null,
        image: image ?? null,
        actif: actif ?? true,
        updated_at: new Date().toISOString(),
      };

      const { error } = id
        ? await supabaseAdmin.from("organization_products").update(payload).eq("id", id).eq("organization_id", organizationId)
        : await supabaseAdmin.from("organization_products").insert(payload);

      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "delete_product") {
      const { id } = params as any;
      const { error } = await supabaseAdmin
        .from("organization_products")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "set_stock") {
      const { warehouse_id, organization_product_id, quantity } = params as any;

      const { data: warehouse, error: warehouseError } = await supabaseAdmin
        .from("warehouses")
        .select("id")
        .eq("id", warehouse_id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (warehouseError) throw warehouseError;
      if (!warehouse) {
        return jsonResponse({ error: "Magasin introuvable" }, 404, corsHeaders);
      }

      const { data: product, error: productError } = await supabaseAdmin
        .from("organization_products")
        .select("id")
        .eq("id", organization_product_id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (productError) throw productError;
      if (!product) {
        return jsonResponse({ error: "Produit introuvable" }, 404, corsHeaders);
      }

      const { error } = await supabaseAdmin.from("warehouse_stock").upsert(
        {
          warehouse_id,
          organization_product_id,
          quantity: Number(quantity) || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "warehouse_id,organization_product_id" }
      );

      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "upsert_restaurant_profile") {
      const { name, description, location, hours, telephone, image_url, latitude, longitude } = params as any;
      if (!name) {
        return jsonResponse({ error: "Le nom du restaurant est obligatoire" }, 400, corsHeaders);
      }
      const parsedLatitude = Number(latitude);
      const parsedLongitude = Number(longitude);
      if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90 || !Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
        return jsonResponse({ error: "Coordonnées GPS invalides" }, 400, corsHeaders);
      }

      const { data: existing, error: existingError } = await supabaseAdmin
        .from("restaurant_partners")
        .select("id")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (existingError) throw existingError;

      const payload = {
        organization_id: organizationId,
        name,
        description: description ?? null,
        location: location ?? null,
        hours: hours ?? null,
        telephone: telephone ?? null,
        image_url: image_url ?? null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        category: "Restaurant",
        is_active: true,
      };

      const { error } = existing
        ? await supabaseAdmin.from("restaurant_partners").update(payload).eq("id", existing.id)
        : await supabaseAdmin.from("restaurant_partners").insert(payload);

      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "upsert_menu_item") {
      const { id, name, description, price, image_url, is_available } = params as any;
      if (!name) {
        return jsonResponse({ error: "Le nom du plat est obligatoire" }, 400, corsHeaders);
      }

      const { data: restaurant, error: restaurantError } = await supabaseAdmin
        .from("restaurant_partners")
        .select("id, country_id, country")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (restaurantError) throw restaurantError;
      if (!restaurant) {
        return jsonResponse({ error: "Créez d'abord la fiche de votre restaurant" }, 400, corsHeaders);
      }

      const payload = {
        restaurant_id: restaurant.id,
        country_id: restaurant.country_id ?? null,
        country: restaurant.country ?? null,
        name,
        description: description ?? null,
        price: Number(price) || 0,
        image_url: image_url ?? null,
        is_available: is_available ?? true,
      };

      if (id) {
        const { data: existingItem, error: existingItemError } = await supabaseAdmin
          .from("restaurant_menu_items")
          .select("id")
          .eq("id", id)
          .eq("restaurant_id", restaurant.id)
          .maybeSingle();
        if (existingItemError) throw existingItemError;
        if (!existingItem) {
          return jsonResponse({ error: "Plat introuvable" }, 404, corsHeaders);
        }
        const { error } = await supabaseAdmin.from("restaurant_menu_items").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from("restaurant_menu_items").insert(payload);
        if (error) throw error;
      }

      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    if (action === "delete_menu_item") {
      const { id } = params as any;

      const { data: restaurant, error: restaurantError } = await supabaseAdmin
        .from("restaurant_partners")
        .select("id")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (restaurantError) throw restaurantError;
      if (!restaurant) {
        return jsonResponse({ error: "Restaurant introuvable" }, 404, corsHeaders);
      }

      const { error } = await supabaseAdmin
        .from("restaurant_menu_items")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", restaurant.id);
      if (error) throw error;
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    return jsonResponse({ error: "Action invalide" }, 400, corsHeaders);
  } catch (error) {
    console.error("organization-portal error:", error);
    const message = (error as any)?.message || "Une erreur est survenue";
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
});
