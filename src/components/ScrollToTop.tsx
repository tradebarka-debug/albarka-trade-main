import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Remonte la page en haut a chaque changement de route : sans ca, une page
// tres longue (ex: apres avoir scrolle jusqu'en bas) reste figee sur le
// meme scroll quand on change de rubrique, donnant l'impression que rien
// ne s'est passe.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
