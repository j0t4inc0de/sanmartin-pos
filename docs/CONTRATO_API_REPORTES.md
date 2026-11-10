# Contrato de reportes de ventas del POS

- **Versión:** 1.0
- **Ruta:** `GET /api/reports/sales/`
- **Estado:** implementado localmente; falta aceptación manual de interfaz
- **Zona horaria:** `America/Santiago`

## Acceso

Requiere sesión autenticada y permiso `sales.can_operate_pos`. El reporte incluye únicamente ventas y turnos asociados a la cuenta autenticada. La interfaz debe estar conectada; no se descarga ni replica el historial completo en IndexedDB.

## Filtros

| Consulta | Uso |
|---|---|
| `?period=day&date=YYYY-MM-DD` | Un día calendario de Chile. Si `date` se omite, usa el día actual en `America/Santiago`. |
| `?period=month&month=YYYY-MM` | Un mes calendario de Chile, incluidos sus días completos. |

Los intervalos se consultan como `[inicio, fin)`, con inicio local inclusivo y fin local exclusivo. La fecha se valida; períodos y fechas inválidos responden `400`.

## Reglas de agregación

- **Ventas:** solo estado `COMPLETADA`. Devuelve monto recaudado, cantidad y ticket promedio redondeado al peso más cercano.
- **Medios de pago:** total y cantidad de ventas completadas por medio.
- **Anulaciones:** cantidad y monto de ventas con estado `ANULADA`, presentados aparte y excluidos del total de ventas completadas.
- **Productos más vendidos:** suma unidades por `product_name` histórico guardado en el detalle de la venta; no consulta el nombre vigente del catálogo. Ordena por cantidad y muestra los ocho primeros.
- **Horas de venta:** agrupa ventas completadas por hora local, según `Order.created_at` (hora original de la venta, incluso si llegó offline después). Devuelve solo horas con ventas.
- **Turnos:** incluye turnos del usuario abiertos dentro del período seleccionado. Devuelve apertura/cierre, fondo inicial, efectivo esperado, efectivo contado, diferencia y si el cierre fue automático. La diferencia es contado menos esperado; puede ser nula si el cierre no tuvo conteo físico.

La consulta se agrega en el servidor. Las ventas offline aparecen en el dashboard después de sincronizarse, clasificadas según su `created_at` original, no según la hora de recepción en el servidor.

## Respuesta

La respuesta contiene `period`, `selected`, `start`, `end_exclusive`, `timezone`, y las secciones `sales`, `payments`, `cancellations`, `top_products`, `rush_hours` y `shifts`. Los montos son enteros CLP. No se devuelven notas, identificadores personales ni motivos de anulación.
