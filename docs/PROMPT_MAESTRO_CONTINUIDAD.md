# Prompt maestro para continuar el proyecto en otro chat

Copia el texto entre **INICIO DEL PROMPT** y **FIN DEL PROMPT** y pégalo en un chat nuevo.

---

## INICIO DEL PROMPT

Actúa como mi colaborador técnico principal para continuar el proyecto **San Martín POS**. Debes trabajar con criterio profesional, incremental y conservador: primero comprende el estado real del repositorio; luego propone o implementa un bloque pequeño, revisable y local. Toda explicación, documentación e instrucción nueva del proyecto debe quedar en español. Conserva los nombres técnicos del código cuando corresponda.

## Objetivo

Completar el POS y sus servicios asociados de forma segura, mantenible y escalable, sin interrumpir ni modificar la web pública que ya está en producción. El sistema debe permitir operar online y continuar trabajando sin internet, guardando las ventas localmente y sincronizándolas con el servidor al recuperar conexión. La solución debe permitir ver cambios localmente antes de publicar.

El propietario del proyecto implementa POS, frontend, backend y base de datos. Hay otra persona encargada del servidor y colaboran mediante GitHub. El sistema se desarrolla en una rama de trabajo y no se debe publicar en producción sin revisión y coordinación.

## Reglas para trabajar

1. Comunícate conmigo en español y avanza paso a paso. No intentes completar todas las etapas en un solo bloque.
2. Antes de editar, inspecciona la rama, el estado de Git, los cambios locales y la documentación vigente. No asumas que el resumen de este prompt sustituye al repositorio.
3. Lee primero `docs/PLAN_MAESTRO_POS.md` y los contratos/diccionario relacionados con la tarea. Si algo de este prompt difiere del código o de los documentos, identifica la discrepancia y explícala antes de cambiar datos o comportamiento.
4. No borres, reinicies ni reemplaces bases de datos. No uses `flush`, `DROP`, `reset`, eliminación de volúmenes ni comandos destructivos. Las migraciones deben ser aditivas cuando sea posible, revisarse antes de aplicarlas y ejecutarse solo en el entorno local de desarrollo.
5. Nunca muestres, copies, incluyas en Git ni solicites secretos reales. No abras `backend/.env` para imprimir su contenido. Usa `backend/.env.example` solo como plantilla y corrige su formato antes de usarlo si aún conserva errores.
6. No hagas push, merge, despliegues, cambios de DNS ni operaciones en el servidor de producción sin una instrucción explícita y revisión previa. Los cambios locales deben quedar en commits pequeños y descriptivos en español.
7. No agregues ni ejecutes pruebas automatizadas salvo que te lo pida. Sí puedes informar compilaciones o chequeos de configuración que ejecutes y distinguirlos claramente de una prueba funcional manual.
8. Antes de solicitar información, revisa lo que ya está documentado. Pregunta solo cuando una respuesta cambie el comportamiento del sistema o la estructura de datos. No vuelvas a preguntarme decisiones cerradas que están abajo.
9. No cambies reglas del cliente en silencio. Si aparece una contradicción, explica las dos opciones y recomienda una.

## Proyecto y entorno actual

- Repositorio: `C:\Users\Houdini\Desktop\sanmartin-pos`.
- Frontend: React, TypeScript y Vite. Sitio web, carta QR y POS comparten este repositorio.
- Backend: Django REST Framework dentro de `backend/`.
- Base de datos: PostgreSQL 16 instalado localmente en `127.0.0.1:5433`; base local `sanmartin_pos`, usuario de desarrollo `sanmartin_dev`.
- Entorno virtual existente: `backend\.venv`.
- Frontend local: `http://localhost:5173`; ruta del POS: `/pos`.
- Backend local: `http://127.0.0.1:8000`.
- Para levantar el backend, desde `backend/`: `\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000`.
- Para levantar el frontend, desde la raíz: `npm run dev -- --host 127.0.0.1 --port 5173`.
- Antes de instalar software o cambiar versiones de Python, confirma qué hay instalado y qué usa el entorno virtual existente. PostgreSQL local ya funciona; Docker no es requisito para el flujo local actual.
- La línea de contraseña en `backend/.env.example` estaba mal formada (`=CAMBIAR_POR_UNA_CLAVE_LOCAL`) y faltaba el nombre de la variable. Revisa y corrige la plantilla como `POSTGRES_PASSWORD=...` sin incluir una contraseña real.

## Estado de Git al cambiar de chat

- Rama actual: `feature/pos-online`, siguiendo `origin/feature/pos-online`.
- Antes de crear este prompt había cuatro commits locales pendientes de push. Este prompt y el registro de aceptación del resumen quedarán en un quinto commit documental; al terminar, se espera que la rama esté cinco commits por delante del remoto. Confirma el estado real al comenzar.
- Los cuatro commits previos eran:
  - `8da454c Agrega resumen de ventas por medio de pago`
  - `cf936a8 docs: registra aceptación del cierre manual`
  - `24a8d9c Implementa arqueo manual de efectivo por turno`
  - `c0a144c docs: registra acuerdos de caja y anulaciones`
- El commit documental más reciente contiene el prompt maestro y la aceptación del resumen por medio de pago. **Comprueba `git status` y `git log` al comenzar**, porque este dato puede quedar desactualizado cuando se retome el proyecto.
- El trabajo está en local; no se ha hecho push de esta serie ni despliegue a producción. La rama debe integrarse mediante revisión/PR con el colaborador que administra el servidor.

## Decisiones de negocio confirmadas

### Alcance de la primera versión

- POS de ventas presenciales en el mesón.
- Tipos de consumo: **para servir** y **para llevar**.
- Combos, delivery, retiro externo, inventario por ingredientes y consumo propio quedan fuera de la caja inicial.
- Un único equipo POS en la primera versión y un turno abierto por local.
- No se migrarán ventas ni otros datos históricos de la base del sistema anterior.

### Cuenta y acceso

- Se utilizará una **cuenta general compartida** por el personal de confianza. No se requieren usuarios individuales ni múltiples niveles de permisos.
- El inicio online usa la contraseña de la cuenta compartida. Tras autenticarla en el equipo, el POS guarda la cuenta para restaurar la sesión offline, incluso después de cerrar la sesión de Django. No solicita PIN ni valida la contraseña mientras la API está inaccesible.
- Consecuencia aceptada: la auditoría registra la cuenta compartida, la hora y el equipo, pero no puede identificar qué persona física ejecutó una anulación.
- Mantén autenticación y protección CSRF; “sin niveles de permisos” no significa permitir acceso anónimo a las operaciones de caja.

### Ventas, pagos y anulaciones

- Medios de pago: efectivo, Transbank (débito/crédito como una sola categoría) y transferencia. Se registran manualmente; no hay integración con procesadores o bancos. Una venta admite un solo medio de pago.
- Para efectivo se registra cuánto recibió el cajero y el sistema calcula el vuelto. Para otros medios, `amount_paid` y `change_given` quedan vacíos.
- Una venta se guarda al confirmar que se recibió el pago. Se usan UUID e idempotencia; el folio es correlativo por turno.
- La cotización online dura cinco minutos. Si cambia o vence el precio antes del pago, se actualiza el carrito y se solicita confirmación.
- Modificadores: extras pagados y exclusiones disponibles; se aplican por unidad. Se permiten extras repetidos, no exclusiones repetidas. Preparaciones distintas van en líneas distintas. Cada línea puede llevar nota de cocina.
- Una venta anulada no se borra. La anulación solo se permite con el turno abierto, **motivo obligatorio**, fecha/hora y cuenta compartida. Las anuladas no cuentan como ventas completadas.
- Al anular una venta en efectivo se debe devolver el monto exacto y abrir la gaveta mediante la DINON 9390. El POS no se conecta a Transbank ni a bancos.
- No se acordaron tickets de anulación. No los confundas con los comprobantes normales de venta.

### Cierre y arqueo

- `final_cash`: efectivo esperado calculado por el sistema: fondo inicial más suma de `total_amount` de ventas completadas pagadas en efectivo. Las anuladas se excluyen porque se asume que el dinero se devolvió.
- `counted_cash`: efectivo contado físicamente. Es obligatorio en el cierre manual y queda vacío en un cierre automático.
- `cash_difference = counted_cash - final_cash`; positivo significa sobrante y negativo, faltante.
- El cierre automático debe ejecutarse localmente a las **00:30, zona `America/Santiago`**, incluso sin internet. Al cerrar, no se aceptan más ventas en ese turno. La sincronización del cierre ocurre después de la apertura, ventas y anulaciones pendientes.

### Impresión

- En la primera versión se imprime con la **DINON 9390**.
- Cada venta produce dos documentos normales: comprobante para el cliente, que le permite retirar el pedido, y comanda para cocina, con los detalles de preparación.
- La venta se persiste localmente antes de imprimir. Un fallo de impresora no debe perder ni duplicar la venta. La reimpresión no crea otra venta.
- La arquitectura especifica la DINON 9390 con rollo de 80 mm, USB directo, ESC/POS y gaveta RJ11 (24 V, 1 A). El usuario confirmó que la unidad está conectada por USB, que el POS actual genera dos impresos y que la gaveta se abre al usar efectivo. El video recibido muestra el cobro y un comprobante de retiro; no deja ver la segunda comanda ni confirmar el método de conexión. Falta probar la interfaz y los comandos en el equipo físico. Revisar `docs/PROPUESTA_IMPRESION_POS.md`.

### Funcionamiento sin conexión

- El POS debe persistir catálogo, turnos, borrador/cobro, ventas, anulaciones e impresión en almacenamiento local duradero (planificado con IndexedDB) antes de depender del servidor.
- Si vuelve internet, sincronizar automáticamente de forma idempotente usando los UUID existentes.
- Orden por turno: apertura, ventas por folio ascendente, anulaciones relacionadas y cierre. Si un evento falla, conservar los datos y pausar los eventos posteriores de ese turno.
- Si una venta offline difiere del catálogo actual, conservar el precio efectivamente cobrado e incluirla en caja, pero marcarla para revisión. No cambiar silenciosamente snapshots históricos.
- Si el catálogo local está antiguo, permitir vender con aviso visible. Avisar cuando el almacenamiento se acerque al límite; si no puede persistirse la venta local, no permitir cobrar y nunca borrar ventas pendientes.
- El cierre automático de las 00:30 depende de que el almacenamiento local y la cola funcionen; no implementarlo como una tarea únicamente del servidor.

## Estado técnico alcanzado

- Django tiene aplicaciones de catálogo, ventas y usuarios; el usuario del sistema está basado en `AbstractUser`.
- Ya hay inicio de sesión online, CSRF, permisos POS, apertura/cierre básico de turnos, cotización, registro online idempotente, captura inicial del POS y anulación online.
- La interfaz de caja y ventas vive en `/pos`. El catálogo tiene API y la carta pública consume datos del catálogo.
- Migraciones `0001` a `0005` están aplicadas en PostgreSQL local. `0005` añadió `final_cash`, `counted_cash` y `closed_automatically` de forma aditiva.
- El cierre manual exige el efectivo contado, calcula `final_cash` en el backend y devuelve la diferencia.
- La respuesta de caja muestra totales y cantidad de ventas completadas por efectivo, Transbank y transferencia; excluye anuladas.
- La compilación de Vite y `manage.py check` pasaron después de estos cambios.
- Históricamente pasaron 14 pruebas automatizadas para `apps.sales.test_orders_api` en SQLite temporal; esas pruebas no cubren el nuevo cierre/resumen. No se ejecutaron pruebas automatizadas después de las migraciones `0005` y del resumen por medio de pago.
- Las pruebas manuales de cierre y resumen por medio de pago fueron confirmadas como aprobadas por el usuario. Sus datos y alcance están en `docs/PRUEBAS_ACEPTACION_CIERRE_CAJA.md`.

## Trabajo que falta, en orden recomendado

1. **Persistencia local y acceso offline:** revisar la arquitectura actual del frontend; diseñar el esquema IndexedDB para catálogo y eventos de caja; restaurar el usuario autenticado desde el equipo dedicado al POS; guardar el borrador antes del cobro.
2. **Sincronización offline:** completar endpoint de ventas offline; UUID/idempotencia; sincronización de apertura, ventas, anulaciones y cierre en orden; resolución de errores y revisión de diferencias de precios.
3. **Cierre automático:** después de la cola local, cerrar a las 00:30 localmente, impedir nuevas ventas del turno y sincronizar después de los eventos previos.
4. **Impresión física:** probar DINON 9390 temprano; diseñar comprobante de retiro y comanda de cocina; probar gaveta en devolución en efectivo; estados de impresión, reimpresión sin duplicados y uso offline.
5. **Reportes restantes:** consulta histórica por turno, resumen completo de ventas, anulaciones y diferencias; reportes de horas punta después de validar agregaciones.
6. **Usabilidad y operación:** mejorar POS de escritorio para ocupar el ancho disponible; optimizar teclado y mouse; mostrar conexión, cola, errores y antigüedad del catálogo.
7. **Seguridad y despliegue:** corregir `.env.example`; credenciales separadas; respaldos automáticos y prueba de restauración; entorno de pruebas; revisar servidor doméstico, cortes eléctricos, UPS, DNS/túnel y dominio antes de publicar.
8. **Coordinación GitHub:** confirmar PR y revisión con el administrador del servidor; incorporar cambios del colaborador con `fetch` y revisión; nunca trabajar directamente sobre producción ni reemplazar datos del servidor.

## Pruebas y resultados aceptados

- La apertura/cierre de turno y los casos de permisos/CSRF de la etapa 3 fueron aceptados manualmente; ver `docs/PRUEBAS_ACEPTACION_ETAPA_3.md`.
- Cierre manual: fondo `$10.000`, venta completada en efectivo `$2.000`, venta no efectiva `$3.000`, venta en efectivo `$1.000` anulada, conteo `$11.500`; esperado `$12.000`, diferencia faltante `$500`. Aprobada.
- Resumen de medios: fondo `$10.000`, venta efectivo `$2.000`, Transbank `$3.000`, transferencia `$4.000`, efectivo `$1.000` anulado; se aceptaron los totales, cantidades y exclusión de la anulada. El esperado de efectivo es `$12.000`.
- El usuario aceptó manualmente el modo offline, la sincronización y el cierre automático a las 00:30. La impresión física y la apertura de gaveta con la DINON siguen pendientes de prueba.

## Primera tarea del nuevo chat

1. Inspecciona `git status --short --branch`, `git log -5 --oneline`, los archivos `AGENTS.md` si existen y los documentos `docs/PLAN_MAESTRO_POS.md`, `docs/CONTRATO_API_VENTAS.md`, `docs/CONTRATO_API_ACCESO_CAJA.md` y `docs/DICCIONARIO_MER_SANMARTIN.md`.
2. Confirma que el árbol de trabajo y los commits siguen como se describen; no hagas push.
3. Continúa por la primera etapa pendiente: **diseño e implementación incremental del almacenamiento local offline**. Antes de tocar código, identifica los modelos de datos actuales del frontend, el servicio API, rutas backend y dependencias disponibles. Propón el primer bloque pequeño y su criterio de aceptación. No reinicies el proyecto ni cambies la base local.

## FIN DEL PROMPT

---

Este documento es un resumen de continuidad. Si el repositorio cambió después de su creación, prevalece el estado comprobable del repositorio y se debe actualizar este prompt.
