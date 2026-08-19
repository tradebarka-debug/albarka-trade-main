import { useLocation } from "react-router-dom";
import BackButton from "@/components/BackButton";

const pagesWithIntegratedBackButton = [
  "/voyages",
  "/services",
  "/formations",
  "/recrutement",
  "/contact",
  "/liquidation",
  "/livraisons",
  "/suppliers",
  "/factories",
];

const representativeAreas = [
  "/dashboard-representant",
  "/profil-representant",
  "/pack-representant",
  "/commissions-representant",
  "/performances-representant",
  "/filleuls-representant",
  "/lien-parrainage",
  "/qrcode-representant",
  "/acheter-pack",
  "/assistance-representant",
  "/faq-representant",
];

export default function GlobalBackButton() {
  const { pathname } = useLocation();

  if (pathname === "/") return null;
  if (pagesWithIntegratedBackButton.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;
  if (representativeAreas.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;

  return <BackButton floating />;
}
