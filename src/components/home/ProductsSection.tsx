import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import productSiatol from "@/assets/product-siatol.jpg";
import productRizNafi from "@/assets/product-riz-nafi.jpg";
import productCindyRice from "@/assets/product-cindy-rice.jpg";
import productDjSparkling from "@/assets/product-dj-sparkling.jpg";
import productMumsRice from "@/assets/product-mums-rice.jpg";
import productLeleSpaghetti from "@/assets/product-lele-spaghetti.jpg";
import productRizNafala from "@/assets/product-riz-nafala.png";
import productRizMam from "@/assets/product-riz-mam.png";
import productPizzaAlbarka from "@/assets/pizza-albarka.jpeg";

const products = [
  {
    id: 1,
    name: "Huile SIATOL",
    description: "Huile de soja pure et naturelle, enrichie en vitamines",
    variants: "1L, 3L, 5L, 20L",
    image: productSiatol,
  },
  {
    id: 2,
    name: "Riz Nafi",
    description: "Riz thaïlandais 100% brisures parfumées, super qualité",
    variants: "25 kg, 50 kg",
    image: productRizNafi,
  },
  {
    id: 3,
    name: "Riz Cindy",
    description: "Sweet Aroma, Great Taste - Riz jasmin premium",
    variants: "5 kg, 25 kg",
    image: productCindyRice,
  },
  {
    id: 4,
    name: "DJ Sparkling",
    description: "Boissons pétillantes non alcoolisées, plusieurs saveurs",
    variants: "75 cl",
    image: productDjSparkling,
  },
  {
    id: 5,
    name: "Riz Mum's",
    description: "Every mum's Choice - Riz long grain de qualité",
    variants: "25 kg, 50 kg",
    image: productMumsRice,
  },
  {
    id: 6,
    name: "Spaghetti Lele",
    description: "Best choice, Best taste - Pâtes de qualité supérieure",
    variants: "250g, 500g",
    image: productLeleSpaghetti,
  },
  {
    id: 7,
    name: "Riz Nafala",
    description: "Riz burkinabè 100% naturel, digestif et bon goût",
    variants: "5 kg, 25 kg",
    image: productRizNafala,
  },
  {
    id: 8,
    name: "Riz MAM",
    description: "Riz bio du Burkina, 100% naturel",
    variants: "25 kg",
    image: productRizMam,
  },
  {
    id: 9,
    name: "Pizza-Albarka",
    description: "🔥 La pizza qui fait fondre Ouagadougou. Savoureuse, généreuse et irrésistible.",
    variants: "1 pizza",
    image: productPizzaAlbarka,
  },
];

const ProductsSection = () => {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Nos Produits
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Produits de <span className="text-primary">Qualité</span>
          </h2>
          <div className="section-divider mx-auto mb-6" />
          <p className="text-muted-foreground text-lg">
            Découvrez notre gamme de produits alimentaires premium pour le marché africain
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {products.slice(0,3).map((product, index) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl overflow-hidden border border-border card-hover animate-fade-in h-full flex flex-col"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Product Image */}
              <div className="aspect-square bg-muted/30 relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between flex-1 p-5">

                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {product.name}
                  </h3>

                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    {product.description}
                  </p>

                  <p className="text-green-400 font-semibold mb-4">
                    ● Disponible
                  </p>

                  <p className="text-xs text-foreground/70 bg-muted inline-block px-3 py-1 rounded-full">
                    {product.variants}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-5">

                  <Link to="/boutique">
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold">
                      Voir détails
                    </button>
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link to="/boutique">
            <Button className="btn-primary-glow gap-2 h-12 px-8 text-lg rounded-lg">
              Voir tous nos produits
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
