import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, Phone, Search, LogIn, LogOut, User, Settings, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logoAlbarka from "@/assets/logo-albarka.jpeg";
import CountryDropdown from "@/components/CountryDropdown";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const {
    totalItems
  } = useCart();
  const {
    user,
    isAdmin,
    isTransportPDG,
    canAccessAdmin,
    organizationRoleName,
    signOut
  } = useAuth();
  const navLinks = [{
    path: "/",
    label: "Accueil"
  }, {
    path: "/boutique",
    label: "Acheter"
  }, {
    path: "/livraisons",
    label: "Livraison"
  }, {
    path: "/suivi-livraison",
    label: "Mon suivi"
  }, {
    path: "/services",
    label: "Services"
  }, {
    path: "/suppliers",
    label: "Partenaires"
  }, {
    path: "/formations",
    label: "Formations"
  }, {
    path: "/recrutement",
    label: "Recrutement"
  }];
  const isActive = (path: string) => location.pathname === path;
  const handleSignOut = async () => {
    await signOut();
  };
  return <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16 md:h-20 border-sidebar-ring">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img src={logoAlbarka} alt="Albarka Trade International" className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-lg md:text-xl text-foreground leading-tight group-hover:text-primary transition-colors">
              Albarka Trade
            </h1>
            <p className="text-xs text-primary font-medium tracking-wider">International</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-xs">
          {navLinks.map(link => <Link key={link.path} to={link.path} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            {link.label}
          </Link>)}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:block">
            <CountryDropdown />
          </div>
          <Link to="/#recherche" className="hidden md:block"><Button variant="ghost" size="icon" aria-label="Rechercher"><Search className="w-5 h-5" /></Button></Link>
          <Link to="/contact" className="hidden md:block"><Button variant="ghost" size="icon" aria-label="Contact"><Phone className="w-5 h-5" /></Button></Link>

          <Link to="/panier" className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>}
            </Button>
          </Link>

          {/* Auth Button */}
          {user ? <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="w-5 h-5" />
                {(canAccessAdmin || isTransportPDG) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-medium">
                {user.email}
              </div>
              {isAdmin && (
  <div className="px-2 py-1 text-xs text-secondary font-medium">
    Admin
  </div>
)}

{isTransportPDG && !isAdmin && (
  <div className="px-2 py-1 text-xs text-secondary font-medium">
    PDG / Direction transport
  </div>
)}
              {organizationRoleName && (
                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                  {organizationRoleName}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/espace-utilisateur" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Mon espace utilisateur
                </Link>
              </DropdownMenuItem>
              {canAccessAdmin && <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Espace administratif
                </Link>
              </DropdownMenuItem>}
              <DropdownMenuItem asChild><Link to="/compte/changer-mot-de-passe" className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Changer le mot de passe</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> : <Link to="/auth">
            <Button variant="ghost" size="icon">
              <LogIn className="w-5 h-5" />
            </Button>
          </Link>}

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && <nav className="lg:hidden py-4 border-t border-border animate-fade-in">
        <div className="flex flex-col gap-2">
          <div className="px-4 py-2">
            <CountryDropdown />
          </div>
          {navLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive(link.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            {link.label}
          </Link>)}

          {/* Mobile Auth Links */}
          {user ? <>
            <Link to="/espace-utilisateur" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-base text-primary font-medium hover:bg-muted rounded-lg">
              <User className="w-5 h-5" />
              Mon espace utilisateur
            </Link>
            {canAccessAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-base text-secondary font-medium hover:bg-muted rounded-lg">
              <Settings className="w-5 h-5" />
              Espace administratif
            </Link>}
            <Link to="/compte/changer-mot-de-passe" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-primary hover:bg-muted"><KeyRound className="h-5 w-5" />Changer le mot de passe</Link>
            <button onClick={() => {
              handleSignOut();
              setIsMenuOpen(false);
            }} className="flex items-center gap-2 px-4 py-3 text-base text-destructive hover:bg-muted rounded-lg">
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </> : <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-base text-primary font-medium hover:bg-muted rounded-lg">
            <LogIn className="w-5 h-5" />
            Connexion
          </Link>}

          <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-base text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-5 h-5" />
            <span>Contact</span>
          </Link>
        </div>
      </nav>}
    </div>
  </header>;
};
export default Header;
