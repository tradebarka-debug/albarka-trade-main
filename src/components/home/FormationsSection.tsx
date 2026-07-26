import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Award } from "lucide-react";
import mainOeuvreClair from "@/assets/main-oeuvre.png";
import { isBurkina, isCoteIvoire } from "@/data/country";

const FormationsSection = () => {
  return (
    <section className="relative min-h-[60vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={mainOeuvreClair}
          alt="Formation sur la vente"
          className="w-full h-full object-cover"
        />
        {/* Blue Overlay matching hero style */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto relative z-10 px-4 py-16">
        <div className="max-w-2xl animate-fade-in">
          <span className="inline-block bg-primary/20 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-primary/30">
            Formation Commerciale
          </span>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Formation sur la <span className="text-secondary">Vente</span>
          </h2>

          <p className="text-white/90 text-lg md:text-xl mb-8 leading-relaxed">
            Qu'est-ce que la vente?.
            Proposer une solution, créer un échange de valeur, influencer positivement sans forcer.
            La vente est un échange de valeur.
          </p>
          <div className="max-w-5xl mx-auto mt-12 mb-10 px-4">
            <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6 md:p-10 text-center shadow-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Pourquoi se former ?
              </h2>

              <div className="space-y-5">
                <p className="text-xl md:text-2xl font-semibold text-white">
                  Travailler dur ne suffit pas.
                </p>

                <p className="text-lg md:text-xl text-white/85">
                  La méthode transforme l’effort en résultats.
                </p>

                <p className="text-xl md:text-2xl font-semibold text-white">
                  La formation permet de gagner du temps et de l’argent.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <TrendingUp className="w-8 h-8 text-secondary mb-2" />
              <span className="text-white text-sm font-medium">Techniques modernes</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Users className="w-8 h-8 text-secondary mb-2" />
              <span className="text-white text-sm font-medium">Formateurs experts</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Award className="w-8 h-8 text-secondary mb-2" />
              <span className="text-white text-sm font-medium">Certification</span>
            </div>
          </div>

          <Link to="/formation-vente">
            <Button className="btn-secondary-glow gap-2 h-12 px-8 text-lg rounded-lg">
              Découvrir la formation
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FormationsSection;
