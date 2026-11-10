# Plan ordenado para completar el POS

- **Estado:** plan activo desde el 10 de noviembre de 2026.
- **Objetivo:** cerrar el POS por etapas pequeñas, con criterios verificables, sin repetir trabajo aceptado.
- **Alcance:** desarrollo local y aceptación funcional. Despliegue, cuentas reales del servidor, respaldos de producción y publicación corresponden al colega que administra el servidor y quedan fuera de este plan.
- **Regla de trabajo:** cerrar cada etapa con revisión y pruebas pertinentes; hacer un commit cuando se complete un cambio grande o una etapa. No avanzar dejando fallos conocidos sin registrar.
- **Fuente de verdad:** este documento reemplaza el orden de trabajo de las listas históricas de `PLAN_MAESTRO_POS.md` y `PROMPT_MAESTRO_CONTINUIDAD.md`. Esos documentos conservan decisiones y contexto; sus listas antiguas pueden estar desactualizadas.

## Estado confirmado

### Aceptado por el usuario

- Acceso online con contraseña y continuación offline con el perfil guardado en el equipo; no se usa PIN.
- Detección de caída de API sin recargar y reconexión/sincronización automática.
- Ventas, anulaciones y apertura/cierre offline; cierre automático a las 00:30, hora de `America/Santiago`; conciliación de una venta offline tardía.
- Resumen de cierre por medio de pago, efectivo esperado, efectivo contado y diferencia.
- Tema claro/oscuro y escala de visualización. El usuario confirmó que ya los probó y los acepta; no se consideran pendientes.
- Ajustes recientes de interfaz del POS: filtros de categoría visibles sin barra horizontal, tipo de pedido bajo los productos agregados y desplazamiento normal restaurado. Se consideran implementados; se revisarán en la aceptación integral, sin reabrir diseño salvo que aparezca un defecto.

### Pendiente de prueba física cercana

- DINON 9390 por USB: probar vinculación WebUSB, ancho útil, legibilidad y acentos, corte, dos comprobantes (cliente y cocina) y gaveta conectada por RJ11. El usuario espera hacer esta prueba hoy o mañana.
- La prueba diagnóstica actual solo envía muestras y un pulso de gaveta. **No imprime ventas reales todavía.** La aceptación física del diagnóstico tampoco completa la integración de impresión.

## Orden de trabajo

Las etapas de desarrollo se pueden avanzar mientras se coordina la prueba física. Si la prueba revela que WebUSB o ESC/POS no funciona con esta unidad, primero se resuelve el método de conexión antes de integrar impresión de ventas.

### 1. Búsqueda rápida en el POS

**Trabajo:** agregar una búsqueda visible por nombre de producto, compatible con teclado y mouse, que funcione junto a los filtros de categoría y respete el tema y la escala actuales. Incluir una acción clara para limpiar la búsqueda y un estado vacío útil. La búsqueda debe trabajar sobre el catálogo local para seguir disponible offline.

**Aceptación:** se encuentra un producto por nombre completo y parcial, con o sin acentos; búsqueda y categoría se combinan; Escape y el botón de limpiar restauran resultados; Enter agrega el primer resultado y Tab/mouse permiten navegar y seleccionar productos; añadir productos no pierde cantidades, notas ni modificadores ya ingresados; funciona offline y a las escalas aprobadas.

**Estado:** implementada el 10 de noviembre de 2026; `npm run build` pasó. Falta aceptación manual en `/pos` para confirmar búsqueda, combinación con filtros, teclado, mouse, limpieza, carrito, modo offline y escalas. No depende de la DINON.

### 2. Sincronización y vigencia del catálogo

**Trabajo:** definir una ruta canónica para consultar cambios del catálogo, porque los documentos mencionan rutas distintas. Implementar actualización incremental de categorías, productos, disponibilidad y modificadores; conservar una copia local usable offline y mostrar cuándo se actualizó correctamente. Definir cómo se reflejan desactivaciones y productos que dejan de estar disponibles.

**Aceptación:** una modificación en servidor llega al POS online sin borrar borradores ni ventas; al perder conexión se conserva el último catálogo local; el estado de última actualización y cualquier error son comprensibles; al recuperar señal la actualización ocurre automáticamente. Confirmar pruebas con producto nuevo, cambio de precio/nombre, cambio de disponibilidad y desactivación.

**Estado:** pendiente de desarrollo y de resolver la diferencia documental de rutas.

### 3. Prueba física de la DINON 9390

**Trabajo del operador con la máquina:** seguir `docs/PROPUESTA_IMPRESION_POS.md`; registrar navegador, dispositivo USB seleccionado, ancho medido, resultado de los dos papeles, corte, acentos y gaveta. La prueba de gaveta se hace solo con autorización/área despejada y sin efectivo dentro.

**Aceptación:** se confirma qué interfaz funciona, el ancho real del papel y si la gaveta responde. Si algo falla, guardar el mensaje/error y ajustar el plan técnico antes de implementar impresión de ventas.

**Estado:** pendiente de acceso a la máquina; prevista para hoy o mañana.

### 4. Integración de impresión con ventas

**Trabajo:** imprimir comprobante de cliente y comanda de cocina a partir de una venta ya persistida localmente. Mantener el resultado de impresión separado del resultado de registro/sincronización. Implementar reimpresión de la misma venta sin duplicar cobros ni folios. Activar gaveta solo para efectivo y respetar el flujo acordado para devoluciones en efectivo al anular. La cola offline debe permitir imprimir localmente y sincronizar después.

**Aceptación:** probar venta online y offline; dos comprobantes legibles; el de cocina no muestra precios ni medio de pago; gaveta no se abre en Transbank/transferencia y sí en efectivo; desconectar o apagar la impresora no pierde ni duplica la venta; reimprimir no crea otra venta; estado de impresión comprensible y recuperable.

**Dependencia:** resultado de la etapa 3.

### 5. Verificación de datos y concurrencia con PostgreSQL

**Trabajo:** ejecutar escenarios de ventas simultáneas, folio por turno, idempotencia, cierre y sincronización tardía contra una base PostgreSQL de pruebas separada. Revisar que no se usen datos reales ni la base productiva.

**Aceptación:** no hay folios duplicados ni ventas duplicadas; el total y el efectivo esperado se mantienen correctos; los conflictos quedan rechazados o marcados para revisión de forma explícita. Registrar comandos, versión PostgreSQL y resultados en una prueba de aceptación.

**Estado:** pendiente. Las pruebas automatizadas existentes en SQLite no sustituyen este paso.

### 6. Dashboard y reportes de ventas

**Fundamento del proyecto:** `proyecto_sanmartin_pos_arquitectura.md` pide un dashboard de cierre de caja y horas punta; `PLAN_MAESTRO_POS.md` incluye reportes básicos de turno y propone horas punta tras validar las fechas; el diccionario MER exige preservar la hora real de la venta para estos análisis. El resumen de caja por turno ya está implementado y aceptado; no equivale a un dashboard histórico.

**Propuesta de alcance inicial:** una pantalla de reportes con selector **Día / Mes**, fecha o mes seleccionable y valores por defecto del día actual. Mostrar monto total de ventas completadas, cantidad de ventas, venta promedio, totales y cantidades por medio de pago, anulaciones separadas y productos más vendidos. El gráfico de horas punta queda como parte del dashboard, calculado con la hora del cobro guardada por el POS en `America/Santiago`, no por la hora de sincronización. Los turnos deben poder consultarse por día y abrir el detalle del cierre, incluido el efectivo esperado, contado y la diferencia.

**Secuencia técnica:** primero fijar contrato, filtros de fecha, zona horaria y reglas para anulaciones; después implementar consultas agregadas seguras en backend; luego construir la vista responsive y sus estados de carga/sin datos/error; finalmente reconciliar totales con ventas y cierres de turnos conocidos. No calcular reportes descargando todas las ventas al navegador.

**Aceptación:** comparar el día y el mes contra un conjunto de ventas conocido; confirmar ventas offline según su hora original; anulación excluida de ventas completadas y mostrada aparte; rangos y límites de día/mes correctos en `America/Santiago`; totales por medio de pago conciliados con los turnos; permisos de acceso correctos.

**Estado:** el resumen de turno está aceptado; la consulta histórica/dashboard y horas punta están pendientes. Las métricas propuestas se deben confirmar con el cliente antes de cerrar el diseño.

### 7. Aceptación integral del POS

**Trabajo:** recorrer desde inicio de sesión hasta cierre con operaciones online, offline y reconexión; cubrir venta, anulación, pagos, modificaciones de catálogo, impresora, gaveta, reportes, tema/escala y confirmación al cerrar sesión. Probar recuperación de recarga y errores recuperables.

**Aceptación:** lista de casos con resultado aprobado y evidencia; sin pérdida ni duplicación de ventas; impresión y reportes conciliados con base de pruebas; defectos bloqueantes resueltos. Mantener las pruebas manuales de usuario separadas de las pruebas automatizadas.

### 8. Guía operativa local

**Trabajo:** documentar pasos diarios para abrir turno, cobrar, manejar mensajes de conexión/pago, reintentar, reimprimir, anular y cerrar; incluir el procedimiento ante caída de impresora/API.

**Aceptación:** un operador puede seguir la guía en el entorno de pruebas sin instrucciones verbales del desarrollador.

## Fuera de este plan

- Despliegue, dominio/HTTPS del servidor, configuración de producción, cuentas reales, respaldos productivos, permisos de infraestructura y publicación: responsabilidad del colega administrador.
- Importación de ventas históricas anteriores al POS: no comprometida en el alcance vigente.
- Reportes o indicadores no nombrados arriba (por ejemplo, comparación entre periodos, exportación, márgenes/costos o metas): no se agregan por inferencia; se incorporan si el cliente los solicita.

## Próximo paso concreto

Completar la aceptación manual de la búsqueda rápida implementada en `/pos`. La prueba DINON se puede ejecutar cuando esté disponible la máquina sin frenar este trabajo. Después iniciar la etapa 2, sincronización incremental del catálogo; seguir con la integración de impresión según el resultado físico, luego PostgreSQL, dashboard, aceptación integral y guía.

## Registro de avance

| Etapa | Estado | Evidencia / notas |
|---|---|---|
| Tema y escala | Aceptado | Probado y confirmado por el usuario el 10 nov 2026. |
| Búsqueda rápida | Implementada; falta aceptación manual | `npm run build` pasó; verificar los casos de la etapa 1 en `/pos`. |
| Catálogo incremental | Pendiente | Resolver ruta canónica y propagación. |
| Prueba física DINON | Pendiente | El usuario espera realizarla hoy o mañana. |
| Impresión real de ventas | Pendiente | Depende de la prueba física. |
| PostgreSQL concurrencia | Pendiente | Base de pruebas separada. |
| Dashboard día/mes | Pendiente | Métricas iniciales propuestas arriba; validar con cliente. |
| Aceptación integral | Pendiente | Tras completar los bloques anteriores. |
| Guía operativa | Pendiente | Último entregable local. |
