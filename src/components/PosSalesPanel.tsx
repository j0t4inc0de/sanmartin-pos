import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Minus, Plus, RefreshCw, Search, ShoppingBag, ShoppingCart, Trash2, Utensils, X } from 'lucide-react';
import { solicitarApi } from '../services/apiClient';
import { usePosDialogs } from './PosDialogs';
import {
  cargarBorradorVentaPos,
  cargarCobroPendientePos,
  cargarCatalogoPos,
  type StoredCatalog,
  guardarBorradorVentaPos,
  guardarCobroPendientePos,
  guardarCatalogoPos,
  eliminarCobroPendientePos,
  eliminarVentaOfflineDeColaPos,
  listarVentasOfflineEnColaPos,
  listarAnulacionesOfflinePos,
  marcarErrorVentaOfflineEnColaPos,
  marcarErrorAnulacionOfflinePos,
  guardarAnulacionOfflinePos,
  eliminarAnulacionOfflinePos,
  guardarVentaOfflineEnColaPos,
  type PosCatalog as Catalog,
  type PosPendingPaymentDraft,
  type PosSaleDraft,
  type PosOfflineOrder,
} from '../services/posLocalStore';

type ConsumptionType = 'PARA_SERVIR' | 'PARA_LLEVAR';
type PaymentMethod = 'EFECTIVO' | 'TRANSBANK' | 'TRANSFERENCIA';
type Product = Catalog['products'][number];
interface CartModifier { modifier_id: number; modifier_name: string; price_at_sale: number; quantity_per_unit: number; }
interface CartLine { key: string; product_id: number; product_name: string; unit_price: number; quantity: number; notes: string; modifiers: CartModifier[]; }
interface Quote { uuid: string; shift_order_number: number; created_at: string; consumption_type: ConsumptionType; quote_token: string; valid_until: string; requires_confirmation: boolean; price_confirmation_accepted: boolean; offline_created?: boolean; items: PosPendingPaymentDraft['quote']['items']; subtotal: number; total_amount: number; }
type QuoteResponse = Pick<Quote, 'quote_token' | 'valid_until' | 'requires_confirmation' | 'items' | 'subtotal' | 'total_amount'>;
interface Sale { uuid: string; shift_order_number: number; total_amount: number; payment_method: PaymentMethod; amount_paid: number | null; change_given: number | null; }
interface OrderHistoryItem { uuid: string; shift_uuid: string; shift_order_number: number; created_at: string; payment_method: PaymentMethod; total_amount: number; status: 'COMPLETADA' | 'ANULADA'; cancellation_reason: string; }
interface OrderHistory { orders: OrderHistoryItem[]; open_shift_uuid: string | null; }
interface CatalogDelta extends Catalog {
  removed?: { categories: number[]; products: number[]; modifiers: number[] };
}

const applyCatalogDelta = (current: Catalog, delta: CatalogDelta): Catalog => {
  const mergeById = <T extends { id: number }>(existing: T[], changed: T[], removed: number[]) => {
    const entries = new Map(existing.filter(item => !removed.includes(item.id)).map(item => [item.id, item]));
    changed.forEach(item => {
      const prior = entries.get(item.id);
      entries.set(item.id, prior ? { ...prior, ...item } : item);
    });
    return [...entries.values()];
  };
  const categories = mergeById(current.categories, delta.categories, delta.removed?.categories ?? [])
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const categoryOrder = new Map(categories.map((category, index) => [category.id, index]));
  const products = mergeById(current.products, delta.products, delta.removed?.products ?? [])
    .sort((a, b) => (categoryOrder.get(a.category_id) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(b.category_id) ?? Number.MAX_SAFE_INTEGER)
      || a.name.localeCompare(b.name, 'es-CL') || a.id - b.id);
  const modifiers = mergeById(current.modifiers, delta.modifiers, delta.removed?.modifiers ?? [])
    .sort((a, b) => a.modifier_type.localeCompare(b.modifier_type) || a.name.localeCompare(b.name, 'es-CL') || a.id - b.id);
  return { generated_at: delta.generated_at, categories, products, modifiers };
};

const formatPrice = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
const button = 'rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-40';

export const PosSalesPanel = ({ shiftUuid, nextOrderNumber, onSale, onPendingPaymentChange, onQueueChange, onBeforeCreateSale, offlineMode = false, shiftSyncBlocked = false }: { shiftUuid: string; nextOrderNumber: number; onSale: (nextOrderNumber?: number, offlineCancellation?: { payment_method: PaymentMethod; total_amount: number }) => Promise<void>; onPendingPaymentChange: (pending: boolean) => void; onQueueChange: (pending: boolean) => void; onBeforeCreateSale: () => Promise<boolean>; offlineMode?: boolean; shiftSyncBlocked?: boolean }) => {
  const { confirm, prompt } = usePosDialogs();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [offlineOrders, setOfflineOrders] = useState<PosOfflineOrder[]>([]);
  const [offlineCancellations, setOfflineCancellations] = useState<Awaited<ReturnType<typeof listarAnulacionesOfflinePos>>>([]);
  const [syncingOfflineOrders, setSyncingOfflineOrders] = useState(false);
  const syncInProgress = useRef(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [consumptionType, setConsumptionType] = useState<ConsumptionType>('PARA_LLEVAR');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [paymentReceivedPending, setPaymentReceivedPending] = useState(false);
  const [preparedQuoteExpired, setPreparedQuoteExpired] = useState(false);
  const [paymentRecordWriteFailed, setPaymentRecordWriteFailed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState('');
  const [category, setCategory] = useState<number | 'all'>('all');
  const [productSearch, setProductSearch] = useState('');
  const productSearchRef = useRef<HTMLInputElement>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  const [draftSaveStatus, setDraftSaveStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [catalogNotice, setCatalogNotice] = useState('');
  const catalogSyncInProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const draftWriteVersion = useRef(0);
  const paymentWriteVersion = useRef(0);

  useEffect(() => {
    onPendingPaymentChange(!draftLoaded || draftLoadError || quote !== null);
  }, [draftLoaded, draftLoadError, quote, onPendingPaymentChange]);

  useEffect(() => { onQueueChange(offlineOrders.length > 0 || offlineCancellations.length > 0); }, [offlineOrders, offlineCancellations, onQueueChange]);

  const currentDraft = (): Omit<PosSaleDraft, 'saved_at'> => ({
    shift_uuid: shiftUuid,
    lines,
    consumption_type: consumptionType,
    payment_method: paymentMethod,
    amount_received: amountReceived,
  });

  useEffect(() => {
    let active = true;
    setDraftLoaded(false);
    setDraftLoadError(false);
    setDraftSaveStatus('loading');
    setPendingPaymentStatus('idle');
    setPaymentReceivedPending(false);
    setPreparedQuoteExpired(false);
    setPaymentRecordWriteFailed(false);
    void Promise.all([cargarBorradorVentaPos(shiftUuid), cargarCobroPendientePos(shiftUuid)])
      .then(([draft, pendingPayment]) => {
        if (!active) return;
        if (draft) {
          setLines(draft.lines);
          setConsumptionType(draft.consumption_type);
          setPaymentMethod(draft.payment_method);
          setAmountReceived(draft.amount_received);
          setDraftRestored(true);
        }
        if (pendingPayment) {
          setQuote({
            ...pendingPayment.quote,
            uuid: pendingPayment.uuid,
            shift_order_number: pendingPayment.shift_order_number,
            created_at: pendingPayment.created_at,
            consumption_type: pendingPayment.consumption_type,
            price_confirmation_accepted: pendingPayment.price_confirmation_accepted,
          offline_created: pendingPayment.offline_created,
          });
          setPaymentMethod(pendingPayment.payment_method);
          setAmountReceived(pendingPayment.amount_received);
          setPendingPaymentStatus('saved');
          if (pendingPayment.status === 'PAGO_RECIBIDO') {
            setPaymentReceivedPending(true);
            setMessage(`Pago recibido en el equipo para la venta #${pendingPayment.shift_order_number}. No vuelvas a cobrar; reintenta el registro.`);
          } else {
            setPreparedQuoteExpired(Date.now() >= new Date(pendingPayment.quote.valid_until).getTime());
            setMessage(`Se restauró la cotización #${pendingPayment.shift_order_number}. Revisa el estado del pago antes de continuar.`);
          }
        }
        setDraftLoaded(true);
      })
      .catch(() => {
        if (active) {
          setDraftLoadError(true);
          setDraftSaveStatus('error');
        }
      });
    return () => { active = false; };
  }, [shiftUuid, draftLoadAttempt]);

  useEffect(() => {
    if (!draftLoaded) return;
    let active = true;
    const writeVersion = ++draftWriteVersion.current;
    setDraftSaveStatus('saving');
    void guardarBorradorVentaPos(currentDraft())
      .then(() => { if (active && writeVersion === draftWriteVersion.current) setDraftSaveStatus('saved'); })
      .catch(() => { if (active && writeVersion === draftWriteVersion.current) setDraftSaveStatus('error'); });
    return () => { active = false; };
  }, [draftLoaded, shiftUuid, lines, consumptionType, paymentMethod, amountReceived]);

  const persistCurrentDraft = async (): Promise<boolean> => {
    const writeVersion = ++draftWriteVersion.current;
    setDraftSaveStatus('saving');
    try {
      await guardarBorradorVentaPos(currentDraft());
      if (writeVersion === draftWriteVersion.current) setDraftSaveStatus('saved');
      return true;
    } catch {
      if (writeVersion === draftWriteVersion.current) setDraftSaveStatus('error');
      return false;
    }
  };

  const persistPendingPayment = async (
    targetQuote: Quote,
    method: PaymentMethod,
    receivedAmount: string,
    status: PosPendingPaymentDraft['status'],
    paymentReceivedAt: string | null = null,
  ): Promise<boolean> => {
    const writeVersion = ++paymentWriteVersion.current;
    setPendingPaymentStatus('saving');
    const { uuid, shift_order_number, created_at, consumption_type, price_confirmation_accepted, ...quoteSnapshot } = targetQuote;
    try {
      await guardarCobroPendientePos({
        status,
        offline_created: targetQuote.offline_created,
        shift_uuid: shiftUuid,
        uuid,
        shift_order_number,
        created_at,
        consumption_type,
        quote: quoteSnapshot,
        price_confirmation_accepted,
        payment_method: method,
        amount_received: receivedAmount,
        payment_received_at: paymentReceivedAt,
      });
      if (writeVersion === paymentWriteVersion.current) setPendingPaymentStatus('saved');
      return true;
    } catch {
      if (writeVersion === paymentWriteVersion.current) setPendingPaymentStatus('error');
      return false;
    }
  };

  const queueOfflineSale = async (targetQuote: Quote): Promise<boolean> => {
    try {
      await guardarVentaOfflineEnColaPos({
        uuid: targetQuote.uuid,
        shift_order_number: targetQuote.shift_order_number,
        shift_uuid: shiftUuid,
        created_at: targetQuote.created_at,
        offline_created: true,
        consumption_type: targetQuote.consumption_type,
        payment_method: paymentMethod,
        ...(paymentMethod === 'EFECTIVO' ? { amount_received: Number(amountReceived) } : {}),
        items: targetQuote.items.map((item, index) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes ?? lines[index]?.notes ?? '',
          modifiers: item.modifiers,
        })),
      });
      setPendingPaymentStatus('idle');
      setPaymentReceivedPending(false);
      setPaymentRecordWriteFailed(false);
      setOfflineOrders(await listarVentasOfflineEnColaPos(shiftUuid));
      setMessage(`Venta #${targetQuote.shift_order_number} guardada en este equipo y pendiente de sincronización.`);
      setLines([]); setQuote(null); setAmountReceived('');
      await onSale(targetQuote.shift_order_number + 1);
      if (!offlineMode && navigator.onLine) void syncOfflineOrders();
      return true;
    } catch (error) {
      setPaymentReceivedPending(true);
      setError(error instanceof Error ? error.message : 'No se pudo guardar la venta en la cola offline. No vuelvas a cobrar.');
      return false;
    }
  };

  const loadCatalog = async (background = false) => {
    if (catalogSyncInProgress.current) return;
    catalogSyncInProgress.current = true;
    if (!background) { setLoadingCatalog(true); setError(''); setCatalogNotice(''); }
    let savedCatalog: StoredCatalog | null = null;
    try {
      savedCatalog = await cargarCatalogoPos();
      if (savedCatalog) setCatalog(savedCatalog.catalog);
    } catch {
      setCatalogNotice('No se pudo acceder al almacenamiento local. El catálogo no quedará disponible sin conexión.');
    }

    try {
      if (offlineMode) {
        if (savedCatalog) {
          const savedDate = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(savedCatalog.saved_at));
          setCatalogNotice(`Sin conexión. Usando catálogo guardado el ${savedDate}; revisa los precios en la próxima sincronización.`);
        } else setError('No hay un catálogo guardado disponible sin conexión.');
        return;
      }

      try {
        const cursor = savedCatalog?.catalog.generated_at;
        const canRequestDelta = !!cursor && !Number.isNaN(Date.parse(cursor));
        const endpoint = canRequestDelta
          ? `/api/pos/catalog/?updated_after=${encodeURIComponent(cursor!)}`
          : '/api/pos/catalog/';
        const response = await solicitarApi<CatalogDelta>(endpoint);
        const freshCatalog = canRequestDelta && savedCatalog
          ? applyCatalogDelta(savedCatalog.catalog, response)
          : response;
        setCatalog(freshCatalog);
        try {
          await guardarCatalogoPos(freshCatalog);
          const syncedAt = new Intl.DateTimeFormat('es-CL', { timeStyle: 'short' }).format(new Date(freshCatalog.generated_at));
          const changeCount = response.categories.length + response.products.length + response.modifiers.length
            + (response.removed?.categories.length ?? 0) + (response.removed?.products.length ?? 0) + (response.removed?.modifiers.length ?? 0);
          setCatalogNotice(changeCount
            ? `Catálogo actualizado (${changeCount} cambios) a las ${syncedAt}.`
            : `Catálogo sincronizado a las ${syncedAt}.`);
        } catch {
          setCatalogNotice('Catálogo cargado desde el servidor, pero no se pudo guardar en este equipo. No estará disponible sin conexión.');
        }
      } catch (e) {
        if (savedCatalog) {
          const savedDate = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(savedCatalog.saved_at));
          setCatalogNotice(`No se pudo actualizar el catálogo. Usando la copia guardada el ${savedDate}.`);
        } else {
          setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo y no hay una copia local disponible.');
        }
      }
    } finally {
      catalogSyncInProgress.current = false;
      if (!background) setLoadingCatalog(false);
    }
  };
  const loadOrders = async () => {
    try { const result = await solicitarApi<OrderHistory>('/api/orders/'); setOrders(result.orders); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo consultar el historial del turno.'); }
  };
  const loadOfflineOrders = async () => {
    const queue = await listarVentasOfflineEnColaPos(shiftUuid);
    setOfflineOrders(queue);
    return queue;
  };
  const loadOfflineCancellations = async () => {
    const queue = await listarAnulacionesOfflinePos(shiftUuid);
    setOfflineCancellations(queue);
    return queue;
  };
  const syncOfflineOrders = async () => {
    if (offlineMode || !navigator.onLine || syncInProgress.current) return;
    syncInProgress.current = true;
    setSyncingOfflineOrders(true);
    try {
      const queue = await loadOfflineOrders();
      const cancellationQueue = await loadOfflineCancellations();
      let syncFailed = false;
      for (const order of queue) {
        try {
          const { saved_at: _savedAt, sync_error: _syncError, ...payload } = order;
          await solicitarApi('/api/orders/sync/', { method: 'POST', body: payload });
          await eliminarVentaOfflineDeColaPos(order.uuid);
        } catch (error) {
          await marcarErrorVentaOfflineEnColaPos(order.uuid, error instanceof Error ? error.message : 'No se pudo sincronizar.');
          syncFailed = true;
          break;
        }
      }
      if (!syncFailed) {
        for (const cancellation of cancellationQueue) {
          try {
            await solicitarApi(`/api/orders/${cancellation.order_uuid}/cancel/`, { method: 'POST', body: { reason: cancellation.reason } });
            await eliminarAnulacionOfflinePos(cancellation.order_uuid);
          } catch (error) {
            await marcarErrorAnulacionOfflinePos(cancellation.order_uuid, error instanceof Error ? error.message : 'No se pudo sincronizar la anulación.');
            syncFailed = true;
            break;
          }
        }
      }
      const remaining = await loadOfflineOrders();
      const remainingCancellations = await loadOfflineCancellations();
      if (navigator.onLine && !syncFailed) {
        await loadOrders();
        if ((queue.length > 0 || cancellationQueue.length > 0) && remaining.length === 0 && remainingCancellations.length === 0) await onSale();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo procesar la cola local.');
    } finally { syncInProgress.current = false; setSyncingOfflineOrders(false); }
  };
  useEffect(() => {
    void loadCatalog();
    void Promise.all([loadOfflineOrders(), loadOfflineCancellations()]).then(([queue, cancellations]) => { if (!offlineMode && navigator.onLine && (queue.length || cancellations.length)) void syncOfflineOrders(); }).catch(() => setError('No se pudo consultar la cola de ventas guardadas.'));
    if (!offlineMode) void loadOrders();
    const handleOnline = () => { if (!offlineMode) { void loadCatalog(true); void syncOfflineOrders(); } };
    const handleCatalogUpdated = () => { if (!offlineMode) void loadCatalog(true); };
    const catalogRefreshTimer = window.setInterval(() => {
      if (!offlineMode && navigator.onLine) void loadCatalog(true);
    }, 60_000);
    window.addEventListener('online', handleOnline);
    window.addEventListener('pos:catalog-updated', handleCatalogUpdated);
    return () => {
      window.clearInterval(catalogRefreshTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pos:catalog-updated', handleCatalogUpdated);
    };
  }, [shiftUuid, offlineMode]);

  const products = useMemo(() => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').trim();
    const query = normalize(productSearch);
    return catalog?.products.filter(product =>
      (category === 'all' || product.category_id === category)
      && (!query || normalize(product.name).includes(query))
    ) ?? [];
  }, [catalog, category, productSearch]);
  const invalidateQuote = () => {
    if (paymentReceivedPending) return;
    paymentWriteVersion.current += 1;
    setQuote(null);
    setPendingPaymentStatus('idle');
    void eliminarCobroPendientePos(shiftUuid).catch(() => setPendingPaymentStatus('error'));
  };
  const addProduct = async (product: Product) => {
    if (!await onBeforeCreateSale()) return;
    setLines(prev => [...prev, { key: crypto.randomUUID(), product_id: product.id, product_name: product.name, unit_price: product.price, quantity: 1, notes: '', modifiers: [] }]); invalidateQuote(); setMessage('');
  };
  const updateLine = (key: string, update: (line: CartLine) => CartLine) => { setLines(prev => prev.map(line => line.key === key ? update(line) : line)); invalidateQuote(); };
  const removeLine = (key: string) => { setLines(prev => prev.filter(line => line.key !== key)); invalidateQuote(); };

  const requestQuote = async () => {
    if (!lines.length || quote || paymentReceivedPending) return;
    if (!await onBeforeCreateSale()) return;
    if (!catalog || lines.some(line => !catalog.products.some(product => product.id === line.product_id) || line.modifiers.some(entry => !catalog.modifiers.some(modifier => modifier.id === entry.modifier_id)))) {
      setError('El catálogo ya no contiene un producto o modificador del borrador. Revisa y quita las opciones marcadas antes de cotizar.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      if (!await persistCurrentDraft()) {
        setError('No se pudo guardar el borrador en este equipo. No se puede continuar con el cobro.');
        return;
      }
      const uuid = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      let response: QuoteResponse;
      if (offlineMode) {
        const items = lines.map(line => {
          const product = catalog.products.find(item => item.id === line.product_id)!;
          const modifiers = line.modifiers.map(entry => {
            const modifier = catalog.modifiers.find(item => item.id === entry.modifier_id)!;
            return { modifier_id: modifier.id, modifier_name: modifier.name, price_at_sale: modifier.price, quantity_per_unit: entry.quantity_per_unit };
          });
          const extrasPerUnit = modifiers.reduce((sum, modifier) => sum + modifier.price_at_sale * modifier.quantity_per_unit, 0);
          return { product_id: product.id, product_name: product.name, quantity: line.quantity, unit_price: product.price, modifiers, line_total: line.quantity * (product.price + extrasPerUnit) };
        });
        const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
        response = { quote_token: '', valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), requires_confirmation: false, items, subtotal, total_amount: subtotal };
      } else {
        response = await solicitarApi<QuoteResponse>('/api/orders/quote/', { method: 'POST', body: {
        uuid, shift_order_number: nextOrderNumber, created_at: createdAt, consumption_type: consumptionType,
        items: lines.map(line => { const product = catalog!.products.find(p => p.id === line.product_id)!; return {
          product_id: product.id, expected_name: product.name, expected_unit_price: product.price, expected_updated_at: product.updated_at,
          quantity: line.quantity, notes: line.notes, modifiers: line.modifiers.map(entry => { const modifier = catalog!.modifiers.find(m => m.id === entry.modifier_id)!; return { modifier_id: modifier.id, expected_name: modifier.name, expected_price: modifier.price, expected_updated_at: modifier.updated_at, quantity_per_unit: entry.quantity_per_unit }; }),
        }; }),
        } });
      }
      if (response.requires_confirmation && !await confirm({ title: 'Precio actualizado', message: `El catálogo cambió. Revisa el nuevo total de ${formatPrice(response.total_amount)} y confirma antes de continuar al pago.`, confirmLabel: 'Aceptar precio', tone: 'warning' })) {
        setMessage('Cotización cancelada; no se habilitó el paso de pago.');
        return;
      }
      const quotedOrder: Quote = {
        ...response,
        items: response.items.map((item, index) => ({ ...item, notes: lines[index]?.notes ?? '' })),
        uuid,
        shift_order_number: nextOrderNumber,
        created_at: createdAt,
        consumption_type: consumptionType,
        price_confirmation_accepted: true,
        offline_created: offlineMode,
      };
      if (!await persistPendingPayment(quotedOrder, paymentMethod, amountReceived, 'PREPARADO')) {
        setError('No se pudo guardar localmente la cotización, el UUID y el folio. El paso de pago no se habilitó.');
        return;
      }
      setQuote(quotedOrder);
    } catch (e) {
      console.error('Error al cotizar carrito:', e);
      setError(e instanceof Error ? e.message : 'No se pudo cotizar el carrito.');
    }
    finally { setBusy(false); }
  };

  const registerSavedPayment = async () => {
    if (!quote) return;
    if (offlineMode || quote.offline_created) {
      await queueOfflineSale(quote);
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      const sale = await solicitarApi<Sale>('/api/orders/', { method: 'POST', body: {
        uuid: quote.uuid,
        shift_order_number: quote.shift_order_number,
        quote_token: quote.quote_token,
        payment_method: paymentMethod,
        ...(paymentMethod === 'EFECTIVO' ? { amount_received: Number(amountReceived) } : {}),
        confirm_repriced: quote.requires_confirmation && quote.price_confirmation_accepted,
      } });
      await eliminarCobroPendientePos(shiftUuid);
      setPendingPaymentStatus('idle');
      setPaymentReceivedPending(false);
      setPaymentRecordWriteFailed(false);
      setMessage(`Venta #${sale.shift_order_number} guardada. Total ${formatPrice(sale.total_amount)}${sale.change_given !== null ? ` · Vuelto ${formatPrice(sale.change_given)}` : ''}.`);
      setLines([]); setQuote(null); setAmountReceived('');
      await loadOrders();
      try { await onSale(); }
      catch { setError('La venta quedó guardada. No se pudo actualizar el folio; recarga esta pantalla antes de iniciar otra venta.'); }
    } catch (e) {
      setPaymentReceivedPending(true);
      setError('El pago ya está respaldado en este equipo, pero el servidor aún no confirmó la venta. No cobres nuevamente; reintenta el registro cuando haya conexión.');
    } finally { setBusy(false); }
  };

  const saveReceivedPaymentAndRegister = async () => {
    if (!quote) return;
    const received = Number(amountReceived);
    if (paymentMethod === 'EFECTIVO' && (!Number.isSafeInteger(received) || received < quote.total_amount)) {
      setError('Ingresa el efectivo recibido antes de registrar el pago pendiente.');
      return;
    }
    const receivedAt = new Date().toISOString();
    if (!await persistPendingPayment(quote, paymentMethod, amountReceived, 'PAGO_RECIBIDO', receivedAt)) {
      setPaymentRecordWriteFailed(true);
      setError('No se pudo guardar el pago recibido. Mantén este turno abierto y no cobres nuevamente.');
      return;
    }
    setPaymentRecordWriteFailed(false);
    setPreparedQuoteExpired(false);
    setPaymentReceivedPending(true);
    setMessage('Pago respaldado localmente. La cotización venció; la venta queda pendiente de conciliación.');
    await registerSavedPayment();
  };

  const discardExpiredQuote = async () => {
    if (!quote || !await confirm({ title: 'Descartar cotización', message: 'Confirma que el cliente no pagó. Se descartará esta cotización vencida y podrás preparar una nueva.', confirmLabel: 'Descartar cotización', tone: 'warning' })) return;
    try {
      await eliminarCobroPendientePos(shiftUuid);
      setQuote(null);
      setPreparedQuoteExpired(false);
      setPendingPaymentStatus('idle');
      setMessage('Cotización vencida descartada; puedes volver a cotizar.');
    } catch {
      setPendingPaymentStatus('error');
      setError('No se pudo limpiar la cotización vencida. Se mantiene bloqueada para proteger el folio.');
    }
  };

  const saveSale = async () => {
    if (!quote) return;
    if (paymentReceivedPending) {
      await registerSavedPayment();
      return;
    }
    const received = Number(amountReceived);
    if (paymentMethod === 'EFECTIVO' && (!Number.isSafeInteger(received) || received < quote.total_amount)) { setError('El efectivo recibido debe ser un monto entero que cubra el total.'); return; }
    if (!quote.offline_created && Date.now() >= new Date(quote.valid_until).getTime()) {
      setPreparedQuoteExpired(true);
      setError('La cotización venció. Confirma si el pago ya se recibió antes de descartarla o registrarla para conciliación.');
      return;
    }
    if (!await persistCurrentDraft()) {
      setError('No se pudo guardar el borrador en este equipo. No se puede continuar con el cobro.');
      return;
    }
    const receivedAt = new Date().toISOString();
    if (!await persistPendingPayment(quote, paymentMethod, amountReceived, 'PAGO_RECIBIDO', receivedAt)) {
      setPaymentRecordWriteFailed(true);
      setError('No se pudo respaldar localmente la recepción del pago. Mantén esta venta abierta y no vuelvas a cobrarla.');
      return;
    }
    setPaymentRecordWriteFailed(false);
    setPaymentReceivedPending(true);
    await registerSavedPayment();
  };

  const updatePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (quote && !paymentReceivedPending) void persistPendingPayment(quote, method, amountReceived, 'PREPARADO');
  };

  const updateAmountReceived = (value: string) => {
    setAmountReceived(value);
    if (quote && !paymentReceivedPending) void persistPendingPayment(quote, paymentMethod, value, 'PREPARADO');
  };

  const cancelOrder = async (order: OrderHistoryItem) => {
    const reason = await prompt({ title: `Anular venta #${order.shift_order_number}`, message: 'Indica el motivo para conservarlo junto al registro de la venta.', inputLabel: 'Motivo de anulación', placeholder: 'Ej.: pedido duplicado', confirmLabel: 'Continuar', tone: 'danger' });
    if (reason === null) return;
    if (!await confirm({ title: 'Confirmar anulación', message: `Se anulará la venta #${order.shift_order_number} por ${formatPrice(order.total_amount)}. El motivo quedará guardado en el historial.`, confirmLabel: 'Anular venta', tone: 'danger' })) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await solicitarApi(`/api/orders/${order.uuid}/cancel/`, { method: 'POST', body: { reason: reason.trim() } });
      setMessage(`Venta #${order.shift_order_number} anulada. El registro se conserva con su motivo.`);
      await loadOrders();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo anular la venta.'); }
    finally { setBusy(false); }
  };

  const cancelOfflineOrder = async (order: PosOfflineOrder) => {
    const reason = await prompt({ title: `Anular venta #${order.shift_order_number}`, message: 'Indica el motivo para guardar la anulación en este equipo y sincronizarla al recuperar conexión.', inputLabel: 'Motivo de anulación', placeholder: 'Ej.: pedido duplicado', confirmLabel: 'Continuar', tone: 'danger' });
    if (reason === null) return;
    if (!await confirm({ title: 'Confirmar anulación offline', message: `La anulación de la venta #${order.shift_order_number} quedará guardada en este equipo y se enviará al reconectar.`, confirmLabel: 'Guardar anulación', tone: 'danger' })) return;
    const total = order.items.reduce((sum, item) => sum + item.quantity * (item.unit_price + item.modifiers.reduce((extra, modifier) => extra + modifier.price_at_sale * modifier.quantity_per_unit, 0)), 0);
    try {
      await guardarAnulacionOfflinePos({ order_uuid: order.uuid, shift_uuid: order.shift_uuid, shift_order_number: order.shift_order_number, reason: reason.trim(), requested_at: new Date().toISOString() });
      setOfflineOrders(await listarVentasOfflineEnColaPos(shiftUuid));
      setOfflineCancellations(await listarAnulacionesOfflinePos(shiftUuid));
      setMessage(`Anulación de la venta #${order.shift_order_number} guardada en este equipo. Se enviará después de sincronizar la venta.`);
      if (offlineMode) await onSale(undefined, { payment_method: order.payment_method, total_amount: total });
      if (!offlineMode && navigator.onLine) void syncOfflineOrders();
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar la anulación offline.'); }
  };

  const modifiersFor = (line: CartLine) => line.modifiers.reduce((sum, value) => sum + (catalog?.modifiers.find(m => m.id === value.modifier_id)?.price ?? value.price_at_sale) * value.quantity_per_unit, 0);

  return <section className="pos-sales-container space-y-5 rounded-2xl border border-white/10 bg-[#171717] p-5 shadow-xl sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#FACC15]">{offlineMode ? 'Venta offline' : 'Venta en línea'}</p><h2 className="mt-1 font-heading text-2xl font-bold text-white">Folio #{String(nextOrderNumber).padStart(3, '0')}</h2></div><button className={button} type="button" onClick={() => void loadCatalog()} disabled={loadingCatalog || offlineMode}><RefreshCw className="mr-2 inline h-4 w-4"/>{offlineMode ? 'Catálogo guardado' : 'Actualizar menú'}</button></header>
    {offlineMode && <div role="status" className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">Modo offline: puedes registrar la venta en este equipo. No cierres el turno hasta sincronizar todas las ventas pendientes.</div>}
    {(offlineOrders.length > 0 || offlineCancellations.length > 0) && <div role="status" className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{offlineOrders.length} ventas y {offlineCancellations.length} anulaciones pendientes</strong><span>{syncingOfflineOrders ? 'Sincronizando…' : offlineMode ? 'Se enviarán al reconectar' : 'Reintento automático al recuperar conexión'}</span>{!offlineMode && <button type="button" className="rounded-lg border border-amber-200/30 px-3 py-1.5 text-xs font-semibold text-amber-100 disabled:opacity-50" disabled={syncingOfflineOrders || !navigator.onLine} onClick={() => void syncOfflineOrders()}>Reintentar sincronización</button>}</div>{offlineOrders.map(order => <div key={order.uuid} className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-amber-100/10 pt-3"><span>Venta #{String(order.shift_order_number).padStart(3, '0')} {offlineCancellations.some(item => item.order_uuid === order.uuid) ? '· Anulación pendiente' : '· Pendiente de sincronización'}</span>{!offlineCancellations.some(item => item.order_uuid === order.uuid) && <button type="button" disabled={busy || syncingOfflineOrders} className="rounded-lg border border-red-200/30 px-3 py-1.5 text-xs font-semibold text-red-100 disabled:opacity-50" onClick={() => void cancelOfflineOrder(order)}>Anular</button>}</div>)}{[...offlineOrders.map(order => order.sync_error), ...offlineCancellations.map(item => item.sync_error)].filter(Boolean).length > 0 && <p className="mt-2 text-xs text-amber-200">{offlineOrders.find(order => order.sync_error)?.sync_error ?? offlineCancellations.find(item => item.sync_error)?.sync_error} · Los eventos siguientes esperan que se resuelva este folio.</p>}</div>}
    <aside aria-label="Estado de datos locales" className="space-y-3 rounded-xl border border-white/10 bg-[#101010] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">Respaldo de caja</h3><p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-400">El catálogo, el borrador y la cotización quedan guardados en este equipo. Los cobros se registran con conexión; si el servidor no confirma una venta cobrada, podrás reintentarlo.</p></div><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">Almacenamiento local</span></div>
        <div className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2">
        <p role={draftLoadError || draftSaveStatus === 'error' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-xs ${draftLoadError || draftSaveStatus === 'error' ? 'bg-red-950/30 text-red-200' : 'bg-white/[0.035] text-gray-300'}`}>
          <span className="font-medium text-white">Borrador</span><span className="mx-2 text-gray-600">·</span>{draftLoadError ? 'No se pudo leer; el cobro está bloqueado.' : draftSaveStatus === 'loading' ? 'Recuperando…' : draftSaveStatus === 'saving' ? 'Guardando…' : draftSaveStatus === 'saved' ? draftRestored ? 'Restaurado y guardado en este equipo.' : 'Guardado en este equipo.' : 'No se pudo guardar; el cobro está bloqueado.'}
          {draftLoadError && <button type="button" className="ml-2 font-semibold underline" onClick={() => setDraftLoadAttempt(attempt => attempt + 1)}>Reintentar</button>}
        </p>
        {catalogNotice && <p role="status" className={`rounded-lg px-3 py-2 text-xs ${catalogNotice.startsWith('No se pudo') || catalogNotice.startsWith('Sin conexión') ? 'bg-amber-950/30 text-amber-200' : 'bg-white/[0.035] text-gray-300'}`}><span className="font-medium text-white">Catálogo</span><span className="mx-2 text-gray-600">·</span>{catalogNotice}</p>}
        </div>
    </aside>
    {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}{message && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200"><Check className="mr-2 inline h-4 w-4"/>{message}</div>}
    {paymentReceivedPending && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100"><span>El pago ya se guardó en este equipo. No lo cobres de nuevo; solo falta confirmar el registro en el servidor.</span><button type="button" className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-black disabled:opacity-50" disabled={busy || pendingPaymentStatus !== 'saved'} onClick={() => void registerSavedPayment()}>{busy ? 'Registrando…' : 'Reintentar registro'}</button></div>}
    {paymentRecordWriteFailed && quote && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-100"><span>La recepción del pago no quedó respaldada. No cobres otra vez; mantén esta venta abierta e intenta guardar el registro.</span><button type="button" disabled={busy || pendingPaymentStatus === 'saving'} className="rounded-lg bg-red-200 px-4 py-2 font-bold text-black disabled:opacity-50" onClick={() => void saveReceivedPaymentAndRegister()}>Reintentar respaldo local</button></div>}
    {preparedQuoteExpired && <div role="alert" className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100"><p>La cotización venció. Verifica si el cliente alcanzó a pagar antes de continuar.</p><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || pendingPaymentStatus !== 'saved'} className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-black disabled:opacity-50" onClick={() => void saveReceivedPaymentAndRegister()}>El pago se recibió</button><button type="button" disabled={busy} className="rounded-lg border border-white/20 px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={() => void discardExpiredQuote()}>El cliente no pagó; descartar</button></div></div>}
    {pendingPaymentStatus === 'saving' && quote && !paymentReceivedPending && <p role="status" className="rounded-lg border border-white/10 bg-[#0D0D0D] p-3 text-xs text-gray-300">Guardando localmente los datos del pago; espera antes de recibirlo.</p>}
    {pendingPaymentStatus === 'error' && quote && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">No se pudo respaldar el cobro local. No recibas el pago y reintenta la cotización.</p>}
    <fieldset disabled={busy || syncingOfflineOrders || !draftLoaded || paymentReceivedPending || preparedQuoteExpired || paymentRecordWriteFailed || shiftSyncBlocked || (!offlineMode && offlineOrders.length > 0)} className="pos-sales-fields grid min-w-0 gap-5 border-0 p-0 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="min-w-0 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300"><Filter className="h-4 w-4 text-[#FACC15]" />Filtrar productos</h3><span className="text-xs text-gray-500">{products.length} {products.length === 1 ? 'producto' : 'productos'}</span></div>
        <label className="sr-only" htmlFor="pos-product-search">Buscar producto por nombre</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            ref={productSearchRef}
            id="pos-product-search"
            type="search"
            autoComplete="off"
            value={productSearch}
            onChange={event => setProductSearch(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setProductSearch('');
              } else if (event.key === 'Enter' && products.length > 0) {
                event.preventDefault();
                void addProduct(products[0]);
              }
            }}
            placeholder="Buscar producto por nombre…"
            aria-label="Buscar producto por nombre"
            className="pos-product-search-field w-full rounded-xl py-3 pl-10 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/15"
          />
          {productSearch && <button type="button" onClick={() => { setProductSearch(''); productSearchRef.current?.focus(); }} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FACC15]"><X aria-hidden="true" className="h-4 w-4" /></button>}
        </div>
        <nav aria-label="Filtrar productos por categoría" className="pos-category-filters flex flex-wrap gap-2">
        <button aria-pressed={category === 'all'} className={`pos-filter-chip ${category === 'all' ? 'is-active' : ''}`} type="button" onClick={() => setCategory('all')}>Todos</button>{catalog?.categories.map(c => <button aria-pressed={category === c.id} className={`pos-filter-chip ${category === c.id ? 'is-active' : ''}`} type="button" key={c.id} onClick={() => setCategory(c.id)}>{c.slug === 'ases' ? 'AS' : c.name}</button>)}
      </nav>
        {loadingCatalog ? <p className="text-sm text-gray-400">Cargando productos…</p> : products.length ? <div className="pos-product-grid grid grid-cols-2 gap-2">{products.map(p => <button type="button" key={p.id} disabled={!draftLoaded} onClick={() => void addProduct(p)} className="pos-product-card min-h-20 rounded-xl p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FACC15] disabled:opacity-50"><span className="block text-sm font-semibold">{p.name}</span><span className="mt-1 block text-sm">{formatPrice(p.price)}</span></button>)}</div> : <div className="pos-product-empty rounded-xl border border-dashed px-4 py-8 text-center"><p className="pos-product-empty-title text-sm font-medium">No encontramos productos</p><p className="pos-product-empty-copy mt-1 text-xs">Prueba otro nombre o cambia la categoría.</p>{(productSearch || category !== 'all') && <button type="button" className="mt-3 text-sm font-semibold text-[#FACC15] underline underline-offset-4" onClick={() => { setProductSearch(''); setCategory('all'); productSearchRef.current?.focus(); }}>Limpiar filtros</button>}</div>}
      </div>
      <div className="pos-cart-column min-w-0 space-y-4">
        {!lines.length ? <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-gray-500"><ShoppingCart className="mx-auto mb-2 h-6 w-6"/>Agrega productos a la venta.</div> : <div className="space-y-3">{lines.map(line => {const currentProduct = catalog?.products.find(p => p.id === line.product_id); const product = currentProduct ?? {name: line.product_name, price: line.unit_price}; return <article key={line.key} className="rounded-xl border border-white/10 bg-[#0D0D0D] p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-white">{product.name}</p><p className="text-xs text-gray-400">{formatPrice(product.price + modifiersFor(line))} c/u</p>{catalog && !currentProduct && <p className="mt-1 text-xs text-amber-300">Ya no está en el catálogo. Quita esta línea para continuar.</p>}</div><button className="pos-remove-line" aria-label="Quitar producto" title="Quitar producto" type="button" onClick={() => removeLine(line.key)}><Trash2 aria-hidden="true" className="h-4 w-4"/></button></div>
          <div className="mt-2 flex items-center gap-2"><button className={button} type="button" aria-label="Disminuir cantidad" onClick={() => updateLine(line.key, l => ({...l, quantity: Math.max(1, l.quantity - 1)}))}><Minus className="h-4 w-4"/></button><span className="min-w-6 text-center">{line.quantity}</span><button className={button} type="button" aria-label="Aumentar cantidad" onClick={() => updateLine(line.key, l => ({...l, quantity: l.quantity + 1}))}><Plus className="h-4 w-4"/></button></div>
          {catalog && !!(catalog.modifiers.length || line.modifiers.length) && <details className="pos-modifier-disclosure mt-3">
            <summary aria-label={`Mostrar u ocultar agregados de ${product.name}`}>
              <span><strong>Agregados y exclusiones</strong><small>{line.modifiers.length ? `${line.modifiers.length} seleccionado${line.modifiers.length === 1 ? '' : 's'}` : 'Sin modificaciones'}</small></span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
            </summary>
            <div className="pos-modifier-options">{catalog.modifiers.map(m => {const selected = line.modifiers.find(x => x.modifier_id === m.id); return <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs" key={m.id}><label className="flex min-h-8 flex-1 cursor-pointer items-center gap-2 text-gray-300"><input type="checkbox" checked={!!selected} onChange={e => updateLine(line.key, l => ({...l, modifiers: e.target.checked ? [...l.modifiers, {modifier_id: m.id, modifier_name: m.name, price_at_sale: m.price, quantity_per_unit: 1}] : l.modifiers.filter(x => x.modifier_id !== m.id)}))}/>{m.name} {m.price ? `(+${formatPrice(m.price)})` : '(sin costo)'}</label>{selected && m.modifier_type === 'EXTRA_PAGO' && <input aria-label={`Cantidad de ${m.name}`} className="w-14 rounded border border-white/10 bg-[#171717] px-2 py-1 text-white" type="number" min="1" max="20" value={selected.quantity_per_unit} onChange={e => updateLine(line.key, l => ({...l, modifiers: l.modifiers.map(x => x.modifier_id === m.id ? {...x, quantity_per_unit: Math.max(1, Number(e.target.value))} : x)}))}/>}</div>;})}
            {line.modifiers.filter(entry => !catalog.modifiers.some(modifier => modifier.id === entry.modifier_id)).map(entry => <div key={entry.modifier_id} className="flex items-center justify-between rounded border border-amber-500/20 bg-amber-950/20 px-2 py-1 text-xs text-amber-200"><span>{entry.modifier_name} ya no está disponible.</span><button type="button" className="underline" onClick={() => updateLine(line.key, current => ({...current, modifiers: current.modifiers.filter(modifier => modifier.modifier_id !== entry.modifier_id)}))}>Quitar</button></div>)}
            </div>
          </details>}
          <input className="mt-3 w-full rounded-lg border border-white/10 bg-[#171717] px-3 py-2 text-xs text-white" maxLength={150} placeholder="Nota para cocina (opcional)" value={line.notes} onChange={e => updateLine(line.key, l => ({...l, notes: e.target.value}))}/>
        </article>;})}</div>}
        <fieldset className="space-y-2 border-0 p-0"><legend className="text-xs font-bold uppercase tracking-wider text-gray-300">Tipo de pedido</legend><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={consumptionType === 'PARA_SERVIR'} className={`pos-type-choice ${consumptionType === 'PARA_SERVIR' ? 'is-selected' : ''}`} onClick={() => {setConsumptionType('PARA_SERVIR'); invalidateQuote();}}><Utensils className="h-5 w-5"/><span><strong>Para servir</strong><small>Consumo en el local</small></span></button><button type="button" aria-pressed={consumptionType === 'PARA_LLEVAR'} className={`pos-type-choice ${consumptionType === 'PARA_LLEVAR' ? 'is-selected' : ''}`} onClick={() => {setConsumptionType('PARA_LLEVAR'); invalidateQuote();}}><ShoppingBag className="h-5 w-5"/><span><strong>Para llevar</strong><small>Pedido para llevar</small></span></button></div></fieldset>
        <button type="button" disabled={!lines.length || busy || loadingCatalog || !draftLoaded || draftSaveStatus !== 'saved' || !!quote || paymentReceivedPending} onClick={() => void requestQuote()} className="w-full rounded-xl bg-[#FACC15] px-4 py-3 font-bold text-black disabled:opacity-40">{busy && !quote ? 'Calculando…' : quote ? 'Cotización activa' : 'Cotizar venta'}</button>
        {quote && <div className="space-y-3 rounded-xl border border-white/10 p-4"><div className="flex justify-between font-bold"><span>{quote.offline_created ? 'Total calculado con catálogo local' : 'Total validado'}</span><span>{formatPrice(quote.total_amount)}</span></div><p className="text-xs text-gray-400">Folio #{String(quote.shift_order_number).padStart(3, '0')} · {quote.offline_created ? 'Venta y folio guardados localmente antes del cobro.' : `Válida hasta ${new Intl.DateTimeFormat('es-CL', {timeStyle:'short'}).format(new Date(quote.valid_until))}. Cotización respaldada en este equipo.`}</p>{quote.requires_confirmation && <p className="text-sm text-amber-200">El catálogo cambió; confirma el precio actualizado antes de cobrar.</p>}
          <label className="block text-sm text-gray-300">Medio de pago<select className="mt-1 w-full rounded-lg border border-white/10 bg-[#0D0D0D] p-3 text-white" value={paymentMethod} onChange={e => updatePaymentMethod(e.target.value as PaymentMethod)}><option value="EFECTIVO">Efectivo</option><option value="TRANSBANK">Transbank (débito/crédito)</option><option value="TRANSFERENCIA">Transferencia</option></select></label>
          {paymentMethod === 'EFECTIVO' && <label className="block text-sm text-gray-300">Efectivo recibido<input className="mt-1 w-full rounded-lg border border-white/10 bg-[#0D0D0D] p-3 text-white" type="number" min={quote.total_amount} step="1" inputMode="numeric" value={amountReceived} onChange={e => updateAmountReceived(e.target.value)}/></label>}
          {!paymentReceivedPending && !preparedQuoteExpired && <button type="button" disabled={busy || pendingPaymentStatus !== 'saved'} onClick={() => void saveSale()} className="w-full rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Guardando venta…' : 'Confirmar recepción del pago'}</button>}
        </div>}
      </div>
    </fieldset>
    {!offlineMode && <details className="pos-info-disclosure border-t border-white/10 pt-3">
      <summary>Ventas recientes <span className="pos-disclosure-meta">{orders.length} registros</span></summary>
      {!orders.length ? <p className="text-xs text-gray-500">Todavía no hay ventas registradas.</p> : <div className="space-y-2">{orders.map(order => <div key={order.uuid} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#0D0D0D] p-3"><div><p className="text-sm font-medium text-white">#{String(order.shift_order_number).padStart(3, '0')} · {formatPrice(order.total_amount)} · {order.payment_method.replace('_', ' ')}</p><p className="text-xs text-gray-500">{new Intl.DateTimeFormat('es-CL', {dateStyle:'short', timeStyle:'short'}).format(new Date(order.created_at))}</p>{order.status === 'ANULADA' && <p className="mt-1 text-xs text-red-200">Motivo de anulación: {order.cancellation_reason || 'Sin motivo informado'}</p>}</div><div className="flex items-center gap-2"><span className={`text-xs ${order.status === 'ANULADA' ? 'text-red-300' : 'text-emerald-300'}`}>{order.status === 'ANULADA' ? 'ANULADA' : 'COMPLETADA'}</span>{order.status === 'COMPLETADA' && order.shift_uuid === shiftUuid && <button type="button" disabled={busy} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200 hover:bg-red-950/40 disabled:opacity-40" onClick={() => void cancelOrder(order)}>Anular</button>}</div></div>)}</div>}
    </details>}
  </section>;
};
