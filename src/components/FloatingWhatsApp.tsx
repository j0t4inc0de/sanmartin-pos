import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { RESTAURANT_INFO, getBusinessStatus } from '../utils/businessHours';

export const FloatingWhatsApp = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const status = getBusinessStatus();

  const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(
    '¡Hola Food Truck San Martín! 🍔 Quiero consultar por el menú y hacer un pedido.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Tooltip message */}
      {showTooltip && (
        <div className="mb-3 max-w-xs bg-[#1A1A1A] border border-white/15 rounded-2xl p-3 shadow-2xl relative animate-bounce flex items-start gap-2.5">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-1.5 right-1.5 text-gray-400 hover:text-white p-0.5"
            aria-label="Cerrar mensaje flotante"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FACC15] shrink-0 mt-0.5">
            <img src="/logo-sanmartin.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="pr-3">
            <span className="text-[11px] font-bold text-[#FACC15] block uppercase">
              Food Truck San Martín
            </span>
            <p className="text-xs text-gray-200">
              {status.isOpen
                ? '¡Hola! Estamos en vivo atendiendo pedidos. ¿Te provoca un sánguche?'
                : '¡Hola! Escríbenos para consultar o pedir con anticipación.'}
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="relative group p-4 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.8)] transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center"
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 pointer-events-none"></span>
        <MessageCircle className="w-7 h-7 fill-white text-transparent relative z-10" />

        {/* Pulse badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-[#0D0D0D] flex items-center justify-center text-[9px] font-bold">
          1
        </span>
      </a>
    </div>
  );
};
