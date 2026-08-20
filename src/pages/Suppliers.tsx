import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import BackButton from "@/components/BackButton";

type Supplier = { id: number; company_name: string | null; category: string | null; country: string | null; description: string | null; logo: string | null; certified: boolean };
type Product = { id: number; supplier_id: string | null };
const suppliersTable = supabase.from("suppliers") as any;

const flags: Record<string, string> = {
  "Burkina Faso": "🇧🇫", "Thaïlande": "🇹🇭", Chine: "🇨🇳", "Côte d'Ivoire": "🇨🇮",
  Mali: "🇲🇱", Niger: "🇳🇪", Togo: "🇹🇬", Bénin: "🇧🇯", Ghana: "🇬🇭",
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      const countryId = Number(localStorage.getItem("country_id")) || 1;
      const [{ data: suppliersData, error: suppliersError }, { data: productsData, error: productsError }] = await Promise.all([
        suppliersTable.select("id, company_name, category, country, description, logo, certified, scope, country_id").eq("status", "active").or(`country_id.eq.${countryId},scope.eq.international`),
        (supabase.from("supplier_products") as any).select("id, supplier_id").eq("country_id", countryId),
      ]);

      if (suppliersError) console.error("Impossible de charger les fournisseurs", suppliersError);
      if (productsError) console.error("Impossible de charger les produits", productsError);
      setSuppliers(suppliersData ?? []);
      setProducts(productsData ?? []);
      setLoading(false);
    };
    void loadSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => selectedCategory === "Tous" ? suppliers : suppliers.filter((supplier) => supplier.category === selectedCategory), [selectedCategory, suppliers]);

  return (
    <div className="container mx-auto overflow-x-hidden px-4 py-10">
      <BackButton />
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white md:text-4xl">Réseau de partenaires</h1>
        <p className="mt-2 text-gray-400">Produits alimentaires, boissons, restauration, services et fournisseurs partenaires</p>
      </div>
      <div className="mb-6 flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-3 rounded-xl bg-red-500 p-4">
          <button onClick={() => setSelectedCategory("Tous")} className={selectedCategory === "Tous" ? "rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black" : "rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"}>Tous</button>
          <button onClick={() => setSelectedCategory("Fournisseur")} className={selectedCategory === "Fournisseur" ? "rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black" : "rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"}>Fournisseurs</button>
          <button onClick={() => navigate("/factories")} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700">Usines partenaires</button>
          <button onClick={() => navigate("/liquidation")} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700">Liquidation</button>
          <button onClick={() => navigate("/fast-food")} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700">Fast Food</button>
          <button onClick={() => navigate("/voyages")} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700">Compagnie de voyages</button>
          <button onClick={() => navigate("/livraisons")} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700">Livreurs</button>
        </div>
      </div>
      {loading ? <p className="text-center text-gray-400">Chargement des fournisseurs…</p> : filteredSuppliers.length === 0 ? <p className="text-center text-gray-400">Aucun fournisseur disponible pour le moment.</p> : (
        <div className="grid grid-cols-1 gap-6 px-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map((supplier) => {
            const productCount = products.filter((product) => String(product.supplier_id) === String(supplier.id)).length;
            return <article key={supplier.id} onClick={() => navigate(`/suppliers/${supplier.id}`)} className="cursor-pointer overflow-hidden rounded-2xl bg-[#1f1f1f] shadow-lg transition hover:scale-105">
              {supplier.logo ? <div className="flex h-44 w-full items-center justify-center overflow-hidden bg-white p-5 sm:h-48"><img src={supplier.logo} alt={supplier.company_name ?? "Logo fournisseur"} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" /></div> : <div className="flex h-44 items-center justify-center bg-gray-800 text-gray-400 sm:h-48">Aucun logo</div>}
              <div className="p-4"><h2 className="text-2xl font-bold text-white">{supplier.company_name}</h2>{supplier.certified && <span className="mt-2 inline-flex rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-semibold text-yellow-400">✓ Fournisseur certifié</span>}<p className="mt-1 text-yellow-400">{flags[supplier.country ?? ""] ?? "🌍"} {supplier.country}</p><p className="mt-2 text-gray-400">{supplier.category}</p><p className="mt-3 line-clamp-2 text-gray-300">{supplier.description}</p><div className="mt-4 flex items-center justify-between"><span className="font-semibold text-yellow-400">{productCount} produits</span><span className="rounded-lg bg-yellow-500 px-4 py-2 text-black">Voir</span></div></div>
            </article>;
          })}
        </div>
      )}
    </div>
  );
};

export default Suppliers;
