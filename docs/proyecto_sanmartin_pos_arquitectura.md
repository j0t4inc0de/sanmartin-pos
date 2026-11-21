# Proyecto: Food Truck San Martín — Arquitectura, Despliegue y Sistema POS 🚀

> **Cliente:** Sanguchería San Martín - Food Truck  
> **Ubicación:** Av. Gabriela Oriente #01216, Puente Alto, Chile  
> **Desarrollado por:** We Are Samod — Soluciones Informáticas & Desarrollo Fullstack  
> **Servidor Host Backend:** `jota-server` (Ubuntu Linux 6.8 / Red Tailscale `100.99.25.56`)  
> **Hosting Frontend:** Cloudflare Pages (`https://sangucheriasanmartin.cl` / `https://sanmartin-frontend.pages.dev`)  
> **Fecha de Actualización:** 21 de Noviembre de 2026 (Versión 2.5 — Producción Oficial, Proteína a Elección, Delivery, Impresión Térmica ESC/POS & Arqueo Cierre)

---

## 1. Infraestructura y Topología de Producción

El sistema opera bajo una arquitectura desacoplada de alto rendimiento:

```
                                    CLIENTES / DISPOSITIVOS
                             ┌───────────────────────────────────┐
                             │ • Mesón Food Truck (All-in-One)   │
                             │ • Teléfonos Clientes (Carta QR)   │
                             │ • Navegadores Web (Landing Page)  │
                             └─────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌─────────────────────────────────┐
                              │     Cloudflare Edge Network     │
                              │     sangucheriasanmartin.cl     │
                              └────────┬───────────────┬────────┘
                                       │               │
                     Rutas Estáticas   │               │ Rutas Dinámicas
                     (HTML/JS/CSS/SPA) │               │ (/api/*, /admin/*, /media/*)
                                       ▼               ▼
                 ┌───────────────────────────┐   ┌───────────────────────────┐
                 │  Cloudflare Pages         │   │ Cloudflare Zero Trust     │
                 │  (Direct Upload con Vite) │   │ Tunnel (Túnel cifrado)    │
                 │  sanmartin-frontend       │   └─────────────┬─────────────┘
                 └───────────────────────────┘                 │
                                                               ▼
┌─ jota-server (Host Linux 100.99.25.56) ────────────────────────────────────────────────────────┐
│                                                                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Red Docker: proxy_network                                                              │   │
│   │                                                                                        │   │
│   │   ┌─────────────────────────────┐        ┌─────────────────────────────────────────┐   │   │
│   │   │  cloudflare-tunnel          │───────▶│  sanmartin-backend                      │   │   │
│   │   │  (cloudflared daemon)       │        │  (Django REST Framework 5.2 / Gunicorn) │   │   │
│   │   └─────────────────────────────┘        │  Puerto interno: 8000                   │   │   │
│   │                                          └────────────────────┬────────────────────┘   │   │
│   │                                                               │                        │   │
│   │                                          ┌────────────────────▼────────────────────┐   │   │
│   │                                          │  sanmartin-db                           │   │   │
│   │                                          │  (PostgreSQL 16 Alpine en contenedor)   │   │   │
│   │                                          └─────────────────────────────────────────┘   │   │
│   └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                │
│   Directorio físico en host: /mnt/storage/sanmartin-landing                                    │
│   Volúmenes persistentes: sanmartin_db_data (Postgres), sanmartin_media (fotos catálogo)        │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Dominios y Enrutamiento:
- **Dominio Principal:** `https://sangucheriasanmartin.cl`
- **Frontend SPA (Cloudflare Pages):**
  - `/` ➔ Landing Page Oficial (Hero, Características, Ubicación, Testimonios y Promociones reales).
  - `/menu` ➔ Carta Digital QR móvil con buscador, filtros y fotos reales de sándwiches y chorrillanas.
  - `/pos` ➔ Sistema POS de Venta, Catálogo, Reportes de Caja y Diagnóstico de Impresora.
- **Backend API (jota-server a través del túnel):**
  - `/api/*` ➔ Django REST API (ventas, cotización, turnos, catálogo, reportes).
  - `/admin/*` ➔ Django Admin para administración y gestión de usuarios.
  - `/media/*` ➔ Archivos multimedia e imágenes cargadas para productos del catálogo.

---

## 2. Frontend (React 19 + TypeScript + Vite + Tailwind CSS)

### A. Vistas Principales:
1. **Carta Digital QR (`QrMenuPage.tsx`):**
   - Consume en tiempo real el catálogo de Django mediante el hook `useMenuCatalog()`.
   - Búsqueda instantánea por nombre o ingredientes.
   - Pestañas dinámicas según categorías activas.
   - Cero datos hardcodeados: las promociones se leen desde la categoría real del local (*"Promos Definitiva"*).
2. **Landing Page (`App.tsx` / `CombosSection.tsx`):**
   - Muestra promociones dinámicas activas obtenidas de la API.
   - Si no hay promociones activas en la BD, la sección se oculta de forma limpia y transparente.
3. **Punto de Venta (`PosPage.tsx` / `PosSalesPanel.tsx`):**
   - Diseño optimizado para pantalla ancha de computador Todo en Uno (All-in-One).
   - 4 Espacios de trabajo: **Caja (Ventas)**, **Catálogo**, **Reportes** y **Dispositivos (Impresora)**.
   - Botón destacado y ergonómico `VOLVER A CAJA` en todas las pantallas secundarias.

---

## 3. Funcionalidades Clave del POS de San Martín

### A. Gestión de Sándwiches con "Proteína a Elección":
- Los sándwiches que indican en su descripción o ingredientes *"Proteína a elección"* exigen seleccionar obligatoriamente una de las 5 opciones:
  - **Churrasco**, **Lomo**, **Mechada**, **Pollo** o **Hamburguesa**.
- Los productos de receta fija o vegetarianos no despliegan selector de proteína.
- La proteína elegida se guarda en `OrderItem.protein_choice` y se imprime destacada en la comanda de cocina.

### B. Nombre del Cliente Obligatorio:
- Cada pedido exige capturar el `customer_name` (1 a 100 caracteres).
- Se utiliza para llamar al cliente en mesón cuando su pedido está listo y se imprime en tamaño doble en la comanda de cocina y en el comprobante del cliente.

### C. Tipos de Consumo y Delivery:
- **Para Servir:** Consumo en mesas del mesón.
- **Para Llevar:** Pedido empaquetado para retiro en mesón. Admite agregar un recargo de envío opcional (`delivery_fee`) si el cliente solicita despacho.
- Se eliminó la figura de consumo propio sin costo del flujo de ventas ordinario para garantizar cuadratura contable estricta.

### D. Resolución Inteligente de Conflictos 409 (Folios e Idempotencia):
- Si el navegador experimenta un conflicto de folio (por ejemplo, dos equipos o pestañas cotizando al mismo tiempo):
  - El sistema no se congela ni simula falsamente un fallo de red.
  - Muestra un banner de error explícito y el botón **"Actualizar folio y desbloquear carrito"**.
  - Al confirmarlo, borra el borrador pendiente de `IndexedDB`, resincroniza el folio correlativo (`nextOrderNumber`) desde `/api/shifts/current/` y permite cotizar nuevamente sin perder los productos cargados.

### E. Integración de Impresión Térmica ESC/POS (DINON 9390):
- **Puente Local Windows (`posPrinter.ts`):** Servicio local en `http://127.0.0.1:9390/print` con timeout de 15 segundos vía `AbortController`.
- **Comandas de Cocina:** Tipografía en negrita y doble altura/ancho (`esc(29, 33, 17)`) para máxima legibilidad de productos, notas de cocina y exclusiones.
- **Logo del Local:** Encabezado gráfico de San Martín en el comprobante de cliente (`posPrinterLogo.ts`).
- **Apertura de Gaveta RJ11:** Pulso eléctrico automático al confirmar pagos en efectivo.
- **Tirilla de Cierre de Turno ("VENTA DEL DÍA"):** Al cerrar la caja, imprime el resumen contable (inicio, fin, desglose por Efectivo, Tarjeta, Transferencia y Total General).

---

## 4. Arquitectura Offline-First y Resiliencia

1. **Persistencia Local Dual:**
   - Carrito activo y cobro pendiente respaldados en **IndexedDB** (`posLocalStore.ts`).
   - Si la ventana se recarga o se corta la energía, el borrador se restaura íntegro.
2. **Cola de Sincronización FIFO:**
   - Las ventas realizadas sin conexión se acumulan localmente y se transmiten al servidor en estricto orden cronológico (`created_at`).
3. **Idempotencia vía UUID:**
   - Cada orden nace con un `UUIDv4`. Si una petición de cobro sufre timeout pero llega al servidor, el reintento devuelve la orden creada sin duplicar ítems ni cobros.
4. **Catálogo Delta:**
   - La pantalla de ventas consulta cambios incrementales del menú mediante `updated_after`, sincronizando precios, modificadores y bajas lógicas (`is_deleted`).

---

## 5. Endpoints REST Principales

| Método | Endpoint | Permiso | Descripción |
| :---: | :--- | :---: | :--- |
| **`GET`** | `/api/menu/` | Público | Catálogo activo y disponible para Landing y Menú QR. |
| **`GET`** | `/api/auth/session/` | `IsAuthenticated` | Verifica sesión activa y datos del usuario. |
| **`GET/POST`** | `/api/shifts/current/` | `sales.can_operate_pos` | Consulta el turno activo, otro turno abierto y el `next_order_number`. |
| **`POST`** | `/api/shifts/open/` | `sales.can_operate_pos` | Apertura de turno con monto inicial en efectivo. |
| **`POST`** | `/api/shifts/{uuid}/close/` | `sales.can_operate_pos` | Cierre de turno manual con conteo físico de efectivo y notas. |
| **`POST`** | `/api/orders/quote/` | `sales.can_operate_pos` | Cotización firmada con precios vigentes, validación de proteína y cálculo de totales. |
| **`POST`** | `/api/orders/` | `sales.can_operate_pos` | Registro definitivo de venta pagada (idempotente). |
| **`POST`** | `/api/orders/sync/` | `sales.can_operate_pos` | Sincronización de ventas generadas en modo offline. |
| **`POST`** | `/api/orders/{uuid}/cancel/` | `sales.can_operate_pos` | Anulación de venta con motivo obligatorio. |
| **`GET`** | `/api/reports/sales/` | `sales.can_operate_pos` | Reporte de ventas del día, semana o mes con horas punta y medios de pago. |
| **`GET/POST/DELETE`** | `/api/pos/catalog/manage/products/` | `sales.can_operate_pos` | Administración de productos con soft delete (`is_deleted`) y subida de imágenes. |
