import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageCircle, 
  Search, 
  Check, 
  Info 
} from 'lucide-react';
import { MenuItem } from '../types';
import { CatalogStatus } from './CatalogStatus';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { formatPriceCLP, RESTAURANT_INFO } from '../utils/businessHours';

// Scalable Feature Flag for Phase 2:
// Set to true when Online Cart ordering and instant card buttons are enabled.
const SHOW_CARD_ACTION_BUTTONS = false;

interface MenuSectionProps {
  onAddToCart?: (item: MenuItem) => void;
}

export const MenuSection = ({ onAddToCart }: MenuSectionProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const {
    categories,
    items,
    isLoading,
    hasError,
    isOfflineFallback,
    retry,
  } = useMenuCatalog();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ingredients.some((ing) =>
          ing.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, items, searchQuery]);

  const handleAdd = (item: MenuItem) => {
    if (onAddToCart) {
      onAddToCart(item);
      setAddedItemId(item.id);
      setTimeout(() => {
        setAddedItemId(null);
      }, 1200);
    }
  };

  const getWhatsAppItemUrl = (item: MenuItem) => {
    const text = `¡Hola Food Truck San Martín! 🍔 Quiero consultar por: ${item.name} (${formatPriceCLP(item.price)}). ¿Tienen disponibilidad ahora? Muchas gracias.`;
    return `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="menu" className="py-12 sm:py-16 bg-[#0D0D0D] relative overflow-hidden border-t border-white/5">
      {/* Background accents */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Compact Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-8 sm:mb-10">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase">
            Sánguches & Especialidades
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Preparados al instante a la plancha con carne jugosa, pan crujiente y palta hass fresca molida del día.
          </p>
        </div>

        {/* Search Bar & Category Tabs */}
        <div className="space-y-4 mb-8 sm:mb-10">
          
          {/* Compact Search Input */}
          <div className="max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto o ingrediente (ej: italiano, chorrillana, luco, palta...)"
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl bg-[#171717] border border-white/10 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Categories Animated Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryBg"
                      className="absolute inset-0 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Menu Grid - Compact & Responsive */}
        <CatalogStatus
          isLoading={isLoading && items.length === 0}
          hasError={hasError}
          isOfflineFallback={isOfflineFallback}
          onRetry={retry}
        />

        {(!isLoading || items.length > 0) && !hasError && filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-[#141414] rounded-2xl border border-white/10 max-w-md mx-auto p-6">
            <Info className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h3 className="font-heading text-lg text-white font-bold uppercase mb-1">
              No encontramos resultados
            </h3>
            <p className="text-gray-400 text-xs mb-3">
              Prueba buscando otro ingrediente o selecciona otra categoría.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Ver toda la carta
            </button>
          </div>
        ) : null}

        {filteredItems.length > 0 && (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  key={item.id}
                  className="group bg-[#161616] hover:bg-[#1C1C1C] rounded-2xl border border-white/10 hover:border-[#DC2626]/40 shadow-lg overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex-1 flex flex-col">
                    {/* Balanced Image */}
                    <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-black/40 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-black/30" />
                      
                      {/* Price Badge Over Image */}
                      <div className="absolute bottom-2 right-2 bg-[#0D0D0D]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 shadow-md">
                        <span className="font-heading text-sm sm:text-base font-bold text-[#FACC15]">
                          {formatPriceCLP(item.price)}
                        </span>
                      </div>
                    </div>

                    {/* Content Section: Title and Full Description */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-start space-y-1">
                      <h3 className="font-heading text-sm sm:text-base font-bold text-white uppercase group-hover:text-[#FACC15] transition-colors leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar (Scalable feature toggle - hidden by default for Phase 1) */}
                  {SHOW_CARD_ACTION_BUTTONS && (
                    <div className="p-3 pt-0 border-t border-white/5 mt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleAdd(item)}
                        aria-label={`Agregar ${item.name} al pedido`}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                          addedItemId === item.id
                            ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                        }`}
                      >
                        {addedItemId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Agregado</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-[#FACC15]" />
                            <span>Agregar</span>
                          </>
                        )}
                      </button>

                      <a
                        href={getWhatsAppItemUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold text-xs flex items-center justify-center gap-1 shadow transition-all"
                        title="Consultar por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white text-transparent" />
                        <span>Pedir</span>
                      </a>
                    </div>
                  )}

                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </section>
  );
};
