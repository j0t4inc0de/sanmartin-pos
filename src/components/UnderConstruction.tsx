import { motion } from 'framer-motion';
import { QrCode, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { RESTAURANT_INFO } from '../utils/businessHours';

interface UnderConstructionProps {
  onNavigateToMenu: () => void;
}

export const UnderConstruction = ({ onNavigateToMenu }: UnderConstructionProps) => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex flex-col justify-between selection:bg-[#DC2626] selection:text-white relative overflow-hidden px-4 py-8 sm:py-12">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#EAB308] shadow-[0_0_10px_rgba(234,179,8,0.4)]">
            <img
              src="/logo-sanmartin.jpg"
              alt="Logo Food Truck San Martín"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-heading text-lg font-bold uppercase tracking-wider text-white">
            San Martín
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600/15 text-red-400 border border-red-500/30 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>En Construcción</span>
          </span>
        </div>
      </header>

      {/* Center Main Stage */}
      <main className="relative z-10 max-w-2xl mx-auto w-full text-center py-12 sm:py-16 space-y-6">
        
        {/* Animated Brand Emblem */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative inline-block mx-auto mb-2"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#EAB308] shadow-[0_0_30px_rgba(234,179,8,0.35)] mx-auto">
            <img
              src="/logo-sanmartin.jpg"
              alt="Food Truck San Martín"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md border border-white/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Próximamente</span>
          </div>
        </motion.div>

        {/* Titles */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            Food Truck <span className="text-[#FACC15]">San Martín</span>
          </h1>

          <div className="inline-block px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-gray-300">
            <span className="text-white font-bold">Sitio en construcción</span> por{' '}
            <span className="text-[#FACC15] font-extrabold tracking-wide">We Are Samod</span>
            <span className="text-gray-400 block sm:inline sm:before:content-['•'] sm:before:mx-2 text-[11px] sm:text-xs">
              Empresa de soluciones informáticas
            </span>
          </div>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed"
        >
          Estamos preparando la nueva experiencia digital oficial. Mientras tanto, nuestra <strong className="text-white font-semibold">Carta Digital</strong> se encuentra 100% activa para escanear en las mesas y barra del local.
        </motion.p>

        {/* Primary CTA to QR Menu */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-2"
        >
          <button
            onClick={onNavigateToMenu}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] shadow-[0_0_25px_rgba(220,38,38,0.5)] hover:shadow-[0_0_35px_rgba(220,38,38,0.7)] transform active:scale-95 transition-all duration-200 cursor-pointer group"
          >
            <QrCode className="w-5 h-5 text-[#FACC15]" />
            <span>Ver Carta Digital (Modo QR)</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Local Information Pills */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{RESTAURANT_INFO.shortAddress}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <Clock className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
            <span>Mar a Dom: 18:30 - 23:30 hrs</span>
          </div>
        </motion.div>

      </main>

      {/* Agency Footer Credit */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center border-t border-white/5 pt-4 text-[11px] text-gray-500 space-y-1">
        <p>
          Desarrollado y administrado por{' '}
          <strong className="text-gray-300 font-semibold tracking-wider uppercase">
            We Are Samod
          </strong>{' '}
          — Soluciones Informáticas & Desarrollo Fullstack
        </p>
        <p className="text-[10px] text-gray-600">
          © {new Date().getFullYear()} Food Truck San Martín. Todos los derechos reservados.
        </p>
      </footer>

    </div>
  );
};
