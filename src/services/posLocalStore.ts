export interface PosCatalogModifier {
  id: number;
  name: string;
  price: number;
  modifier_type: 'EXTRA_PAGO' | 'EXCLUSION_COCINA';
  updated_at: string;
}

export interface PosCatalogProduct {
  id: number;
  slug: string;
  category_id: number;
  category_name: string;
  name: string;
  price: number;
  updated_at: string;
  image_url: string;
}

export interface PosCatalog {
  generated_at: string;
  categories: { id: number; name: string; slug: string; sort_order: number }[];
  products: PosCatalogProduct[];
  modifiers: PosCatalogModifier[];
}

interface StoredCatalog {
  key: 'current';
  catalog: PosCatalog;
  saved_at: string;
}

const DATABASE_NAME = 'san-martin-pos';
const DATABASE_VERSION = 1;
const CATALOG_STORE = 'pos_catalog';

let databasePromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Este navegador no permite almacenamiento local IndexedDB.'));
  }

  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(CATALOG_STORE)) {
          database.createObjectStore(CATALOG_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento local.'));
      request.onblocked = () => reject(new Error('El almacenamiento local está bloqueado por otra pestaña.'));
    }).catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
};

export const guardarCatalogoPos = async (catalog: PosCatalog): Promise<void> => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CATALOG_STORE, 'readwrite');
    transaction.objectStore(CATALOG_STORE).put({
      key: 'current',
      catalog,
      saved_at: new Date().toISOString(),
    } satisfies StoredCatalog);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el catálogo local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del catálogo local.'));
  });
};

export const cargarCatalogoPos = async (): Promise<StoredCatalog | null> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CATALOG_STORE, 'readonly');
    const request = transaction.objectStore(CATALOG_STORE).get('current');
    request.onsuccess = () => resolve((request.result as StoredCatalog | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer el catálogo local.'));
  });
};
