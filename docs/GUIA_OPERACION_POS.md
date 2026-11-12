# Guía de operación del POS (entorno de pruebas)

- **Estado:** borrador operativo; la sección de impresión real se completará después de probar la DINON 9390 e integrar la impresión con ventas.
- **Ámbito:** operación local del POS en `/pos`. No sustituye una boleta tributaria ni la capacitación del equipo.
- **Conectividad:** la contraseña se valida cuando el servidor está disponible. Después de un inicio de sesión online, el equipo conserva el nombre de la cuenta para permitir el acceso offline en ese mismo perfil del navegador. El primer uso de cada equipo requiere autenticarse online.

## 1. Iniciar el POS y abrir turno

1. Abre `/pos` en el equipo autorizado e inicia sesión con tu nombre de usuario y contraseña.
   - Si el servidor responde, se valida la contraseña normalmente.
   - Si no responde y el equipo ya fue habilitado online, escribe el mismo nombre de usuario guardado y selecciona **Entrar al POS**. Se recuperará la cuenta local; la contraseña no se puede validar sin servidor. No uses esta modalidad en un equipo público o compartido con personas no autorizadas.
   - Si este equipo aún no tiene una cuenta guardada, se requiere conexión para el primer inicio de sesión.
2. Comprueba el indicador de conexión y que el catálogo haya cargado. Si se muestra un error del catálogo, usa **Reintentar** cuando vuelva la conexión; no borres los datos del navegador.
3. En la sección de caja, ingresa el fondo inicial real y selecciona **Abrir turno**. Sin conexión, la interfaz muestra **Abrir turno offline**; el turno se guarda en este equipo y queda pendiente de sincronización.
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
4. Si el POS vuelve a estar online, espera a que se sincronicen las ventas y anulaciones antes del cierre manual. Si sigues offline, puedes cerrar localmente si no hay un pago o cotización pendiente: el cierre se guarda detrás de las ventas y anulaciones de ese turno y se envía al reconectar. No abras otro turno hasta que el cierre se haya sincronizado.
5. El cierre automático está programado para las **00:30, hora de Chile**. Si hay un pago pendiente, se espera a resolverlo; las operaciones offline pendientes se envían en orden al recuperar conexión.

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

- En **Reportes**, selecciona **Día** o **Mes** y el período que quieres consultar. Los reportes requieren conexión al servidor. Las ventas offline aparecen después de sincronizarse y se agrupan por la fecha original de la venta.
- Las anulaciones se muestran separadas de las ventas completadas. Los montos por medio de pago deben conciliar con las ventas válidas.
- Para cerrar un turno, cuenta físicamente el efectivo de la caja. Ingresa el efectivo contado, revisa el resumen y la diferencia, agrega una nota si hace falta y confirma **Cerrar turno**.
- No confundas efectivo esperado con el total de ventas: el efectivo esperado considera el fondo inicial y las ventas en efectivo completadas, menos las anuladas conforme a las reglas del sistema.
- Si aparece un aviso de pago pendiente, resuélvelo primero. En línea, espera a que las colas offline se sincronicen; sin conexión, puedes cerrar localmente y el cierre quedará detrás de esas operaciones. No abras otro turno hasta que se confirme la sincronización del cierre.

## 7. Preferencias y salida

- **Visualización** permite elegir tema claro/oscuro y escala de la página. Selecciona el que facilite la lectura en ese equipo.
- **Cerrar sesión** pide confirmación. Antes de confirmar, revisa el aviso de operaciones pendientes. Cerrar sesión no las borra, pero la persona tendrá que volver a autenticarse para continuar.

## 8. Impresora y problemas de servicio

### Impresión

Antes de vender, vincula la DINON en **Impresora y gaveta** desde Configuración del equipo. Al registrar el pago, el POS guarda la venta primero y luego envía un comprobante para el cliente y una comanda para cocina. Las notas escritas en cada producto y sus agregados aparecen en la comanda; no aparecen en el comprobante del cliente. Para efectivo se envía también el pulso de apertura de gaveta; Transbank y transferencia no la abren.

La venta no se pierde si la impresora está desconectada o falla. El POS muestra que la venta quedó guardada y que no se confirmó la impresión; revisa la impresora y usa **Impresiones recientes → Reimprimir**. La reimpresión conserva el folio, se identifica como copia y no abre la gaveta. El navegador puede confirmar el envío a USB, pero el operador debe revisar físicamente que hayan salido ambos papeles. Estos comprobantes no son boletas tributarias.

Cuando esté disponible la DINON, sigue la prueba física de [`PROPUESTA_IMPRESION_POS.md`](PROPUESTA_IMPRESION_POS.md). Haz la prueba de gaveta únicamente con autorización y el área despejada.

### Si el servidor/API o internet deja de responder

- Comprueba si el estado cambia a **Modo offline**; no es necesario recargar la página.
- Si el equipo nunca se autenticó online, el acceso offline no está habilitado. Si ya tiene la cuenta guardada, en la pantalla de acceso ingresa el mismo nombre de usuario y continúa; sin servidor no se valida la contraseña.
- Conserva el navegador y los datos locales. Las operaciones pendientes se reintentan al recuperar conexión.
- Si el indicador no cambia o una operación queda trabada, anota el folio, el mensaje y la hora; no repitas el cobro. Escala el caso al responsable técnico.

## 9. Verificaciones pendientes antes de entregar esta guía como final

- Completar la prueba física de la DINON 9390 y documentar ancho, corte, legibilidad, acentos, comprobante de cliente, comanda y gaveta.
- Completar validación física de impresión online/offline, notas por producto, reimpresión sin duplicar cobros y apertura de gaveta solo en efectivo.
- Recorrer con una persona operadora la guía de inicio a cierre y ajustar los nombres de controles si difieren de la interfaz final.
- Conciliar un período de reportes con ventas/cierres conocidos y cerrar la lista de aceptación integral.
