import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Bouton retour reutilisable : navigue vers la page precedente si possible,
// sinon revient a l'accueil (evite les pages "sans issue" sans navigation).
const BackButton = ({ fallback = "/", label = "Retour", floating = false }: { fallback?: string; label?: string; floating?: boolean }) => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button
      type="button"
      variant={floating ? "secondary" : "ghost"}
      size="sm"
      onClick={goBack}
      aria-label={label}
      className={floating
        ? "fixed bottom-20 left-4 z-[60] gap-1.5 border border-border bg-card/95 text-foreground shadow-lg backdrop-blur-sm hover:bg-accent md:bottom-6"
        : "mb-4 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground"}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};

export default BackButton;
