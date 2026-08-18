import { Home, ShoppingBag, Utensils, Briefcase, Users, ShoppingCart, PackageSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const MobileBottomNav = () => {
    const { items } = useCart();
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    return (
        <div className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-yellow-500 z-50 md:hidden pb-safe">
            <div className="grid grid-cols-7 text-white text-[10px]">
                <Link
                    to="/restaurants"
                    className="flex flex-col items-center justify-center py-1.5 hover:text-yellow-400"
                >
                    <Utensils size={18} />
                    <span>Restaurant</span>
                </Link>
                <Link
                    to="/"
                    className="flex flex-col items-center justify-center py-2 text-yellow-400"
                >
                    <Home size={18} />
                    <span>Accueil</span>
                </Link>

                <Link
                    to="/boutique"
                    className="flex flex-col items-center justify-center py-2 hover:text-yellow-400"
                >
                    <ShoppingBag size={20} />
                    <span>Boutique</span>
                </Link>
                <Link to="/panier" className="relative flex flex-col items-center justify-center py-2 hover:text-yellow-400">
                    <span className="relative"><ShoppingCart size={20} />{itemCount > 0 && <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-yellow-400 px-1 text-center text-[10px] font-bold text-black">{itemCount}</span>}</span>
                    <span>Panier</span>
                </Link>
                <Link to="/suivi-livraison" className="flex flex-col items-center justify-center py-2 hover:text-yellow-400">
                    <PackageSearch size={20} />
                    <span>Suivi</span>
                </Link>

                <Link
                    to="/services"
                    className="flex flex-col items-center justify-center py-2 hover:text-yellow-400"
                >
                    <Briefcase size={20} />
                    <span>Services</span>
                </Link>

                <Link
                    to="/recrutement"
                    className="flex flex-col items-center justify-center py-2 hover:text-yellow-400"
                >
                    <Users size={20} />
                    <span>Recrutement</span>
                </Link>

            </div>
        </div>
    );
};

export default MobileBottomNav;
