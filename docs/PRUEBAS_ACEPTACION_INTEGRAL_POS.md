# Pruebas de aceptación integral del POS

- **Entorno:** local/de pruebas; nunca ejecutar estos casos sobre producción.
- **Fecha:** ________  **Operador:** ________  **Navegador/versión:** ________  **Build/commit:** ________
- **Convención:** registrar `Pasa`, `Falla` o `Bloqueada`, la evidencia y el folio cuando aplique. No repetir un cobro para investigar un estado incierto.

## A. Inicio y sesión

| ID | Escenario y resultado esperado | Estado / evidencia |
|---|---|---|
| A1 | Iniciar sesión online con credenciales de pruebas; cargar `/pos`, usuario, catálogo y estado del turno sin errores. | ________ |
| A2 | Con una sesión previamente iniciada, cortar la API; el POS detecta offline sin recargar y conserva el catálogo local. | ________ |
| A3 | Restaurar la API; reconexión y sincronización ocurren automáticamente, sin recargar ni pulsar sincronizar. | ________ |
| A4 | Cerrar sesión con operaciones pendientes; aparece confirmación y explica que los datos siguen en el equipo. | ________ |

## B. Turno y ventas

| ID | Escenario y resultado esperado | Estado / evidencia |
|---|---|---|
| B1 | Abrir turno online con fondo inicial; el turno queda activo una sola vez. | ________ |
| B2 | Abrir turno offline; se guarda localmente y se sincroniza al reconectar sin duplicarse. | ________ |
| B3 | Agregar productos, cantidades, modificadores/exclusiones y nota; seleccionar Para servir/Para llevar; cotización coincide con el detalle. | ________ |
| B4 | Completar pago de prueba en efectivo; total, recibido y vuelto son correctos y la venta queda registrada una sola vez. | ________ |
| B5 | Completar pagos de prueba por Transbank y transferencia; método y total se conservan. | ________ |
| B6 | Si el servidor no confirma el pago, el mismo folio/UUID se conserva para reintento; no se vuelve a cobrar y no aparece venta duplicada. | ________ |
| B7 | Intentar cerrar con cotización/pago pendiente; el POS bloquea el cierre y comunica qué resolver. | ________ |

## C. Offline, anulaciones y recuperación

| ID | Escenario y resultado esperado | Estado / evidencia |
|---|---|---|
| C1 | Desconectar API después de entrar y completar una venta de prueba; venta queda local y se identifica como pendiente. | ________ |
| C2 | Restaurar API; venta se sincroniza automáticamente conservando folio, hora original y total, sin duplicado. | ________ |
| C3 | Anular una venta online con motivo; la venta permanece en historial como anulada y el motivo es visible. | ________ |
| C4 | Anular una venta offline con motivo; la anulación queda pendiente y se sincroniza después de la venta. | ________ |
| C5 | Cerrar turno offline con ventas pendientes; el evento queda en cola detrás de ventas/anulaciones y se concilia al recuperar servidor. | ________ |
| C6 | Revisar venta offline recibida después del cierre del turno; queda asociada al turno correspondiente y marcada para revisión. | ________ |
| C7 | Simular el cierre de las 00:30 en un entorno controlado; el cierre espera pagos pendientes y no pierde ventas offline. Registrar que cambiar el reloj del PC con turno abierto puede no disparar el temporizador de inmediato. | ________ |

## D. Catálogo, apariencia y reportes

| ID | Escenario y resultado esperado | Estado / evidencia |
|---|---|---|
| D1 | Buscar productos completos/parciales, con y sin acentos; combinar búsqueda con categoría, limpiar y seleccionar producto por teclado/mouse. | ________ |
| D2 | Actualizar producto/categoría/modificador; cambio incremental llega sin perder borrador; disponibilidad retirada se elimina de la copia local. | ________ |
| D3 | Editar y retirar/restaurar producto o categoría; carta pública refleja el estado y registros históricos permanecen. | ________ |
| D4 | Revisar tema claro y oscuro y escalas aprobadas; menús, imágenes, textos, filtros, paneles y reportes se ven legibles y responsivos. | ________ |
| D5 | Consultar reportes Día y Mes; total, medios de pago, anulaciones, top productos, series y horas punta concuerdan con ventas/cierres de prueba conocidos. | ________ |
| D6 | Verificar ventas offline en su fecha/hora original tras sincronizar y anulaciones separadas del total completado. | ________ |

## E. Caja, permisos e impresión

| ID | Escenario y resultado esperado | Estado / evidencia |
|---|---|---|
| E1 | Cerrar turno con efectivo esperado/contado conocido; diferencia se calcula correctamente y queda visible en reportes. | ________ |
| E2 | Verificar que el usuario sin permiso de operación no puede acceder a acciones protegidas del POS/API. | ________ |
| E3 | Enlazar DINON 9390 y ejecutar muestras: ancho, acentos, legibilidad, corte, dos papeles, folio compartido y comanda sin precios/pago. | ________ |
| E4 | Con gaveta conectada y área despejada, probar pulso autorizado; comprobar que una prueba de impresión no abre la gaveta. | ________ |
| E5 | Venta real online y offline imprime comprobante cliente y comanda cocina después de persistirse; fallo de impresora no duplica ni pierde venta. | ________ |
| E6 | Reimprimir comprobante/comanda identificando reimpresión y conservando folio original, sin crear una venta nueva. | ________ |
| E7 | Gaveta abre solo para efectivo y según flujo acordado al anular con devolución; no abre por Transbank/transferencia. | ________ |

**Estado inicial del plan:** A3, las pruebas de concurrencia, catálogo incremental y tema claro/oscuro tienen evidencia previa registrada en el plan. El usuario ya probó el modo offline, ventas, anulaciones, cierre automático y reconexión. Volver a recorrerlos en esta aceptación sirve para confirmar el flujo completo después de terminar impresión, no para repetir ahora cada prueba ya aceptada.

**Bloqueos conocidos:** E3 y E4 esperan acceso físico a la DINON. E5–E7 requieren además la integración de impresión de ventas y reimpresión. No marcar la aceptación integral como completa mientras haya casos bloqueados o fallidos.
