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

## Aceptación manual offline — apertura y cierre

El usuario confirmó que las pruebas manuales offline pasaron el 9 de noviembre de 2026. El POS restaura la sesión automáticamente tras recargar con la API detenida; abrió y cerró turnos localmente, conservó ventas pendientes y completó la sincronización al levantar nuevamente Django.

## Límites de esta aceptación

- La caída simulada fue de la API después de cargar la página; no equivale a operación offline completa.
- Esta aceptación inicial no cubrió la restauración automática de sesión offline ni la sincronización completa de la cola; ambas se incorporaron después.
- No se probó la cola de sincronización automática, conciliación de cotización vencida, cierre automático ni impresora DINON 9390.
- La aceptación usó SQLite temporal; no valida bloqueos ni concurrencia de PostgreSQL.
- El navegador dejó de responder después del diálogo de confirmación del cierre. El cierre se verificó sin repetir la acción mediante el log HTTP `200` y la lectura de la base temporal.

La base de prueba y sus servicios temporales se retiraron al finalizar. No quedaron archivos de prueba en el repositorio.

## Actualización — 9 de noviembre de 2026

Se implementó `POST /api/orders/sync/` y la cola frontend en IndexedDB para registrar ventas offline en turnos que ya existen y siguen abiertos en el servidor. La suite de `apps.sales` pasó con 20 pruebas sobre SQLite en memoria: conserva snapshots históricos, recalcula el total y vuelto, señala diferencias de catálogo, rechaza efectivo insuficiente y turnos cerrados, y garantiza reintentos idempotentes. `npm run build` también pasó. En aceptación manual, el usuario detuvo Django con `Ctrl+C`, completó una venta desde el POS offline y volvió a iniciar la API; confirmó que la venta se sincronizó y apareció en el sistema sin inconvenientes. Esta prueba valida la ruta principal de venta y reconexión; no cubre apertura/anulación/cierre offline ni turnos cerrados.

## Aceptación manual offline — apertura y cierre

El usuario confirmó que las pruebas manuales de apertura/cierre offline pasaron el 9 de noviembre de 2026: abrió y cerró turnos localmente, conservó ventas pendientes y completó la sincronización al levantar nuevamente Django.

## Flujo manual validado — apertura y cierre offline

El recorrido validado en el POS con el flujo de acceso anterior fue:

1. Con la API activa, inicia sesión y espera a que el turno/catálogo estén guardados localmente. Detén Django con `Ctrl+C`.
2. Entra al POS sin conexión, abre un turno con un fondo inicial y confirma que aparece como “Turno local”.
3. Registra una venta offline y luego cierra el turno con el efectivo contado. La caja debe quedar cerrada localmente y no permitir nuevas ventas.
4. Reinicia Django. La apertura debe llegar primero, las ventas después y el cierre al final; revisa que la venta figure en el historial y que el turno cierre con su diferencia de efectivo.
5. Repite con API activa al recargar el POS después de reconectar, para confirmar que los eventos pendientes se reintentan sin depender del botón de reconexión.

## Aceptación — restauración automática sin PIN

El usuario confirmó el 10 de noviembre de 2026 que las pruebas del modo offline pasaron, incluida la restauración de la sesión sin PIN y el ingreso desde el formulario cuando la API no responde.

La autenticación online conserva la contraseña. Cuando la API no responde, el equipo restaura o abre la cuenta que quedó guardada durante una autenticación online previa.

## Aceptación — detectar caída de API sin recargar

El usuario confirmó que, al desconectar la API con el POS abierto, el modo offline aparece automáticamente y permite continuar trabajando sin recargar la página.

## Aceptación manual — anulación offline

El usuario confirmó el 10 de noviembre de 2026 que la anulación offline y su prueba funcionaron. El motivo se guarda en `orders.cancellation_reason` junto a la venta; no se crea una tabla separada. Para consultarlo en PostgreSQL:

```sql
SELECT uuid, status, cancelled_at, cancellation_reason, cancelled_by_id
FROM orders
WHERE uuid = '<UUID de la venta>';
```

La API devuelve también `cancellation_reason` en el historial del POS. El flujo offline cubre ventas creadas en la cola local; el historial de ventas creadas online no se guarda localmente para anularlas por primera vez después de recargar sin conexión.

## Aceptación manual — reconexión automática

El usuario confirmó el 10 de noviembre de 2026 que, al recuperar la API, el POS vuelve a conectarse automáticamente sin pulsar los botones de reconexión o sincronización.

## Prueba pendiente — cierre automático a las 00:30

1. Con la API activa, abre un turno antes de las 00:30 de `America/Santiago` y registra al menos una venta en efectivo.
2. Deja el POS abierto hasta las 00:30; no pulses **Cerrar turno**.
3. Comprueba que el turno quede cerrado, las nuevas ventas no estén disponibles, `closed_automatically` sea verdadero, `counted_cash` y `cash_difference` queden vacíos y `final_cash` sea el fondo inicial más las ventas en efectivo no anuladas.
4. Repite con Django detenido durante el cierre. El turno debe cerrarse en el equipo y sincronizar apertura, ventas, anulaciones y cierre, en ese orden, al recuperar el servidor.
5. Con un pago recibido localmente pero aún no registrado al momento del cierre automático, confirma que el turno espera. Al reintentar y registrar la venta, confirma que el turno se cierre y que la venta quede incluida.

## Verificación automatizada — conciliación tardía de turno cerrado

La API ahora conserva una venta offline si el servidor ya cerró el turno, la marca `requires_review`, añade el motivo en `review_reason` y recalcula `final_cash` sin alterar `counted_cash`. Una anulación offline asociada se conserva auditada y vuelve a calcular el esperado. La cola se reintenta aunque la API informe que no hay turno abierto.

La suite `python manage.py test apps.sales --settings=config.test_settings` pasó con 26 pruebas en SQLite temporal, incluidas venta tardía, reintento idempotente, recálculo de diferencia, anulación posterior y consulta autenticada del turno. Este caso es una salvaguarda: el flujo normal sincroniza primero ventas y anulaciones y cierra el turno al final.
