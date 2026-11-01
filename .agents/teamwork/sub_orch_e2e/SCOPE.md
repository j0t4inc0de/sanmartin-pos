# Scope: E2E Testing Track

## Mission
Design and implement a comprehensive, requirement-driven, opaque-box automated test suite for Food Truck Sanguchería San Martín across Tiers 1-4. Validate and publish `TEST_READY.md`.

## Working Directory
`C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\sub_orch_e2e`

## Authoritative Inputs
- `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\orchestrator_1\PROJECT.md`
- `C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md`

## Write Ownership
Exclusively owns:
- `tests/` directory (e.g. `tests/e2e-suite.mjs`, `tests/schedule.test.mjs`, `tests/whatsapp.test.mjs`, `tests/cart.test.mjs`, `tests/runner.mjs`)
- `TEST_INFRA.md` at project root
- `TEST_READY.md` at project root
MUST NOT modify files in `src/`.

## Test Requirements (Tiers 1-4)
1. **Tier 1 (Feature Coverage & Pure Functions)**:
   - Dynamic schedule calculation test for 10 deterministic timestamp vectors in `America/Santiago`:
     * Tuesday 18:29:59 -> `isOpen: false`
     * Tuesday 18:30:00 -> `isOpen: true`
     * Tuesday 23:00:00 -> `isOpen: true`
     * Tuesday 23:30:00 -> `isOpen: true`
     * Tuesday 23:31:00 -> `isOpen: false`
     * Sunday 23:31:00 -> `isOpen: false` (next open Tuesday 18:30)
     * Monday 12:00:00 -> `isOpen: false` (all day closed)
     * Monday 20:00:00 -> `isOpen: false` (all day closed)
     * Winter time (UTC-4) check
     * Summer time (UTC-3) check
   - WhatsApp message formatting & URL percent-encoding:
     * Base URL starts with `https://wa.me/56983294514?text=`
     * Phone number is strictly `56983294514`
     * Items, quantities, prices in CLP (`$6.500`, etc.), extras, total, delivery mode, customer name/address/notes
     * No unencoded `#`, `&`, or raw newlines in query string
   - CLP currency formatting helper (`formatPriceCLP`).
2. **Tier 2 (Boundary & State Logic)**:
   - Menu category filtering & search logic.
   - Cart subtotal with item extras and quantities.
   - Combos savings calculation.
3. **Tier 3 (Build & Asset Verification)**:
   - Automated build execution (`npm run build` / `npx vite build`) cleanly with exit code 0.
   - Asset validation: `public/logo-sanmartin.jpg` exists, size > 100KB.
   - Zero horizontal overflow check on 375px viewport.
4. **Tier 4 (Adversarial & Special Character Handling)**:
   - Special characters and emojis in customer name and notes (e.g., `#01216`, `&friends`, `Sin mayonesa`).
   - Extreme quantities (e.g. 50 items).

## Completion Criteria
1. Test suite can be executed via a single automated command (e.g. `node tests/runner.mjs`).
2. `TEST_INFRA.md` created at project root documenting architecture, methodology, and coverage.
3. `TEST_READY.md` published at project root with full summary and runner command.
4. Passing gate with Reviewers, Challengers, and Forensic Auditor.
