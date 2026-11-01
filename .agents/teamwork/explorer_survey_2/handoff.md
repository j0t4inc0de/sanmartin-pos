# Explorer Survey 2: Static Assets, Branding & Styling Analysis Report

**Investigator**: Explorer Survey 2  
**Date**: 2026-10-13  
**Target Scope**: Static assets, `public/` directory, brand logo, iconography, imagery, brand colors (`#0D0D0D`, `#DC2626`, `#FACC15`), fonts, CSS/Tailwind v4 architecture, and UI component libraries.

---

## 1. Observation

### A. Static Assets & Directory Inspection

1. **`public/` Directory Contents (`list_dir` on `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\public`):**
   - `public/logo-sanmartin.jpg` (169,416 bytes): Official circular high-resolution logo featuring the brand "Food Truck Sanguchería San Martín".
   - `public/favicon.svg` (9,522 bytes): Default Vite template lightning graphic (purple/blue fill `#863bff`). Not currently linked or used.
   - `public/icons.svg` (5,031 bytes): Default Vite/template SVG sprite defining symbols (`bluesky-icon`, `discord-icon`, `documentation-icon`, `github-icon`, `social-icon`, `x-icon`). Not currently referenced anywhere in `src/`.

2. **`src/assets/` Directory Contents (`list_dir` on `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\src\assets`):**
   - `src/assets/logo-sanmartin.jpg` (169,416 bytes): Duplicate copy of `public/logo-sanmartin.jpg`.
   - `src/assets/hero.png` (13,057 bytes): An unused raster image asset.
   - `src/assets/typescript.svg` (1,303 bytes) and `src/assets/vite.svg` (8,709 bytes): Default Vite template assets.

3. **Logo Referencing Across Codebase:**
   The circular logo `/logo-sanmartin.jpg` (served from `public/`) is referenced in:
   - `index.html` (Line 5): `<link rel="icon" type="image/jpeg" href="/logo-sanmartin.jpg" />`
   - `src/components/Navbar.tsx` (Line 68): `<img src="/logo-sanmartin.jpg" alt="Food Truck San Martín Logo" ... />`
   - `src/components/Hero.tsx` (Line 204): `<img src="/logo-sanmartin.jpg" alt="Food Truck Sanguchería San Martín" ... />`
   - `src/components/AboutFeatures.tsx` (Line 118): `<img src="/logo-sanmartin.jpg" alt="Sello de Calidad Food Truck San Martín" ... />`
   - `src/components/LocationHours.tsx` (Line 222): `<img src="/logo-sanmartin.jpg" alt="Logo Food Truck" ... />`
   - `src/components/Footer.tsx` (Line 28): `<img src="/logo-sanmartin.jpg" alt="Food Truck San Martín" ... />`
   - `src/components/FloatingWhatsApp.tsx` (Line 26): `<img src="/logo-sanmartin.jpg" alt="Logo" ... />`

4. **Product and Menu Images:**
   All food, sandwich, combo, and testimonial avatar images are managed in `src/data/menuData.ts` via high-resolution Unsplash URLs optimized with query parameters (`?q=80&w=900&auto=format&fit=crop`):
   - Churrascos: 4 items (Lines 23, 34, 45, 55)
   - Mechadas: 3 items (Lines 68, 79, 89)
   - Lomitos: 3 items (Lines 101, 112, 122)
   - Completos & Ases: 4 items (Lines 134, 145, 155, 166)
   - Papas Fritas: 3 items (Lines 178, 189, 199)
   - Bebidas: 3 items (Lines 211, 221, 231)
   - Combos: 4 packages (Lines 250, 266, 281, 296)
   - Testimonial Avatars: 4 client portraits (Lines 308, 317, 326, 335)

---

### B. Brand Colors & Palette Tokens

1. **Brand Theme Definitions in `src/index.css` (Lines 3–16):**
   ```css
   @theme {
     --color-brand-dark: #0d0d0d;
     --color-brand-charcoal: #141414;
     --color-brand-card: #1a1a1a;
     --color-brand-card-hover: #222222;
     --color-brand-border: #2a2a2a;
     --color-brand-red: #dc2626;
     --color-brand-red-hover: #ef4444;
     --color-brand-red-dark: #991b1b;
     --color-brand-yellow: #facc15;
     --color-brand-gold: #eab308;
     --font-heading: 'Oswald', sans-serif;
     --font-sans: 'Plus Jakarta Sans', sans-serif;
   }
   ```

2. **Core Color Roles in UI:**
   - **Deep Black Background (`#0D0D0D`)**: Set on `body` in `index.html` (Line 13), `src/index.css` (Line 23), `src/App.tsx` (Line 89), and sections (`Hero`, `MenuSection`). Card elevations use charcoal steps: `#141414`, `#161616`, `#171717`, `#181818`.
   - **Appetizing Crimson Red (`#DC2626`)**: Primary CTA buttons, `AnnouncementBar` gradient (`from-[#DC2626] via-[#B91C1C] to-[#991B1B]`), active category tab pill background, animated pulse rings, badges, text selection color (`selection:bg-[#DC2626]`).
   - **Warm Golden-Yellow (`#FACC15` / `#EAB308`)**: Category badges, pricing highlights (`text-[#FACC15]`), star ratings, logo borders (`border-[#FACC15]`, `border-[#EAB308]`), text accent gradients (`text-gradient-gold`), and combo savings tags.
   - **Complementary System Colors**:
     - Emerald Green (`#10B981` / `#059669`): WhatsApp floating button, live status badge indicator (`isOpen: true`), success/confirmation state.
     - Channel Brands: PedidosYa Red (`#EA0029`), Uber Eats Green (`#06C167`).

3. **Custom Glow & Gradient Utilities (`src/index.css` Lines 34–58):**
   - `.glow-red`: `box-shadow: 0 0 25px -5px rgba(220, 38, 38, 0.45);`
   - `.glow-red-lg`: `box-shadow: 0 0 45px -5px rgba(220, 38, 38, 0.6);`
   - `.glow-yellow`: `box-shadow: 0 0 25px -5px rgba(250, 204, 21, 0.45);`
   - `.text-gradient-red`: `linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #facc15 100%)`
   - `.text-gradient-gold`: `linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)`

---

### C. Typography & Font Imports

1. **Google Fonts Import (`index.html` Lines 9–11):**
   - `<link rel="preconnect" href="https://fonts.googleapis.com">`
   - `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
   - `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">`

2. **Font Mappings:**
   - **Headings**: `Oswald` (weights 500, 600, 700), assigned to `.font-heading` (`font-family: 'Oswald', sans-serif; letter-spacing: 0.02em;` in `src/index.css` Line 29). Used on all section titles, product titles, prices, and logos.
   - **Body/UI**: `Plus Jakarta Sans` (weights 400, 500, 600, 700, 800), set as primary default font on `body` (`src/index.css` Line 25).

---

### D. CSS & Tailwind Configuration

1. **Tailwind Version**: Tailwind CSS v4.3.3 (`tailwindcss: ^4.3.3`, `@tailwindcss/vite: ^4.3.3`).
2. **Vite Integration (`vite.config.ts` Lines 1–7):**
   ```ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'

   export default defineConfig({
     plugins: [react(), tailwindcss()],
   })
   ```
3. **No Legacy `tailwind.config.js`**: Tailwind v4 uses the modern engine with `@import "tailwindcss";` and `@theme { ... }` in CSS, eliminating the need for an external JS configuration file.
4. **Layout Protection**:
   - `html { scroll-behavior: smooth; }` (smooth internal navigation).
   - `body { overflow-x: hidden; }` (prevents horizontal viewport overflow on mobile).
   - Custom styled dark scrollbar with crimson hover thumb (`src/index.css` Lines 59–72).

---

### E. UI Libraries, Animations & Iconography

1. **Icon Library**: `lucide-react` (v1.56.0).
   - Icons used: `Flame`, `Sparkles`, `Star`, `Heart`, `UtensilsCrossed`, `Utensils`, `ShieldCheck`, `MapPin`, `Clock`, `Truck`, `ShoppingBag`, `Plus`, `Minus`, `Trash2`, `Check`, `CheckCircle2`, `X`, `MessageCircle`, `ExternalLink`, `Search`, `Menu`, `Users`, `Tag`, `Quote`, `Info`.
   - SVG icons are styled with Tailwind classes (`w-4 h-4 text-[#FACC15]`, etc.).
2. **Animation Library**: `framer-motion` (v14.2.0).
   - Used for hero entrance stagger, responsive mobile drawer slide-out (`CartDrawer`), animated layout tabs (`MenuSection`), and scroll reveals (`CombosSection`, `Testimonials`).
3. **Confetti Effect**: `canvas-confetti` (v1.9.4).
   - Fired in `CartDrawer.tsx` (Lines 45–50) with brand colors `['#DC2626', '#FACC15', '#FFFFFF', '#10B981']` when placing order via WhatsApp.
4. **Utility Packages**: `clsx` (v2.1.1), `tailwind-merge` (v3.7.0).

---

### F. Build & Verification Status

- Command: `npm run build` (`tsc && vite build`)
- Output:
  ```
  vite v8.3.4 building client environment for production...
  transforming...
  ✓ 2334 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   1.11 kB │ gzip:   0.61 kB
  dist/assets/index-DUFPk58j.css   64.66 kB │ gzip:  10.13 kB
  dist/assets/index-DZApOr5a.js   471.95 kB │ gzip: 143.06 kB
  ✓ built in 977ms
  ```
- Exit Code: 0 (Zero errors, zero warnings).

---

## 2. Logic Chain

1. **Observation**: `public/logo-sanmartin.jpg` exists with size 169 KB, and all components reference `/logo-sanmartin.jpg`.
   **Reasoning**: Because Vite automatically copies everything from `public/` into the root of `dist/` and serves it from the root URL (`/logo-sanmartin.jpg`), all references in `Navbar`, `Hero`, `AboutFeatures`, `LocationHours`, `Footer`, `FloatingWhatsApp`, and `index.html` resolve properly in development and production builds without broken image paths.

2. **Observation**: `public/icons.svg` and `public/favicon.svg` contain Vite/Bluesky/Discord template assets and are not imported anywhere in the codebase.
   **Reasoning**: The landing page uses `lucide-react` directly for SVG rendering and `/logo-sanmartin.jpg` for the favicon. The leftover SVGs in `public/` and template SVGs in `src/assets/` are legacy template scaffolding. While harmless, they can be pruned if a strict minimal asset footprint is desired.

3. **Observation**: Brand color tokens `#0D0D0D`, `#DC2626`, `#FACC15` are defined in `src/index.css` `@theme` block and consistently applied across all components via Tailwind classes and inline styles.
   **Reasoning**: The visual theme fulfills R1 and brand consistency guidelines. The combination of deep dark background (`#0D0D0D`), crimson accents (`#DC2626`), and golden highlights (`#FACC15`) creates a cohesive food-truck brand identity.

4. **Observation**: Fonts `Plus Jakarta Sans` and `Oswald` are imported from Google Fonts in `index.html` and bound in `src/index.css`.
   **Reasoning**: Typography is decoupled into modern clean body text (`Plus Jakarta Sans`) and bold, energetic, condensed headings (`Oswald`).

5. **Observation**: `npm run build` succeeds in under 1 second with 0 errors.
   **Reasoning**: The TypeScript definitions, Tailwind v4 compiler, and Vite bundler are fully compatible and functioning as expected.

---

## 3. Caveats

- **External Network Assets**: Menu item images, combo photos, and client avatars in `src/data/menuData.ts` rely on external Unsplash CDN URLs. While reliable and high resolution, if complete offline capability is required in the future, these images would need to be downloaded locally into `public/images/`.
- **Duplicate Logo**: `src/assets/logo-sanmartin.jpg` is an exact duplicate of `public/logo-sanmartin.jpg`. Components only consume the `public/` version.
- **Unused Template Files**: `public/icons.svg`, `public/favicon.svg`, `src/assets/hero.png`, `src/assets/vite.svg`, and `src/assets/typescript.svg` remain in the repo from initial project initialization.

---

## 4. Conclusion

The visual assets, branding, and styling infrastructure of the "Food Truck Sanguchería San Martín" landing page are in an excellent, robust state:
1. **Logo & Favicon**: The official circular logo `public/logo-sanmartin.jpg` is properly implemented in the browser tab favicon and across 7 key visual anchor points throughout the UI.
2. **Brand Colors**: The requested `#0D0D0D` (deep black), `#DC2626` (appetizing crimson red), and `#FACC15` (warm golden-yellow) are established as first-class tokens in Tailwind v4 `@theme` and pervasive across all components.
3. **Typography**: Google Fonts `Oswald` and `Plus Jakarta Sans` are correctly imported and applied.
4. **UI Libraries & Motion**: `lucide-react`, `framer-motion`, and `canvas-confetti` are fully integrated with zero runtime conflicts.
5. **Build Integrity**: The project builds cleanly with `npx vite build` (exit code 0) and generates an optimized production bundle in `dist/`.

---

## 5. Verification Method

To independently verify the observations and findings in this report:

1. **Verify Asset Files**:
   ```powershell
   Get-Item "public/logo-sanmartin.jpg"
   Get-ChildItem "public"
   ```
2. **Verify Brand References & Colors in Source**:
   ```powershell
   Select-String -Path "src/index.css" -Pattern "#0d0d0d|#dc2626|#facc15"
   Select-String -Path "src/components/*.tsx" -Pattern "logo-sanmartin.jpg"
   ```
3. **Verify Build & Bundle Output**:
   ```powershell
   npm run build
   Test-Path "dist/logo-sanmartin.jpg"
   ```
4. **Invalidation Conditions**:
   - If `/logo-sanmartin.jpg` fails to load or returns HTTP 404.
   - If `npm run build` fails with TypeScript or CSS errors.
   - If brand colors differ from `#0D0D0D`, `#DC2626`, and `#FACC15`.
