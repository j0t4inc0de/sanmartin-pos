import { motion } from 'framer-motion';
import { 
  Flame, 
  Utensils, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Award 
} from 'lucide-react';
import { FEATURES_DATA } from '../data/menuData';

export const AboutFeatures = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-6 h-6 text-[#DC2626]" />;
      case 'Utensils':
        return <Utensils className="w-6 h-6 text-[#FACC15]" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-emerald-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-sky-400" />;
      default:
        return <Award className="w-6 h-6 text-[#FACC15]" />;
    }
  };

  return (
    <section id="nosotros" className="py-20 bg-[#0D0D0D] relative overflow-hidden border-t border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-950/20 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
            ¿Por Qué Elegir San Martín?
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            No somos un local más de comida rápida. Somos un Food Truck nacido con la misión de devolverle a Puente Alto el sabor del auténtico sándwich chileno: contundente, fresco y con carne de verdad.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {FEATURES_DATA.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="group p-6 sm:p-7 rounded-3xl bg-[#141414] border border-white/10 hover:border-[#DC2626]/40 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_30px_rgba(220,38,38,0.15)] hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {getIcon(feature.icon)}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#FACC15] tracking-wider uppercase">
                    {feature.tag}
                  </span>
                  <h3 className="font-heading text-xl font-bold text-white uppercase group-hover:text-[#FACC15] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span>Tradición y Calidad</span>
                <span className="text-red-500 font-bold">100%</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Story Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#171717] via-[#1F1414] to-[#171717] border border-white/10 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold text-[#FACC15] uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                De Martes a Domingo desde las 18:30 hrs
              </span>
              <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white uppercase leading-tight">
                El Ritual de la Plancha: Sabor que se Siente en Cada Bocado
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Cada tarde encendemos la plancha de nuestro Food Truck en Av. Gabriela Oriente con un compromiso inquebrantable: cocinar cada sándwich al momento. Sin recalentados, sin ingredientes mezquinos. Es el auténtico cariño chileno servido en un pan frica caliente y crocante.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-gray-200">
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  📍 Gabriela Oriente #01216
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  🛵 Delivery Rápido en Puente Alto
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  ⭐ +4.9 Calificación de Clientes
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-[#FACC15] overflow-hidden shadow-[0_0_35px_rgba(250,204,21,0.3)]">
                <img
                  src="/logo-sanmartin.jpg"
                  alt="Sello de Calidad Food Truck San Martín"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
