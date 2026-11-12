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
});
