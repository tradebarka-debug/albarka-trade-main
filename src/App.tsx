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
import AdminPartners from "@/pages/AdminPartners";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import RestaurantMenus from "./pages/admin/RestaurantMenus";
import Panier from "./pages/Panier";
import Paiement from "./pages/Paiement";
import Services from "./pages/Services";
import Voyages from "./pages/Voyages";
import Recrutement from "./pages/Recrutement";
import AdminCandidature from "./pages/admin/AdminCandidature";
import Contact from "./pages/Contact";
import Suivi from "./pages/admin/Suivi";
import Formations from "./pages/Formations";
import FormationVente from "./pages/FormationVente";
import FastFood from "./pages/FastFood";
import Auth from "./pages/Auth";
import Suppliers from "./pages/Suppliers";
import SupplierDetails from "./pages/SupplierDetails";
import NotFound from "./pages/NotFound";
import RestaurantPage from "./pages/RestaurantPage";
import CountryDetector from "./components/CountryDetector";
import CountrySelector from "./components/CountrySelector";
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

// Admin pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminFormations from "./pages/admin/AdminFormations";
import AdminServices from "./pages/admin/AdminServices";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminVoyages from "./pages/admin/AdminVoyages";
import AdminFastFood from "./pages/admin/AdminFastFood";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminServiceRequests from "./pages/admin/AdminServiceRequests";
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
            <Routes>
              {/* Admin routes - without Header/Footer */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="produits" element={<AdminProducts />} />
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
                <Route path="utilisateurs" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="admin-partners" element={<AdminPartners />} />
              </Route>

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
                        <Route path="/panier" element={<Panier />} />
                        <Route path="/paiement" element={<Paiement />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/suivi" element={<Suivi />} />
                        <Route path="/voyages" element={<Voyages />} />
                        <Route path="/recrutement" element={<Recrutement />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/formations" element={<Formations />} />
                        <Route path="/formation-vente" element={<FormationVente />} />
                        <Route path="/fast-food" element={<FastFood />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/restaurant/:slug" element={<RestaurantPage />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/suppliers/:id" element={<SupplierDetails />} />
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
