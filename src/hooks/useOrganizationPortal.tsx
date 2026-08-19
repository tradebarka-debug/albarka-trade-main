import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Les erreurs d'edge function n'exposent pas le message reel par defaut.
async function getFunctionErrorMessage(error: any, fallback: string) {
  const response = error?.context;
  if (response && typeof response.json === "function") {
    try {
      const body = await response.clone().json();
      if (body?.error) return body.error as string;
    } catch {
      // corps non-JSON, on ignore
    }
  }
  return error?.message || fallback;
}

export interface Warehouse {
  id: number;
  organization_id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  actif: boolean;
}

export interface OrganizationProduct {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  unit: string | null;
  image: string | null;
  actif: boolean;
}

export interface WarehouseStockRow {
  id: number;
  warehouse_id: number;
  organization_product_id: number;
  quantity: number;
}

export interface OrganizationEmployee {
  id: string;
  nom: string | null;
  email: string | null;
  is_active: boolean;
  organization_role_id: number | null;
  restaurant_outlet_id: number | null;
  organization_roles?: { name: string; code: string } | { name: string; code: string }[] | null;
}

export interface EmployeePerformanceRow {
  id: number;
  user_id: string;
  organization_id: number;
  period_month: string;
  sales_amount: number;
  orders_handled: number;
  partners_recruited: number;
  last_activity_at: string | null;
}

export interface RestaurantProfile {
  id: string;
  organization_id: number;
  name: string;
  description: string | null;
  location: string | null;
  hours: string | null;
  telephone: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean | null;
}

export interface OrganizationRole {
  id: number;
  name: string;
  code: string;
}

export interface RestaurantOutlet {
  id: number; organization_id: number; restaurant_id: string; name: string;
  neighborhood: string | null; address: string | null; telephone: string | null;
  is_primary: boolean; is_active: boolean;
}

export interface RestaurantOrder {
  id: string; created_at: string; customer_name: string | null; telephone: string | null;
  total: number | null; payment_method: string | null; payment_status: string; payment_confirmed_at: string | null; transaction_ref: string | null;
  status: string | null; items: string | null; delivery_status: string; tracking_number: string | null;
  requires_delivery: boolean;
}

export interface CashSession {
  id: number; opened_at: string; closed_at: string | null; opening_balance: number;
  expected_balance: number | null; closing_balance: number | null; variance: number | null;
  status: "open" | "closed"; notes: string | null;
}

export interface FinancialEntry {
  id: number; entry_type: "income" | "expense"; category: string; amount: number;
  payment_method: string | null; description: string | null; occurred_at: string;
}

export interface OrganizationCapabilities {
  viewAll: boolean; manageOrders: boolean; managePayments: boolean; manageDelivery: boolean; manageCash: boolean; manageAccounting: boolean;
  manageTeam: boolean; manageCatalog: boolean;
}

export interface OrganizationDashboardData {
  organization: Record<string, unknown> | null;
  warehouses: Warehouse[];
  products: OrganizationProduct[];
  employees: OrganizationEmployee[];
  roles: OrganizationRole[];
  outlets: RestaurantOutlet[];
  stock: WarehouseStockRow[];
  performance: EmployeePerformanceRow[];
  restaurant: RestaurantProfile | null;
  menuItems: MenuItem[];
  restaurantOrders: RestaurantOrder[];
  cashSessions: CashSession[];
  financialEntries: FinancialEntry[];
  activityEvents: Array<{ id: number; event_type: string; details: Record<string, unknown>; created_at: string }>;
  isPdg: boolean;
  roleCode: string;
  capabilities: OrganizationCapabilities;
}

// Dashboard de l'organisation partenaire (PDG + employés), toutes les
// données passent par l'edge function organization-portal.
export function useOrganizationPortal() {
  const [data, setData] = useState<OrganizationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data: result, error: fnError } = await supabase.functions.invoke("organization-portal", {
      body: { action: "get_dashboard" },
    });

    if (fnError || result?.error) {
      setError(result?.error || (await getFunctionErrorMessage(fnError, "Erreur de chargement")));
      setData(null);
    } else {
      setError(null);
      setData(result as OrganizationDashboardData);
    }

    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refetch(true);
    }, 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refetch(true);
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refetch]);

  const callAction = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    const { data: result, error: fnError } = await supabase.functions.invoke("organization-portal", {
      body: { action, ...params },
    });

    if (fnError || result?.error) {
      throw new Error(result?.error || (await getFunctionErrorMessage(fnError, "Une erreur est survenue")));
    }

    return result;
  }, []);

  return { data, loading, error, refetch, callAction };
}
