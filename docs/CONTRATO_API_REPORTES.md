# Contrato de reportes de ventas del POS

- **Versión:** 1.0
- **Ruta:** `GET /api/reports/sales/`
- **Estado:** filtros Día/Mes aceptados; filtro semanal comercial y ranking de productos en implementación local
- **Zona horaria:** `America/Santiago`

## Acceso

Requiere sesión autenticada y permiso `sales.can_operate_pos`. El reporte incluye únicamente ventas y turnos asociados a la cuenta autenticada. La interfaz debe estar conectada; no se descarga ni replica el historial completo en IndexedDB.

## Filtros

| Consulta | Uso |
|---|---|
| `?period=day&date=YYYY-MM-DD` | Un día calendario de Chile. Si `date` se omite, usa el día actual en `America/Santiago`. |
| `?period=week&date=YYYY-MM-DD` | Semana comercial que contiene la fecha: martes 00:00 hasta el lunes siguiente 00:00, hora de Chile (martes a domingo inclusive). Si `date` se omite, usa la semana actual. `selected` devuelve las fechas de martes y domingo separadas por `..`. |
| `?period=month&month=YYYY-MM` | Un mes calendario de Chile, incluidos sus días completos. |

Los intervalos se consultan como `[inicio, fin)`, con inicio local inclusivo y fin local exclusivo. La fecha se valida; períodos y fechas inválidos responden `400`.

## Reglas de agregación

- **Ventas:** solo estado `COMPLETADA`. Devuelve monto recaudado, cantidad y ticket promedio redondeado al peso más cercano.
- **Medios de pago:** total y cantidad de ventas completadas por medio.
- **Anulaciones:** cantidad y monto de ventas con estado `ANULADA`, presentados aparte y excluidos del total de ventas completadas.
- **Productos más vendidos:** suma unidades de ventas completadas por producto vigente, muestra hasta tres y excluye la categoría `salsas`.
- **Productos menos vendidos:** muestra hasta tres productos distintos de Salsas que tuvieron al menos una unidad vendida, ordenados ascendentemente por unidades.
- **Productos sin ventas:** cuenta y enumera los productos actualmente activos y disponibles en categorías activas, salvo Salsas, que no tuvieron ventas completadas durante el período. Se entrega como `unsold_products: { count, product_names }`.
- **Gráfico del período:** agrupa por hora en el reporte diario, por día de martes a domingo en el semanal y por día del mes en el mensual, según `Order.created_at` (hora original de la venta, incluso si llegó offline después). Devuelve solo intervalos con ventas; la interfaz completa visualmente los intervalos sin ventas.
- **Horas punta:** distribuye ventas completadas por hora local de Chile. Se muestra en vistas semanal y mensual para identificar los horarios con mayor recaudación.
- **Turnos:** el API sigue entregando turnos del usuario dentro del período, con apertura/cierre, fondo inicial, efectivo esperado, contado, diferencia y cierre automático. La pantalla de reportes ya no presenta la tarjeta de turnos; el arqueo de caja no cambia.

La consulta se agrega en el servidor. Las ventas offline aparecen en el dashboard después de sincronizarse, clasificadas según su `created_at` original, no según la hora de recepción en el servidor.

## Respuesta

La respuesta contiene `period`, `selected`, `start`, `end_exclusive`, `timezone`, y las secciones `sales`, `payments`, `cancellations`, `top_products`, `least_products`, `unsold_products`, `rush_hours`, `time_series` y `shifts`. Los rankings entregan `product_id`, `product_name` y `quantity`; cada elemento de `time_series` entrega `key`, `total_amount` y `order_count`. Los montos son enteros CLP. No se devuelven notas, identificadores personales ni motivos de anulación.
