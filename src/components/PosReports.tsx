import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, Clock3, RefreshCw, TrendingUp } from 'lucide-react';
import { solicitarApi } from '../services/apiClient';

type Period = 'day' | 'month';
interface ReportData {
  period: Period;
  selected: string;
  timezone: string;
  sales: { total_amount: number; order_count: number; average_ticket: number };
  payments: { payment_method: string; label: string; total_amount: number; order_count: number }[];
  cancellations: { order_count: number; total_amount: number };
  top_products: { product_name: string; quantity: number }[];
  rush_hours: { hour: number; order_count: number; total_amount: number }[];
  shifts: { uuid: string; opened_at: string; closed_at: string | null; initial_cash: number; final_cash: number | null; counted_cash: number | null; cash_difference: number | null; closed_automatically: boolean }[];
}

const chileDateParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
}).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
const currentChileDay = () => {
  const parts = chileDateParts(new Date());
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const money = (amount: number) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(amount);
const localDateTime = (value: string | null) => value ? new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : 'Turno abierto';

export function PosReports({ offlineMode }: { offlineMode: boolean }) {
  const [period, setPeriod] = useState<Period>('day');
  const [day, setDay] = useState(currentChileDay);
  const [month, setMonth] = useState(() => currentChileDay().slice(0, 7));
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (offlineMode) {
      setReport(null);
      setError('');
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      const query = period === 'day'
        ? `period=day&date=${encodeURIComponent(day)}`
        : `period=month&month=${encodeURIComponent(month)}`;
      try {
        const data = await solicitarApi<ReportData>(`/api/reports/sales/?${query}`);
        if (!cancelled) setReport(data);
      } catch (cause) {
        if (!cancelled) {
          setReport(null);
          setError(cause instanceof Error ? cause.message : 'No se pudo cargar el reporte. Inténtalo nuevamente.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [offlineMode, period, day, month, reloadKey]);

  const maxHourAmount = Math.max(1, ...(report?.rush_hours.map(item => item.total_amount) ?? []));

  return <section className="pos-report-workspace" aria-labelledby="pos-report-title">
    <header className="pos-report-header">
      <div><p className="pos-report-eyebrow">Control de gestión</p><h2 id="pos-report-title">Reportes de ventas</h2><p>Consulta las ventas y cierres registrados en la zona horaria de Chile.</p></div>
      <button type="button" className="pos-report-refresh" onClick={() => setReloadKey(value => value + 1)} disabled={loading || offlineMode}><RefreshCw aria-hidden="true" />Actualizar</button>
    </header>
    <div className="pos-report-toolbar">
      <div className="pos-report-period-switch" role="group" aria-label="Período del reporte">
        <button type="button" aria-pressed={period === 'day'} className={period === 'day' ? 'is-active' : ''} onClick={() => setPeriod('day')}><CalendarDays aria-hidden="true" />Día</button>
        <button type="button" aria-pressed={period === 'month'} className={period === 'month' ? 'is-active' : ''} onClick={() => setPeriod('month')}><BarChart3 aria-hidden="true" />Mes</button>
      </div>
      <label className="pos-report-date">{period === 'day' ? 'Día de ventas' : 'Mes de ventas'}<input type={period === 'day' ? 'date' : 'month'} value={period === 'day' ? day : month} onChange={event => { if (event.target.value) period === 'day' ? setDay(event.target.value) : setMonth(event.target.value); }} /></label>
      {report && <span className="pos-report-period-label">Período: {report.selected} · America/Santiago</span>}
    </div>

    {offlineMode && <div className="pos-report-state is-warning" role="status">Los reportes necesitan conexión al servidor. Las ventas locales se incluirán automáticamente al sincronizar.</div>}
    {!offlineMode && loading && <div className="pos-report-state" role="status">Cargando resumen de ventas…</div>}
    {!offlineMode && error && <div className="pos-report-state is-error" role="alert"><span>{error}</span><button type="button" onClick={() => setReloadKey(value => value + 1)}>Reintentar</button></div>}
    {!offlineMode && !loading && report && <>
      <div className="pos-report-kpis">
        <article className="pos-report-kpi is-primary"><span>Ventas completadas</span><strong>{money(report.sales.total_amount)}</strong><small>{report.sales.order_count} {report.sales.order_count === 1 ? 'venta' : 'ventas'}</small></article>
        <article className="pos-report-kpi"><span>Promedio por venta</span><strong>{money(report.sales.average_ticket)}</strong><small>Ticket promedio del período</small></article>
        <article className="pos-report-kpi"><span>Anulaciones</span><strong>{report.cancellations.order_count}</strong><small>{money(report.cancellations.total_amount)} en ventas anuladas</small></article>
      </div>
      <div className="pos-report-grid">
        <article className="pos-report-card pos-report-payments"><div className="pos-report-card-title"><div><span>Recaudación</span><h3>Medios de pago</h3></div><TrendingUp aria-hidden="true" /></div>
          {report.payments.length ? <ul>{report.payments.map(item => <li key={item.payment_method}><span><strong>{item.label}</strong><small>{item.order_count} {item.order_count === 1 ? 'venta' : 'ventas'}</small></span><b>{money(item.total_amount)}</b></li>)}</ul> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
        </article>
        <article className="pos-report-card pos-report-products"><div className="pos-report-card-title"><div><span>Preferencias de clientes</span><h3>Productos más vendidos</h3></div><BarChart3 aria-hidden="true" /></div>
          {report.top_products.length ? <ol>{report.top_products.map((item, index) => <li key={item.product_name}><i>{index + 1}</i><strong>{item.product_name}</strong><span>{item.quantity} un.</span></li>)}</ol> : <p className="pos-report-empty">No hay productos vendidos en este período.</p>}
        </article>
        <article className="pos-report-card pos-report-hours"><div className="pos-report-card-title"><div><span>Actividad por horario</span><h3>Horas de venta</h3></div><Clock3 aria-hidden="true" /></div>
          {report.rush_hours.length ? <div className="pos-report-chart" role="img" aria-label="Ventas agrupadas por hora local de Chile">{Array.from({ length: 24 }, (_, hour) => {
            const value = report.rush_hours.find(item => item.hour === hour);
            const height = value ? Math.max(4, value.total_amount / maxHourAmount * 100) : 0;
            return <div className={`pos-report-bar ${value ? 'has-value' : ''}`} key={hour} title={`${String(hour).padStart(2, '0')}:00 · ${value ? `${money(value.total_amount)} · ${value.order_count} ventas` : 'Sin ventas'}`}><span style={{ height: `${height}%` }} /><small>{hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}</small></div>;
          })}</div> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
        </article>
        <article className="pos-report-card pos-report-shifts"><div className="pos-report-card-title"><div><span>Arqueo</span><h3>Turnos del período</h3></div><CalendarDays aria-hidden="true" /></div>
          {report.shifts.length ? <div className="pos-report-shift-list">{report.shifts.map(shift => <details key={shift.uuid}><summary><span>{localDateTime(shift.opened_at)} <small>{shift.closed_automatically ? 'Cierre automático' : shift.closed_at ? 'Cerrado' : 'Abierto'}</small></span><b>{shift.final_cash === null ? 'En curso' : money(shift.final_cash)}</b></summary><dl><div><dt>Fondo inicial</dt><dd>{money(shift.initial_cash)}</dd></div><div><dt>Efectivo esperado</dt><dd>{shift.final_cash === null ? 'Pendiente' : money(shift.final_cash)}</dd></div><div><dt>Efectivo contado</dt><dd>{shift.counted_cash === null ? 'Sin conteo' : money(shift.counted_cash)}</dd></div><div><dt>Diferencia</dt><dd>{shift.cash_difference === null ? '—' : money(shift.cash_difference)}</dd></div><div className="is-full"><dt>Cierre</dt><dd>{localDateTime(shift.closed_at)}</dd></div></dl></details>)}</div> : <p className="pos-report-empty">No se abrieron turnos en este período.</p>}
        </article>
      </div>
    </>}
  </section>;
}
