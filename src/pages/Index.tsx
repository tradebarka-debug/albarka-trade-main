import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ProductsSection from "@/components/home/ProductsSection";
import FastFoodSection from "@/components/home/FastFoodSection";
import FormationsSection from "@/components/home/FormationsSection";
import ServicesSection from "@/components/home/ServicesSection";
import MainOeuvreSection from "@/components/home/MainOeuvreSection";
import Suppliers from "./Suppliers";
import CTASection from "@/components/home/CTASection";
import { isBurkina } from "@/data/country";


const Index = () => {
  return (
    <main>
      <HeroSection />
      <div className="px-4 md:px-12 mt-10 mb-10 relative z-20">
  <div className="max-w-6xl mx-auto bg-gradient-to-r from-yellow-900/80 via-yellow-700/90 to-yellow-900/80 rounded-3xl border-2 border-yellow-500 shadow-2xl px-6 md:px-10 py-5">
    <h2 className="text-white text-center text-base md:text-2xl font-semibold leading-relaxed">
  <span className="text-yellow-300">
    ✨ Albarka Trade International
  </span>
  
    {isBurkina
  ? ", la plateforme digitale de référence au Burkina Faso pour le commerce, les services et le recrutement."
  : ", la plateforme digitale de référence en Côte d'Ivoire pour le commerce, les services et le recrutement."
}
</h2>
  </div>
</div>
      <AboutSection />
      <ProductsSection />
      <ServicesSection />
      <FastFoodSection />
      <Suppliers />
      <CTASection />
    </main>
  );
};

export default Index;