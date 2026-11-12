import { BASE_POS_CATALOG } from '../data/defaultCatalog';
import { solicitarApi } from './apiClient';

export interface PosCatalogModifier {
  id: number;
  name: string;
  price: number;
  modifier_type: 'EXTRA_PAGO' | 'EXCLUSION_COCINA';
  updated_at: string;
  is_available?: boolean;
  is_active?: boolean;
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
  description?: string;
  ingredients?: string[];
  original_price?: number | null;
  badge?: string;
  is_available?: boolean;
  is_active?: boolean;
}

export interface PosCatalogCategory {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active?: boolean;
  updated_at?: string;
}

export interface PosCatalog {
  generated_at: string;
  categories: PosCatalogCategory[];
  products: PosCatalogProduct[];
  modifiers: PosCatalogModifier[];
}

export interface StoredCatalog {
  key: 'current';
  catalog: PosCatalog;
  saved_at: string;
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

export interface PosPendingPaymentDraft {
  status: 'PREPARADO' | 'PAGO_RECIBIDO';
  offline_created?: boolean;
  shift_uuid: string;
  uuid: string;
  shift_order_number: number;
  created_at: string;
  consumption_type: 'PARA_SERVIR' | 'PARA_LLEVAR';
  quote: {
    quote_token: string;
    valid_until: string;
    requires_confirmation: boolean;
    items: {
      product_id: number;
      product_name: string;
      quantity: number;
      unit_price: number;
      notes?: string;
      modifiers: {
        modifier_id: number;
        modifier_name: string;
        price_at_sale: number;
        quantity_per_unit: number;
      }[];
      line_total: number;
    }[];
    subtotal: number;
    total_amount: number;
  };
  price_confirmation_accepted: boolean;
  payment_method: 'EFECTIVO' | 'TRANSBANK' | 'TRANSFERENCIA';
  amount_received: string;
  payment_received_at: string | null;
  saved_at: string;
}

export interface PosOfflineUser {
  id: number;
  username: string;
  can_operate_pos: boolean;
}

export interface PosOfflineAccessRecord {
  user: PosOfflineUser;
  saved_at: string;
}

export interface PosCachedShiftState<TShift> {
  shift: TShift | null;
  another_shift_open: boolean;
  next_order_number: number;
  saved_at: string;
}

export interface PosOfflineOrder {
  uuid: string;
  shift_order_number: number;
  shift_uuid: string;
  created_at: string;
  offline_created: true;
  consumption_type: 'PARA_SERVIR' | 'PARA_LLEVAR';
  payment_method: 'EFECTIVO' | 'TRANSBANK' | 'TRANSFERENCIA';
  amount_received?: number;
  items: {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    notes: string;
    modifiers: { modifier_id: number; modifier_name: string; quantity_per_unit: number; price_at_sale: number }[];
  }[];
  saved_at: string;
  sync_error: string | null;
}

export interface PosOfflineShiftEvent {
  key: string;
  user_id: number;
  shift_uuid: string;
  event_type: 'OPEN' | 'CLOSE';
  payload: {
    opened_at?: string;
    initial_cash?: number;
    closed_at?: string;
    counted_cash?: number | null;
    closed_automatically?: boolean;
    notes?: string;
  };
  saved_at: string;
  sync_error: string | null;
}

export interface PosOfflineCancellation {
  order_uuid: string;
  shift_uuid: string;
  shift_order_number: number;
  reason: string;
  requested_at: string;
  saved_at: string;
  sync_error: string | null;
}

interface StoredSaleDraft extends PosSaleDraft {
  key: string;
}

interface StoredPendingPaymentDraft extends PosPendingPaymentDraft {
  key: string;
}

interface StoredOfflineAccessRecord extends PosOfflineAccessRecord {
  key: 'current';
}

interface StoredShiftState<TShift> extends PosCachedShiftState<TShift> {
  key: number;
}

interface StoredOfflineOrder extends PosOfflineOrder {}
interface StoredOfflineShiftEvent extends PosOfflineShiftEvent {}

const DATABASE_NAME = 'san-martin-pos';
const DATABASE_VERSION = 7;
const CATALOG_STORE = 'pos_catalog';
const DRAFT_STORE = 'pos_sale_drafts';
const PAYMENT_DRAFT_STORE = 'pos_pending_payments';
const OFFLINE_ACCESS_STORE = 'pos_offline_access';
const SHIFT_CACHE_STORE = 'pos_shift_cache';
const OFFLINE_ORDER_STORE = 'pos_offline_orders';
const OFFLINE_SHIFT_EVENT_STORE = 'pos_offline_shift_events';
const OFFLINE_CANCELLATION_STORE = 'pos_offline_cancellations';

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
        if (!database.objectStoreNames.contains(PAYMENT_DRAFT_STORE)) {
          database.createObjectStore(PAYMENT_DRAFT_STORE, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(OFFLINE_ACCESS_STORE)) {
          database.createObjectStore(OFFLINE_ACCESS_STORE, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(SHIFT_CACHE_STORE)) {
          database.createObjectStore(SHIFT_CACHE_STORE, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(OFFLINE_ORDER_STORE)) {
          database.createObjectStore(OFFLINE_ORDER_STORE, { keyPath: 'uuid' });
        }
        if (!database.objectStoreNames.contains(OFFLINE_SHIFT_EVENT_STORE)) {
          database.createObjectStore(OFFLINE_SHIFT_EVENT_STORE, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(OFFLINE_CANCELLATION_STORE)) {
          database.createObjectStore(OFFLINE_CANCELLATION_STORE, { keyPath: 'order_uuid' });
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

export const obtenerCatalogoBasePos = (): PosCatalog => {
  return JSON.parse(JSON.stringify(BASE_POS_CATALOG)) as PosCatalog;
};

export const guardarCatalogoPos = async (catalog: PosCatalog): Promise<void> => {
  const record: StoredCatalog = {
    key: 'current',
    catalog,
    saved_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem('san-martin-pos:catalog-cache', JSON.stringify(record));
  } catch {}

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CATALOG_STORE, 'readwrite');
    transaction.objectStore(CATALOG_STORE).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el catálogo local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del catálogo local.'));
  });
};

export const cargarCatalogoPos = async (): Promise<StoredCatalog> => {
  let stored: StoredCatalog | null = null;

  try {
    const database = await openDatabase();
    stored = await new Promise<StoredCatalog | null>((resolve, reject) => {
      const transaction = database.transaction(CATALOG_STORE, 'readonly');
      const request = transaction.objectStore(CATALOG_STORE).get('current');
      request.onsuccess = () => resolve((request.result as StoredCatalog | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('No se pudo leer el catálogo local.'));
    });
  } catch (error) {
    console.warn('No se pudo leer el catálogo desde IndexedDB, intentando respaldo:', error);
  }

  if (!stored) {
    try {
      const raw = localStorage.getItem('san-martin-pos:catalog-cache');
      if (raw) {
        stored = JSON.parse(raw) as StoredCatalog;
      }
    } catch {}
  }

  const base = obtenerCatalogoBasePos();

  // If no stored catalog or it has empty categories/products, initialize with base catalog
  if (!stored || !stored.catalog || !stored.catalog.products?.length || !stored.catalog.categories?.length) {
    const initialStored: StoredCatalog = {
      key: 'current',
      catalog: base,
      saved_at: new Date().toISOString(),
    };
    try {
      await guardarCatalogoPos(base);
    } catch {}
    return initialStored;
  }

  // Enrich any products missing ingredients/description from base catalog
  const baseProductBySlug = new Map(base.products.map(p => [p.slug, p]));
  const baseProductByName = new Map(base.products.map(p => [p.name.trim().toLowerCase(), p]));

  let needsSave = false;
  const products = stored.catalog.products.map(p => {
    const fallback = baseProductBySlug.get(p.slug) || baseProductByName.get(p.name.trim().toLowerCase());
    if (!fallback) return p;

    const hasIngredients = Array.isArray(p.ingredients) && p.ingredients.length > 0;
    const hasDesc = typeof p.description === 'string' && p.description.trim() !== '';

    if (!hasIngredients || !hasDesc || p.is_available === undefined || p.is_active === undefined) {
      needsSave = true;
      return {
        ...p,
        description: hasDesc ? p.description : fallback.description,
        ingredients: hasIngredients ? p.ingredients : fallback.ingredients,
        original_price: p.original_price !== undefined ? p.original_price : fallback.original_price,
        badge: p.badge || fallback.badge,
        is_available: p.is_available ?? fallback.is_available ?? true,
        is_active: p.is_active ?? fallback.is_active ?? true,
      };
    }
    return p;
  });

  let modifiers = stored.catalog.modifiers;
  if (!modifiers || modifiers.length === 0) {
    modifiers = base.modifiers;
    needsSave = true;
  }

  const fullCatalog: PosCatalog = {
    ...stored.catalog,
    products,
    modifiers,
  };

  if (needsSave) {
    void guardarCatalogoPos(fullCatalog).catch(() => undefined);
  }

  return {
    key: 'current',
    catalog: fullCatalog,
    saved_at: stored.saved_at ?? new Date().toISOString(),
  };
};

export const precargarCatalogoPos = async (): Promise<PosCatalog> => {
  try {
    const [nextCategories, nextProducts, nextModifiers] = await Promise.all([
      solicitarApi<PosCatalogCategory[]>('/api/pos/catalog/manage/categories/'),
      solicitarApi<PosCatalogProduct[]>('/api/pos/catalog/manage/products/'),
      solicitarApi<PosCatalogModifier[]>('/api/pos/catalog/manage/modifiers/'),
    ]);
    const catalog: PosCatalog = {
      generated_at: new Date().toISOString(),
      categories: nextCategories,
      products: nextProducts,
      modifiers: nextModifiers,
    };
    await guardarCatalogoPos(catalog);
    return catalog;
  } catch {
    const stored = await cargarCatalogoPos();
    return stored.catalog;
  }
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

export const guardarCobroPendientePos = async (
  draft: Omit<PosPendingPaymentDraft, 'saved_at'>,
): Promise<void> => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(PAYMENT_DRAFT_STORE, 'readwrite');
    transaction.objectStore(PAYMENT_DRAFT_STORE).put({
      ...draft,
      key: draft.shift_uuid,
      saved_at: new Date().toISOString(),
    } satisfies StoredPendingPaymentDraft);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar la cotización local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado de la cotización local.'));
  });
};

export const cargarCobroPendientePos = async (
  shiftUuid: string,
): Promise<PosPendingPaymentDraft | null> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PAYMENT_DRAFT_STORE, 'readonly');
    const request = transaction.objectStore(PAYMENT_DRAFT_STORE).get(shiftUuid);
    request.onsuccess = () => {
      const stored = request.result as StoredPendingPaymentDraft | undefined;
      if (!stored) {
        resolve(null);
        return;
      }
      resolve({
        shift_uuid: stored.shift_uuid,
        uuid: stored.uuid,
        shift_order_number: stored.shift_order_number,
        created_at: stored.created_at,
        consumption_type: stored.consumption_type,
        quote: stored.quote,
        price_confirmation_accepted: stored.price_confirmation_accepted,
        payment_method: stored.payment_method,
        amount_received: stored.amount_received,
        payment_received_at: stored.payment_received_at,
        status: stored.status,
        offline_created: stored.offline_created,
        saved_at: stored.saved_at,
      });
    };
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer la cotización local.'));
  });
};

export const eliminarCobroPendientePos = async (shiftUuid: string): Promise<void> => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(PAYMENT_DRAFT_STORE, 'readwrite');
    transaction.objectStore(PAYMENT_DRAFT_STORE).delete(shiftUuid);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo limpiar la cotización local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló la limpieza de la cotización local.'));
  });
};

export const guardarAccesoOfflinePos = async (
  record: Pick<PosOfflineAccessRecord, 'user'>,
): Promise<void> => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_ACCESS_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_ACCESS_STORE).put({
      ...record,
      key: 'current',
      saved_at: new Date().toISOString(),
    } satisfies StoredOfflineAccessRecord);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el acceso offline.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del acceso offline.'));
  });
};

export const cargarAccesoOfflinePos = async (): Promise<PosOfflineAccessRecord | null> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_ACCESS_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_ACCESS_STORE);
    const request = store.get('current');
    let record: PosOfflineAccessRecord | null = null;
    request.onsuccess = () => {
      const stored = request.result as StoredOfflineAccessRecord | undefined;
      if (stored) {
        record = {
          user: stored.user,
          saved_at: stored.saved_at ?? new Date().toISOString(),
        };
        // Remove legacy offline credential fields from previously saved records.
        store.put({ ...record, key: 'current' } satisfies StoredOfflineAccessRecord);
      }
    };
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer el acceso offline.'));
    transaction.oncomplete = () => resolve(record);
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo actualizar el acceso offline local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló la actualización del acceso offline local.'));
  });
};

export const guardarTurnoEnCachePos = async <TShift>(
  userId: number,
  state: Omit<PosCachedShiftState<TShift>, 'saved_at'>,
): Promise<void> => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(SHIFT_CACHE_STORE, 'readwrite');
    transaction.objectStore(SHIFT_CACHE_STORE).put({
      ...state,
      key: userId,
      saved_at: new Date().toISOString(),
    } satisfies StoredShiftState<TShift>);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el estado local del turno.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado local del turno.'));
  });
};

export const cargarTurnoDesdeCachePos = async <TShift>(
  userId: number,
): Promise<PosCachedShiftState<TShift> | null> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SHIFT_CACHE_STORE, 'readonly');
    const request = transaction.objectStore(SHIFT_CACHE_STORE).get(userId);
    request.onsuccess = () => {
      const stored = request.result as StoredShiftState<TShift> | undefined;
      if (!stored) {
        resolve(null);
        return;
      }
      const { key: _key, ...state } = stored;
      resolve(state);
    };
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer el estado local del turno.'));
  });
};

export const guardarVentaOfflineEnColaPos = async (
  order: Omit<PosOfflineOrder, 'saved_at' | 'sync_error'>,
): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([OFFLINE_ORDER_STORE, PAYMENT_DRAFT_STORE, DRAFT_STORE], 'readwrite');
    transaction.objectStore(OFFLINE_ORDER_STORE).put({ ...order, saved_at: new Date().toISOString(), sync_error: null } satisfies StoredOfflineOrder);
    transaction.objectStore(PAYMENT_DRAFT_STORE).delete(order.shift_uuid);
    transaction.objectStore(DRAFT_STORE).delete(order.shift_uuid);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar la venta offline.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado de la venta offline.'));
  });
};

export const listarVentasOfflineEnColaPos = async (shiftUuid?: string): Promise<PosOfflineOrder[]> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_ORDER_STORE, 'readonly');
    const request = transaction.objectStore(OFFLINE_ORDER_STORE).getAll();
    request.onsuccess = () => resolve((request.result as StoredOfflineOrder[])
      .filter(order => !shiftUuid || order.shift_uuid === shiftUuid)
      .sort((left, right) => left.shift_order_number - right.shift_order_number));
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer la cola de ventas offline.'));
  });
};

export const eliminarVentaOfflineDeColaPos = async (uuid: string): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_ORDER_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_ORDER_STORE).delete(uuid);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo retirar la venta sincronizada de la cola local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló la limpieza de la cola local.'));
  });
};

export const marcarErrorVentaOfflineEnColaPos = async (uuid: string, error: string): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_ORDER_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_ORDER_STORE);
    const request = store.get(uuid);
    request.onsuccess = () => {
      if (request.result) store.put({ ...request.result, sync_error: error.slice(0, 255) } satisfies StoredOfflineOrder);
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el error de sincronización.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del error de sincronización.'));
  });
};

export const guardarAnulacionOfflinePos = async (cancellation: Omit<PosOfflineCancellation, 'saved_at' | 'sync_error'>): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_CANCELLATION_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_CANCELLATION_STORE).put({ ...cancellation, saved_at: new Date().toISOString(), sync_error: null } satisfies PosOfflineCancellation);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar la anulación offline.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado de la anulación offline.'));
  });
};

export const listarAnulacionesOfflinePos = async (shiftUuid?: string): Promise<PosOfflineCancellation[]> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_CANCELLATION_STORE, 'readonly');
    const request = transaction.objectStore(OFFLINE_CANCELLATION_STORE).getAll();
    request.onsuccess = () => resolve((request.result as PosOfflineCancellation[])
      .filter(item => !shiftUuid || item.shift_uuid === shiftUuid)
      .sort((left, right) => left.shift_order_number - right.shift_order_number));
    request.onerror = () => reject(request.error ?? new Error('No se pudieron leer las anulaciones offline.'));
  });
};

export const eliminarAnulacionOfflinePos = async (orderUuid: string): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_CANCELLATION_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_CANCELLATION_STORE).delete(orderUuid);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo retirar la anulación sincronizada.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló la limpieza de la anulación.'));
  });
};

export const marcarErrorAnulacionOfflinePos = async (orderUuid: string, error: string): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_CANCELLATION_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_CANCELLATION_STORE);
    const request = store.get(orderUuid);
    request.onsuccess = () => { if (request.result) store.put({ ...request.result, sync_error: error.slice(0, 255) } satisfies PosOfflineCancellation); };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el error de sincronización de la anulación.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del error de anulación.'));
  });
};

export const guardarEventoTurnoOfflinePos = async (
  event: Omit<PosOfflineShiftEvent, 'saved_at' | 'sync_error' | 'key'>,
): Promise<void> => {
  const database = await openDatabase();
  const key = `${event.user_id}:${event.shift_uuid}:${event.event_type}`;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_SHIFT_EVENT_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_SHIFT_EVENT_STORE).put({
      ...event,
      key,
      saved_at: new Date().toISOString(),
      sync_error: null,
    } satisfies StoredOfflineShiftEvent);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el evento local del turno.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado local del turno.'));
  });
};

export const guardarEventoYTurnoEnCacheOfflinePos = async <TShift>(
  userId: number,
  state: Omit<PosCachedShiftState<TShift>, 'saved_at'>,
  event: Omit<PosOfflineShiftEvent, 'saved_at' | 'sync_error' | 'key'>,
): Promise<void> => {
  const database = await openDatabase();
  const key = `${event.user_id}:${event.shift_uuid}:${event.event_type}`;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([SHIFT_CACHE_STORE, OFFLINE_SHIFT_EVENT_STORE], 'readwrite');
    transaction.objectStore(SHIFT_CACHE_STORE).put({ ...state, key: userId, saved_at: new Date().toISOString() });
    transaction.objectStore(OFFLINE_SHIFT_EVENT_STORE).put({
      ...event,
      key,
      saved_at: new Date().toISOString(),
      sync_error: null,
    } satisfies StoredOfflineShiftEvent);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el evento y el turno offline.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del turno offline.'));
  });
};

export const listarEventosTurnoOfflinePos = async (
  userId: number,
  eventType?: PosOfflineShiftEvent['event_type'],
): Promise<PosOfflineShiftEvent[]> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_SHIFT_EVENT_STORE, 'readonly');
    const request = transaction.objectStore(OFFLINE_SHIFT_EVENT_STORE).getAll();
    request.onsuccess = () => resolve((request.result as StoredOfflineShiftEvent[])
      .filter(event => event.user_id === userId && (!eventType || event.event_type === eventType))
      .sort((left, right) => left.saved_at.localeCompare(right.saved_at)));
    request.onerror = () => reject(request.error ?? new Error('No se pudieron leer los eventos locales del turno.'));
  });
};

export const eliminarEventoTurnoOfflinePos = async (event: PosOfflineShiftEvent): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_SHIFT_EVENT_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_SHIFT_EVENT_STORE).delete(event.key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo retirar el evento sincronizado del turno.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló la limpieza del evento del turno.'));
  });
};

export const marcarErrorEventoTurnoOfflinePos = async (event: PosOfflineShiftEvent, error: string): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_SHIFT_EVENT_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_SHIFT_EVENT_STORE);
    const request = store.get(event.key);
    request.onsuccess = () => {
      if (request.result) store.put({ ...request.result, sync_error: error.slice(0, 255) } satisfies StoredOfflineShiftEvent);
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el error del evento de turno.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del error del evento.'));
  });
};
