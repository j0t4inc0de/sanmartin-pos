import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleDollarSign, Clock3, LogOut } from 'lucide-react';
import { ApiError, cargarTokenCsrf, solicitarApi } from '../services/apiClient';
import { PosSalesPanel } from './PosSalesPanel';

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

const formatChileClock = (value: Date) =>
  new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(value);

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
  const [errorMessage, setErrorMessage] = useState('');
  const [chileClock, setChileClock] = useState(() => formatChileClock(new Date()));

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
  };

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        await cargarTokenCsrf();
        const response = await solicitarApi<{ user: PosUser }>(
          '/api/auth/session/',
        );
        if (cancelled) return;
        setUser(response.user);
        const currentShift = await solicitarApi<ShiftStateResponse>(
          '/api/shifts/current/',
        );
        if (!cancelled) {
          setShift(currentShift.shift);
          setAnotherShiftOpen(currentShift.another_shift_open);
          setNextOrderNumber(currentShift.next_order_number);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setUser(null);
          setShift(null);
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se pudo conectar con el servidor local.',
          );
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
      await refreshShift();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await solicitarApi<void>('/api/auth/logout/', { method: 'POST' });
      setUser(null);
      setShift(null);
      setAnotherShiftOpen(false);
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
    if (!shift || !window.confirm('¿Confirmas el cierre de este turno?')) return;
    const countedCash = Number(closingCashCount);
    if (!Number.isSafeInteger(countedCash) || countedCash < 0) {
      setErrorMessage('Ingresa el efectivo contado como un monto entero no negativo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
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
                Usa tu cuenta autorizada para operar el POS.
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
                required
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
                <div className="inline-flex items-center gap-2 rounded-xl border border-[#FACC15]/20 bg-[#FACC15]/[0.06] px-3 py-2" aria-label={`Hora de Chile: ${chileClock}`}>
                  <span className="h-2 w-2 rounded-full bg-[#FACC15] shadow-[0_0_10px_rgba(250,204,21,0.7)]" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FACC15]">Chile</span>
                  <time className="font-mono text-sm tabular-nums text-white" dateTime={new Date().toISOString()}>{chileClock}</time>
                </div>
              </div>
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

            {!shift && lastClosedShift && (
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

            {shift ? (
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="min-w-0">
                  <PosSalesPanel shiftUuid={shift.uuid} nextOrderNumber={nextOrderNumber} onSale={refreshShift} />
                </div>
                <aside className="min-w-0 space-y-5 2xl:sticky 2xl:top-5">
              <div className="rounded-2xl border border-emerald-500/20 bg-[#171717] p-5 shadow-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Turno abierto
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
                  disabled={isSubmitting}
                  className="mt-4 w-full rounded-xl border border-red-500/30 px-4 py-3 font-bold text-red-200 transition hover:bg-red-950/40 disabled:opacity-50"
                >
                  Cerrar turno
                </button>
                <p className="mt-3 text-xs text-gray-500">
                  El cierre automático a las 00:30 se habilitará al completar el almacenamiento y la sincronización offline.
                </p>
              </div>
                </aside>
              </div>
            ) : anotherShiftOpen ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
                <h2 className="font-heading text-xl font-bold text-white">Hay otro turno abierto</h2>
                <p className="mt-2 text-sm text-amber-100/80">
                  La regla de caja permite un solo turno abierto. Solicita al responsable que lo cierre antes de abrir otro.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleOpenShift}
                className="space-y-5 rounded-2xl border border-white/10 bg-[#171717] p-6 shadow-xl"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#FACC15]">
                    Caja cerrada
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-bold text-white">
                    Abrir turno
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
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                >
                  <CircleDollarSign className="h-5 w-5" />
                  {isSubmitting ? 'Abriendo…' : 'Abrir turno'}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
};
