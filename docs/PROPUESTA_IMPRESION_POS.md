# Propuesta de impresión del POS

- **Estado:** panel de diagnóstico USB implementado; impresión de ventas reales aún pendiente de validar físicamente.
- **Base:** requisitos del proyecto, respuestas del usuario y video del POS antiguo recibido el 10 de noviembre de 2026.

## Hechos confirmados

- La impresora reportada es una DINON 9390 conectada por USB. El usuario indica que no instalaron un controlador manualmente y que el POS actual imprime.
- La arquitectura del proyecto especifica conexión USB directa, papel de 80 mm, protocolo ESC/POS, velocidad de 160 mm/s y gaveta por RJ11 (24 V, 1 A). Estos son requisitos de diseño documentados; la compatibilidad de la unidad física todavía no está probada.
- El flujo actual debe producir dos papeles: uno para que el cliente retire su pedido y otro para cocina.
- La gaveta se abre cuando se usa efectivo.
- El video muestra una pantalla de cobro en efectivo, el monto recibido y el vuelto, y un comprobante de retiro impreso. No se alcanza a ver la comanda de cocina ni confirmar cómo se envía la orden a la impresora.
- Para diseñar la primera versión se usará el ancho de 80 mm definido para la DINON 9390 en `docs/proyecto_sanmartin_pos_arquitectura.md`. La prueba física confirmará el ajuste de papel y área imprimible.

## Borrador de documentos

### Comprobante para el cliente

```text
             SAN MARTÍN
          VALE PARA RETIRAR

               N.º 001
          PARA LLEVAR · 12:34
          10 nov 2026

1 × Churrasco Italiano       $...
  + Extra queso              $...

TOTAL                        $...
Pago: Efectivo
Recibido                     $...
Vuelto                       $...

Conserve este número para retirar
             ¡Gracias!
```

El número de venta debe destacar a distancia. El comprobante no se presentará como boleta tributaria. El medio de pago, efectivo recibido y vuelto solo aparecen cuando corresponda.

### Comanda para cocina

```text
          SAN MARTÍN
        COMANDA COCINA

               N.º 001
             PARA LLEVAR
               12:34

1 × Churrasco Italiano
  + Extra queso
  Sin mayo
  Nota: sin tomate, por favor

--------------------------------
```

La comanda prioriza el folio, la cantidad y la preparación. No muestra precios ni datos del pago. Cada pedido se identifica con el mismo folio en ambos papeles.

## Reglas de operación propuestas

1. Guardar la venta en el servidor o en IndexedDB antes de preparar la impresión. Un error de impresión no anula ni duplica la venta.
2. Enviar los dos documentos en una misma acción de impresión, diferenciados como cliente y cocina; la reimpresión debe quedar identificada y conservar el folio original.
3. Guardar el estado de impresión por separado de la sincronización de la venta. El navegador no puede confirmar por sí solo que el papel salió correctamente; se debe mostrar el resultado como solicitado y permitir que el operador marque el papel como revisado o reimprima.
4. En pagos en efectivo, solicitar la apertura de gaveta por el canal que admita la impresora. No abrirla para Transbank o transferencia. Una devolución en efectivo al anular también requiere abrirla, según el contrato del proyecto.
5. Mantener el diseño configurable para el ancho real del papel y validarlo con el dispositivo antes de declarar compatibilidad.

## Datos pendientes para validar la conexión física

- Confirmar cómo aparece la DINON en Windows y si el POS anterior envía ESC/POS directamente por USB o usa una impresora/controlador instalado automáticamente. La arquitectura define USB directo, pero el video no muestra el canal de conexión.
- Confirmar el puerto RJ11 de la impresora y validar la apertura de gaveta en una venta y una devolución en efectivo. El diseño requiere abrirla solo para operaciones con efectivo.
- Comparar una foto legible de ambos impresos cuando esté disponible; el proyecto define su propósito, pero el video solo deja ver el comprobante de retiro.

## Validación antes de la prueba física

- Panel implementado en `/pos`, visible tras iniciar sesión aunque no haya turno abierto: vincula mediante WebUSB, imprime dos muestras ESC/POS (cliente y cocina) y ofrece un botón separado para pulsar la gaveta.
- Las muestras son ficticias, identificadas como prueba y no registran ventas. La prueba de papeles no abre la gaveta. La prueba de gaveta requiere confirmación explícita.
- Para validar: abrir `/pos` en Chrome o Edge desde el equipo conectado a la DINON; iniciar sesión; pulsar **Vincular impresora USB** y seleccionar solo la DINON; pulsar **Imprimir dos pruebas**; confirmar que salieron dos papeles legibles, completos, con acentos, buen ancho, corte adecuado y folio igual; comprobar que la cocina no muestra precios ni pagos. Revisar que la gaveta no se abrió por imprimir.
- Luego, con gaveta compatible conectada al RJ11 y despejada, pulsar **Probar gaveta**, confirmar el diálogo y anotar si abrió. No se debe usar sobre una caja ocupada durante esta prueba.
- Si WebUSB no aparece, no lista la DINON o falla al reclamar la interfaz, registrar navegador/versión y el texto de error; revisar en Windows el nombre/modelo de impresora y cómo aparece en Administrador de dispositivos. La impresión vía USB directo puede estar bloqueada si Windows tiene la interfaz ocupada por un controlador.
- La compatibilidad física sigue pendiente hasta comprobar ancho útil, caracteres, corte, dos papeles y gaveta con la unidad real. Esta pantalla no integra todavía la impresión con ventas, reimpresiones ni la cola offline.
