import { useCallback, useEffect, useState } from 'react';
import { MenuItem } from '../types';

export interface MenuCategory {
  id: string;
  name: string;
}

interface CatalogResponse {
  categories: Array<{
    slug: string;
    name: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    ingredients: string[];
    price: number;
    original_price: number | null;
    image_url: string;
    badge: string;
    is_available: boolean;
  }>;
}

interface MenuCatalogState {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
}

export const useMenuCatalog = (): MenuCatalogState => {
  const [categories, setCategories] = useState<MenuCategory[]>([
    { id: 'all', name: 'Todos' },
  ]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [requestNumber, setRequestNumber] = useState(0);

  const retry = useCallback(() => {
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCatalog = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch('/api/menu/', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`La API respondió con estado ${response.status}.`);
        }

        const catalog = (await response.json()) as CatalogResponse;
        setCategories([
          { id: 'all', name: 'Todos' },
          ...catalog.categories.map(({ slug, name }) => ({ id: slug, name })),
        ]);
        setItems(
          catalog.products.map((product) => ({
            ...product,
            originalPrice: product.original_price ?? undefined,
            image: product.image_url,
          })),
        );
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadCatalog();
    return () => controller.abort();
  }, [requestNumber]);

  return { categories, items, isLoading, hasError, retry };
};
