import { motion } from 'framer-motion';
import { MessageCircle, ExternalLink, ShieldCheck, MapPin } from 'lucide-react';
import { RESTAURANT_INFO } from '../utils/businessHours';

export const DeliveryChannels = () => {
  const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(
    '¡Hola Food Truck San Martín! Quiero hacer un pedido por WhatsApp.'
  )}`;

  return (
    <section className="py-14 bg-[#111111] border-y border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white uppercase">
            Pide Como Prefieras en Puente Alto
          </h2>
          <p className="text-gray-400 text-sm">
            Elige el canal que más te acomode: directo con nosotros o a través de tus apps favoritas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* WhatsApp Direct (Recommended) */}
          <motion.div
            whileHover={{ y: -4 }}
            className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#1C1C1C] to-[#141414] border-2 border-emerald-500/40 shadow-xl flex flex-col justify-between"
          >
            <div className="absolute -top-3 left-6 bg-emerald-500 text-black text-[11px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
              Recomendado • Sin Comisión
            </div>

            <div className="space-y-4 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-6 h-6 fill-emerald-400 text-transparent" />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-white uppercase">
                  WhatsApp Directo
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
                  Trato directo con el Food Truck, confirmación al instante, precios de carta oficial y promociones exclusivas.
                </p>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Transferencia o Efectivo</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Atención rápida y personalizada</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <span>Pedir al +56 9 8329 4514</span>
                <MessageCircle className="w-4 h-4 fill-black text-transparent" />
              </a>
            </div>
          </motion.div>

          {/* PedidosYa */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 sm:p-7 rounded-3xl bg-[#161616] border border-white/10 hover:border-red-500/30 shadow-xl flex flex-col justify-between transition-all"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 font-black text-xl">
                P
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-white uppercase">
                  PedidosYa
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
                  Pide con tu cuenta de PedidosYa con seguimiento de repartidor en tiempo real por Puente Alto.
                </p>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  <span>Pago online con tarjeta</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  <span>Seguimiento GPS en vivo</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <a
                href={RESTAURANT_INFO.pedidosYaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#EA0029] hover:bg-[#d00024] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span>Buscar en PedidosYa</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Uber Eats */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 sm:p-7 rounded-3xl bg-[#161616] border border-white/10 hover:border-emerald-500/30 shadow-xl flex flex-col justify-between transition-all"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#06C167]/10 border border-[#06C167]/20 flex items-center justify-center text-[#06C167] font-black text-xl">
                U
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-white uppercase">
                  Uber Eats
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
                  Encuéntranos en Uber Eats y suma puntos Uber One mientras disfrutas los mejores sánguches.
                </p>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Beneficios Uber One</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Repartidores dedicados</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <a
                href={RESTAURANT_INFO.uberEatsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#06C167] hover:bg-[#05a557] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span>Buscar en Uber Eats</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

        </div>

        {/* Pickup note */}
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                ¿Prefieres retirar en persona?
              </span>
              <span className="text-xs text-gray-400">
                Pide por WhatsApp para que esté listo al llegar a Av. Gabriela Oriente #01216, Puente Alto.
              </span>
            </div>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#FACC15] hover:underline whitespace-nowrap"
          >
            Avisar para Retiro →
          </a>
        </div>

      </div>
    </section>
  );
};
