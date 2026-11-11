#!/bin/sh
set -e

echo "==> Verificando conexión a PostgreSQL..."
until python -c "import os, psycopg; psycopg.connect(dbname=os.environ.get('POSTGRES_DB','sanmartin_pos'), user=os.environ.get('POSTGRES_USER','sanmartin_user'), password=os.environ.get('POSTGRES_PASSWORD',''), host=os.environ.get('POSTGRES_HOST','sanmartin-db'), port=os.environ.get('POSTGRES_PORT','5432'))" 2>/dev/null; do
  echo "Base de datos no disponible todavía, esperando 2 segundos..."
  sleep 2
done
echo "==> Base de datos conectada exitosamente."

echo "==> Aplicando migraciones de base de datos..."
python manage.py migrate --noinput

echo "==> Recopilando archivos estáticos..."
python manage.py collectstatic --noinput --clear 2>/dev/null || true

echo "==> Iniciando Gunicorn en 0.0.0.0:8000..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile -
