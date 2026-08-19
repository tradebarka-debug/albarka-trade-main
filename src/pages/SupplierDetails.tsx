import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, ExternalLink, Globe, Mail, MapPin, MessageCircle, Package, Phone, Send } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const partnerLabels: Record<string, string> = { partner: "Partenaire", verified: "Partenaire vérifié", premium: "Partenaire Premium" };

const SupplierDetails = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quote, setQuote] = useState({ name: "", phone: "", quantity: 1, message: "" });

  useEffect(() => {
    const load = async () => {
      const [{ data: supplierData }, { data: productData }] = await Promise.all([
        (supabase.from("suppliers") as any).select("*").eq("id", id).eq("status", "active").single(),
        (supabase.from("supplier_products") as any).select("*").eq("supplier_id", id).eq("country_id", Number(localStorage.getItem("country_id")) || 1).eq("status", "active").order("created_at", { ascending: false }),
      ]);
      setSupplier(supplierData);
      setProducts((productData || []).filter((product: any) => product.in_stock));
    };
    void load();
  }, [id]);

  const sendQuote = async () => {
    if (!selectedProduct || !quote.name.trim() || !quote.phone.trim()) { toast.error("Indiquez votre nom et votre téléphone."); return; }
    const { error } = await (supabase as any).from("quote_requests").insert({ supplier_product_id: selectedProduct.id, supplier_id: supplier.id, customer_name: quote.name.trim(), telephone: quote.phone.trim(), quantity: Number(quote.quantity) || 1, message: quote.message.trim() });
    if (error) { toast.error("La demande de devis n'a pas pu être envoyée."); return; }
    toast.success("Demande de devis envoyée."); setSelectedProduct(null); setQuote({ name: "", phone: "", quantity: 1, message: "" });
  };

  if (supplier === null) return <main className="container mx-auto px-4 py-12"><BackButton /><p className="mt-8 text-muted-foreground">Chargement de la vitrine…</p></main>;
  if (!supplier) return <main className="container mx-auto px-4 py-12"><BackButton /><p className="mt-8">Ce fournisseur n'est pas disponible.</p></main>;
  const whatsapp = (supplier.whatsapp || supplier.telephone || "").replace(/\D/g, "");
  const categories = (supplier.categories || supplier.category || "").split(",").map((value: string) => value.trim()).filter(Boolean);

  return <main className="min-h-screen pb-14"><section className="border-b border-border bg-gradient-to-br from-primary/15 via-background to-secondary/10"><div className="container mx-auto px-4 py-8"><BackButton /><div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-card shadow-sm">{supplier.logo ? <img src={supplier.logo} alt={`Logo ${supplier.company_name}`} className="h-full w-full object-contain" /> : <Package className="h-10 w-10 text-muted-foreground" />}</div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold md:text-4xl">{supplier.company_name}</h1>{supplier.certified && <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-700"><BadgeCheck className="h-4 w-4" />Certifié</span>}<span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{partnerLabels[supplier.partner_status] || "Partenaire"}</span></div><p className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{[supplier.city, supplier.country].filter(Boolean).join(", ") || "Localisation à confirmer"}{supplier.location_details ? ` — ${supplier.location_details}` : ""}</p><p className="mt-4 max-w-3xl text-muted-foreground">{supplier.description || "Découvrez le catalogue et les offres de ce fournisseur partenaire."}</p></div></div></div></section>
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]"><div className="space-y-10"><section><h2 className="text-2xl font-bold">Catalogue produits</h2><p className="mt-1 text-muted-foreground">{products.length} produit(s) disponible(s) auprès de ce fournisseur.</p>{supplier.catalog_url && <a href={supplier.catalog_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-primary font-medium"><ExternalLink className="h-4 w-4" />Ouvrir le catalogue complet</a>}<div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-xl border border-border bg-card"><div className="h-44 bg-muted">{product.image_url ? <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-8 w-8" /></div>}</div><div className="p-4"><p className="text-xs font-medium text-primary">{product.category || "Produit fournisseur"}</p><h3 className="mt-1 font-semibold">{product.product_name}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description || "Description à venir."}</p><div className="mt-4 flex items-end justify-between gap-2"><div><p className="font-bold text-primary">{product.price || "Sur demande"}{product.price && " FCFA"}</p><p className="text-xs text-muted-foreground">Min. {product.minimum_order || "à convenir"}</p></div><Button size="sm" onClick={() => setSelectedProduct(product)}>Demander un devis</Button></div></div></article>)}</div>{products.length === 0 && <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Le catalogue est en cours de mise à jour.</div>}</section>
      {supplier.commercial_terms && <section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Conditions commerciales</h2><p className="mt-3 whitespace-pre-line text-muted-foreground">{supplier.commercial_terms}</p></section>}</div>
      <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-6"><h2 className="text-xl font-bold">Coordonnées</h2><div className="mt-5 space-y-4 text-sm">{supplier.telephone && <a href={`tel:${supplier.telephone}`} className="flex items-center gap-3 hover:text-primary"><Phone className="h-4 w-4 text-primary" />{supplier.telephone}</a>}{supplier.whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-primary"><MessageCircle className="h-4 w-4 text-primary" />WhatsApp</a>}{supplier.email && <a href={`mailto:${supplier.email}`} className="flex items-center gap-3 hover:text-primary"><Mail className="h-4 w-4 text-primary" />{supplier.email}</a>}{supplier.website && <a href={supplier.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-primary"><Globe className="h-4 w-4 text-primary" />Site web</a>}</div>{categories.length > 0 && <><h3 className="mt-7 text-sm font-semibold">Catégories</h3><div className="mt-3 flex flex-wrap gap-2">{categories.map((category: string) => <span key={category} className="rounded-full bg-muted px-3 py-1 text-xs">{category}</span>)}</div></>}<Button className="mt-7 w-full gap-2" onClick={() => products[0] && setSelectedProduct(products[0])}><Send className="h-4 w-4" />Demander un devis</Button></aside>
    </div>
    {selectedProduct && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"><h2 className="text-xl font-bold">Demande de devis</h2><p className="mt-1 text-sm text-muted-foreground">{selectedProduct.product_name}</p><div className="mt-5 space-y-3"><Input value={quote.name} onChange={(e) => setQuote({ ...quote, name: e.target.value })} placeholder="Votre nom *" /><Input value={quote.phone} onChange={(e) => setQuote({ ...quote, phone: e.target.value })} placeholder="Téléphone *" /><Input type="number" min="1" value={quote.quantity} onChange={(e) => setQuote({ ...quote, quantity: Number(e.target.value) })} placeholder="Quantité" /><Textarea value={quote.message} onChange={(e) => setQuote({ ...quote, message: e.target.value })} placeholder="Votre besoin ou message" /></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setSelectedProduct(null)}>Annuler</Button><Button onClick={() => void sendQuote()}>Envoyer</Button></div></div></div>}
  </main>;
};

export default SupplierDetails;
