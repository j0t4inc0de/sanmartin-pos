# Contrato de la API del catálogo

- **Versión:** 1.0
- **Estado:** primera versión local
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
- No expone rutas para crear o editar catálogo; esos cambios se hacen desde Django Admin hasta definir permisos administrativos de API.
- Esta primera versión entrega un catálogo completo. La sincronización delta para el POS offline se diseñará por separado cuando se defina su cursor y política de cambios.

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

El comando agrega categorías y productos faltantes mediante sus slugs y no sobrescribe ni elimina registros existentes. Las promociones web permanecen fuera de la API del POS y del catálogo de productos inicial.

## Evolución del contrato

Las modificaciones incompatibles requieren una versión nueva del contrato. La respuesta actual no define autenticación de caja, ventas, turnos, sincronización delta ni permisos de edición.
