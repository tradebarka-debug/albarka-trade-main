import { FormEvent, useState } from "react";
import { Building2, Handshake, MapPin, Truck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const options = [
  { value: "restaurant", label: "Restaurant partenaire", icon: Building2, hint: "Présentez votre restaurant et rejoignez la commande en ligne." },
  { value: "commercial", label: "Partenaire commercial", icon: Handshake, hint: "Prospectez, partagez votre code et suivez vos commissions." },
  { value: "courier", label: "Livreur", icon: Truck, hint: "Recevez des missions et gérez vos livraisons." },
  { value: "representative", label: "Représentant local", icon: UserRound, hint: "Développez le réseau Albarka sur votre territoire." },
];

export default function PartnerApplication() {
  const [type, setType] = useState("restaurant");
  const [form, setForm] = useState({ company_name: "", full_name: "", phone: "", email: "", country: "", city: "", address: "", message: "", referral_code: "" });
  const [sent, setSent] = useState(false);
  const selected = options.find((option) => option.value === type)!;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) { toast.error("Le nom et le téléphone sont obligatoires."); return; }
    const { error } = await (supabase as any).from("partner_applications").insert({ ...form, application_type: type, company_name: form.company_name.trim() || null, email: form.email.trim() || null, country: form.country.trim() || null, city: form.city.trim() || null, address: form.address.trim() || null, message: form.message.trim() || null, referral_code: form.referral_code.trim() || null });
    if (error) { toast.error("La demande n'a pas pu être envoyée."); return; }
    setSent(true);
  };
  if (sent) return <main className="container mx-auto max-w-xl px-4 py-20 text-center"><Handshake className="mx-auto h-14 w-14 text-primary" /><h1 className="mt-5 text-3xl font-bold">Demande envoyée</h1><p className="mt-3 text-muted-foreground">Albarka examinera votre demande et vous contactera. Après validation, votre code partenaire vous sera communiqué.</p></main>;
  return <main className="container mx-auto max-w-3xl px-4 py-12"><div className="text-center"><h1 className="text-3xl font-bold md:text-4xl">Rejoindre le réseau Albarka</h1><p className="mt-3 text-muted-foreground">Choisissez votre rôle puis envoyez votre demande d’intégration.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-2">{options.map((option) => { const Icon = option.icon; return <button key={option.value} type="button" onClick={() => setType(option.value)} className={`rounded-xl border p-4 text-left transition ${type === option.value ? "border-primary bg-primary/10" : "border-border bg-card"}`}><Icon className="h-6 w-6 text-primary" /><p className="mt-2 font-semibold">{option.label}</p><p className="mt-1 text-sm text-muted-foreground">{option.hint}</p></button>; })}</div><form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-6"><h2 className="text-xl font-bold">{selected.label}</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label={type === "restaurant" ? "Nom du restaurant" : "Entreprise / structure"}><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field><Field label="Nom complet *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field><Field label="Téléphone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Pays"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field><Field label="Ville / zone"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field><Field label="Adresse / repère" className="md:col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field><Field label="Code de parrainage (si vous en avez un)" className="md:col-span-2"><Input value={form.referral_code} onChange={(e) => setForm({ ...form, referral_code: e.target.value })} /></Field><Field label="Présentez votre activité" className="md:col-span-2"><Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Services, expérience, zones couvertes, disponibilité..." /></Field></div><Button className="mt-6 w-full">Envoyer ma demande</Button></form></main>;
}
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}</div>; }
