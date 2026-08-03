import { useMemo, useState } from "react";
import { PackageOpen, Loader2, Search, RefreshCw, Percent, CalendarClock, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Product, useProducts } from "@/hooks/useProducts";

const AdminLiquidation = () => {
  const { products, isLoading, fetchProducts } = useProducts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newLiquidationPrice, setNewLiquidationPrice] = useState("");
  const [newLiquidationUntil, setNewLiquidationUntil] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16)
  );
  const [editingValues, setEditingValues] = useState<Record<string, { liquidationPrice: string; liquidationUntil: string }>>({});

  const liquidationItems = useMemo(() => {
    return products.filter((product) => product.is_liquidation || product.liquidation_price !== null);
  }, [products]);

  const availableProducts = useMemo(() => {
    return products.filter((product) => !product.is_liquidation);
  }, [products]);

  const filteredItems = useMemo(() => {
    return liquidationItems.filter((product) => {
      const term = searchTerm.toLowerCase();
      return product.name.toLowerCase().includes(term) || (product.category || "").toLowerCase().includes(term);
    });
  }, [liquidationItems, searchTerm]);

  const formatPrice = (value: number) => `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

  const calculateDiscount = (product: Product) => {
    if (!product.liquidation_price || !product.price || product.price <= 0) return 0;
    return Math.round(((product.price - product.liquidation_price) / product.price) * 100);
  };

  const updateEditingValue = (productId: string, field: "liquidationPrice" | "liquidationUntil", value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [productId]: {
        liquidationPrice: prev[productId]?.liquidationPrice ?? "",
        liquidationUntil: prev[productId]?.liquidationUntil ?? "",
        [field]: value,
      },
    }));
  };

  const addProductToLiquidation = async () => {
    if (!selectedProductId) {
      toast({
        title: "Produit requis",
        description: "Choisissez d’abord un produit à mettre en liquidation.",
        variant: "destructive",
      });
      return;
    }

    const targetProduct = products.find((product) => product.id === selectedProductId);
    if (!targetProduct) {
      toast({
        title: "Produit introuvable",
        description: "Ce produit n’existe plus dans la liste actuelle.",
        variant: "destructive",
      });
      return;
    }

    setSavingId(targetProduct.id);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_liquidation: true,
          liquidation_price: Number(newLiquidationPrice) || targetProduct.price,
          liquidation_until: new Date(newLiquidationUntil).toISOString(),
        })
        .eq("id", targetProduct.id);

      if (error) throw error;

      toast({
        title: "Produit ajouté à la liquidation",
        description: `${targetProduct.name} est maintenant visible sur la page liquidation.`,
      });

      setSelectedProductId("");
      setNewLiquidationPrice("");
      setNewLiquidationUntil(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16));
      await fetchProducts();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Impossible d’ajouter ce produit à la liquidation.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const saveLiquidationState = async (product: Product) => {
    const draft = editingValues[product.id] ?? {
      liquidationPrice: product.liquidation_price?.toString() ?? product.price.toString(),
      liquidationUntil: product.liquidation_until ? product.liquidation_until.slice(0, 16) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16),
    };

    setSavingId(product.id);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_liquidation: true,
          liquidation_price: Number(draft.liquidationPrice) || product.price,
          liquidation_until: draft.liquidationUntil ? new Date(draft.liquidationUntil).toISOString() : null,
        })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: "Liquidation mise à jour",
        description: "Le prix et la date d’expiration ont bien été enregistrés.",
      });

      await fetchProducts();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la liquidation.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const toggleLiquidation = async (product: Product) => {
    const nextValue = !product.is_liquidation;
    setSavingId(product.id);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_liquidation: nextValue,
          liquidation_price: nextValue ? product.liquidation_price ?? product.price : null,
          liquidation_until: nextValue ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() : null,
        })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: nextValue ? "Produit mis en liquidation" : "Produit retiré de la liquidation",
        description: "Le statut a bien été mis à jour.",
      });

      await fetchProducts();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la liquidation.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Liquidation</h1>
          <p className="text-muted-foreground">Gérez les produits actuellement en liquidation depuis l’admin.</p>
        </div>

        <Button variant="outline" onClick={fetchProducts} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Produit</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un produit</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Prix liquidation</label>
              <Input
                type="number"
                value={newLiquidationPrice}
                onChange={(e) => setNewLiquidationPrice(e.target.value)}
                placeholder="Ex. 2500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date fin</label>
              <Input
                type="datetime-local"
                value={newLiquidationUntil}
                onChange={(e) => setNewLiquidationUntil(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={addProductToLiquidation} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un produit en liquidation"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                Aucun produit en liquidation pour le moment.
              </div>
            ) : (
              filteredItems.map((product) => {
                const draft = editingValues[product.id] ?? {
                  liquidationPrice: product.liquidation_price?.toString() ?? product.price.toString(),
                  liquidationUntil: product.liquidation_until ? product.liquidation_until.slice(0, 16) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16),
                };

                return (
                  <div key={product.id} className="flex flex-col gap-4 rounded-xl border p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-3 text-primary">
                          <PackageOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge variant="destructive">Liquidation</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{product.category || "Sans catégorie"}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                              <Percent className="w-3 h-3" /> {calculateDiscount(product)}% de remise
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                              <CalendarClock className="w-3 h-3" /> {product.liquidation_until ? new Date(product.liquidation_until).toLocaleDateString("fr-FR") : "Aucune date"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Prix standard : {formatPrice(product.price)}</span>
                        <Button
                          size="sm"
                          variant={product.is_liquidation ? "destructive" : "default"}
                          onClick={() => toggleLiquidation(product)}
                          disabled={savingId === product.id}
                        >
                          {savingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : product.is_liquidation ? "Retirer" : "Mettre en liquidation"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Prix liquidation</label>
                        <Input
                          type="number"
                          value={draft.liquidationPrice}
                          onChange={(e) => updateEditingValue(product.id, "liquidationPrice", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Date fin</label>
                        <Input
                          type="datetime-local"
                          value={draft.liquidationUntil}
                          onChange={(e) => updateEditingValue(product.id, "liquidationUntil", e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={() => saveLiquidationState(product)} className="w-full gap-2">
                          <Save className="w-4 h-4" />
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLiquidation;
