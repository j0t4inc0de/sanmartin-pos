# Scope: Milestone 2 — Chilean Schedule Engine & Map Navigation

## Mission
Upgrade and verify the real-time Chilean schedule calculation engine, live business hours status indicator, and interactive location navigation for Food Truck Sanguchería San Martín.

## Working Directory
`C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\sub_orch_m2`

## Authoritative Inputs
- `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\orchestrator_1\PROJECT.md`
- `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md`

## Write Ownership
Exclusively owns:
- `src/utils/businessHours.ts`
- `src/components/LocationHours.tsx`
- `src/components/AnnouncementBar.tsx`
MUST NOT modify files owned by M3 (`MenuSection.tsx`, `CartDrawer.tsx`, `menuData.ts`) or E2E (`tests/`).

## Feature Requirements (F5, F6, F7, F8)
1. **F5: Chilean Timezone Schedule Engine**:
   - Refactor `getBusinessStatus(now: Date = new Date())` in `src/utils/businessHours.ts`.
   - Calculate exact time in `America/Santiago` using `Intl.DateTimeFormat` with `timeZone: 'America/Santiago'`.
   - Schedule rules:
     * Monday: CLOSED all day (`isOpen: false`, text: 'Cerrado hoy lunes', detail: 'Abrimos mañana martes a las 18:30 hrs').
     * Tuesday–Sunday: OPEN between 18:30 and 23:30 Santiago time (`isOpen: true`, text: '¡Estamos Abiertos!', detail includes remaining hours/minutes countdown).
     * Tuesday–Sunday before 18:30: CLOSED (`isOpen: false`, text: 'Cerrado por ahora', detail: 'Abrimos hoy a las 18:30 hrs').
     * Tuesday–Saturday after 23:30: CLOSED (`isOpen: false`, text: 'Cerrado por hoy', detail: 'Abrimos mañana a las 18:30 hrs').
     * Sunday after 23:30: CLOSED (`isOpen: false`, text: 'Cerrado por hoy', detail: 'Abrimos el martes a las 18:30 hrs (lunes descansamos)').
   - Must support passing an optional `now: Date` parameter so deterministic timestamp tests can evaluate status without mocking system time.
2. **F6: Live Status Indicator & Schedule Display**:
   - Provide periodic recalculation (e.g. interval timer) or reactive hook so status transitions dynamically if a user leaves the page open.
   - Dynamic badges across `AnnouncementBar`, `Navbar`, and `LocationHours`.
   - Full 7-day schedule breakdown displayed clearly.
3. **F7: Interactive Map & GPS Navigation**:
   - Verified address: `Av. Gabriela Oriente #01216, Puente Alto, Chile`.
   - Google Maps interactive embed with dark styling.
   - Direct navigation button for Google Maps (`https://maps.google.com/?q=...`).
   - Direct navigation button for Waze (`https://waze.com/ul?q=...`).
4. **F8: Delivery Shortcuts**:
   - Quick action shortcuts for WhatsApp Direct (+56 9 8329 4514), PedidosYa, and Uber Eats.

## Completion Criteria
1. `npm run build` succeeds with exit code 0 and 0 type errors.
2. Schedule calculation returns accurate status for all test vectors in `America/Santiago`.
3. All GPS navigation and delivery links open valid target destinations.
4. Pass gate review (Reviewers, Challengers, Forensic Auditor).
