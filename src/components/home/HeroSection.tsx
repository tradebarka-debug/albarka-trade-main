import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Slide = { id: number; image_url: string; title: string; subtitle: string | null; text: string | null; button_label: string | null; button_link: string | null };

export default function HeroSection() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const loadSlides = async () => {
      const country = Number(localStorage.getItem("country_id")) || 1;
      const legacyCountry = country === 2 ? "cote_ivoire" : "burkina_faso";
      const { data } = await (supabase.from("home_slides" as never) as any).select("*").eq("is_active", true).in("country", ["all", legacyCountry]).order("sort_order");
      setSlides(data || []);
      setIndex(0);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadSlides();
    };
    void loadSlides();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);
  useEffect(() => { if (slides.length < 2) return; const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 3500); return () => window.clearInterval(timer); }, [slides.length]);
  if (slides.length === 0) return null;
  const slide = slides[index];
  return <section className="px-4 py-8 md:px-8"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-black shadow-xl"><div className="relative min-h-[65vh] bg-black md:min-h-[78vh]"><img src={slide.image_url} alt={slide.title} className="absolute inset-0 h-full w-full object-cover object-center" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent p-5 pt-20 md:p-10 md:pt-32"><p className="text-sm font-semibold text-primary">Promotion Albarka Trade</p><h2 className="mt-1 text-2xl font-bold text-white md:text-4xl">{slide.title}</h2>{slide.subtitle && <p className="mt-1 text-base font-medium text-white md:text-xl">{slide.subtitle}</p>}{slide.text && <p className="mt-3 max-w-2xl text-sm text-white/90 md:text-base">{slide.text}</p>}{slide.button_label && slide.button_link && <Link to={slide.button_link} className="mt-4 inline-block"><Button className="gap-2">{slide.button_label}<ArrowRight className="h-4 w-4" /></Button></Link>}</div></div>{slides.length > 1 && <div className="absolute bottom-3 right-4 flex gap-2">{slides.map((item, itemIndex) => <button key={item.id} aria-label={`Afficher la promotion ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)} className={`h-2.5 rounded-full transition-all ${itemIndex === index ? "w-7 bg-primary" : "w-2.5 bg-white/60"}`} />)}</div>}</div></section>;
}
