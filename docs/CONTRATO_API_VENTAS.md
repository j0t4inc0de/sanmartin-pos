# Contrato de ventas del POS

- **Versión:** 1.0
- **Estado:** reglas acordadas; API online y endpoint idempotente de sincronización offline implementados; el endpoint conserva snapshots cobrados y marca cambios del catálogo para revisión. El POS guarda catálogo, borrador, cotización y pago recibido en IndexedDB, y el PIN offline abre vista de solo lectura; todavía falta persistir ventas offline en cola y conectarla al endpoint.
- **Alcance:** ventas presenciales en el mesón con Django REST y PostgreSQL.
- **Moneda:** pesos chilenos enteros (CLP).

Este documento convierte las decisiones de negocio acordadas en reglas de implementación. No reemplaza el MER; guía los ajustes propuestos al modelo Django y su API.

## 1. Decisiones confirmadas

- La primera versión registra ventas presenciales del mesón; no incluye delivery, retiro externo, combos ni consumo propio.
- El tipo de consumo será `PARA_SERVIR` o `PARA_LLEVAR`.
- Una venta se guarda como completada cuando el operador confirma que recibió el pago. No habrá pedidos pendientes de pago.
- Cada venta admite un medio de pago: efectivo, Transbank (débito o crédito, una sola categoría) o transferencia.
- En efectivo, se ingresa el monto recibido, que debe cubrir el total; el servidor calcula el vuelto. En Transbank y transferencia, `amount_paid` y `change_given` quedan vacíos; `total_amount` registra el importe de la venta.
- Se incluirán modificadores disponibles: extras pagados y exclusiones de cocina. Los combos quedan fuera.
- Los modificadores se aplican por unidad. Si unidades iguales tienen preparaciones diferentes, se representan como líneas distintas. Un extra puede repetirse; una exclusión no.
- Cada línea admite una nota opcional de cocina de hasta 150 caracteres.
- El backend es responsable del cálculo final. Si cambia un precio antes del cobro, se actualiza el carrito y se pide confirmación al operador.
- La cotización firmada dura cinco minutos. Si vence antes del pago, se solicitan precios actuales y el cajero confirma el total antes de continuar.
- Las ventas offline conservan el precio efectivamente cobrado. Si al sincronizar difiere del catálogo vigente, se incluye en la caja y se marca para revisión; no se cambia el precio histórico.
- Si el catálogo local lleva tiempo sin sincronizar, se permite seguir vendiendo con un aviso visible de antigüedad. Al reconectar, las diferencias de precio se conservan y se marcan para revisión.
- La venta lleva UUID idempotente y folio correlativo por turno. En V1, el POS asigna y conserva el siguiente folio en almacenamiento local persistente para que el impreso y la sincronización usen el mismo número; el servidor aplica la unicidad por turno.
- El POS usa una cuenta general compartida con contraseña para iniciar sesión online. Después de autenticarla en el equipo, el acceso offline solicita un PIN compartido de cuatro cifras y vence 24 horas después de la última autenticación online. Tras cinco intentos incorrectos, se bloquea el acceso durante 15 minutos; una sesión POS ya abierta permanece activa. El PIN no se guarda en texto legible. Como solo tiene 10.000 combinaciones, el verificador local y el bloqueo deben mitigar la fuerza bruta, sin presentarse como protección contra alguien que manipule el perfil del navegador. La auditoría registra la cuenta compartida y el equipo, no la identidad de la persona física.
- Una venta completada no se borra. La cuenta compartida puede anularla solo mientras su turno esté abierto; el motivo es obligatorio y se guardan fecha y hora.
- Una venta confirmada imprime un comprobante para el cliente, que permite retirar el pedido, y una comanda para cocina. Son documentos de venta; no se consideran tickets de anulación. La falla de impresión no revierte ni duplica una venta ya guardada.
- El cierre automático ocurre a las 00:30 en `America/Santiago`. Si el equipo está offline, cierra localmente el turno, impide nuevas ventas en ese turno y conserva el evento de cierre para sincronizarlo después de la apertura, ventas y anulaciones pendientes.
- `final_cash` es el efectivo esperado calculado por el sistema: fondo inicial más la suma de `total_amount` de las ventas completadas pagadas en efectivo. Las anuladas se excluyen porque la anulación presupone la devolución; no se descuentan por segunda vez. `counted_cash` es el efectivo contado físicamente. En un cierre manual se exigen ambos valores y `cash_difference` es `counted_cash - final_cash` (positivo: sobrante; negativo: faltante). En uno automático `counted_cash` queda vacío porque no hubo conteo físico.

## 2. Reglas de integridad

1. Se requiere sesión autenticada, permiso `sales.can_operate_pos` y un turno abierto del operador.
2. La venta queda vinculada al turno abierto y al usuario autenticado; el cliente no puede elegir un turno ajeno.
3. Se aceptan solo productos y modificadores activos y disponibles en el catálogo de la venta en línea.
4. La solicitud no puede imponer el subtotal, total, nombre o precio online. El servidor toma los valores vigentes del catálogo y calcula el precio de cada línea, los modificadores, subtotal, vuelto y total.
5. La cantidad de cada producto debe ser un entero mayor que cero. Los montos son enteros no negativos. No se permiten descuentos ni recargos de despacho en esta versión.
6. `total_amount` debe coincidir con la suma de líneas y extras. El POS asigna `shift_order_number` de forma secuencial en su almacenamiento local persistente, compartido por ventas en línea y offline. El servidor verifica la unicidad por turno dentro de la transacción y responde `409 Conflict` si el folio ya está asociado a otra venta.
7. Si se repite una solicitud con el mismo UUID y el mismo contenido, se devuelve la venta existente. Si el UUID ya existe con otro contenido, se responde `409 Conflict` y no se crea otra venta.
8. La fecha de la operación (`created_at`) conserva el momento local de la venta; `received_at` registra cuándo la recibió el servidor.
9. La anulación cambia el estado a `ANULADA`, registra fecha, motivo obligatorio y la cuenta compartida. No elimina ni modifica las líneas históricas. La persona física no puede identificarse con una cuenta compartida.
10. La cola sincroniza por turno en este orden: apertura (si está pendiente), ventas por folio ascendente, anulaciones de esas ventas y cierre (si está pendiente). Si una operación falla, conserva los datos locales y pausa las siguientes operaciones del mismo turno hasta resolverla. Los reintentos mantienen el mismo UUID.
11. Antes de permitir cobrar, el POS debe comprobar que puede guardar localmente la operación. Si no puede persistir el borrador de cobro, no inicia el pago. Nunca elimina ventas pendientes para liberar espacio.

## 3. Flujo propuesto en línea

1. El POS arma el carrito localmente con productos y preparaciones y mantiene un contador persistente de folios asociado al UUID del turno. El contador se inicializa en `1` al abrir un turno nuevo y se incrementa una sola vez por venta local confirmada.
2. Antes del pago físico, solicita una cotización al backend. El backend verifica el turno y devuelve nombres, precios y total calculados desde el catálogo vigente.
3. Si cambió un precio desde que se agregó el producto, o venció la cotización antes de cobrar, el POS actualiza el carrito y pide confirmación expresa antes de continuar.
4. Antes de mostrar el paso de pago, el POS verifica espacio y guarda localmente un borrador de cobro con UUID y folio reservado. Si falla esta escritura, no se cobra.
5. El operador cobra manualmente por el medio elegido. Para efectivo ingresa cuánto recibió el cliente.
6. Después de confirmar que se recibió el pago, el POS convierte localmente ese borrador en venta completada, calcula el vuelto y lo agrega a la cola. En línea, intenta enviarlo al backend; sin conexión, conserva la venta y continúa operando.
7. En línea, el POS envía la venta a `POST /api/orders/`. Si se creó durante una desconexión, la envía a `POST /api/orders/sync/` al recuperar conexión. El backend valida folio, UUID, turno y aritmética; luego guarda cabecera, líneas y modificadores en una sola transacción.

La cotización debe quedar asociada al usuario y turno, vencer a los cinco minutos y estar firmada por el servidor para que el cliente no pueda alterar precios entre la cotización y el registro. Si ya se recibió el pago y la cotización vence antes de registrar la venta, el POS conserva el cobro local y lo envía por el flujo de sincronización/reconciliación; nunca descarta una venta cobrada. La operación inicial de un solo equipo evita dos generadores de folio para el mismo turno; para incorporar más equipos se debe reemplazar por una asignación central o por rangos reservados.

## 4. Rutas propuestas

Todas las rutas requieren sesión autenticada, CSRF y permiso POS.

| Método y ruta | Propósito |
|---|---|
| `GET /api/orders/` | Consultar las últimas 50 ventas del operador autenticado y el UUID de su turno abierto. |
| `POST /api/orders/quote/` | Validar carrito y devolver una cotización firmada con precios y total vigentes, más aviso cuando el carrito deba actualizarse. No registra una venta. |
| `POST /api/orders/` | Registrar una venta pagada en línea usando el UUID, folio, cotización y datos de pago; es idempotente. |
| `POST /api/orders/sync/` | Recibir una venta creada offline con UUID y snapshots históricos; compara contra el catálogo actual, marca diferencias para revisión y es idempotente. En esta etapa requiere que el turno ya exista y siga abierto en el servidor. |
| `POST /api/orders/{uuid}/cancel/` | Anular una venta del turno abierto del operador con motivo obligatorio. |

## 5. Ejemplo de cotización

```json
{
  "uuid": "6ad2c871-6c9e-43a9-8ca2-fd2302f35fd2",
  "shift_order_number": 15,
  "created_at": "2026-11-02T20:12:00-03:00",
  "consumption_type": "PARA_LLEVAR",
  "items": [
    {
      "product_id": 24,
      "expected_name": "Churrasco Italiano",
      "expected_unit_price": 6500,
      "expected_updated_at": "2026-11-02T19:40:00-03:00",
      "quantity": 2,
      "notes": "Pan bien tostado",
      "modifiers": [
        { "modifier_id": 8, "expected_name": "Queso extra", "expected_price": 900, "quantity_per_unit": 2 },
        { "modifier_id": 12, "expected_name": "Sin mayo", "expected_price": 0, "quantity_per_unit": 1 }
      ]
    }
  ]
}
```

`quantity_per_unit` permite representar extras repetidos, por ejemplo doble queso. Para exclusiones su valor máximo es uno. El total de modificadores se multiplica por la cantidad de unidades de la línea.

El cliente envía el precio y marca de catálogo que tenía en pantalla solo para detectar cambios; esos valores nunca determinan el total de la cotización. El servidor devuelve siempre sus precios vigentes. Si detecta diferencias, devuelve `requires_confirmation: true`; el POS muestra el nuevo total y solo usa la cotización firmada después de la confirmación del operador.

Respuesta resumida propuesta:

```json
{
  "quote_token": "token-firmado-por-el-servidor",
  "valid_until": "2026-11-02T20:15:00-03:00",
  "requires_confirmation": false,
  "items": [
    {
      "product_id": 24,
      "product_name": "Nombre vigente",
      "quantity": 2,
      "unit_price": 6500,
      "modifiers_total_per_unit": 1800,
      "line_total": 16600
    }
  ],
  "subtotal": 16600,
  "total_amount": 16600
}
```

## 6. Ejemplo de registro de venta

```json
{
  "uuid": "6ad2c871-6c9e-43a9-8ca2-fd2302f35fd2",
  "shift_order_number": 15,
  "quote_token": "token-firmado-por-el-servidor",
  "created_at": "2026-11-02T20:12:00-03:00",
  "payment_method": "EFECTIVO",
  "amount_received": 20000,
  "confirm_repriced": false
}
```

Para `TRANSBANK` o `TRANSFERENCIA`, se omite `amount_received`; el servidor guarda `amount_paid` y `change_given` como nulos. Para efectivo, el servidor rechaza un monto menor que el total y calcula el vuelto.

La sincronización offline usa otro formato y nunca cambia los snapshots cobrados en el equipo:

```json
{
  "uuid": "6ad2c871-6c9e-43a9-8ca2-fd2302f35fd2",
  "shift_order_number": 15,
  "shift_uuid": "1fb305de-2b6e-4a72-8811-63ae8b35fdec",
  "created_at": "2026-11-02T20:12:00-03:00",
  "offline_created": true,
  "consumption_type": "PARA_LLEVAR",
  "payment_method": "EFECTIVO",
  "amount_received": 20000,
  "items": [
    {
      "product_id": 24,
      "product_name": "Nombre guardado en el POS",
      "quantity": 2,
      "unit_price": 6500,
      "notes": "Pan bien tostado",
      "modifiers": [
        { "modifier_id": 8, "modifier_name": "Queso extra", "quantity_per_unit": 2, "price_at_sale": 900 }
      ]
    }
  ]
}
```

El servidor recalcula subtotal, total y vuelto a partir de los snapshots que se cobraron y verifica la aritmética; no confía en totales enviados por el cliente. Compara nombres, precios y disponibilidad con el catálogo actual. Si hay diferencias, guarda la venta sin alterar los snapshots, la incluye en el turno y marca `requires_review` con el motivo. Repetir el mismo UUID y contenido devuelve la venta existente; usarlo con otros datos devuelve `409`. La primera implementación solo acepta turnos ya abiertos en el servidor; la apertura y el cierre originados sin conexión quedan pendientes de una cola ordenada de operaciones.

Respuesta resumida propuesta:

```json
{
  "uuid": "6ad2c871-6c9e-43a9-8ca2-fd2302f35fd2",
  "shift_order_number": 15,
  "created_at": "2026-11-02T20:12:00-03:00",
  "received_at": "2026-11-02T20:12:02-03:00",
  "consumption_type": "PARA_LLEVAR",
  "payment_method": "EFECTIVO",
  "subtotal": 16600,
  "total_amount": 16600,
  "amount_paid": 20000,
  "change_given": 3400,
  "status": "COMPLETADA",
  "requires_review": false
}
```

## 7. Respuestas de error relevantes

- `400 Bad Request`: datos inválidos, cantidad no positiva, modificador incompatible/no disponible, efectivo insuficiente o nota demasiado larga.
- `403 Forbidden`: falta sesión o permiso POS.
- `409 Conflict`: turno cerrado, cotización vencida, precios cambiados que requieren nueva confirmación o UUID reutilizado con contenido distinto.
- `404 Not Found`: producto, modificador o venta inexistente/no accesible.

Los errores de precio deben incluir el carrito recalculado y no registrar ni cobrar otra venta. Los errores nunca deben incluir contraseñas, tokens CSRF ni secretos.

## 8. Modelo y validaciones

- La API POS acepta solo `PARA_SERVIR` y `PARA_LLEVAR`; no acepta `DELIVERY`, `RETIRO` ni `CONSUMO_PROPIO`.
- `TRANSBANK` representa débito y crédito; la base también conserva métodos de pago fuera del POS para compatibilidad del modelo.
- `Order.cancelled_by` registra la cuenta compartida usada para anular; no identifica a la persona física.
- La base exige monto recibido y vuelto consistentes para efectivo; en Transbank y transferencia esos campos quedan vacíos.
- Mantener `shift_order_number` correlativo por turno. El POS local asigna el folio tanto en línea como offline; PostgreSQL rechaza duplicados mediante la restricción única existente.
- El frontend conserva la última respuesta de `GET /api/pos/catalog/` en IndexedDB y la recupera si falla la red. Esto solo permite consultar el catálogo conocido; no habilita cotizar, cobrar ni operar turnos offline.
- El frontend guarda y restaura el borrador editable (líneas, cantidades, modificadores, notas y opciones de pago) por UUID de turno en IndexedDB. Si la escritura local falla, bloquea la cotización y el registro online.
- Antes de mostrar los controles de pago, el frontend conserva en IndexedDB la cotización firmada, UUID, folio, fecha, tipo de consumo, snapshots cobrados, método y monto recibido. Si no puede guardarlos, no muestra el paso de pago.
- Al confirmar la recepción, guarda primero el estado `PAGO_RECIBIDO` y luego envía el mismo UUID y folio a `POST /api/orders/`. Si el servidor falla, mantiene el pago local y ofrece reintentar el registro sin volver a cobrar; si la cotización vence, conserva los snapshots para conciliación. Esto aún no es sincronización offline automática: falta la cola y la ruta de reconciliación para pagos que no puedan registrarse con la cotización vigente.
- El servidor marcará `requires_review` al detectar diferencias de catálogo cuando se implemente la sincronización.
- La cola local conserva el orden de apertura, ventas por folio, anulaciones y cierre. A las 00:30 hora de Santiago, el cierre automático se persiste en el equipo incluso sin conexión. Ante un error de sincronización, pausa solo las operaciones posteriores del mismo turno, mantiene intactos los datos locales y muestra el evento que requiere atención.

## 9. Decisiones de implementación

- Elegir y configurar el almacenamiento local persistente. Antes de iniciar el cobro, guardar un borrador local; si no se puede guardar, no permitir cobrar. Nunca eliminar ventas pendientes.
- Implementar la cotización firmada con vencimiento de cinco minutos y asociarla al usuario y al turno.
- Mantener un contador local persistente por turno para asignar el folio. El backend valida la restricción única y nunca renumera silenciosamente una comanda ya impresa.
- Mantener en una cola duradera la apertura (si está pendiente), ventas por folio y cierre. Ante un error, pausar operaciones posteriores del mismo turno y conservar todos los registros para reintento.

La API implementa catálogo POS, cotización firmada, registro online idempotente, sincronización idempotente de ventas offline y anulación auditada; `/pos` conserva localmente catálogo, borrador, cotización y marca de pago recibido. Las pruebas de `apps.sales` se ejecutan en SQLite temporal y no prueban concurrencia de PostgreSQL. Siguen pendientes la cola durable y su conexión automática al endpoint, sincronización de apertura/anulación/cierre, conciliación de ventas asociadas a turnos cerrados, cierre automático e impresión física.
