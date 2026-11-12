# Prueba de aceptación del cierre manual de caja

- **Fecha:** 9 de noviembre de 2026
- **Entorno:** desarrollo local con PostgreSQL
- **Resultado:** aprobada por el usuario

## Caso: efectivo esperado, efectivo contado y diferencia

### Preparación

1. Abrir un turno con fondo inicial de `$10.000`.
2. Registrar una venta completada en efectivo por `$2.000`.
3. Registrar una venta completada por Transbank o transferencia por `$3.000`.
4. Registrar una venta en efectivo por `$1.000` y anularla con un motivo.
5. Cerrar el turno ingresando `$11.500` como efectivo contado.

### Resultado esperado

- Efectivo esperado por el sistema: `$12.000` (`$10.000` de fondo inicial + `$2.000` de venta completada en efectivo).
- La venta no efectiva no se suma al efectivo de la gaveta.
- La venta anulada no se suma al efectivo esperado porque se asume devuelto al cliente.
- Efectivo contado: `$11.500`.
- Diferencia (`counted_cash - final_cash`): `-$500`, mostrada como `Faltante: $500`.

### Resultado observado

El usuario confirmó que el cierre mostró:

- Efectivo esperado: `$12.000`.
- Efectivo contado: `$11.500`.
- Diferencia: `Faltante: $500`.

**Estado: aprobado.**

## Caso: resumen de ventas por medio de pago

### Preparación

1. Abrir un turno con fondo inicial de `$10.000`.
2. Registrar una venta completada en efectivo por `$2.000`.
3. Registrar una venta completada por Transbank por `$3.000`.
4. Registrar una venta completada por transferencia por `$4.000`.
5. Registrar una venta en efectivo por `$1.000` y anularla con motivo.
6. Revisar el resumen durante el turno y después cerrarlo con `$12.000` contados.

### Resultado esperado

- Efectivo: `$2.000` en 1 venta.
- Transbank: `$3.000` en 1 venta.
- Transferencia: `$4.000` en 1 venta.
- La venta anulada no aparece en los totales ni cantidades de ventas completadas.
- Efectivo esperado: `$12.000` (`$10.000` de fondo inicial + `$2.000` de venta completada en efectivo).
- Con `$12.000` contados, la diferencia es cero y la caja queda cuadrada.

### Resultado observado

El usuario confirmó que el resumen y el cierre mostraron el resultado esperado.

**Estado: aprobado.**

## Alcance de esta aceptación

Estas pruebas validan el cierre manual, el cálculo del efectivo esperado y el resumen por medio de pago. No validan el cierre automático de las 00:30, el funcionamiento sin conexión, la sincronización ni la impresora DINON 9390.
