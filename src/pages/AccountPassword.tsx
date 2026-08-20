import { FormEvent, ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PageShell = ({ children }: { children: ReactNode }) => (
  <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">{children}</main>
);

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/compte/changer-mot-de-passe`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Envoi impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Lien envoyé", description: "Consultez votre boîte e-mail pour choisir un nouveau mot de passe." });
  };

  return <PageShell><Card className="w-full max-w-md"><CardHeader><CardTitle>Mot de passe oublié</CardTitle><CardDescription>Entrez l’e-mail associé au compte, même si vous vous connectez habituellement avec le téléphone.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="recovery-email" className="flex items-center gap-2"><Mail className="h-4 w-4" />Adresse e-mail</Label><Input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><Button className="w-full" disabled={submitting}>{submitting ? "Envoi..." : "Envoyer le lien"}</Button><Link to="/auth" className="block text-center text-sm text-primary hover:underline">Retour à la connexion</Link></form></CardContent></Card></PageShell>;
};

export const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast({ title: "Mot de passe trop court", description: "Utilisez au moins 6 caractères.", variant: "destructive" });
      return;
    }
    if (password !== confirmation) {
      toast({ title: "Confirmation incorrecte", description: "Les deux mots de passe doivent être identiques.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Modification impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mot de passe modifié" });
    navigate("/organisation");
  };

  const passwordInput = (id: string, value: string, onChange: (value: string) => void) => <div className="relative"><Input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} minLength={6} className="pr-11" required /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>;

  return <PageShell><Card className="w-full max-w-md"><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Changer le mot de passe</CardTitle><CardDescription>Choisissez un mot de passe d’au moins 6 caractères.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-password">Nouveau mot de passe</Label>{passwordInput("new-password", password, setPassword)}</div><div className="space-y-2"><Label htmlFor="confirm-password">Confirmer le mot de passe</Label>{passwordInput("confirm-password", confirmation, setConfirmation)}</div><Button className="w-full" disabled={submitting}>{submitting ? "Modification..." : "Changer le mot de passe"}</Button></form></CardContent></Card></PageShell>;
};
