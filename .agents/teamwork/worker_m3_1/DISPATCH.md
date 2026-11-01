# Dispatch: Worker M3 (worker_m3_1)

**Role**: Implementation Worker (Milestone 3: Interactive Menu, Chilean Extras & WhatsApp Order Builder)
**Working Directory**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_m3_1
**Authoritative Request**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Architecture**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\orchestrator_1\PROJECT.md
**Domain Specifications**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md

## Write Ownership
Exclusively owns:
- `src/types/index.ts`
- `src/data/menuData.ts`
- `src/components/MenuSection.tsx`
- `src/components/CartDrawer.tsx`
- `src/components/CombosSection.tsx`
- `src/App.tsx` (cart state management)
MUST NOT modify files owned by M2 (`src/utils/businessHours.ts`, `LocationHours.tsx`, `AnnouncementBar.tsx`) or E2E (`tests/`).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Implement features F9, F10, F11, F12:
1. **Chilean Extras Catalog & Types (`src/types/index.ts` & `src/data/menuData.ts`)**:
   - Define `ExtraItem` interface: `{ id: string; name: string; price: number }`.
   - Update `CartItem` interface to include optional `selectedExtras?: ExtraItem[]`.
   - Export `CHILEAN_EXTRAS: ExtraItem[]` in `menuData.ts`:
     * Palta Hass Extra ($1.000)
     * Queso Mantecoso Fundido Extra ($900)
     * Mayonesa Casera San Martín Extra ($500)
     * Salsa Verde Chilena ($500)
     * Ají Verde en Rodajas ($400)
     * Cebolla Caramelizada ($700)
     * Tocino Ahumado Crocante ($900)
     * Porción Extra de Carne / Doble Carne ($1.800)
2. **Interactive Item Customizer in `MenuSection.tsx`**:
   - For sandwiches/items, allow users to select extras before adding to cart (e.g., an interactive customization modal or expandable options accordion with checkboxes/chips showing extra prices).
   - Show selected extras and updated total price per sandwich.
   - When added, the item is pushed to cart with its `selectedExtras`.
   - Direct WhatsApp order button on individual items should also incorporate selected extras if customized.
3. **Cart Drawer Enhancements (`CartDrawer.tsx`)**:
   - Render itemized selected extras underneath each cart item with their individual CLP prices.
   - Accurately calculate item total: `(item.price + sum(extras.price)) * quantity`.
   - Accurately calculate cart subtotal and order total in CLP.
   - Support Delivery (with Puente Alto address input) vs Retiro en Food Truck mode.
   - Customer name input and special instructions / notes input.
4. **WhatsApp Order Builder (`CartDrawer.tsx`)**:
   - Pre-format structured message with:
     * Header: `¡Hola Food Truck San Martín! 🍔🔥\nQuiero hacer el siguiente pedido:\n\n`
     * Item list with quantity, name, price, and itemized extras (`↳ Extras: Palta Hass Extra (+$1.000), ...`)
     * Combos breakdown
     * `💰 *Total del Pedido:* $X.XXX`
     * `🛵 *Modalidad:* Delivery a Domicilio (Puente Alto) / Retiro en Food Truck`
     * `👤 *Cliente:* [Nombre]`
     * `📍 *Dirección de Entrega:* [Dirección]` (if delivery)
     * `📝 *Observaciones/Notas:* [Notas]` (if any)
     * Closing: `¿Me confirman disponibilidad y tiempo estimado de entrega/retiro? ¡Muchas gracias!`
   - Correctly percent-encode URL targeting `https://wa.me/56983294514?text=...`.
   - Ensure `#`, `&`, linebreaks `%0A`, and emojis are properly encoded via `encodeURIComponent`.
5. **Combos Section (`CombosSection.tsx`)**:
   - Verify all 4 combos can be added to cart or ordered directly via WhatsApp.
6. **Build Verification**:
   - Execute `npm run build` (`tsc && vite build`) and ensure 0 errors and 0 type warnings.
   - Document changes in `handoff.md`.


## 2026-10-13T20:33:51Z
You are Worker M3 (worker_m3_1).
Working Directory: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_m3_1
Project Root: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing
Authoritative Request: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md
Dispatch: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_m3_1\DISPATCH.md
Domain Specifications: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership:
You exclusively own:
- src/types/index.ts
- src/data/menuData.ts
- src/components/MenuSection.tsx
- src/components/CartDrawer.tsx
- src/components/CombosSection.tsx
- src/App.tsx
DO NOT modify files owned by M2 (src/utils/businessHours.ts, LocationHours.tsx, AnnouncementBar.tsx) or tests/.

Task:
1. Add ExtraItem interface in src/types/index.ts and update CartItem to include selectedExtras?: ExtraItem[].
2. Export CHILEAN_EXTRAS list in src/data/menuData.ts with authentic Chilean add-ons (Palta Hass, Queso Mantecoso, Mayo Casera, Salsa Verde, Ají Verde, Cebolla Caramelizada, Tocino, Doble Carne) and CLP prices.
3. In MenuSection.tsx, provide an interactive extra selection modal/drawer or expandable options so users can customize sandwiches with extras before adding to cart.
4. In CartDrawer.tsx, display selected extras under cart items, calculate total as (item.price + sum(extras)) * quantity, and format the WhatsApp order message with itemized extras, total, delivery details, and target https://wa.me/56983294514?text=... with proper URI encoding.
5. In CombosSection.tsx, ensure combos are properly added to cart and direct WhatsApp ordering works.
6. Verify npm run build (tsc && vite build) passes with 0 errors.
7. Deliver handoff.md and send_message to parent when complete.
