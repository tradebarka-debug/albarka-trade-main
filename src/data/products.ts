import productSiatol from "@/assets/product-siatol.jpg";
import productRizNafi from "@/assets/product-riz-nafi.jpg";
import productCindyRice from "@/assets/product-cindy-rice.jpg";
import productDjSparkling from "@/assets/product-dj-sparkling.jpg";
import productMumsRice from "@/assets/product-mums-rice.jpg";
import productLeleSpaghetti from "@/assets/product-lele-spaghetti.jpg";
import productRizNafala from "@/assets/product-riz-nafala.png";
import productRizMam from "@/assets/product-riz-mam.png";
import productSodisGaz12kg from "@/assets/product-sodis-gaz.jpeg";
import productSodisGaz6kg from "@/assets/hero-sodis-gaz.jpeg";
import productRizAbena from "@/assets/hero-abena.jpg";
import productRizCoco from "@/assets/hero-riz-coco-new.png";
import productRizAlbarka from "@/assets/riz-albarka.jpg";
import productPizzaAlbarka from "@/assets/pizza-albarka.jpeg";


export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  inStock: boolean;
}

export const products: Product[] = [
  {
    id: "riz-nafi",
    name: "Riz Nafi",
    description: "Riz de qualité supérieure, parfait pour accompagner tous vos plats",
    price: 25000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productRizNafi,
    inStock: true,
  },
  {
    id: "riz-cindy",
    name: "Riz Cindy",
    description: "Riz parfumé de première qualité importé",
    price: 28000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productCindyRice,
    inStock: true,
  },
  {
    id: "riz-mums",
    name: "Mum's Rice",
    description: "Riz premium pour les grandes occasions",
    price: 30000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productMumsRice,
    inStock: true,
  },
  {
    id: "riz-nafala",
    name: "Riz Nafala",
    description: "Riz burkinabè 100% naturel, digestif et bon goût - Rizerie Faso Malo",
    price: 14000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productRizNafala,
    inStock: true,
  },
  {
    id: "riz-mam",
    name: "Riz MAM",
    description: "Riz bio du Burkina, 100% naturel - Le plaisir de consommer burkinabé",
    price: 24000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productRizMam,
    inStock: true,
  },
  {
    id: "riz-abena",
    name: "Riz Abena",
    description: "Riz parfumé de qualité supérieure pour toute la famille",
    price: 26000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productRizAbena,
    inStock: true,
  },
  {
    id: "riz-coco",
    name: "Riz Coco",
    description: "Riz premium aux saveurs délicates - Qualité garantie",
    price: 27000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productRizCoco,
    inStock: true,
  },
  {
    id: "riz-albarka",
    name: "Riz Albarka",
    description: "Riz de la marque Albarka - Notre spécialité maison",
    price: 25000,
    unit: "Sac 25kg",
    category: "Riz",
    image: productRizAlbarka,
    inStock: true,
  },
  {
    id: "huile-siatol",
    name: "Huile Siatol",
    description: "Huile végétale de qualité supérieure pour la cuisine",
    price: 15000,
    unit: "Bidon 5L",
    category: "Huile",
    image: productSiatol,
    inStock: true,
  },
  {
    id: "spaghetti-lele",
    name: "Spaghetti Lele",
    description: "Pâtes alimentaires de qualité italienne",
    price: 500,
    unit: "Paquet 500g",
    category: "Pâtes",
    image: productLeleSpaghetti,
    inStock: true,
  },
  {
    id: "dj-sparkling",
    name: "DJ Sparkling",
    description: "Boisson pétillante rafraîchissante aux fruits",
    price: 500,
    unit: "Bouteille 50cl",
    category: "Boissons",
    image: productDjSparkling,
    inStock: true,
  },
  {
    id: "sodis-gaz-6kg",
    name: "Sodis Gaz 6kg",
    description: "Bouteille de gaz domestique de qualité - Sécurité et fiabilité garanties",
    price: 2000,
    unit: "Bouteille 6kg",
    category: "Gaz",
    image: productSodisGaz6kg,
    inStock: true,
  },
  {
    id: "sodis-gaz-12kg",
    name: "Sodis Gaz 12kg",
    description: "Bouteille de gaz domestique de qualité - Sécurité et fiabilité garanties",
    price: 6000,
    unit: "Bouteille 12kg",
    category: "Gaz",
    image: productSodisGaz12kg,
    inStock: true,
  },
  {
  id: "pizza-albarka",
  name: "Pizza Spéciale Albarka",
  description: "🔥 La pizza qui fait fondre Ouagadougou. Savoureuse, généreuse et irrésistible.",
  price: 5000,
  unit: "1 pizza",
  category: "Fast Food",
  image: productPizzaAlbarka,
  inStock: true,
},
];

export const categories = [...new Set(products.map((p) => p.category))];
