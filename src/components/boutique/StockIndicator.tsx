import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface StockIndicatorProps {
  quantity: number;
  inStock: boolean;
}

const StockIndicator = ({ quantity, inStock }: StockIndicatorProps) => {
  if (!inStock || quantity === 0) {
    return null; // The "Rupture de stock" overlay handles this case
  }

  const getStockLevel = () => {
    if (quantity <= 5) return { label: "Stock très faible", color: "bg-destructive", textColor: "text-destructive" };
    if (quantity <= 20) return { label: "Stock faible", color: "bg-orange-500", textColor: "text-orange-600" };
    if (quantity <= 50) return { label: "En stock", color: "bg-yellow-500", textColor: "text-yellow-600" };
    return { label: "Disponible", color: "bg-green-500", textColor: "text-green-600" };
  };

  const stockLevel = getStockLevel();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className={cn("w-2 h-2 rounded-full", stockLevel.color)} />
        <span className={cn("text-xs font-medium", stockLevel.textColor)}>
          {quantity <= 20 ? `${quantity} restant${quantity > 1 ? "s" : ""}` : stockLevel.label}
        </span>
      </div>
    </div>
  );
};

export default StockIndicator;
