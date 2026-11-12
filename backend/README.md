# Backend San Martín POS

Backend Django REST Framework del POS. Este servicio vive separado del frontend en este mismo repositorio.

## Requisitos del entorno

- Python 3.14 actualizado. Python 3.15 puede permanecer instalado, pero el entorno usa 3.14 porque el proyecto está fijado a Django 5.2 LTS.
- PostgreSQL 16 local instalado en Windows. Docker Desktop es opcional.
- Las dependencias fijadas en `requirements.txt`.

No usar Python 3.10 para iniciar este servicio: esa versión terminó su soporte de seguridad. No conectar este entorno local a la base de datos de producción.

## Preparar la configuración local

Desde la raíz del repositorio, en PowerShell:

```powershell
if (-not (Test-Path .\backend\.env)) { Copy-Item .\backend\.env.example .\backend\.env }
```

Edita `backend/.env` y reemplaza `DJANGO_SECRET_KEY` y `POSTGRES_PASSWORD` por valores locales privados. El archivo `.env` está excluido de Git. No copies contraseñas de producción.

Para generar un secreto local después de instalar las dependencias:

```powershell
backend\.venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Crear el entorno de Python

En este equipo, el lanzador `py` no detecta la instalación de Python 3.14. Por eso, selecciona el intérprete directamente desde la carpeta del perfil de Windows:

```powershell
$python314Path = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python314\python.exe'
& $python314Path --version
& $python314Path -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install --upgrade pip
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

## Instalar e iniciar PostgreSQL local

Descarga el instalador para Windows desde la [página oficial de PostgreSQL](https://www.postgresql.org/download/windows/), que enlaza al instalador de EDB. Instala PostgreSQL 16 y pgAdmin; define una contraseña para el usuario administrador `postgres` y guárdala en un lugar seguro.

En pgAdmin, crea un rol de aplicación llamado `sanmartin_dev` con permiso de inicio de sesión y una contraseña local propia. Luego crea la base `sanmartin_pos` y asígnala a ese rol como propietario. No uses el usuario `postgres` en la aplicación Django.

En `backend/.env`, configura los valores con los que creaste el rol:

```text
POSTGRES_DB=sanmartin_pos
POSTGRES_USER=sanmartin_dev
POSTGRES_PASSWORD=TU_CLAVE_LOCAL
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5433
```

Verifica en Servicios de Windows que el servicio de PostgreSQL 16 esté iniciado.

## Alternativa: PostgreSQL en Docker

Si Docker Desktop llega a estar disponible, puedes usar en su lugar:

```powershell
docker compose --env-file backend/.env -f backend/compose.local.yml up -d base_datos
```

El contenedor publica su puerto solo en `127.0.0.1`; no queda expuesto a otros equipos de la red. No ejecutes a la vez esta alternativa y el servicio nativo usando el mismo puerto.

## Ejecutar el backend

```powershell
Set-Location backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Ejecuta `makemigrations` y revisa la migración solo cuando cambien los modelos. Ejecuta `createsuperuser` solo cuando aún no exista una cuenta administrativa. No aplicar el hash de ejemplo de `docs/init_schema.sql`.

El servidor de desarrollo debe escuchar solo en la interfaz local. No usar `runserver` como servidor de producción.

## Abrir el proyecto local

PostgreSQL 16 debe estar iniciado en el puerto `5433`. Abre dos terminales PowerShell desde la raíz del repositorio y deja ambas abiertas mientras trabajas.

**Terminal 1 — backend Django:**

```powershell
Set-Location .\backend
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

**Terminal 2 — frontend Vite:**

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Abre la carta en `http://localhost:5173/menu` o el sitio en `http://localhost:5173/`. Django Admin está en `http://localhost:8000/admin/`. Vite reenvía `/api/` y `/admin/` al backend local.

La pantalla online de acceso y turnos del POS está en `http://localhost:5173/pos`. Para autorizar un cajero, inicia sesión en Django Admin, crea el grupo `Operadores POS`, asígnale `sales.can_operate_pos` y agrega la cuenta del cajero. El superusuario puede acceder para administración local.

## Estructura

- `config/`: configuración y arranque Django.
- `apps/users/`: usuario propio basado en `AbstractUser`.
- `apps/catalog/`: categorías, productos y modificadores.
- `apps/sales/`: turnos, ventas y detalle histórico.
- `compose.local.yml`: PostgreSQL local de desarrollo; no participa en el despliegue actual.

## Catálogo inicial y API

La carta pública se consulta en `GET /api/menu/`. Responde con categorías y productos activos y disponibles, sin exigir autenticación ni ofrecer edición. El contrato está en `docs/CONTRATO_API_CATALOGO.md`.

Para cargar en la base local las 8 categorías y los 64 productos que ya estaban en la carta web, ejecuta desde `backend/`:

```powershell
.\.venv\Scripts\python.exe manage.py cargar_catalogo_inicial
```

La carga agrega registros faltantes y conserva los existentes. Las promociones siguen siendo contenido web y no se convierten en productos de caja.

## Acceso POS y turnos

El contrato online de sesión y turnos está en `docs/CONTRATO_API_ACCESO_CAJA.md`. Para autorizar cajeros, en Django Admin crea un grupo y asígnale el permiso `sales.can_operate_pos`; luego agrega los usuarios al grupo. El superusuario puede operar localmente.

Las migraciones de Django serán la fuente ejecutable del esquema. `docs/init_schema.sql` y `docs/models_django_reference.py` son referencias por auditar, no se deben aplicar directamente.

## Ventas online iniciales

Con un usuario autorizado y un turno abierto, `/pos` permite seleccionar productos del catálogo autorizado (`GET /api/pos/catalog/`), configurar cantidades, extras y exclusiones, cotizar en el servidor y registrar ventas online. El detalle histórico conserva los nombres y precios utilizados. La cotización expira a los cinco minutos y el backend valida el pago y el vuelto.

Esta etapa requiere conexión continua al backend. El carrito aún no tiene persistencia local y no existe todavía la cola de sincronización offline; completa y prueba esa etapa antes de usar la pantalla para ventas reales.

## Pruebas de la API de ventas

Las pruebas automatizadas de cotización, pago, idempotencia, permisos, CSRF y anulación usan una base SQLite temporal en memoria. Así se pueden ejecutar sin tocar PostgreSQL local:

```powershell
Set-Location .\backend
.\.venv\Scripts\python.exe manage.py test apps.sales.test_orders_api --settings=config.test_settings
```

Estas pruebas no validan los bloqueos y la concurrencia específicos de PostgreSQL. Para esa validación se debe usar una base de pruebas PostgreSQL separada de la base de desarrollo.
