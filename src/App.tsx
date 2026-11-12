import { useState, useEffect } from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutFeatures } from './components/AboutFeatures';
import { CombosSection } from './components/CombosSection';
import { LocationHours } from './components/LocationHours';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { QrMenuPage } from './components/QrMenuPage';
import { PosPage } from './components/PosPage';
import { AppearanceControls } from './components/AppearanceControls';
import { PosDialogProvider } from './components/PosDialogs';
import { CartItem, ComboItem } from './types';

// ponytail: removed UnderConstruction maintenance gate so full landing and QR menu are live

type AppRoute = 'home' | 'menu' | 'pos';

function getRouteFromLocation(): AppRoute {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path === '/pos' || path.startsWith('/pos/')) return 'pos';
  if (path === '/menu' || path.startsWith('/menu/') || hash === '#/menu' || hash === '#menu') {
    return 'menu';
  }
  return 'home';
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getRouteFromLocation);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(getRouteFromLocation());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: AppRoute) => {
    const paths: Record<AppRoute, string> = {
      home: '/',
      menu: '/menu',
      pos: '/pos',
    };
    window.history.pushState(null, '', paths[route]);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddComboToCart = (combo: ComboItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === combo.id);
      if (existing) {
        return prev.map((i) =>
          i.id === combo.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: combo.id,
          name: combo.name,
          price: combo.price,
          quantity: 1,
          image: combo.image,
          type: 'combo',
        },
      ];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  if (currentRoute === 'menu') {
    return <QrMenuPage onNavigateHome={() => navigateTo('home')} />;
  }

  if (currentRoute === 'pos') {
    return <PosDialogProvider><PosPage /><AppearanceControls /></PosDialogProvider>;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex flex-col selection:bg-[#DC2626] selection:text-white">
      {/* Top Ticker with live opening info */}
      <AnnouncementBar />

      {/* Main Navbar */}
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigateToMenu={() => navigateTo('menu')}
      />

      {/* Main Content Sections: 1: Por Qué Elegirnos, 2: Combos, 3: Ubicación & Horarios, 4: Reseñas */}
      <main className="flex-1">
        <Hero onNavigateToMenu={() => navigateTo('menu')} />
        <AboutFeatures />
        <CombosSection
          onAddComboToCart={handleAddComboToCart}
          onNavigateToMenu={() => navigateTo('menu')}
        />
        <LocationHours />
        <Testimonials />
      </main>

      {/* Footer */}
      <Footer />

      {/* Slide-over interactive WhatsApp Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Persistent Floating WhatsApp with Status */}
      <FloatingWhatsApp />
    </div>
  );
}
