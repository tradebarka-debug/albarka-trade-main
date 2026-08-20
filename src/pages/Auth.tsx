import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading, canAccessAdmin, organizationRoleCode } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Redirect if already logged in : un compte admin interne va vers /admin,
  // un compte rattache a une organisation (PDG/employe partenaire ou
  // Albarka Trade) va vers /organisation, les autres vers l'accueil.
  useEffect(() => {
    if (user && !isLoading) {
      if (canAccessAdmin) navigate('/admin');
      else if (organizationRoleCode) navigate('/organisation');
      else navigate('/');
    }
  }, [user, isLoading, canAccessAdmin, organizationRoleCode, navigate]);

  const validateForm = (email: string, password: string) => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const identifier = loginData.identifier.trim();
    if (!identifier || loginData.password.length < 6) {
      setErrors({ email: !identifier ? "Saisissez votre e-mail ou votre téléphone" : undefined, password: loginData.password.length < 6 ? "Le mot de passe doit contenir au moins 6 caractères" : undefined });
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await signIn(identifier, loginData.password);
    
    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message === "Invalid login credentials" 
          ? "E-mail, téléphone ou mot de passe incorrect"
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
      // La redirection (admin / organisation / accueil) est geree par le
      // useEffect ci-dessus une fois le role charge.
    }
    
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(signupData.email, signupData.password)) {
      return;
    }
    
    if (!signupData.fullName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre nom complet",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    
    if (error) {
      let errorMessage = error.message;
      if (error.message.includes("already registered")) {
        errorMessage = "Un compte avec cet email existe déjà";
      }
      
      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès !",
      });
      navigate('/');
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">Albarka Trade</CardTitle>
          <CardDescription>
            Connectez-vous ou créez un compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Connexion
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Inscription
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    E-mail ou numéro de téléphone
                  </Label>
                  <Input
                    id="login-identifier"
                    type="text"
                    inputMode="email"
                    placeholder="votre@email.com ou +225…"
                    value={loginData.identifier}
                    onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="pr-11" required />
                    <button type="button" onClick={() => setShowLoginPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground" aria-label={showLoginPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  <div className="text-right"><Link to="/compte/mot-de-passe-oublie" className="text-sm text-primary hover:underline">Mot de passe oublié ?</Link></div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full btn-primary-glow"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nom complet
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Votre nom"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="••••••" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className="pr-11" required />
                    <button type="button" onClick={() => setShowSignupPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground" aria-label={showSignupPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full btn-primary-glow"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Inscription..." : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
