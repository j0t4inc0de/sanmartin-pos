# 📖 Diccionario y Arquitectura de Base de Datos — San Martín POS & Web

> **Proyecto:** Food Truck Sanguchería San Martín (Puente Alto)  
> **Motor de Base de Datos:** PostgreSQL 16 (alojado en contenedor Docker en `jota-server`)  
> **Framework Backend:** Django REST Framework (Django 5.x)  
> **Consumidores:** Terminal POS Mesón All-in-One (Windows 11) + Carta QR Digital (`/menu`) + Landing Page (`/`)  
> **Filosofía de Diseño:** **Cero Sobreingeniería (Ponytail Operational Compliance) + Soporte Offline-First.** Cada tabla, columna e índice responde directamente a una necesidad operativa real de la plancha, el mesón y la carta digital, protegiendo la inmutabilidad contable y garantizando la operación ininterrumpida si se cae internet en el Food Truck.

---

## 🧭 Resumen de Decisiones de Arquitectura y Negocio

1. **Soporte Offline-First e Idempotencia (`uuid` universal):**
   * *Problema evitado:* Si el PC del food truck pierde conexión a internet, el cajero **sigue vendiendo sin parar**. Si usáramos solo IDs autoincrementales, al volver internet los IDs generados localmente colisionarían con la base de datos central. Además, ante microcortes o reintentos de red, el POS podría enviar la misma comanda dos veces.
   * *Solución:* `orders` y `cash_shifts` incluyen un campo **`uuid` (UUIDv4 generado por el cliente POS)**. El servidor ejecuta un `INSERT ... ON CONFLICT (uuid) DO NOTHING` (o `update_or_create`). Si el POS reintenta enviar una orden ya recibida, el servidor la reconoce y **jamás duplica la venta ni descalza la caja**.
2. **Preservación de Hora Real de Venta (`created_at` del POS vs. Servidor):**
   * *Problema evitado:* Si una orden se cobra a las 20:30 (hora punta) sin internet y se sincroniza a las 23:00 al reconectar, usar el reloj del servidor distorsionaría el gráfico de horas punta.
   * *Solución:* El campo `created_at` conserva el timestamp exacto del momento del cobro emitido por el POS (zona horaria `America/Santiago`).
3. **Sincronización Delta de Catálogo (`updated_at`):**
   * *Problema evitado:* Al reconectar, el POS no necesita descargar toda la base de datos para saber si hubo cambios.
   * *Solución:* `categories`, `products` y `modifiers` cuentan con `updated_at`. El POS consulta `GET /api/pos/catalog/?updated_after=<ISO-8601 con zona horaria>` y aplica los registros cambiados más los identificadores explícitos de `removed`.
4. **Inmutabilidad de Ventas Históricas (`product_name` y `modifier_name` congelados):**
   * *Problema evitado:* Si en 6 meses Diego cambia el nombre de "Churrasco Italiano Gigante" a "Churrasco Italiano XL" o modifica la carta, los reportes contables pasados y la reimpresión de tickets jamás mutan retroactivamente.
   * *Solución:* `order_items` almacena `product_name` y `unit_price` congelados al momento del cobro. `order_item_modifiers` almacena `modifier_name` y `price_at_sale`.
5. **Políticas de Integridad Referencial (`ON DELETE RESTRICT`):**
   * *Protección:* Se configuran con `RESTRICT` (`models.PROTECT` en Django) las relaciones de categorías a productos, productos a ítems vendidos, modificadores a ventas y turnos a órdenes. Nunca se permitirá eliminar un producto de la base de datos si ya tiene ventas registradas.
6. **Soft Delete (`is_active`) vs. Disponibilidad Diaria (`is_available`):**
   * *`is_available`:* Switch rápido del mesón ("se acabó la palta hoy"). Oculta el producto de la carta QR y de la landing de inmediato.
   * *`is_active`:* Descontinuación permanente de la carta sin borrar el registro ni romper llaves foráneas con órdenes antiguas.
7. **Cierre de Caja y Arqueo Reproducibles:**
   * *Motivo:* Los totales por medio de pago se obtienen de las ventas del turno; no se mantienen acumuladores que puedan desincronizarse al anular una venta.
   * *Solución:* Todas las órdenes están vinculadas a `cash_shift_id`. Al cerrar turno, Django agrega las ventas completadas y conserva `final_cash` como el efectivo esperado calculado por el sistema. El efectivo físico contado se registra aparte en `counted_cash`; la diferencia se calcula para el arqueo.
   * `final_cash` se calcula con el fondo inicial más la suma de `total_amount` de las ventas completadas pagadas en efectivo. Las anuladas se excluyen porque su estado presupone la devolución; no se descuentan nuevamente.
   * En un cierre manual se registra el conteo físico. En un cierre automático a las 00:30 hora de Santiago no se inventa el conteo: `counted_cash` queda nulo y se marca que el cierre fue automático.
   * Las ventas para reportes por medio de pago se agregan de esta forma:
     ```sql
     SELECT payment_method, SUM(total_amount) AS total, COUNT(*) AS cantidad
     FROM orders 
     WHERE cash_shift_id = :id_turno AND status = 'COMPLETADA'
     GROUP BY payment_method;
     ```
8. **Auditoría de Anulaciones (`cancelled_at`, `cancellation_reason`):**
   * Si un cliente desiste por demora en la plancha o hay un error de digitación, la orden pasa a `status = 'ANULADA'` con 1 solo clic en el POS. Se registra la marca de tiempo y el motivo para cuadrar cualquier diferencia en el arqueo final.
9. **Unicidad de Comanda por Turno (`UNIQUE (cash_shift_id, daily_order_number)`):**
   * Garantiza que nunca existan dos comandas con el mismo correlativo de cocina (ej. `#015`) en un mismo turno, incluso ante reintentos de red o clics repetidos.
10. **Moneda Chilena en Enteros (`integer` / `PositiveIntegerField`):**
   * El peso chileno (CLP) no tiene centavos. Modelar montos como `integer` evita problemas de redondeo de punto flotante y ahorra espacio de indexación frente a `numeric(12,2)`.
11. **Ingredientes en `jsonb`:**
   * En PostgreSQL se usa `jsonb [default: '[]']` (en Django `models.JSONField(default=list)`). Mapea de forma transparente con el array `string[]` de TypeScript en el frontend de la carta QR, sin parseos manuales de texto.

---

## 🗄️ Detalle Tabla por Tabla y sus Campos

### 1. `users` — Control de Acceso al Mesón
*Propósito:* Protección básica del All-in-One del mesón para que clientes o curiosos no toquen la caja. Compatible con `AbstractUser` de Django.
* **`id`** (Integer, PK, Increment): Identificador único del usuario.
* **`username`** (Varchar 150, Unique, Not Null): Nombre de usuario del mesón (`'admin'`).
* **`password_hash`** (Varchar 255, Not Null): Hash seguro generado por Django (PBKDF2 / Argon2).
* **`is_active`** (Boolean, Not Null, Default True): Indica si la cuenta está habilitada.
* **`created_at`** (Timestamptz, Not Null, Default `now()`): Fecha de creación del registro.

---

### 2. `categories` — Categorías del Menú
*Propósito:* Agrupar productos para la interfaz del cajero y las pestañas de navegación de la Carta QR móvil.
* **`id`** (Integer, PK, Increment): Identificador único.
* **`name`** (Varchar 50, Not Null): Nombre visible (ej. *Churrascos, Mechadas, Lomitos, Completos, Papas Fritas, Bebidas*).
* **`slug`** (Varchar 50, Unique, Not Null): Identificador para URL o filtros frontend (ej. `churrascos`, `bebidas`).
* **`sort_order`** (Integer, Not Null, Default 0): Orden de aparición en pantalla (1 para lo más vendido, etc.).
* **`is_active`** (Boolean, Not Null, Default True): Soft delete para deshabilitar categorías completas.
* **`created_at`** (Timestamptz, Not Null, Default `now()`): Fecha de registro inicial.
* **`updated_at`** (Timestamptz, Not Null, Default `now()`): Marca de última modificación para sincronización incremental.

---

### 3. `products` — Catálogo Maestro de Productos
*Propósito:* La única fuente de verdad (Single Source of Truth) de sándwiches, completos y bebidas.
* **`id`** (Integer, PK, Increment): Identificador único.
* **`category_id`** (Integer, Not Null, FK ➔ `categories.id` [delete: restrict]): Categoría a la que pertenece.
* **`name`** (Varchar 100, Not Null): Nombre comercial (ej. *Churrasco Italiano Gigante*).
* **`description`** (Text, Nullable): Texto explicativo atractivo para la carta digital.
* **`ingredients`** (JSONB, Not Null, Default `[]`): Array nativo JSON (`["palta", "tomate", "mayo"]`) alineado con `string[]` en TypeScript.
* **`price`** (Integer, Not Null): Precio final de venta en CLP (ej. `6500`).
* **`original_price`** (Integer, Nullable): Precio de referencia o precio tachado para promociones futuras online.
* **`image_url`** (Varchar 500, Nullable): Enlace o ruta CDN a la imagen del producto.
* **`badge`** (Varchar 50, Nullable): Insignia visual destacada (ej. *Más Vendido ⭐*, *Favorito 🔥*, *Para Fanáticos del Queso 🧀*).
* **`is_available`** (Boolean, Not Null, Default True): **Switch operativo diario.** Si se desmarca en el POS, se oculta instantáneamente en la Carta QR (`/menu`) y en la Landing Page (`/`).
* **`is_active`** (Boolean, Not Null, Default True): **Soft delete.** Si un producto deja de venderse permanentemente, se marca `false` sin borrarlo de la base de datos.
* **`created_at`** (Timestamptz, Not Null, Default `now()`): Fecha de alta del producto.
* **`updated_at`** (Timestamptz, Not Null, Default `now()`): Marca de actualización para sincronización offline delta.
* *Índices:*
  * `idx_products_category`: Búsqueda rápida por categoría.
  * `idx_products_active_available`: Optimiza consultas de la carta pública (`WHERE is_active = true AND is_available = true`).
  * `idx_products_updated_at`: Filtro rápido de productos modificados desde la última sincronización.

---

### 4. `modifiers` — Agregados con Costo y Exclusiones de Cocina
*Propósito:* Gestionar extras pagados y solicitudes a la plancha sin ensuciar la tabla de productos.
* **`id`** (Integer, PK, Increment): Identificador único.
* **`name`** (Varchar 50, Not Null): Nombre del modificador (ej. *Queso Mantecoso Extra*, *Tocino Crocante*, *Sin Mayo*, *Sin Ají*).
* **`price`** (Integer, Not Null, Default 0): Valor en CLP. Los extras suman dinero (ej. `900`, `1800`) y las exclusiones de cocina valen `0`.
* **`modifier_type`** (Varchar 20, Not Null, Default `'EXTRA_PAGO'`): Distingue entre `'EXTRA_PAGO'` y `'EXCLUSION_COCINA'`.
* **`is_available`** (Boolean, Not Null, Default True): Switch rápido por si se agota un ingrediente extra hoy.
* **`is_active`** (Boolean, Not Null, Default True): Soft delete del modificador.
* **`updated_at`** (Timestamptz, Not Null, Default `now()`): Sincronización delta de modificadores.
* *Índices:*
  * `idx_modifiers_active_available`: Filtro de agregados disponibles para el mesón.

---

### 5. `cash_shifts` — Turnos y Cierres de Caja Diaria (Offline-First)
*Propósito:* Registrar aperturas de turno, fondo inicial en sencillo para dar vuelto y cierres de jornada.
* **`id`** (Integer, PK, Increment): Identificador secuencial interno.
* **`uuid`** (UUID, Unique, Not Null): **Identificador universal generado por el POS.** Permite abrir y operar un turno de forma local y sincronizarlo sin colisión.
* **`user_id`** (Integer, Not Null, FK ➔ `users.id` [delete: restrict]): Usuario responsable del turno (`admin`).
* **`opened_at`** (Timestamptz, Not Null, Default `now()`): Apertura del turno. **Al abrir turno, el contador de comandas (`daily_order_number`) se reinicia a 1.**
* **`closed_at`** (Timestamptz, Nullable): Momento exacto de cierre (un valor `null` indica que el turno está activo).
* **`initial_cash`** (Integer, Not Null, Default 0): Fondo inicial en sencillo para dar vuelto (ej. `$30.000`).
* **`final_cash`** (Integer, Nullable hasta el cierre): Efectivo esperado calculado por el sistema al cerrar: fondo inicial más la suma de `total_amount` de las ventas completadas pagadas en efectivo. Las ventas anuladas se excluyen porque su anulación supone devolver el pago.
* **`counted_cash`** (Integer, Nullable): Efectivo contado físicamente; es obligatorio en un cierre manual y nulo en el cierre automático. La diferencia es `counted_cash - final_cash`; un valor positivo indica sobrante y uno negativo, faltante.
* **`closed_automatically`** (Boolean, Not Null, Default False): Indica si el turno se cerró automáticamente a las 00:30 hora de Santiago.
* **`notes`** (Text, Nullable): Observaciones del cajero al cerrar (ej. *"Faltaron $300 en monedas al cuadrar"*).
* **`updated_at`** (Timestamptz, Not Null, Default `now()`): Marca de actualización del turno.
* *Restricción operativa:* Solo puede existir 1 turno abierto a la vez (`WHERE closed_at IS NULL`).

---

### 6. `orders` — Cabecera de Ventas / Comandas (Offline-First)
*Propósito:* Registro central de cada transacción cobrada en el mesón o ingresada por delivery/WhatsApp.
* **`id`** (Integer, PK, Increment): ID secuencial histórico absoluto.
* **`uuid`** (UUID, Unique, Not Null): **Idempotency Key universal.** Generado por el cliente POS (UUIDv4) en el momento del cobro. Garantiza que si la conexión se interrumpe y el POS reintenta enviar la comanda, el servidor nunca duplicará la venta ni el dinero.
* **`cash_shift_id`** (Integer, Not Null, FK ➔ `cash_shifts.id` [delete: restrict]): Vincula la orden al turno activo.
* **`daily_order_number`** (Integer, Not Null): **Número consecutivo del día (`#001`, `#002`, `#003`...).** Se imprime grande en el ticket para llamar al cliente.
* **`created_at`** (Timestamptz, Not Null, Default `now()`): Fecha y hora emitida por el POS. Conserva la hora real de la venta para el **Gráfico de Horas Punta** aun si se sincroniza horas después.
* **`consumption_type`** (Varchar 30, Not Null, Default `'PARA_LLEVAR'`): Canal de atención:
  * `'PARA_SERVIR'`: Comer en las mesas del food truck.
  * `'PARA_LLEVAR'`: Empaque para retiro en mesón.
  * `'CONSUMO_PROPIO'`: Colación del personal/familia ($0 en total_amount, no suma dinero a la caja).
  * `'DELIVERY'`: Despacho a domicilio con recargo.
  * `'RETIRO'`: Pedido anticipado por WhatsApp pagado previamente.
* **`payment_method`** (Varchar 30, Not Null): Método de cobro: `'EFECTIVO'`, `'DEBITO_TRANSBANK'`, `'TRANSFERENCIA'`, `'SIN_COSTO_CONSUMO_PROPIO'`.
* **`subtotal`** (Integer, Not Null): Suma neta de los productos y sus agregados.
* **`delivery_fee`** (Integer, Not Null, Default 0): Recargo de despacho (ej. `$2.000` si es Delivery; `$0` en el resto).
* **`total_amount`** (Integer, Not Null): Total final cobrado (`subtotal + delivery_fee`). En consumo propio es `0`.
* **`amount_paid`** (Integer, Nullable): Monto con que pagó el cliente si fue en efectivo (ej. paga con `$20.000`).
* **`change_given`** (Integer, Nullable): Vuelto entregado (ej. `$4.700`). Permite auditorías de caja ante descuadres.
* **`status`** (Varchar 20, Not Null, Default `'COMPLETADA'`):
  * `'COMPLETADA'`: Todo pedido en mesón nace pagado y listo para plancha.
  * `'ANULADA'`: Botón de 1 clic en el POS para cancelar un pedido desistido, descontándolo del arqueo de caja.
* **`cancelled_at`** (Timestamptz, Nullable): Momento exacto en que se ejecutó la anulación.
* **`cancellation_reason`** (Varchar 255, Obligatorio al anular): Motivo registrado (ej. *"Demora excesiva en plancha"*, *"Error de digitación"*). Se guarda en la misma fila de `orders` que la venta anulada; consultar `SELECT uuid, status, cancelled_at, cancellation_reason, cancelled_by_id FROM orders WHERE uuid = '<UUID de la venta>';`. La cuenta general compartida queda como cuenta anuladora; no identifica a la persona física.
* **`updated_at`** (Timestamptz, Not Null, Default `now()`): Timestamp de sincronización o modificación.
* *Índices:*
  * `uidx_orders_shift_daily_number` (UNIQUE): `(cash_shift_id, daily_order_number)`.
  * `idx_orders_shift_status_aggregation`: Agiliza la sumatoria de caja (`WHERE cash_shift_id = :id AND status = 'COMPLETADA'`).
  * `idx_orders_created_status_rush_hours`: Filtro para analítica de horas punta por fecha.

---

### 7. `order_items` — Detalle de Productos por Orden
*Propósito:* Los productos que componen una comanda.
* **`id`** (Integer, PK, Increment): Identificador único de la línea.
* **`order_id`** (Integer, Not Null, FK ➔ `orders.id` [delete: cascade]): Orden a la que pertenece.
* **`product_id`** (Integer, Not Null, FK ➔ `products.id` [delete: restrict]): Producto solicitado.
* **`product_name`** (Varchar 100, Not Null): **Nombre congelado histórico a la fecha de venta.** Desacopla las ventas pasadas de ediciones en la carta.
* **`quantity`** (Integer, Not Null, Default 1): Cantidad pedida.
* **`unit_price`** (Integer, Not Null): **Precio unitario congelado a la fecha de venta.**
* **`notes`** (Varchar 150, Nullable): Instrucción especial para el maestro sanguchero (ej. *"Pan bien dorado"*, *"Papas sin sal"*).
* *Índices:*
  * `idx_order_items_order_id`: JOIN rápido de comanda.
  * `idx_order_items_product_id`: Estadísticas de productos más vendidos.

---

### 8. `order_item_modifiers` — Modificadores Asociados al Producto
*Propósito:* Tabla que conecta cada sándwich específico con sus agregados o exclusiones.
* **`id`** (Integer, PK, Increment): Identificador único.
* **`order_item_id`** (Integer, Not Null, FK ➔ `order_items.id` [delete: cascade]): Línea del sándwich.
* **`modifier_id`** (Integer, Not Null, FK ➔ `modifiers.id` [delete: restrict]): Agregado o exclusión seleccionada.
* **`modifier_name`** (Varchar 50, Not Null): **Nombre congelado histórico del extra/exclusión.**
* **`price_at_sale`** (Integer, Not Null, Default 0): Precio congelado del extra al momento de la venta.
* *Resultado en ticket DINON 9390:* Permite imprimir en la comanda de cocina los extras tabulados e indentados debajo del pan respectivo.

---

## 🚀 Consultas SQL Clave de Operación Diaria

### 1. Arqueo de Caja al Cierre de Turno
```sql
SELECT 
    payment_method,
    COUNT(*) AS total_pedidos,
    SUM(total_amount) AS total_recaudado
FROM orders
WHERE cash_shift_id = :id_turno_actual
  AND status = 'COMPLETADA'
GROUP BY payment_method;
```

### 2. Detección de Horas Punta (Picos de Venta Reales)
```sql
SELECT 
    DATE_TRUNC('hour', created_at) AS intervalo_hora,
    COUNT(*) AS pedidos_recibidos,
    SUM(total_amount) AS venta_por_hora
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND status = 'COMPLETADA'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY intervalo_hora DESC;
```

### 3. Sincronización Delta de Menú para el POS Offline
```sql
-- El POS solo pide lo que cambió desde su última conexión
SELECT id, name, price, is_available, is_active, updated_at
FROM products
WHERE updated_at > :ultima_sincronizacion_pos;
```
