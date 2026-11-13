import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Check,
  Heart
} from 'lucide-react';
import { COMBOS_DATA } from '../data/menuData';
import { CatalogStatus } from './CatalogStatus';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { formatPriceCLP, useBusinessStatus } from '../utils/businessHours';

interface QrMenuPageProps {
  onNavigateHome?: () => void;
}

export const QrMenuPage = ({ onNavigateHome }: QrMenuPageProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const status = useBusinessStatus();
  const {
    categories: menuCategories,
    items,
    isLoading,
    hasError,
    isOfflineFallback,
    retry,
  } = useMenuCatalog();

  // Filtered menu items
  const filteredItems = useMemo(() => {
    if (activeCategory === 'combos') return [];
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

  // Filtered combos
  const showCombos = activeCategory === 'all' || activeCategory === 'combos';
  const filteredCombos = useMemo(() => {
    if (!showCombos) return [];
    if (!searchQuery) return COMBOS_DATA;
    return COMBOS_DATA.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.includes.some((inc) => inc.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [showCombos, searchQuery]);

  const categories = useMemo(() => {
    return [
      ...menuCategories,
      { id: 'combos', name: 'Promos' }
    ];
  }, [menuCategories]);

  const totalResults = filteredItems.length + (showCombos ? filteredCombos.length : 0);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex flex-col selection:bg-[#DC2626] selection:text-white">
      
      {/* Sticky Mobile-First Header */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          
          {/* Brand Emblem */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#EAB308] shadow-[0_0_12px_rgba(234,179,8,0.35)] shrink-0">
              <img
                src="/logo-sanmartin.jpg"
                alt="Food Truck San Martín"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-base sm:text-lg font-bold text-white uppercase tracking-wider leading-none">
                  San Martín - Carta QR
                </h1>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span>Gabriela Oriente #01216</span>
              </p>
            </div>
          </div>

          {/* ponytail: enable navigation back to live landing page */}
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer shrink-0"
              title="Ir a la página web completa"
            >
              <span className="hidden sm:inline">Sitio Web</span>
              <span className="sm:hidden">Web</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2.5 bg-[#0D0D0D] border-b border-white/5">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto o ingrediente (italiano, chorrillana, luco, palta...)"
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#171717] border border-white/10 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Category Tabs */}
        <div className="bg-[#0D0D0D] px-3 py-2 overflow-x-auto scrollbar-none border-b border-white/5">
          <div className="flex items-center gap-1.5 min-w-max max-w-4xl mx-auto">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'bg-[#171717] text-gray-400 hover:text-white hover:bg-[#202020] border border-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeQrCategoryTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.45)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-5 sm:py-6 space-y-6">

        <CatalogStatus
          isLoading={isLoading && items.length === 0}
          hasError={hasError}
          isOfflineFallback={isOfflineFallback}
          onRetry={retry}
        />
        
        {/* Empty Search State */}
        {(!isLoading || items.length > 0) && !hasError && totalResults === 0 ? (
          <div className="text-center py-16 bg-[#141414] rounded-2xl border border-white/10 p-6">
            <h3 className="font-heading text-lg text-white font-bold uppercase mb-1">
              No encontramos resultados para tu búsqueda
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              Prueba buscando otro ingrediente o selecciona "Todos".
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Ver toda la carta
            </button>
          </div>
        ) : null}

        {/* Individual Sandwiches & Items Section */}
        {filteredItems.length > 0 && (
          <div className="space-y-4">
            <motion.div 
              key={`header_${activeCategory}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between pb-1 border-b border-white/5"
            >
              <h2 className="font-heading text-lg sm:text-xl font-bold uppercase tracking-wider text-white">
                {activeCategory === 'all' ? 'Carta de Sánguches & Especialidades' : categories.find(c => c.id === activeCategory)?.name}
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {filteredItems.length} {filteredItems.length === 1 ? 'producto' : 'productos'}
              </span>
            </motion.div>

            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 22, scale: 0.94 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 340,
                        damping: 24,
                        mass: 0.8,
                        delay: Math.min(index * 0.04, 0.28)
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.92, 
                      transition: { duration: 0.15, ease: "easeOut" } 
                    }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 28 }
                    }}
                    key={`${activeCategory}_${item.id}`}
                    className="group bg-[#161616] hover:bg-[#1B1B1B] rounded-2xl border border-white/10 hover:border-[#DC2626]/40 shadow-lg overflow-hidden flex flex-col justify-between transition-colors duration-300"
                  >
                    <div className="flex-1 flex flex-col">
                      {/* Photo with price */}
                      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-black/40 shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-black/30" />
                        
                        {/* Price Tag in Gold */}
                        <div className="absolute bottom-2 right-2 bg-[#0D0D0D]/95 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 shadow-md">
                          <span className="font-heading text-base sm:text-lg font-extrabold text-[#FACC15]">
                            {formatPriceCLP(item.price)}
                          </span>
                        </div>
                      </div>

                      {/* Content Section: Name, Full Description, and Chilean Ingredients */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <h3 className="font-heading text-base font-bold text-white uppercase group-hover:text-[#FACC15] transition-colors leading-snug">
                            {item.name}
                          </h3>
                          <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Chilean Ingredients breakdown */}
                        <div className="pt-2 border-t border-white/5 space-y-1">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
                            Ingredientes:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.ingredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-white/5 border border-white/5 text-gray-300 px-2 py-0.5 rounded-md"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* Combos & Sharing Promotions Section */}
        {showCombos && filteredCombos.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <motion.div 
              key={`header_combos_${activeCategory}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between pb-1 border-b border-white/5"
            >
              <h2 className="font-heading text-lg sm:text-xl font-bold uppercase tracking-wider text-[#FACC15]">
                Combos & Promociones Para Compartir
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {filteredCombos.length} promociones
              </span>
            </motion.div>

            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredCombos.map((combo, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 22, scale: 0.94 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 340,
                        damping: 24,
                        mass: 0.8,
                        delay: Math.min(index * 0.05, 0.25)
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.92, 
                      transition: { duration: 0.15, ease: "easeOut" } 
                    }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 28 }
                    }}
                    key={`${activeCategory}_${combo.id}`}
                    className="bg-[#161616] hover:bg-[#1B1B1B] rounded-2xl border border-white/10 hover:border-[#FACC15]/30 overflow-hidden shadow-lg flex flex-col justify-between transition-colors duration-300"
                  >
                    <div>
                      {/* Image & Price */}
                      <div className="relative h-40 w-full overflow-hidden bg-black/40">
                        <img
                          src={combo.image}
                          alt={combo.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-black/30" />
                        
                        {/* Serves pill */}
                        <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/15 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{combo.serves}</span>
                        </div>

                        {/* Price box */}
                        <div className="absolute bottom-2.5 right-2.5 bg-[#0D0D0D]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-right">
                          <span className="text-[11px] text-gray-400 line-through block leading-none">
                            {formatPriceCLP(combo.originalPrice)}
                          </span>
                          <span className="font-heading text-lg font-black text-[#FACC15] leading-tight block mt-0.5">
                            {formatPriceCLP(combo.price)}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-heading text-lg font-bold text-white uppercase">
                            {combo.name}
                          </h3>
                          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                            {combo.description}
                          </p>
                        </div>

                        {/* Includes list */}
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                            Incluye:
                          </span>
                          <ul className="space-y-1 text-xs text-gray-300">
                            {combo.includes.map((inc, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* End of Menu Agency Credit */}
        <div className="mt-12 mb-6 pt-6 border-t border-white/5 text-center text-xs text-gray-500 space-y-1">
          <p>© {new Date().getFullYear()} Sanguchería San Martín · Carta Digital</p>
          <p className="flex items-center justify-center gap-1 text-[11px] text-gray-400">
            <span>Desarrollado con</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>por</span>
            <a
              href="https://www.wearesamod.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 font-bold hover:text-[#FACC15] transition-colors underline decoration-white/20 underline-offset-2 hover:decoration-[#FACC15]"
            >
              We Are Samod
            </a>
          </p>
        </div>

      </main>

      {/* Sticky Bottom Bar with Schedule, Live Status & We Are Samod */}
      <footer className="sticky bottom-0 z-30 bg-[#121212]/95 backdrop-blur-md border-t border-white/10 px-4 py-2 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                status.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-white">
              {status.isOpen ? '¡Plancha Caliente!' : 'Abre 18:30 hrs'}
            </span>
            <span className="text-gray-600 hidden xs:inline">·</span>
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3 text-[#FACC15] shrink-0" />
              Mar a Dom: 18:30 - 23:30
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400 ml-auto">
            <span>Por</span>
            <a
              href="https://www.wearesamod.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 font-bold hover:text-[#FACC15] transition-colors inline-flex items-center gap-0.5 underline decoration-white/20 underline-offset-2 hover:decoration-[#FACC15]"
            >
              We Are Samod
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
