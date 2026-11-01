# Test Infrastructure Specification: Food Truck Sanguchería San Martín

## 1. Overview & Architecture
This repository implements a lightweight, opaque-box, requirement-driven test framework designed for high verification fidelity without external runner dependencies. It leverages:
- **Node.js 22 Built-in Test Runner** (`node:test`, `node:assert`, `node:test/reporters`): Provides native TAP and spec execution, fast subtest suites, and zero overhead.
- **Vite SSR Module Loader Pipeline** (`vite.createServer().ssrLoadModule`): Seamlessly loads TypeScript source modules (`.ts`, `.tsx`) from `src/`, resolving path aliases, TypeScript interfaces, and directory imports directly in memory without requiring a separate pre-compilation build step.
- **Master Test Runner** (`tests/runner.mjs`): Orchestrates execution across all 4 tiers, parses TAP output, tabulates pass/fail counts, and formats actionable defect escalations.

---

## 2. Test Directory Layout
```
tests/
├── helpers/
│   └── loader.mjs                # Vite SSR module loader & lifecycle cleanup
├── tier1-schedule.test.mjs       # Tier 1: Chilean timezone (America/Santiago) 10-vector schedule engine
├── tier1-formatting.test.mjs     # Tier 1: CLP currency formatting (es-CL locale, no decimals)
├── tier1-whatsapp.test.mjs       # Tier 1: WhatsApp order message builder & URI percent-encoding
├── tier2-menu-cart.test.mjs      # Tier 2: Menu categories, items, cart extras, combos savings
├── tier3-build-visual.test.mjs   # Tier 3: Production Vite build exit 0, logo JPEG asset, viewport CSS
├── tier4-adversarial.test.mjs    # Tier 4: Adversarial XSS injection, emojis, boundary quantities, timezone tampering
└── runner.mjs                    # Master test runner & reporting engine
```

---

## 3. How to Run the Tests

### 3.1 Run Full Automated Suite
To execute all test suites across Tiers 1–4 with aggregated summary and defect report:
```powershell
node tests/runner.mjs
```

### 3.2 Run Individual Tier Suites
You can run any individual test suite directly via Node's native test runner:
```powershell
# Tier 1: Chilean Schedule (10 Vectors)
node --test tests/tier1-schedule.test.mjs

# Tier 1: CLP Formatting
node --test tests/tier1-formatting.test.mjs

# Tier 1: WhatsApp Order Builder
node --test tests/tier1-whatsapp.test.mjs

# Tier 2: Menu & Cart Calculations
node --test tests/tier2-menu-cart.test.mjs

# Tier 3: Build & Visual Integrity
node --test tests/tier3-build-visual.test.mjs

# Tier 4: Adversarial & Boundary Resilience
node --test tests/tier4-adversarial.test.mjs
```

---

## 4. Tier Classification & Authoritative Sources

| Tier | Focus Area | Authoritative Source | Primary Assertions |
|---|---|---|---|
| **Tier 1** | Pure Functions & Contracts | `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` §Interface Contracts | - Evaluates 10 deterministic UTC timestamp vectors in `America/Santiago` timezone.<br>- Validates phone `56983294514` and URI percent-encoding.<br>- Verifies CLP integers formatted with thousands separator and `$`. |
| **Tier 2** | Boundary & State Arithmetic | `ORIGINAL_REQUEST.md` §R2, §R3, `src/data/menuData.ts` | - 7 sandwich categories and 20+ items.<br>- Subtotal with base items and item-level Chilean extras.<br>- 4 combos with verified positive savings (10%-30%). |
| **Tier 3** | Build & Visual Integrity | `ORIGINAL_REQUEST.md` §Acceptance, `PROJECT.md` §Code Layout | - Clean execution of `npx vite build` (exit code 0).<br>- `public/logo-sanmartin.jpg` exists, size > 50KB, valid JPEG magic bytes `FF D8 FF`.<br>- Responsive viewport meta tag and CSS `overflow-x: hidden` protection. |
| **Tier 4** | Adversarial Hardening | `ORIGINAL_REQUEST.md` §Acceptance, Security Principles | - URL query sanitization with HTML tags, SQL fragments, `#`, `&`.<br>- Multi-byte Chilean emoji encoding (`🍔🔥🥑🇨🇱`).<br>- Large volume catering orders (99 items) and negative quantity protection.<br>- Host timezone independence against clock tampering. |

---

## 5. Lifecycle & Environment Requirements
- **Node.js**: v22.17.0+ (ESM modules native support, `node:test`, `node:assert`).
- **Dependencies**: Uses `vite` installed in `node_modules` for SSR transformation. Zero additional global packages required.
- **Teardown**: `tests/helpers/loader.mjs` automatically hooks into `after()` to close the Vite server instance upon suite completion, ensuring immediate clean process exit.
