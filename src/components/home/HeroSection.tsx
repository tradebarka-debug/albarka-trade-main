import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import heroRizNafiNew from "@/assets/hero-riz-nafi-new.jpeg";
import heroRizNafiMobile from "@/assets/hero-riz-nafi-mobile.jpeg";
import heroSodisGaz from "@/assets/hero-sodis-gaz.jpeg";
import heroPizza from "@/assets/pizza-albarka.jpeg";
import mainOeuvreClair from "@/assets/main-oeuvre.png";
import { isBurkina, isCoteIvoire } from "@/data/country";
const countryId = Number(localStorage.getItem("country_id") || "1");

const burkinaSlides: Array<{
  image: string;
  mobileImage?: string;
  title: string;
  subtitle: string;
  tagline: string;
  objectPosition: { desktop: string; mobile: string };
  objectFit: "cover" | "contain";
  bgColor: string;
  hideText?: boolean;
  kenBurns: string;
}> = [{
  image: heroRizNafiNew,
  mobileImage: heroRizNafiMobile,
  title: "RIZ NAFI",
  subtitle: "100% BRISURES PARFUMÉES",
  tagline: "Qualité supérieure, prix réduit !",
  objectPosition: {
    desktop: "center 20%",
    mobile: "center center"
  },
  objectFit: "cover",
  bgColor: "bg-gradient-to-br from-blue-900 to-blue-950",
  hideText: true,
  kenBurns: "scale(1.15) translate(-2%, 1%)"
},
{
  image: heroSodisGaz,
  title: "SODIS GAZ",
  subtitle: "",
  tagline: "Sécurité et fiabilité garanties !",
  objectPosition: {
    desktop: "center center",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-blue-900 to-blue-950",
  kenBurns: "scale(1.1) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Ouagadougou 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: mainOeuvreClair,
  mobileImage: mainOeuvreClair,
  title: "MAIN D’ŒUVRE",
  subtitle: "Professionnels qualifiés",
  tagline: "Recrutement rapide et demande de service 24h/24",
  objectPosition: {
    desktop: "center center",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-black via-black/90 to-transparent",
  kenBurns: "scale(1.03) translate(0%, 0%)"
},
{
  image: heroRizNafiNew,
  mobileImage: heroRizNafiMobile,
  title: "RIZ NAFI",
  subtitle: "100% BRISURES PARFUMÉES",
  tagline: "Qualité supérieure, prix réduit !",
  objectPosition: {
    desktop: "center 20%",
    mobile: "center center"
  },
  objectFit: "cover",
  bgColor: "bg-gradient-to-br from-blue-900 to-blue-950",
  hideText: true,
  kenBurns: "scale(1.15) translate(-2%, 1%)"
},
{
  image: heroSodisGaz,
  title: "SODIS GAZ",
  subtitle: "",
  tagline: "Sécurité et fiabilité garanties !",
  objectPosition: {
    desktop: "center center",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-blue-900 to-blue-950",
  kenBurns: "scale(1.1) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Ouagadougou 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: mainOeuvreClair,
  mobileImage: mainOeuvreClair,
  title: "MAIN D’ŒUVRE",
  subtitle: "Professionnels qualifiés",
  tagline: "Recrutement rapide et demande de service 24h/24",
  objectPosition: {
    desktop: "center center",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-black via-black/90 to-transparent",
  kenBurns: "scale(1.03) translate(0%, 0%)"
},
{
 image: heroRizNafiNew,
  mobileImage: heroRizNafiMobile,
  title: "RIZ NAFI",
  subtitle: "100% BRISURES PARFUMÉES",
  tagline: "Qualité supérieure, prix réduit !",
  objectPosition: {
    desktop: "center 20%",
    mobile: "center center"
  },
  objectFit: "cover",
  bgColor: "bg-gradient-to-br from-blue-900 to-blue-950",
  hideText: true,
  kenBurns: "scale(1.15) translate(-2%, 1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},

];

const coteIvoireSlides: Array<{
  image: string;
  mobileImage?: string;
  title: string;
  subtitle: string;
  tagline: string;
  objectPosition: { desktop: string; mobile: string };
  objectFit: "cover" | "contain";
  bgColor: string;
  hideText?: boolean;
  kenBurns: string;
}> = [{
  image: heroPizza,
  mobileImage:heroPizza,
  title:  "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center center",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-green-900 to-blue-950",
  hideText: true,
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: heroSodisGaz,
  title: "SODIS GAZ",
  subtitle: "",
  tagline: "Sécurité et fiabilité garanties !",
  objectPosition: {
    desktop: "center center",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-blue-900 to-blue-950",
  kenBurns: "scale(1.1) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: mainOeuvreClair,
  mobileImage: mainOeuvreClair,
  title: "MAIN D’ŒUVRE",
  subtitle: "Professionnels qualifiés",
  tagline: "Recrutement rapide et demande de service 24h/24",
  objectPosition: {
    desktop: "center center",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-black via-black/90 to-transparent",
  kenBurns: "scale(1.03) translate(0%, 0%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
{
  image: heroPizza,
  mobileImage: heroPizza,
  title: "PIZZA ALBARKA",
  subtitle: "100% HALAL",
  tagline: "La pizza qui fait fondre Abidjan 🔥 ",
  objectPosition: {
    desktop: "center 30%",
    mobile: "center center"
  },
  objectFit: "contain",
  bgColor: "bg-gradient-to-br from-orange-900 to-red-900",
  kenBurns: "scale(1.02) translate(2%, -1%)"
},
];

const SLIDE_DURATION = 1800;
const FADE_DURATION = 500;

const HeroSection = () => {
  const countryId = Number(localStorage.getItem("country_id")) || 1;

const slides =
  countryId === 2 ? coteIvoireSlides : burkinaSlides;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setNextIndex(index);

    setTimeout(() => {
      setCurrentIndex(index);
      setNextIndex(null);
      setIsTransitioning(false);
    }, FADE_DURATION);
  }, [currentIndex, isTransitioning]);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const next = (currentIndex + 1) % slides.length;
      goToSlide(next);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, goToSlide]);

  const scrollTo = useCallback((index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    goToSlide(index);
  }, [goToSlide]);

  const renderSlide = (slide: typeof slides[0], index: number, isActive: boolean, isFadingIn: boolean) => {
    const isVisible = isActive || isFadingIn;
    if (!isVisible) return null;

    return (
      <div
        key={index}
        className="absolute inset-0"
        style={{
          opacity: isFadingIn ? 0 : 1,
          animation: isFadingIn
            ? `heroFadeIn ${FADE_DURATION}ms ease-in-out forwards`
            : isTransitioning && isActive
              ? `heroFadeOut ${FADE_DURATION}ms ease-in-out forwards`
              : undefined,
          zIndex: isFadingIn ? 2 : 1,
        }}
      >
        {/* Background Image with Ken Burns */}
        <div className={`absolute inset-0 ${slide.bgColor || ''}`}>
          <div
            className="w-full h-full"
            style={{
              animation: `kenBurns ${SLIDE_DURATION + FADE_DURATION}ms ease-out forwards`,
              animationDelay: isFadingIn ? `${FADE_DURATION * 0.3}ms` : '0ms',
            }}
          >
            <img
              src={isMobile && slide.mobileImage ? slide.mobileImage : slide.image}
              alt={slide.title}
              loading="eager"
              fetchPriority="high"
              className={`w-full h-full ${slide.objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
              style={{
                objectPosition: isMobile ? slide.objectPosition.mobile : slide.objectPosition.desktop,
                imageRendering: 'auto',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        </div>

        {!slide.hideText && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent md:from-black/70 md:via-black/30 md:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:from-black/50 md:via-transparent md:to-transparent" />
          </>
        )}

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-t from-black to-transparent" />

        {!slide.hideText && (
          <div className="relative h-full flex items-end md:items-center pb-20 md:pb-0">
            <div className="container mx-auto px-3 md:px-4 py-4 md:py-20">
              <div
                className="max-w-2xl"
                style={{
                  opacity: 0,
                  animation: isActive && !isTransitioning
                    ? `heroContentIn 0.8s ease-out 0.3s forwards`
                    : isFadingIn
                      ? `heroContentIn 0.8s ease-out ${FADE_DURATION * 0.5}ms forwards`
                      : undefined,
                }}
              >
                <div className="inline-flex items-center gap-1.5 md:gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-3 md:px-5 py-1.5 md:py-2.5 mb-3 md:mb-6">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-pulse"></span>
                  <span className="text-xs md:text-sm lg:text-base font-bold text-foreground tracking-wide drop-shadow-lg">Albarka Trade International</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-2 md:mb-6">
                  <span className="text-yelow-400drop-shadow-lg">{slide.title}</span>
                  <span className="block text-sm sm:text-base md:text-2xl lg:text-3xl mt-0.5 md:mt-2 italic text-white">
                    {slide.subtitle}
                  </span>
                </h1>
                <p className="text-sm md:text-2xl text-white font-medium drop-shadow-lg mb-3 md:mb-8 leading-relaxed">
                  {slide.tagline}
                </p>
                <div className="section-divider mb-3 md:mb-8 hidden md:block" />
                <div className="flex flex-row gap-2 md:gap-4">
                  <Link to="/contact">
                    <Button className="btn-primary-glow gap-1.5 md:gap-3 h-9 md:h-14 px-3 md:px-8 text-xs md:text-lg rounded-lg">
                      <FileText className="w-3.5 h-3.5 md:w-5 md:h-5" />
                      Devis
                    </Button>
                  </Link>
                  <a href="https://wa.me/22602029494" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-green-600 text-white border-green-600 hover:bg-green-700 gap-1.5 md:gap-3 h-9 md:h-14 px-3 md:px-8 text-xs md:text-lg shadow-lg">
                      <MessageCircle className="w-3.5 h-3.5 md:w-5 md:h-5" />
                      WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden min-h-[70vh] md:min-h-[90vh]">
      {/* Ken Burns + Fade CSS */}
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.12) translate(-1%, 0.5%); }
        }
        @keyframes heroFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes heroFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes heroContentIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Slides */}
      {slides.map((slide, index) =>
        renderSlide(
          slide,
          index,
          index === currentIndex,
          index === nextIndex
        )
      )}

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {burkinaSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${currentIndex === index
              ? "bg-primary w-8"
              : "bg-foreground/40 hover:bg-foreground/60"
              }`}
            aria-label={`Aller à la slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10 z-20">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
