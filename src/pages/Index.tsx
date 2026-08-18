import HeroSection from "@/components/home/HeroSection";
import HomeActionHub from "@/components/home/HomeActionHub";
import AboutSection from "@/components/home/AboutSection";
import ProductsSection from "@/components/home/ProductsSection";
import FastFoodSection from "@/components/home/FastFoodSection";
import ServicesSection from "@/components/home/ServicesSection";
import Suppliers from "./Suppliers";
import CTASection from "@/components/home/CTASection";
import { isBurkina } from "@/data/country";

const Index = () => (
  <main>
    <HomeActionHub />
    <HeroSection />
    <ProductsSection />
    <FastFoodSection />
    <div className="px-4 py-8 md:px-12">
      <div className="mx-auto max-w-6xl rounded-3xl border-2 border-yellow-500 bg-gradient-to-r from-yellow-900/80 via-yellow-700/90 to-yellow-900/80 px-6 py-5 shadow-2xl md:px-10">
        <p className="text-center text-base font-semibold leading-relaxed text-white md:text-xl">
          <span className="text-yellow-300">Albarka Trade International</span>
          {isBurkina
            ? ", la plateforme digitale de référence au Burkina Faso pour le commerce, les services et le recrutement."
            : ", la plateforme digitale de référence en Côte d'Ivoire pour le commerce, les services et le recrutement."}
        </p>
      </div>
    </div>
    <Suppliers />
    <ServicesSection />
    <AboutSection />
    <CTASection />
  </main>
);

export default Index;
