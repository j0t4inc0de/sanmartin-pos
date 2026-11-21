# Despliegue a Producción — San Martín POS

## 1. Arquitectura de Producción

El proyecto se divide en dos componentes desplegados de forma desacoplada y de alta disponibilidad:

- **Frontend (`sanmartin-frontend`):** Alojado en **Cloudflare Pages** (`https://sangucheriasanmartin.cl` / `https://sanmartin-frontend.pages.dev`). Opera mediante *Direct Upload*, compilando el bundle de producción con Vite (`dist/`) localmente y desplegándolo con `wrangler` hacia la rama de producción `feature/pos-online`.
- **Backend (`jota-server`):** Alojado en el servidor Ubuntu Linux `jota-server` (`/mnt/storage/sanmartin-landing`) en la red privada Tailscale (`100.99.25.56`). Corre mediante Docker Compose (`docker-compose.prod.yml`) ejecutando:
  - `sanmartin-backend`: Django 5.2 REST Framework con Gunicorn (puerto interno 8000).
  - `sanmartin-db`: PostgreSQL 16 Alpine en contenedor saludable.
  - Conectado a `proxy_network` y publicado al exterior mediante **Cloudflare Tunnel** hacia `sangucheriasanmartin.cl/api/`, `/admin/` y `/media/`.

---

## 2. Despliegue del Frontend (Cloudflare Pages)

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

> **Nota de autenticación:** Si `wrangler` solicita iniciar sesión en un equipo nuevo, ejecutar `npx wrangler login` (usar cuenta `juan.erices04@inacapmail.cl`) y luego volver a ejecutar el comando de despliegue.

---

## 3. Rol de `jota-server` y cuándo actualizar el contenedor

`jota-server` mantiene vivo el **backend (Django REST)** y la base de datos **PostgreSQL**.

### ¿Cuándo NO es necesario tocar `jota-server`?
- Cuando los cambios son **únicamente de frontend** (archivos dentro de `src/`, componentes React, estilos Tailwind/CSS, hooks). En este caso basta con el despliegue a Cloudflare Pages.

### ¿Cuándo SÍ hay que actualizar `jota-server`?
- Cuando se añaden nuevas **migraciones** de base de datos (`backend/apps/*/migrations/`).
- Cuando se modifican modelos, serializers, vistas o URLs en `backend/`.
- Cuando se actualiza `requirements.txt`, `Dockerfile` o `docker-compose.prod.yml`.

---

## 4. Cómo actualizar `jota-server` vía SSH

Las credenciales del servidor se encuentran en `C:\Users\jeric\Documents\Ficheros\Home-Sever\.env` (`SSH_HOST=100.99.25.56`, `SSH_USER=jota-server`).

### Conexión:
```bash
ssh jota-server@100.99.25.56
```

### Actualización completa (recomendada para cambios de backend o migraciones):
Dado que `sanmartin-backend` copia el código dentro de la imagen de Docker durante el build (`COPY . /app/`), **siempre se debe reconstruir la imagen con `--build`** para que el contenedor tome el código nuevo y su `entrypoint.sh` ejecute automáticamente `python manage.py migrate`:

```bash
cd /mnt/storage/sanmartin-landing
git pull origin feature/pos-online
docker compose -f docker-compose.prod.yml up -d --build sanmartin-backend
```

### Verificación del despliegue en el servidor:
```bash
# 1. Verificar que los contenedores estén levantados y sanos
docker compose -f docker-compose.prod.yml ps

# 2. Revisar los últimos logs de arranque de Django / Gunicorn
docker compose -f docker-compose.prod.yml logs --tail=40 sanmartin-backend

# 3. Comprobar que las migraciones quedaron aplicadas
docker compose -f docker-compose.prod.yml exec sanmartin-backend python manage.py showmigrations sales
```

### Prueba de conectividad HTTP directa:
```bash
curl -I https://sangucheriasanmartin.cl/api/auth/csrf/
# Debe responder HTTP/2 200 OK
```
