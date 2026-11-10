# Pruebas de aceptación — persistencia local del POS

- **Fecha:** 9 de noviembre de 2026
- **Entorno:** frontend local en `127.0.0.1:5181`, API local en `127.0.0.1:8001` y base SQLite temporal aislada.
- **Datos:** usuario, producto, modificador y turno ficticios. No se usó ni modificó la base PostgreSQL del proyecto ni la caja de `127.0.0.1:5173`.
- **Resultado:** aceptadas para el flujo online con respaldo local y reintento.

## Casos ejecutados

| Caso | Resultado | Evidencia observada |
|---|---|---|
| Abrir un turno de prueba con fondo inicial de $10.000 | Aprobado | El POS mostró la caja activa y el folio inicial #001. |
| Agregar un producto y recargar `/pos` | Aprobado | El producto reapareció y el estado indicó que el borrador se restauró desde este equipo. |
| Cotizar y recargar la página | Aprobado | La cotización, el total de $5.000, el UUID y el folio #001 se restauraron. |
| Intentar cerrar con la cotización pendiente | Aprobado | El botón de cierre estuvo deshabilitado y el POS indicó que había una venta pendiente. |
| Detener la API y confirmar la recepción en el flujo de prueba | Aprobado | El POS conservó `PAGO_RECIBIDO`, deshabilitó la edición y avisó que no se cobrara de nuevo. |
| Restaurar la API y reintentar el mismo registro | Aprobado | El servidor respondió `201`; se guardó el folio #001 por $5.000 y quedó una sola venta. |
| Cerrar el turno después de resolver la venta | Aprobado | Con $15.000 contados, el endpoint respondió `200` y la base temporal mostró el turno cerrado. |

## Límites de esta aceptación

- La caída simulada fue de la API después de cargar la página; no equivale a operación offline completa.
- Al recargar con la API caída en esta aceptación, la sesión online no pudo prepararse. Después se agregó el PIN offline y el usuario confirmó que probó el acceso y funciona; la cola no está conectada a la interfaz.
- No se probó la cola de sincronización automática, conciliación de cotización vencida, cierre automático ni impresora DINON 9390.
- La aceptación usó SQLite temporal; no valida bloqueos ni concurrencia de PostgreSQL.
- El navegador dejó de responder después del diálogo de confirmación del cierre. El cierre se verificó sin repetir la acción mediante el log HTTP `200` y la lectura de la base temporal.

La base de prueba y sus servicios temporales se retiraron al finalizar. No quedaron archivos de prueba en el repositorio.

## Actualización — 9 de noviembre de 2026

Se implementó `POST /api/orders/sync/` para registrar ventas offline en turnos que ya existen y siguen abiertos en el servidor. La suite de `apps.sales` pasó con 20 pruebas sobre SQLite en memoria: conserva snapshots históricos, recalcula el total y vuelto, señala diferencias de catálogo, rechaza efectivo insuficiente y turnos cerrados, y garantiza reintentos idempotentes. Estas pruebas cubren la API; no validan todavía la cola offline desde el navegador ni sincronización de apertura, anulación o cierre.
