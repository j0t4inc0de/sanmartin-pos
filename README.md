# Sanguchería San Martín — Sistema Web & POS Fullstack 🍔🍟

Sistema informático integral para el Food Truck **Sanguchería San Martín** (Puente Alto, Santiago de Chile), desarrollado por **We Are Samod**. Comprende la Carta Digital QR para clientes, Landing Page oficial y el Punto de Venta (POS) para computadores Todo en Uno (All-in-One) en el mesón de atención con soporte de impresión térmica y operación fuera de línea (*Offline-First*).

---

## 1. Arquitectura de Producción

El proyecto opera desacoplado en dos capas de alta disponibilidad y rendimiento:

```
                            INTERNET / CLIENTES
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │     Cloudflare Edge Network     │
                    │     sangucheriasanmartin.cl     │
                    └────────┬───────────────┬────────┘
                             │               │
           Archivos Estáticos│               │ Rutas Dinámicas
           (SPA / Vite)      │               │ (/api/*, /admin/*, /media/*)
                             ▼               ▼
               ┌───────────────────────────┐   ┌───────────────────────────┐
               │  Cloudflare Pages         │   │ Cloudflare Zero Trust     │
               │  sanmartin-frontend       │   │ Tunnel Seguro             │
               └───────────────────────────┘   └─────────────┬─────────────┘
                                                             │
                                                             ▼
┌─ Servidor jota-server (Ubuntu Linux 6.8 / Red Tailscale 100.99.25.56) ─────────┐
│                                                                                │
│   ┌────────────────────────────────────────────────────────────────────────┐   │
│   │ Red Docker: proxy_network                                              │   │
│   │                                                                        │   │
│   │   ┌─────────────────────────┐          ┌───────────────────────────┐   │   │
│   │   │  cloudflare-tunnel      │─────────▶│  sanmartin-backend        │   │   │
│   │   │  (cloudflared daemon)   │          │  (Django REST Framework)  │   │   │
│   │   └─────────────────────────┘          │  Puerto interno: 8000     │   │   │
│   │                                        └─────────────┬─────────────┘   │   │
│   │                                                      │                 │   │
│   │                                        ┌─────────────▼─────────────┐   │   │
│   │                                        │  sanmartin-db             │   │   │
│   │                                        │  (PostgreSQL 16 Alpine)   │   │   │
│   │                                        └───────────────────────────┘   │   │
│   └────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────┘
```

- **Dominio de Producción:** [https://sangucheriasanmartin.cl](https://sangucheriasanmartin.cl)
- **Frontend Pages:** [https://sanmartin-frontend.pages.dev](https://sanmartin-frontend.pages.dev)
- **Django Admin:** [https://sangucheriasanmartin.cl/admin/](https://sangucheriasanmartin.cl/admin/)
- **API Base:** [https://sangucheriasanmartin.cl/api/](https://sangucheriasanmartin.cl/api/)

---

## 2. Tecnologías Utilizadas

- **Frontend:**
  - React 19 + TypeScript + Vite 8
  - Tailwind CSS + Lucide Icons + Framer Motion
  - IndexedDB (persistencia de turnos, borradores, cola de sincronización offline y diagnósticos)
  - Protocolo ESC/POS binario para comandas de cocina y boletas térmicas de 80 mm
- **Backend:**
  - Python 3.12/3.14 + Django 5.2 LTS + Django REST Framework
  - PostgreSQL 16 (transacciones atómicas, bloqueos pesimistas `select_for_update`, constraints de cuadratura)
  - Gunicorn (WSGI Server en contenedor Docker)
- **Infraestructura & CI/CD:**
  - Cloudflare Pages (Deploy Direct Upload con Wrangler)
  - Cloudflare Zero Trust Tunnel
  - Docker & Docker Compose (`docker-compose.prod.yml`)
  - Red privada Tailscale

---

## 3. Estructura del Proyecto

```
sanmartin-pos/
├── backend/                       # Código del backend Django REST
│   ├── apps/
│   │   ├── catalog/               # Categorías, productos, fotos y modificadores
│   │   ├── sales/                 # Turnos de caja, cotizaciones firmadas, órdenes e historial
│   │   └── users/                 # Modelo de usuario personalizado y permisos POS
│   ├── config/                    # Configuración WSGI, settings y URLs de Django
│   ├── Dockerfile                 # Imagen de producción del backend
│   └── entrypoint.sh              # Script de inicio (migraciones automáticas y gunicorn)
├── docs/                          # Documentación técnica, contratos y planes de prueba
│   ├── DESPLIEGUE_PRODUCCION.md   # Guía paso a paso para desplegar frontend y backend
│   ├── proyecto_sanmartin_pos_arquitectura.md # Especificación arquitectónica global
│   ├── CONTRATO_API_VENTAS.md     # Contrato formal de órdenes, cotizaciones y caja
│   ├── CONTRATO_API_CATALOGO.md   # Contrato de consulta y administración de menú
│   └── CONTRATO_API_REPORTES.md   # Especificación de reportes y arqueos contables
├── src/                           # Código del frontend React
│   ├── components/                # Componentes UI (PosPage, PosSalesPanel, QrMenuPage, etc.)
│   ├── hooks/                     # Custom hooks (useMenuCatalog, useCart, etc.)
│   ├── services/                  # Clientes API, persistencia IndexedDB y puente de impresión
│   └── types/                     # Interfaces TypeScript
├── tests/                         # Suites de pruebas de integración y resolución de conflictos
├── docker-compose.prod.yml        # Orquestación de producción en jota-server
└── vite.config.ts                 # Configuración de compilación y proxies locales
```

---

## 4. Funcionalidades Principales

### A. Punto de Venta (POS - `/pos`)
1. **Flujo de Venta Ágil:** Pantalla ancha optimizada para computadores Todo en Uno (All-in-One), diseñada para atención rápida con teclado y mouse.
2. **Proteína a Elección en Sándwiches:** Detección automática en sándwiches con selector obligatorio de 5 proteínas: *Churrasco*, *Lomo*, *Mechada*, *Pollo* o *Hamburguesa*.
3. **Nombre de Cliente Obligatorio:** Registro de `customer_name` para vocear pedidos listos.
4. **Tipos de Pedido & Delivery:** Venta *Para servir* y *Para llevar* (con campo opcional de recargo `delivery_fee`).
5. **Resolución de Conflictos de Folio (409):** Manejo inteligente con botón de desbloqueo inmediato sin congelar la caja ante desincronizaciones de red o pestañas múltiples.
6. **Impresión Térmica ESC/POS (DINON 9390):**
   - Comanda de cocina con tipografía destacada en negrita y doble altura.
   - Comprobante para el cliente con logotipo de la sanguchería.
   - Tirilla de Cierre de Caja ("VENTA DEL DÍA") con desglose contable (efectivo, tarjeta, transferencia).
   - Apertura automática de gaveta RJ11 en cobros en efectivo.
7. **Modo Offline-First:** Cobro continuo sin conexión con sincronización automática en cola FIFO e idempotencia estricta por `UUIDv4`.

### B. Carta Digital QR (`/menu`) y Landing Page (`/`)
- Conexión dinámica a la API de Django (`GET /api/menu/`).
- Búsqueda en vivo por ingredientes y filtrado instantáneo por categoría.
- Promociones automáticas sincronizadas con la categoría real del local (*"Promos Definitiva"*).

---

## 5. Entorno de Desarrollo Local

### Requisitos:
- Node.js 20+ y npm
- Python 3.12 o 3.14 con PostgreSQL 16 (puerto local `5433` o `5432`)

### 1. Iniciar el Backend (Django):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 2. Iniciar el Frontend (Vite):
```powershell
# En la raíz del proyecto
npm install
npm run dev
```
- La app estará disponible en `http://localhost:5173/` (Vite reenvía `/api/` al backend local en el puerto 8000).
- El POS estará en `http://localhost:5173/pos`.
- La Carta QR estará en `http://localhost:5173/menu`.

---

## 6. Procedimiento de Despliegue

Consulta la guía detallada en [docs/DESPLIEGUE_PRODUCCION.md](file:///C:/Users/jeric/Documents/Ficheros/Fullstack/sanmartin-pos/docs/DESPLIEGUE_PRODUCCION.md).

- **Frontend (Cloudflare Pages):**
  ```powershell
  npm run build
  npx wrangler pages deploy dist --project-name sanmartin-frontend --branch feature/pos-online
  ```
- **Backend (jota-server):**
  ```bash
  ssh jota-server@100.99.25.56
  cd /mnt/storage/sanmartin-landing
  git pull origin feature/pos-online
  docker compose -f docker-compose.prod.yml up -d --build sanmartin-backend
  ```
