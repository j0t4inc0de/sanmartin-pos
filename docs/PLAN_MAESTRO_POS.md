# Plan maestro de desarrollo — San Martín POS

- **Versión:** 1.13 — categorías visibles y orden de venta
- **Fecha:** 10 de noviembre de 2026
- **Responsable del POS, backend y base de datos:** Propietario del proyecto
- **Estado:** Base técnica migrada; autenticación online con contraseña, detección de caída de API sin recargar, inicio offline desde la cuenta guardada, turnos y ventas online/offline, anulaciones locales de ventas en cola, reconexión automática y cierre automático disponibles y aceptados manualmente. El usuario confirmó las pruebas de sesión, venta, reconexión, apertura/cierre, anulación offline y cierre automático a las 00:30 con Django detenido. La conciliación defensiva de ventas y anulaciones recibidas después del cierre del servidor está implementada; la prueba física de impresión sigue pendiente por disponibilidad de la DINON.

---

## 1. Propósito

Construir el sistema de ventas del Food Truck San Martín de forma gradual, segura y mantenible, manteniendo el sitio web y la carta QR actuales en funcionamiento. El POS debe permitir operar la caja, conservar un registro confiable de las ventas y facilitar mejoras futuras sin alterar el historial.

Este documento organiza el trabajo. Las especificaciones de arquitectura y datos existentes son referencias que deben revisarse antes de convertirse en código o migraciones.

## 2. Estado de partida

- El repositorio contiene un frontend React, TypeScript y Vite para la landing, la carta QR y el POS en `/pos`.
- `backend/` contiene una API Django REST Framework y el proyecto usa PostgreSQL para el desarrollo local.
- El catálogo de caja se obtiene desde `GET /api/pos/catalog/` y se conserva localmente en IndexedDB para recuperarlo si falla la conexión.
- El borrador, las cotizaciones, la sesión previamente autenticada, los eventos de apertura/cierre y las ventas cobradas se guardan localmente. Al recuperar conexión, la apertura se sincroniza antes que las ventas y el cierre después de vaciar la cola.
- Los archivos `docs/init_schema.sql` y `docs/models_django_reference.py` son referencias de diseño; las migraciones Django definen el esquema ejecutable.
- La apertura, ventas, anulaciones de ventas en cola, reconexión automática, cierre offline y cierre automático a las 00:30 están implementados y aceptados manualmente. La conciliación de ventas offline tardías está implementada y automatizada; sigue pendiente la impresión física.

## 3. Objetivos del producto

1. Administrar un catálogo único para POS, menú QR y landing, con actualizaciones visibles para los clientes conectados.
2. Permitir acceso autorizado al POS.
3. Abrir y cerrar turnos de caja.
4. Registrar ventas con productos, cantidades, modificaciones, tipo de consumo y medio de pago.
5. Conservar los datos y precios de cada venta tal como fueron al momento de cobrar.
6. Permitir anulaciones auditables y reportes de caja.
7. Seguir registrando ventas durante una interrupción de internet y sincronizarlas automáticamente al recuperar conexión.
8. Incluir impresión térmica en la primera versión, sin que una falla de impresora pierda una venta.
9. Mantener desarrollo local independiente de producción y despliegues controlados.

## 4. Principios de diseño y trabajo

- **Una fuente de verdad:** el catálogo y las ventas pertenecen al backend; el frontend no es autoridad para precios ni totales.
- **Cambios evolutivos:** usar migraciones versionadas y cambios pequeños que puedan revisarse y revertirse.
- **Integridad histórica:** nunca recalcular ventas antiguas con precios actuales ni borrar registros que deban auditarse.
- **Seguridad por defecto:** proteger funciones administrativas, validar los datos en el servidor y no guardar secretos en Git.
- **Tolerancia a fallos:** los errores de red o de impresión no deben borrar ni duplicar una venta.
- **Simplicidad operativa:** implementar primero lo necesario para vender y cuadrar caja; incorporar complejidad cuando exista un caso de uso claro.
- **Documentación en español:** toda instrucción, decisión y documentación nueva del proyecto se escribe en español. Se conservan en inglés los nombres requeridos por el código, protocolos y bibliotecas.
- **Separación de entornos:** desarrollo local, pruebas y producción usan datos y configuración separados.

## 5. Alcance propuesto por etapas

### Etapa 0 — Alinear alcance y decisiones

**Tareas**

- Registrar como confirmado que el responsable implementará el POS completo, incluido backend, API y base de datos.
- Registrar como confirmado que la primera versión incluye operación sin conexión, sincronización automática e impresión térmica.
- Registrar como confirmado que los medios de pago se ingresarán manualmente; no habrá integración con un proveedor de pagos en la primera versión.
- Revisar las diferencias entre la arquitectura, el diccionario MER, el SQL y los modelos Django de referencia.
- Acordar nombres y estados para turnos, ventas, pagos, anulaciones y tipos de consumo.
- Crear el backend Django REST dentro de `backend/`, separado del frontend actual, y documentar cómo ejecutarlos juntos localmente.
- Permitir el acceso sin conexión solo en el equipo previamente autenticado; no almacenar contraseñas ni tokens en texto plano.
- Partir con un equipo POS. El diseño no debe impedir evaluar varios equipos más adelante.
- Excluir los combos promocionales de la caja en la primera versión; se mantienen como contenido comercial web.

**Entregable:** alcance de primera versión y registro de decisiones aprobado.

**Criterio de término:** las decisiones obligatorias de la primera versión están registradas; las decisiones restantes tienen responsable y fecha objetivo.

### Etapa 1 — Preparar la base técnica

**Tareas**

- Registrar versiones de herramientas y comandos para instalar y ejecutar cada servicio localmente.
- Definir estructura de carpetas, configuración por entorno y gestión de variables secretas.
- Crear el esqueleto seguro del backend Django REST y la conexión local a PostgreSQL.
- Hacer una prueba técnica temprana con la DINON 9390 para validar desde qué entorno se imprimirá y qué permisos requiere.
- Separar configuración local, pruebas y producción; excluir archivos de secretos del control de versiones desde el primer cambio.
- Configurar permisos mínimos, validación de entradas, protección de operaciones administrativas y registros sin datos sensibles.
- Definir las migraciones como fuente ejecutable del esquema; conservar SQL de referencia solo si se mantiene sincronizado.
- Preparar datos de demostración reproducibles, sin datos reales de clientes.
- Corregir la documentación para que describa el código y los comandos actuales.
- Diseñar desde el inicio una base local persistente para el POS y una cola de sincronización con el servidor.
- Definir el mecanismo por el que los clientes conectados reciben cambios del catálogo y disponibilidad.

**Entregable:** backend mínimo ejecutable localmente, base de datos inicializable y guía de desarrollo en español.

**Criterio de término:** otra persona puede configurar el entorno siguiendo la guía sin tocar producción.

### Etapa 2 — Catálogo y API pública

**Tareas**

- Implementar categorías, productos, modificadores y disponibilidad.
- Definir y documentar el contrato de `GET /api/menu/`.
- Validar precios CLP como enteros no negativos.
- Excluir productos inactivos y no disponibles de la carta pública, de acuerdo con reglas aprobadas.
- Conectar el menú QR a la API, con estados de carga, error y reintento.
- Resolver cómo se administran los productos y quién puede modificarlos.

**Entregable:** catálogo de prueba servido por la API y visible en `/menu`.

**Criterio de término:** actualizar un producto en el entorno local cambia la carta sin editar los componentes del menú.

### Etapa 3 — Acceso y control de caja

**Tareas**

- Implementar autenticación y permisos del operador.
- Implementar apertura de turno, fondo inicial y cierre.
- Cerrar manualmente con efectivo contado; calcular `final_cash` en el backend y mostrar la diferencia entre ambos valores.
- Implementar cierre automático local a las 00:30 (`America/Santiago`), incluso sin internet; bloquear nuevas ventas en el turno cerrado y sincronizar el cierre después de la apertura, las ventas y las anulaciones pendientes.
- Impedir dos turnos abiertos simultáneamente según la regla aprobada.
- Mostrar el turno activo y el estado de conexión en la interfaz.
- Proteger las operaciones administrativas y registrar cambios relevantes.

**Entregable:** operador puede iniciar sesión y abrir/cerrar un turno en local.

**Criterio de término:** operaciones de caja no son accesibles sin autorización y el estado del turno queda persistido.

### Etapa 4 — Flujo de venta con persistencia local

**Tareas**

- Construir la interfaz de caja pensada para teclado y mouse.
- Buscar y seleccionar productos, cambiar cantidades y añadir modificadores permitidos.
- Registrar tipo de consumo y medio de pago.
- [x] Guardar y restaurar el borrador editable del carrito y sus opciones por turno en IndexedDB. El borrador no constituye una venta ni reemplaza el registro local previo al cobro.
- [x] Guardar cotización firmada, UUID, folio y snapshots antes de mostrar el pago; después de confirmar la recepción, marcar el pago localmente antes de enviar la venta al servidor.
- [x] Bloquear el cierre manual del turno mientras haya una cotización o un pago pendiente de resolver en este equipo.
- Calcular y validar el total en el servidor.
- Guardar una copia histórica del nombre, precio y modificadores cobrados.
- Asignar folio correlativo local por turno para ventas conectadas y offline; el servidor valida unicidad.
- Definir cómo se ingresa pago en efectivo, monto recibido y vuelto.
- Implementar anulación con motivo y marca de tiempo, sin borrar la venta.
- Guardar localmente la venta completa antes de intentar sincronizarla con el servidor.
- Asignar UUID local a cada venta y conservar el estado de sincronización.
- Mostrar de forma inequívoca si la venta está guardada localmente, sincronizada o requiere atención.

**Entregable:** flujo de venta asociado a un turno, persistido localmente y preparado para sincronización segura.

**Criterio de término:** una venta queda guardada localmente aunque no haya internet; la sincronización repetida no la duplica; el detalle y total son verificables y los cambios posteriores del catálogo no alteran la venta.

### Etapa 5 — Sincronización automática y datos compartidos

**Tareas**

- Implementar una cola local persistente para ventas y operaciones de turno que deban sincronizarse.
- Enviar automáticamente pendientes cuando vuelva la conexión, con reintentos seguros y espera progresiva ante errores.
- Hacer que la API acepte UUID idempotentes y devuelva un resultado que permita confirmar cada operación local.
- Conservar el momento original de la venta y distinguirlo del momento de sincronización.
- [x] Conservar la última respuesta completa de `GET /api/pos/catalog/` en IndexedDB y recuperarla si falla la red, mostrando la fecha de guardado y avisando que puede estar desactualizada.
- Mantener catálogo local actualizado desde el servidor para permitir ventas contra la última versión conocida.
- Definir conflictos: ventas son registros históricos; catálogo y disponibilidad se administran en el servidor; el POS no debe sobrescribir cambios más recientes con una copia vieja.
- Propagar cambios del servidor a los clientes conectados mediante un mecanismo acordado (consulta periódica inicialmente o eventos en tiempo real si se justifica).
- Mostrar estado de conexión, pendientes de envío, último éxito y errores que requieren intervención.
- Definir cómo se comporta el sistema si la cola local crece, el almacenamiento se agota o el reloj del equipo está desajustado.

**Entregable:** sincronización automática y estado compartido entre POS, API, menú QR y landing.

**Criterio de término:** una venta creada sin conexión llega al servidor y a los reportes al reconectar, sin duplicarse; los clientes conectados reciben actualizaciones del catálogo según la política acordada.

### Etapa 6 — Impresión térmica (requisito de primera versión)

**Tareas**

- Verificar la DINON 9390 y el método compatible con Windows, navegador y entorno local.
- Diseñar y aprobar los dos documentos de venta: comprobante para que el cliente retire el pedido y comanda para que cocina lo prepare.
- Imprimir desde la venta ya persistida localmente, sin depender de que el servidor responda.
- Registrar el estado de impresión por separado del estado de sincronización de la venta.
- Implementar reimpresión identificada y manejo de impresora desconectada sin perder ni duplicar la venta.
- Documentar instalación, configuración y recuperación.

**Entregable:** impresión verificada con el equipo físico y compatible con ventas offline.

**Criterio de término:** una venta queda registrada aunque falle la impresión o internet; operador puede reconocer y reimprimir el ticket sin crear otra venta.

### Etapa 7 — Cierre y reportes básicos

**Tareas**

- [x] Calcular y mostrar totales y cantidades de ventas completadas por efectivo, Transbank y transferencia; las anuladas se excluyen.
- Mantener el fondo inicial y excluir ventas anuladas del efectivo esperado, asumiendo que la anulación devolvió el importe.
- Completar el resumen de cierre y la consulta de ventas del turno.
- Definir y documentar zona horaria `America/Santiago` para fechas y reportes.
- Agregar reporte de horas punta solo después de validar fechas y reglas de agregación.

**Entregable:** arqueo reproducible y reportes básicos del turno.

**Criterio de término:** el reporte puede reconciliarse con las ventas persistidas y excluye anulaciones de acuerdo con la regla acordada.

### Etapa 8 — Integración del catálogo con la web

**Tareas**

- Conectar landing y carta al catálogo común cuando corresponda.
- Incorporar disponibilidad administrada desde el POS.
- Definir qué ocurre si la API no responde: mensaje, reintento y comportamiento seguro.
- Evitar que la página pública dependa de autenticación del POS.

**Entregable:** catálogo consistente entre POS, carta QR y landing.

**Criterio de término:** un cambio de disponibilidad hecho por un operador se refleja en el menú público según el comportamiento definido.

### Etapa 9 — Preparación y despliegue de producción

**Tareas**

- Separar configuración y secretos locales, de pruebas y producción.
- Configurar permisos, HTTPS, CORS, registros y manejo de errores.
- Automatizar despliegue reproducible y procedimiento de reversión.
- Crear respaldos de PostgreSQL y probar su restauración.
- Definir monitoreo básico y responsable de incidentes.
- Desplegar primero en un entorno de pruebas y luego en producción con revisión.

**Entregable:** procedimiento documentado para desplegar, recuperar y volver a una versión anterior.

**Criterio de término:** se ha probado la restauración de un respaldo y la reversión de una versión sin afectar datos reales.

### Etapa 10 — Aceptación y operación

**Tareas**

- Recorrer desde inicio de sesión hasta cierre de turno.
- Validar venta en efectivo y cada medio de pago que se decida soportar.
- Validar anulaciones, reportes, disponibilidad del catálogo e impresión.
- Validar pérdida y recuperación de conexión, cierre inesperado del navegador y sincronización automática.
- Revisar interfaz en el equipo y resolución que se usarán en el mesón.
- Preparar una guía corta para operación diaria y resolución de problemas.
- Registrar limitaciones conocidas y plan de soporte.

**Entregable:** versión aceptada para operación, guía de uso y lista de pendientes posteriores.

**Criterio de término:** el responsable del negocio puede realizar el flujo diario y recuperar los errores previstos sin intervención en la base de datos.

## 6. Contratos de API a definir

Los siguientes endpoints aparecen en la arquitectura como propuesta. Antes de implementarlos hay que validar rutas, datos, permisos, errores y comportamiento de reintento:

- `GET /api/menu/`
- `POST /api/auth/token/`
- `GET /api/pos/catalog/`
- `PATCH /api/pos/products/{id}/availability/`
- `POST /api/pos/shifts/`
- `POST /api/pos/orders/sync/`
- `POST /api/pos/orders/{id}/cancel/`
- `GET /api/pos/reports/shift-summary/{id}/`
- `GET /api/pos/reports/rush-hours/`

La ruta canónica quedó definida como `GET /api/pos/catalog/?updated_after=<ISO-8601 con zona horaria>`; devuelve los cambios de categorías, productos y modificadores junto con bajas explícitas. El detalle vigente está en `docs/CONTRATO_API_CATALOGO.md` y `docs/PLAN_CIERRE_POS.md`.

## 7. Hallazgos previos a crear las migraciones

La primera migración no debe generarse copiando directamente `docs/init_schema.sql` ni `docs/models_django_reference.py`. Ambos son borradores y deben reconciliarse. Las migraciones de Django serán la definición ejecutable del esquema; el SQL de referencia se actualizará o se marcará explícitamente como histórico.

1. **Usuario incompatible — resuelto:** se usó un modelo de usuario Django basado en `AbstractUser`; no se aplicó el SQL de referencia.
2. **Cuenta de ejemplo no utilizable:** `init_schema.sql` inserta `admin` con el valor literal `pbkdf2_sha256$sanmartin_secret_hash`. Es un marcador, no una credencial válida; no se debe ejecutar como mecanismo de creación de usuarios ni desplegar en ningún entorno.
3. **Numeración de comandas — resuelto:** el folio es `shift_order_number`, correlativo por turno. En V1 el POS mantiene el contador local persistente para ventas en línea y offline; PostgreSQL impone unicidad.
4. **Turno único — resuelto:** solo se permite un turno abierto en el local durante la primera versión.
5. **Identificadores offline — definido:** turno y venta usan UUID; las ventas sincronizadas se reconocen de forma idempotente.
6. **Precios con catálogo desactualizado — política confirmada:** se conserva el cobro offline y se incluye en caja; si difiere del catálogo vigente, se marca para revisión.
7. **Cálculo del total — definido en borrador:** el servidor calcula ventas online desde el catálogo; sincronización offline valida aritmética y conserva los snapshots efectivamente cobrados.
8. **Sincronización incremental — implementada localmente:** categorías, productos y modificadores comparten el cursor `updated_after`; la API envía bajas explícitas para retirar los registros que dejan de estar disponibles.

**Criterio para avanzar:** los puntos de negocio están resueltos o reflejados en el borrador de contrato. Falta revisar detalles de sincronización incremental del catálogo y el flujo técnico offline antes de completar la implementación.

### Contraste con el MER visual recibido el 2 de noviembre de 2026

El diagrama recibido se toma como referencia de entidades y relaciones del negocio; no contiene instrucciones de instalación ni reemplaza las reglas de operación offline acordadas.

- El MER muestra las ocho entidades base: `users`, `categories`, `products`, `modifiers`, `cash_shifts`, `orders`, `order_items` y `order_item_modifiers`.
- Las relaciones entre usuario, turno, venta, detalle, producto y modificadores coinciden en lo principal con los modelos iniciales.
- El MER visual no muestra UUID en turnos ni ventas. Los modelos iniciales sí los incluyen porque el POS debe crear y sincronizar datos offline sin duplicarlos.
- El MER no muestra `updated_at` en categorías, productos, modificadores, turnos ni ventas. Los modelos iniciales agregan estas marcas donde se necesitan para sincronización y auditoría.
- El campo visual `daily_order_number` no muestra una regla de unicidad. Se acordó usar `shift_order_number`, único dentro del turno y reiniciado al abrir el siguiente.
- El MER muestra `password_hash` en `users`. La implementación usará autenticación de Django basada en `AbstractUser`; Django administra el hash y las columnas requeridas. No se crea una tabla de usuarios manual a partir del dibujo.
- La línea de productos y modificadores conserva nombre y precio al momento de la venta; esa decisión se mantiene para proteger el historial.

Por lo tanto, el backend conserva las entidades del MER y agrega los campos técnicos necesarios para offline, sincronización y auditoría. Los cambios quedan explícitos aquí antes de generar migraciones.

### Decisiones técnicas recomendadas para resolver los hallazgos

- Crear un modelo de usuario propio basado en `AbstractUser` y configurarlo antes de la primera migración. Django administrará contraseñas y permisos; la cuenta inicial se crea con el comando de administración de Django, nunca desde el SQL de ejemplo.
- Nombrar el folio `shift_order_number` y reiniciarlo por turno. En V1 el único POS conserva el contador local entre ventas online y offline; si se incorporan más equipos, diseñar una asignación central o rangos reservados.
- Permitir un solo turno abierto en el local durante la primera versión, coherente con el único equipo POS.
- En ventas offline, conservar el precio exacto usado y la versión de catálogo local. Si ese precio difiere del catálogo al sincronizar, preservar la venta y marcar la diferencia para revisión; nunca cambiar silenciosamente el monto histórico.

### Base técnica local propuesta

- Usar **Python 3.14.10** para este backend. El equipo ya tiene Python 3.15; se conserva instalado, pero Django 5.2 no declara compatibilidad con 3.15. Python 3.14 permite usar la rama LTS de Django sin cambiar ni desinstalar las otras versiones.
- Usar **Django 5.2 LTS** con Django REST Framework y fijar versiones reproducibles al crear el entorno. Django 5.2 admite Python 3.14 y es la rama LTS adecuada para priorizar mantenimiento y seguridad.
- Mantener **PostgreSQL 16** para coincidir con la infraestructura descrita en los documentos y evitar diferencias entre desarrollo y servidor. Su soporte oficial llega hasta noviembre de 2028; se deberá planificar su actualización antes de esa fecha.
- Docker no está disponible en el equipo en este momento. Se usará PostgreSQL 16 instalado nativamente en Windows; Docker queda como alternativa opcional.

Esta base es una propuesta para el entorno nuevo. No modifica el servidor ni despliega componentes.

## 8. Método de trabajo por tarea

Cada tarea debe tener:

1. Objetivo pequeño y verificable.
2. Responsable y rama de trabajo.
3. Archivos o componentes que se espera modificar.
4. Criterios de aceptación y casos de error.
5. Revisión del cambio antes de integrarlo a `main`.
6. Actualización de documentación si cambió un contrato o una regla.
7. Forma de revertir el cambio si causa problemas.

No se deben mezclar en una misma tarea cambios de catálogo, ventas, autenticación y despliegue sin una dependencia explícita.

## 9. Contrato operativo para modo sin conexión

La primera versión se construirá con estrategia **local primero**: el POS conserva la operación y luego sincroniza con el servidor. El servidor central coordina los datos compartidos; no se replica la base de datos directamente entre navegadores o equipos.

- Las ventas y operaciones pendientes se guardan de forma persistente en el equipo antes de confirmar el flujo al cajero.
- Cada operación sincronizable tiene un identificador único y el servidor debe procesar reintentos de forma idempotente.
- El catálogo se descarga del servidor y se conserva una copia local para consultar productos durante una caída.
- La venta guarda una copia del precio, nombre y modificadores usados, aunque el catálogo local esté desactualizado.
- Cuando vuelve internet, el cliente envía automáticamente la cola y confirma cada elemento por separado.
- Los cambios administrativos de catálogo se originan en el servidor. El POS debe descargar la versión vigente; una copia offline antigua no puede reemplazar cambios más nuevos.
- Los demás clientes reciben cambios desde la API por el mecanismo de actualización acordado; no se asume sincronización instantánea hasta definir e implementar ese mecanismo.
- El estado de una venta, de su sincronización y de su impresión se muestra por separado.
- El POS usa una cuenta general compartida con contraseña para iniciar sesión online. Tras autenticarla en el equipo, la sesión offline se restaura desde el perfil local incluso después de cerrar la sesión Django; si el usuario entra desde el formulario offline, debe coincidir con la cuenta guardada. La contraseña se valida solo online. No hay PIN offline. La auditoría identifica la cuenta compartida y el equipo, no a la persona física.
- El cierre automático ocurre a las 00:30 en la zona `America/Santiago`. El POS lo registra localmente aunque no haya internet, bloquea nuevas ventas en ese turno y encola el cierre después de la apertura, las ventas y sus anulaciones.
- La primera versión opera con un equipo POS y no incluye combos en la caja. Los combos de la web no se interpretan como artículos de venta del POS.

## 10. Registro de decisiones

| Decisión | Estado | Consecuencia |
|---|---|---|
| Responsable implementa POS, API, backend y base de datos | Confirmado | El propietario del proyecto desarrolla el sistema completo. |
| Django REST y PostgreSQL dentro de `backend/` en este repositorio | Confirmado | El backend vive separado del frontend, con configuración y ejecución local documentadas. |
| Operación sin conexión y sincronización automática en primera versión | Confirmado | Requiere persistencia local, cola, UUID, idempotencia y política de conflictos desde el diseño inicial. |
| Impresión térmica DINON 9390 en primera versión | Confirmado | Se debe validar temprano con el equipo real y separar estado de impresión del estado de venta. |
| Registro manual del medio de pago | Confirmado | No se integra una pasarela de pago en la primera versión. |
| Un equipo POS en la primera versión | Confirmado | El diseño debe permitir evaluar varios equipos en una etapa posterior. |
| Cuenta general compartida para operar el POS | Confirmado | No habrá cuentas individuales para los cajeros ni varios niveles de permisos. El registro identifica la cuenta compartida, la hora y el equipo, no a la persona física. |
| Inicio offline con perfil local tras autenticación online previa | Aceptado manualmente (10 nov 2026) | Se elimina el PIN; el perfil local persiste tras cerrar la sesión de Django para iniciar el siguiente turno sin servidor. |
| Combos fuera de la caja en la primera versión | Confirmado | Los combos web son contenido promocional y quedan fuera del catálogo operativo del POS inicial. |
| ¿Cuál es la ruta oficial de sincronización delta del catálogo? | Resuelto | `GET /api/pos/catalog/?updated_after=<ISO-8601 con zona horaria>`; contrato en `docs/CONTRATO_API_CATALOGO.md`. |
| Restauración automática de sesión local y fallback desde el formulario | Implementado | La cuenta se guarda en IndexedDB y se conserva tras cerrar sesión Django; un login offline usa el nombre de la cuenta guardada. |
| ¿Qué sucede si una caída supera la vigencia del catálogo local o se agota el almacenamiento? | Pendiente de definir | Establece límites y alertas para proteger ventas y datos. |
| Usuario propio basado en `AbstractUser`, administrado por Django | Confirmado | Resuelve el choque entre el SQL de referencia y el sistema de autenticación, y deja espacio para permisos futuros. |
| Folio correlativo por turno (`shift_order_number`) | Confirmado | Coincide con la unicidad por turno ya descrita y simplifica la operación con un POS. |
| Un solo turno abierto por local en la primera versión | Confirmado | Evita cajas concurrentes mientras opera un solo equipo. |
| Ventas presenciales para servir o llevar; sin delivery, retiro externo, combos ni consumo propio en la caja inicial | Confirmado | Alcance acordado para el flujo de ventas V1. |
| Efectivo, Transbank (débito/crédito como una categoría) y transferencia; un medio por venta | Confirmado | Registro manual; el POS no procesa pagos electrónicos. |
| Efectivo registra monto recibido y calcula vuelto; otros medios no guardan `amount_paid` ni `change_given` | Confirmado | El servidor valida el monto y el total de la venta. |
| Extras y exclusiones por unidad, nota de cocina por línea y extras repetibles | Confirmado | Productos con preparaciones diferentes se separan en líneas. |
| Anulación con motivo obligatorio, solo durante el turno abierto | Confirmado | La venta no se borra; se registra hora y cuenta compartida. No se atribuye la acción a una persona específica. |
| Cierre automático del turno a las 00:30 | Confirmado | Se aplica en hora local `America/Santiago`; funciona localmente sin internet y se sincroniza después de las operaciones previas del turno. |
| `final_cash` como efectivo esperado calculado por el sistema | Confirmado | Se guarda separado de `counted_cash`, que registra el efectivo contado físicamente. El cierre manual registra ambos y permite calcular la diferencia; el automático deja `counted_cash` vacío. |
| Impresión de comprobante de venta para cliente y comanda de cocina | Confirmado | Se imprimen al registrar la venta. El comprobante permite retirar el pedido y la comanda informa la preparación a cocina; no son tickets de anulación. |
| Impresión de tickets al anular una venta | Pendiente de definir | No se implementará por inferencia a partir de los dos tickets normales de venta. |
| Precio offline diferente del catálogo al sincronizar | Confirmado | Se conserva el cobro, se incluye en caja y se marca para revisión. |
| Catálogo local sin actualización reciente | Confirmado | Se permite seguir vendiendo con aviso de antigüedad; las diferencias se revisan al sincronizar. |
| Almacenamiento local cerca del límite o lleno | Confirmado | Avisar; impedir cobrar si la venta no puede persistirse y nunca borrar ventas pendientes. |
| Orden de sincronización de operaciones del turno | Confirmado | Apertura, ventas por folio ascendente, anulaciones y cierre. Si una falla, se conservan datos y se pausan las operaciones posteriores de ese turno. |
| Venta offline sincronizada después de que el servidor cerró el turno | Salvaguarda confirmada (10 nov 2026) | No debe ocurrir en el flujo normal; si sucede, se conserva marcada para revisión, se recalcula el efectivo esperado y no se altera el conteo físico. |

## 11. Fuera del alcance inicial salvo aprobación

- Integraciones de pago online.
- Multi-sucursal y multi-caja.
- Inventario por ingredientes o recetas.
- Programa de fidelización.
- Aplicación móvil nativa.
- Analítica avanzada y predicción de demanda.
- Integraciones adicionales con plataformas de delivery.

## 12. Documentación relacionada

- `docs/proyecto_sanmartin_pos_arquitectura.md`: arquitectura general y hoja de ruta original.
- `docs/DICCIONARIO_MER_SANMARTIN.md`: diseño de tablas y reglas de datos.
- `docs/init_schema.sql`: SQL de referencia del modelo.
- `docs/models_django_reference.py`: modelos Django de referencia.
- `docs/PRUEBAS_ACEPTACION_ETAPA_3.md`: casos manuales para aceptar acceso y control de turnos antes de iniciar ventas.
- `docs/PRUEBAS_ACEPTACION_CIERRE_CAJA.md`: resultado de aceptación del cierre manual con efectivo esperado, contado y diferencia.
- `docs/PROMPT_MAESTRO_CONTINUIDAD.md`: prompt completo para retomar el proyecto en otro chat sin perder decisiones ni estado.
- `docs/CONTRATO_API_VENTAS.md`: reglas operativas y contrato vigente del flujo de ventas; debe mantenerse alineado con las decisiones aprobadas y el código.
- `TEST_INFRA.md` y `TEST_READY.md`: documentación histórica de pruebas del frontend; se debe actualizar o complementar para el POS.

## 13. Avance de implementación

> **Plan operativo vigente:** continuar desde [PLAN_CIERRE_POS.md](PLAN_CIERRE_POS.md). Su inventario y orden de trabajo reemplazan las listas históricas de este documento y de `PROMPT_MAESTRO_CONTINUIDAD.md`, que aún contienen estados anteriores. El usuario aceptó tema y escala el 10 de noviembre de 2026.

- **Confirmado:** Django REST, PostgreSQL, backend en `backend/`, un equipo inicial, sesión offline solo después de autenticación online, impresión en la primera versión, pagos manuales y combos fuera de la caja.
- **Creado:** estructura Django; aplicaciones `users`, `catalog` y `sales`; migraciones; configuración local; Compose opcional ligado a `127.0.0.1`; proxy Vite para `/api` y `/admin`; API pública de catálogo; API de sesión y operaciones iniciales de turno. Contratos en `docs/CONTRATO_API_CATALOGO.md` y `docs/CONTRATO_API_ACCESO_CAJA.md`.
- **Etapas 4–5 — avance:** API online de catálogo POS, cotización, registro idempotente, anulación, cierre y resumen implementados. `/pos` persiste catálogo, borrador, cotización, sesión local, eventos de turnos, ventas y anulaciones offline en IndexedDB. Las anulaciones se sincronizan después de las ventas y antes del cierre. El usuario aceptó el acceso offline, detección de caída, venta, reconexión, apertura/cierre y anulación offline, incluida la reconexión automática. También aceptó manualmente el cierre automático a las 00:30 con Django detenido y la sincronización del cierre al recuperar el servidor. La salvaguarda para ventas sincronizadas en turnos cerrados quedó implementada y probada automáticamente. El siguiente trabajo es preparar la impresión y hacer la prueba física cuando haya acceso a la DINON 9390.
- **Entorno local preparado:** Python 3.14.10 instalado en el perfil de Windows; entorno virtual creado en `backend/.venv`; dependencias fijadas instaladas; servicio PostgreSQL 16 iniciado y puerto `5433` confirmado. PostgreSQL 18 sigue en `5432`.
- **Configuración local:** `backend/.env` creado y excluido de Git; `DJANGO_SECRET_KEY` generado localmente y conexión configurada para PostgreSQL 16 en `127.0.0.1:5433`.
- **Catálogo local:** cargadas desde la carta existente 8 categorías y 64 productos; las promociones web permanecen fuera del catálogo del POS. El cargador solo agrega faltantes y conserva los registros existentes.
- **Carta web:** landing y `/menu` consultan el catálogo Django mediante el proxy local y muestran estados de carga, error y reintento; categorías y productos ya no se duplican en `src/data/menuData.ts`.
- **Verificación local:** `manage.py check` no reporta problemas; `npm run build` terminó correctamente; las migraciones están aplicadas y el permiso `sales.can_operate_pos` existe. `/pos`, CSRF y catálogo responden con HTTP 200. La API devuelve 8 categorías y 64 productos. Sin sesión, las rutas protegidas responden HTTP 403.
- **Etapa 3 — aceptación:** el usuario confirmó la aprobación de POS-01 a POS-11 y POS-12 se verificó localmente con rechazo HTTP 403 para token CSRF inválido. Registro en `docs/PRUEBAS_ACEPTACION_ETAPA_3.md`.
- **Impresión — preparación:** el usuario confirmó DINON 9390 por USB, comprobante para cliente, comanda para cocina y apertura de gaveta con efectivo. La arquitectura documenta papel de 80 mm, USB directo, ESC/POS y RJ11 (24 V, 1 A); estos datos orientan el diseño, pero aún no se han probado en la unidad física. El video del POS anterior muestra el pago en efectivo y un comprobante de retiro. La propuesta y las validaciones de conexión están en `docs/PROPUESTA_IMPRESION_POS.md`.
- **Preferencias de visualización:** el usuario probó y aceptó tema claro/oscuro y escala de 90% a 120%, guardados en el navegador. El POS adapta sus columnas y catálogo cuando aumenta la escala; el aviso de pago pendiente se presenta como tarjeta completa y discreta.
- **Usabilidad del POS:** la pantalla conserva el desplazamiento normal de la página y vuelve a mostrar el panel de impresora, respaldo y cierre de turno en el orden de trabajo. Solo los registros de ventas recientes se pueden plegar. Las categorías aparecen completas en varias filas sin desplazamiento horizontal; el tipo de pedido aparece tras la lista de productos agregados y antes de cotizar. Cerrar sesión pide confirmación y avisa si hay operaciones pendientes.
- **Pendiente de desarrollo:** aceptación manual del catálogo delta, impresión térmica integrada con ventas, prueba física de la DINON 9390, verificación de concurrencia en PostgreSQL, dashboards históricos día/mes y aceptación integral. La búsqueda rápida fue implementada y aceptada en ambos temas. El orden vigente está en `docs/PLAN_CIERRE_POS.md`.
- **Seguridad:** no se aplicó `docs/init_schema.sql`, no se creó la cuenta de ejemplo y no se conectó el backend a producción.
- **Seguridad:** la contraseña actual del rol `sanmartin_dev` es solo para desarrollo local; reemplazarla por una clave robusta antes de cualquier despliegue. No usarla en producción.
- **Verificación del entorno:** se usa Python 3.14.10 en `backend/.venv`; el acceso autenticado y las migraciones se comprobaron en PostgreSQL local. El 10 de noviembre de 2026, las 29 pruebas de `apps.sales` pasaron contra PostgreSQL 16.15 usando la base temporal Django `test_sanmartin_pos`, que se eliminó al terminar. El permiso `CREATEDB` concedido temporalmente a `sanmartin_dev` se revocó después. Esto no sustituye pruebas específicas de concurrencia real, que siguen pendientes. Docker no es requisito para el flujo local.

La pantalla `/pos` permite operar ventas online, detecta la caída de la API sin recargar y reanuda automáticamente la sesión y las colas al recuperarla. A las 00:30 (`America/Santiago`) guarda el cierre localmente, calcula el efectivo esperado sin arqueo físico y lo sincroniza después de apertura, ventas y anulaciones. El usuario aceptó manualmente el cierre automático offline y la recuperación de la opción de abrir un nuevo turno al restaurar Django. También puede conciliar una venta offline tardía asociada a un turno cerrado, marcada para revisión.

### Seguimiento de la orden de trabajo

#### Etapa 0 — Preparar el equipo

- [x] Instalar un intérprete compatible y comprobarlo: el backend usa Python 3.14.10. Python 3.13 no se instaló; Django 5.2 también admite Python 3.14 desde la versión 5.2.8.
- [ ] Instalar Docker Desktop con WSL 2. Docker no está instalado; no bloquea el trabajo local porque PostgreSQL 16 funciona de forma nativa.
- [x] Crear `backend/.env`, generar la clave de Django y excluir el archivo de Git.
- [x] Instalar las dependencias de `backend/requirements.txt` en `backend/.venv`.
- [x] Iniciar PostgreSQL 16 local en `5433`. Esta instalación es nativa; Docker Compose queda como alternativa para estandarizar el entorno del segundo integrante.

#### Etapa 1 — Revisar MER y migraciones

- [x] Modelar las ocho entidades principales del MER con Django.
- [x] Usar usuario Django basado en `AbstractUser`; no aplicar el SQL de referencia.
- [x] Incorporar UUID en turnos y ventas, marcas `updated_at`, folio por turno y snapshots de producto/precio.
- [x] Revisar y aplicar las migraciones. La migración del slug de producto incluye backfill para registros existentes.

#### Etapa 2 — Catálogo

- [x] Cargar los datos que ya estaban en la carta: 8 categorías y 64 productos.
- [x] Crear `GET /api/menu/` como consulta pública de solo lectura.
- [x] Conectar landing y carta QR con la API; mostrar carga, error y reintento.
- [x] Administrar actividad y disponibilidad desde Django Admin.

#### Etapa 3 — Acceso y caja

- [x] Implementar autenticación online de sesión, CSRF, límite de intentos y permiso `sales.can_operate_pos` en la API.
- [x] Crear la pantalla de inicio de sesión online del POS con sesión Django y token CSRF en memoria.
- [ ] Configurar y validar una cuenta general compartida con el permiso `sales.can_operate_pos`; no se crean cuentas individuales para los cajeros.
- [x] Definir la política de acceso: contraseña online; inicio offline con la cuenta previamente autenticada y persistida en el equipo, incluso después del logout Django; sin PIN.
- [x] Implementar en backend consulta, apertura y cierre de turnos con restricción de un turno abierto e idempotencia por UUID.
- [x] Crear la interfaz de apertura/cierre y consulta del turno activo.
- [x] Validar acceso, apertura/cierre de turno y permisos con los casos POS-01 a POS-12.
- [ ] Implementar arqueo del turno al completar el flujo de ventas.

#### Etapas 4 a 7 — Venta, operación offline, impresión y reportes

- [x] Acordar reglas de ventas y documentar el contrato API en español.
- [x] Ajustar el modelo de venta y aplicar la migración local `0004_reglas_iniciales_venta` tras revisar que no hubiera datos incompatibles.
- [x] Implementar la API online de cotización firmada, registro idempotente y anulación auditada.
- [x] Crear y ejecutar 14 pruebas automatizadas para catálogo POS, cotización, precios, pagos, idempotencia, permisos, CSRF y anulaciones en una base SQLite temporal.
- [ ] Validar bloqueos y concurrencia de ventas contra PostgreSQL en una base de pruebas separada.
- [~] Implementar persistencia local de turnos, ventas offline, anulaciones y cierres en una cola durable, junto con el endpoint de sincronización. Las ventas offline ya tienen cola frontend y ruta idempotente aceptadas; faltan apertura/anulaciones/cierre offline.
- [x] Interfaz inicial online POS: catálogo, cantidades, extras/exclusiones, notas, consumo, cotización y pago manual.
- [x] Guardar carrito/cotización e identidad antes de mostrar el pago y respaldar localmente su recepción antes del registro online; una falla de servidor conserva el mismo UUID para reintentar.
- [x] Aceptar en una base SQLite temporal la restauración del borrador y cotización, el bloqueo del cierre con venta pendiente, el reintento con un solo registro y el cierre manual; evidencia en `docs/PRUEBAS_ACEPTACION_POS_PERSISTENCIA_LOCAL.md`.
- [x] Aceptar manualmente una venta con la API detenida y comprobar que se sincroniza después de reiniciarla; evidencia en `docs/PRUEBAS_ACEPTACION_POS_PERSISTENCIA_LOCAL.md`.
- [ ] Implementar búsqueda rápida y flujo optimizado para teclado y mouse.
- [ ] Validación de ventas, anulaciones auditables y cálculo de vuelto en el backend.
- [x] Endpoint idempotente de sincronización de ventas, preservación de snapshots y revisión por diferencias de catálogo; el usuario aceptó el recorrido offline en navegador.
- [x] Conciliar de forma idempotente ventas y anulaciones offline de un turno ya cerrado, marcar el motivo de revisión, ajustar el efectivo esperado sin alterar el conteo y recuperar la cola aunque no haya un turno abierto; 26 pruebas de `apps.sales` pasan en SQLite temporal.
- [ ] Prueba de la DINON 9390, formatos de ticket y reimpresión.
- [x] Agregar `final_cash`, `counted_cash` y `closed_automatically` mediante migración aditiva `0005` aplicada en PostgreSQL local.
- [x] Implementar el cierre manual: el backend calcula el efectivo esperado, guarda el conteo físico y devuelve la diferencia.
- [x] Aceptar manualmente el cierre con una venta en efectivo, una no efectiva y una venta anulada; evidencia en `docs/PRUEBAS_ACEPTACION_CIERRE_CAJA.md`.
- [x] Completar y aceptar manualmente el resumen del turno por medio de pago; evidencia en `docs/PRUEBAS_ACEPTACION_CIERRE_CAJA.md`.
- [x] Implementar y aceptar manualmente el cierre automático local a las 00:30 con efectivo esperado, sin arqueo físico, encolado después de apertura, ventas y anulaciones; confirmar sincronización y disponibilidad para abrir el siguiente turno al recuperar Django.

#### Etapa 8 — Seguridad y operación

- [~] Configuración local separada por variables; producción aún no está configurada.
- [ ] Respaldos y prueba de restauración.
- [ ] Despliegue primero en un entorno de pruebas.
- [ ] Validación integral de venta, impresión, sincronización offline y cierre.
- [ ] Manual de operación diaria.

#### Inicio local

Los servicios están levantados ahora. Para iniciarlos después de reiniciar Windows, sigue la sección «Abrir el proyecto local» de `backend/README.md`. Verificación actual: `npm run build` y `manage.py check` terminaron sin errores; sitio, carta y catálogo responden; CSRF responde y las rutas de sesión/turno exigen autenticación.

## 14. Instalación local en Windows

### Descargas necesarias

1. **Python 3.14.10 para Windows (64 bits):** descargar el instalador recomendado desde [Python 3.14.10](https://www.python.org/downloads/release/python-31410/). Se instala junto a Python 3.15; no desinstales ninguna versión. Durante la instalación, habilitar el lanzador `py` y agregar Python al `PATH`.
2. **PostgreSQL 16 para Windows:** descargar el instalador desde la [página oficial de PostgreSQL para Windows](https://www.postgresql.org/download/windows/). La página enlaza al instalador de EDB, que incluye el servidor, pgAdmin y herramientas de línea de comandos.
3. **Docker Desktop es opcional:** se puede usar como alternativa a la instalación nativa de PostgreSQL, no es requisito para avanzar.

No descargar Django, Django REST Framework ni Psycopg por separado: se instalan en el entorno virtual desde `backend/requirements.txt`. No uses la cuenta administradora `postgres` como usuario de Django; crea un rol local `sanmartin_dev` con permisos solo sobre la base de desarrollo.

El instalador gráfico de PostgreSQL necesita permisos de administrador en Windows. Si tampoco tienes esos permisos, no intentes usar la base de producción como reemplazo; comparte el mensaje de error para definir un entorno de desarrollo autorizado.

Git, Node.js y npm ya están presentes en este equipo. El backend no reemplaza ni modifica el frontend.

### Preparación y arranque

Desde PowerShell:

```powershell
Set-Location "C:\Users\Houdini\Desktop\sanmartin-pos"
if (-not (Test-Path .\backend\.env)) { Copy-Item .\backend\.env.example .\backend\.env }
$python314Path = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python314\python.exe'
& $python314Path --version
```

En una instalación nueva, edita `backend/.env` y reemplaza los valores de ejemplo por secretos locales privados. No uses claves de producción ni compartas el archivo `.env`.

Solo la primera vez, crea el entorno e instala dependencias:

```powershell
& $python314Path -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install --upgrade pip
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Instala PostgreSQL 16 y pgAdmin. En pgAdmin, registra el servidor local usando el puerto `5433`. Crea el rol `sanmartin_dev` con permiso de inicio de sesión y una clave local. Crea la base `sanmartin_pos` y asigna ese rol como propietario. Actualiza en `backend/.env` la clave y confirma que `POSTGRES_PORT=5433`. Comprueba en Servicios de Windows que PostgreSQL 16 esté iniciado.

Si más adelante Docker funciona, puedes iniciar el contenedor alternativo con `docker compose --env-file backend/.env -f backend/compose.local.yml up -d base_datos`; no ejecutes el contenedor y el servicio nativo usando el mismo puerto.

Luego:

```powershell
Set-Location .\backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Ejecuta `makemigrations` y revisa la migración únicamente cuando cambien los modelos. Crea un superusuario solo si aún no existe. En otra terminal, desde la raíz, inicia Vite con `npm run dev -- --host 127.0.0.1 --port 5173`.

En otra ventana de PowerShell, desde la raíz del proyecto, ejecutar `npm run dev`. Vite enviará las llamadas locales `/api` y `/admin` al backend. El servidor Django de desarrollo debe permanecer enlazado a `127.0.0.1`; no se utiliza en producción.

### Lista de trabajo para copiar y pegar

```text
SAN MARTÍN POS — LISTA DE CONTROL
Leyenda: [x] completo · [~] parcial · [ ] pendiente

ETAPA 0 — ENTORNO LOCAL
[x] Instalar Python 3.14.10 de 64 bits; el backend lo usa con Django 5.2 LTS
[ ] Instalar Docker Desktop con WSL 2 (pendiente; PostgreSQL nativo permite continuar)
[x] Crear backend/.env y reemplazar los valores de ejemplo
[x] Instalar las dependencias fijadas en backend/requirements.txt
[x] Iniciar PostgreSQL 16 local en el puerto 5433

ETAPA 1 — MER Y MIGRACIONES
[x] Mantener las ocho entidades del MER y sus relaciones
[x] Usar AbstractUser; no aplicar el SQL manual de users
[x] Incorporar UUID en turnos y ventas
[x] Mantener updated_at en catálogo y datos operativos
[x] Usar folio correlativo único por turno
[x] Conservar nombre y precio de producto/modificador al vender
[x] Revisar y aplicar migraciones; manage.py check sin errores
[x] Crear el superusuario mediante Django, no con el hash de ejemplo

ETAPA 2 — CATÁLOGO
[~] Cargar 8 categorías y 64 productos; modificadores aún pendientes
[x] Implementar GET /api/menu/
[x] Conectar landing y carta QR con el catálogo del backend
[x] Administrar actividad y disponibilidad desde Django Admin

ETAPA 3 — ACCESO Y TURNO
[x] API de sesión, CSRF y permisos
[x] Pantalla de acceso online y control de turnos en /pos
[ ] Crear grupo Operadores POS y asignar cuentas de cajero
[x] Restauración automática de sesión offline tras autenticación online previa; elimina el PIN y su verificador local
[x] API e interfaz de apertura/cierre; falta arqueo
[x] Impedir más de un turno abierto según la regla aprobada

ETAPA 4 — VENTAS
[x] Implementar interfaz inicial online: selección de productos, cantidades y modificadores
[x] Registrar consumo, medio de pago manual y efectivo recibido; calcular vuelto en servidor
[x] Validar cotización y total en backend; guardar snapshots de precios y nombres
[x] Implementar endpoint de anulación con motivo y auditoría
[ ] Optimizar operación para teclado/mouse y verificar en pruebas guiadas
[x] Guardar localmente borrador, cotización e intención de pago; registrar y sincronizar ventas offline
[x] Mantener combos fuera de la caja en la primera versión

ETAPA 5 — OFFLINE Y SINCRONIZACIÓN
[~] Persistir turno, catálogo local y ventas en el equipo; apertura/cierre offline aún pendientes
[ ] Guardar cada venta local antes de imprimir o enviar al servidor
[x] Cola frontend y endpoint idempotente de ventas offline; venta y reconexión aceptadas
[x] Reintentar al recuperar conexión
[x] Conservar snapshots cobrados aunque cambie el catálogo y marcar diferencias para revisión
[~] Mostrar estado offline, pendientes, errores y reintento; falta indicar la última sincronización
[ ] Propagar cambios desde el servidor a los clientes conectados

ETAPA 6 — IMPRESIÓN
[ ] Probar temprano la DINON 9390 con el equipo real
[ ] Diseñar ticket del cliente y comanda de cocina
[ ] Imprimir desde la venta persistida localmente
[ ] Reimprimir sin crear una venta nueva
[ ] Mostrar estado de impresión separado del estado de sincronización

ETAPA 7 — CIERRE Y REPORTES
[ ] Calcular arqueo por medio de pago y turno
[ ] Verificar el tratamiento de anulaciones y consumo propio
[ ] Implementar reporte de ventas y horas punta
[ ] Validar fechas en America/Santiago

ETAPA 8 — SEGURIDAD Y PUESTA EN MARCHA
[ ] Separar configuración local, pruebas y producción
[ ] Revisar HTTPS, permisos, registros y manejo de errores
[ ] Configurar respaldos de PostgreSQL y probar restauración
[ ] Desplegar primero en pruebas y documentar reversión
[ ] Recorrer venta, impresión, modo offline, sincronización y cierre
[ ] Preparar guía de operación diaria

REGLA DE CIERRE POR TAREA
[ ] Cada tarea tiene responsable, alcance y criterio de aceptación
[ ] Revisar los cambios antes de integrarlos a main
[ ] Actualizar la documentación cuando cambie una regla o contrato
[ ] No conectar ni probar con datos de producción durante desarrollo
```
