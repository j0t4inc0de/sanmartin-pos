import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  MessageCircle, 
  UtensilsCrossed, 
  Star, 
  MapPin, 
  Clock, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { RESTAURANT_INFO } from '../utils/businessHours';

export const Hero = () => {

  const handleScrollToMenu = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappHeroUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(
    '¡Hola Food Truck San Martín! Vi la página web y quiero hacer un pedido 🍔'
  )}`;

  return (
    <section id="inicio" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-8 pb-16 lg:py-20">
      {/* Dynamic Background Glows and Gradients */}
      <div className="absolute inset-0 bg-[#0D0D0D] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#EAB308]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-red-900/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-2 pt-2"
            >
              <span className="font-heading text-lg sm:text-xl font-bold tracking-widest text-[#FACC15] uppercase flex items-center justify-center lg:justify-start gap-2">
                <Flame className="w-5 h-5 text-[#DC2626]" />
                Auténtico Sabor Sanguchero Chileno
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white uppercase leading-[1.05]">
                El Mejor Sabor <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#FACC15]">
                  En Puente Alto
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-gray-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed"
            >
              Sándwiches con proteína a elección, vianesas, ases, chorrillanas, papas fritas y promociones preparados al momento a la plancha con <strong className="text-white font-bold">abundante palta fresca y mayo casera</strong>.
            </motion.p>


            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              {/* WhatsApp Button */}
              <a
                href={whatsappHeroUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 fill-white text-transparent" />
                <span>Pedir por WhatsApp Directo</span>
              </a>

              {/* Menu Scroll Button */}
              <a
                href="#menu"
                onClick={handleScrollToMenu}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-base font-bold text-gray-200 bg-[#1A1A1A] hover:bg-[#252525] border border-white/15 hover:border-[#FACC15]/50 transition-all duration-200"
              >
                <UtensilsCrossed className="w-5 h-5 text-[#FACC15]" />
                <span>Ver Menú Completo</span>
              </a>
            </motion.div>

            {/* Delivery Apps Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-xs text-gray-400"
            >
              <span className="hidden sm:inline font-medium text-gray-400">También disponible en:</span>
              <a
                href={RESTAURANT_INFO.pedidosYaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#EA0029]" />
                <span>PedidosYa</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
              <a
                href={RESTAURANT_INFO.uberEatsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#06C167]" />
                <span>Uber Eats</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
            </motion.div>
          </div>

          {/* Right Column: Hero Visual Showcase Card */}
          <div className="lg:col-span-5 flex justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative w-full max-w-md"
            >
              {/* Outer Decorative Ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[#DC2626] via-[#FACC15] to-[#B91C1C] opacity-75 blur-lg animate-pulse" />

              {/* Main Card */}
              <div className="relative rounded-3xl bg-[#141414] border border-white/15 p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
                
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />

                {/* Central Brand Emblem */}
                <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-[#FACC15] shadow-[0_0_35px_rgba(250,204,21,0.4)] mb-6 group">
                  <img
                    src="/logo-sanmartin.jpg"
                    alt="Food Truck Sanguchería San Martín"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Card Title & Slogan */}
                <div className="text-center space-y-1 mb-6">
                  <h3 className="font-heading text-2xl font-bold uppercase text-white tracking-wider">
                    Sanguchería San Martín
                  </h3>
                  <p className="text-sm text-[#FACC15] font-semibold tracking-widest uppercase">
                    Food Truck • Auténtico Sabor
                  </p>
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Av. Gabriela Oriente #01216, Puente Alto
                  </p>
                </div>

                {/* Badges Grid inside card */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>4.9 / 5.0</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      +1.200 clientes felices
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>100% Fresco</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      Ingredientes del día
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold text-sm">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span>A la Plancha</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      Sabor criollo único
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-sm">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span>Mar a Dom</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      18:30 - 23:30 hrs
                    </span>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
