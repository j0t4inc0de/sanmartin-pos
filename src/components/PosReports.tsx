import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, ChevronDown, Clock3, RefreshCw, TrendingUp } from 'lucide-react';
import { solicitarApi } from '../services/apiClient';
import { Alert } from './Alert';
import { PosSnackbarAlert } from './PosSnackbarAlert';

type Period = 'day' | 'week' | 'month';
interface ReportData {
  period: Period;
  selected: string;
  timezone: string;
  sales?: { total_amount: number; order_count: number; average_ticket: number };
  payments?: { payment_method: string; label: string; total_amount: number; order_count: number }[];
  cancellations?: { order_count: number; total_amount: number };
  top_products?: { product_id?: number; product_name: string; quantity: number }[];
  least_products?: { product_id?: number; product_name: string; quantity: number }[];
  unsold_products?: { count: number; product_names: string[] };
  rush_hours?: { hour: number; order_count: number; total_amount: number }[];
  time_series?: { key: string; total_amount: number; order_count: number }[];
}

const chileDateParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
}).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
const currentChileDay = () => {
  const parts = chileDateParts(new Date());
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const businessWeekStart = (day: string) => {
  const date = new Date(`${day}T00:00:00Z`);
  const daysSinceTuesday = (date.getUTCDay() - 2 + 7) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceTuesday);
  return date.toISOString().slice(0, 10);
};
const addIsoDays = (day: string, amount: number) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};
const money = (amount: number) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(amount);
export function PosReports({ offlineMode, onClose }: { offlineMode: boolean; onClose?: () => void }) {
  const [period, setPeriod] = useState<Period>('day');
  const [day, setDay] = useState(currentChileDay);
  const [weekStart, setWeekStart] = useState(() => businessWeekStart(currentChileDay()));
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
      const query = period === 'month'
        ? `period=month&month=${encodeURIComponent(month)}`
        : `period=${period}&date=${encodeURIComponent(period === 'day' ? day : weekStart)}`;
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
  }, [offlineMode, period, day, weekStart, month, reloadKey]);

  const timeSeries = report?.time_series ?? [];
  const chartPoints = report
    ? period === 'day'
      ? Array.from({ length: 24 }, (_, hour) => {
        const key = String(hour).padStart(2, '0');
        return { key, label: hour % 4 === 0 ? `${key}:00` : '', value: timeSeries.find(item => item.key === key) };
      })
      : period === 'week'
        ? (() => {
          const weekStartDate = (report.selected || '').split('..')[0] || weekStart;
          return Array.from({ length: 6 }, (_, index) => {
            const key = addIsoDays(weekStartDate, index);
            const date = new Date(`${key}T00:00:00Z`);
            const weekday = isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('es-CL', { weekday: 'short', timeZone: 'UTC' }).format(date).replace('.', '');
            return { key, label: `${weekday} ${Number(key.slice(-2))}`, value: timeSeries.find(item => item.key === key) };
          });
        })()
        : (() => {
        const [year, monthNumber] = (report.selected || month).split('-').map(Number);
        const daysInMonth = (year && monthNumber) ? new Date(year, monthNumber, 0).getDate() : 30;
        return Array.from({ length: daysInMonth }, (_, index) => {
          const key = String(index + 1).padStart(2, '0');
          const showLabel = index === 0 || (index + 1) % 5 === 0 || index + 1 === daysInMonth;
          return { key, label: showLabel ? key : '', value: timeSeries.find(item => item.key === key) };
        });
      })()
    : [];
  const chartValue = (point: typeof chartPoints[number]) => chartMetric === 'amount' ? point.value?.total_amount ?? 0 : point.value?.order_count ?? 0;
  const chartMaximum = Math.max(1, ...chartPoints.map(chartValue));
  const peakPoint = chartPoints.reduce<(typeof chartPoints)[number] | null>((peak, point) =>
    chartValue(point) > (peak ? chartValue(peak) : 0) ? point : peak, null);
  const peakBucketLabel = peakPoint
    ? period === 'day'
      ? `${peakPoint.key}:00 h`
      : period === 'week'
        ? (() => {
            const d = new Date(`${peakPoint.key}T00:00:00Z`);
            return isNaN(d.getTime()) ? peakPoint.key : new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', timeZone: 'UTC' }).format(d);
          })()
        : `día ${Number(peakPoint.key)}`
    : '';
  const peakHours = (report?.rush_hours ?? []).filter(item => item.order_count > 0)
    .slice().sort((left, right) => right.total_amount - left.total_amount || right.order_count - left.order_count).slice(0, 5);
  const peakHoursMaximum = Math.max(1, ...peakHours.map(item => item.total_amount));
  const topProducts = (report?.top_products ?? []).slice(0, 3);
  const topProductMaximum = Math.max(1, ...(topProducts.map(item => item.quantity) ?? []));
  const leastProducts = (report?.least_products ?? []).slice(0, 3);
  const leastProductMaximum = Math.max(1, ...(leastProducts.map(item => item.quantity) ?? []));
  const unsoldProducts = report?.unsold_products ?? { count: 0, product_names: [] };
  const zeroSalesPeriod = period === 'day' ? 'este día' : period === 'week' ? 'esta semana' : 'este mes';

  return <section className="pos-report-workspace" aria-labelledby="pos-report-title">
    <header className="pos-workspace-topbar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-2xl mb-6">
      <div>
        <p className="pos-report-eyebrow text-xs font-extrabold uppercase tracking-widest text-[#FACC15]">Control de gestión</p>
        <h2 id="pos-report-title" className="mt-1 font-heading text-2xl font-bold tracking-tight">Reportes de ventas</h2>
        <p className="pos-workspace-desc mt-1.5 text-sm">Consulta las ventas y cierres registrados en la zona horaria de Chile.</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          className="pos-report-refresh inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#090C10] hover:bg-white/10 text-gray-200 px-4 h-11 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-inner"
          onClick={() => setReloadKey(value => value + 1)}
          disabled={loading || offlineMode}
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
        {onClose && (
          <button
            type="button"
            className="pos-back-to-caja flex items-center justify-center gap-2.5 h-11 px-5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] active:scale-95 text-[#0D0D0D] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-yellow-500/20 cursor-pointer transition-all border border-yellow-400"
            onClick={onClose}
            title="Volver a la vista de caja"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span>VOLVER A CAJA</span>
          </button>
        )}
      </div>
    </header>
    <PosSnackbarAlert
      open={Boolean(error)}
      severity="error"
      message={error}
      onClose={() => setError('')}
    />
    <div className="pos-report-toolbar">
      <div className="pos-report-control"><span className="pos-report-control-label">Consultar por</span><div className="pos-report-period-switch" role="group" aria-label="Período del reporte">
        <button type="button" aria-pressed={period === 'day'} className={period === 'day' ? 'is-active' : ''} onClick={() => setPeriod('day')}><CalendarDays aria-hidden="true" />Día</button>
        <button type="button" aria-pressed={period === 'week'} className={period === 'week' ? 'is-active' : ''} onClick={() => setPeriod('week')}><CalendarDays aria-hidden="true" />Semana</button>
        <button type="button" aria-pressed={period === 'month'} className={period === 'month' ? 'is-active' : ''} onClick={() => setPeriod('month')}><BarChart3 aria-hidden="true" />Mes</button>
      </div>
      </div>
      <label className="pos-report-date">{period === 'day' ? 'Día de ventas' : period === 'week' ? 'Semana comercial' : 'Mes de ventas'}<input type={period === 'month' ? 'month' : 'date'} value={period === 'day' ? day : period === 'week' ? weekStart : month} onChange={event => { if (event.target.value) period === 'day' ? setDay(event.target.value) : period === 'week' ? setWeekStart(businessWeekStart(event.target.value)) : setMonth(event.target.value); }} /></label>
      {report && <span className="pos-report-period-label">Período: {period === 'week' ? report.selected.replace('..', ' – ') : report.selected} · America/Santiago</span>}
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
        <article className="pos-report-kpi is-primary"><span>Ventas completadas</span><strong>{money(report.sales?.total_amount ?? 0)}</strong><small>{report.sales?.order_count ?? 0} {(report.sales?.order_count ?? 0) === 1 ? 'venta' : 'ventas'}</small></article>
        <article className="pos-report-kpi"><span>Promedio por venta</span><strong>{money(report.sales?.average_ticket ?? 0)}</strong><small>Ticket promedio del período</small></article>
        <article className="pos-report-kpi"><span>Anulaciones</span><strong>{report.cancellations?.order_count ?? 0}</strong><small>{money(report.cancellations?.total_amount ?? 0)} en ventas anuladas</small></article>
      </div>
      <div className="pos-report-grid">
        <article className="pos-report-card pos-report-timeline"><div className="pos-report-card-title"><div><span>{period === 'day' ? 'Actividad del día' : period === 'week' ? 'Actividad de la semana' : 'Tendencia mensual'}</span><h3>{period === 'day' ? 'Ventas por hora' : 'Ventas por día'}</h3></div><Clock3 aria-hidden="true" /></div>
          <div className="pos-report-chart-toolbar"><span>{chartMetric === 'amount' ? 'Recaudación en CLP' : 'Cantidad de ventas'}{peakPoint && <strong> · Mayor {peakBucketLabel} ({chartMetric === 'amount' ? money(chartValue(peakPoint)) : chartValue(peakPoint) + ' ventas'})</strong>}</span><div role="group" aria-label="Medida del gráfico"><button type="button" aria-pressed={chartMetric === 'amount'} className={chartMetric === 'amount' ? 'is-active' : ''} onClick={() => setChartMetric('amount')}>Monto</button><button type="button" aria-pressed={chartMetric === 'orders'} className={chartMetric === 'orders' ? 'is-active' : ''} onClick={() => setChartMetric('orders')}>Ventas</button></div></div>
          {report.sales?.order_count ? <div className="pos-report-chart-detail" role="img" aria-label={`${period === 'day' ? 'Ventas por hora' : 'Ventas por día'} para ${report.selected}, en hora de Chile`}>
            <div className="pos-report-chart-axis" aria-hidden="true"><span>{chartMetric === 'amount' ? money(chartMaximum) : chartMaximum}</span><span>{chartMetric === 'amount' ? money(Math.ceil(chartMaximum / 2)) : Math.ceil(chartMaximum / 2)}</span><span>0</span></div>
            <div className="pos-report-chart-plot" style={{ gridTemplateColumns: `repeat(${chartPoints.length}, minmax(0, 1fr))` }}><div className="pos-report-chart-gridlines" aria-hidden="true"><i /><i /><i /></div>{chartPoints.map(point => { const value = chartValue(point); const amount = point.value?.total_amount ?? 0; const orders = point.value?.order_count ?? 0; const bucketLabel = period === 'day' ? `${point.key}:00 h` : period === 'week' ? (isNaN(new Date(`${point.key}T00:00:00Z`).getTime()) ? point.key : new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${point.key}T00:00:00Z`))) : `Día ${Number(point.key)}`; return <div className={`pos-report-chart-column ${value ? 'has-value' : ''} ${peakPoint?.key === point.key && value ? 'is-peak' : ''}`} key={point.key} title={`${bucketLabel} · ${money(amount)} · ${orders} ${orders === 1 ? 'venta' : 'ventas'}`}><span style={{ height: `${value ? Math.max(2, value / chartMaximum * 100) : 0}%` }} /><small>{point.label}</small></div>; })}</div>
          </div> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
          <div className="pos-report-chart-legend"><span><i />{chartMetric === 'amount' ? 'Recaudación' : 'Cantidad de ventas'}</span><span>Datos según la hora original de la venta · Chile</span></div>
        </article>
        <article className="pos-report-card pos-report-payments"><div className="pos-report-card-title"><div><span>Recaudación</span><h3>Medios de pago</h3></div><TrendingUp aria-hidden="true" /></div>
          {(report.payments ?? []).length ? <ul>{(report.payments ?? []).map(item => { const share = report.sales?.total_amount ? Math.round(item.total_amount / report.sales.total_amount * 100) : 0; return <li key={item.payment_method}><span><strong>{item.label}</strong><small>{item.order_count} {item.order_count === 1 ? 'venta' : 'ventas'} · {share}%</small><span className="pos-report-track"><i style={{ width: `${share}%` }} /></span></span><b>{money(item.total_amount)}</b></li>; })}</ul> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
        </article>
        <article className="pos-report-card pos-report-products"><div className="pos-report-card-title"><div><span>Preferencias de clientes</span><h3>Productos más vendidos</h3></div><BarChart3 aria-hidden="true" /></div>
          {topProducts.length ? <ol>{topProducts.map((item, index) => <li key={item.product_id ?? `${item.product_name}-${index}`}><i>{index + 1}</i><div className="pos-report-product-entry"><strong>{item.product_name}</strong><div className="pos-report-track"><span style={{ width: `${item.quantity / topProductMaximum * 100}%` }} /></div></div><b>{item.quantity} <small>un.</small></b></li>)}</ol> : <p className="pos-report-empty">No hay productos vendidos en este período.</p>}
        </article>
        <article className="pos-report-card pos-report-products pos-report-least-products"><div className="pos-report-card-title"><div><span>Rotación de la carta</span><h3>Productos menos vendidos</h3></div><BarChart3 aria-hidden="true" /></div>
          {leastProducts.length ? <ol>{leastProducts.map((item, index) => <li key={item.product_id ?? `${item.product_name}-${index}`}><i>{index + 1}</i><div className="pos-report-product-entry"><strong>{item.product_name}</strong><div className="pos-report-track"><span style={{ width: `${item.quantity / leastProductMaximum * 100}%` }} /></div></div><b>{item.quantity} <small>un.</small></b></li>)}</ol> : <p className="pos-report-empty">No hay productos con ventas en este período.</p>}
          <details className="pos-report-unsold-products"><summary><span>{unsoldProducts.count} {unsoldProducts.count === 1 ? 'producto sin ventas' : 'productos sin ventas'} {zeroSalesPeriod}</span><ChevronDown aria-hidden="true" /></summary><div className="pos-report-unsold-list"><strong>Productos sin ventas {zeroSalesPeriod}</strong>{unsoldProducts.product_names?.length ? <ul>{unsoldProducts.product_names.map(name => <li key={name}>{name}</li>)}</ul> : <p>Todos los productos de la carta tuvieron ventas.</p>}</div></details>
        </article>
        {(period === 'week' || period === 'month') && <article className="pos-report-card pos-report-hours"><div className="pos-report-card-title"><div><span>Patrón de demanda</span><h3>Horas punta {period === 'week' ? 'de la semana' : 'del mes'}</h3></div><Clock3 aria-hidden="true" /></div>
          {peakHours.length ? <ol>{peakHours.map(item => <li key={item.hour}><i>{String(item.hour).padStart(2, '0')} h</i><div className="pos-report-product-entry"><strong>{money(item.total_amount)}</strong><div className="pos-report-track"><span style={{ width: `${item.total_amount / peakHoursMaximum * 100}%` }} /></div></div><b>{item.order_count} <small>{item.order_count === 1 ? 'venta' : 'ventas'}</small></b></li>)}</ol> : <p className="pos-report-empty">No hay ventas completadas en este período.</p>}
        </article>}
      </div>
    </>}
  </section>;
}
