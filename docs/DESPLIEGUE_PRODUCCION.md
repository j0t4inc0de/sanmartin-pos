# Despliegue a Producción — San Martín POS

## 1. Arquitectura de Producción

El proyecto se divide en dos partes desplegadas de forma independiente:

- **Frontend (`sanmartin-frontend`):** Alojado en **Cloudflare Pages** (`https://sangucheriasanmartin.cl` / `https://sanmartin-frontend.pages.dev`). Actualmente opera sin conexión automática a Git (*Direct Upload*), por lo que se despliega compilando `dist/` localmente y subiéndolo con `wrangler` a la rama de producción `feature/pos-online`.
- **Backend (`jota-server`):** Alojado en el servidor `jota-server` (`/mnt/storage/sanmartin-landing`) mediante Docker Compose (`docker-compose.prod.yml`). Ejecuta la API de Django, la base de datos y sirve los archivos multimedia (`/media/`).

---

## 2. Subir cambios del Frontend a Producción (Cloudflare Pages)

Ejecutar desde PowerShell en la raíz del proyecto local (`C:\Users\jeric\Documents\Ficheros\Fullstack\sanmartin-pos`):

```powershell
# 1. Asegurar que la rama está al día
git checkout feature/pos-online
git pull origin feature/pos-online

# 2. Instalar dependencias (solo si cambió package.json o falta node_modules)
npm install

# 3. Compilar el proyecto para producción (genera la carpeta dist/)
npm run build

# 4. Desplegar a Cloudflare Pages
npx wrangler pages deploy dist --project-name sanmartin-frontend --branch feature/pos-online
```

> Si `wrangler` solicita autenticación, ejecuta primero `npx wrangler login` y luego repite el paso 4.

---

## 3. Rol de `jota-server` y cuándo reiniciar contenedores

`jota-server` es el servidor que mantiene vivo el **backend (Django)** y la **base de datos**.

### ¿Cuándo NO es necesario tocar `jota-server`?
- Cuando los cambios son **solo de frontend** (archivos dentro de `src/`, estilos CSS, componentes React). En ese caso basta con desplegar en Cloudflare Pages.

### ¿Cuándo SÍ hay que actualizar/reiniciar `jota-server`?
- Cuando hay cambios en `backend/` (modelos, vistas, serializers, URLs, permisos).
- Cuando hay nuevas **migraciones** de base de datos.
- Cuando se modifican `requirements.txt`, `Dockerfile` o `docker-compose.prod.yml`.

---

## 4. Cómo actualizar y reiniciar contenedores en `jota-server`

Conéctate al servidor y entra a la carpeta del proyecto:

```bash
cd /mnt/storage/sanmartin-landing
git pull origin feature/pos-online
```

Luego aplica según el tipo de cambio:

### A. Si hubo cambios solo en código Python (views, serializers, etc.)
```bash
docker compose -f docker-compose.prod.yml restart sanmartin-backend
```

### B. Si hubo cambios en modelos / base de datos
```bash
docker compose -f docker-compose.prod.yml exec sanmartin-backend python manage.py migrate
docker compose -f docker-compose.prod.yml restart sanmartin-backend
```
*(Si falta generar el archivo de migración: `docker compose -f docker-compose.prod.yml exec sanmartin-backend python manage.py makemigrations` antes de `migrate`.)*

### C. Si cambió `requirements.txt` o `Dockerfile` (reconstruir imagen)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Verificación rápida
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50 sanmartin-backend
```
