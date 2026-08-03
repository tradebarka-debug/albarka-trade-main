import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, MessageCircle, Clock, Globe } from "lucide-react";
import logoAlbarka from "@/assets/logo-albarka.jpeg";

const Footer = () => {
  const countryId = Number(localStorage.getItem("country_id")) || 1;

  const locationText =
    countryId === 2
      ? "Basé en Côte d'Ivoire, nous servons l'Afrique de l'Ouest avec excellence et engagement."
      : "Basé au Burkina Faso, nous servons l'Afrique de l'Ouest avec excellence et engagement.";

  const address =
    countryId === 2
      ? "Abidjan, Côte d'Ivoire"
      : "Ouagadougou, Burkina Faso";

  const phone =
    countryId === 2
      ? "+225 07 14 14 66 30"
      : "+226 02 02 94 94";

  return <footer className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white">
    {/* Top Section with Logo */}
    <div className="border-b border-white/10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={logoAlbarka} alt="Albarka Trade International" className="w-16 h-16 object-contain rounded-lg shadow-lg" />
            <div>
              <h3 className="font-display font-bold text-2xl text-white">
                Albarka Trade <span className="text-primary">International</span>
              </h3>
              <p className="text-primary font-medium text-sm tracking-wider">
                Connecter. Servir. Développer.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-all duration-300 group">
              <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a href={`https://wa.me/${countryId === 2 ? "2250714146630" : "22602029494"}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-500 transition-all duration-300 group">
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Main Footer Content */}
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        {/* About */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg mb-4 text-primary">À Propos</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            {locationText}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-primary">Liens Rapides</h4>
          <ul className="space-y-3">
            {[{
              path: "/",
              label: "Accueil"
            }, {
              path: "/produits-alimentaires",
              label: "Produits Alimentaires"
            }, {
              path: "/services",
              label: "Services"
            }, {
              path: "/formations",
              label: "Formations"
            }, {
              path: "/recrutement",
              label: "Recrutement"
            }, {
              path: "/contact",
              label: "Contact"
            }].map(link => <li key={link.path}>
              <Link to={link.path} className="text-sm text-white/70 hover:text-primary hover:pl-2 transition-all duration-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full"></span>
                {link.label}
              </Link>
            </li>)}
          </ul>
        </div>

        {/* Products */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-primary">Nos Produits</h4>
          <ul className="space-y-3">
            {["Riz Premium", "Sucre Raffiné", "Huiles Alimentaires", "Jus de Fruits", "Autres Produits Vivriers"].map(product => <li key={product} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full"></span>
              <span className="text-sm text-white/70">{product}</span>
            </li>)}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-primary">Contact</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Adresse</p>
                <p className="text-sm text-white/70">
                  {address}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Téléphone</p>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sm text-white/70 hover:text-primary transition-colors">
                  {phone}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Email</p>
                <a href="mailto:contact@albarkatrade.com" className="text-sm text-white/70 hover:text-primary transition-colors">

                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Horaires</p>
                <p className="text-sm text-white/70">Lun - Sam: 8h00 - 23h00</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm font-medium text-white">Commerce International</p>
              <p className="text-xs text-white/60">Import & Export vers l'Afrique et le monde</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-4 py-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <p className="text-sm font-medium text-orange-400">Orange Money</p>
            </div>
            <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <p className="text-sm font-medium text-blue-400">Wave</p>
            </div>
            <div className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
              <p className="text-sm font-medium text-green-400">Moov Money</p>
            </div>
            <div className="px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <p className="text-sm font-medium text-purple-400">cryptomonnaie</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="border-t border-white/10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-sm text-white/50">© 2026 Albarka Trade International. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="text-sm text-white/50 hover:text-primary transition-colors">
              Mentions légales
            </Link>
            <Link to="/contact" className="text-sm text-white/50 hover:text-primary transition-colors">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </div>
  </footer>;
};
export default Footer;