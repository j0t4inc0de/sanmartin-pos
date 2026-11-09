import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Minus, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { solicitarApi } from '../services/apiClient';
import {
  cargarBorradorVentaPos,
  cargarCatalogoPos,
  guardarBorradorVentaPos,
  guardarCatalogoPos,
  type PosCatalog as Catalog,
  type PosSaleDraft,
} from '../services/posLocalStore';

type ConsumptionType = 'PARA_SERVIR' | 'PARA_LLEVAR';
type PaymentMethod = 'EFECTIVO' | 'TRANSBANK' | 'TRANSFERENCIA';
type Product = Catalog['products'][number];
interface CartModifier { modifier_id: number; modifier_name: string; price_at_sale: number; quantity_per_unit: number; }
interface CartLine { key: string; product_id: number; product_name: string; unit_price: number; quantity: number; notes: string; modifiers: CartModifier[]; }
interface Quote { uuid: string; quote_token: string; valid_until: string; requires_confirmation: boolean; items: { product_id: number; product_name: string; quantity: number; unit_price: number; modifiers: { modifier_id: number; modifier_name: string; price_at_sale: number; quantity_per_unit: number; }[]; line_total: number; }[]; subtotal: number; total_amount: number; }
interface Sale { uuid: string; shift_order_number: number; total_amount: number; payment_method: PaymentMethod; amount_paid: number | null; change_given: number | null; }
interface OrderHistoryItem { uuid: string; shift_uuid: string; shift_order_number: number; created_at: string; payment_method: PaymentMethod; total_amount: number; status: 'COMPLETADA' | 'ANULADA'; cancellation_reason: string; }
interface OrderHistory { orders: OrderHistoryItem[]; open_shift_uuid: string | null; }

const formatPrice = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
const button = 'rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-40';

export const PosSalesPanel = ({ shiftUuid, nextOrderNumber, onSale }: { shiftUuid: string; nextOrderNumber: number; onSale: () => Promise<void> }) => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [consumptionType, setConsumptionType] = useState<ConsumptionType>('PARA_LLEVAR');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState('');
  const [category, setCategory] = useState<number | 'all'>('all');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  const [draftSaveStatus, setDraftSaveStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [catalogNotice, setCatalogNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const draftWriteVersion = useRef(0);

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
    void cargarBorradorVentaPos(shiftUuid)
      .then((draft) => {
        if (!active) return;
        if (draft) {
          setLines(draft.lines);
          setConsumptionType(draft.consumption_type);
          setPaymentMethod(draft.payment_method);
          setAmountReceived(draft.amount_received);
          setMessage('Borrador de venta restaurado desde este equipo.');
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

  const loadCatalog = async () => {
    setLoadingCatalog(true); setError(''); setCatalogNotice('');
    let savedCatalog: Awaited<ReturnType<typeof cargarCatalogoPos>> = null;
    try {
      savedCatalog = await cargarCatalogoPos();
      if (savedCatalog) setCatalog(savedCatalog.catalog);
    } catch {
      setCatalogNotice('No se pudo acceder al almacenamiento local. El catálogo no quedará disponible sin conexión.');
    }

    try {
      const freshCatalog = await solicitarApi<Catalog>('/api/pos/catalog/');
      setCatalog(freshCatalog);
      try {
        await guardarCatalogoPos(freshCatalog);
        setCatalogNotice('Catálogo actualizado y guardado en este equipo.');
      } catch {
        setCatalogNotice('Catálogo cargado desde el servidor, pero no se pudo guardar en este equipo. No estará disponible sin conexión.');
      }
    } catch (e) {
      if (savedCatalog) {
        const savedDate = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(savedCatalog.saved_at));
        setCatalogNotice(`Sin conexión al servidor. Usando el catálogo guardado el ${savedDate}; sus precios pueden estar desactualizados.`);
      } else {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo y no hay una copia local disponible.');
      }
    } finally { setLoadingCatalog(false); }
  };
  const loadOrders = async () => {
    try { const result = await solicitarApi<OrderHistory>('/api/orders/'); setOrders(result.orders); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo consultar el historial del turno.'); }
  };
  useEffect(() => { void loadCatalog(); void loadOrders(); }, [shiftUuid]);

  const products = useMemo(() => catalog?.products.filter(p => category === 'all' || p.category_id === category) ?? [], [catalog, category]);
  const invalidateQuote = () => setQuote(null);
  const addProduct = (product: Product) => { setLines(prev => [...prev, { key: crypto.randomUUID(), product_id: product.id, product_name: product.name, unit_price: product.price, quantity: 1, notes: '', modifiers: [] }]); invalidateQuote(); setMessage(''); };
  const updateLine = (key: string, update: (line: CartLine) => CartLine) => { setLines(prev => prev.map(line => line.key === key ? update(line) : line)); invalidateQuote(); };
  const removeLine = (key: string) => { setLines(prev => prev.filter(line => line.key !== key)); invalidateQuote(); };

  const requestQuote = async () => {
    if (!lines.length) return;
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
      const response = await solicitarApi<Quote>('/api/orders/quote/', { method: 'POST', body: {
        uuid, shift_order_number: nextOrderNumber, created_at: new Date().toISOString(), consumption_type: consumptionType,
        items: lines.map(line => { const product = catalog!.products.find(p => p.id === line.product_id)!; return {
          product_id: product.id, expected_name: product.name, expected_unit_price: product.price, expected_updated_at: product.updated_at,
          quantity: line.quantity, notes: line.notes, modifiers: line.modifiers.map(entry => { const modifier = catalog!.modifiers.find(m => m.id === entry.modifier_id)!; return { modifier_id: modifier.id, expected_name: modifier.name, expected_price: modifier.price, expected_updated_at: modifier.updated_at, quantity_per_unit: entry.quantity_per_unit }; }),
        }; }),
      } });
      setQuote({ ...response, uuid });
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cotizar el carrito.'); }
    finally { setBusy(false); }
  };

  const saveSale = async () => {
    if (!quote) return;
    const received = Number(amountReceived);
    if (paymentMethod === 'EFECTIVO' && (!Number.isSafeInteger(received) || received < quote.total_amount)) { setError('El efectivo recibido debe ser un monto entero que cubra el total.'); return; }
    if (quote.requires_confirmation && !window.confirm(`El catálogo cambió. Confirma el total actualizado de ${formatPrice(quote.total_amount)} antes de cobrar.`)) return;
    if (Date.now() > new Date(quote.valid_until).getTime()) { setQuote(null); setError('La cotización venció. Vuelve a consultar el precio antes de cobrar.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      if (!await persistCurrentDraft()) {
        setError('No se pudo guardar el borrador en este equipo. No se puede continuar con el cobro.');
        return;
      }
      const sale = await solicitarApi<Sale>('/api/orders/', { method: 'POST', body: {
        uuid: quote.uuid, shift_order_number: nextOrderNumber, quote_token: quote.quote_token, payment_method: paymentMethod,
        ...(paymentMethod === 'EFECTIVO' ? { amount_received: received } : {}), confirm_repriced: quote.requires_confirmation,
      } });
      setMessage(`Venta #${sale.shift_order_number} guardada. Total ${formatPrice(sale.total_amount)}${sale.change_given !== null ? ` · Vuelto ${formatPrice(sale.change_given)}` : ''}.`);
      setLines([]); setQuote(null); setAmountReceived('');
      await loadOrders();
      try { await onSale(); }
      catch { setError('La venta quedó guardada. No se pudo actualizar el folio; recarga esta pantalla antes de iniciar otra venta.'); }
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar la venta.'); }
    finally { setBusy(false); }
  };

  const cancelOrder = async (order: OrderHistoryItem) => {
    const reason = window.prompt(`Motivo obligatorio para anular la venta #${order.shift_order_number}:`);
    if (reason === null) return;
    if (!reason.trim()) { setError('Escribe un motivo para anular la venta.'); return; }
    if (!window.confirm(`¿Confirmas anular la venta #${order.shift_order_number} por ${formatPrice(order.total_amount)}?`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await solicitarApi(`/api/orders/${order.uuid}/cancel/`, { method: 'POST', body: { reason: reason.trim() } });
      setMessage(`Venta #${order.shift_order_number} anulada. El registro se conserva con su motivo.`);
      await loadOrders();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo anular la venta.'); }
    finally { setBusy(false); }
  };

  const modifiersFor = (line: CartLine) => line.modifiers.reduce((sum, value) => sum + (catalog?.modifiers.find(m => m.id === value.modifier_id)?.price ?? value.price_at_sale) * value.quantity_per_unit, 0);

  return <section className="space-y-5 rounded-2xl border border-white/10 bg-[#171717] p-5 shadow-xl sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#FACC15]">Venta en línea</p><h2 className="mt-1 font-heading text-2xl font-bold text-white">Folio #{String(nextOrderNumber).padStart(3, '0')}</h2></div><button className={button} type="button" onClick={() => void loadCatalog()} disabled={loadingCatalog}><RefreshCw className="mr-2 inline h-4 w-4"/>Actualizar menú</button></header>
    <p className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-100">El catálogo y el borrador del carrito se conservan en este equipo. Las ventas todavía requieren conexión y no hay cola de sincronización offline.</p>
    {catalogNotice && <p role="status" className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-100">{catalogNotice}</p>}
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs ${draftSaveStatus === 'error' ? 'border-red-500/30 bg-red-950/30 text-red-200' : 'border-white/10 bg-[#0D0D0D] text-gray-300'}`} role={draftSaveStatus === 'error' ? 'alert' : 'status'}>
      <span>{draftLoadError ? 'No se pudo leer el borrador existente. Se conserva sin cambios; reintenta antes de continuar.' : draftSaveStatus === 'loading' ? 'Recuperando borrador…' : draftSaveStatus === 'saving' ? 'Guardando borrador en este equipo…' : draftSaveStatus === 'saved' ? 'Borrador guardado en este equipo.' : 'No se pudo guardar el borrador local. El cobro está bloqueado.'}</span>
      {draftLoadError && <button type="button" className="font-semibold underline" onClick={() => setDraftLoadAttempt(attempt => attempt + 1)}>Reintentar</button>}
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}{message && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200"><Check className="mr-2 inline h-4 w-4"/>{message}</div>}
    <fieldset disabled={busy || !draftLoaded} className="grid min-w-0 gap-5 border-0 p-0 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-3"><div className="flex gap-2 overflow-x-auto pb-1"><button className={button} type="button" onClick={() => setCategory('all')}>Todos</button>{catalog?.categories.map(c => <button className={button} type="button" key={c.id} onClick={() => setCategory(c.id)}>{c.name}</button>)}</div>
        {loadingCatalog ? <p className="text-sm text-gray-400">Cargando productos…</p> : <div className="grid grid-cols-2 gap-2">{products.map(p => <button type="button" key={p.id} disabled={!draftLoaded} onClick={() => addProduct(p)} className="min-h-20 rounded-xl border border-white/10 bg-[#0D0D0D] p-3 text-left hover:border-[#FACC15]/50 disabled:opacity-50"><span className="block text-sm font-semibold text-white">{p.name}</span><span className="mt-1 block text-sm text-[#FACC15]">{formatPrice(p.price)}</span></button>)}</div>}
      </div>
      <div className="space-y-4"><div className="flex gap-2"><button type="button" className={`${button} flex-1 ${consumptionType === 'PARA_SERVIR' ? 'border-[#FACC15] text-white' : ''}`} onClick={() => {setConsumptionType('PARA_SERVIR'); invalidateQuote();}}>Para servir</button><button type="button" className={`${button} flex-1 ${consumptionType === 'PARA_LLEVAR' ? 'border-[#FACC15] text-white' : ''}`} onClick={() => {setConsumptionType('PARA_LLEVAR'); invalidateQuote();}}>Para llevar</button></div>
        {!lines.length ? <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-gray-500"><ShoppingCart className="mx-auto mb-2 h-6 w-6"/>Agrega productos a la venta.</div> : <div className="space-y-3">{lines.map(line => {const currentProduct = catalog?.products.find(p => p.id === line.product_id); const product = currentProduct ?? {name: line.product_name, price: line.unit_price}; return <article key={line.key} className="rounded-xl border border-white/10 bg-[#0D0D0D] p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-white">{product.name}</p><p className="text-xs text-gray-400">{formatPrice(product.price + modifiersFor(line))} c/u</p>{catalog && !currentProduct && <p className="mt-1 text-xs text-amber-300">Ya no está en el catálogo. Quita esta línea para continuar.</p>}</div><button className="text-gray-500 hover:text-red-300" aria-label="Quitar producto" type="button" onClick={() => removeLine(line.key)}><Trash2 className="h-4 w-4"/></button></div>
          <div className="mt-2 flex items-center gap-2"><button className={button} type="button" aria-label="Disminuir cantidad" onClick={() => updateLine(line.key, l => ({...l, quantity: Math.max(1, l.quantity - 1)}))}><Minus className="h-4 w-4"/></button><span className="min-w-6 text-center">{line.quantity}</span><button className={button} type="button" aria-label="Aumentar cantidad" onClick={() => updateLine(line.key, l => ({...l, quantity: l.quantity + 1}))}><Plus className="h-4 w-4"/></button></div>
          {catalog && !!(catalog.modifiers.length || line.modifiers.length) && <div className="mt-3 space-y-1">{catalog.modifiers.map(m => {const selected = line.modifiers.find(x => x.modifier_id === m.id); return <div className="flex items-center justify-between gap-2 text-xs" key={m.id}><label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={!!selected} onChange={e => updateLine(line.key, l => ({...l, modifiers: e.target.checked ? [...l.modifiers, {modifier_id: m.id, modifier_name: m.name, price_at_sale: m.price, quantity_per_unit: 1}] : l.modifiers.filter(x => x.modifier_id !== m.id)}))}/>{m.name} {m.price ? `(+${formatPrice(m.price)})` : '(sin costo)'}</label>{selected && m.modifier_type === 'EXTRA_PAGO' && <input aria-label={`Cantidad de ${m.name}`} className="w-14 rounded border border-white/10 bg-[#171717] px-2 py-1 text-white" type="number" min="1" max="20" value={selected.quantity_per_unit} onChange={e => updateLine(line.key, l => ({...l, modifiers: l.modifiers.map(x => x.modifier_id === m.id ? {...x, quantity_per_unit: Math.max(1, Number(e.target.value))} : x)}))}/>}</div>;})}
            {line.modifiers.filter(entry => !catalog.modifiers.some(modifier => modifier.id === entry.modifier_id)).map(entry => <div key={entry.modifier_id} className="flex items-center justify-between rounded border border-amber-500/20 bg-amber-950/20 px-2 py-1 text-xs text-amber-200"><span>{entry.modifier_name} ya no está disponible.</span><button type="button" className="underline" onClick={() => updateLine(line.key, current => ({...current, modifiers: current.modifiers.filter(modifier => modifier.modifier_id !== entry.modifier_id)}))}>Quitar</button></div>)}
          </div>}
          <input className="mt-3 w-full rounded-lg border border-white/10 bg-[#171717] px-3 py-2 text-xs text-white" maxLength={150} placeholder="Nota para cocina (opcional)" value={line.notes} onChange={e => updateLine(line.key, l => ({...l, notes: e.target.value}))}/>
        </article>;})}</div>}
        <button type="button" disabled={!lines.length || busy || loadingCatalog || !draftLoaded || draftSaveStatus !== 'saved'} onClick={() => void requestQuote()} className="w-full rounded-xl bg-[#FACC15] px-4 py-3 font-bold text-black disabled:opacity-40">{busy && !quote ? 'Calculando…' : 'Cotizar venta'}</button>
        {quote && <div className="space-y-3 rounded-xl border border-white/10 p-4"><div className="flex justify-between font-bold"><span>Total validado</span><span>{formatPrice(quote.total_amount)}</span></div><p className="text-xs text-gray-400">Válida hasta {new Intl.DateTimeFormat('es-CL', {timeStyle:'short'}).format(new Date(quote.valid_until))}. El cobro exige guardar primero la venta en el servidor.</p>{quote.requires_confirmation && <p className="text-sm text-amber-200">El catálogo cambió; confirmarás este precio actualizado al registrar.</p>}
          <label className="block text-sm text-gray-300">Medio de pago<select className="mt-1 w-full rounded-lg border border-white/10 bg-[#0D0D0D] p-3 text-white" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}><option value="EFECTIVO">Efectivo</option><option value="TRANSBANK">Transbank (débito/crédito)</option><option value="TRANSFERENCIA">Transferencia</option></select></label>
          {paymentMethod === 'EFECTIVO' && <label className="block text-sm text-gray-300">Efectivo recibido<input className="mt-1 w-full rounded-lg border border-white/10 bg-[#0D0D0D] p-3 text-white" type="number" min={quote.total_amount} step="1" inputMode="numeric" value={amountReceived} onChange={e => setAmountReceived(e.target.value)}/></label>}
          <button type="button" disabled={busy || draftSaveStatus !== 'saved'} onClick={() => void saveSale()} className="w-full rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Guardando venta…' : 'Confirmar pago y registrar venta'}</button>
        </div>}
      </div>
    </fieldset>
    <div className="border-t border-white/10 pt-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Ventas recientes</h3>
      {!orders.length ? <p className="text-xs text-gray-500">Todavía no hay ventas registradas.</p> : <div className="space-y-2">{orders.map(order => <div key={order.uuid} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#0D0D0D] p-3"><div><p className="text-sm font-medium text-white">#{String(order.shift_order_number).padStart(3, '0')} · {formatPrice(order.total_amount)} · {order.payment_method.replace('_', ' ')}</p><p className="text-xs text-gray-500">{new Intl.DateTimeFormat('es-CL', {dateStyle:'short', timeStyle:'short'}).format(new Date(order.created_at))}{order.status === 'ANULADA' ? ` · Anulada: ${order.cancellation_reason}` : ''}</p></div><div className="flex items-center gap-2"><span className={`text-xs ${order.status === 'ANULADA' ? 'text-red-300' : 'text-emerald-300'}`}>{order.status === 'ANULADA' ? 'ANULADA' : 'COMPLETADA'}</span>{order.status === 'COMPLETADA' && order.shift_uuid === shiftUuid && <button type="button" disabled={busy} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200 hover:bg-red-950/40 disabled:opacity-40" onClick={() => void cancelOrder(order)}>Anular</button>}</div></div>)}</div>}
    </div>
  </section>;
};
