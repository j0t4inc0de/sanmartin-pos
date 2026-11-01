import { motion } from 'framer-motion';
import { Star, MapPin, ExternalLink, CheckCircle2, ThumbsUp } from 'lucide-react';
import { GOOGLE_REVIEWS_DATA, GOOGLE_MAPS_SUMMARY } from '../data/menuData';
import { RESTAURANT_INFO } from '../utils/businessHours';

export const Testimonials = () => {
  return (
    <section id="resenas" className="py-20 bg-[#121212] relative overflow-hidden border-t border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#FACC15]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
            Reseñas Reales
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            Opiniones 100% reales de nuestros clientes en Google Maps. El auténtico sabor sanguchero de Puente Alto respaldado por quienes nos visitan noche a noche.
          </p>

          {/* Google Score Summary Pill */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-6 py-3 rounded-2xl bg-[#181818] border border-white/10 shadow-lg mt-2">
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl sm:text-3xl font-extrabold text-[#FACC15]">
                {GOOGLE_MAPS_SUMMARY.rating}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <span className="text-xs sm:text-sm text-gray-300 font-medium">
              ({GOOGLE_MAPS_SUMMARY.totalReviews} opiniones en Google)
            </span>
            <a
              href={RESTAURANT_INFO.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold underline underline-offset-4 ml-1"
            >
              <span>Ver todas en Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GOOGLE_REVIEWS_DATA.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="bg-[#181818] rounded-3xl border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:border-[#FACC15]/40 transition-all duration-300 group"
            >
              <div className="space-y-3.5">
                
                {/* Author Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0 border border-white/20`}>
                      {item.initials}
                    </div>
                    <div>
                      <h4 className="font-heading text-sm sm:text-base font-bold text-white leading-tight">
                        {item.name}
                      </h4>
                      {item.badge ? (
                        <p className="text-[11px] text-amber-400 font-medium">
                          {item.badge}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400">
                          Cliente verificado
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0">
                    {item.timeAgo}
                  </span>
                </div>

                {/* Rating Stars & Order Type */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {item.orderType && (
                    <span className="text-[11px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md">
                      {item.orderType}
                    </span>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                  "{item.comment}"
                </p>

                {/* Granular Ratings Breakdown (if available) */}
                {item.scores && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 text-[11px] text-gray-400">
                    {item.scores.comida && (
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        Comida: <strong className="text-white">{item.scores.comida}/5</strong>
                      </span>
                    )}
                    {item.scores.servicio && (
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        Servicio: <strong className="text-white">{item.scores.servicio}/5</strong>
                      </span>
                    )}
                    {item.scores.ambiente && (
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        Ambiente: <strong className="text-white">{item.scores.ambiente}/5</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Additional Highlights (parking, wheelchair access, etc.) */}
                {item.highlights && item.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {h}
                      </span>
                    ))}
                  </div>
                )}

              </div>

              {/* Card Footer: Verified on Google Maps */}
              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1 text-gray-400">
                  <MapPin className="w-3 h-3 text-red-500" />
                  Food Truck San Martín
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <ThumbsUp className="w-3 h-3 text-amber-400" />
                  Recomendado
                </span>
              </div>

            </motion.div>
          ))}
        </div>

        {/* Google Maps CTA Card */}
        <div className="mt-12 p-6 rounded-3xl bg-[#161616] border border-white/10 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h4 className="font-heading text-base font-bold text-white uppercase">
                ¿Nos visitaste hace poco?
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Tu opinión nos ayuda a seguir manteniendo la mejor calidad y servicio sanguchero de Puente Alto.
              </p>
            </div>
          </div>
          <a
            href={RESTAURANT_INFO.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <span>Dejar mi opinión en Google</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
};

