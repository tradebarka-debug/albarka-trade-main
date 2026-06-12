import { Home, ShoppingBag, Utensils, Briefcase, Users, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const MobileBottomNav = () => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-yellow-500 z-50 md:hidden pb-safe">
            <div className="grid grid-cols-6 text-white text-[11px]">
                <Link
                    to="/fast-food"
                    className="flex flex-col items-center justify-center py-1.5 hover:text-yellow-400"
                >
                    <Utensils size={18} />
                    <span>FastFood</span>
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

                <Link
                    to="/contact"
                    className="flex flex-col items-center justify-center py-2 hover:text-yellow-400"
                >
                    <Phone size={20} />
                    <span>Contact</span>
                </Link>

            </div>
        </div>
    );
};

export default MobileBottomNav;