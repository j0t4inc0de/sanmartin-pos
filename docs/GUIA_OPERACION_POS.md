# Guía de operación del POS (entorno de pruebas)

- **Estado:** borrador operativo; la sección de impresión real se completará después de probar la DINON 9390 e integrar la impresión con ventas.
- **Ámbito:** operación local del POS en `/pos`. No sustituye una boleta tributaria ni la capacitación del equipo.
- **Conectividad:** el inicio de sesión con contraseña necesita conexión. Después de iniciar sesión, el equipo conserva la sesión para seguir operando offline.

## 1. Iniciar el POS y abrir turno

1. Abre `/pos` en el equipo autorizado e inicia sesión con tu contraseña.
2. Comprueba el indicador de conexión y que el catálogo haya cargado. Si se muestra un error del catálogo, usa **Reintentar** cuando vuelva la conexión; no borres los datos del navegador.
3. En la sección de caja, ingresa el fondo inicial real y selecciona **Abrir turno**. Si no hay conexión, el turno puede abrirse localmente y quedará pendiente de sincronización.
4. Espera la confirmación antes de iniciar ventas. Si aparece que la apertura está pendiente, no abras otro turno: deja el POS conectado para que reintente o utiliza la acción **Reintentar sincronización** si aparece.

## 2. Crear y cobrar una venta

1. Busca el producto por nombre o selecciónalo en su categoría. Agrega cantidad y, cuando corresponda, modificadores, exclusiones y nota para cocina.
2. Selecciona **Para servir** o **Para llevar**.
3. Revisa los productos, cantidades, notas y tipo de pedido. Selecciona **Cotizar venta** y verifica el total.
4. Elige el medio recibido: efectivo, Transbank o transferencia. Para efectivo, ingresa lo recibido y comprueba el vuelto.
5. Cuando el pago se haya recibido, confirma **Confirmar recepción del pago** una sola vez y espera el resultado.

### Si el registro del pago queda pendiente

- Si el POS indica que el pago ya se guardó en este equipo, **no vuelvas a cobrarlo**. Usa **Reintentar registro** cuando haya conexión.
- Si indica que no pudo respaldar localmente la recepción, conserva abierta la venta y sigue el mensaje de reintento. No prepares una venta nueva para reemplazarla.
- No cierres el turno mientras haya una cotización o pago pendiente.

## 3. Trabajar sin conexión

Después de iniciar sesión con conexión, el POS puede continuar con la sesión y el último catálogo guardados en ese equipo.

1. Si aparece **Modo offline**, puedes continuar las operaciones habituales. Las ventas, anulaciones y eventos del turno se guardan localmente.
2. Revisa el aviso de ventas/anulaciones pendientes. No cierres el navegador ni borres sus datos mientras haya operaciones sin sincronizar.
3. Al volver la conexión, el POS reintenta la sincronización automáticamente. Espera a que el indicador muestre que ya no hay pendientes. Si una operación muestra un error, usa su acción de reintento cuando esté disponible y conserva el folio para soporte.
4. Antes de cerrar manualmente un turno, espera a que las ventas y anulaciones se sincronicen. El POS también bloquea el cierre si queda un pago o cotización pendiente.
5. El cierre automático está programado para las **00:30, hora de Chile**. Si hay un pago pendiente, se espera a resolverlo; si hay ventas offline, el cierre queda guardado y se envía después del resto de las operaciones.

## 4. Anular una venta

1. En **Ventas recientes**, localiza la venta completada del turno actual y selecciona **Anular**.
2. Revisa el folio y confirma la acción.
3. Escribe un motivo claro y confirma la anulación. El motivo queda asociado al historial de la venta.
4. Si estás offline, la anulación se guarda en el equipo y se sincroniza después de la venta correspondiente. Revisa que desaparezca de la lista de pendientes tras reconectar.

Una venta ya anulada no se elimina del historial. Si se anuló por error, no crees una venta compensatoria sin indicación del responsable del local.

## 5. Administrar el catálogo

1. Abre **Catálogo** dentro del POS.
2. Busca por nombre o categoría y usa las acciones disponibles para crear o editar productos/categorías, o retirar/restaurar elementos de la carta.
3. Los cambios requieren conexión, se guardan en el servidor y actualizan el POS y la carta pública. Retirar oculta el elemento de las ventas nuevas, pero conserva sus registros históricos.
4. Comprueba el resultado en el catálogo del POS; no cambies el navegador a offline a mitad de una edición.

## 6. Reportes y cierre de turno

- En **Reportes**, selecciona **Día** o **Mes** y el período que quieres consultar. Los datos offline aparecen cuando se sincronizan, usando la fecha original de la venta.
- Las anulaciones se muestran separadas de las ventas completadas. Los montos por medio de pago deben conciliar con las ventas válidas.
- Para cerrar un turno, cuenta físicamente el efectivo de la caja. Ingresa el efectivo contado, revisa el resumen y la diferencia, agrega una nota si hace falta y confirma **Cerrar turno**.
- No confundas efectivo esperado con el total de ventas: el efectivo esperado considera el fondo inicial y las ventas en efectivo completadas, menos las anuladas conforme a las reglas del sistema.
- Si aparece un aviso de pago pendiente, resuélvelo primero. Si hay operaciones offline pendientes, espera a la sincronización antes de cerrar.

## 7. Preferencias y salida

- **Visualización** permite elegir tema claro/oscuro y escala de la página. Selecciona el que facilite la lectura en ese equipo.
- **Cerrar sesión** pide confirmación. Antes de confirmar, revisa el aviso de operaciones pendientes. Cerrar sesión no las borra, pero la persona tendrá que volver a autenticarse para continuar.

## 8. Impresora y problemas de servicio

### Impresión

La pantalla actual solo ofrece diagnóstico: vincular USB, imprimir dos muestras y probar la gaveta mediante una acción separada. **Todavía no imprime ventas reales, no ofrece reimpresión de ventas ni controla automáticamente la apertura de gaveta por medio de pago.** No prometas al operador que el papel de una venta ya salió por el hecho de haber registrado el pago.

Cuando esté disponible la DINON, sigue la prueba física de [`PROPUESTA_IMPRESION_POS.md`](PROPUESTA_IMPRESION_POS.md). Haz la prueba de gaveta únicamente con autorización y el área despejada.

### Si el servidor/API o internet deja de responder

- Comprueba si el estado cambia a **Modo offline**; no es necesario recargar la página.
- Si la sesión no se había iniciado antes de perder conexión, el acceso offline no está garantizado: recupera internet/API e inicia sesión.
- Conserva el navegador y los datos locales. Las operaciones pendientes se reintentan al recuperar conexión.
- Si el indicador no cambia o una operación queda trabada, anota el folio, el mensaje y la hora; no repitas el cobro. Escala el caso al responsable técnico.

## 9. Verificaciones pendientes antes de entregar esta guía como final

- Completar la prueba física de la DINON 9390 y documentar ancho, corte, legibilidad, acentos, comprobante de cliente, comanda y gaveta.
- Integrar y validar impresión de venta, reimpresión sin duplicar cobros, cola offline y apertura de gaveta condicionada al pago en efectivo.
- Recorrer con una persona operadora la guía de inicio a cierre y ajustar los nombres de controles si difieren de la interfaz final.
- Conciliar un período de reportes con ventas/cierres conocidos y cerrar la lista de aceptación integral.
