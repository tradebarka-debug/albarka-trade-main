import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Slide = { id: number; image_url: string; title: string; subtitle: string | null; text: string | null; button_label: string | null; button_link: string | null };

export default function HeroSection() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
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
  useEffect(() => { if (slides.length < 2 || isPaused) return; const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 5000); return () => window.clearInterval(timer); }, [slides.length, isPaused]);
  if (slides.length === 0) return null;
  const slide = slides[index];
  return <section className="px-4 py-7 md:px-8 md:py-9"><div onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={() => setIsPaused(false)} className="hero-glow relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-black shadow-xl"><div className="relative min-h-[56vh] bg-black sm:min-h-[62vh] md:min-h-[72vh]"><img key={slide.id} src={slide.image_url} alt={slide.title} loading={index === 0 ? "eager" : "lazy"} decoding="async" sizes="(max-width: 768px) 92vw, 1152px" className="hero-image absolute inset-0 h-full w-full object-cover object-center" /><div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" /><div key={`content-${slide.id}`} className="hero-content absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent p-5 pb-8 pt-20 md:p-10 md:pb-12 md:pt-32"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Promotion Albarka Trade</p><h2 className="mt-2 max-w-3xl text-2xl font-bold text-white md:text-4xl">{slide.title}</h2>{slide.subtitle && <p className="mt-2 text-base font-medium text-white md:text-xl">{slide.subtitle}</p>}{slide.text && <p className="mt-3 max-w-2xl text-sm text-white/90 md:text-base">{slide.text}</p>}{slide.button_label && slide.button_link && <Link to={slide.button_link} className="mt-5 inline-block"><Button className="group gap-2 shadow-lg">{slide.button_label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>}</div></div>{slides.length > 1 && <div className="absolute bottom-3 right-4 z-10 flex gap-2">{slides.map((item, itemIndex) => <button key={item.id} aria-label={`Afficher la promotion ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)} className={`h-2.5 rounded-full transition-all duration-300 ${itemIndex === index ? "w-8 bg-primary" : "w-2.5 bg-white/60 hover:bg-white"}`} />)}</div>}</div></section>;
}
