# Original User Request

## 2026-10-13T20:03:11Z

Build a modern, responsive, high-performance Landing Page for "Food Truck Sanguchería San Martín" located in Puente Alto, Chile, with an interactive Chilean sandwich menu, live open/closed status indicator, one-click WhatsApp order builder, combos section, map navigation, and delivery shortcuts.

Working directory: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing
Integrity mode: development

## Requirements

### R1. Brand Identity & Visual Polish
- Incorporate the official circular logo from `public/logo-sanmartin.jpg`.
- Apply the brand's distinct color theme: deep black background (`#0D0D0D`), appetizing crimson red accents (`#DC2626`), and warm golden-yellow highlights (`#FACC15`).
- Use open-source UI components and animations (Framer Motion, Aceternity UI, Tailwind) ensuring fluid 60 FPS transitions and micro-interactions on buttons, cards, and interactive tabs.

### R2. Interactive Sandwich Menu & Custom WhatsApp Order Builder
- Categorized sandwich menu (Churrascos, Mechadas, Lomitos, Completos & Ases, Papas Fritas, Bebidas) with Chilean ingredients (palta fresca, tomate, mayo casera, chucrut, queso fundido) and CLP prices.
- Full interactive order builder: users can select items, customize extras/options, and click a primary button that pre-formats and sends the complete order directly to the official WhatsApp (+56 9 8329 4514) with one click.

### R3. Combos & Family Promotions Section
- Feature dedicated promotion cards for combos (e.g., Combos Dobles, Pack Amigos/Familia con papas fritas y bebidas) designed to maximize average ticket size.

### R4. Real-time Status, Schedule & Interactive Map
- Dynamic business status indicator: calculates and shows live whether the food truck is ABIERTO or CERRADO based on the current schedule (Tuesday–Sunday 18:30–23:30, Monday closed).
- Embedded interactive map and direct navigation buttons (Google Maps & Waze) for Av. Gabriela Oriente #01216, Puente Alto, Chile.
- Quick action links for delivery channels: WhatsApp Direct, PedidosYa, and Uber Eats.

## Acceptance Criteria

### Technical & Verification
- [ ] Automated build (`npx vite build`) executes cleanly with 0 errors and 0 fatal warnings.
- [ ] Responsive design functions without horizontal overflow across mobile (375px+), tablet, and desktop viewports.
- [ ] The WhatsApp order builder formats the message string correctly and triggers the proper `https://wa.me/56983294514?text=...` URI.
- [ ] The open/closed badge dynamically evaluates current Chilean time (18:30 to 23:30, Tue-Sun).
- [ ] All brand assets (logo, icons, images) render cleanly without broken links.
