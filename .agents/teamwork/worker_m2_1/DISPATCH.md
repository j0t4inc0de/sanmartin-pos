# Dispatch: Worker M2 (worker_m2_1)

**Role**: Implementation Worker (Milestone 2: Chilean Schedule Engine & Map Navigation)
**Working Directory**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_m2_1
**Authoritative Request**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Architecture**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\orchestrator_1\PROJECT.md
**Domain Specifications**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md

## Write Ownership
Exclusively owns:
- `src/utils/businessHours.ts`
- `src/components/LocationHours.tsx`
- `src/components/AnnouncementBar.tsx`
MUST NOT modify files owned by M3 (`MenuSection.tsx`, `CartDrawer.tsx`, `menuData.ts`) or E2E (`tests/`).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Implement genuine Chilean timezone schedule logic and live status management:
1. In `src/utils/businessHours.ts`:
   - Upgrade `getBusinessStatus(now: Date = new Date()): BusinessStatus` using ECMAScript `Intl.DateTimeFormat` with `timeZone: 'America/Santiago'`.
   - Correctly evaluate:
     * Monday: CLOSED all day (`isOpen: false`, text: 'Cerrado hoy lunes', detail: 'Abrimos mañana martes a las 18:30 hrs', next: 'Martes 18:30 hrs').
     * Tuesday–Sunday: OPEN 18:30 to 23:30 Santiago time (`isOpen: true`, text: '¡Estamos Abiertos!', detail includes countdown 'Cierra en Xh Ym').
     * Tuesday–Sunday before 18:30: CLOSED (`isOpen: false`, text: 'Cerrado por ahora', detail: 'Abrimos hoy a las 18:30 hrs', next: 'Hoy 18:30 hrs').
     * Tuesday–Saturday after 23:30: CLOSED (`isOpen: false`, text: 'Cerrado por hoy', detail: 'Abrimos mañana a las 18:30 hrs', next: 'Mañana 18:30 hrs').
     * Sunday after 23:30: CLOSED (`isOpen: false`, text: 'Cerrado por hoy', detail: 'Abrimos el martes a las 18:30 hrs (lunes descansamos)', next: 'Martes 18:30 hrs').
   - Export a reactive React hook `useBusinessStatus()` that recalculates every 60 seconds (with `useEffect` / `setInterval`) so users keep up-to-date in real time.
2. In `src/components/LocationHours.tsx` and `src/components/AnnouncementBar.tsx`:
   - Consume `useBusinessStatus()` for real-time reactivity.
   - Verify Google Maps embed and direct navigation links for Google Maps and Waze to `Av. Gabriela Oriente #01216, Puente Alto, Chile`.
   - Verify shortcuts to WhatsApp Direct, PedidosYa, and Uber Eats.
3. Run `npm run build` (`tsc && vite build`) to confirm 0 compilation errors.
4. Document all changes and build results in `handoff.md`.

## 2026-10-13T20:18:29Z
You are Worker M2 (worker_m2_1).
Working Directory: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_m2_1
Project Root: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing
Authoritative Request: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md
Dispatch: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_m2_1\DISPATCH.md
Domain Specifications: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership:
You exclusively own:
- src/utils/businessHours.ts
- src/components/LocationHours.tsx
- src/components/AnnouncementBar.tsx
DO NOT modify MenuSection.tsx, CartDrawer.tsx, menuData.ts, or tests/.

Task:
1. Upgrade getBusinessStatus(now: Date = new Date()): BusinessStatus in src/utils/businessHours.ts using Intl.DateTimeFormat with timeZone: 'America/Santiago'.
2. Add export function useBusinessStatus() hook with 60-second periodic update.
3. Wire useBusinessStatus() into LocationHours.tsx and AnnouncementBar.tsx.
4. Verify Google Maps embed and direct navigation links for Google Maps and Waze to Av. Gabriela Oriente #01216, Puente Alto, Chile, plus delivery shortcuts.
5. Run npm run build (tsc && vite build) to verify 0 errors.
6. Deliver handoff.md and send a message to parent when done.
