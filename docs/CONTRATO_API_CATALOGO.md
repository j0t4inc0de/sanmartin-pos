# Contrato de la API del catálogo

- **Versión:** 1.0
- **Estado:** carta pública completa y catálogo incremental autenticado del POS implementados localmente
- **Ruta:** `GET /api/menu/`

## Propósito

Entregar una fotografía completa de la carta vigente desde Django para la landing y la carta QR. La base PostgreSQL es la fuente de verdad; el frontend no mantiene una copia paralela de productos y categorías.

## Acceso y comportamiento

- La ruta es de solo lectura y no requiere iniciar sesión.
- Solo incluye categorías activas que tengan productos visibles.
- Solo incluye productos activos y disponibles cuya categoría también esté activa.
- Cambiar disponibilidad o actividad en Django Admin afecta la siguiente consulta.
- La respuesta lleva `Cache-Control: no-store` para que la disponibilidad no quede guardada por una caché HTTP.
- Los precios CLP son enteros, nunca números decimales.
- Si el catálogo está vacío, responde `200` con listas vacías.
- La edición del catálogo se realiza desde el apartado **Catálogo** del POS mediante rutas autenticadas de administración; Django Admin se conserva como herramienta local de soporte.
- Esta ruta entrega una fotografía completa para la landing y la carta QR. No es la ruta de sincronización del POS.

## Catálogo autenticado del POS

`GET /api/pos/catalog/` requiere una sesión autenticada con el permiso `sales.can_operate_pos`.

- Sin `updated_after`, devuelve la fotografía completa de categorías con productos visibles, productos activos y disponibles, y modificadores activos y disponibles.
- Con `?updated_after=<fecha ISO-8601 con zona horaria>`, devuelve solo categorías/productos/modificadores cambiados desde el cursor, más `removed: { categories, products, modifiers }` con los identificadores que el equipo debe eliminar de su catálogo local.
- El cursor se compara inclusivamente (`updated_at >= updated_after`) para no perder cambios con la misma precisión temporal. El consumidor debe aplicar el delta como upsert idempotente y eliminar las entradas listadas en `removed`.
- `generated_at` es el cursor que el cliente guarda después de aplicar correctamente la respuesta. Se envía `Cache-Control: no-store`.
- `updated_after` inválido o sin zona horaria responde `400`. Un cursor futuro válido produce un delta vacío y un nuevo `generated_at`.
- Desactivar una categoría retira también sus productos del catálogo local. Si un cambio deja una categoría sin productos disponibles, se indica como categoría retirada.

La interfaz `/pos` conserva la última copia del catálogo en IndexedDB, solicita deltas al cargar y reconectar, y vuelve a consultar cada 60 segundos mientras está online. Si no hay conexión, mantiene la copia guardada para la operación offline.

## Administración desde el POS

Las rutas de gestión requieren sesión autenticada y `sales.can_operate_pos`, igual que la operación de caja. El proyecto usa una cuenta compartida sin niveles de permiso separados; por lo tanto, todo usuario autorizado para operar el POS también puede gestionar el catálogo. Los cambios requieren conexión y se escriben directamente en Django/PostgreSQL; no se encolan ni se editan offline.

| Método y ruta | Uso |
|---|---|
| `GET/POST /api/pos/catalog/manage/categories/` | Listar todas las categorías (incluidas inactivas) y crear una categoría. |
| `GET/PATCH /api/pos/catalog/manage/categories/{id}/` | Consultar o actualizar nombre, orden y estado activo. |
| `GET/POST /api/pos/catalog/manage/products/` | Listar todos los productos y crear uno. |
| `GET/PATCH /api/pos/catalog/manage/products/{id}/` | Consultar o actualizar datos del producto, categoría, precio, disponibilidad y actividad. |
| `GET/POST /api/pos/catalog/manage/modifiers/` | Listar todos los modificadores y crear uno. |
| `GET/PATCH /api/pos/catalog/manage/modifiers/{id}/` | Consultar o actualizar nombre, precio, tipo, disponibilidad y actividad. |

Las listas de gestión muestran registros activos e inactivos. La interfaz ofrece **Retirar de la carta** y **Restaurar** como acciones explícitas y confirmadas; ambas cambian `is_active`. No se expone borrado físico (`DELETE`) porque las referencias de ventas y snapshots históricos deben conservarse. Retirar una categoría también oculta sus productos; al restaurarla, reaparecen los productos que sigan activos y disponibles. Una edición de producto/precio o disponibilidad también cambia la carta pública porque el POS y la web usan el mismo catálogo. La edición de imágenes acepta una ruta o URL existente (`image_url`); no carga archivos al servidor. Los modificadores son globales: el esquema actual no los asocia individualmente a productos.

## Respuesta

```json
{
  "generated_at": "2026-11-02T20:00:00Z",
  "categories": [
    { "slug": "sandwiches", "name": "Sándwiches", "sort_order": 1 }
  ],
  "products": [
    {
      "id": "sandwich-italiano",
      "name": "Sándwich Italiano",
      "category": "sandwiches",
      "description": "Proteína a elección, tomate, palta, mayo.",
      "ingredients": ["Proteína a elección", "Tomate", "Palta", "Mayo"],
      "price": 5200,
      "original_price": null,
      "image_url": "/productos/sandwich-italiano.jpg",
      "badge": "Más Vendido ⭐",
      "is_available": true,
      "updated_at": "2026-11-02T19:00:00Z"
    }
  ]
}
```

`products[].id` es el `slug` estable del producto. `products[].category` referencia `categories[].slug`. No se deben usar nombres visibles como identificadores.

## Catálogo local inicial

`backend/apps/catalog/fixtures/catalogo_inicial.json` conserva los datos de productos y categorías que ya estaban en la carta web. Desde `backend/` se pueden cargar con:

```powershell
.\.venv\Scripts\python.exe manage.py cargar_catalogo_inicial
```

El comando agrega categorías y productos faltantes mediante sus slugs y no sobrescribe ni elimina registros existentes. Las promociones actuales siguen fuera de la API de gestión: los combos promocionales de la carta QR son contenido fijo del frontend; `original_price` y `badge` solo son campos de presentación y no programan una promoción ni alteran el precio que cobra el POS.

## Promociones programadas — propuesta para siguiente etapa

El contrato actual no incluye promociones por fecha, combos editables ni descuentos en cotizaciones/ventas. Para que la carta QR y la caja no publiquen ni cobren importes distintos, la propuesta es administrar promociones desde **Catálogo** y guardarlas en Django: seleccionar producto(s), nombre visible, precio promocional y una fecha de vigencia local en `America/Santiago`; la oferta comienza y termina automáticamente ese día. El QR muestra el precio vigente y el precio regular, y el POS cotiza/cobra ese mismo precio. El registro de venta conserva el precio efectivamente cobrado y una referencia/snapshot de la promoción; los pagos offline usan el horario local original de la venta para decidir vigencia al sincronizar. Una promoción pausada, vencida o archivada no se ofrece a ventas nuevas; nunca modifica ventas ya cobradas.

La primera entrega debe prevenir dos promociones simultáneas para el mismo producto, validar precio promocional menor al regular, mostrar estados borrador/programada/activa/vencida, y permitir editar, pausar y duplicar una promoción. Los combos de varios productos requieren una definición aparte de composición, selección de variantes y despacho a cocina; no se deben simular con el campo `badge` ni con productos normales hasta definir ese modelo. Esta propuesta cambia la regla actual de “sin descuentos” del contrato de ventas y debe confirmarse antes de implementarse.

## Evolución del contrato

Las modificaciones incompatibles requieren una versión nueva del contrato. La ruta pública no define autenticación de caja, ventas, turnos ni permisos de edición; esos controles pertenecen a los contratos del POS.
