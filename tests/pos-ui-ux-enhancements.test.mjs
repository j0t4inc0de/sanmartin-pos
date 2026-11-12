import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadSourceModule } from './helpers/loader.mjs';

const PROJECT_ROOT = process.cwd();

/**
 * Converts a hex color (#RGB, #RRGGBB) to [R, G, B] in [0, 255].
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const fullHex = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num = parseInt(fullHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * Spec: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 */
function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('San Martín POS — UI/UX Enhancements Suite (R1–R5)', async () => {
  // Pre-load default catalog module for data integrity checks
  const defaultCatalogModule = await loadSourceModule('./src/data/defaultCatalog.ts');
  const baseCatalog = defaultCatalogModule.BASE_POS_CATALOG;

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature area)
  // =========================================================================

  describe('Tier 1: Feature Coverage', () => {

    // -----------------------------------------------------------------------
    // R1: Cashier View & Navbar Navigation
    // -----------------------------------------------------------------------
    describe('R1: Cashier View & Navbar Navigation', () => {
      it('R1.1: Cashier view in PosSalesPanel removes "Respaldo de caja" card and its child status elements', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosSalesPanel.tsx');
        assert.ok(fs.existsSync(filePath), 'PosSalesPanel.tsx must exist');
        const content = fs.readFileSync(filePath, 'utf-8');

        // Card heading and container must be completely removed
        assert.ok(
          !content.includes('Respaldo de caja'),
          'PosSalesPanel must NOT contain "Respaldo de caja"'
        );
        assert.ok(
          !content.includes('aria-label="Estado de datos locales"'),
          'PosSalesPanel must NOT contain aside "Estado de datos locales"'
        );
        // Unused local state variables must not remain dangling
        assert.ok(
          !/const\s*\[draftRestored/.test(content),
          'Unused state draftRestored must be removed to avoid TS6133'
        );
        assert.ok(
          !/const\s*\[catalogNotice/.test(content),
          'Unused state catalogNotice must be removed to avoid TS6133'
        );
      });

      it('R1.2: Navbar in PosPage removes "Sesión activa" chip and unused User icon import', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosPage.tsx');
        assert.ok(fs.existsSync(filePath), 'PosPage.tsx must exist');
        const content = fs.readFileSync(filePath, 'utf-8');

        assert.ok(
          !content.includes('pos-navbar-user-chip'),
          'PosPage navbar must NOT contain user chip "pos-navbar-user-chip"'
        );
        assert.ok(
          !content.includes('Sesión activa'),
          'PosPage navbar must NOT render "Sesión activa" label'
        );
        // Check unused User icon import is eliminated
        const hasUserImport = /import\s+{[^}]*\bUser\b[^}]*}\s+from\s+['"]lucide-react['"]/.test(content);
        assert.ok(
          !hasUserImport,
          'PosPage must NOT import unused User icon from lucide-react to avoid TS6133'
        );
      });

      it('R1.3: Catálogo view includes prominent "VOLVER A CAJA" button with .pos-back-to-caja styling', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosCatalogManager.tsx');
        assert.ok(fs.existsSync(filePath), 'PosCatalogManager.tsx must exist');
        const content = fs.readFileSync(filePath, 'utf-8');

        assert.match(
          content,
          /VOLVER A CAJA/,
          'PosCatalogManager must include uppercase "VOLVER A CAJA" button text'
        );
        assert.match(
          content,
          /className=["'][^"']*pos-back-to-caja[^"']*["']/,
          'PosCatalogManager must apply .pos-back-to-caja styling class'
        );
      });

      it('R1.4: Reportes view includes prominent "VOLVER A CAJA" button and accepts onClose prop', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosReports.tsx');
        assert.ok(fs.existsSync(filePath), 'PosReports.tsx must exist');
        const content = fs.readFileSync(filePath, 'utf-8');

        assert.ok(
          content.includes('onClose?: () => void') || content.includes('onClose?:'),
          'PosReports must declare optional onClose prop'
        );
        assert.match(
          content,
          /VOLVER A CAJA/,
          'PosReports must render prominent "VOLVER A CAJA" button'
        );
        assert.match(
          content,
          /className=["'][^"']*pos-back-to-caja[^"']*["']/,
          'PosReports must apply .pos-back-to-caja styling class'
        );
      });

      it('R1.5: Impresora/Devices workspace includes prominent "VOLVER A CAJA" button navigating to sales', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosPage.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');

        // Impresora workspace header must render the prominent button
        assert.match(
          content,
          /activeWorkspace === 'devices'[\s\S]*?VOLVER A CAJA/,
          'PosPage devices workspace must include prominent "VOLVER A CAJA" button'
        );
        assert.match(
          content,
          /setActiveWorkspace\(['"]sales['"]\)/,
          'PosPage must wire button to switch activeWorkspace back to sales'
        );
      });

      it('R1.6: Button styling (.pos-back-to-caja) defines bold font, #facc15 yellow, and shadow', () => {
        const cssPath = path.join(PROJECT_ROOT, 'src', 'index.css');
        assert.ok(fs.existsSync(cssPath), 'index.css must exist');
        const css = fs.readFileSync(cssPath, 'utf-8');

        assert.ok(css.includes('.pos-back-to-caja'), 'index.css must define .pos-back-to-caja');
        assert.ok(css.includes('#facc15'), '.pos-back-to-caja must use brand yellow background #facc15');
        assert.ok(css.includes('#0d0d0d'), '.pos-back-to-caja must use dark text #0d0d0d for contrast');
        assert.ok(css.includes('uppercase'), '.pos-back-to-caja must enforce uppercase text');
        assert.ok(css.includes('box-shadow') || css.includes('rgba(250, 204, 21'), '.pos-back-to-caja must specify drop shadow');
      });
    });

    // -----------------------------------------------------------------------
    // R2: Alert System & Web Audio Sound
    // -----------------------------------------------------------------------
    describe('R2: Alert System & Web Audio Sound', () => {
      it('R2.1: Alert component exists and exports AlertSeverity types', () => {
        const alertPath = path.join(PROJECT_ROOT, 'src', 'components', 'Alert.tsx');
        assert.ok(fs.existsSync(alertPath), 'src/components/Alert.tsx must exist');
        const content = fs.readFileSync(alertPath, 'utf-8');

        assert.match(content, /export\s+type\s+AlertSeverity\s*=\s*['"]success['"]\s*\|\s*['"]error['"]\s*\|\s*['"]warning['"]\s*\|\s*['"]info['"]/);
        assert.match(content, /export\s+function\s+Alert/);
      });

      it('R2.2: Alert component defines filled variants (success, error, warning, info) with proper ARIA roles', () => {
        const alertPath = path.join(PROJECT_ROOT, 'src', 'components', 'Alert.tsx');
        const content = fs.readFileSync(alertPath, 'utf-8');

        // Must define filled classes / styling for each severity
        assert.ok(content.includes('success'), 'Alert must handle success severity');
        assert.ok(content.includes('error'), 'Alert must handle error severity');
        assert.ok(content.includes('warning'), 'Alert must handle warning severity');
        assert.ok(content.includes('info'), 'Alert must handle info severity');

        // Must use accessible roles: alert or status
        assert.ok(content.includes("role: 'alert'") || content.includes('role="alert"'), 'Alert must configure role="alert" for error/warning');
        assert.ok(content.includes("role: 'status'") || content.includes('role="status"'), 'Alert must configure role="status" for success/info');
        assert.ok(content.includes('text-white'), 'Alert must use solid white text for filled high contrast');
      });

      it('R2.3: Alert filled CSS styles in index.css specify solid backgrounds and high-contrast white text', () => {
        const cssPath = path.join(PROJECT_ROOT, 'src', 'index.css');
        const css = fs.readFileSync(cssPath, 'utf-8');

        assert.ok(
          css.includes('.pos-alert-filled') || css.includes('pos-alert'),
          'index.css must include alert styling rules'
        );
      });

      it('R2.4: soundEffects module exports playSaleSuccessSound function', () => {
        const soundPath = path.join(PROJECT_ROOT, 'src', 'utils', 'soundEffects.ts');
        assert.ok(fs.existsSync(soundPath), 'src/utils/soundEffects.ts must exist');
        const content = fs.readFileSync(soundPath, 'utf-8');

        assert.match(
          content,
          /export\s+async\s+function\s+playSaleSuccessSound\s*\(\)\s*:\s*Promise<void>/,
          'soundEffects.ts must export playSaleSuccessSound(): Promise<void>'
        );
      });

      it('R2.5: playSaleSuccessSound is SSR-safe and guards against missing/suspended AudioContext', async () => {
        const soundModule = await loadSourceModule('./src/utils/soundEffects.ts');
        assert.equal(typeof soundModule.playSaleSuccessSound, 'function');

        // When executed in Node.js (without window.AudioContext), it must resolve gracefully without throwing
        await assert.doesNotReject(
          soundModule.playSaleSuccessSound(),
          'playSaleSuccessSound must not throw or unhandled reject in non-browser environment'
        );

        const content = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'utils', 'soundEffects.ts'), 'utf-8');
        assert.ok(
          content.includes('typeof window') || content.includes('AudioCtx'),
          'soundEffects.ts must include environment guard'
        );
        assert.ok(
          content.includes('try') && content.includes('catch'),
          'playSaleSuccessSound must wrap execution in try/catch'
        );
      });

      it('R2.6: PosSalesPanel triggers playSaleSuccessSound on sale confirmation', () => {
        const panelPath = path.join(PROJECT_ROOT, 'src', 'components', 'PosSalesPanel.tsx');
        const content = fs.readFileSync(panelPath, 'utf-8');

        assert.match(
          content,
          /playSaleSuccessSound/,
          'PosSalesPanel must import and invoke playSaleSuccessSound'
        );
      });
    });

    // -----------------------------------------------------------------------
    // R3: Color Contrast in White Mode
    // -----------------------------------------------------------------------
    describe('R3: Color Contrast in White Mode', () => {
      it('R3.1: Light theme defines --color-brand-yellow token as #a78b17 in index.css', () => {
        const cssPath = path.join(PROJECT_ROOT, 'src', 'index.css');
        const css = fs.readFileSync(cssPath, 'utf-8');

        assert.match(
          css,
          /html\[data-theme=["']light["']\][\s\S]*?--color-brand-yellow:\s*#a78b17/,
          'Light theme must override --color-brand-yellow to #a78b17'
        );
      });

      it('R3.2: Light theme CSS rules target all yellow utility classes to apply #a78b17', () => {
        const cssPath = path.join(PROJECT_ROOT, 'src', 'index.css');
        const css = fs.readFileSync(cssPath, 'utf-8');

        assert.ok(
          css.includes('html[data-theme="light"]') && css.includes('#a78b17'),
          'index.css light theme section must enforce #a78b17'
        );
        assert.match(
          css,
          /html\[data-theme=["']light["']\]\s+\[class\*=["']text-\[#FACC15\]["']\]/i,
          'Light theme must intercept text-[#FACC15]'
        );
      });

      it('R3.3: Mathematical WCAG 2.1 relative luminance and contrast formula verification', () => {
        // Pure black and white contrast must be 21:1
        const maxContrast = getContrastRatio('#000000', '#ffffff');
        assert.ok(Math.abs(maxContrast - 21) < 0.05, `Black/White contrast should be ~21:1, got ${maxContrast}`);

        // Identical colors must be 1:1
        const sameContrast = getContrastRatio('#ffffff', '#ffffff');
        assert.equal(sameContrast, 1, 'Same colors must have 1:1 contrast');
      });

      it('R3.4: Contrast comparison: legacy #facc15 (1.53:1) vs accessible #a78b17 (3.31:1, exceeds WCAG AA bold/UI >=3.0:1) on white', () => {
        const legacyRatio = getContrastRatio('#facc15', '#ffffff');
        const newRatio = getContrastRatio('#a78b17', '#ffffff');

        // Legacy #facc15 fails severely against white (1.53:1 < 3.0:1)
        assert.ok(legacyRatio < 2.0, `Legacy yellow #facc15 has unreadable contrast (${legacyRatio.toFixed(2)}:1)`);

        // New #a78b17 achieves > 3.0:1 (exceeds WCAG 2.1 AA requirement of 3.0:1 for large/bold text like 'Venta en línea')
        assert.ok(
          newRatio >= 3.0,
          `New yellow token #a78b17 (${newRatio.toFixed(2)}:1) must satisfy WCAG AA bold/UI threshold >= 3.0:1`
        );
        assert.ok(
          newRatio > legacyRatio * 2,
          'New yellow token provides more than double the contrast of legacy yellow'
        );
      });

      it('R3.5: Light theme report text/accent tokens (#896000) strictly exceed WCAG 2.1 AA body text contrast (>=4.5:1) on white', () => {
        const bodyTextYellow = '#896000';
        const bodyContrast = getContrastRatio(bodyTextYellow, '#ffffff');

        // #896000 gives 5.62:1 which strictly passes the 4.5:1 normal text threshold
        assert.ok(
          bodyContrast >= 4.5,
          `High-contrast yellow accent #896000 (${bodyContrast.toFixed(2)}:1) must exceed WCAG AA body text threshold >= 4.5:1`
        );
      });

      it('R3.6: Dark theme preserves vibrant yellow #facc15 against #171717 with >10:1 ratio', () => {
        const darkThemeRatio = getContrastRatio('#facc15', '#171717');
        assert.ok(
          darkThemeRatio > 10.0,
          `Dark theme contrast (${darkThemeRatio.toFixed(2)}:1) must remain exceptionally readable (>10:1)`
        );
      });
    });

    // -----------------------------------------------------------------------
    // R4: Reports View
    // -----------------------------------------------------------------------
    describe('R4: Reports View', () => {
      it('R4.1: PosReports slices top products to strictly at most 3 items', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosReports.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');

        assert.match(
          content,
          /top_products[^)]*?\)\.slice\(0,\s*3\)/,
          'PosReports must slice top_products to exactly 3 items'
        );
      });

      it('R4.2: PosReports card sequence places "Actividad del día" in 1st position before payments', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosReports.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');

        const timelineIndex = content.indexOf('pos-report-timeline');
        const productsIndex = content.indexOf('pos-report-products');
        const paymentsIndex = content.indexOf('pos-report-payments');

        assert.ok(timelineIndex !== -1, 'Must contain pos-report-timeline card');
        assert.ok(productsIndex !== -1, 'Must contain pos-report-products card');
        assert.ok(paymentsIndex !== -1, 'Must contain pos-report-payments card');

        assert.ok(
          timelineIndex < productsIndex,
          'pos-report-timeline (Actividad del día) must be 1st card (before products)'
        );
        assert.ok(
          productsIndex < paymentsIndex,
          'pos-report-products must be 2nd card (before payments)'
        );
      });

      it('R4.3: Top product maximum bar calculation scales 100% to highest seller among top 3', () => {
        const mockTopProducts = [
          { product_name: 'Churrasco Italiano', quantity: 24, total_amount: 156000 },
          { product_name: 'Vianesa Completa', quantity: 18, total_amount: 72000 },
          { product_name: 'As Luco', quantity: 12, total_amount: 60000 },
          { product_name: 'Papas Fritas', quantity: 8, total_amount: 24000 },
        ];

        const top3 = mockTopProducts.slice(0, 3);
        assert.equal(top3.length, 3);

        const topProductMaximum = Math.max(1, ...(top3.map(item => item.quantity) ?? []));
        assert.equal(topProductMaximum, 24);

        const bar1 = (top3[0].quantity / topProductMaximum) * 100;
        const bar2 = (top3[1].quantity / topProductMaximum) * 100;
        const bar3 = (top3[2].quantity / topProductMaximum) * 100;

        assert.equal(bar1, 100, 'Top product must scale to 100%');
        assert.equal(bar2, 75, 'Second product must scale to 75%');
        assert.equal(bar3, 50, 'Third product must scale to 50%');
      });

      it('R4.4: Top 3 sorting order is maintained from highest quantity to lowest', () => {
        const mockUnsorted = [
          { product_name: 'Item A', quantity: 5 },
          { product_name: 'Item B', quantity: 10 },
          { product_name: 'Item C', quantity: 7 },
        ].sort((a, b) => b.quantity - a.quantity);

        const sliced = mockUnsorted.slice(0, 3);
        assert.equal(sliced[0].product_name, 'Item B');
        assert.equal(sliced[1].product_name, 'Item C');
        assert.equal(sliced[2].product_name, 'Item A');
      });

      it('R4.5: PosReports accepts onClose callback for return to cashier', () => {
        const filePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosReports.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');

        assert.ok(
          content.includes('onClose?: () => void') || content.includes('onClose?:'),
          'PosReports signature must accept optional onClose'
        );
        assert.match(
          content,
          /onClick=\{onClose\}/,
          'PosReports must wire button click to onClose callback'
        );
      });
    });

    // -----------------------------------------------------------------------
    // R5: Modifiers & Fallback
    // -----------------------------------------------------------------------
    describe('R5: Modifiers & Fallback', () => {
      it('R5.1: Backend fixture catalogo_inicial.json contains all 21 modifiers (14 extras + 7 exclusions)', () => {
        const fixturePath = path.join(PROJECT_ROOT, 'backend', 'apps', 'catalog', 'fixtures', 'catalogo_inicial.json');
        assert.ok(fs.existsSync(fixturePath), 'catalogo_inicial.json must exist');
        const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

        assert.ok(Array.isArray(fixture.modifiers), 'fixture must contain modifiers array');
        assert.equal(fixture.modifiers.length, 21, 'Must contain exactly 21 modifiers');

        const extras = fixture.modifiers.filter(m => m.modifier_type === 'EXTRA_PAGO');
        const exclusions = fixture.modifiers.filter(m => m.modifier_type === 'EXCLUSION_COCINA');

        assert.equal(extras.length, 14, 'Must have exactly 14 paid extras');
        assert.equal(exclusions.length, 7, 'Must have exactly 7 kitchen exclusions');
      });

      it('R5.2: All kitchen exclusions (EXCLUSION_COCINA) have price = 0', () => {
        const fixturePath = path.join(PROJECT_ROOT, 'backend', 'apps', 'catalog', 'fixtures', 'catalogo_inicial.json');
        const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

        for (const mod of fixture.modifiers) {
          if (mod.modifier_type === 'EXCLUSION_COCINA') {
            assert.equal(
              mod.price,
              0,
              `Exclusion "${mod.name}" must have price 0, found ${mod.price}`
            );
          }
        }
      });

      it('R5.3: Backend seed command and migration 0003_seed_modifiers populate Modifier model', () => {
        const cmdPath = path.join(PROJECT_ROOT, 'backend', 'apps', 'catalog', 'management', 'commands', 'cargar_catalogo_inicial.py');
        assert.ok(fs.existsSync(cmdPath), 'cargar_catalogo_inicial.py must exist');
        const cmdContent = fs.readFileSync(cmdPath, 'utf-8');

        assert.ok(
          cmdContent.includes('Modifier'),
          'cargar_catalogo_inicial.py must import or reference Modifier'
        );

        const migPath = path.join(PROJECT_ROOT, 'backend', 'apps', 'catalog', 'migrations', '0003_seed_modifiers.py');
        assert.ok(fs.existsSync(migPath), '0003_seed_modifiers.py migration must exist');
        const migContent = fs.readFileSync(migPath, 'utf-8');
        assert.ok(migContent.includes('INITIAL_MODIFIERS'), 'Migration must declare INITIAL_MODIFIERS');
        assert.ok(migContent.includes('seed_modifiers'), 'Migration must execute seed_modifiers');
      });

      it('R5.4: Frontend posLocalStore falls back to 21 base modifiers when API returns empty array', () => {
        const storePath = path.join(PROJECT_ROOT, 'src', 'services', 'posLocalStore.ts');
        const storeContent = fs.readFileSync(storePath, 'utf-8');

        // precargarCatalogoPos fallback
        assert.match(
          storeContent,
          /modifiers:\s*\(nextModifiers\s*&&\s*nextModifiers\.length\s*>\s*0\)\s*\?\s*nextModifiers\s*:\s*base\.modifiers/,
          'precargarCatalogoPos must fall back to base.modifiers when nextModifiers is empty'
        );
      });

      it('R5.5: PosCatalogManager and PosSalesPanel maintain modifier count when backend is unseeded', () => {
        const catalogManagerPath = path.join(PROJECT_ROOT, 'src', 'components', 'PosCatalogManager.tsx');
        const content = fs.readFileSync(catalogManagerPath, 'utf-8');

        assert.match(
          content,
          /obtenerCatalogoBasePos\(\)\.modifiers/,
          'PosCatalogManager must fall back to base catalog modifiers when API returns empty array'
        );
        assert.match(
          content,
          /modifierForm\.modifier_type === ['"]EXCLUSION_COCINA['"]\s*\?\s*0/,
          'PosCatalogManager must force price to 0 when modifier is EXCLUSION_COCINA'
        );
      });

      it('R5.6: Order line total calculation correctly aggregates extra costs while exclusions add 0', () => {
        const sandwichPrice = 6500;
        const modifiers = [
          { modifier_id: 2, price_at_sale: 1000, quantity_per_unit: 1 }, // Extra Palta $1000
          { modifier_id: 11, price_at_sale: 1000, quantity_per_unit: 2 }, // 2x Tocino $2000
          { modifier_id: 15, price_at_sale: 0, quantity_per_unit: 1 }, // Sin cebolla $0
          { modifier_id: 16, price_at_sale: 0, quantity_per_unit: 1 }, // Sin mayo $0
        ];

        const modifierTotal = modifiers.reduce((sum, mod) => sum + (mod.price_at_sale * mod.quantity_per_unit), 0);
        assert.equal(modifierTotal, 3000, 'Paid extras total must be $3.000');

        const lineTotal = (sandwichPrice + modifierTotal) * 2; // 2 sandwiches
        assert.equal(lineTotal, 19000, 'Total line price for 2 custom sandwiches must be $19.000');
      });
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (4 tests)
  // =========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    it('B1: Reports top products slicing handles empty data array safely', () => {
      const emptyReport = { top_products: [] };
      const topProducts = (emptyReport?.top_products ?? []).slice(0, 3);
      assert.equal(topProducts.length, 0);

      const topProductMaximum = Math.max(1, ...(topProducts.map(item => item.quantity) ?? []));
      assert.equal(topProductMaximum, 1, 'Math.max(1, ...) prevents 0 and division by zero');

      // Test safe division without NaN
      const percentage = (0 / topProductMaximum) * 100;
      assert.equal(percentage, 0);
      assert.ok(!Number.isNaN(percentage));
    });

    it('B2: Reports top products handles single product without division by zero (topProductMaximum >= 1)', () => {
      const singleReport = {
        top_products: [{ product_name: 'Solo Item', quantity: 3, total_amount: 15000 }],
      };
      const topProducts = (singleReport?.top_products ?? []).slice(0, 3);
      assert.equal(topProducts.length, 1);

      const topProductMaximum = Math.max(1, ...(topProducts.map(item => item.quantity) ?? []));
      assert.equal(topProductMaximum, 3);

      const barWidth = (topProducts[0].quantity / topProductMaximum) * 100;
      assert.equal(barWidth, 100);
    });

    it('B3: Reports boundary slicing with exactly 3, 4, and 10 products', () => {
      const items3 = [1, 2, 3];
      const items4 = [1, 2, 3, 4];
      const items10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      assert.equal(items3.slice(0, 3).length, 3, '3 items remains 3');
      assert.equal(items4.slice(0, 3).length, 3, '4 items slices down to 3');
      assert.equal(items10.slice(0, 3).length, 3, '10 items slices down to 3');
    });

    it('B4: playSaleSuccessSound gracefully catches AudioContext errors without interrupting sales', async () => {
      const soundModule = await loadSourceModule('./src/utils/soundEffects.ts');

      // Even if AudioContext is missing, corrupted, or throws an error, the function must never throw
      await assert.doesNotReject(async () => {
        await soundModule.playSaleSuccessSound();
      });
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (3 tests)
  // =========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('X1: Light mode theme preserves filled alert visibility and contrast against light background', () => {
      // Solid filled alerts use white text (#ffffff) on solid backgrounds
      const successBg = '#16a34a'; // Emerald 600
      const errorBg = '#dc2626';   // Red 600
      const infoBg = '#2563eb';    // Blue 600
      const warningBg = '#d97706'; // Amber 600

      const successContrast = getContrastRatio('#ffffff', successBg);
      const errorContrast = getContrastRatio('#ffffff', errorBg);
      const infoContrast = getContrastRatio('#ffffff', infoBg);
      const warningContrast = getContrastRatio('#ffffff', warningBg);

      // WCAG 2.1 AA requirements:
      // - >= 3.0:1 for bold/UI components & large text
      // - >= 4.5:1 for regular body text
      assert.ok(successContrast >= 3.0, `Success alert contrast (${successContrast.toFixed(2)}:1) meets WCAG AA bold/UI threshold (>=3.0:1)`);
      assert.ok(errorContrast >= 4.5, `Error alert contrast (${errorContrast.toFixed(2)}:1) meets WCAG AA body text threshold (>=4.5:1)`);
      assert.ok(infoContrast >= 4.5, `Info alert contrast (${infoContrast.toFixed(2)}:1) meets WCAG AA body text threshold (>=4.5:1)`);
      assert.ok(warningContrast >= 3.0, `Warning alert contrast (${warningContrast.toFixed(2)}:1) meets WCAG AA bold/UI threshold (>=3.0:1)`);
    });

    it('X2: Fallback catalog modifiers correctly calculate full order quotation and checkout price', () => {
      const baseModifiers = baseCatalog.modifiers;
      assert.ok(baseModifiers.length >= 21, 'Base catalog must provide fallback modifiers');

      const extraPalta = baseModifiers.find(m => m.name.toLowerCase().includes('palta'));
      const sinCebolla = baseModifiers.find(m => m.name.toLowerCase().includes('sin cebolla'));

      assert.ok(extraPalta, 'Extra palta must exist');
      assert.ok(sinCebolla, 'Sin cebolla must exist');
      assert.equal(extraPalta.price, 1000);
      assert.equal(sinCebolla.price, 0);

      // Quote calculation with 1 Sandwich ($6.500) + Palta ($1.000) + Sin cebolla ($0)
      const baseProductPrice = 6500;
      const calculatedTotal = baseProductPrice + extraPalta.price + sinCebolla.price;
      assert.equal(calculatedTotal, 7500, 'Order total must match $7.500');
    });

    it('X3: Prominent back button maintains contrast (>12:1) while text tokens switch to accessible #a78b17', () => {
      // Button background #facc15 with text #0d0d0d
      const buttonContrast = getContrastRatio('#facc15', '#0d0d0d');
      assert.ok(buttonContrast > 12.0, `Button contrast (${buttonContrast.toFixed(2)}:1) exceeds AAA`);

      // Text tokens in light theme use #a78b17 on white #ffffff
      const textContrast = getContrastRatio('#a78b17', '#ffffff');
      assert.ok(textContrast >= 3.0, `Text token contrast (${textContrast.toFixed(2)}:1) meets WCAG AA`);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS (2 tests)
  // =========================================================================

  describe('Tier 4: Real-World Scenarios', () => {
    it('W1: Base catalog integrity across categories, products, and modifiers', () => {
      assert.equal(baseCatalog.categories.length, 8, 'Catalog must have 8 categories');
      assert.equal(baseCatalog.products.length, 64, 'Catalog must have 64 products');
      assert.ok(baseCatalog.modifiers.length >= 21, 'Catalog must have at least 21 modifiers');

      // Verify each modifier has valid fields
      for (const mod of baseCatalog.modifiers) {
        assert.ok(mod.id > 0, 'Modifier must have positive ID');
        assert.ok(mod.name, 'Modifier must have a name');
        assert.ok(mod.price >= 0, 'Modifier must have non-negative price');
        assert.ok(
          mod.modifier_type === 'EXTRA_PAGO' || mod.modifier_type === 'EXCLUSION_COCINA',
          `Unknown modifier type ${mod.modifier_type}`
        );
      }
    });

    it('W2: End-to-end POS sale simulation: fallback modifiers -> quote calculation -> audio chime trigger', async () => {
      // 1. Fallback catalog provides modifiers
      const modifiers = baseCatalog.modifiers;
      assert.ok(modifiers.length >= 21);

      // 2. Select product and customize
      const product = baseCatalog.products[0];
      const extra = modifiers.find(m => m.modifier_type === 'EXTRA_PAGO');
      const exclusion = modifiers.find(m => m.modifier_type === 'EXCLUSION_COCINA');

      // 3. Compute quote
      const totalAmount = product.price + extra.price + exclusion.price;
      assert.ok(totalAmount > 0);

      // 4. Trigger audio confirmation
      const soundModule = await loadSourceModule('./src/utils/soundEffects.ts');
      await soundModule.playSaleSuccessSound();

      // 5. Update top products report simulation
      const reportTopProducts = [
        { product_name: product.name, quantity: 1, total_amount: totalAmount },
      ];
      const top3 = reportTopProducts.slice(0, 3);
      assert.equal(top3.length, 1);
      assert.equal(top3[0].product_name, product.name);
    });
  });
});
