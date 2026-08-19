import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Une ancienne version PWA peut rester associée à l'adresse réseau du PC et
// servir des fichiers obsolètes. En développement, on la retire pour que
// localhost et l'adresse IP affichent toujours les modules actuels de Vite.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
