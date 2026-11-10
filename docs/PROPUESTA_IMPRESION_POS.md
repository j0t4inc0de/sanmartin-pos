# Propuesta de impresión del POS

- **Estado:** borrador para revisión; diseño de formato previo a la integración con la DINON 9390.
- **Base:** requisitos del proyecto, respuestas del usuario y video del POS antiguo recibido el 10 de noviembre de 2026.

## Hechos confirmados

- La impresora reportada es una DINON 9390 conectada por USB. El usuario indica que no instalaron un controlador manualmente y que el POS actual imprime.
- El flujo actual debe producir dos papeles: uno para que el cliente retire su pedido y otro para cocina.
- La gaveta se abre cuando se usa efectivo.
- El video muestra una pantalla de cobro en efectivo, el monto recibido y el vuelto, y un comprobante de retiro impreso. No se alcanza a ver la comanda de cocina ni confirmar cómo se envía la orden a la impresora.
- El ancho del rollo no está confirmado. Algunas fichas comerciales describen la 9390 con papel de 80 mm; debe verificarse en el equipo o midiendo el rollo antes de fijar el formato.

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

## Datos aún por confirmar con la persona que tiene la impresora

- Ancho del rollo: medirlo o fotografiar la etiqueta/rollo.
- Qué nombre aparece para la impresora en **Configuración de Windows → Impresoras y escáneres**; aclarar si "sin controlador" significa que Windows la instaló automáticamente o que el POS se comunica directamente por USB.
- Si la gaveta está conectada al puerto de la impresora y si se abre automáticamente durante la venta en efectivo, el reembolso en efectivo o ambos.
- Si el POS antiguo imprime la boleta y la comanda sin pasos adicionales y cómo se distinguen los dos papeles.
- Una foto legible de ambos impresos para reproducir el contenido y la jerarquía visual actuales.

## Validación antes de la prueba física

- Revisar una vista previa de ambos documentos en pantalla y exportarlos a PDF para comparar contenido.
- Verificar ventas en efectivo, Transbank y transferencia; solo efectivo debe abrir la gaveta.
- Simular modo offline: venta persistida localmente, impresión independiente de sincronización y reimpresión sin crear otra venta.
- Con la DINON disponible, verificar ancho, caracteres, corte, los dos papeles y la gaveta. Hasta completar esta prueba, la impresión física permanece pendiente.
