# Plan ordenado para completar el POS

- **Estado:** plan activo desde el 10 de noviembre de 2026.
- **Objetivo:** cerrar el POS por etapas pequeñas, con criterios verificables, sin repetir trabajo aceptado.
- **Alcance:** desarrollo local y aceptación funcional. Despliegue, cuentas reales del servidor, respaldos de producción y publicación corresponden al colega que administra el servidor y quedan fuera de este plan.
- **Regla de trabajo:** cada cambio visual debe contemplar y revisarse en los dos temas (claro y oscuro) y en las escalas aprobadas; cerrar cada etapa con revisión y pruebas pertinentes; hacer un commit cuando se complete un cambio grande o una etapa. No avanzar dejando fallos conocidos sin registrar.
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

**Aceptación:** se encuentra un producto por nombre completo y parcial, con o sin acentos; búsqueda y categoría se combinan; Escape y el botón de limpiar restauran resultados; Enter agrega el primer resultado y Tab/mouse permiten navegar y seleccionar productos; añadir productos no pierde cantidades, notas ni modificadores ya ingresados; funciona offline, en modo claro y oscuro y a las escalas aprobadas.

**Estado:** implementada y aceptada por el usuario el 10 de noviembre de 2026 en modo oscuro y claro; `npm run build` pasó. No depende de la DINON.

### 2. Sincronización y vigencia del catálogo

**Trabajo:** usar la ruta canónica `GET /api/pos/catalog/?updated_after=<ISO-8601 con zona horaria>`. Implementar actualización incremental de categorías, productos, disponibilidad y modificadores; conservar una copia local usable offline y mostrar cuándo se actualizó correctamente. Las categorías, productos y modificadores desactivados/no disponibles se eliminan de la copia local mediante listas `removed` explícitas. El POS actualiza al reconectar y consulta cambios cada 60 segundos mientras permanece online.

**Aceptación:** una modificación en servidor llega al POS online sin borrar borradores ni ventas; al perder conexión se conserva el último catálogo local; el estado de última actualización y cualquier error son comprensibles; al recuperar señal la actualización ocurre automáticamente. Probar producto nuevo, cambio de precio/nombre, cambio de disponibilidad, desactivación de producto/categoría/modificador y categoría sin productos disponibles.

**Estado:** implementada y aceptada manualmente por el usuario el 10 de noviembre de 2026. Confirmó actualización incremental, continuidad del borrador, disponibilidad offline y actualización automática al recuperar conexión. Pasaron 31 pruebas de `apps.sales` y `apps.catalog` en SQLite temporal, y `npm run build`.

**Prueba manual pendiente:** cambiar el nombre/precio de un producto y verificar la actualización; marcarlo no disponible y confirmar que desaparece junto con su categoría si era el último disponible; desactivar un modificador y confirmar que deja de ofrecerse en una venta nueva; desconectar y reconectar la API y comprobar que el catálogo guardado sigue disponible y se actualiza automáticamente; recargar `/pos` y verificar que borrador, líneas y cola de ventas no se pierden.

### 2.1 Gestión del catálogo desde el POS

**Trabajo:** ofrecer desde el apartado **Catálogo** dentro de `/pos` la creación, edición, retiro y restauración de productos, categorías y modificadores. La acción visible **Retirar de la carta** pide confirmación y oculta el registro de la carta QR y las ventas nuevas; **Restaurar** lo vuelve a activar. No se borra de la base de datos, para preservar referencias y ventas históricas. En una categoría, retirar oculta sus productos y restaurar recupera los que continúan activos y disponibles. La escritura requiere conexión, usa `sales.can_operate_pos` y se actualiza en Django/PostgreSQL; no existe una cola offline para cambios de catálogo. Todo operador POS comparte el permiso. Los cambios en productos se reflejan también en la carta pública. Las imágenes se gestionan mediante una ruta/URL; no se suben archivos. Los modificadores siguen siendo globales porque el esquema no los vincula a productos.

**Aceptación:** crear y actualizar producto, categoría y modificador; retirar y restaurar cada tipo; encontrar productos por nombre o categoría (sin distinguir tildes), limpiar la búsqueda y ver el estado sin resultados; comprobar confirmación, conservación del historial, reflejo en catálogo del POS y carta pública, sincronización automática y protección de usuarios sin permiso. Confirmar ambos temas y que offline se informa que se requiere reconexión y no se presenta como guardado.

**Estado:** aceptada manualmente por el usuario el 10 de noviembre de 2026 en tema claro y oscuro; confirmó que el producto se restauró correctamente. La función incluye búsqueda por nombre/categoría y acción reversible para retirar/restaurar. La versión inicial pasó 9 pruebas de `apps.catalog`; la interfaz pasó la compilación.

### 2.2 Promociones programadas para la carta QR

**Hallazgo documental:** el contrato actual deja los combos promocionales fuera del POS; cuatro combos siguen como contenido fijo en el frontend. El MER contempla `original_price` como precio tachado para promociones web futuras, pero no agrega fechas ni reglas de precio. El campo `badge` también es solo presentación. El contrato de ventas prohíbe descuentos en esta versión y el backend cotiza al precio regular. Por lo tanto, hoy el POS no permite programar promociones por día y editar solo el precio tachado produciría una carta que puede cobrar otro importe.

**Decisión del usuario:** mantener las promociones y combos actuales tal como aparecen, sin una opción nueva para programarlos por día. No cambiar precios ni reglas de venta. Si se retoma más adelante, primero se debe acordar el flujo para que QR, POS y cobros offline usen el mismo precio.

**Estado:** diferido por decisión del usuario; no bloquea la gestión del catálogo.

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

**Estado:** completado el 10 de noviembre de 2026 contra PostgreSQL 16.15 en la base temporal `test_sanmartin_pos`. Pasaron las tres pruebas de concurrencia de `apps/sales/test_postgres_concurrency.py`: apertura simultánea de turnos (solo uno queda abierto), reintento offline simultáneo con el mismo UUID (sin duplicar venta) y reutilización simultánea de folio con UUID distinto (conflicto rechazado, sin duplicación). Django eliminó la base temporal. `CREATEDB` fue concedido temporalmente a `sanmartin_dev` para esta ejecución y luego revocado; se verificó `rolcreatedb = false`. No se usó producción.

### 6. Dashboard y reportes de ventas

**Fundamento del proyecto:** `proyecto_sanmartin_pos_arquitectura.md` pide un dashboard de cierre de caja y horas punta; `PLAN_MAESTRO_POS.md` incluye reportes básicos de turno y propone horas punta tras validar las fechas; el diccionario MER exige preservar la hora real de la venta para estos análisis. El resumen de caja por turno ya está implementado y aceptado; no equivale a un dashboard histórico.

**Alcance de esta entrega:** pantalla de reportes con selector **Día / Mes**, fecha o mes seleccionable y valor por defecto del día actual. Muestra monto total de ventas completadas, cantidad de ventas, ticket promedio, montos y proporciones por medio de pago, anulaciones separadas, productos más vendidos por unidades, actividad por hora/día local y turnos con detalle de cierre (efectivo esperado/contado/diferencia). El gráfico permite alternar entre recaudación y número de ventas; el mes incluye ranking de horas punta. Los agregados se calculan en Django; no se descarga el historial completo al navegador. Las ventas offline se agrupan por el `created_at` original y aparecen al sincronizar. Los controles y gráficos son responsive y contemplan ambos temas.

**Secuencia técnica:** contrato, filtros y agregados protegidos implementados. La verificación PostgreSQL de ventas y concurrencia pasó el 10 de noviembre de 2026; queda cubrir la conciliación de reportes con datos conocidos en la aceptación integral.

**Aceptación:** comparar el día y el mes contra un conjunto de ventas conocido; comprobar que el gráfico diario se agrupa por hora y el mensual por día, y alterna monto/cantidad; revisar el ranking de horas punta; confirmar ventas offline según su hora original; anulación excluida de ventas completadas y mostrada aparte; rangos y límites de día/mes correctos en `America/Santiago`; totales por medio de pago conciliados con los turnos; temas claro/oscuro, pantalla angosta y permisos de acceso correctos.

**Estado:** el usuario aceptó los reportes **Día** y **Mes** en tema claro el 10 de noviembre de 2026. En las capturas, los pagos suman el total mostrado: día $24.000 en 6 ventas y mes $88.500 en 16 ventas; las anulaciones aparecen por separado. Las 29 pruebas funcionales de `apps.sales` y las tres pruebas de concurrencia pasaron en PostgreSQL 16.15. La implementación de reportes queda aceptada; la conciliación de datos conocidos se revisará en la aceptación integral. El contrato está en `docs/CONTRATO_API_REPORTES.md`.

### 7. Aceptación integral del POS

**Trabajo:** recorrer desde inicio de sesión hasta cierre con operaciones online, offline y reconexión; cubrir venta, anulación, pagos, modificaciones de catálogo, impresora, gaveta, reportes, tema/escala y confirmación al cerrar sesión. Probar recuperación de recarga y errores recuperables.

**Aceptación:** lista de casos con resultado aprobado y evidencia; sin pérdida ni duplicación de ventas; impresión y reportes conciliados con base de pruebas; defectos bloqueantes resueltos. Mantener las pruebas manuales de usuario separadas de las pruebas automatizadas.

### 8. Guía operativa local

**Trabajo:** documentar pasos diarios para abrir turno, cobrar, manejar mensajes de conexión/pago, reintentar, reimprimir, anular y cerrar; incluir el procedimiento ante caída de impresora/API.

**Aceptación:** un operador puede seguir la guía en el entorno de pruebas sin instrucciones verbales del desarrollador.

**Estado:** borrador creado en `docs/GUIA_OPERACION_POS.md`; incluye apertura, venta, pagos pendientes, operación offline, anulaciones, catálogo, reportes, cierre, preferencias y caída de API. La sección de impresión está marcada como pendiente, porque aún no se integró a las ventas. Falta recorrerla con un operador y completarla después de la prueba DINON.

## Fuera de este plan

- Despliegue, dominio/HTTPS del servidor, configuración de producción, cuentas reales, respaldos productivos, permisos de infraestructura y publicación: responsabilidad del colega administrador.
- Importación de ventas históricas anteriores al POS: no comprometida en el alcance vigente.
- Reportes o indicadores no nombrados arriba (por ejemplo, comparación entre periodos, exportación, márgenes/costos o metas): no se agregan por inferencia; se incorporan si el cliente los solicita.

## Próximo paso concreto

La concurrencia PostgreSQL ya quedó validada. El próximo hito dependiente del usuario es probar físicamente la DINON 9390; con ese modelo y los resultados se cerrará la integración de impresión real y reimpresión/gaveta. Mientras tanto, avanzar la guía operativa y preparar la lista de aceptación integral. El catálogo incremental y el dashboard Día/Mes ya fueron aceptados.

## Registro de avance

| Etapa | Estado | Evidencia / notas |
|---|---|---|
| Tema y escala | Aceptado | Probado y confirmado por el usuario el 10 nov 2026. |
| Búsqueda rápida | Aceptada | El usuario confirmó que se ve bien en ambos temas. |
| Catálogo incremental | Aceptado | El usuario confirmó actualización incremental, continuidad del borrador, uso del último catálogo offline y reconexión automática. 31 pruebas backend y build aprobados. |
| Gestión del catálogo desde `/pos` | Aceptada | El usuario aprobó los temas claro/oscuro y confirmó que el producto retirado se restauró. Búsqueda y retiro/restauración reversible; historial preservado. |
| Prueba física DINON | Pendiente | El usuario espera realizarla hoy o mañana. |
| Impresión real de ventas | Pendiente | Depende de la prueba física. |
| Suite de ventas en PostgreSQL | Completada | PostgreSQL 16.15; 29/29 pasaron; base temporal creada y eliminada; `CREATEDB` temporal de `sanmartin_dev` revocado. |
| PostgreSQL concurrencia | Completada | 3/3 pruebas pasaron en PostgreSQL 16.15; base temporal eliminada y `CREATEDB` revocado/verificado. |
| Dashboard día/mes | Aceptado | El usuario aprobó Día/Mes en tema claro; capturas del 10 nov muestran totales conciliados con pagos y anulaciones separadas; 29 pruebas `apps.sales` pasaron en PostgreSQL 16.15. |
| Aceptación integral | Pendiente | Tras completar los bloques anteriores. |
| Guía operativa | Borrador | `docs/GUIA_OPERACION_POS.md`; pendiente validar con operador y completar impresión tras la prueba DINON. |
