
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
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
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
      .select("id, organization_id, organization_role_id, is_active")
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
    const isPdg = ["ceo", "pdg", "president", "directeur_general", "directeur_generale", "general_management"].includes(
      String(roleCode ?? "").trim().toLowerCase()
    );

    const { action, ...params } = await req.json();

    // Un employé ne voit que son organisation ; le PDG voit tout ce qui suit,
    // un employé n'a droit qu'aux actions de lecture + ses propres stats.
    if (!isPdg && !["get_dashboard", "get_my_performance"].includes(action)) {
      return jsonResponse({ error: "Réservé au PDG de l'organisation" }, 403, corsHeaders);
    }

    if (action === "get_dashboard") {
      const [orgResult, warehousesResult, productsResult, employeesResult, performanceResult, rolesResult] = await Promise.all([
        supabaseAdmin.from("organizations").select("*").eq("id", organizationId).maybeSingle(),
        supabaseAdmin.from("warehouses").select("*").eq("organization_id", organizationId).order("name"),
        supabaseAdmin.from("organization_products").select("*").eq("organization_id", organizationId).order("name"),
        supabaseAdmin
          .from("profiles")
          .select("id, nom, email, is_active, organization_role_id")
          .eq("organization_id", organizationId),
        supabaseAdmin
          .from("employee_performance")
          .select("*")
          .eq("organization_id", organizationId)
          .order("period_month", { ascending: false }),
        supabaseAdmin.from("organization_roles").select("id, name, code").eq("organization_id", organizationId),
      ]);

      if (orgResult.error) throw orgResult.error;
      if (warehousesResult.error) throw warehousesResult.error;
      if (productsResult.error) throw productsResult.error;
      if (employeesResult.error) throw employeesResult.error;
      if (performanceResult.error) throw performanceResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const roleById = new Map((rolesResult.data || []).map((r: any) => [Number(r.id), r]));
      const employees = (employeesResult.data || []).map((emp: any) => ({
        ...emp,
        organization_roles: roleById.get(Number(emp.organization_role_id)) ?? null,
      }));

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
        }
      }

      return jsonResponse(
        {
          organization: orgResult.data,
          warehouses: warehousesResult.data,
          products: productsResult.data,
          employees,
          stock,
          performance: performanceResult.data,
          restaurant,
          menuItems,
          isPdg,
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
      const { name, description, location, hours, telephone, image_url } = params as any;
      if (!name) {
        return jsonResponse({ error: "Le nom du restaurant est obligatoire" }, 400, corsHeaders);
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
