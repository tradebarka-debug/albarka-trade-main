import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RepresentantData {
  id: string;
  code: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  pays: string | null;
  ville: string | null;
  [key: string]: unknown;
}

// Espace représentant sécurisé : les données passent par l'edge function
// representant-auth (voir supabase/functions/representant-auth) au lieu
// d'interroger directement la table representants depuis le navigateur.
export function useRepresentant() {
  const [representant, setRepresentant] = useState<RepresentantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const code = localStorage.getItem("representantCode");
    const sessionToken = localStorage.getItem("representantSessionToken");

    if (!code || !sessionToken) {
      setLoading(false);
      setRepresentant(null);
      return;
    }

    setLoading(true);

    const { data, error: fnError } = await supabase.functions.invoke("representant-auth", {
      body: { action: "get_profile", code, sessionToken },
    });

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || "Erreur de chargement");
      setRepresentant(null);
    } else {
      setError(null);
      setRepresentant((data?.representant as RepresentantData) ?? null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { representant, loading, error, refetch };
}
