# Project: Food Truck Sanguchería San Martín Landing Page

## Architecture
Modern, responsive single-page application built with React 19, TypeScript, Vite 8, Tailwind CSS v4, and Framer Motion:
- **Presentation Layer**: High-contrast dark theme (`#0D0D0D`, `#DC2626`, `#FACC15`), responsive layout (375px+ to desktop), 60 FPS Framer Motion micro-interactions.
- **Domain Layer**:
  - `src/utils/businessHours.ts`: Pure function evaluating business schedule against `America/Santiago` timezone (Tue–Sun 18:30–23:30, Mon closed).
  - `src/data/menuData.ts`: Authentic Chilean sandwich catalog (Churrascos, Mechadas, Lomitos, Completos & Ases, Papas Fritas, Bebidas), Combos, and Chilean Extras catalog (`CHILEAN_EXTRAS`).
  - `src/types/index.ts`: Strongly typed models (`MenuItem`, `ComboPackage`, `ExtraItem`, `CartItem`, `BusinessStatus`, `DeliveryChannel`).
- **Interactive State Layer**:
  - React cart context / state managing items, quantities, item-level customized extras, delivery mode, customer notes.
  - WhatsApp order encoder generating `https://wa.me/56983294514?text=...` URI.
- **Testing Layer**:
  - Standalone Node/Vitest test runner validating Tiers 1-4 (schedule timestamps, WhatsApp URI encoding, menu & cart logic, build integrity, viewport responsiveness).

## Code Layout
```
src/
├── assets/                  # Brand graphics & icons
├── components/              # UI components
│   ├── AnnouncementBar.tsx  # Dynamic banner with live schedule pill
│   ├── Navbar.tsx           # Sticky navigation with logo & cart button
│   ├── Hero.tsx             # Visual hook, CTA, badges, ambient glow
│   ├── MenuSection.tsx      # Categorized tabs, search, item customization modal
│   ├── CombosSection.tsx    # Promotion cards to maximize ticket size
│   ├── AboutFeatures.tsx    # Quality pillars & Chilean authenticity
│   ├── LocationHours.tsx    # Interactive map, GPS buttons, 7-day schedule
│   ├── DeliveryChannels.tsx # WhatsApp Direct, PedidosYa, Uber Eats
│   ├── Testimonials.tsx     # Local customer social proof
│   ├── Footer.tsx           # Navigation, links, hours, copyright
│   ├── CartDrawer.tsx       # Slide-out cart, extras breakdown, WhatsApp checkout
│   └── FloatingWhatsApp.tsx # Floating WhatsApp CTA with live hours tooltip
├── data/
│   └── menuData.ts          # Menu items, extras catalog, combos, testimonials
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── businessHours.ts     # Chilean timezone calculation & helpers
├── index.css                # Tailwind v4 @theme, custom glow, fonts
└── App.tsx                  # Root component & cart state provider
public/
└── logo-sanmartin.jpg       # Circular brand logo asset (169 KB)
tests/                       # E2E & unit test scripts
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Circular Brand Logo Integration | `public/logo-sanmartin.jpg` integrated into favicon, navbar, hero, about, location, footer, and floating button with clean rendering | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Brand Color Theme & Styling | Deep black background (`#0D0D0D`), crimson red (`#DC2626`), and golden yellow (`#FACC15`) with Tailwind v4 `@theme` and custom glow utilities | M1 | ORIGINAL_REQUEST §R1 |
| F3 | 60 FPS Motion & Polish | Framer Motion transitions, responsive drawer slide, animated category tabs, hover effects, canvas-confetti on checkout | M1 | ORIGINAL_REQUEST §R1 |
| F4 | Responsive Viewport Design | Zero horizontal overflow across mobile (375px+), tablet (768px), and desktop (1024px, 1440px) | M1 | ORIGINAL_REQUEST §Acceptance |
| F5 | Chilean Timezone Schedule Engine | Pure function calculating ABIERTO/CERRADO in `America/Santiago` timezone (Tue–Sun 18:30–23:30, Mon closed) accepting `now: Date` | M2 | ORIGINAL_REQUEST §R4 |
| F6 | Live Status Indicator & Schedule Display | Dynamic status badges, next opening countdown, and full 7-day schedule breakdown | M2 | ORIGINAL_REQUEST §R4 |
| F7 | Interactive Map & GPS Navigation | Google Maps interactive embed for Av. Gabriela Oriente #01216, Puente Alto, plus direct Google Maps and Waze navigation buttons | M2 | ORIGINAL_REQUEST §R4 |
| F8 | Delivery Channels | Shortcuts for WhatsApp Direct (+56 9 8329 4514), PedidosYa, and Uber Eats | M2 | ORIGINAL_REQUEST §R4 |
| F9 | Categorized Chilean Sandwich Menu | Churrascos, Mechadas, Lomitos, Completos & Ases, Papas Fritas, Bebidas with Chilean ingredients and CLP prices | M3 | ORIGINAL_REQUEST §R2 |
| F10 | Chilean Extras & Item Customizer | Interactive selection of Chilean extras (palta fresca, queso fundido, mayo casera, salsa verde, ají, etc.) with CLP pricing | M3 | ORIGINAL_REQUEST §R2 |
| F11 | Combos & Family Promotions | Dedicated promo cards (Combos Dobles, Pack Amigos/Familia con papas fritas y bebidas) to maximize ticket size | M3 | ORIGINAL_REQUEST §R3 |
| F12 | Custom WhatsApp Order Builder | Dynamic cart with itemized extras, delivery vs pickup mode, customer address/notes, and 1-click WhatsApp link `https://wa.me/56983294514?text=...` | M3 | ORIGINAL_REQUEST §R2 |
| F13 | Opaque-Box E2E Test Suite | Comprehensive automated tests across Tiers 1-4 (timestamp vectors, WhatsApp encoding, build, responsiveness, negative cases) | E2E Track | ORIGINAL_REQUEST §Acceptance |
| F14 | 100% E2E Pass & Adversarial Hardening | Verification that all tests pass and adversarial edge cases (DST, injection, cart overflow) are bulletproof | Final Milestone | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Design & implement comprehensive automated test suite (Tiers 1-4), test runner, and publish `TEST_READY.md` | none | IN_PROGRESS |
| M1 | Brand Identity, Visual Polish & Layout | Features F1, F2, F3, F4: Logo, Tailwind theme, responsive shell, typography, Framer Motion polish | none | PLANNED |
| M2 | Chilean Schedule Engine & Map Navigation | Features F5, F6, F7, F8: `America/Santiago` schedule logic, live status badge, GPS buttons, Google Maps embed | none | PLANNED |
| M3 | Menu, Combos & WhatsApp Order Builder | Features F9, F10, F11, F12: Categorized menu, extras customization, combos, cart drawer, WhatsApp URI generator | M1, M2 | PLANNED |
| Final | 100% E2E Pass & Adversarial Hardening | Feature F14: Pass all E2E tests (Tiers 1-4) and complete Tier 5 white-box adversarial hardening | E2E, M1, M2, M3 | PLANNED |

## Interface Contracts

### 1. Schedule Engine Contract (`src/utils/businessHours.ts`)
```ts
export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
  statusDetail: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  nextOpenText: string;
}

export function getBusinessStatus(now?: Date): BusinessStatus;
```

### 2. Menu & Extras Contract (`src/types/index.ts` & `src/data/menuData.ts`)
```ts
export interface ExtraItem {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'churrascos' | 'mechadas' | 'lomitos' | 'completos' | 'papas' | 'bebidas';
  price: number;
  description: string;
  ingredients: string[];
  image: string;
  badge?: string;
  popular?: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
  selectedExtras?: ExtraItem[];
  type: 'menu' | 'combo';
}
```

### 3. WhatsApp Order URI Generator Contract
```ts
export function buildWhatsAppOrderUrl(params: {
  cartItems: CartItem[];
  subtotal: number;
  deliveryType: 'delivery' | 'pickup';
  customerName: string;
  customerAddress?: string;
  customerNotes?: string;
  phone?: string; // Default: '56983294514'
}): string;
```
Expected output:
`https://wa.me/56983294514?text=...` with valid URI percent-encoding.
