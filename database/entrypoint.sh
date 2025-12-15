#!/bin/sh
set -e

DB_FILE="/data/sqlite.db"
INIT_FILE="/docker-entrypoint-initdb.d/init.sql"

echo "========================================"
echo "🧱 Inicializando SQLite..."
echo "DB: $DB_FILE"
echo "========================================"

# Asegurar permisos del bind mount (42-friendly)
chmod 770 /data || true

if [ ! -f "$DB_FILE" ]; then
  echo "📀 Creando base de datos..."
  sqlite3 "$DB_FILE" < "$INIT_FILE"
  chmod 660 "$DB_FILE" || true
  echo "✅ Base de datos creada."
else
  echo "ℹ️ Base de datos ya existe."
fi

echo "✅ SQLite inicializado. Saliendo."
