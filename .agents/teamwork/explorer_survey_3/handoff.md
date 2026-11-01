# Handoff Report — Explorer Survey 3: Domain Requirements, Business Rules & Testability Analysis

## 1. Observation

### 1.1 Project Baseline & Execution
- **Working Directory**: `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing`
- **Build Execution**: `npm run build` (`tsc && vite build`) executed cleanly with code 0 in 1.03s, transforming 2334 modules, emitting `dist/assets/index-DUFPk58j.css` (64.66 kB) and `dist/assets/index-DZApOr5a.js` (471.95 kB).
- **Test Runner**: Currently, no unit test framework (`vitest` or `jest`) or E2E runner (`playwright` or `cypress`) is installed in `package.json`.

### 1.2 Schedule & Status Indicator Observations (`src/utils/businessHours.ts:21-86`)
In `src/utils/businessHours.ts`:
```ts
export function getBusinessStatus(): BusinessStatus {
  const now = new Date();
  
  // Use Chilean time offset or local device
  // Day of week: 0 = Domingo, 1 = Lunes, 2 = Martes, ..., 6 = Sábado
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
...
```
- **Line 22, 26-28**: Calls `now.getDay()`, `now.getHours()`, `now.getMinutes()` directly against local host/browser environment. It does **not** convert to Chile timezone (`America/Santiago`).
- **Function Signature**: `getBusinessStatus()` takes 0 parameters, preventing deterministic unit testing without monkey-patching `global.Date`.
- **UI Invocation**: `LocationHours.tsx:15`, `AnnouncementBar.tsx:5`, `FloatingWhatsApp.tsx:7`, `Navbar.tsx:14` evaluate `getBusinessStatus()` once at initial component mount without an interval re-evaluator.

### 1.3 WhatsApp Order Builder Observations (`src/components/CartDrawer.tsx:43-82`)
In `src/components/CartDrawer.tsx`:
```ts
const handleCheckout = () => {
...
  let message = `¡Hola Food Truck San Martín! 🍔🔥\nQuiero hacer el siguiente pedido:\n\n`;

  cartItems.forEach((item) => {
    message += `• ${item.quantity}x ${item.name} (${formatPriceCLP(item.price * item.quantity)})\n`;
  });

  message += `\n💰 *Total del Pedido:* ${formatPriceCLP(subtotal)}\n`;
  message += `🛵 *Modalidad:* ${
    deliveryType === 'delivery' ? 'Delivery a Domicilio (Puente Alto)' : 'Retiro en Food Truck (Gabriela Oriente #01216)'
  }\n`;
...
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${encodedMessage}`;
```
- Phone number configured in `src/utils/businessHours.ts:10`: `whatsappNumber: '56983294514'` (official number: `+56 9 8329 4514`).
- `CartItem` in `src/types/index.ts:25-33` currently lacks an `extras` or `customizations` array:
```ts
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
  type: 'menu' | 'combo';
}
```
- Individual menu cards in `src/components/MenuSection.tsx:230-263` only allow adding standard items directly to cart without selecting extras (palta extra, queso fundido, mayo casera extra, salsa verde).

### 1.4 Menu Categorization & Chilean Ingredients (`src/data/menuData.ts`)
- `MENU_CATEGORIES` contains 7 categories: `'all'`, `'churrascos'`, `'mechadas'`, `'lomitos'`, `'completos'`, `'papas'`, `'bebidas'`.
- `MENU_ITEMS` defines 16 authentic Chilean food truck offerings:
  - Churrascos: Italiano Gigante ($6.500), Barros Luco ($6.200), Chacarero Tradicional ($6.500), Especial San Martín ($7.900).
  - Mechadas: Mechada Italiana ($6.900), Mechada Luco ($6.700), Mechada BBQ & Cebolla Crispy ($7.500).
  - Lomitos: Lomito Italiano ($6.200), Lomito Luco ($5.900), Lomito Chacarero ($6.200).
  - Completos & Ases: Completo Italiano Gigante ($3.200), Completo Dinámico ($3.400), As Italiano ($4.200), As Luco ($3.900).
  - Papas Fritas: Papas San Martín Cargadas ($6.900), Papas Rústicas Familiares ($3.500), Salchipapas San Martín ($4.800).
  - Bebidas: Bebida Familiar 1.5L ($2.500), Lata 350ml ($1.500), Jugo Frutal 500ml ($1.800).
- `COMBOS_DATA` defines 4 combo promotions:
  - Combo Pareja San Martín ($16.900, original $19.500, serves 2).
  - Combo Familiar Bajonero ($28.900, original $33.500, serves 4-5).
  - Combo Completo Fest ($14.900, original $17.200, serves 3-4).
  - Combo Dúo Mechada & Papas Cargadas ($18.900, original $21.800, serves 2).

### 1.5 Location & Navigation Links (`src/utils/businessHours.ts:15-18`, `LocationHours.tsx`)
- Address: `Av. Gabriela Oriente #01216, Puente Alto, Región Metropolitana, Chile`.
- Google Maps URL: `https://maps.google.com/?q=Av.+Gabriela+Oriente+01216,+Puente+Alto,+Regi%C3%B3n+Metropolitana,+Chile`
- Google Maps Embed Iframe: `https://maps.google.com/maps?q=Av.+Gabriela+Oriente+01216,+Puente+Alto,+Regi%C3%B3n+Metropolitana,+Chile&t=&z=16&ie=UTF8&iwloc=&output=embed`
- Waze URL: `https://waze.com/ul?q=Av.+Gabriela+Oriente+01216,+Puente+Alto`
- Delivery channels: WhatsApp Direct, PedidosYa (`https://www.pedidosya.cl`), Uber Eats (`https://www.ubereats.com`).

---

## 2. Logic Chain

### 2.1 Domain Requirement 1: Dynamic Schedule Calculator in Chile Timezone (`America/Santiago`)
1. **Timezone Discrepancy Inference**:
   - Directly using `new Date().getHours()` and `new Date().getDay()` causes false status indications for users outside Chile or users with skewed local clocks.
   - Chile alternates between UTC-4 (winter time: first Sunday of April to first Sunday of September) and UTC-3 (summer time: September to April). Hardcoding an offset (such as `UTC - 4`) fails during daylight saving switches.
2. **Deterministic Algorithm Design**:
   - Utilize standard ECMAScript `Intl.DateTimeFormat` with `timeZone: 'America/Santiago'`.
   - Use `formatToParts()` to extract `weekday`, `hour`, and `minute` in Santiago time with 0 external dependencies.
   - Map `weekday`: Sunday (0), Monday (1), Tuesday (2), Wednesday (3), Thursday (4), Friday (5), Saturday (6).
   - Calculate `currentMinutes = hours * 60 + minutes`.
   - Business Hours:
     - `openMinutes = 18 * 60 + 30 = 1110` (18:30)
     - `closeMinutes = 23 * 60 + 30 = 1410` (23:30)
   - Status Decision Tree:
     - **Case A: Monday (`day === 1`)**:
       - Food truck is strictly CLOSED all day.
       - `isOpen: false`, `statusText: 'Cerrado hoy lunes'`, `statusDetail: 'Abrimos mañana martes a las 18:30 hrs'`, `badgeColor: 'rose'`, `nextOpenText: 'Martes 18:30 hrs'`.
     - **Case B: Tuesday–Sunday (`day !== 1`) during service (`currentMinutes >= 1110 && currentMinutes <= 1410`)**:
       - `isOpen: true`, `statusText: '¡Estamos Abiertos!'`.
       - Detail: `Atendiendo hoy hasta las 23:30 hrs (Cierra en ${hoursLeft}h ${minsLeft}m)`.
       - `badgeColor: 'emerald'`, `nextOpenText: 'Hoy hasta las 23:30 hrs'`.
     - **Case C: Tuesday–Sunday before opening (`currentMinutes < 1110`)**:
       - `isOpen: false`, `statusText: 'Cerrado por ahora'`, `statusDetail: 'Abrimos hoy a las 18:30 hrs'`, `badgeColor: 'amber'`, `nextOpenText: 'Hoy 18:30 hrs'`.
     - **Case D: Tuesday–Sunday after closing (`currentMinutes > 1410`)**:
       - If Sunday (`day === 0`): `isOpen: false`, `statusText: 'Cerrado por hoy'`, `statusDetail: 'Abrimos el martes a las 18:30 hrs (lunes descansamos)'`, `nextOpenText: 'Martes 18:30 hrs'`.
       - If Tuesday–Saturday (`day >= 2 && day <= 6`): `isOpen: false`, `statusText: 'Cerrado por hoy'`, `statusDetail: 'Abrimos mañana a las 18:30 hrs'`, `nextOpenText: 'Mañana 18:30 hrs'`.
3. **Temporal Edge Cases Matrix**:
   | Scenario | Santiago Time | Day | Expected `isOpen` | Status Text | Detail / Countdown |
   |---|---|---|---|---|---|
   | Normal Open | Tue 20:00 | Tue | `true` | `¡Estamos Abiertos!` | Cierra en 3h 30m |
   | Exact Opening | Tue 18:30:00 | Tue | `true` | `¡Estamos Abiertos!` | Cierra en 5h 0m |
   | 1 Min Before Open | Tue 18:29:59 | Tue | `false` | `Cerrado por ahora` | Abrimos hoy a las 18:30 hrs |
   | Last Minute Open | Tue 23:29:59 | Tue | `true` | `¡Estamos Abiertos!` | Cierra en 0h 1m |
   | Exact Closing Cutoff | Tue 23:30:00 | Tue | `true` / Closing | `¡Estamos Abiertos!` | Cierra en 0m |
   | 1 Min After Close | Tue 23:31:00 | Tue | `false` | `Cerrado por hoy` | Abrimos mañana a las 18:30 hrs |
   | Sunday Night After Close | Sun 23:31:00 | Sun | `false` | `Cerrado por hoy` | Abrimos el martes a las 18:30 hrs (lunes descansamos) |
   | Monday Midday | Mon 13:00 | Mon | `false` | `Cerrado hoy lunes` | Abrimos mañana martes a las 18:30 hrs |
   | Monday Evening (during normal service hours) | Mon 20:00 | Mon | `false` | `Cerrado hoy lunes` | Abrimos mañana martes a las 18:30 hrs |
   | Tuesday Dawn | Tue 02:30 | Tue | `false` | `Cerrado por ahora` | Abrimos hoy a las 18:30 hrs |
   | DST Switchover (Winter to Summer, UTC-4 to UTC-3) | First Sun Sep 00:00 | Sun | Handled by `America/Santiago` IANA tz data | Correct local time without manual leap offsets |

4. **Pure Function Refactoring Recommendation**:
   Refactor signature to:
   ```ts
   export function getBusinessStatus(now: Date = new Date()): BusinessStatus
   ```
   Add a 60-second reactive interval hook (`useBusinessStatus`) so users keeping the landing page open transition from "Cerrado" to "Abierto" at 18:30 in real time.

---

### 2.2 Domain Requirement 2: WhatsApp Order Builder Specification
1. **URL Schema**:
   `https://wa.me/56983294514?text=${encodeURIComponent(formattedMessage)}`
2. **Message Content Structure**:
   ```
   ¡Hola Food Truck San Martín! 🍔🔥
   Quiero hacer el siguiente pedido:

   • 2x Churrasco Italiano Gigante ($13.000)
     ↳ Extras: Extra Palta Hass (+$1.000), Mayo Casera Extra (+$500)
   • 1x Combo Pareja San Martín ($16.900)
     ↳ Sánguches: 1x Mechada Luco, 1x Churrasco Italiano

   💰 *Total del Pedido:* $31.400
   🛵 *Modalidad:* Delivery a Domicilio (Puente Alto)
   👤 *Cliente:* Juan Pérez
   📍 *Dirección de Entrega:* Los Toros #1450, Puente Alto
   📝 *Observaciones/Notas:* Sin cebolla, salsas aparte

   ¿Me confirman disponibilidad y tiempo estimado de entrega/retiro? ¡Muchas gracias!
   ```
3. **CLP Currency Formatting Rules**:
   - Currency: `CLP` (Chilean Peso).
   - Decimal places: `0` (CLP does not use centavos).
   - Thousand separator: period (`.`) in `es-CL`.
   - Currency symbol: `$`.
   - String normalization: Handle non-breaking space (`\u00A0` / `\u202F`) in format output.
4. **URL Encoding Edge Cases**:
   - Emojis (🍔, 🔥, 💰, 🛵, 👤, 📍, 📝): must encode to standard UTF-8 hex sequences (e.g., `%F0%9F%8D%94`).
   - Linebreaks (`\n`): must encode as `%0A`.
   - Hash `#` in address (`#01216`): must encode as `%23` to prevent browser interpreting it as URL fragment.
   - Ampersand `&`: must encode as `%26` to prevent URL query parameter splitting.
   - Spaces: encode as `%20`.

---

### 2.3 Domain Requirement 3: Menu Categories, Chilean Extras & Combos Architecture
1. **Chilean Gastronomy Ingredient Taxonomy**:
   - **Meats**: Vacuno a la plancha (Churrasco), Carne mechada braseada 6 hrs, Lomito de cerdo macerado criollo, Vienesas sureñas premium.
   - **Breads**: Pan Frica artesanal tostado, Pan Copihue/Lengua de completo al vapor/dorado.
   - **Classic Combinations**:
     - *Italiano*: Palta Hass molida fresca + Tomate en rodajas/cubos + Mayo casera artesanal San Martín.
     - *Barros Luco*: Carne + Abundante queso mantecoso fundido a la plancha.
     - *Chacarero*: Carne + Porotos verdes al dente + Tomate + Ají verde en rodajas + Mayo casera.
     - *Dinámico*: Vienesa + Salsa americana + Chucrut tibio + Tomate + Palta + Mayo casera.
     - *Especial San Martín*: Doble carne + Cebolla caramelizada + Tocino ahumado + Queso fundido + Salsa de la casa.
2. **Extras / Agregados Data Model**:
   To fulfill R2 ("customizar extras/opciones"), create an `ExtraItem` contract and catalog:
   ```ts
   export interface ExtraItem {
     id: string;
     name: string;
     price: number;
   }

   export const CHILEAN_EXTRAS: ExtraItem[] = [
     { id: 'extra-palta', name: 'Palta Hass Extra', price: 1000 },
     { id: 'extra-queso', name: 'Queso Mantecoso Fundido Extra', price: 900 },
     { id: 'extra-mayo', name: 'Mayonesa Casera San Martín Extra', price: 500 },
     { id: 'extra-salsa-verde', name: 'Salsa Verde Chilena', price: 500 },
     { id: 'extra-aji', name: 'Ají Verde en Rodajas', price: 400 },
     { id: 'extra-cebolla-caramelizada', name: 'Cebolla Caramelizada', price: 700 },
     { id: 'extra-tocino', name: 'Tocino Ahumado Crocante', price: 900 },
     { id: 'extra-carne', name: 'Porción Extra de Carne / Doble Carne', price: 1800 },
   ];
   ```
3. **Cart Item Enhanced Model**:
   ```ts
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
   Subtotal calculation: `(item.price + (item.selectedExtras?.reduce((s, e) => s + e.price, 0) || 0)) * item.quantity`.
4. **Combos Architecture**:
   - Combos function as average order value (AOV) boosters.
   - Current 4 combos offer clear percentage savings (13% to 15% discount vs à la carte).
   - Display servings tag (`serves`), package contents list (`includes`), and strikethrough original price (`originalPrice`).

---

### 2.4 Domain Requirement 4: Location, GPS Navigation & Delivery Shortcuts
1. **Exact Address**: `Av. Gabriela Oriente #01216, Puente Alto, Región Metropolitana, Chile`.
2. **Google Maps Link**: `https://maps.google.com/?q=Av.+Gabriela+Oriente+01216,+Puente+Alto,+Regi%C3%B3n+Metropolitana,+Chile`
3. **Waze Link**: `https://waze.com/ul?q=Av.+Gabriela+Oriente+01216,+Puente+Alto`
4. **Interactive Embed**: Google Maps Iframe (`output=embed`) embedded with `contrast-125` filter to match dark theme.
5. **Shortcuts**: WhatsApp Direct (zero commission), PedidosYa, Uber Eats.
6. **Mobile UX Rule**: Direct navigation links open in native Google Maps and Waze mobile apps when clicked on iOS / Android via standard deep-link scheme fallback.

---

### 2.5 Domain Requirement 5: E2E Testability Strategy across Tiers 1-4

#### Tier 1: Static Code, Types & Unit Logic
- **Scope**: Deterministic pure functions, date arithmetic, message builders, CLP currency formatters.
- **Test Vectors for Timezone Calculator (`getBusinessStatus`)**:
  1. `2026-10-13T21:29:59Z` (Tue 18:29:59 CLT) -> `isOpen: false`
  2. `2026-10-13T21:30:00Z` (Tue 18:30:00 CLT) -> `isOpen: true`
  3. `2026-10-14T02:00:00Z` (Tue 23:00:00 CLT) -> `isOpen: true`
  4. `2026-10-14T02:30:00Z` (Tue 23:30:00 CLT) -> `isOpen: true`
  5. `2026-10-14T02:31:00Z` (Tue 23:31:00 CLT) -> `isOpen: false` (next: Wednesday 18:30)
  6. `2026-10-19T02:31:00Z` (Sun 23:31:00 CLT) -> `isOpen: false` (next: Tuesday 18:30, Monday closed)
  7. `2026-10-19T18:00:00Z` (Mon 15:00:00 CLT) -> `isOpen: false` (Monday closed all day)
  8. `2026-10-19T23:00:00Z` (Mon 20:00:00 CLT) -> `isOpen: false` (Monday closed all day)
  9. `2026-07-15T22:30:00Z` (Winter time UTC-4, Wed 18:30 CLT) -> `isOpen: true`
  10. `2026-12-15T21:30:00Z` (Summer time UTC-3, Tue 18:30 CLT) -> `isOpen: true`
- **WhatsApp String Assertion**: Verify presence of item names, quantities, individual extras, total in CLP, `#` and `&` properly percent-encoded, and URL starts with `https://wa.me/56983294514?text=`.

#### Tier 2: Component & Integration Testing (DOM State)
- **Scope**: React component interactions and state machines.
- **Test Cases**:
  - `CartDrawer`: Adding items increments count; removing items decrements or eliminates; changing delivery mode toggles address field visibility.
  - `MenuSection`: Filtering by category tab updates displayed items count; search input filters dynamically by name and ingredients.
  - `CombosSection`: Clicking "Agregar Combo" adds item of type `'combo'` to cart; "Pedir Combo" opens direct WhatsApp link.

#### Tier 3: Synthetic E2E & Browser Viewport Validation
- **Scope**: Build bundle, mobile responsiveness, DOM accessibility, broken links.
- **Test Cases**:
  - Build Check: `npm run build` succeeds with 0 errors.
  - Asset Check: `/logo-sanmartin.jpg` is present, valid image, status 200.
  - Viewport Overflows: Test viewports `375px` (iPhone SE), `414px` (iPhone Plus), `768px` (iPad), `1024px` (Laptop), `1440px` (Desktop). Verify `document.documentElement.scrollWidth <= window.innerWidth`.
  - External Links: Verify Google Maps, Waze, PedidosYa, Uber Eats, and WhatsApp have valid `href`, `target="_blank"`, and `rel="noopener noreferrer"`.

#### Tier 4: Adversarial, Non-Functional & Resilience Testing
- **Scope**: Security, malicious input resistance, timezone spoofing resilience.
- **Test Cases**:
  - XSS / Injection in WhatsApp Order: Customer enters `<script>alert(1)</script>`, `DROP TABLE`, or `#fragment&param=val` in customer name or notes. Verify `encodeURIComponent` properly sanitizes into URL parameters without breaking the WhatsApp web payload.
  - Fast Click Storm: Rapid clicking on "Agregar" button (10 clicks in 200ms) correctly adds 10 items without race conditions or negative quantities.
  - Timezone Tampering: Client machine set to Tokyo (UTC+9) or New York (UTC-5) still reflects authentic Santiago time.

---

## 3. Caveats

1. **Third-Party Service Availability**:
   - The embed iframe depends on Google Maps public embed service. If an ad-blocker or strict firewall blocks Google domains, a fallback card with direct navigation links ("Abrir en Google Maps" / "Abrir en Waze") must always remain accessible.
2. **Daylight Saving Time Policy Updates**:
   - Chilean DST dates are determined by presidential decree and can occasionally change with short notice (e.g., plebiscites or elections). Relying on the underlying OS/browser IANA time zone database (`America/Santiago`) is standard practice and far more resilient than hardcoded arithmetic, but depends on modern browser versions.
3. **No Code Modifications**:
   - In accordance with read-only investigation rules, no source files were altered during this survey. Proposed code patterns are detailed below for the implementing engineers.

---

## 4. Conclusion

1. **Readiness Assessment**: The existing landing page codebase is structurally sound, clean, and builds with 0 errors. However, there are 3 critical domain gaps that must be addressed during Phase 1:
   - **Gap 1 (Timezone)**: `getBusinessStatus()` in `src/utils/businessHours.ts` must be upgraded to parse `America/Santiago` time via `Intl.DateTimeFormat` and accept an optional `now: Date` parameter for deterministic testing.
   - **Gap 2 (Extras & Customizations)**: Menu and Cart items must support Chilean extras (palta, queso fundido, mayo casera, salsa verde, ají) with proper CLP line-item calculation and inclusion in the WhatsApp order message.
   - **Gap 3 (Automated Test Suite)**: A lightweight test script or Vitest suite must be added to validate Tiers 1-4 before milestone signoff.

### 4.1 Proposed Implementation Specifications

#### Upgraded `src/utils/businessHours.ts` Algorithm
```ts
export function getSantiagoTime(date: Date = new Date()): { day: number; currentMinutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  let weekdayStr = '';
  let hours = 0;
  let minutes = 0;

  for (const part of parts) {
    if (part.type === 'weekday') weekdayStr = part.value;
    else if (part.type === 'hour') hours = parseInt(part.value, 10);
    else if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }
  if (hours === 24) hours = 0;

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const day = weekdayMap[weekdayStr] ?? 0;
  return { day, currentMinutes: hours * 60 + minutes };
}

export function getBusinessStatus(now: Date = new Date()): BusinessStatus {
  const { day, currentMinutes } = getSantiagoTime(now);

  const openMinutes = 18 * 60 + 30;  // 18:30 -> 1110 min
  const closeMinutes = 23 * 60 + 30; // 23:30 -> 1410 min

  if (day === 1) { // Lunes
    return {
      isOpen: false,
      statusText: 'Cerrado hoy lunes',
      statusDetail: 'Abrimos mañana martes a las 18:30 hrs',
      badgeColor: 'rose',
      nextOpenText: 'Martes 18:30 hrs',
    };
  }

  if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
    const remainingMin = closeMinutes - currentMinutes;
    const hoursLeft = Math.floor(remainingMin / 60);
    const minsLeft = remainingMin % 60;
    const timeRemainingStr = hoursLeft > 0 ? `(Cierra en ${hoursLeft}h ${minsLeft}m)` : `(Cierra en ${minsLeft}m)`;

    return {
      isOpen: true,
      statusText: '¡Estamos Abiertos!',
      statusDetail: `Atendiendo hoy hasta las 23:30 hrs ${timeRemainingStr}`,
      badgeColor: 'emerald',
      nextOpenText: 'Hoy hasta las 23:30 hrs',
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: 'Cerrado por ahora',
      statusDetail: 'Abrimos hoy a las 18:30 hrs',
      badgeColor: 'amber',
      nextOpenText: 'Hoy 18:30 hrs',
    };
  }

  // After 23:30
  const isSunday = day === 0;
  return {
    isOpen: false,
    statusText: 'Cerrado por hoy',
    statusDetail: isSunday ? 'Abrimos el martes a las 18:30 hrs (lunes descansamos)' : 'Abrimos mañana a las 18:30 hrs',
    badgeColor: 'amber',
    nextOpenText: isSunday ? 'Martes 18:30 hrs' : 'Mañana 18:30 hrs',
  };
}
```

---

## 5. Verification Method

To independently verify these domain rules and testability strategy:

1. **Build Validation**:
   ```powershell
   npm run build
   ```
   *Expected*: Code 0, cleanly emitted `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`.

2. **Schedule & Timezone Verification Script**:
   Create a standalone Node test script `scripts/test-schedule.mjs` verifying the 10 timestamps defined in Tier 1:
   ```javascript
   // Sample execution:
   // Assert getBusinessStatus(new Date('2026-10-13T21:30:00Z')).isOpen === true
   // Assert getBusinessStatus(new Date('2026-10-13T21:29:59Z')).isOpen === false
   // Assert getBusinessStatus(new Date('2026-10-19T23:00:00Z')).isOpen === false (Monday)
   ```

3. **WhatsApp Order URI Verification**:
   Inspect generated URL:
   - Must match `^https:\/\/wa\.me\/56983294514\?text=`
   - Must contain `%0A` for linebreaks
   - Must contain formatted Chilean pesos (e.g. `%2416.900` or `%246.500`)
   - Must not contain literal unencoded `#` or unencoded `&`.

4. **Invalidation Conditions**:
   - If `getBusinessStatus()` returns `isOpen: true` on any Monday timestamp.
   - If `getBusinessStatus()` returns `isOpen: false` on a Tuesday between 18:30 and 23:30 Santiago time.
   - If WhatsApp link phone is anything other than `56983294514`.
   - If responsive layout at 375px generates horizontal scrollbar (`scrollWidth > innerWidth`).
