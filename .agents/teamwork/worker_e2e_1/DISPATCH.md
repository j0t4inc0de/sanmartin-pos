# Dispatch: E2E Test Writer (worker_e2e_1)

**Role**: Test Writer (E2E Testing Track)
**Working Directory**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_e2e_1
**Authoritative Request**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Architecture**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\orchestrator_1\PROJECT.md
**Domain Specifications**: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md

## Write Ownership
Exclusively owns:
- `tests/` directory (`tests/runner.mjs`, `tests/schedule.test.mjs`, `tests/whatsapp.test.mjs`, `tests/cart.test.mjs`, `tests/build.test.mjs`, etc.)
- `TEST_INFRA.md` at project root
- `TEST_READY.md` at project root
MUST NOT edit files under `src/` or `public/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Implement an automated, opaque-box, requirement-driven test suite across Tiers 1-4 with a Node.js runner:
1. Tier 1 (Pure Functions & Feature Coverage):
   - Santiago schedule calculation across 10 deterministic timestamp vectors (Tue 18:29 -> false, Tue 18:30 -> true, Tue 23:30 -> true, Tue 23:31 -> false, Sun 23:31 -> false, Mon all day -> false, etc.).
   - WhatsApp message formatting & URL percent-encoding (phone 56983294514, items, prices in CLP, extras, delivery mode, customer notes, UTF-8 percent-encoding).
   - CLP currency formatting.
2. Tier 2 (Boundary & State):
   - Category filtering & menu items logic.
   - Cart subtotal with extras and quantities.
   - Combos savings calculations.
3. Tier 3 (Build & Visual Integrity):
   - Execution of `npx vite build` (must exit code 0).
   - Logo asset presence check (`public/logo-sanmartin.jpg`).
   - CSS viewport width check (no overflow at 375px).
4. Tier 4 (Adversarial):
   - Special characters & emojis in notes/name (`#01216`, `&friends`, `🍔`).
   - Extreme quantities handling.
5. Create `TEST_INFRA.md` and `TEST_READY.md` at project root.
Execute the tests, document results in your `handoff.md`, and report completion.


## 2026-10-13T20:18:28Z
From: 26d40fe8-2b4b-4a30-9dea-6b98b7b8ccdb
Content:
You are E2E Test Writer (worker_e2e_1).
Working Directory: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_e2e_1
Project Root: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing
Authoritative Request: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\ORIGINAL_REQUEST.md
Dispatch: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\worker_e2e_1\DISPATCH.md
Domain Specifications: C:\Users\juanp\Documents\Ficheros\Repositorios Fullstack\sanmartin-landing\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership:
You exclusively own the tests/ directory, TEST_INFRA.md, and TEST_READY.md at project root.
DO NOT touch src/ or public/.

Task:
Implement a comprehensive opaque-box test suite in tests/ (e.g. tests/runner.mjs and modular test files) covering Tiers 1-4.
Write TEST_INFRA.md and TEST_READY.md.
Run the tests and document all test results in your handoff.md.
When complete, send a message to parent.
