import { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, MessageCircle, Clock, MapPin, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBusinessStatus, RESTAURANT_INFO } from '../utils/businessHours';

// Scalable Feature Flag for Phase 2:
// Set to true when Online Cart & Checkout is enabled.
const ENABLE_ONLINE_CART = false;

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
  onNavigateToMenu?: () => void;
}

export const Navbar = ({ cartCount = 0, onOpenCart, onNavigateToMenu }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const status = getBusinessStatus();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Menú', href: '/menu', isRoute: true },
    { name: 'Porque elegirnos', href: '#nosotros' },
    { name: 'Ubicación & Horarios', href: '#horarios' },
    { name: 'Reseñas', href: '#resenas' },
  ];

  const handleNavClick = (href: string, isRoute?: boolean) => {
    setMobileMenuOpen(false);
    if (isRoute || href === '/menu') {
      onNavigateToMenu?.();
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodeURIComponent(
    '¡Hola Food Truck San Martín! Quiero hacer un pedido.'
  )}`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0D0D0D]/95 backdrop-blur-md shadow-xl border-b border-white/10 py-1.5 sm:py-2'
          : 'bg-[#0D0D0D]/85 backdrop-blur-sm border-b border-white/5 py-2 sm:py-2.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand Identity (Compact & Elegant) */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#inicio');
            }}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="relative">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[#EAB308] shadow-[0_0_12px_rgba(234,179,8,0.35)] group-hover:shadow-[0_0_18px_rgba(220,38,38,0.6)] transition-all duration-300">
                <img
                  src="/logo-sanmartin.jpg"
                  alt="Food Truck San Martín Logo"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0D0D0D] rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg sm:text-xl font-bold tracking-wider text-white uppercase group-hover:text-[#FACC15] transition-colors leading-tight">
                San Martín
              </span>
              <span className="text-[9px] sm:text-[10px] text-red-500 font-semibold tracking-wider uppercase">
                Food Truck • Puente Alto
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href, link.isRoute);
                }}
                className="px-2.5 py-1 text-xs xl:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Cart Button (Phase 2 feature flag - hidden by default) */}
            {ENABLE_ONLINE_CART && (
              <button
                onClick={onOpenCart}
                aria-label="Abrir carrito de pedidos"
                className="relative p-2 sm:p-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 hover:border-[#FACC15]/40 text-gray-200 transition-all duration-200 flex items-center justify-center group cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-200 group-hover:text-[#FACC15] transition-colors" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0D0D0D] shadow-md"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>
            )}

            {/* Carta QR Quick Link (Visible only on mobile) */}
            <a
              href="/menu"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToMenu?.();
              }}
              className="inline-flex lg:hidden items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#FACC15] text-xs sm:text-sm font-bold border border-amber-500/30 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Ver Carta Digital rápida para QR"
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FACC15]" />
              <span>Carta QR</span>
            </a>

            {/* WhatsApp CTA Button (Visible on PC, hidden on mobile header) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex relative items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.7)] transform active:scale-95 transition-all duration-200"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-transparent" />
              <span>Pide por WhatsApp</span>
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-[#141414] border-b border-white/10 overflow-hidden"
          >
            <div className="px-5 pt-3 pb-6 space-y-3">
              {/* Status info bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FACC15]" />
                  <span>Mar a Dom: 18:30 - 23:30</span>
                </div>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                    status.isOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {status.statusText}
                </span>
              </div>

              {/* Navigation Links */}
              <div className="grid grid-cols-1 gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href, link.isRoute);
                    }}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:text-[#FACC15] hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span>{link.name}</span>
                    <span className="text-gray-500 text-xs">→</span>
                  </a>
                ))}
              </div>

              {/* Direct Address & Quick Actions */}
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateToMenu?.();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#FACC15] text-center font-bold text-sm border border-amber-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#FACC15]" />
                  <span>Abrir Carta Digital (Modo QR)</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-gray-400 px-1 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{RESTAURANT_INFO.shortAddress}</span>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white text-center font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                  <span>Pedir directo por WhatsApp (+56 9 8329 4514)</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
