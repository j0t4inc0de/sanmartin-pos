import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Navigation, 
  ExternalLink, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
import { RESTAURANT_INFO, useBusinessStatus } from '../utils/businessHours';

export const LocationHours = () => {
  const status = useBusinessStatus();

  const scheduleDays = [
    { day: 'Lunes', hours: 'CERRADO', isClosed: true },
    { day: 'Martes', hours: '18:30 a 23:30 hrs', isClosed: false },
    { day: 'Miércoles', hours: '18:30 a 23:30 hrs', isClosed: false },
    { day: 'Jueves', hours: '18:30 a 23:30 hrs', isClosed: false },
    { day: 'Viernes', hours: '18:30 a 23:30 hrs', isClosed: false },
    { day: 'Sábado', hours: '18:30 a 23:30 hrs', isClosed: false },
    { day: 'Domingo', hours: '18:30 a 23:30 hrs', isClosed: false },
  ];

  return (
    <section id="horarios" className="py-20 bg-[#0D0D0D] relative overflow-hidden border-t border-white/5">
      {/* Background accents */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
            Ubicación & Horarios
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            Encuentra nuestro Food Truck en Av. Gabriela Oriente #01216. ¡Te esperamos con la plancha caliente y los mejores sánguches de la comuna!
          </p>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Schedule & Info */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Live Status Card */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-2xl relative overflow-hidden ${
              status.isOpen
                ? 'bg-gradient-to-br from-[#13231B] via-[#161616] to-[#121212] border-emerald-500/40'
                : 'bg-gradient-to-br from-[#241A13] via-[#161616] to-[#121212] border-amber-500/40'
            }`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3.5 w-3.5">
                    {status.isOpen ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
                    )}
                  </span>
                  <span className={`font-heading text-xl font-bold tracking-wide uppercase ${
                    status.isOpen ? 'text-emerald-400' : 'text-amber-300'
                  }`}>
                    {status.statusText}
                  </span>
                </div>

                <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-300 font-semibold">
                  Estado en vivo
                </span>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {status.statusDetail}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FACC15]" />
                  Próxima apertura: <strong className="text-white">{status.nextOpenText}</strong>
                </span>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#161616] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-heading text-lg uppercase tracking-wider">
                <Calendar className="w-5 h-5 text-[#FACC15]" />
                <span>Horario de Atención Semanal</span>
              </div>

              <div className="divide-y divide-white/5">
                {scheduleDays.map((item, index) => (
                  <div key={index} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-gray-300 flex items-center gap-2">
                      {item.isClosed ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>{item.day}</span>
                    </span>
                    <span className={`font-bold ${
                      item.isClosed ? 'text-red-400' : 'text-[#FACC15]'
                    }`}>
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address & Direct Navigation buttons */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#161616] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading text-lg font-bold text-white uppercase">
                    Dirección Oficial
                  </h4>
                  <p className="text-gray-300 text-sm mt-0.5 font-medium">
                    {RESTAURANT_INFO.address}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Frente a zona residencial y comercial de Av. Gabriela Oriente.
                  </p>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={RESTAURANT_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <Navigation className="w-4 h-4 text-red-400" />
                  <span>Abrir en Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <a
                  href={RESTAURANT_INFO.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <Navigation className="w-4 h-4 text-sky-400" />
                  <span>Abrir en Waze</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>

              {/* Contact info pill */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp / Teléfono:</span>
                </span>
                <span className="font-bold text-white">
                  {RESTAURANT_INFO.phoneFormatted}
                </span>
              </div>

              {/* Delivery & Ordering Shortcuts */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Canales de Delivery & Pedidos
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent('¡Hola Food Truck San Martín! Quiero hacer un pedido.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex flex-col items-center justify-center text-center gap-1 transition-all group"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-white">WhatsApp</span>
                    <span className="text-[9px] text-emerald-400 font-medium">Directo</span>
                  </a>

                  <a
                    href={RESTAURANT_INFO.pedidosYaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 flex flex-col items-center justify-center text-center gap-1 transition-all group"
                  >
                    <ShoppingBag className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-white">PedidosYa</span>
                    <span className="text-[9px] text-red-400 font-medium">Delivery</span>
                  </a>

                  <a
                    href={RESTAURANT_INFO.uberEatsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex flex-col items-center justify-center text-center gap-1 transition-all group"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-white">Uber Eats</span>
                    <span className="text-[9px] text-emerald-400 font-medium">Delivery</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Google Maps Embed Card */}
          <div className="lg:col-span-6 h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-3xl bg-[#161616] border border-white/15 overflow-hidden shadow-2xl h-[560px] flex flex-col"
            >
              {/* Interactive Google Map */}
              <div className="relative flex-1 w-full h-full bg-[#111]">
                <iframe
                  title="Mapa Food Truck Sanguchería San Martín en Puente Alto"
                  src="https://maps.google.com/maps?q=Av.+Gabriela+Oriente+01216,+Puente+Alto,+Regi%C3%B3n+Metropolitana,+Chile&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 filter contrast-125 saturate-125"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Map Footer card overlay */}
              <div className="p-4 bg-[#141414]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#FACC15] shrink-0">
                    <img
                      src="/logo-sanmartin.jpg"
                      alt="Logo Food Truck"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase">
                      Food Truck San Martín
                    </h5>
                    <p className="text-[11px] text-gray-400">
                      Av. Gabriela Oriente #01216
                    </p>
                  </div>
                </div>

                <a
                  href={RESTAURANT_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg shadow-md transition-colors whitespace-nowrap"
                >
                  Ver en Google Maps
                </a>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};
