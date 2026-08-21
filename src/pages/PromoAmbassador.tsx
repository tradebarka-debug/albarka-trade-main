import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { Copy, Eye, EyeOff, LogOut, QrCode, Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Ambassador = {
  full_name: string;
  phone: string | null;
  email: string | null;
  promo_code: string;
  total_orders: number;
  total_commission: number;
  available_commission: number;
};

type Commission = { id: string; order_total: number; commission_amount: number; status: string; created_at: string };

const money = (value: number) => `${new Intl.NumberFormat("fr-FR").format(Number(value || 0))} FCFA`;

export default function PromoAmbassador() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [signup, setSignup] = useState({ full_name: "", phone: "", email: "", desired_code: "", password: "" });
  const [login, setLogin] = useState({ identifier: "", password: "" });

  const loadProfile = useCallback(async () => {
    const promoCode = localStorage.getItem("ambassadorPromoCode");
    const sessionToken = localStorage.getItem("ambassadorSessionToken");
    if (!promoCode || !sessionToken) return;
    const { data, error } = await supabase.functions.invoke("representant-auth", {
      body: { action: "ambassador_profile", promoCode, sessionToken },
    });
    if (error || data?.error) {
      localStorage.removeItem("ambassadorPromoCode");
      localStorage.removeItem("ambassadorSessionToken");
      return;
    }
    setAmbassador(data.ambassador);
    setCommissions(data.commissions || []);
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const storeSession = (data: any) => {
    localStorage.setItem("ambassadorPromoCode", data.ambassador.promo_code);
    localStorage.setItem("ambassadorSessionToken", data.sessionToken);
    setAmbassador(data.ambassador);
    setCommissions([]);
  };

  const submitSignup = async (event: FormEvent) => {
    event.preventDefault();
    if (!signup.phone.trim() && !signup.email.trim()) return toast.error("Indiquez un téléphone ou un email.");
    if (!/^\d{4}$/.test(signup.password)) return toast.error("Le mot de passe doit contenir exactement 4 chiffres.");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("representant-auth", { body: { action: "ambassador_signup", ...signup } });
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error || "Inscription impossible.");
    storeSession(data);
    toast.success("Votre code promo est prêt !");
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("representant-auth", { body: { action: "ambassador_login", ...login } });
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error || "Connexion impossible.");
    storeSession(data);
    void loadProfile();
  };

  const logout = () => {
    localStorage.removeItem("ambassadorPromoCode");
    localStorage.removeItem("ambassadorSessionToken");
    setAmbassador(null);
    setCommissions([]);
  };

  if (ambassador) {
    const referralLink = `${window.location.origin}/offres?promo=${encodeURIComponent(ambassador.promo_code)}`;
    const copy = async (value: string, message: string) => {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    };
    return <main className="min-h-[80vh] bg-gradient-to-b from-primary/10 to-background px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-primary">Espace ambassadeur</p><h1 className="text-3xl font-bold">Bonjour {ambassador.full_name}</h1></div><Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Déconnexion</Button></div>
        <section className="grid gap-4 sm:grid-cols-3"><Stat label="Commandes validées" value={String(ambassador.total_orders || 0)} /><Stat label="Commission totale" value={money(ambassador.total_commission)} /><Stat label="Solde disponible" value={money(ambassador.available_commission)} /></section>
        <section className="grid gap-6 rounded-2xl border bg-card p-5 md:grid-cols-[220px_1fr] md:p-7">
          <div className="mx-auto rounded-xl bg-white p-3"><QRCode value={referralLink} size={190} /></div>
          <div className="space-y-4"><div><p className="text-sm text-muted-foreground">Votre code promo</p><p className="text-3xl font-extrabold text-primary">{ambassador.promo_code}</p></div><div><p className="text-sm text-muted-foreground">Votre lien Albarka Trade cliquable</p><a href={referralLink} target="_blank" rel="noreferrer" className="mt-1 block break-all font-semibold text-primary underline">{referralLink}</a></div><p className="text-sm text-muted-foreground">Partagez ce lien ou ce QR code. Votre client choisira ensuite la boutique ou un restaurant partenaire.</p><div className="flex flex-col gap-3 sm:flex-row"><Button onClick={() => void copy(referralLink, "Lien copié")}><Share2 className="mr-2 h-4 w-4" />Copier mon lien</Button><Button variant="outline" onClick={() => void copy(ambassador.promo_code, "Code copié")}><Copy className="mr-2 h-4 w-4" />Copier le code</Button></div></div>
        </section>
        <section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-bold">Mes dernières commissions</h2><div className="mt-4 space-y-3">{commissions.map((commission) => <div key={commission.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><div><p className="font-medium">Commande de {money(commission.order_total)}</p><p className="text-xs text-muted-foreground">{new Date(commission.created_at).toLocaleDateString("fr-FR")}</p></div><strong className="text-primary">+ {money(commission.commission_amount)}</strong></div>)}{commissions.length === 0 && <p className="py-5 text-center text-muted-foreground">Aucune commission pour le moment.</p>}</div></section>
      </div>
    </main>;
  }

  return <main className="min-h-[80vh] bg-gradient-to-b from-primary/10 to-background px-4 py-12"><div className="mx-auto max-w-lg rounded-2xl border bg-card p-6 shadow-lg md:p-8"><div className="text-center"><QrCode className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-3 text-3xl font-bold">Obtenir mon code promo</h1><p className="mt-2 text-sm text-muted-foreground">Inscription gratuite et rapide. Partagez ensuite votre lien ou votre QR code.</p></div><div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1"><button className={`rounded-lg px-3 py-2 font-medium ${mode === "signup" ? "bg-background shadow" : ""}`} onClick={() => setMode("signup")}>Créer mon code</button><button className={`rounded-lg px-3 py-2 font-medium ${mode === "login" ? "bg-background shadow" : ""}`} onClick={() => setMode("login")}>Me connecter</button></div>
    {mode === "signup" ? <form className="mt-6 space-y-4" onSubmit={submitSignup}><Field label="Nom complet"><Input required value={signup.full_name} onChange={(e) => setSignup({ ...signup, full_name: e.target.value })} /></Field><Field label="Téléphone"><Input inputMode="tel" value={signup.phone} onChange={(e) => setSignup({ ...signup, phone: e.target.value })} placeholder="Ex. +226…" /></Field><div className="text-center text-xs text-muted-foreground">ou</div><Field label="Email"><Input type="email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} /></Field><Field label="Choisissez le nom de votre code promo"><Input required minLength={4} maxLength={20} value={signup.desired_code} onChange={(e) => setSignup({ ...signup, desired_code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "-").slice(0, 20) })} placeholder="Ex. AMADOU2026" /><p className="mt-1 text-xs text-muted-foreground">4 à 20 caractères : lettres, chiffres et tirets.</p></Field><PasswordField value={signup.password} show={showPassword} setShow={setShowPassword} onChange={(password) => setSignup({ ...signup, password })} /><Button disabled={loading} className="min-h-12 w-full"><UserPlus className="mr-2 h-4 w-4" />{loading ? "Création…" : "Créer gratuitement mon code"}</Button></form> : <form className="mt-6 space-y-4" onSubmit={submitLogin}><Field label="Téléphone ou email"><Input required value={login.identifier} onChange={(e) => setLogin({ ...login, identifier: e.target.value })} /></Field><PasswordField value={login.password} show={showPassword} setShow={setShowPassword} onChange={(password) => setLogin({ ...login, password })} /><Button disabled={loading} className="min-h-12 w-full">{loading ? "Connexion…" : "Me connecter"}</Button><Link to="/contact" className="block text-center text-sm text-primary underline">Mot de passe oublié ?</Link></form>}
  </div></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function PasswordField({ value, show, setShow, onChange }: { value: string; show: boolean; setShow: (show: boolean) => void; onChange: (value: string) => void }) { return <Field label="Mot de passe (4 chiffres)"><div className="relative"><Input required type={show ? "text" : "password"} inputMode="numeric" maxLength={4} pattern="\d{4}" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))} className="pr-12" /><button type="button" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></Field>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
