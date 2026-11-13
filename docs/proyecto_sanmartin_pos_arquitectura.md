# Proyecto: Food Truck San Martín — Arquitectura, Despliegue y Sistema POS 🚀

> **Cliente:** Sanguchería San Martín - Food Truck  
> **Ubicación:** Av. Gabriela Oriente #01216, Puente Alto, Chile  
> **Desarrollado por:** We Are Samod — Soluciones Informáticas & Desarrollo Fullstack  
> **Servidor Host:** `jota-server` (Ubuntu Linux 6.8 / Red Tailscale)  
> **Condiciones Comerciales (Acuerdo con Diego):**  
> - **Desarrollo Total:** $230.000 CLP en 2 cuotas:
>   - **1ra Cuota (Inicio):** $115.000 CLP (ya pagada íntegra a Juan).
>   - **2da Cuota (Entrega Final):** $115.000 CLP al finalizar el desarrollo ($65.000 CLP para Benjamín y $50.000 CLP para Juan).
> - **Mantenimiento & Servidor:** $60.000 CLP / mensual (MRR recurrente en `jota-server`: Mes c/Diego: Servidor $20k, Juan $15k, Benja $15k, Diego $10k; Mes s/Diego: Servidor $30k, Juan $15k, Benja $15k).  
> **Fecha de Actualización:** 6 de Noviembre de 2026 (Versión 2.2 — Dominio Oficial .CL, Cierre Auto 00:00 & Release 16 Nov)  

---

## 1. Infraestructura y Rutas en el Servidor (`jota-server`)

El proyecto se encuentra desplegado y funcionando en producción bajo la infraestructura de contenedores Docker y enrutamiento seguro mediante Cloudflare Tunnel.

```
                                      INTERNET
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │ Cloudflare Zero Trust │
                             │  sanmartin.           │
                             │  wearesamod.com       │
                             └───────────┬───────────┘
                                         │ Túnel Seguro
                                         ▼
┌─ jota-server (Host: 100.99.25.56) ───────────────────────────────────┐
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │ Red Docker: proxy_network                                    │   │
│   │                                                              │   │
│   │   ┌───────────────────────┐      ┌─────────────────────────┐ │   │
│   │   │  cloudflare-tunnel    │─────▶│  sanmartin-landing      │ │   │
│   │   │  (cloudflared daemon) │      │  Puerto interno: 80     │ │   │
│   │   └───────────────────────┘      └────────────┬────────────┘ │   │
│   │                                               │                  │
│   │   ┌───────────────────────┐      ┌────────────▼────────────┐ │   │
│   │   │  sanmartin-db         │◀────┤  sanmartin-backend      │ │   │
│   │   │  (PostgreSQL 16)      │      │  (Django REST 5.x)      │ │   │
│   │   └───────────────────────┘      └─────────────────────────┘ │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   Ruta física en host:                                               │
│   /mnt/storage/sanmartin-landing      [ Nginx Alpine SPA ]           │
│                                       ├── / ──▶ En Construcción      │
│                                       ├── /menu ──▶ Carta QR         │
│                                       └── /assets ──▶ JS/CSS         │
└──────────────────────────────────────────────────────────────────────┘
```

### Rutas y Parámetros del Servidor:
- **Directorio de Trabajo en Host:** `/mnt/storage/sanmartin-landing`
- **Nombre del Contenedor Frontend:** `sanmartin-landing`
- **Nombre del Contenedor Backend:** `sanmartin-backend` (Django 5.x REST API en Docker)
- **Base de Datos:** `sanmartin-db` (PostgreSQL 16 en contenedor, puerto interno `5432`)
- **Red de Docker Conectada:** `proxy_network` (compartida con `cloudflare-tunnel`)
- **Puerto Expuesto Frontend:** `80/tcp` (aislado internamente en Docker)
- **Configuración Nginx:** SPA routing (`try_files $uri $uri/ /index.html;`)
- **Dominio Oficial Registrado:** `https://sangucheriasanmartin.cl` (Inscrito en NIC Chile, gestionado vía Cloudflare con SSL automático)
- **Dominio de Contingencia/Desarrollo:** `https://sanmartin.wearesamod.com`
  - `/` ➔ Landing Page Oficial
  - `/menu` ➔ Carta Digital QR
  - `/sistema-sanmartin` (o `/pos`) ➔ Sistema POS y Dashboard (Login único usuario `admin`)

---

## 2. Estado Actual del Desarrollo Frontend (Landing & Carta QR)

El frontend está desarrollado en **React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion**.

### A. Vistas Implementadas y Estrategia Activa:

| Ruta | Componente | Descripción y Estado Actual |
| :--- | :--- | :--- |
| **`/`** | `UnderConstruction.tsx` | **Pantalla de presentación temporal activa.** Muestra la identidad del Food Truck, el logo con aura dorada, el crédito corporativo de *We Are Samod*, aviso de desarrollo y botón directo a la Carta QR. |
| **`/menu`** | `QrMenuPage.tsx` | **Carta Digital 100% operativa.** Optimizada para teléfonos móviles. Incluye buscador instantáneo por ingredientes, pestañas por categoría, fotos reales, precios en CLP, desglose de ingredientes y barra inferior de estado (*"¡Plancha Caliente! Abierto ahora / Mar a Dom: 18:30 - 23:30"*). |
| **Landing Completa** | `App.tsx` | Conservada al 100% tras la bandera `SHOW_FULL_LANDING = false`. Contiene Hero, Menú interactivo, sección Nosotros, Mapa verificado de Google Maps, Testimonios y Carrito de pedidos. |

> ⚠️ **Sincronización API:** Tanto la **Landing Page (`/`)** como el **Menú QR (`/menu`)** hoy operan con datos estáticos (`menuData.ts`). La fase fullstack conectará estas vistas al endpoint `GET /api/menu/` para reflejar en vivo los precios, ofertas y el switch `"is_available"` (ocultando productos agotados).

---

## 3. Arquitectura del Sistema POS: Hardware y Operación Local

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EQUIPO LOCAL EN FOOD TRUCK                           │
│           ASUS All-in-One (Windows 11) en Mesón de Atención            │
│       Operado por el cajero con Teclado Físico y Mouse (Sin táctil)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ├──▶ Navegador Chromium (Modo Kiosk)
                                    │    • Almacenamiento Local (IndexedDB / Cache API)
                                    │    • Cola de sincronización offline con UUIDs
                                    │
                                    └──▶ Conexión USB Directa
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │   DINON THERMAL PRINTER 9390  │
                         │   • Ancho: 80 mm              │
                         │   • Protocolo: ESC/POS        │
                         │   • Velocidad: 160 mm/s       │
                         └───────────────┬───────────────┘
                                         │ Puerto RJ11 (24V 1A)
                                         ▼
                         ┌───────────────────────────────┐
                         │      Gaveta de Dinero         │
                         │ (Apertura automática efectivo)│
                         └───────────────────────────────┘
                                         ▲
                                         │ Sincronización API (Online / Offline-First)
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR CENTRAL                               │
│              jota-server (PostgreSQL 16 + Django REST Framework)       │
├────────────────────────────────────────────────────────────────────────┤
│ • Catálogo Maestro (Precios, Modificadores, Switch is_available)       │
│ • Registro de Ventas Inmutables, Cierre de Caja y Gráfico Horas Punta  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        Carta QR del Local                   Landing Page Oficial
             (`/menu`)                               (`/`)
    (Actualización inmediata)              (Actualización inmediata)
```

---

## 4. Arquitectura Offline-First (Venta Ininterrumpida sin Internet)

El Food Truck opera en Puente Alto sobre conexión móvil (4G/Wi-Fi). Ante caídas de red:

1. **Operación Local Completa (0 Downtime):**
   * El POS sigue cobrando, calculando vuelto, imprimiendo boletas en la DINON 9390 y abriendo la gaveta sin necesidad de internet.
   * Los pedidos y el turno de caja se almacenan temporalmente en el **IndexedDB** del navegador.
2. **Idempotencia mediante `UUIDv4`:**
   * Cada orden se genera con un `uuid` único universal desde el All-in-One.
   * Al regresar la conexión, el POS sincroniza las órdenes pendientes contra el endpoint `POST /api/pos/orders/sync/`.
   * El servidor ejecuta `INSERT ... ON CONFLICT (uuid) DO NOTHING` (o `update_or_create`). Si la conexión parpadea a la mitad, **jamás se duplica una orden ni se descuadra el dinero de la caja**.
3. **Preservación de Hora Real (`created_at` del POS):**
   * El timestamp de venta se guarda tal como se cobró localmente, protegiendo la exactitud del **Gráfico de Horas Punta** aun si la sincronización ocurre 2 horas más tarde.
4. **Sincronización Delta de Catálogo (`updated_at`):**
   * Al reconectar y durante la operación online, el POS consulta `GET /api/pos/catalog/?updated_after=<timestamp>`, recibiendo categorías, productos y modificadores modificados, además de identificadores explícitos para retirar los elementos desactivados/no disponibles.

---

## 5. Contratos de la API REST (Especificación de Endpoints)

| Método | Endpoint | Acceso | Descripción |
| :---: | :--- | :---: | :--- |
| **`GET`** | `/api/menu/` | Público | Categorías y productos activos/disponibles para la Carta QR y Landing. |
| **`POST`** | `/api/auth/token/` | Público | Autenticación del usuario único del mesón (`admin`) vía JWT / Session. |
| **`GET`** | `/api/pos/catalog/` | `sales.can_operate_pos` | Catálogo completo o cambios incrementales con bajas explícitas mediante `?updated_after=...`. |
| **`GET/POST/PATCH`** | `/api/pos/catalog/manage/{categories,products,modifiers}/` | `sales.can_operate_pos` | Administrar el catálogo desde el POS; conserva registros mediante desactivación y no expone borrado físico. |
| **`PATCH`** | `/api/pos/products/{id}/availability/` | `admin` | Switch rápido de disponibilidad diaria (`is_available: true/false`). |
| **`POST`** | `/api/pos/shifts/` | `admin` | Apertura o cierre de turno de caja (gestiona `uuid`, `initial_cash`, `notes`). |
| **`POST`** | `/api/pos/orders/sync/` | `admin` | Sincronización en lote de órdenes offline o creación en tiempo real con `uuid`. |
| **`POST`** | `/api/pos/orders/{id}/cancel/` | `admin` | Anulación en 1 clic de una comanda con registro de `cancellation_reason`. |
| **`GET`** | `/api/pos/reports/shift-summary/{id}/` | `admin` | Arqueo automático de caja agregando por método de pago. |
| **`GET`** | `/api/pos/reports/rush-hours/` | `admin` | Agrupación por intervalos de hora para el gráfico de horas punta. |
| **`GET`** | `/api/reports/sales/?period=day&date=YYYY-MM-DD`, `?period=week&date=YYYY-MM-DD` o `?period=month&month=YYYY-MM` | `sales.can_operate_pos` | Reporte agregado por período: pagos, anulaciones, ranking de productos, horas y turnos. La semana comercial es martes a domingo. Ver `docs/CONTRATO_API_REPORTES.md`. |

---

## 6. Reglas de Negocio Reales del Local (Acuerdos con Diego)

1. **Se paga ANTES de preparar:** El pedido se cobra en mesón, se imprime el ticket para el cliente + comanda de plancha y se abre la gaveta. Al despachar el pan, el papel de cocina se bota. Por ello, las órdenes nacen en estado **`COMPLETADA`**.
2. **5 Tipos de Consumo:** `PARA_SERVIR`, `PARA_LLEVAR`, `CONSUMO_PROPIO` ($0 en total, colación del personal), `DELIVERY` (+ recargo de envío) y `RETIRO` (pedidos anticipados por WhatsApp).
3. **Modificadores Asociados al Producto:** En `order_items`, cada sándwich tiene sus `order_item_modifiers` (*Extra Queso $900*, *Sin Mayo $0*) para imprimir tabulados justo debajo del pan en el ticket térmico.
4. **Inmutabilidad Contable:** Se congelan `product_name`, `unit_price`, `modifier_name` y `price_at_sale` en la venta para que futuras ediciones de la carta no alteren el historial contable.
5. **Cero Sobreingeniería:** Sin combos por el momento (todo se vende unitario contundente), sin pesaje de ingredientes en gramos, sin tablas externas redundantes para estados. Sin migración de datos antiguos de Tkinter.
6. **Mecánica de Anulación y Gaveta DINON 9390:** El botón de 1 clic `ANULAR PEDIDO` no borra la orden de la base de datos (queda `status = 'ANULADA'`), pero descuenta el dinero inmediatamente del arqueo de caja. Si el pago original fue en efectivo, el POS envía el comando de pulso RJ11 a la impresora DINON 9390 para abrir automáticamente la gaveta y realizar el reembolso.
7. **Cierre Automático de Caja (00:00):** Si el personal olvida cerrar turno tras el límite habitual de las 23:30, el sistema ejecuta el cierre automático a las 00:00 registrando la nota: *"Caja cerrada automáticamente por inactividad / sistema"*.
8. **Diseño de Interfaz Desktop Widescreen:** El POS opera en computador Todo en Uno (All-in-One); ocupa el 100% del ancho de pantalla, organiza las vistas mediante pestañas superiores (sin scrolls verticales largos), elimina botones distractores ("Volver a la web") e incorpora un reloj digital en tiempo real en la barra de sesión activa.

---

## 7. Hoja de Ruta de Desarrollo y Entrega Final

| Hito / Fecha | Alcance | Responsable | Estado |
| :---: | :--- | :---: | :---: |
| **Hito 1** | Landing comercial, Carta QR `/menu`, material publicitario y despliegue en `jota-server`. | Juan Erices | **100% Completado** ✅ |
| **Hito 2** | Modelo Entidad-Relación (MER), DDL PostgreSQL 16, modelos Django 5.x y arquitectura Offline-First. | Juan Erices | **100% Completado** ✅ |
| **Hito 3** | Dominio oficial `sangucheriasanmartin.cl` comprado en NIC Chile y configurado en Cloudflare. | Juan Erices | **100% Completado** ✅ |
| **Miércoles 11 Nov** | Cierre de desarrollo frontend POS (desktop widescreen, pestañas, anulación y reloj). | Benjamín Martínez | En desarrollo ⏳ |
| **Jueves 12 - Viernes 13** | Pruebas integrales y auditoría de flujo (caja, tickets DINON 9390, cierres y anulaciones). | Juan + Benjamín | Programado |
| **Sábado 14 - Domingo 15** | Despliegue final de base de datos PostgreSQL y backend en `jota-server`. | Juan Erices | Programado |
| **Lunes 16 Nov 2026** | **Entrega Oficial e Instalación en el Food Truck (Puesta en marcha con Diego)**. | Equipo SAM | **HITO FINAL** 🎯 |
