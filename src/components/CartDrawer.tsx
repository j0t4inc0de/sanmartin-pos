import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  MapPin, 
  Store, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem } from '../types';
import { formatPriceCLP, RESTAURANT_INFO } from '../utils/businessHours';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) => {
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    // Fire festive confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#DC2626', '#FACC15', '#FFFFFF', '#10B981']
    });

    // Format WhatsApp message
    let message = `¡Hola Food Truck San Martín! 🍔🔥\nQuiero hacer el siguiente pedido:\n\n`;

    cartItems.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} (${formatPriceCLP(item.price * item.quantity)})\n`;
    });

    message += `\n💰 *Total del Pedido:* ${formatPriceCLP(subtotal)}\n`;
    message += `🛵 *Modalidad:* ${
      deliveryType === 'delivery' ? 'Delivery a Domicilio (Puente Alto)' : 'Retiro en Food Truck (Gabriela Oriente #01216)'
    }\n`;

    if (customerName.trim()) {
      message += `👤 *Cliente:* ${customerName.trim()}\n`;
    }

    if (deliveryType === 'delivery') {
      message += `📍 *Dirección de Entrega:* ${address.trim() || 'Por coordinar por este chat'}\n`;
    }

    if (notes.trim()) {
      message += `📝 *Observaciones/Notas:* ${notes.trim()}\n`;
    }

    message += `\n¿Me confirman disponibilidad y tiempo estimado de entrega/retiro? ¡Muchas gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 max-w-full w-full sm:max-w-md bg-[#141414] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-[#DC2626] flex items-center justify-center border border-red-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white uppercase leading-tight">
                    Tu Pedido San Martín
                  </h3>
                  <span className="text-xs text-gray-400">
                    {cartItems.reduce((acc, i) => acc + i.quantity, 0)} productos en la lista
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Cerrar carrito"
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-white uppercase">
                      Tu carrito está vacío
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      Agrega tus sánguches, completos o combos favoritos para armar tu pedido.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase transition-colors"
                  >
                    Ver la Carta
                  </button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 pb-1">
                      <span>Productos elegidos</span>
                      <button
                        onClick={onClearCart}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        Vaciar lista
                      </button>
                    </div>

                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-[#1A1A1A] border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-heading text-base font-bold text-white uppercase truncate">
                            {item.name}
                          </h5>
                          <span className="text-xs font-semibold text-[#FACC15]">
                            {formatPriceCLP(item.price)}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                              aria-label="Restar uno"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-white min-w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                              aria-label="Sumar uno"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Mode Toggle */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                      ¿Cómo recibirás tu pedido?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          deliveryType === 'pickup'
                            ? 'bg-[#DC2626]/20 border-[#DC2626] text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Store className="w-4 h-4 text-[#FACC15]" />
                        <span>Retiro en Food Truck</span>
                        <span className="text-[10px] text-gray-400 font-normal">Av. Gabriela Oriente #01216</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          deliveryType === 'delivery'
                            ? 'bg-[#DC2626]/20 border-[#DC2626] text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>Delivery a Domicilio</span>
                        <span className="text-[10px] text-gray-400 font-normal">En Puente Alto</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Information Inputs */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Tu Nombre (opcional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FACC15]"
                      />
                    </div>

                    {deliveryType === 'delivery' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Dirección de Entrega en Puente Alto
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Calle, número, depto o villa"
                          className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FACC15]"
                        />
                      </motion.div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Notas especiales o agregados
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Sin cebolla, mayonesa aparte, etc."
                        className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FACC15]"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Summary & Checkout CTA */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-[#111] space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Subtotal de productos:</span>
                    <span className="font-semibold text-white">{formatPriceCLP(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Modalidad de entrega:</span>
                    <span className="font-semibold text-gray-300">
                      {deliveryType === 'delivery' ? 'Delivery Puente Alto' : 'Retiro en Food Truck'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="font-heading text-lg font-bold text-white uppercase">
                      Total a pagar:
                    </span>
                    <span className="font-heading text-2xl font-black text-[#FACC15]">
                      {formatPriceCLP(subtotal)}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white text-transparent" />
                  <span>Enviar Pedido a WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FACC15]" />
                  <span>Atención inmediata en menos de 2 minutos</span>
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
