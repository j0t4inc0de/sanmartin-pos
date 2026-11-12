import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FALLBACK_MENU_CATALOG as edgeFallback } from '../functions/api/fallbackMenuCatalog.ts';
import { FALLBACK_MENU_CATALOG as srcFallback } from '../src/data/fallbackMenuCatalog.ts';
import { onRequest } from '../functions/api/[[path]].ts';

describe('Public Menu & Edge Cache Resilience', () => {
  it('Edge fallback catalog contains all 8 categories and 64 products', () => {
    assert.equal(edgeFallback.categories.length, 8, 'Must have 8 categories');
    assert.equal(edgeFallback.products.length, 64, 'Must have 64 products');

    const expectedCategories = [
      'sandwiches',
      'vianesas',
      'ases',
      'chorrillanas',
      'acompanamientos',
      'salsas',
      'bebestibles',
      'agregados',
    ];

    const categorySlugs = edgeFallback.categories.map((c) => c.slug);
    for (const slug of expectedCategories) {
      assert.ok(
        categorySlugs.includes(slug),
        `Categories must include "${slug}"`
      );
    }

    for (const product of edgeFallback.products) {
      assert.ok(product.id, 'Product must have an id (slug)');
      assert.ok(product.name, 'Product must have a name');
      assert.ok(product.category, 'Product must have a category');
      assert.ok(typeof product.price === 'number', 'Product price must be a number');
      assert.ok(Array.isArray(product.ingredients), 'Ingredients must be an array');
      assert.equal(product.is_available, true, 'Product should be available');
    }
  });

  it('Frontend fallback catalog matches Edge fallback catalog exactly', () => {
    assert.deepEqual(edgeFallback, srcFallback, 'Edge and Frontend fallback catalogs must match');
  });

  it('Cloudflare Pages onRequest handler returns fallback when backend is offline and no cache exists', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new TypeError('Backend offline simulated'); };
    try {
      const fakeContext = {
        request: new Request('https://sangucheriasanmartin.cl/api/menu/', {
          method: 'GET',
          headers: new Headers(),
        }),
        env: {},
        params: {},
        waitUntil: () => {},
        next: async () => new Response('Not found', { status: 404 }),
      };

      const response = await onRequest(fakeContext);

      assert.equal(response.status, 200, 'Must return HTTP 200 even when backend is offline');
      assert.equal(
        response.headers.get('Content-Type'),
        'application/json; charset=utf-8'
      );
      assert.equal(response.headers.get('X-Catalog-Source'), 'fallback');

      const body = await response.json();
      assert.equal(body.categories.length, 8);
      assert.equal(body.products.length, 64);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('Cloudflare Pages onRequest handler serves from caches.default when backend fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new TypeError('Backend offline simulated'); };
    const cachedBody = JSON.stringify({
      generated_at: '2026-11-12T00:00:00Z',
      categories: [{ slug: 'sandwiches', name: 'Sándwiches (Cached)', sort_order: 1 }],
      products: [{ id: 'sandwich-italiano', name: 'Sándwich Italiano Cached', category: 'sandwiches', description: 'Desc', ingredients: ['Palta'], price: 5500, original_price: null, image_url: '/img.jpg', badge: 'Cached', is_available: true }],
    });

    let putCalled = false;
    let matchCalled = false;

    // Mock global caches
    const mockCache = {
      match: async () => {
        matchCalled = true;
        return new Response(cachedBody, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
      put: async () => {
        putCalled = true;
      },
    };

    // Temporarily attach mock caches
    const originalCaches = globalThis.caches;
    // @ts-ignore
    globalThis.caches = { default: mockCache };

    try {
      const fakeContext = {
        request: new Request('https://sangucheriasanmartin.cl/api/menu/', {
          method: 'GET',
          headers: new Headers(),
        }),
        env: {},
        params: {},
        waitUntil: () => {},
        next: async () => new Response('Not found', { status: 404 }),
      };

      const response = await onRequest(fakeContext);

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('X-Catalog-Source'), 'edge-cache');
      assert.ok(matchCalled, 'Must have attempted to match edge cache');

      const body = await response.json();
      assert.equal(body.products[0].name, 'Sándwich Italiano Cached');
    } finally {
      // @ts-ignore
      globalThis.caches = originalCaches;
      globalThis.fetch = originalFetch;
    }
  });

  it('Cloudflare Pages onRequest passes non-menu endpoints to origin proxy', async () => {
    const originalFetch = globalThis.fetch;
    let proxiedUrl = '';
    globalThis.fetch = async (input, init) => {
      proxiedUrl = typeof input === 'string' ? input : input.url;
      return new Response(JSON.stringify({ proxied: true }), { status: 200 });
    };
    try {
      const fakeContext = {
        request: new Request('https://sangucheriasanmartin.cl/api/pos/orders/', {
          method: 'POST',
          headers: new Headers(),
          body: JSON.stringify({ test: 123 }),
        }),
        env: {},
        params: {},
        waitUntil: () => {},
        next: async () => new Response('Not found', { status: 404 }),
      };

      const response = await onRequest(fakeContext);
      assert.equal(response.status, 200);
      assert.ok(proxiedUrl.includes('api.sangucheriasanmartin.cl'), 'Must forward to origin api domain');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
