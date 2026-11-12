import { useCallback, useEffect, useMemo, useState } from 'react';
import { MenuItem } from '../types';
import {
  CatalogResponse,
  FALLBACK_MENU_CATALOG,
} from '../data/fallbackMenuCatalog';

export interface MenuCategory {
  id: string;
  name: string;
}

export type CatalogSource =
  | 'origin'
  | 'edge-cache'
  | 'local-storage'
  | 'bundled-fallback';

export interface MenuCatalogState {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoading: boolean;
  hasError: boolean;
  isOfflineFallback: boolean;
  catalogSource: CatalogSource;
  retry: () => void;
}

export const MENU_STORAGE_KEY = 'sanmartin_menu_catalog_cache';

const processCatalog = (
  catalog: CatalogResponse
): { categories: MenuCategory[]; items: MenuItem[] } => {
  const categories: MenuCategory[] = [
    { id: 'all', name: 'Todos' },
    ...catalog.categories.map(({ slug, name }) => ({ id: slug, name })),
  ];

  const items: MenuItem[] = catalog.products.map((product) => ({
    ...product,
    originalPrice: product.original_price ?? undefined,
    image: product.image_url,
  }));

  return { categories, items };
};

const getInitialCatalog = (): {
  categories: MenuCategory[];
  items: MenuItem[];
  isOfflineFallback: boolean;
  catalogSource: CatalogSource;
} => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(MENU_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CatalogResponse;
        if (
          Array.isArray(parsed?.categories) &&
          Array.isArray(parsed?.products) &&
          parsed.products.length > 0
        ) {
          const processed = processCatalog(parsed);
          return {
            categories: processed.categories,
            items: processed.items,
            isOfflineFallback: false,
            catalogSource: 'local-storage',
          };
        }
      }
    }
  } catch (error) {
    console.warn('Error leyendo catálogo inicial desde localStorage:', error);
  }

  const fallback = processCatalog(FALLBACK_MENU_CATALOG);
  return {
    categories: fallback.categories,
    items: fallback.items,
    isOfflineFallback: true,
    catalogSource: 'bundled-fallback',
  };
};

export const useMenuCatalog = (): MenuCatalogState => {
  const initial = useMemo(() => getInitialCatalog(), []);

  const [categories, setCategories] = useState<MenuCategory[]>(initial.categories);
  const [items, setItems] = useState<MenuItem[]>(initial.items);
  const [isLoading, setIsLoading] = useState<boolean>(initial.items.length === 0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(
    initial.isOfflineFallback
  );
  const [catalogSource, setCatalogSource] = useState<CatalogSource>(
    initial.catalogSource
  );
  const [requestNumber, setRequestNumber] = useState(0);

  const retry = useCallback(() => {
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadCatalog = async () => {
      // If we don't have items yet, show loading
      if (items.length === 0) {
        setIsLoading(true);
      }

      try {
        const response = await fetch('/api/menu/', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`La API respondió con estado ${response.status}.`);
        }

        const sourceHeader = response.headers.get('X-Catalog-Source');
        const catalog = (await response.json()) as CatalogResponse;

        if (
          !catalog ||
          !Array.isArray(catalog.categories) ||
          !Array.isArray(catalog.products)
        ) {
          throw new Error('Estructura de catálogo devuelta por la API inválida.');
        }

        // Cache valid catalog in localStorage
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(
              MENU_STORAGE_KEY,
              JSON.stringify(catalog)
            );
          }
        } catch (e) {
          console.warn('No se pudo guardar la carta en localStorage:', e);
        }

        if (isMounted) {
          const processed = processCatalog(catalog);
          setCategories(processed.categories);
          setItems(processed.items);
          setHasError(false);

          if (sourceHeader === 'edge-cache') {
            setIsOfflineFallback(true);
            setCatalogSource('edge-cache');
          } else if (sourceHeader === 'fallback') {
            setIsOfflineFallback(true);
            setCatalogSource('bundled-fallback');
          } else {
            setIsOfflineFallback(false);
            setCatalogSource('origin');
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        console.warn(
          'No se pudo conectar a la API del menú, utilizando respaldo resiliente:',
          err
        );

        // Fetch failed. Fall back to localStorage first, then bundled fallback.
        let fallbackCatalog: CatalogResponse | null = null;
        let determinedSource: CatalogSource = 'bundled-fallback';

        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const rawStored = window.localStorage.getItem(MENU_STORAGE_KEY);
            if (rawStored) {
              const parsed = JSON.parse(rawStored) as CatalogResponse;
              if (
                Array.isArray(parsed?.categories) &&
                Array.isArray(parsed?.products) &&
                parsed.products.length > 0
              ) {
                fallbackCatalog = parsed;
                determinedSource = 'local-storage';
              }
            }
          }
        } catch (storageErr) {
          console.warn('Error leyendo de localStorage:', storageErr);
        }

        if (!fallbackCatalog) {
          fallbackCatalog = FALLBACK_MENU_CATALOG;
          determinedSource = 'bundled-fallback';
        }

        if (isMounted) {
          const fallbackProcessed = processCatalog(fallbackCatalog);
          setCategories(fallbackProcessed.categories);
          setItems(fallbackProcessed.items);
          setIsOfflineFallback(true);
          setCatalogSource(determinedSource);

          // NEVER show hasError = true if we have items available to show
          setHasError(fallbackProcessed.items.length === 0);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [requestNumber]);

  return {
    categories,
    items,
    isLoading,
    hasError,
    isOfflineFallback,
    catalogSource,
    retry,
  };
};
