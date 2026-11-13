import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Tag } from 'lucide-react';
import { CatalogStatus } from './CatalogStatus';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { formatPriceCLP } from '../utils/businessHours';

const normalizeCategory = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es-CL');

const isPromotionCategory = (value: string) => normalizeCategory(value).startsWith('promo');

interface CombosSectionProps {
  onNavigateToMenu?: () => void;
}

/** Muestra las promociones publicadas en el catálogo real de Django. */
export const CombosSection = ({ onNavigateToMenu }: CombosSectionProps) => {
  const { categories, items, isLoading, hasError, isOfflineFallback, retry } = useMenuCatalog();

  const promotionCategoryId = useMemo(() => {
    const category = categories.find((item) =>
      isPromotionCategory(item.id) || isPromotionCategory(item.name)
    );
    return category?.id;
  }, [categories]);

  const promotions = useMemo(
    () => items.filter((item) => item.category === promotionCategoryId),
    [items, promotionCategoryId]
  );

  if (!isLoading && promotions.length === 0) return null;

  return (
    <section id="combos" className="py-20 bg-[#121212] relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
            Promociones
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            Revisa las promociones disponibles en nuestra carta.
          </p>
        </div>

        <CatalogStatus
          isLoading={isLoading && items.length === 0}
          hasError={hasError}
          isOfflineFallback={isOfflineFallback}
          onRetry={retry}
        />

        {promotions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {promotions.map((promotion, index) => (
              <motion.article
                key={promotion.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
                className="group relative bg-[#171717] rounded-3xl border border-white/10 hover:border-[#FACC15]/50 shadow-2xl overflow-hidden transition-all duration-300"
              >
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-black/40">
                  {promotion.image && (
                    <img
                      src={promotion.image}
                      alt={promotion.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-black/40" />

                  {promotion.badge && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-red-400/30 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-300" />
                      <span>{promotion.badge}</span>
                    </div>
                  )}

                  <div className="absolute bottom-4 right-4 bg-[#0D0D0D]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-xl text-right">
                    {promotion.originalPrice != null && promotion.originalPrice > promotion.price && (
                      <span className="text-xs text-gray-400 line-through block font-medium">
                        {formatPriceCLP(promotion.originalPrice)}
                      </span>
                    )}
                    <span className="font-heading text-2xl font-black text-[#FACC15]">
                      {formatPriceCLP(promotion.price)}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white uppercase group-hover:text-[#FACC15] transition-colors">
                    {promotion.name}
                  </h3>
                  {promotion.description && (
                    <p className="text-gray-400 text-sm whitespace-pre-line">
                      {promotion.description}
                    </p>
                  )}
                  {promotion.ingredients.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        Incluye
                      </span>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {promotion.ingredients.map((item, itemIndex) => (
                          <li key={`${promotion.id}-include-${itemIndex}`} className="flex items-start gap-2.5">
                            <span className="text-emerald-400" aria-hidden="true">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {promotions.length > 0 && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => onNavigateToMenu ? onNavigateToMenu() : window.location.assign('/menu')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all"
            >
              Ver carta completa <span className="text-amber-300" aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
