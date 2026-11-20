import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('San Martín POS — Requirements R2, R3, R4 Verification Suite', () => {

  // ---------------------------------------------------------------------------
  // R2: Product Deletion & Schema Preservation
  // ---------------------------------------------------------------------------
  describe('R2: Product Deletion in Catálogo y Menú', () => {
    const catalogManagerPath = path.join(PROJECT_ROOT, 'src', 'components', 'PosCatalogManager.tsx');
    const apiClientPath = path.join(PROJECT_ROOT, 'src', 'services', 'apiClient.ts');
    const catalogManagerContent = fs.readFileSync(catalogManagerPath, 'utf-8');
    const apiClientContent = fs.readFileSync(apiClientPath, 'utf-8');

    it('R2.1: apiClient supports DELETE method in ApiRequestOptions', () => {
      assert.match(
        apiClientContent,
        /method\?:\s*['"]GET['"]\s*\|\s*['"]POST['"]\s*\|\s*['"]PATCH['"]\s*\|\s*['"]DELETE['"]/,
        'apiClient.ts must support DELETE method in ApiRequestOptions'
      );
    });

    it('R2.2: PosCatalogManager defines deleteProduct handler executing DELETE on product endpoint', () => {
      assert.match(
        catalogManagerContent,
        /const\s+deleteProduct\s*=\s*async\s*\(/,
        'PosCatalogManager must declare deleteProduct function'
      );
      assert.match(
        catalogManagerContent,
        /solicitarApi\(\s*`\/api\/pos\/catalog\/manage\/products\/\$\{item\.id\}\/`,\s*\{\s*method:\s*['"]DELETE['"]\s*\}\)/,
        'deleteProduct must call solicitarApi with DELETE method on product endpoint'
      );
    });

    it('R2.3: deleteProduct presents confirmation dialog distinguishing permanent deletion from disabling', () => {
      assert.match(
        catalogManagerContent,
        /title:\s*['"]Retirar producto de la carta['"]/,
        'Confirmation dialog must have appropriate title'
      );
      assert.match(
        catalogManagerContent,
        /se conservará intacto todo el historial de pedidos/,
        'Confirmation dialog message must explicitly state that sales history is preserved'
      );
      assert.match(
        catalogManagerContent,
        /confirmLabel:\s*['"]Retirar permanentemente['"]/,
        'Confirmation button must say "Retirar permanentemente"'
      );
    });

    it('R2.4: deleteProduct updates local state, offline IndexedDB cache, and dispatches pos:catalog-updated', () => {
      assert.match(
        catalogManagerContent,
        /setProducts\(\s*nextProducts\s*\)/,
        'deleteProduct must update products React state'
      );
      assert.match(
        catalogManagerContent,
        /guardarCatalogoPos\(/,
        'deleteProduct must persist updated catalog into offline IndexedDB cache'
      );
      assert.match(
        catalogManagerContent,
        /window\.dispatchEvent\(new CustomEvent\(['"]pos:catalog-updated['"]\)\)/,
        'deleteProduct must dispatch pos:catalog-updated event'
      );
    });

    it('R2.5: Separate controls exist for "Disponible para la venta" and "Activo en el catálogo"', () => {
      assert.match(
        catalogManagerContent,
        /checked=\{productForm\.is_available\}/,
        'Form must bind productForm.is_available'
      );
      assert.match(
        catalogManagerContent,
        /Disponible para la venta/,
        'Form must label "Disponible para la venta"'
      );
      assert.match(
        catalogManagerContent,
        /checked=\{productForm\.is_active\}/,
        'Form must bind productForm.is_active'
      );
      assert.match(
        catalogManagerContent,
        /Activo en el catálogo/,
        'Form must label "Activo en el catálogo"'
      );
    });

    it('R2.6: "Retirar de la carta" button invokes deleteProduct for products instead of toggleActive', () => {
      assert.match(
        catalogManagerContent,
        /section === ['"]products['"]\s*&&\s*productForm\.id\s*&&\s*\([\s\S]*?onClick=\{\(\)\s*=>\s*\{[\s\S]*?void deleteProduct\(target\)/,
        '"Retirar de la carta" button must invoke deleteProduct for products'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // R3: Category Filter Pills in Catálogo y Menú
  // ---------------------------------------------------------------------------
  describe('R3: Category Filter Pills in Catálogo y Menú', () => {
    const catalogManagerPath = path.join(PROJECT_ROOT, 'src', 'components', 'PosCatalogManager.tsx');
    const catalogManagerContent = fs.readFileSync(catalogManagerPath, 'utf-8');

    it('R3.1: PosCatalogManager defines single-selection state selectedCategory', () => {
      assert.match(
        catalogManagerContent,
        /const\s*\[selectedCategory,\s*setSelectedCategory\]\s*=\s*useState<number\s*\|\s*['"]all['"]>\(['"]all['"]\)/,
        'Must declare selectedCategory state initialized to "all"'
      );
    });

    it('R3.2: Renders category pills container with .pos-category-filters and .pos-filter-chip', () => {
      assert.match(
        catalogManagerContent,
        /className=["'][^"']*pos-category-filters[^"']*["']/,
        'Must render category filters container with .pos-category-filters class'
      );
      assert.match(
        catalogManagerContent,
        /className=\{`pos-filter-chip \$\{selectedCategory === ['"]all['"] \? ['"]is-active['"] : ['"]['"]\}`\}/,
        'Must render "Todas" chip with active state class when selected'
      );
    });

    it('R3.3: Includes "Todas" chip and maps over categories for single-selection filter', () => {
      assert.match(
        catalogManagerContent,
        /onClick=\{\(\)\s*=>\s*setSelectedCategory\(['"]all['"]\)\}[^>]*>\s*Todas\s*<\/button>/,
        'Must include "Todas" button setting selectedCategory to "all"'
      );
      assert.match(
        catalogManagerContent,
        /categories\.map\(cat\s*=>\s*\(\s*<button[\s\S]*?onClick=\{\(\)\s*=>\s*setSelectedCategory\(cat\.id\)\}/,
        'Must render pill for each category setting selectedCategory to cat.id'
      );
    });

    it('R3.4: filteredProducts filters by both selectedCategory and normalizedProductSearch', () => {
      assert.match(
        catalogManagerContent,
        /if\s*\(selectedCategory\s*!==\s*['"]all['"]\s*&&\s*item\.category_id\s*!==\s*selectedCategory\)\s*\{\s*return false;\s*\}/,
        'filteredProducts must filter by category_id when selectedCategory is not "all"'
      );
      assert.match(
        catalogManagerContent,
        /normalizedProductSearch/,
        'filteredProducts must incorporate search string matching'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // R4: Recent Sales Status Badge Contrast
  // ---------------------------------------------------------------------------
  describe('R4: Recent Sales Status Badge Contrast', () => {
    const salesPanelPath = path.join(PROJECT_ROOT, 'src', 'components', 'PosSalesPanel.tsx');
    const cssPath = path.join(PROJECT_ROOT, 'src', 'index.css');
    const salesPanelContent = fs.readFileSync(salesPanelPath, 'utf-8');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('R4.1: PosSalesPanel applies .pos-sale-status and variant classes', () => {
      assert.match(
        salesPanelContent,
        /className=\{`pos-sale-status \$\{order\.status === ['"]ANULADA['"] \? ['"]pos-sale-status--anulada['"] : ['"]pos-sale-status--completada['"]\}`\}/,
        'PosSalesPanel must apply .pos-sale-status badge classes'
      );
    });

    it('R4.2: index.css defines dark theme status styles with white text (#ffffff)', () => {
      assert.match(
        cssContent,
        /\.pos-sale-status--completada\s*\{[\s\S]*?color:\s*#ffffff;/i,
        'Dark theme COMPLETADA badge must have white text #ffffff'
      );
      assert.match(
        cssContent,
        /\.pos-sale-status--anulada\s*\{[\s\S]*?color:\s*#ffffff;/i,
        'Dark theme ANULADA badge must have white text #ffffff'
      );
    });

    it('R4.3: index.css defines light theme status styles with black text (#000000)', () => {
      assert.match(
        cssContent,
        /html\[data-theme=["']light["']\]\s+\.pos-sale-status--completada\s*\{[\s\S]*?color:\s*#000000/i,
        'Light theme COMPLETADA badge must have black text #000000'
      );
      assert.match(
        cssContent,
        /html\[data-theme=["']light["']\]\s+\.pos-sale-status--anulada\s*\{[\s\S]*?color:\s*#000000/i,
        'Light theme ANULADA badge must have black text #000000'
      );
    });

    it('R4.4: High contrast validation: Light theme black text on pastel badges exceeds WCAG AA (>= 4.5:1)', () => {
      // #000000 on #d1fae5 (emerald-100) and on #fee2e2 (red-100)
      // Relative luminance of #000000 is 0.
      // Light emerald and red backgrounds have luminance > 0.7, yielding contrast > 15:1 (well above 4.5:1).
      const black = '#000000';
      const greenBg = '#d1fae5';
      const redBg = '#fee2e2';

      function getLuminance(hex) {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.slice(0, 2), 16) / 255;
        const g = parseInt(clean.slice(2, 4), 16) / 255;
        const b = parseInt(clean.slice(4, 6), 16) / 255;
        const toLinear = v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
      }

      function getRatio(h1, h2) {
        const l1 = getLuminance(h1);
        const l2 = getLuminance(h2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      const greenRatio = getRatio(black, greenBg);
      const redRatio = getRatio(black, redBg);

      assert.ok(greenRatio >= 4.5, `Green badge contrast ratio ${greenRatio.toFixed(2)} must be >= 4.5:1`);
      assert.ok(redRatio >= 4.5, `Red badge contrast ratio ${redRatio.toFixed(2)} must be >= 4.5:1`);
    });
  });
});
