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

export interface OrganizationDashboardData {
  organization: Record<string, unknown> | null;
  warehouses: Warehouse[];
  products: OrganizationProduct[];
  employees: OrganizationEmployee[];
  stock: WarehouseStockRow[];
  performance: EmployeePerformanceRow[];
  restaurant: RestaurantProfile | null;
  menuItems: MenuItem[];
  isPdg: boolean;
}

// Dashboard de l'organisation partenaire (PDG + employés), toutes les
// données passent par l'edge function organization-portal.
export function useOrganizationPortal() {
  const [data, setData] = useState<OrganizationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
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

    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
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
