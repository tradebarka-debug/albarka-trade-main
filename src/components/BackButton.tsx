import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Bouton retour reutilisable : navigue vers la page precedente si possible,
// sinon revient a l'accueil (evite les pages "sans issue" sans navigation).
const BackButton = ({ fallback = "/", label = "Retour" }: { fallback?: string; label?: string }) => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};

export default BackButton;
