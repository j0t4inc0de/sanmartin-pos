import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, BarChart3, Boxes, CircleDollarSign, Clock3, LogOut, Printer, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ApiError, cargarTokenCsrf, solicitarApi } from '../services/apiClient';
import { Alert } from './Alert';
import { PosSalesPanel } from './PosSalesPanel';
import { PosPrinterDiagnostics } from './PosPrinterDiagnostics';
import { PosCatalogManager } from './PosCatalogManager';
import { PosReports } from './PosReports';
import { usePosDialogs } from './PosDialogs';
import { cargarAccesoOfflinePos, cargarCatalogoPos, cargarCobroPendientePos, cargarTurnoDesdeCachePos, eliminarAnulacionOfflinePos, eliminarEventoTurnoOfflinePos, eliminarVentaOfflineDeColaPos, guardarAccesoOfflinePos, guardarAnulacionOfflinePos, guardarEventoYTurnoEnCacheOfflinePos, guardarTurnoEnCachePos, guardarVentaOfflineEnColaPos, listarAnulacionesOfflinePos, listarEventosTurnoOfflinePos, listarVentasOfflineEnColaPos, marcarErrorAnulacionOfflinePos, marcarErrorEventoTurnoOfflinePos, marcarErrorVentaOfflineEnColaPos, precargarCatalogoPos, type PosOfflineShiftEvent } from '../services/posLocalStore';

interface PosUser {
  id: number;
  username: string;
  can_operate_pos: boolean;
}

interface CashShift {
  uuid: string;
  username: string;
  opened_at: string;
  closed_at: string | null;
  initial_cash: number;
  final_cash: number | null;
  counted_cash: number | null;
  cash_difference: number | null;
  sales_summary: PaymentSummaryEntry[];
  closed_automatically: boolean;
  notes: string;
  is_open: boolean;
  updated_at: string;
}

interface PaymentSummaryEntry {
  payment_method: string;
  label: string;
  total_amount: number;
  order_count: number;
}

interface ShiftStateResponse {
  shift: CashShift | null;
  another_shift_open: boolean;
  next_order_number: number;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatChileClock = (value: Date) => ({
  date: new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value),
  time: new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h12',
  }).format(value).replace(/\ba\.\s*m\./i, 'AM').replace(/\bp\.\s*m\./i, 'PM'),
});

const chileDateAndMinute = (value: Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Santiago',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value);
  const part = (type: string) => Number(parts.find(entry => entry.type === type)?.value ?? 0);
  return { year: part('year'), month: part('month'), day: part('day'), date: part('year') * 10000 + part('month') * 100 + part('day'), minute: part('hour') * 60 + part('minute') };
};

const debeCerrarAutomaticamente = (openedAt: string, now: Date) => {
  const opened = chileDateAndMinute(new Date(openedAt));
  const current = chileDateAndMinute(now);
  const cutoff = 30;
  const cutoffDay = opened.minute < cutoff
    ? opened.date
    : (() => {
      const nextDay = new Date(Date.UTC(opened.year, opened.month - 1, opened.day + 1));
      return nextDay.getUTCFullYear() * 10000 + (nextDay.getUTCMonth() + 1) * 100 + nextDay.getUTCDate();
    })();
  return current.date > cutoffDay || (current.date === cutoffDay && current.minute >= cutoff);
};

const PaymentSummaryList = ({ items }: { items: PaymentSummaryEntry[] }) => (
  <ul className="mt-2 space-y-2">
    {items.map((item) => (
      <li key={item.payment_method} className="flex items-center justify-between gap-4">
        <span className="text-gray-300">
          {item.label} <span className="text-gray-500">({item.order_count})</span>
        </span>
        <span className="font-semibold text-white">{formatPrice(item.total_amount)}</span>
      </li>
    ))}
  </ul>
);

export const PosPage = () => {
  const { confirm } = usePosDialogs();
  const pendingOpeningUuid = useRef<string | null>(null);
  const offlineTransitionInProgress = useRef(false);
  const [user, setUser] = useState<PosUser | null>(null);
  const [shift, setShift] = useState<CashShift | null>(null);
  const [lastClosedShift, setLastClosedShift] = useState<CashShift | null>(null);
  const [anotherShiftOpen, setAnotherShiftOpen] = useState(false);
  const [nextOrderNumber, setNextOrderNumber] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [initialCash, setInitialCash] = useState('0');
  const [openingNotes, setOpeningNotes] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingCashCount, setClosingCashCount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [chileClock, setChileClock] = useState(() => formatChileClock(new Date()));
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<'sales' | 'catalog' | 'reports' | 'devices'>('sales');
  const [hasQueuedOfflineSales, setHasQueuedOfflineSales] = useState(false);
  const [autoCloseDue, setAutoCloseDue] = useState(false);
  const [autoCloseWaitingForPayment, setAutoCloseWaitingForPayment] = useState(false);
  const [pendingShiftEvents, setPendingShiftEvents] = useState<PosOfflineShiftEvent[]>([]);
  const autoCloseInProgress = useRef(false);

  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);

  useEffect(() => {
    const updateClock = () => setChileClock(formatChileClock(new Date()));
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const refreshShift = async () => {
    const response = await solicitarApi<ShiftStateResponse>(
      '/api/shifts/current/',
    );
    setShift(response.shift);
    setAnotherShiftOpen(response.another_shift_open);
    setNextOrderNumber(response.next_order_number);
    if (user) void guardarTurnoEnCachePos(user.id, response).catch(() => undefined);
  };

  const restoreOfflineSession = useCallback(async (
    offlineUser: PosUser,
    knownState?: { shift: CashShift | null; another_shift_open: boolean; next_order_number: number },
  ) => {
    const cached = knownState ?? await cargarTurnoDesdeCachePos<CashShift>(offlineUser.id);
    if (!cached) throw new Error('Este equipo no tiene un estado de caja guardado para trabajar sin conexión.');
    await guardarAccesoOfflinePos({ user: offlineUser }).catch(() => undefined);
    await guardarTurnoEnCachePos(offlineUser.id, cached);
    setUser(offlineUser);
    setShift(cached.shift);
    setAnotherShiftOpen(cached.another_shift_open);
    setNextOrderNumber(cached.next_order_number);
    const queuedSales = await listarVentasOfflineEnColaPos(cached.shift?.uuid);
    const queuedCancellations = await listarAnulacionesOfflinePos(cached.shift?.uuid);
    setHasQueuedOfflineSales(queuedSales.length > 0 || queuedCancellations.length > 0);
    setPendingShiftEvents(await listarEventosTurnoOfflinePos(offlineUser.id));
    void cargarCatalogoPos().catch(() => undefined);
    setOfflineMode(true);
    setErrorMessage('');
  }, []);

  const activateOfflineMode = useCallback(async () => {
    if (!user || offlineMode || offlineTransitionInProgress.current) return;
    offlineTransitionInProgress.current = true;
    try {
      const cached = await cargarTurnoDesdeCachePos<CashShift>(user.id);
      const localState = cached ?? {
        shift,
        another_shift_open: anotherShiftOpen,
        next_order_number: nextOrderNumber,
      };
      await restoreOfflineSession(user, localState);
    } catch {
      setErrorMessage('Se perdió la conexión con la caja y no se pudieron cargar los datos guardados en este equipo.');
    } finally {
      offlineTransitionInProgress.current = false;
    }
  }, [user, offlineMode, shift, anotherShiftOpen, nextOrderNumber, restoreOfflineSession]);

  useEffect(() => {
    if (!user || offlineMode) return;
    let cancelled = false;
    let checking = false;
    let timeoutId = 0;

    const checkApiAvailability = async () => {
      if (cancelled || checking) return;
      checking = true;
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch('/api/auth/csrf/', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) await activateOfflineMode();
      } catch {
        await activateOfflineMode();
      } finally {
        window.clearTimeout(timeoutId);
        checking = false;
      }
    };

    const handleBrowserOffline = () => void checkApiAvailability();
    const handleApiUnavailable = () => void activateOfflineMode();
    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('pos:api-unavailable', handleApiUnavailable);
    const intervalId = window.setInterval(() => void checkApiAvailability(), 5000);
    void checkApiAvailability();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('pos:api-unavailable', handleApiUnavailable);
    };
  }, [user, offlineMode, activateOfflineMode]);

  const syncPendingOpenEvents = async (userId: number) => {
    const events = await listarEventosTurnoOfflinePos(userId, 'OPEN');
    let allSynced = true;
    for (const event of events) {
      try {
        await solicitarApi('/api/shifts/open/', { method: 'POST', body: { uuid: event.shift_uuid, ...event.payload } });
        await eliminarEventoTurnoOfflinePos(event);
      } catch (error) {
        // Si el servidor responde 409 o 400 con mensaje de turno ya abierto:
        const isConflict = error instanceof ApiError && (
          error.status === 409 ||
          error.status === 400 ||
          error.message.includes('Ya existe un turno abierto')
        );
        if (isConflict) {
          try {
            const currentShiftState = await solicitarApi<ShiftStateResponse>('/api/shifts/current/');
            if (currentShiftState?.shift) {
              // El usuario actual ya tiene un turno abierto y válido en el servidor.
              // Reasignamos cualquier venta/anulación offline al turno activo del servidor:
              const queuedSales = await listarVentasOfflineEnColaPos(event.shift_uuid);
              const queuedCancellations = await listarAnulacionesOfflinePos(event.shift_uuid);
              for (const sale of queuedSales) {
                await guardarVentaOfflineEnColaPos({ ...sale, shift_uuid: currentShiftState.shift.uuid });
              }
              for (const cancellation of queuedCancellations) {
                await guardarAnulacionOfflinePos({ ...cancellation, shift_uuid: currentShiftState.shift.uuid });
              }
              // Descartamos la apertura duplicada que ya no es necesaria
              await eliminarEventoTurnoOfflinePos(event);
              await guardarTurnoEnCachePos(userId, currentShiftState).catch(() => undefined);
              continue;
            }
          } catch (innerError) {
            console.warn('Error al conciliar apertura duplicada con turno de servidor:', innerError);
          }
        }
        await marcarErrorEventoTurnoOfflinePos(event, error instanceof Error ? error.message : 'No se pudo sincronizar la apertura del turno.');
        setErrorMessage(error instanceof Error ? error.message : 'La apertura offline sigue pendiente de sincronización.');
        allSynced = false;
        break;
      }
    }
    setPendingShiftEvents(await listarEventosTurnoOfflinePos(userId));
    return allSynced;
  };

  const syncPendingCloseEvents = async (userId: number) => {
    const events = await listarEventosTurnoOfflinePos(userId, 'CLOSE');
    let allSynced = true;
    for (const event of events) {
      try {
        if ((await listarVentasOfflineEnColaPos(event.shift_uuid)).length > 0 || (await listarAnulacionesOfflinePos(event.shift_uuid)).length > 0) {
          allSynced = false;
          break;
        }
        const closedShift = await solicitarApi<CashShift>(`/api/shifts/${event.shift_uuid}/close/`, {
          method: 'POST',
          body: event.payload,
        });
        await eliminarEventoTurnoOfflinePos(event);
        setLastClosedShift(closedShift);
        setShift(null);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // El turno nunca existió en el backend (apertura y cierre puramente offline)
          await eliminarEventoTurnoOfflinePos(event);
          continue;
        }
        await marcarErrorEventoTurnoOfflinePos(event, error instanceof Error ? error.message : 'No se pudo sincronizar el cierre del turno.');
        setErrorMessage(error instanceof Error ? error.message : 'El cierre offline sigue pendiente de sincronización.');
        allSynced = false;
        break;
      }
    }
    setPendingShiftEvents(await listarEventosTurnoOfflinePos(userId));
    return allSynced;
  };

  const syncOfflineOperationsForClosedShift = async (userId: number, shiftUuid: string) => {
    const sales = await listarVentasOfflineEnColaPos(shiftUuid);
    for (const order of sales) {
      try {
        const { saved_at: _savedAt, sync_error: _syncError, ...payload } = order;
        await solicitarApi('/api/orders/sync/', { method: 'POST', body: payload });
        await eliminarVentaOfflineDeColaPos(order.uuid);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo conciliar una venta del turno cerrado.';
        await marcarErrorVentaOfflineEnColaPos(order.uuid, message);
        setErrorMessage(`${message} La venta sigue guardada en este equipo.`);
        throw error;
      }
    }
    const cancellations = await listarAnulacionesOfflinePos(shiftUuid);
    for (const cancellation of cancellations) {
      try {
        await solicitarApi(`/api/orders/${cancellation.order_uuid}/cancel/`, { method: 'POST', body: { reason: cancellation.reason } });
        await eliminarAnulacionOfflinePos(cancellation.order_uuid);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo conciliar una anulación del turno cerrado.';
        await marcarErrorAnulacionOfflinePos(cancellation.order_uuid, message);
        setErrorMessage(`${message} La anulación sigue guardada en este equipo.`);
        throw error;
      }
    }
    const closeEvents = (await listarEventosTurnoOfflinePos(userId, 'CLOSE')).filter(event => event.shift_uuid === shiftUuid);
    if (closeEvents.length && !await syncPendingCloseEvents(userId)) {
      throw new Error('El cierre del turno sigue pendiente de conciliación.');
    }
    let closedShift: CashShift | null = null;
    try {
      closedShift = await solicitarApi<CashShift>(`/api/shifts/${shiftUuid}/`);
      setLastClosedShift(closedShift);
    } catch {
      // El turno no existe en el servidor (fue un turno offline no registrado)
      closedShift = null;
    }
    setPendingShiftEvents(await listarEventosTurnoOfflinePos(userId));
    setHasQueuedOfflineSales(false);
    return closedShift;
  };

  const handleSaleSaved = async (offlineNextOrderNumber?: number, offlineCancellation?: { payment_method: string; total_amount: number }) => {
    if (offlineMode && (offlineNextOrderNumber || offlineCancellation)) {
      if (offlineNextOrderNumber) setNextOrderNumber(offlineNextOrderNumber);
      if (user && shift) {
        const queuedOrders = await listarVentasOfflineEnColaPos(shift.uuid);
        const newOrder = offlineNextOrderNumber ? queuedOrders.find(order => order.shift_order_number === offlineNextOrderNumber - 1) : undefined;
        const newTotal = newOrder?.items.reduce((sum, item) => sum + item.quantity * (item.unit_price + item.modifiers.reduce((extra, modifier) => extra + modifier.price_at_sale * modifier.quantity_per_unit, 0)), 0) ?? 0;
        const updatedShift = {
          ...shift,
          sales_summary: shift.sales_summary.map(item => ({
            ...item,
            total_amount: Math.max(0, item.total_amount + (newOrder?.payment_method === item.payment_method ? newTotal : 0) - (offlineCancellation?.payment_method === item.payment_method ? offlineCancellation.total_amount : 0)),
            order_count: Math.max(0, item.order_count + (newOrder?.payment_method === item.payment_method ? 1 : 0) - (offlineCancellation?.payment_method === item.payment_method ? 1 : 0)),
          })),
        };
        setShift(updatedShift);
        setHasQueuedOfflineSales(queuedOrders.length > 0);
        await guardarTurnoEnCachePos(user.id, {
          shift: updatedShift,
          another_shift_open: anotherShiftOpen,
          next_order_number: offlineNextOrderNumber ?? nextOrderNumber,
        });
      }
      return;
    }
    await refreshShift();
    if (user) await syncPendingCloseEvents(user.id);
  };

  const handleReconnect = async (silent = false) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await cargarTokenCsrf(true);
      const session = await solicitarApi<{ user: PosUser }>('/api/auth/session/');
      await syncPendingOpenEvents(session.user.id);
      const cachedShift = await cargarTurnoDesdeCachePos<CashShift>(session.user.id);
      const queuedSales = cachedShift?.shift ? await listarVentasOfflineEnColaPos(cachedShift.shift.uuid) : [];
      const queuedCancellations = cachedShift?.shift ? await listarAnulacionesOfflinePos(cachedShift.shift.uuid) : [];
      if (queuedSales.length === 0 && queuedCancellations.length === 0) await syncPendingCloseEvents(session.user.id);
      const currentShift = await solicitarApi<ShiftStateResponse>('/api/shifts/current/');
      if (cachedShift?.shift && currentShift.shift?.uuid !== cachedShift.shift.uuid) {
        if (!currentShift.shift) {
          setShift(null);
          setHasQueuedOfflineSales(queuedSales.length > 0 || queuedCancellations.length > 0);
          await syncOfflineOperationsForClosedShift(session.user.id, cachedShift.shift.uuid).catch(() => undefined);
          await guardarTurnoEnCachePos(session.user.id, { ...currentShift, shift: null });
        } else {
          await syncOfflineOperationsForClosedShift(session.user.id, cachedShift.shift.uuid).catch(() => undefined);
          await guardarTurnoEnCachePos(session.user.id, currentShift);
        }
      }
      setUser(session.user);
      setShift(currentShift.shift);
      setAnotherShiftOpen(currentShift.another_shift_open);
      setNextOrderNumber(currentShift.next_order_number);
      setOfflineMode(false);
      void precargarCatalogoPos().catch(() => undefined);
      setHasQueuedOfflineSales(currentShift.shift?.uuid === cachedShift?.shift?.uuid && (queuedSales.length > 0 || queuedCancellations.length > 0));
      await guardarTurnoEnCachePos(session.user.id, currentShift);
    } catch (error) {
      if (!silent) setErrorMessage(error instanceof Error ? `${error.message} Inicia sesión online para reanudar la sincronización.` : 'No se pudo reconectar con el servidor.');
    } finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    if (!user || !offlineMode) return;
    let cancelled = false;
    let checking = false;

    const tryReconnect = async () => {
      if (cancelled || checking || isSubmitting || !navigator.onLine) return;
      checking = true;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch('/api/auth/csrf/', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (response.ok && !cancelled) await handleReconnect(true);
      } catch {
        // The API is still unavailable; the next interval retries without interrupting POS work.
      } finally {
        window.clearTimeout(timeoutId);
        checking = false;
      }
    };

    const handleBrowserOnline = () => void tryReconnect();
    window.addEventListener('online', handleBrowserOnline);
    const intervalId = window.setInterval(() => void tryReconnect(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleBrowserOnline);
    };
  }, [user, offlineMode, isSubmitting]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      let serverConfirmedCachedShiftClosed = false;
      try {
        // Also migrates older local records by removing credential verifier data.
        const savedOfflineSession = await cargarAccesoOfflinePos().catch(() => null);
        if (savedOfflineSession) setUsername(savedOfflineSession.user.username);
        const response = await solicitarApi<{ user: PosUser }>(
          '/api/auth/session/',
        );
        if (cancelled) return;
        setUser(response.user);
        await guardarAccesoOfflinePos({ user: response.user }).catch(() => undefined);
        void precargarCatalogoPos().catch(() => undefined);
        await syncPendingOpenEvents(response.user.id);
        const cachedShift = await cargarTurnoDesdeCachePos<CashShift>(response.user.id);
        const queuedSales = cachedShift?.shift ? await listarVentasOfflineEnColaPos(cachedShift.shift.uuid) : [];
        const queuedCancellations = cachedShift?.shift ? await listarAnulacionesOfflinePos(cachedShift.shift.uuid) : [];
        if (queuedSales.length === 0 && queuedCancellations.length === 0) await syncPendingCloseEvents(response.user.id);
        const currentShift = await solicitarApi<ShiftStateResponse>(
          '/api/shifts/current/',
        );
        if (cachedShift?.shift && currentShift.shift?.uuid !== cachedShift.shift.uuid) {
          if (!currentShift.shift) {
            serverConfirmedCachedShiftClosed = true;
            setShift(null);
            setHasQueuedOfflineSales(queuedSales.length > 0 || queuedCancellations.length > 0);
            const closedShift = await syncOfflineOperationsForClosedShift(response.user.id, cachedShift.shift.uuid);
            setLastClosedShift(closedShift);
            await guardarTurnoEnCachePos(response.user.id, { ...currentShift, shift: null });
          } else {
            await syncOfflineOperationsForClosedShift(response.user.id, cachedShift.shift.uuid).catch(() => undefined);
            await guardarTurnoEnCachePos(response.user.id, currentShift);
          }
        }
        if (!cancelled) {
          setShift(currentShift.shift);
          setAnotherShiftOpen(currentShift.another_shift_open);
          setNextOrderNumber(currentShift.next_order_number);
          setErrorMessage('');
          void guardarTurnoEnCachePos(response.user.id, currentShift).catch(() => undefined);
        }
      } catch (error) {
        if (cancelled) return;
        if (serverConfirmedCachedShiftClosed) {
          setShift(null);
          setOfflineMode(false);
          setErrorMessage(error instanceof Error ? `El turno ya está cerrado en el servidor. La cola local permanece guardada para reintentar: ${error.message}` : 'El turno ya está cerrado en el servidor; las operaciones locales quedan guardadas para reintentar.');
        } else if (error instanceof ApiError && error.status === 403) {
          setUser(null);
          setShift(null);
        } else {
          void cargarCatalogoPos().catch(() => undefined);
          try {
            const record = await cargarAccesoOfflinePos();
            if (cancelled) return;
            if (!record) {
              setErrorMessage('Conéctate e inicia sesión una vez para habilitar el trabajo offline en este equipo.');
              return;
            }
            const cached = await cargarTurnoDesdeCachePos<CashShift>(record.user.id);
            if (cancelled) return;
            await restoreOfflineSession(record.user, cached ?? undefined);
          } catch {
            setErrorMessage('No se pudo leer la sesión y los datos offline guardados en este equipo.');
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    let serverConfirmedCachedShiftClosed = false;

    try {
      const response = await solicitarApi<{ user: PosUser }>(
        '/api/auth/login/',
        {
          method: 'POST',
          body: { username, password },
        },
      );
      setUser(response.user);
      setPassword('');
      setOfflineMode(false);
      await guardarAccesoOfflinePos({ user: response.user });
      void precargarCatalogoPos().catch(() => undefined);
      await syncPendingOpenEvents(response.user.id);
      const cachedShift = await cargarTurnoDesdeCachePos<CashShift>(response.user.id);
      const queuedSales = cachedShift?.shift ? await listarVentasOfflineEnColaPos(cachedShift.shift.uuid) : [];
      const queuedCancellations = cachedShift?.shift ? await listarAnulacionesOfflinePos(cachedShift.shift.uuid) : [];
      if (queuedSales.length === 0 && queuedCancellations.length === 0) await syncPendingCloseEvents(response.user.id);
      await refreshShift();
      const shiftState = await solicitarApi<ShiftStateResponse>('/api/shifts/current/');
      if (cachedShift?.shift && shiftState.shift?.uuid !== cachedShift.shift.uuid) {
        if (!shiftState.shift) {
          serverConfirmedCachedShiftClosed = true;
          setShift(null);
          setHasQueuedOfflineSales(queuedSales.length > 0 || queuedCancellations.length > 0);
          const closedShift = await syncOfflineOperationsForClosedShift(response.user.id, cachedShift.shift.uuid);
          setLastClosedShift(closedShift);
          await guardarTurnoEnCachePos(response.user.id, { ...shiftState, shift: null });
        } else {
          await syncOfflineOperationsForClosedShift(response.user.id, cachedShift.shift.uuid).catch(() => undefined);
          await guardarTurnoEnCachePos(response.user.id, shiftState);
        }
      }
      setShift(shiftState.shift);
      setAnotherShiftOpen(shiftState.another_shift_open);
      setNextOrderNumber(shiftState.next_order_number);
      setErrorMessage('');
      await guardarTurnoEnCachePos(response.user.id, shiftState);
    } catch (error) {
      if (serverConfirmedCachedShiftClosed) {
        setShift(null);
        setOfflineMode(false);
        setErrorMessage(error instanceof Error ? `El turno ya está cerrado en el servidor. La cola local permanece guardada para reintentar: ${error.message}` : 'El turno ya está cerrado en el servidor; las operaciones locales quedan guardadas para reintentar.');
        return;
      }
      const apiUnavailable = error instanceof TypeError
        || (error instanceof ApiError && (error.status >= 500 || error.message === 'No se pudo preparar la sesión segura.'));
      if (apiUnavailable) {
        try {
          const record = await cargarAccesoOfflinePos();
          if (record && record.user.username.trim().toLocaleLowerCase() === username.trim().toLocaleLowerCase()) {
            await restoreOfflineSession(record.user);
            setPassword('');
            return;
          }
          setErrorMessage(record
            ? `No hay conexión. Este equipo tiene guardada la cuenta «${record.user.username}» para trabajar offline.`
            : 'No hay conexión y este equipo no tiene una cuenta offline guardada. Se necesita iniciar sesión online una vez en este equipo.');
        } catch (offlineError) {
          setErrorMessage(offlineError instanceof Error ? offlineError.message : 'No se pudo abrir el POS offline.');
        }
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const pendingWork = hasPendingPayment || hasQueuedOfflineSales || pendingShiftEvents.length > 0;
    const shouldLogout = await confirm({
      title: '¿Cerrar sesión?',
      message: pendingWork
        ? 'Hay información de caja pendiente guardada en este equipo. Cerrar la sesión no la elimina, pero tendrás que volver a ingresar para continuar o sincronizarla.'
        : 'Se cerrará tu sesión en este equipo. Podrás volver a ingresar con tu cuenta.',
      confirmLabel: 'Cerrar sesión',
      tone: 'warning',
    });
    if (!shouldLogout) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (!offlineMode) await solicitarApi<void>('/api/auth/logout/', { method: 'POST' });
      setUser(null);
      setOfflineMode(false);
      setShift(null);
      setAnotherShiftOpen(false);
      setPendingShiftEvents([]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo cerrar la sesión.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenShift = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasQueuedOfflineSales) {
      setErrorMessage('Sincroniza las ventas y anulaciones pendientes del turno anterior antes de abrir otra caja.');
      return;
    }
    const amount = Number(initialCash);
    if (!Number.isSafeInteger(amount) || amount < 0) {
      setErrorMessage('El fondo inicial debe ser un monto entero no negativo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    const openingUuid = pendingOpeningUuid.current ?? window.crypto.randomUUID();
    pendingOpeningUuid.current = openingUuid;
    try {
      if (offlineMode) {
        if (!user) throw new Error('No hay una cuenta offline disponible para abrir este turno.');
        const openedAt = new Date().toISOString();
        const localShift: CashShift = {
          uuid: openingUuid,
          username: user.username,
          opened_at: openedAt,
          closed_at: null,
          initial_cash: amount,
          final_cash: null,
          counted_cash: null,
          cash_difference: null,
          sales_summary: [
            { payment_method: 'EFECTIVO', label: 'Efectivo', total_amount: 0, order_count: 0 },
            { payment_method: 'TRANSBANK', label: 'Transbank', total_amount: 0, order_count: 0 },
            { payment_method: 'TRANSFERENCIA', label: 'Transferencia', total_amount: 0, order_count: 0 },
          ],
          closed_automatically: false,
          notes: openingNotes,
          is_open: true,
          updated_at: openedAt,
        };
        await guardarEventoYTurnoEnCacheOfflinePos(user.id, {
          shift: localShift,
          another_shift_open: false,
          next_order_number: 1,
        }, {
          user_id: user.id,
          shift_uuid: openingUuid,
          event_type: 'OPEN',
          payload: { opened_at: openedAt, initial_cash: amount, notes: openingNotes },
        });
        setPendingShiftEvents(await listarEventosTurnoOfflinePos(user.id));
        pendingOpeningUuid.current = null;
        setShift(localShift);
        setAnotherShiftOpen(false);
        setNextOrderNumber(1);
        setOpeningNotes('');
        setLastClosedShift(null);
        setErrorMessage('');
        return;
      }
      await solicitarApi<CashShift>('/api/shifts/open/', {
        method: 'POST',
        body: {
          uuid: openingUuid,
          opened_at: new Date().toISOString(),
          initial_cash: amount,
          notes: openingNotes,
        },
      });
      pendingOpeningUuid.current = null;
      setOpeningNotes('');
      setLastClosedShift(null);
      await refreshShift();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo abrir el turno.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (hasPendingPayment) {
      setErrorMessage('Resuelve la cotización o venta pendiente antes de cerrar el turno.');
      return;
    }
    if (hasQueuedOfflineSales && !offlineMode) {
      setErrorMessage('Espera a que se sincronicen las ventas offline antes de cerrar el turno.');
      return;
    }
    if (!shift?.is_open) return;
    if (!await confirm({ title: 'Cerrar turno', message: 'Confirma el cierre de este turno. Se guardará el efectivo contado y el resumen de caja.', confirmLabel: 'Cerrar turno', tone: 'warning' })) return;
    const countedCash = Number(closingCashCount);
    if (!Number.isSafeInteger(countedCash) || countedCash < 0) {
      setErrorMessage('Ingresa el efectivo contado como un monto entero no negativo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (offlineMode) {
        if (!user) throw new Error('No hay una cuenta offline disponible para guardar el cierre.');
        const closedAt = new Date().toISOString();
        const expectedCash = shift.initial_cash + (shift.sales_summary.find(item => item.payment_method === 'EFECTIVO')?.total_amount ?? 0);
        const closedShift: CashShift = {
          ...shift,
          closed_at: closedAt,
          final_cash: expectedCash,
          counted_cash: countedCash,
          cash_difference: countedCash - expectedCash,
          closed_automatically: false,
          notes: closingNotes || shift.notes,
          is_open: false,
          updated_at: closedAt,
        };
        await guardarEventoYTurnoEnCacheOfflinePos(user.id, {
          shift: closedShift,
          another_shift_open: false,
          next_order_number: nextOrderNumber,
        }, {
          user_id: user.id,
          shift_uuid: shift.uuid,
          event_type: 'CLOSE',
          payload: { closed_at: closedAt, counted_cash: countedCash, closed_automatically: false, notes: closingNotes },
        });
        setPendingShiftEvents(await listarEventosTurnoOfflinePos(user.id));
        setShift(closedShift);
        setLastClosedShift(closedShift);
        setClosingNotes('');
        setClosingCashCount('');
        return;
      }
      const closedShift = await solicitarApi<CashShift>(
        `/api/shifts/${shift.uuid}/close/`,
        {
          method: 'POST',
          body: {
            closed_at: new Date().toISOString(),
            counted_cash: countedCash,
            notes: closingNotes,
          },
        },
      );
      setLastClosedShift(closedShift);
      setClosingNotes('');
      setClosingCashCount('');
      await refreshShift();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo cerrar el turno.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cerrarTurnoAutomaticamente = useCallback(async (): Promise<boolean> => {
    if (!shift?.is_open || !user || autoCloseInProgress.current) return false;
    autoCloseInProgress.current = true;
    let startedSubmission = false;
    try {
      setAutoCloseDue(true);
      const savedPayment = await cargarCobroPendientePos(shift.uuid).catch(() => null);
      const paymentNeedsResolution = hasPendingPayment || savedPayment?.status === 'PAGO_RECIBIDO';
      setAutoCloseWaitingForPayment(paymentNeedsResolution);
      if (paymentNeedsResolution || (!offlineMode && hasQueuedOfflineSales) || isSubmittingRef.current) return false;
      startedSubmission = true;
      setIsSubmitting(true);
      setErrorMessage('');
      const closedAt = new Date().toISOString();
      const expectedCash = shift.initial_cash + (shift.sales_summary.find(item => item.payment_method === 'EFECTIVO')?.total_amount ?? 0);
      const closedShift: CashShift = {
        ...shift,
        closed_at: closedAt,
        final_cash: expectedCash,
        counted_cash: null,
        cash_difference: null,
        closed_automatically: true,
        is_open: false,
        updated_at: closedAt,
      };
      await guardarEventoYTurnoEnCacheOfflinePos(user.id, {
        shift: closedShift,
        another_shift_open: false,
        next_order_number: nextOrderNumber,
      }, {
        user_id: user.id,
        shift_uuid: shift.uuid,
        event_type: 'CLOSE',
        payload: { closed_at: closedAt, counted_cash: null, closed_automatically: true, notes: shift.notes },
      });
      setShift(closedShift);
      setLastClosedShift(closedShift);
      setPendingShiftEvents(await listarEventosTurnoOfflinePos(user.id));
      setAutoCloseDue(false);
      setAutoCloseWaitingForPayment(false);
      if (!offlineMode && navigator.onLine && await syncPendingOpenEvents(user.id)) {
        await syncPendingCloseEvents(user.id);
      }
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el cierre automático en este equipo.');
      return false;
    } finally {
      autoCloseInProgress.current = false;
      if (startedSubmission) setIsSubmitting(false);
    }
  }, [shift, user, nextOrderNumber, hasPendingPayment, hasQueuedOfflineSales, offlineMode]);

  const comprobarTurnoAntesDeVenta = useCallback(async (): Promise<boolean> => {
    if (!shift?.is_open) return false;
    if (!debeCerrarAutomaticamente(shift.opened_at, new Date())) return true;
    setAutoCloseDue(true);
    await cerrarTurnoAutomaticamente();
    return false;
  }, [shift, cerrarTurnoAutomaticamente]);

  const handleRetryPendingShiftEvents = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const openSynced = await syncPendingOpenEvents(user.id);
      if (openSynced) {
        if (!hasQueuedOfflineSales) {
          await syncPendingCloseEvents(user.id);
        }
        await refreshShift();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron sincronizar los eventos de turno pendientes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardPendingOpenEvent = async (event: PosOfflineShiftEvent) => {
    if (!user || isSubmitting) return;
    const confirmed = await confirm({
      title: '¿Descartar apertura huérfana?',
      message: 'Esta apertura offline no se pudo sincronizar porque ya existe un turno activo en el servidor. Si descartas este evento, podrás operar el turno activo sin bloqueos. Cualquier venta offline pendiente se vinculará al turno activo del servidor.',
      confirmLabel: 'Descartar apertura',
      tone: 'danger',
    });
    if (!confirmed) return;
    setIsSubmitting(true);
    try {
      const currentShiftState = await solicitarApi<ShiftStateResponse>('/api/shifts/current/').catch(() => null);
      if (currentShiftState?.shift) {
        const queuedSales = await listarVentasOfflineEnColaPos(event.shift_uuid);
        for (const sale of queuedSales) {
          await guardarVentaOfflineEnColaPos({ ...sale, shift_uuid: currentShiftState.shift.uuid });
        }
        const queuedCancellations = await listarAnulacionesOfflinePos(event.shift_uuid);
        for (const cancellation of queuedCancellations) {
          await guardarAnulacionOfflinePos({ ...cancellation, shift_uuid: currentShiftState.shift.uuid });
        }
      }
      await eliminarEventoTurnoOfflinePos(event);
      setPendingShiftEvents(await listarEventosTurnoOfflinePos(user.id));
      await refreshShift().catch(() => undefined);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo descartar la apertura pendiente.');
    } finally {
      setIsSubmitting(false);
    }
  };



  useEffect(() => {
    if (!shift?.is_open || !user) {
      setAutoCloseDue(false);
      setAutoCloseWaitingForPayment(false);
      return;
    }
    let cancelled = false;
    const checkAutomaticClose = () => {
      if (!cancelled && debeCerrarAutomaticamente(shift.opened_at, new Date())) {
        void cerrarTurnoAutomaticamente();
      }
    };
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') checkAutomaticClose(); };
    void checkAutomaticClose();
    const intervalId = window.setInterval(checkAutomaticClose, 15000);
    window.addEventListener('focus', checkAutomaticClose);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkAutomaticClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shift, user, cerrarTurnoAutomaticamente]);

  return (
    <main className="pos-shell min-h-screen bg-[#0D0D0D] px-4 py-5 text-gray-100 sm:px-6 sm:py-8 2xl:px-10">
      <div className="mx-auto w-full max-w-[1600px]">
        {!user && (
          <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FACC15]">
                San Martín
              </p>
              <h1 className="mt-1 font-heading text-3xl font-bold uppercase text-white">
                Punto de venta
              </h1>
            </div>
          </header>
        )}

        {errorMessage && (
          <Alert severity="error" className="mb-5">
            {errorMessage}
          </Alert>
        )}

        {isLoading ? (
          <div role="status" className="rounded-2xl border border-white/10 bg-[#171717] p-6 text-gray-300">
            Cargando sesión…
          </div>
        ) : !user ? (
          <form
            onSubmit={handleLogin}
            className="mx-auto w-full max-w-xl space-y-5 rounded-2xl border border-white/10 bg-[#171717] p-6 shadow-xl sm:p-8"
          >
            <div>
              <h2 className="font-heading text-xl font-bold uppercase text-white">
                Iniciar sesión
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Con conexión, usa tu contraseña. Si el servidor no responde, se abrirá la cuenta guardada en este equipo.
              </p>
            </div>

            <label className="block space-y-2 text-sm text-gray-300" htmlFor="pos-username">
              Usuario
              <input
                id="pos-username"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-white outline-none transition focus:border-[#FACC15]"
              />
            </label>

            <label className="block space-y-2 text-sm text-gray-300" htmlFor="pos-password">
              Contraseña
              <input
                id="pos-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-white outline-none transition focus:border-[#FACC15]"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Validando…' : 'Entrar al POS'}
            </button>
          </form>
        ) : (
          <section className="pos-authenticated space-y-5">
            {/* Master Unified POS Command Navbar */}
            <header className="pos-master-navbar pos-session-card flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#12161E]/95 backdrop-blur-xl p-3 sm:px-5 sm:py-3 shadow-2xl transition-all xl:flex-row xl:items-center xl:justify-between">
              {/* Bloque 1: Identidad Brand + Navegación Segmentada de Espacios (Caja, Catálogo, Reportes, Impresora) */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Brand Emblem */}
                <div className="flex h-10 items-center gap-2.5 pr-2 sm:pr-4 sm:border-r border-white/10 shrink-0">
                  <div className="pos-navbar-logo w-8 h-8 rounded-full overflow-hidden border-2 border-[#FACC15]/40 shadow-[0_0_10px_rgba(250,204,21,0.25)] shrink-0 bg-[#0D0D0D]">
                    <img
                      src="/logo-sanmartin.png"
                      alt="San Martín Food Truck"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo-sanmartin.jpg';
                      }}
                    />
                  </div>
                  <div className="leading-none">
                    <span className="block font-heading text-base font-extrabold uppercase tracking-wider text-white leading-none">
                      San Martín
                    </span>
                    <span className="pos-brand-tag block text-[9px] font-bold uppercase tracking-[0.2em] text-[#FACC15] leading-none mt-1">
                      Punto de Venta
                    </span>
                  </div>
                </div>

                {/* Segmented Workspace Navigation Tabs */}
                <nav className="pos-workspace-nav shrink-0" aria-label="Secciones del punto de venta">
                  <button
                    type="button"
                    aria-current={activeWorkspace === 'sales' ? 'page' : undefined}
                    className={`pos-workspace-tab ${activeWorkspace === 'sales' ? 'is-active' : ''}`}
                    onClick={() => setActiveWorkspace('sales')}
                  >
                    <CircleDollarSign aria-hidden="true" />
                    <span>Caja</span>
                  </button>

                  <button
                    type="button"
                    aria-current={activeWorkspace === 'catalog' ? 'page' : undefined}
                    className={`pos-workspace-tab ${activeWorkspace === 'catalog' ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveWorkspace('catalog');
                      if (offlineMode) {
                        void cargarCatalogoPos().catch(() => undefined);
                      } else {
                        void precargarCatalogoPos().catch(() => undefined);
                      }
                    }}
                  >
                    <Boxes aria-hidden="true" />
                    <span>Catálogo</span>
                  </button>

                  <button
                    type="button"
                    aria-current={activeWorkspace === 'reports' ? 'page' : undefined}
                    className={`pos-workspace-tab ${activeWorkspace === 'reports' ? 'is-active' : ''}`}
                    onClick={() => setActiveWorkspace('reports')}
                  >
                    <BarChart3 aria-hidden="true" />
                    <span>Reportes</span>
                  </button>

                  <button
                    type="button"
                    aria-current={activeWorkspace === 'devices' ? 'page' : undefined}
                    className={`pos-workspace-tab ${activeWorkspace === 'devices' ? 'is-active' : ''}`}
                    onClick={() => setActiveWorkspace('devices')}
                  >
                    <Printer aria-hidden="true" />
                    <span>Impresora</span>
                  </button>

                  {offlineMode && activeWorkspace === 'catalog' && (
                    <span className="hidden xl:inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200 ml-1">
                      Solo lectura offline
                    </span>
                  )}
                </nav>
              </div>

              {/* Bloque 2: Estado de Red, Reloj de Santiago y Control de Sesión (Cápsulas Uniformes h-10) */}
              <div className="flex flex-wrap items-center justify-between xl:justify-end gap-2.5">
                {/* Conectividad & Sincronización */}
                {offlineMode ? (
                  <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200 shadow-sm">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                    <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="hidden sm:inline">Modo offline</span>
                    <button
                      type="button"
                      onClick={() => void handleReconnect()}
                      disabled={isSubmitting}
                      className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 px-2.5 text-[11px] font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm ml-1"
                      title="Reconectar y sincronizar ventas offline con el servidor"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSubmitting ? 'animate-spin text-white' : 'text-emerald-100'}`} />
                      <span>{isSubmitting ? 'Conectando…' : 'Reconectar'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 text-xs font-semibold text-emerald-300 shadow-sm">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <Wifi className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>En línea</span>
                  </div>
                )}

                {/* Reloj local Santiago */}
                <div
                  className="pos-navbar-clock inline-flex h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-[#090C10] px-3.5 shadow-inner"
                  aria-label={`Hora local: ${chileClock.date}, ${chileClock.time}`}
                >
                  <Clock3 className="h-4 w-4 text-[#FACC15] shrink-0" aria-hidden="true" />
                  <span className="text-xs font-medium capitalize text-gray-300 hidden lg:inline">
                    {chileClock.date}
                  </span>
                  <span className="h-3.5 w-px bg-white/15 hidden lg:inline" aria-hidden="true" />
                  <time className="font-heading text-sm font-bold tracking-wider tabular-nums text-white" dateTime={new Date().toISOString()}>
                    {chileClock.time}
                  </time>
                </div>

                {/* Botón Cerrar sesión */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isSubmitting}
                  className="pos-navbar-logout inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#090C10] hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-200 text-gray-300 px-3.5 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-inner"
                  title="Cerrar sesión actual"
                >
                  <LogOut className="h-3.5 w-3.5 text-gray-400 transition-colors" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
              </div>
            </header>

            {activeWorkspace === 'catalog' ? (
              <PosCatalogManager offlineMode={offlineMode} onClose={() => setActiveWorkspace('sales')} />
            ) : activeWorkspace === 'reports' ? (
              <PosReports offlineMode={offlineMode} onClose={() => setActiveWorkspace('sales')} />
            ) : activeWorkspace === 'devices' ? (
              <div className="space-y-4">
                <header className="pos-report-workspace flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#FACC15]">Configuración del equipo</p>
                    <h2 className="mt-1 font-heading text-2xl font-bold text-white">Impresora y gaveta</h2>
                    <p className="mt-2 text-sm text-gray-400">Pruebas técnicas de conexión y salida. No registran ventas ni sustituyen la impresión integrada con la caja.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWorkspace('sales')}
                    className="pos-back-to-caja"
                    title="Volver a la vista de caja"
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    <span>VOLVER A CAJA</span>
                  </button>
                </header>
                <PosPrinterDiagnostics />
              </div>
            ) : <>

            {(!shift || !shift.is_open) && lastClosedShift && (
              <div className="rounded-2xl border border-emerald-500/20 bg-[#171717] p-5">
                <h2 className="font-semibold text-white">Resumen del turno cerrado</h2>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-gray-400">Efectivo esperado</dt>
                    <dd className="mt-1 font-semibold text-white">
                      {formatPrice(lastClosedShift.final_cash ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-gray-400">Efectivo contado</dt>
                    <dd className="mt-1 font-semibold text-white">
                      {formatPrice(lastClosedShift.counted_cash ?? 0)}
                    </dd>
                  </div>
                  {lastClosedShift.cash_difference !== null && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase text-gray-400">Diferencia (contado menos esperado)</dt>
                      <dd className="mt-1 font-semibold text-white">
                        {lastClosedShift.cash_difference === 0
                          ? 'Caja cuadrada'
                          : `${lastClosedShift.cash_difference > 0 ? 'Sobrante' : 'Faltante'}: ${formatPrice(Math.abs(lastClosedShift.cash_difference))}`}
                      </dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase text-gray-400">Ventas completadas por medio de pago</dt>
                    <dd className="text-sm">
                      <PaymentSummaryList items={lastClosedShift.sales_summary} />
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {offlineMode && !shift && <div role="status" className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 text-sm text-amber-100">No hay un turno guardado. Puedes abrir un turno localmente mientras no haya otro evento de caja pendiente.</div>}
            {pendingShiftEvents.length > 0 && (
              <div
                role="status"
                className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    Hay {pendingShiftEvents.length}{' '}
                    {pendingShiftEvents.length === 1
                      ? 'evento de turno pendiente'
                      : 'eventos de turno pendientes'}.
                  </p>
                  <p className="mt-1 text-xs text-amber-100/75">
                    {pendingShiftEvents.some((event) => event.event_type === 'OPEN')
                      ? 'La apertura se enviará al reconectar.'
                      : 'El cierre se enviará después de sincronizar todas las ventas de este turno.'}
                    {pendingShiftEvents.find((event) => event.sync_error)?.sync_error &&
                      ` ${pendingShiftEvents.find((event) => event.sync_error)?.sync_error}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!offlineMode && (
                    <button
                      type="button"
                      onClick={() => void handleRetryPendingShiftEvents()}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-amber-200/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                      Sincronizar ahora
                    </button>
                  )}
                  {pendingShiftEvents.find((e) => e.event_type === 'OPEN') && (
                    <button
                      type="button"
                      onClick={() => {
                        const openEvent = pendingShiftEvents.find((e) => e.event_type === 'OPEN');
                        if (openEvent) void handleDiscardPendingOpenEvent(openEvent);
                      }}
                      disabled={isSubmitting}
                      className="shrink-0 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-900/50 disabled:opacity-50 cursor-pointer"
                    >
                      Descartar apertura huérfana
                    </button>
                  )}
                </div>
              </div>
            )}
            {shift?.is_open ? (
            <div className="pos-shift-layout min-w-0 space-y-5">
              <PosSalesPanel shiftUuid={shift.uuid} nextOrderNumber={nextOrderNumber} offlineMode={offlineMode} shiftSyncBlocked={pendingShiftEvents.some(item => item.event_type === 'CLOSE')} onSale={handleSaleSaved} onPendingPaymentChange={setHasPendingPayment} onQueueChange={setHasQueuedOfflineSales} onBeforeCreateSale={comprobarTurnoAntesDeVenta} />
              <aside aria-labelledby="pos-active-shift-title" className="pos-shift-summary grid min-w-0 gap-5 rounded-2xl border border-emerald-500/20 bg-[#171717] p-5 shadow-xl sm:p-6 lg:grid-cols-2">
                <header className="flex items-start justify-between gap-4 lg:col-span-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      {offlineMode ? 'Turno local' : 'Turno abierto'}
                    </p>
                    <h2 id="pos-active-shift-title" className="mt-1 font-heading text-2xl font-bold text-white">
                      Caja activa
                    </h2>
                  </div>
                  <Clock3 className="h-6 w-6 text-emerald-300" />
                </header>
                <dl className="grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 lg:col-span-2">
                  <div>
                    <dt className="text-xs uppercase text-gray-400">Apertura</dt>
                    <dd className="mt-1 text-sm text-white">{formatDateTime(shift.opened_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-gray-400">Fondo inicial</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {formatPrice(shift.initial_cash)}
                    </dd>
                  </div>
                </dl>
                <div className="grid gap-4 border-t border-white/10 pt-4 text-sm lg:col-span-2">
                  <div>
                    <dt className="text-xs uppercase text-gray-400">Ventas completadas por medio de pago</dt>
                    <dd><PaymentSummaryList items={shift.sales_summary} /></dd>
                  </div>
                  {shift.notes && <div><dt className="text-xs uppercase text-gray-400">Nota de apertura</dt><dd className="mt-1 text-gray-200">{shift.notes}</dd></div>}
                </div>

                <label className="block space-y-2 text-sm text-gray-300" htmlFor="pos-counted-cash">
                  Efectivo contado físicamente (CLP)
                  <input
                    id="pos-counted-cash"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    required
                    value={closingCashCount}
                    onChange={(event) => setClosingCashCount(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-white outline-none transition focus:border-[#FACC15]"
                  />
                  <span className="block text-xs text-gray-500">
                    El sistema calculará el efectivo esperado y mostrará la diferencia.
                  </span>
                </label>
                <label className="block space-y-2 text-sm text-gray-300" htmlFor="pos-closing-notes">
                  Nota de cierre (opcional)
                  <textarea
                    id="pos-closing-notes"
                    rows={3}
                    value={closingNotes}
                    onChange={(event) => setClosingNotes(event.target.value)}
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-white outline-none transition focus:border-[#FACC15]"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCloseShift}
                  disabled={isSubmitting || hasPendingPayment || pendingShiftEvents.some(item => item.event_type === 'CLOSE')}
                  className="w-full rounded-xl border border-red-500/30 px-4 py-3 font-bold text-red-200 transition hover:bg-red-950/40 disabled:opacity-50 lg:col-span-2"
                >
                  Cerrar turno
                </button>
                {offlineMode && <p className="rounded-xl border border-white/10 bg-[#0D0D0D] p-3 text-xs text-gray-400 lg:col-span-2">El cierre quedará pendiente y se enviará después de sincronizar las ventas y anulaciones del turno.</p>}
                {hasPendingPayment && <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-500/[0.07] p-3 text-xs leading-relaxed text-amber-200 lg:col-span-2">Hay una cotización o pago pendiente; resuélvelo antes de cerrar el turno.</p>}
                {autoCloseDue ? <p role="status" className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3 text-xs text-amber-100 lg:col-span-2">Llegó la hora del cierre automático. {autoCloseWaitingForPayment ? 'Termina de resolver el pago pendiente para cerrar sin perder la venta.' : !offlineMode && hasQueuedOfflineSales ? 'Se cerrará al terminar de sincronizar las ventas pendientes.' : 'El turno se está cerrando y se sincronizará al recuperar la conexión.'}</p> : <p className="text-xs text-gray-500 lg:col-span-2">Cierre automático a las 00:30 (Chile).</p>}
              </aside>
              </div>
            ) : shift && offlineMode ? (
              <div role="status" className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 text-sm text-amber-100">Este turno ya quedó cerrado en el equipo. Espera a que se sincronice para abrir otro.</div>
            ) : anotherShiftOpen ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
                <h2 className="font-heading text-xl font-bold text-white">Hay otro turno abierto</h2>
                <p className="mt-2 text-sm text-amber-100/80">
                  La regla de caja permite un solo turno abierto. Solicita al responsable que lo cierre antes de abrir otro.
                </p>
              </div>
            ) : pendingShiftEvents.some((item) => item.event_type === 'OPEN') ? (
              <div
                role="status"
                className="space-y-4 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-6 text-sm text-amber-100"
              >
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    Apertura de turno pendiente
                  </h3>
                  <p className="mt-1 text-sm text-amber-100/80">
                    Hay un registro de apertura local que no ha podido confirmarse en el servidor
                    {pendingShiftEvents.find((e) => e.event_type === 'OPEN')?.sync_error
                      ? `: «${pendingShiftEvents.find((e) => e.event_type === 'OPEN')?.sync_error}»`
                      : '.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleRetryPendingShiftEvents()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-500/30 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                    Reintentar sincronización
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const openEvent = pendingShiftEvents.find((e) => e.event_type === 'OPEN');
                      if (openEvent) void handleDiscardPendingOpenEvent(openEvent);
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-200 transition hover:bg-red-900/60 disabled:opacity-50 cursor-pointer"
                  >
                    Descartar apertura huérfana
                  </button>
                </div>
              </div>
            ) : hasQueuedOfflineSales ? (
              <div role="status" className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 text-sm text-amber-100"><p className="font-semibold">Hay operaciones offline de un turno cerrado pendientes de conciliación.</p><p className="mt-1 text-amber-100/75">Los datos siguen guardados en este equipo. Sincronízalos antes de abrir otra caja.</p><button type="button" onClick={() => void handleReconnect()} disabled={isSubmitting} className="mt-3 rounded-lg border border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-100 disabled:opacity-50">Reintentar conciliación</button></div>
            ) : (
              <form
                onSubmit={handleOpenShift}
                className="space-y-5 rounded-2xl border border-white/10 bg-[#171717] p-6 shadow-xl"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#FACC15]">
                    {offlineMode ? 'Apertura offline' : 'Caja cerrada'}
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-bold text-white">
                    {offlineMode ? 'Abrir turno en este equipo' : 'Abrir turno'}
                  </h2>
                </div>

                <label className="block space-y-2 text-sm text-gray-300" htmlFor="pos-initial-cash">
                  Fondo inicial (CLP)
                  <input
                    id="pos-initial-cash"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    required
                    value={initialCash}
                    onChange={(event) => setInitialCash(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-white outline-none transition focus:border-[#FACC15]"
                  />
                </label>

                <label className="block space-y-2 text-sm text-gray-300" htmlFor="pos-opening-notes">
                  Nota de apertura (opcional)
                  <textarea
                    id="pos-opening-notes"
                    rows={3}
                    value={openingNotes}
                    onChange={(event) => setOpeningNotes(event.target.value)}
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-white outline-none transition focus:border-[#FACC15]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || pendingShiftEvents.some(item => item.event_type === 'OPEN')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                >
                  <CircleDollarSign className="h-5 w-5" />
                  {isSubmitting ? 'Abriendo…' : offlineMode ? 'Abrir turno offline' : 'Abrir turno'}
                </button>
              </form>
            )}
            </>}
          </section>
        )}
      </div>
    </main>
  );
};
