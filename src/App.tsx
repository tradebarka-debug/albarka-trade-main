import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import Index from "./pages/Index";
import Boutique from "./pages/Boutique";
import AdminOrders from "@/pages/AdminOrders";
import AdminSuppliers from "./pages/admin/AdminSuppliers";
import AdminFactories from "./pages/admin/AdminFactories";
import AdminFactoryProducts from "./pages/admin/AdminFactoryProducts";
import AdminSupplierProducts from "./pages/admin/AdminSupplierProducts";
import AdminHomeSlides from "./pages/admin/AdminHomeSlides";
import AdminPartnersDirectory from "./pages/admin/AdminPartnersDirectory";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import RestaurantMenus from "./pages/admin/RestaurantMenus";
import Panier from "./pages/Panier";
import Paiement from "./pages/Paiement";
import DeliveryTracking from "./pages/DeliveryTracking";
import PartnerApplication from "./pages/PartnerApplication";
import Services from "./pages/Services";
import Voyages from "./pages/Voyages";
import Recrutement from "./pages/Recrutement";
import AdminCandidature from "./pages/admin/AdminCandidature";
import Contact from "./pages/Contact";
import Suivi from "./pages/admin/Suivi";
import Formations from "./pages/Formations";
import FormationVente from "./pages/FormationVente";
import FastFood from "./pages/FastFood";
import Restaurants from "./pages/Restaurants";
import RestaurantPartners from "./pages/RestaurantPartners";
import Liquidation from "./pages/Liquidation";
import Livraisons from "./pages/Livraisons";
import Auth from "./pages/Auth";
import { ChangePassword, ForgotPassword } from "./pages/AccountPassword";
import Suppliers from "./pages/Suppliers";
import SupplierDetails from "./pages/SupplierDetails";
import Factories from "./pages/Factories";
import FactoryDetails from "./pages/FactoryDetails";
import NotFound from "./pages/NotFound";
import RestaurantPage from "./pages/RestaurantPage";
import CountryDetector from "./components/CountryDetector";
import CountrySelector from "./components/CountrySelector";
import ScrollToTop from "./components/ScrollToTop";
import Representant from "./pages/Representant";
import RepresentantHome from "./pages/RepresentantHome";
import ConnexionRepresentant from "./pages/ConnexionRepresentant";
import DashboardRepresentant from "./pages/DashboardRepresentant";
import ProfilRepresentant from "./pages/ProfilRepresentant";
import RepresentantForm from "./components/representant/RepresentantForm";
import PackRepresentant from "@/pages/PackRepresentant";
import CommissionsRepresentant from "@/pages/CommissionsRepresentant";
import PerformancesRepresentant from "@/pages/PerformancesRepresentant";
import FilleulsRepresentant from "@/pages/FilleulsRepresentant";
import LienParrainageRepresentant from "@/pages/LienParrainageRepresentant";
import QRCodeRepresentant from "@/pages/QRCodeRepresentant";
import AcheterPackRepresentant from "@/pages/AcheterPackRepresentant";
import AssistanceRepresentant from "@/pages/AssistanceRepresentant";
import FAQRepresentant from "@/pages/FAQRepresentant";
import MotDePasseOublieRepresentant from "./pages/MotDePasseOublieRepresentant";
import VerificationOtpRepresentant from "./pages/VerificationOtpRepresentant";
import NouveauPinRepresentant from "./pages/NouveauPinRepresentant";
import BookingVerification from "@/pages/BookingVerification";
import UserSpace from "@/pages/UserSpace";
import GlobalBackButton from "@/components/GlobalBackButton";
import ReferralLanding from "@/pages/ReferralLanding";

// Admin pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminHomeQualityProducts from "./pages/admin/AdminHomeQualityProducts";
import AdminFormations from "./pages/admin/AdminFormations";
import AdminServices from "./pages/admin/AdminServices";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminVoyages from "./pages/admin/AdminVoyages";
import AdminFastFood from "./pages/admin/AdminFastFood";
import AdminLiquidation from "./pages/admin/AdminLiquidation";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminServiceRequests from "./pages/admin/AdminServiceRequests";
import AdminPartnerApplications from "./pages/admin/AdminPartnerApplications";
import OrganisationDashboard from "./pages/organisation/OrganisationDashboard";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CountryDetector />
      <CountrySelector />
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <GlobalBackButton />
            <Routes>
              {/* Admin routes - without Header/Footer */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="produits" element={<AdminProducts />} />
                <Route path="produits-qualite" element={<AdminHomeQualityProducts />} />
                <Route path="fast-food" element={<AdminFastFood />} />
                <Route path="restaurants" element={<AdminRestaurants />} />
                <Route path="menus" element={<RestaurantMenus />} />
                <Route path="formations" element={<AdminFormations />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="emplois" element={<AdminJobs />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="candidature" element={<AdminCandidature />} />
                <Route path="service-requests" element={<AdminServiceRequests />} />
                <Route path="paiements" element={<AdminPayments />} />
                <Route path="voyages" element={<AdminVoyages />} />
                <Route path="liquidation" element={<AdminLiquidation />} />
                <Route path="utilisateurs" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="admin-partners" element={<AdminSuppliers />} />
                <Route path="fournisseurs" element={<AdminSuppliers />} />
                <Route path="fournisseurs/produits" element={<AdminSupplierProducts />} />
                <Route path="usines" element={<AdminFactories />} />
                <Route path="usines/produits" element={<AdminFactoryProducts />} />
                <Route path="slides-accueil" element={<AdminHomeSlides />} />
                <Route path="repertoire-partenaires" element={<AdminPartnersDirectory />} />
                <Route path="demandes-partenaires" element={<AdminPartnerApplications />} />
              </Route>

              <Route path="/organisation" element={<OrganisationDashboard />} />

              <Route
                path="/dashboard-representant"
                element={<DashboardRepresentant />}
              />

              <Route
                path="/profil-representant"
                element={<ProfilRepresentant />}
              />
              <Route
                path="/mot-de-passe-oublie"
                element={<MotDePasseOublieRepresentant />}
              />

              <Route
                path="/pack-representant"
                element={<PackRepresentant />}
              />

              <Route
                path="/commissions-representant"
                element={<CommissionsRepresentant />}
              />

              <Route
                path="/performances-representant"
                element={<PerformancesRepresentant />}
              />

              <Route
                path="/filleuls-representant"
                element={<FilleulsRepresentant />}
              />

              <Route
                path="/lien-parrainage"
                element={<LienParrainageRepresentant />}
              />

              <Route
                path="/qrcode-representant"
                element={<QRCodeRepresentant />}
              />

              <Route
                path="/acheter-pack"
                element={<AcheterPackRepresentant />}
              />

              <Route
                path="/assistance-representant"
                element={<AssistanceRepresentant />}
              />
              <Route
                path="/verification-otp"
                element={<VerificationOtpRepresentant />}
              />
              <Route
                path="/representant/nouveau-pin"
                element={<NouveauPinRepresentant />}
              />
              <Route
                path="/booking/:bookingNumber"
                element={<BookingVerification />}
              />
              <Route
                path="/faq-representant"
                element={<FAQRepresentant />}
              />
              {/* Public routes - with Header/Footer */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col min-h-screen bg-background text-foreground pb-16 md:pb-0">
                    <Header />
                    <div className="flex-1 bg-background">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/boutique" element={<Boutique />} />
                        <Route path="/offres" element={<ReferralLanding />} />
                        <Route path="/panier" element={<Panier />} />
                        <Route path="/paiement" element={<Paiement />} />
                        <Route path="/suivi-livraison" element={<DeliveryTracking />} />
                        <Route path="/devenir-partenaire" element={<PartnerApplication />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/suivi" element={<Suivi />} />
                        <Route path="/voyages" element={<Voyages />} />
                        <Route path="/recrutement" element={<Recrutement />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/formations" element={<Formations />} />
                        <Route path="/formation-vente" element={<FormationVente />} />
                        <Route path="/fast-food" element={<FastFood />} />
                        <Route path="/restaurants" element={<Restaurants />} />
                        <Route path="/restaurants-partenaires" element={<RestaurantPartners />} />
                        <Route path="/liquidation" element={<Liquidation />} />
                        <Route path="/livraisons" element={<Livraisons />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/compte/mot-de-passe-oublie" element={<ForgotPassword />} />
                        <Route path="/compte/changer-mot-de-passe" element={<ChangePassword />} />
                        <Route path="/espace-utilisateur" element={<UserSpace />} />
                        <Route path="/restaurant/:slug" element={<RestaurantPage />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/suppliers/:id" element={<SupplierDetails />} />
                        <Route path="/factories" element={<Factories />} />
                        <Route path="/factories/:id" element={<FactoryDetails />} />
                        <Route path="/representant-home" element={<RepresentantHome />} />
                        <Route path="/devenir-representant" element={<Representant />} />
                        <Route path="/connexion-representant" element={<ConnexionRepresentant />} />
                        <Route path="/inscription-representant" element={<RepresentantForm />} />
                        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublieRepresentant />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                    <Footer />
                  </div>
                }
              />
            </Routes>
            <MobileBottomNav />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
