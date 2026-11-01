# Master Plan: Food Truck Sanguchería San Martín Landing Page

## Executive Summary
Orchestrate the development of a production-grade, highly engaging, responsive Landing Page with Vite, React/Tailwind, Framer Motion, Aceternity UI style, dynamic Chilean schedule calculator, interactive sandwich menu, combo promotions, interactive map/directions, and WhatsApp order generator.

## Phased Execution Strategy

### Phase 0: Survey (Parallel Explorers)
- Spawn 3 Explorers in parallel to inspect:
  1. Explorer 1: Project structure, package.json dependencies, Vite config, Tailwind setup, TypeScript configuration, existing components.
  2. Explorer 2: Static assets (public/logo-sanmartin.jpg, images, icons, favicon), font configuration, color definitions, CSS setups.
  3. Explorer 3: Requirements analysis, edge cases for Chilean timezone/schedule, WhatsApp message formatting schema, mobile layout requirements, E2E testability.

### Phase 1: Architecture & Milestone Decomposition (PROJECT.md)
- Synthesize explorer findings.
- Define Feature Inventory (F1 to FN).
- Define Code Layout and Interface Contracts (data models for menu items, order cart, schedule status, location links).
- Decompose into Milestones:
  * Milestone 1: Brand System, Typography, Layout Shell, Navbar & Footer, Hero Section with Aceternity/Framer polish.
  * Milestone 2: Real-time Schedule & Status Engine (Chilean time, 18:30-23:30 Tue-Sun), Interactive Map embed & GPS navigation buttons (Google Maps, Waze), Delivery shortcuts.
  * Milestone 3: Interactive Categorized Sandwich Menu (Churrascos, Mechadas, Lomitos, Completos & Ases, Papas Fritas, Bebidas), Combos Section, Custom Extra Selection, and WhatsApp Order Builder with live cart and instant link generator.
  * Final Milestone: 100% E2E test suite pass + Adversarial Hardening.

### Parallel Track: E2E Testing Track
- Test infrastructure, requirement-driven opaque-box test suite across Tiers 1-4.
- Automated test scripts validating build, responsive constraints, WhatsApp message parsing, schedule logic across dates/times, asset rendering.
- Produces TEST_READY.md.

### Quality & Integrity Gates
- Every milestone must pass:
  1. Build & Unit/Integration Tests pass (0 errors).
  2. 2 Reviewers APPROVE.
  3. 2 Challengers APPROVE.
  4. 1 Forensic Auditor verifies CLEAN (zero tolerance for shortcuts, hardcoded mocks, facade functions).
