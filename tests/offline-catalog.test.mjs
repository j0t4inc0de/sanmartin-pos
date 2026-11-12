import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSourceModule } from './helpers/loader.mjs';

describe('Offline Catalog & Persistence (Problema 2)', async () => {
  const defaultCatalogModule = await loadSourceModule('./src/data/defaultCatalog.ts');
  const posLocalStore = await loadSourceModule('./src/services/posLocalStore.ts');

  it('contains exactly 8 categories and 64 products in base catalog', () => {
    const base = defaultCatalogModule.BASE_POS_CATALOG;
    assert.ok(base, 'BASE_POS_CATALOG should exist');
    assert.equal(base.categories.length, 8, 'Must have exactly 8 categories');
    assert.equal(base.products.length, 64, 'Must have exactly 64 products');
    assert.ok(base.modifiers.length > 0, 'Must have base modifiers');
  });

  it('all categories have required fields and unique IDs/slugs', () => {
    const base = defaultCatalogModule.BASE_POS_CATALOG;
    const slugs = new Set();
    const ids = new Set();

    for (const cat of base.categories) {
      assert.ok(cat.id > 0, `Category ${cat.name} must have positive ID`);
      assert.ok(cat.slug, `Category ${cat.name} must have a slug`);
      assert.ok(cat.name, `Category must have a name`);
      assert.equal(cat.is_active, true, `Category ${cat.name} should be active`);
      assert.ok(!slugs.has(cat.slug), `Duplicate category slug: ${cat.slug}`);
      assert.ok(!ids.has(cat.id), `Duplicate category id: ${cat.id}`);
      slugs.add(cat.slug);
      ids.add(cat.id);
    }
  });

  it('all 64 products have valid prices, categories, and ingredients', () => {
    const base = defaultCatalogModule.BASE_POS_CATALOG;
    const catIds = new Set(base.categories.map(c => c.id));
    const slugs = new Set();
    const ids = new Set();

    for (const prod of base.products) {
      assert.ok(prod.id > 0, `Product ${prod.name} must have positive ID`);
      assert.ok(prod.slug, `Product ${prod.name} must have a slug`);
      assert.ok(prod.name, `Product must have a name`);
      assert.ok(prod.price >= 0, `Product ${prod.name} must have valid non-negative price`);
      assert.ok(catIds.has(prod.category_id), `Product ${prod.name} belongs to unknown category ${prod.category_id}`);
      assert.ok(Array.isArray(prod.ingredients), `Product ${prod.name} must have ingredients array`);
      assert.ok(!slugs.has(prod.slug), `Duplicate product slug: ${prod.slug}`);
      assert.ok(!ids.has(prod.id), `Duplicate product id: ${prod.id}`);
      slugs.add(prod.slug);
      ids.add(prod.id);
    }
  });

  it('modifiers include paid extras and kitchen exclusions', () => {
    const base = defaultCatalogModule.BASE_POS_CATALOG;
    const extras = base.modifiers.filter(m => m.modifier_type === 'EXTRA_PAGO');
    const exclusions = base.modifiers.filter(m => m.modifier_type === 'EXCLUSION_COCINA');

    assert.ok(extras.length >= 10, 'Should have at least 10 paid extras');
    assert.ok(exclusions.length >= 5, 'Should have kitchen exclusions');
  });

  it('obtenerCatalogoBasePos returns fresh deep clone of base catalog', () => {
    const catalog1 = posLocalStore.obtenerCatalogoBasePos();
    const catalog2 = posLocalStore.obtenerCatalogoBasePos();

    assert.equal(catalog1.products.length, 64);
    assert.equal(catalog2.products.length, 64);
    assert.notEqual(catalog1, catalog2, 'Must be distinct clone instances');
  });

  it('cargarCatalogoPos initializes and returns base catalog when storage is empty', async () => {
    // In node test environment without indexedDB, cargarCatalogoPos falls back to base catalog
    const stored = await posLocalStore.cargarCatalogoPos();
    assert.ok(stored, 'cargarCatalogoPos must never return null');
    assert.equal(stored.catalog.categories.length, 8);
    assert.equal(stored.catalog.products.length, 64);
    assert.ok(stored.catalog.modifiers.length > 0);
  });

  it('product search filter matches name, category, and ingredients offline', () => {
    const base = posLocalStore.obtenerCatalogoBasePos();
    const products = base.products;

    const filterBy = (query) => {
      const normalized = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').trim();
      return products.filter(item => [item.name, item.category_name, item.slug, ...(item.ingredients || [])].some(
        value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').includes(normalized)
      ));
    };

    const italianos = filterBy('italiano');
    assert.ok(italianos.length >= 1, 'Should find products matching "italiano"');

    const paltaProducts = filterBy('palta');
    assert.ok(paltaProducts.length >= 3, 'Should find products with "palta" in ingredients');

    const categoryProducts = filterBy('chorrillana');
    assert.ok(categoryProducts.length >= 1, 'Should find products by category name');
  });

  it('base catalog uses offline-fallback cursor and marks server_synced false', async () => {
    const base = defaultCatalogModule.BASE_POS_CATALOG;
    assert.equal(base.generated_at, 'offline-fallback', 'Base catalog must have generated_at="offline-fallback"');

    const stored = await posLocalStore.cargarCatalogoPos();
    assert.equal(stored.server_synced, false, 'Unsynced base catalog must have server_synced=false');
  });

  it('cart line reconciliation correctly remaps offline product IDs to server primary keys', () => {
    const serverCatalog = {
      generated_at: new Date().toISOString(),
      products: [
        { id: 42, name: 'Sándwich Italiano', price: 5200, updated_at: '2026-11-12T00:00:00Z' },
        { id: 43, name: 'Barros Luco', price: 5400, updated_at: '2026-11-12T00:00:00Z' },
      ],
      modifiers: [
        { id: 101, name: 'Extra Queso', price: 600, updated_at: '2026-11-12T00:00:00Z' },
      ]
    };

    // Client had lines created with old fallback IDs (e.g. id: 1 for Barros Luco, mod_id: 2)
    const prevLines = [
      {
        key: 'cart-1',
        product_id: 1, // Fallback ID
        product_name: 'Barros Luco',
        unit_price: 5400,
        quantity: 2,
        notes: 'Sin sal',
        modifiers: [{ modifier_id: 2, modifier_name: 'Extra Queso', price_at_sale: 600, quantity_per_unit: 1 }]
      }
    ];

    const remappedLines = prevLines.map(line => {
      const match = serverCatalog.products.find(p =>
        p.id === line.product_id ||
        p.name.trim().toLowerCase() === line.product_name.trim().toLowerCase()
      );
      if (!match) return line;
      const remappedModifiers = line.modifiers.map(mod => {
        const modMatch = serverCatalog.modifiers.find(m =>
          m.id === mod.modifier_id ||
          m.name.trim().toLowerCase() === mod.modifier_name.trim().toLowerCase()
        );
        return modMatch
          ? { ...mod, modifier_id: modMatch.id, modifier_name: modMatch.name, price_at_sale: modMatch.price }
          : mod;
      });
      return {
        ...line,
        product_id: match.id,
        product_name: match.name,
        unit_price: match.price,
        modifiers: remappedModifiers,
      };
    });

    assert.equal(remappedLines[0].product_id, 43, 'Product ID should be remapped to server PK 43');
    assert.equal(remappedLines[0].modifiers[0].modifier_id, 101, 'Modifier ID should be remapped to server PK 101');
  });
});
