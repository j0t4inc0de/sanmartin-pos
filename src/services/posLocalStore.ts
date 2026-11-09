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

export interface PosSaleDraft {
  shift_uuid: string;
  lines: {
    key: string;
    product_id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    notes: string;
    modifiers: {
      modifier_id: number;
      modifier_name: string;
      price_at_sale: number;
      quantity_per_unit: number;
    }[];
  }[];
  consumption_type: 'PARA_SERVIR' | 'PARA_LLEVAR';
  payment_method: 'EFECTIVO' | 'TRANSBANK' | 'TRANSFERENCIA';
  amount_received: string;
  saved_at: string;
}

interface StoredCatalog {
  key: 'current';
  catalog: PosCatalog;
  saved_at: string;
}

interface StoredSaleDraft extends PosSaleDraft {
  key: string;
}

const DATABASE_NAME = 'san-martin-pos';
const DATABASE_VERSION = 2;
const CATALOG_STORE = 'pos_catalog';
const DRAFT_STORE = 'pos_sale_drafts';

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
        if (!database.objectStoreNames.contains(DRAFT_STORE)) {
          database.createObjectStore(DRAFT_STORE, { keyPath: 'key' });
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

export const guardarBorradorVentaPos = async (
  draft: Omit<PosSaleDraft, 'saved_at'>,
): Promise<void> => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, 'readwrite');
    transaction.objectStore(DRAFT_STORE).put({
      ...draft,
      key: draft.shift_uuid,
      saved_at: new Date().toISOString(),
    } satisfies StoredSaleDraft);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el borrador local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del borrador local.'));
  });
};

export const cargarBorradorVentaPos = async (
  shiftUuid: string,
): Promise<PosSaleDraft | null> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, 'readonly');
    const request = transaction.objectStore(DRAFT_STORE).get(shiftUuid);
    request.onsuccess = () => {
      const stored = request.result as StoredSaleDraft | undefined;
      if (!stored) {
        resolve(null);
        return;
      }
      const { key: _key, ...draft } = stored;
      resolve(draft);
    };
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer el borrador local.'));
  });
};
