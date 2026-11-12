import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, Clock3, RefreshCw, TrendingUp } from 'lucide-react';
import { solicitarApi } from '../services/apiClient';
import { Alert } from './Alert';

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
  time_series: { key: string; total_amount: number; order_count: number }[];
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

export function PosReports({ offlineMode, onClose }: { offlineMode: boolean; onClose?: () => void }) {
  const [period, setPeriod] = useState<Period>('day');
  const [day, setDay] = useState(currentChileDay);
  const [month, setMonth] = useState(() => currentChileDay().slice(0, 7));
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [chartMetric, setChartMetric] = useState<'amount' | 'orders'>('amount');

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

  const chartPoints = report
    ? period === 'day'
      ? Array.from({ length: 24 }, (_, hour) => {
        const key = String(hour).padStart(2, '0');
        return { key, label: hour % 4 === 0 ? `${key}:00` : '', value: report.time_series.find(item => item.key === key) };
      })
      : (() => {
        const [year, monthNumber] = report.selected.split('-').map(Number);
        const daysInMonth = new Date(year, monthNumber, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, index) => {
          const key = String(index + 1).padStart(2, '0');
          const showLabel = index === 0 || (index + 1) % 5 === 0 || index + 1 === daysInMonth;
          return { key, label: showLabel ? key : '', value: report.time_series.find(item => item.key === key) };
        });
      })()
    : [];
  const chartValue = (point: typeof chartPoints[number]) => chartMetric === 'amount' ? point.value?.total_amount ?? 0 : point.value?.order_count ?? 0;
  const chartMaximum = Math.max(1, ...chartPoints.map(chartValue));
  const peakPoint = chartPoints.reduce<(typeof chartPoints)[number] | null>((peak, point) =>
    chartValue(point) > (peak ? chartValue(peak) : 0) ? point : peak, null);
  const monthlyPeakHours = (report?.rush_hours ?? []).filter(item => item.order_count > 0)
    .toSorted((left, right) => right.total_amount - left.total_amount || right.order_count - left.order_count).slice(0, 5);
  const monthlyPeakMaximum = Math.max(1, ...monthlyPeakHours.map(item => item.total_amount));
  const topProducts = (report?.top_products ?? []).slice(0, 3);
  const topProductMaximum = Math.max(1, ...(topProducts.map(item => item.quantity) ?? []));

  return <section className="pos-report-workspace" aria-labelledby="pos-report-title">
    <header className="pos-report-header flex flex-wrap items-center justify-between gap-4">
      <div><p className="pos-report-eyebrow">Control de gestión</p><h2 id="pos-report-title">Reportes de ventas</h2><p>Consulta las ventas y cierres registrados en la zona horaria de Chile.</p></div>
      <div className="flex items-center gap-3">
        {onClose && (
          <button
            type="button"
            className="pos-back-to-caja"
            onClick={onClose}
            title="Volver a la vista de caja"
          >
            <ArrowLeft aria-hidden="true" />
            <span>VOLVER A CAJA</span>
          </button>
        )}
        <button type="button" className="pos-report-refresh" onClick={() => setReloadKey(value => value + 1)} disabled={loading || offlineMode}><RefreshCw aria-hidden="true" />Actualizar</button>
      </div>
    </header>
    <div className="pos-report-toolbar">
      <div className="pos-report-control"><span className="pos-report-control-label">Consultar por</span><div className="pos-report-period-switch" role="group" aria-label="Período del reporte">
        <button type="button" aria-pressed={period === 'day'} className={period === 'day' ? 'is-active' : ''} onClick={() => setPeriod('day')}><CalendarDays aria-hidden="true" />Día</button>
        <button type="button" aria-pressed={period === 'month'} className={period === 'month' ? 'is-active' : ''} onClick={() => setPeriod('month')}><BarChart3 aria-hidden="true" />Mes</button>
      </div>
      </div>
      <label className="pos-report-date">{period === 'day' ? 'Día de ventas' : 'Mes de ventas'}<input type={period === 'day' ? 'date' : 'month'} value={period === 'day' ? day : month} onChange={event => { if (event.target.value) period === 'day' ? setDay(event.target.value) : setMonth(event.target.value); }} /></label>
      {report && <span className="pos-report-period-label">Período: {report.selected} · America/Santiago</span>}
    </div>

    {offlineMode && <Alert severity="warning" className="my-3">Los reportes necesitan conexión al servidor. Las ventas locales se incluirán automáticamente al sincronizar.</Alert>}
    {!offlineMode && loading && <div className="pos-report-state" role="status">Cargando resumen de ventas…</div>}
    {!offlineMode && error && (
      <Alert
        severity="error"
        className="my-3"
        action={<button type="button" className="underline font-bold text-white hover:text-white/80" onClick={() => setReloadKey(value => value + 1)}>Reintentar</button>}
      >
        {error}
      </Alert>
    )}
    {!offlineMode && !loading && report && <>
      <div className="pos-report-kpis">
        <article className="pos-report-kpi is-primary"><span>Ventas completadas</span><strong>{money(report.sales.total_amount)}</strong><small>{report.sales.order_count} {report.sales.order_count === 1 ? 'venta' : 'ventas'}</small></article>
        <article className="pos-report-kpi"><span>Promedio por venta</span><strong>{money(report.sales.average_ticket)}</strong><small>Ticket promedio del período</small></article>
        <article className="pos-report-kpi"><span>Anulaciones</span><strong>{report.cancellations.order_count}</strong><small>{money(report.cancellations.total_amount)} en ventas anuladas</small></article>
      </div>
      <div className="pos-report-grid">
        <article className="pos-report-card pos-report-timeline"><div className="pos-report-card-title"><div><span>{period === 'day' ? 'Actividad del día' : 'Tendencia mensual'}</span><h3>{period === 'day' ? 'Ventas por hora' : 'Ventas por día'}</h3></div><Clock3 aria-hidden="true" /></div>
          <div className="pos-report-chart-toolbar"><span>{chartMetric === 'amount' ? 'Recaudación en CLP' : 'Cantidad de ventas'}{peakPoint && <strong> · Mayor {period === 'day' ? peakPoint.key + ':00 h' : 'día ' + Number(peakPoint.key)} ({chartMetric === 'amount' ? money(chartValue(peakPoint)) : chartValue(peakPoint) + ' ventas'})</strong>}</span><div role="group" aria-label="Medida del gráfico"><button type="button" aria-pressed={chartMetric === 'amount'} className={chartMetric === 'amount' ? 'is-active' : ''} onClick={() => setChartMetric('amount')}>Monto</button><button type="button" aria-pressed={chartMetric === 'orders'} className={chartMetric === 'orders' ? 'is-active' : ''} onClick={() => setChartMetric('orders')}>Ventas</button></div></div>
          {report.sales.order_count ? <div className="pos-report-chart-detail" role="img" aria-label={`${period === 'day' ? 'Ventas por hora' : 'Ventas por día'} para ${report.selected}, en hora de Chile`}>
            <div className="pos-report-chart-axis" aria-hidden="true"><span>{chartMetric === 'amount' ? money(chartMaximum) : chartMaximum}</span><span>{chartMetric === 'amount' ? money(Math.ceil(chartMaximum / 2)) : Math.ceil(chartMaximum / 2)}</span><span>0</span></div>
            <div className="pos-report-chart-plot" style={{ gridTemplateColumns: `repeat(${chartPoints.length}, minmax(0, 1fr))` }}><div className="pos-report-chart-gridlines" aria-hidden="true"><i /><i /><i /></div>{chartPoints.map(point => { const value = chartValue(point); const amount = point.value?.total_amount ?? 0; const orders = point.value?.order_count ?? 0; return <div className={`pos-report-chart-column ${value ? 'has-value' : ''} ${peakPoint?.key === point.key && value ? 'is-peak' : ''}`} key={point.key} title={`${period === 'day' ? `${point.key}:00 h` : `Día ${Number(point.key)}`} · ${money(amount)} · ${orders} ${orders === 1 ? 'venta' : 'ventas'}`}><span style={{ height: `${value ? Math.max(2, value / chartMaximum * 100) : 0}%` }} /><small>{point.label}</small></div>; })}</div>
          </div> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
          <div className="pos-report-chart-legend"><span><i />{chartMetric === 'amount' ? 'Recaudación' : 'Cantidad de ventas'}</span><span>Datos según la hora original de la venta · Chile</span></div>
        </article>
        <article className="pos-report-card pos-report-products"><div className="pos-report-card-title"><div><span>Preferencias de clientes</span><h3>Productos más vendidos</h3></div><BarChart3 aria-hidden="true" /></div>
          {topProducts.length ? <ol>{topProducts.map((item, index) => <li key={`${item.product_name}-${index}`}><i>{index + 1}</i><div className="pos-report-product-entry"><strong>{item.product_name}</strong><div className="pos-report-track"><span style={{ width: `${item.quantity / topProductMaximum * 100}%` }} /></div></div><b>{item.quantity} <small>un.</small></b></li>)}</ol> : <p className="pos-report-empty">No hay productos vendidos en este período.</p>}
        </article>
        <article className="pos-report-card pos-report-payments"><div className="pos-report-card-title"><div><span>Recaudación</span><h3>Medios de pago</h3></div><TrendingUp aria-hidden="true" /></div>
          {report.payments.length ? <ul>{report.payments.map(item => { const share = report.sales.total_amount ? Math.round(item.total_amount / report.sales.total_amount * 100) : 0; return <li key={item.payment_method}><span><strong>{item.label}</strong><small>{item.order_count} {item.order_count === 1 ? 'venta' : 'ventas'} · {share}%</small><span className="pos-report-track"><i style={{ width: `${share}%` }} /></span></span><b>{money(item.total_amount)}</b></li>; })}</ul> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
        </article>
        {period === 'month' && <article className="pos-report-card pos-report-hours"><div className="pos-report-card-title"><div><span>Patrón de demanda</span><h3>Horas punta del mes</h3></div><Clock3 aria-hidden="true" /></div>
          {monthlyPeakHours.length ? <ol>{monthlyPeakHours.map(item => <li key={item.hour}><i>{String(item.hour).padStart(2, '0')} h</i><div className="pos-report-product-entry"><strong>{money(item.total_amount)}</strong><div className="pos-report-track"><span style={{ width: `${item.total_amount / monthlyPeakMaximum * 100}%` }} /></div></div><b>{item.order_count} <small>{item.order_count === 1 ? 'venta' : 'ventas'}</small></b></li>)}</ol> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
        </article>}
        <article className="pos-report-card pos-report-shifts"><div className="pos-report-card-title"><div><span>Arqueo</span><h3>Turnos del período</h3></div><CalendarDays aria-hidden="true" /></div>
          {report.shifts.length ? <div className="pos-report-shift-list">{report.shifts.map(shift => <details key={shift.uuid}><summary><span>{localDateTime(shift.opened_at)} <small>{shift.closed_automatically ? 'Cierre automático' : shift.closed_at ? 'Cerrado' : 'Abierto'}</small></span><b>{shift.final_cash === null ? 'En curso' : money(shift.final_cash)}</b></summary><dl><div><dt>Fondo inicial</dt><dd>{money(shift.initial_cash)}</dd></div><div><dt>Efectivo esperado</dt><dd>{shift.final_cash === null ? 'Pendiente' : money(shift.final_cash)}</dd></div><div><dt>Efectivo contado</dt><dd>{shift.counted_cash === null ? 'Sin conteo' : money(shift.counted_cash)}</dd></div><div><dt>Diferencia</dt><dd>{shift.cash_difference === null ? '—' : money(shift.cash_difference)}</dd></div><div className="is-full"><dt>Cierre</dt><dd>{localDateTime(shift.closed_at)}</dd></div></dl></details>)}</div> : <p className="pos-report-empty">No se abrieron turnos en este período.</p>}
        </article>
      </div>
    </>}
  </section>;
}
