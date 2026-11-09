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

## Alcance de esta aceptación

Esta prueba valida el cierre manual y el cálculo del efectivo esperado para un turno. No valida el cierre automático de las 00:30, el funcionamiento sin conexión, la sincronización ni la impresora DINON 9390.
