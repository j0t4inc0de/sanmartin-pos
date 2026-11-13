import { 
  MessageCircle, 
  MapPin, 
  Clock, 
  Heart, 
  ExternalLink 
} from 'lucide-react';
import { RESTAURANT_INFO } from '../utils/businessHours';

export const Footer = () => {
  const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(
    '¡Hola Food Truck San Martín! Quiero hacer una consulta.'
  )}`;

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/10 text-gray-400 relative overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                <img
                  src="/logo-sanmartin.jpg"
                  alt="Food Truck San Martín"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-heading text-xl font-bold uppercase text-white tracking-wider block">
                  San Martín
                </span>
                <span className="text-xs text-red-500 font-semibold tracking-widest uppercase">
                  Food Truck • Auténtico Sabor
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              El food truck sanguchero favorito de Puente Alto. Carne de primera cocinada a la plancha, pan crujiente y palta fresca en porciones gigantes.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={RESTAURANT_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-[#FACC15] transition-colors"
                aria-label="Instagram de San Martín"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-emerald-400 transition-colors"
                aria-label="WhatsApp de San Martín"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#inicio" className="hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/menu" className="hover:text-white transition-colors">
                  Carta & Menú
                </a>
              </li>
              <li>
                <a href="#combos" className="hover:text-white transition-colors">
                  Combos & Promociones
                </a>
              </li>
              <li>
                <a href="#nosotros" className="hover:text-white transition-colors">
                  Por Qué Elegirnos
                </a>
              </li>
              <li>
                <a href="#horarios" className="hover:text-white transition-colors">
                  Ubicación & Horarios
                </a>
              </li>
              <li>
                <a href="#resenas" className="hover:text-white transition-colors">
                  Reseñas
                </a>
              </li>
            </ul>
          </div>

          {/* Delivery Platforms */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
              Canales de Pedido
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>WhatsApp Directo (+56 9 8329 4514)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href={RESTAURANT_INFO.pedidosYaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <span>PedidosYa</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href={RESTAURANT_INFO.uberEatsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Uber Eats</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="#horarios"
                  className="hover:text-amber-300 transition-colors"
                >
                  Retiro Presencial en Food Truck
                </a>
              </li>
            </ul>
          </div>

          {/* Location & Hours */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
              Datos del Local
            </h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{RESTAURANT_INFO.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-white font-medium">
                    Martes a Domingo: 18:30 - 23:30 hrs
                  </span>
                  <span className="text-red-400 font-semibold block">
                    Lunes CERRADO ❌
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with Credits */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} Food Truck Sanguchería San Martín. Todos los derechos reservados. Puente Alto, Chile.
          </p>

          <p className="flex items-center gap-1">
            <span>Desarrollado con</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>por</span>
            <a
              href="https://www.wearesamod.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 font-bold hover:text-[#FACC15] transition-colors inline-flex items-center"
            >
              We Are Samod
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
};
