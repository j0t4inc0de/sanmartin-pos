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

## Validación pendiente — restauración automática sin PIN

El PIN se eliminó después de la aceptación anterior. Falta confirmar en el navegador el comportamiento nuevo:

1. Con la API activa, inicia sesión online y espera a que el POS guarde el estado local.
2. Detén Django con `Ctrl+C` y recarga `/pos`.
3. Confirma que restaura el usuario y el turno directamente, sin pedir contraseña ni PIN, y que puedes seguir operando.
4. Cierra sesión online, detén la API e intenta entrar desde el formulario con el nombre de la cuenta guardada y sin contraseña; debe continuar offline. La contraseña se mantiene obligatoria para autenticar cuando la API responde.

## Validación pendiente — detectar caída de API sin recargar

1. Inicia sesión y deja el POS abierto con un turno activo.
2. Detén Django con `Ctrl+C`, sin recargar ni cambiar de pantalla.
3. Espera hasta cinco segundos. El POS debe mostrar el modo offline por sí solo y permitir continuar la operación con los datos guardados.
4. Reinicia Django y pulsa **Reconectar y sincronizar**. Confirma que las ventas pendientes se procesen.
