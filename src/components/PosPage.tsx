import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleDollarSign, Clock3, LogOut } from 'lucide-react';
import { ApiError, cargarTokenCsrf, solicitarApi } from '../services/apiClient';
import { PosSalesPanel } from './PosSalesPanel';
import { cargarAccesoOfflinePos, cargarCobroPendientePos, cargarTurnoDesdeCachePos, eliminarAnulacionOfflinePos, eliminarEventoTurnoOfflinePos, eliminarVentaOfflineDeColaPos, guardarAccesoOfflinePos, guardarEventoYTurnoEnCacheOfflinePos, guardarTurnoEnCachePos, listarAnulacionesOfflinePos, listarEventosTurnoOfflinePos, listarVentasOfflineEnColaPos, marcarErrorAnulacionOfflinePos, marcarErrorEventoTurnoOfflinePos, marcarErrorVentaOfflineEnColaPos, type PosOfflineShiftEvent } from '../services/posLocalStore';

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
    const closedShift = await solicitarApi<CashShift>(`/api/shifts/${shiftUuid}/`);
    setLastClosedShift(closedShift);
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
      if (!await syncPendingOpenEvents(session.user.id)) throw new Error('La apertura del turno sigue pendiente; reintenta la sincronización.');
      const cachedShift = await cargarTurnoDesdeCachePos<CashShift>(session.user.id);
      const queuedSales = cachedShift?.shift ? await listarVentasOfflineEnColaPos(cachedShift.shift.uuid) : [];
      const queuedCancellations = cachedShift?.shift ? await listarAnulacionesOfflinePos(cachedShift.shift.uuid) : [];
      if (queuedSales.length === 0 && queuedCancellations.length === 0) await syncPendingCloseEvents(session.user.id);
      const currentShift = await solicitarApi<ShiftStateResponse>('/api/shifts/current/');
      if (cachedShift?.shift && currentShift.shift?.uuid !== cachedShift.shift.uuid) {
        setShift(null);
        setHasQueuedOfflineSales(queuedSales.length > 0 || queuedCancellations.length > 0);
        await syncOfflineOperationsForClosedShift(session.user.id, cachedShift.shift.uuid);
        await guardarTurnoEnCachePos(session.user.id, { ...currentShift, shift: null });
      }
      setUser(session.user);
      setShift(currentShift.shift);
      setAnotherShiftOpen(currentShift.another_shift_open);
      setNextOrderNumber(currentShift.next_order_number);
      setOfflineMode(false);
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
        await syncPendingOpenEvents(response.user.id);
        const cachedShift = await cargarTurnoDesdeCachePos<CashShift>(response.user.id);
        const queuedSales = cachedShift?.shift ? await listarVentasOfflineEnColaPos(cachedShift.shift.uuid) : [];
        const queuedCancellations = cachedShift?.shift ? await listarAnulacionesOfflinePos(cachedShift.shift.uuid) : [];
        if (queuedSales.length === 0 && queuedCancellations.length === 0) await syncPendingCloseEvents(response.user.id);
        const currentShift = await solicitarApi<ShiftStateResponse>(
          '/api/shifts/current/',
        );
        if (cachedShift?.shift && currentShift.shift?.uuid !== cachedShift.shift.uuid) {
          serverConfirmedCachedShiftClosed = true;
          setShift(null);
          setHasQueuedOfflineSales(queuedSales.length > 0 || queuedCancellations.length > 0);
          const closedShift = await syncOfflineOperationsForClosedShift(response.user.id, cachedShift.shift.uuid);
          setLastClosedShift(closedShift);
          await guardarTurnoEnCachePos(response.user.id, { ...currentShift, shift: null });
        }
        if (!cancelled) {
          setShift(currentShift.shift);
          setAnotherShiftOpen(currentShift.another_shift_open);
          setNextOrderNumber(currentShift.next_order_number);
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
      await syncPendingOpenEvents(response.user.id);
      const cachedShift = await cargarTurnoDesdeCachePos<CashShift>(response.user.id);
      const queuedSales = cachedShift?.shift ? await listarVentasOfflineEnColaPos(cachedShift.shift.uuid) : [];
      const queuedCancellations = cachedShift?.shift ? await listarAnulacionesOfflinePos(cachedShift.shift.uuid) : [];
      if (queuedSales.length === 0 && queuedCancellations.length === 0) await syncPendingCloseEvents(response.user.id);
      await refreshShift();
      const shiftState = await solicitarApi<ShiftStateResponse>('/api/shifts/current/');
      if (cachedShift?.shift && shiftState.shift?.uuid !== cachedShift.shift.uuid) {
        serverConfirmedCachedShiftClosed = true;
        setShift(null);
        setHasQueuedOfflineSales(queuedSales.length > 0 || queuedCancellations.length > 0);
        const closedShift = await syncOfflineOperationsForClosedShift(response.user.id, cachedShift.shift.uuid);
        setLastClosedShift(closedShift);
        await guardarTurnoEnCachePos(response.user.id, { ...shiftState, shift: null });
      }
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
    if (!shift?.is_open || !window.confirm('¿Confirmas el cierre de este turno?')) return;
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

  const handleRetryPendingShiftClose = async () => {
    if (!user || offlineMode || isSubmitting || hasQueuedOfflineSales) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const synced = await syncPendingCloseEvents(user.id);
      if (synced) await refreshShift();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo reintentar el cierre del turno.');
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
    <main className="min-h-screen bg-[#0D0D0D] px-4 py-5 text-gray-100 sm:px-6 sm:py-8 2xl:px-10">
      <div className="mx-auto w-full max-w-[1600px]">
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

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {errorMessage}
          </div>
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
          <section className="space-y-5">
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#171717] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3">
                <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Sesión activa</p>
                <p className="mt-1 font-semibold text-white">{user.username}</p>
                </div>
                {offlineMode && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">Modo offline · cambios guardados en este equipo</span>}
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-3 py-2 shadow-inner shadow-black/20" aria-label={`Hora local: ${chileClock.date}, ${chileClock.time}`}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#FACC15]/20 bg-[#FACC15]/[0.08] text-[#FACC15]" aria-hidden="true">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium capitalize tracking-wide text-gray-400">{chileClock.date}</span>
                  <span className="h-5 w-px bg-white/10" aria-hidden="true" />
                  <time className="font-heading text-lg tracking-[0.08em] tabular-nums text-white" dateTime={new Date().toISOString()}>{chileClock.time}</time>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleReconnect()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-950/30 disabled:opacity-50"
                hidden={!offlineMode}
              >
                {isSubmitting ? 'Conectando…' : 'Reconectar y sincronizar'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>

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
            {pendingShiftEvents.length > 0 && <div role="status" className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Hay {pendingShiftEvents.length} {pendingShiftEvents.length === 1 ? 'evento de turno pendiente' : 'eventos de turno pendientes'}.</p><p className="mt-1 text-xs text-amber-100/75">{pendingShiftEvents.some(event => event.event_type === 'OPEN') ? 'La apertura se enviará al reconectar.' : 'El cierre se enviará después de sincronizar todas las ventas de este turno.'}{pendingShiftEvents.find(event => event.sync_error)?.sync_error && ` ${pendingShiftEvents.find(event => event.sync_error)?.sync_error}`}</p></div>{!offlineMode && pendingShiftEvents.some(event => event.event_type === 'CLOSE') && <button type="button" onClick={() => void handleRetryPendingShiftClose()} disabled={isSubmitting || hasQueuedOfflineSales} className="shrink-0 rounded-lg border border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50">{hasQueuedOfflineSales ? 'Sincronizando ventas primero' : 'Reintentar cierre'}</button>}</div>}
            {shift?.is_open ? (
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="min-w-0">
                  <PosSalesPanel shiftUuid={shift.uuid} nextOrderNumber={nextOrderNumber} offlineMode={offlineMode} shiftSyncBlocked={pendingShiftEvents.some(item => item.event_type === 'CLOSE')} onSale={handleSaleSaved} onPendingPaymentChange={setHasPendingPayment} onQueueChange={setHasQueuedOfflineSales} onBeforeCreateSale={comprobarTurnoAntesDeVenta} />
                </div>
                <aside className="min-w-0 space-y-5 2xl:sticky 2xl:top-5">
              <div className="rounded-2xl border border-emerald-500/20 bg-[#171717] p-5 shadow-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      {offlineMode ? 'Turno local' : 'Turno abierto'}
                    </p>
                    <h2 className="mt-1 font-heading text-2xl font-bold text-white">
                      Caja activa
                    </h2>
                  </div>
                  <Clock3 className="h-6 w-6 text-emerald-300" />
                </div>
                <dl className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
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
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase text-gray-400">Ventas completadas por medio de pago</dt>
                    <dd className="text-sm">
                      <PaymentSummaryList items={shift.sales_summary} />
                    </dd>
                  </div>
                  {shift.notes && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase text-gray-400">Nota de apertura</dt>
                      <dd className="mt-1 text-sm text-gray-200">{shift.notes}</dd>
                    </div>
                  )}
                </dl>

                <label className="mt-5 block space-y-2 text-sm text-gray-300" htmlFor="pos-counted-cash">
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
                <label className="mt-5 block space-y-2 text-sm text-gray-300" htmlFor="pos-closing-notes">
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
                  className="mt-4 w-full rounded-xl border border-red-500/30 px-4 py-3 font-bold text-red-200 transition hover:bg-red-950/40 disabled:opacity-50"
                >
                  Cerrar turno
                </button>
                {offlineMode && <p className="mt-3 rounded-xl border border-white/10 bg-[#0D0D0D] p-3 text-xs text-gray-400">El cierre quedará pendiente y se enviará después de sincronizar las ventas y anulaciones de este turno.</p>}
                {hasPendingPayment && <p role="alert" className="mt-3 text-xs text-amber-200">Hay una cotización o pago pendiente; resuélvelo antes de cerrar.</p>}
                {autoCloseDue ? <p role="status" className="mt-3 rounded-xl border border-amber-500/25 bg-amber-950/20 p-3 text-xs text-amber-100">Llegó la hora del cierre automático. {autoCloseWaitingForPayment ? 'Termina de resolver el pago pendiente para cerrar sin perder la venta.' : !offlineMode && hasQueuedOfflineSales ? 'Se cerrará al terminar de sincronizar las ventas pendientes.' : 'El turno se está cerrando y se sincronizará al recuperar la conexión.'}</p> : <p className="mt-3 text-xs text-gray-500">El turno se cierra automáticamente a las 00:30, hora de Chile. El arqueo físico queda vacío.</p>}
              </div>
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
            ) : pendingShiftEvents.some(item => item.event_type === 'OPEN') ? (
              <div role="status" className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 text-sm text-amber-100">La apertura del turno sigue pendiente. Reintenta la sincronización antes de iniciar otra caja.</div>
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
          </section>
        )}
      </div>
    </main>
  );
};
