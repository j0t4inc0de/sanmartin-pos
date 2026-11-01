import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Check, 
  Plus, 
  MessageCircle, 
  Flame, 
  Tag 
} from 'lucide-react';
import { ComboItem } from '../types';
import { COMBOS_DATA } from '../data/menuData';
import { formatPriceCLP, RESTAURANT_INFO } from '../utils/businessHours';

// Scalable Feature Flag for Phase 2:
// Set to true when Online Cart ordering is enabled.
const ENABLE_ONLINE_CART = false;

interface CombosSectionProps {
  onAddComboToCart?: (combo: ComboItem) => void;
  onNavigateToMenu?: () => void;
}

export const CombosSection = ({ onAddComboToCart, onNavigateToMenu }: CombosSectionProps) => {
  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  const handleAdd = (combo: ComboItem) => {
    if (onAddComboToCart) {
      onAddComboToCart(combo);
      setAddedComboId(combo.id);
      setTimeout(() => {
        setAddedComboId(null);
      }, 1200);
    }
  };

  const getWhatsAppComboUrl = (combo: ComboItem) => {
    const text = `¡Hola Food Truck San Martín! 🔥 Quiero pedir la promoción: ${combo.name} (${formatPriceCLP(combo.price)}). ¿Tienen disponibilidad ahora? Muchas gracias.`;
    return `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="combos" className="py-20 bg-[#121212] relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
            Promociones & Combos
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            Aprovecha nuestras promociones de 2 sándwiches con papas fritas y nuestras chorrillanas con bebida o jugo de 1.5L.
          </p>
        </div>

        {/* Combos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {COMBOS_DATA.map((combo) => (
            <motion.div
              key={combo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="group relative bg-[#171717] rounded-3xl border border-white/10 hover:border-[#FACC15]/50 shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_35px_rgba(250,204,21,0.15)]"
            >
              <div>
                {/* Image and badges overlay */}
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-black/40">
                  <img
                    src={combo.image}
                    alt={combo.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-black/40" />

                  {/* Savings / Badge pill */}
                  {combo.badge && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-red-400/30 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-300" />
                      <span>{combo.badge}</span>
                    </div>
                  )}

                  {/* Serves count */}
                  <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-1.5 shadow-md">
                    <Users className="w-3.5 h-3.5" />
                    <span>{combo.serves}</span>
                  </div>

                  {/* Price Tag Box */}
                  <div className="absolute bottom-4 right-4 bg-[#0D0D0D]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-xl text-right">
                    <span className="text-xs text-gray-400 line-through block font-medium">
                      {formatPriceCLP(combo.originalPrice)}
                    </span>
                    <span className="font-heading text-2xl font-black text-[#FACC15]">
                      {formatPriceCLP(combo.price)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-4">
                  <div>
                    <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white uppercase group-hover:text-[#FACC15] transition-colors">
                      {combo.name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1.5">
                      {combo.description}
                    </p>
                  </div>

                  {/* Includes List */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      Este combo incluye:
                    </span>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {combo.includes.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions Footer (Phase 2: Active when ENABLE_ONLINE_CART is true) */}
              {ENABLE_ONLINE_CART && (
                <div className="p-6 sm:p-8 pt-0 border-t border-white/5 mt-4 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleAdd(combo)}
                    className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      addedComboId === combo.id
                        ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                  >
                    {addedComboId === combo.id ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>¡Combo Agregado al Carrito!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#FACC15]" />
                        <span>Agregar Combo al Pedido</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getWhatsAppComboUrl(combo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                    <span>Pedir este Combo por WhatsApp</span>
                  </a>
                </div>
              )}

            </motion.div>
          ))}
        </div>

        {/* CTA: Redirigir al menú completo */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-4 sm:px-6 sm:py-3.5 rounded-2xl bg-[#171717] border border-white/10 shadow-xl">
            <span className="text-sm sm:text-base text-gray-300 font-medium">
              ¿Quieres ver el menú completo?
            </span>
            <a
              href="/menu"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateToMenu) {
                  onNavigateToMenu();
                } else {
                  window.location.href = '/menu';
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
            >
              <span>Ver Menú Completo</span>
              <span className="text-amber-300">→</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
