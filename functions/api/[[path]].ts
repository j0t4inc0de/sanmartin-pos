import { FALLBACK_MENU_CATALOG } from './fallbackMenuCatalog.ts';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const isMenuGet =
    context.request.method === 'GET' &&
    (url.pathname === '/api/menu/' || url.pathname === '/api/menu');

  if (isMenuGet) {
    const targetUrl = new URL(`https://api.sangucheriasanmartin.cl/api/menu/${url.search}`);
    const cacheUrl = new URL(url.toString());
    cacheUrl.pathname = '/api/menu/';
    cacheUrl.search = '';
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

    let backendResponse: Response | null = null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const backendRequest = new Request(targetUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent':
            context.request.headers.get('User-Agent') || 'Cloudflare-Edge-Menu',
        },
        signal: controller.signal,
      });

      const res = await fetch(backendRequest);
      if (res.ok && res.status === 200) {
        backendResponse = res;
      }
    } catch {
      backendResponse = null;
    } finally {
      clearTimeout(timeoutId);
    }

    if (backendResponse) {
      try {
        const text = await backendResponse.text();
        const parsed = JSON.parse(text);
        if (
          Array.isArray(parsed.categories) &&
          Array.isArray(parsed.products) &&
          parsed.products.length > 0
        ) {
          const headers = new Headers();
          headers.set('Content-Type', 'application/json; charset=utf-8');
          headers.set(
            'Cache-Control',
            'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
          );
          headers.set('X-Catalog-Source', 'origin');
          headers.set('Access-Control-Allow-Origin', '*');

          const responseToReturn = new Response(text, {
            status: 200,
            headers,
          });

          try {
            if (typeof caches !== 'undefined' && (caches as any).default) {
              const cache = (caches as any).default;
              if (typeof cache.put === 'function') {
                context.waitUntil(cache.put(cacheKey, responseToReturn.clone()));
              }
            }
          } catch (cacheErr) {
            console.error('Failed to put to edge cache:', cacheErr);
          }

          return responseToReturn;
        }
      } catch (parseErr) {
        console.error('Failed to parse origin response:', parseErr);
      }
    }

    // Backend is offline, timed out, or returned an error/empty payload.
    // 1. Try to serve from Cloudflare Edge Cache.
    try {
      if (typeof caches !== 'undefined' && (caches as any).default) {
        const cache = (caches as any).default;
        if (typeof cache.match === 'function') {
          const cached = await cache.match(cacheKey);
          if (cached) {
            const headers = new Headers(cached.headers);
            headers.set('X-Catalog-Source', 'edge-cache');
            headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=86400');
            headers.set('Access-Control-Allow-Origin', '*');
            return new Response(cached.body, {
              status: 200,
              headers,
            });
          }
        }
      }
    } catch (cacheMatchErr) {
      console.error('Failed to match edge cache:', cacheMatchErr);
    }

    // 2. Serve bundled fallback catalog if no edge cache exists.
    const fallbackHeaders = new Headers();
    fallbackHeaders.set('Content-Type', 'application/json; charset=utf-8');
    fallbackHeaders.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=120, stale-while-revalidate=86400'
    );
    fallbackHeaders.set('X-Catalog-Source', 'fallback');
    fallbackHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(JSON.stringify(FALLBACK_MENU_CATALOG), {
      status: 200,
      headers: fallbackHeaders,
    });
  }

  // Non-menu proxy request
  const targetUrl = new URL(`https://api.sangucheriasanmartin.cl${url.pathname}${url.search}`);
  const backendRequest = new Request(targetUrl.toString(), context.request);
  try {
    return await fetch(backendRequest);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Backend no disponible',
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
