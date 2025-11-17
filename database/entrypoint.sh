#!/bin/sh
set -e

DB_FILE="/data/sqlite.db"
INIT_FILE="/docker-entrypoint-initdb.d/init.sql"

echo "========================================"
echo "🧱 Iniciando servicio SQLite..."
echo "Base de datos: $DB_FILE"
echo "Script init:  $INIT_FILE"
echo "========================================"

rm -rf "/data/sqlite.db"

# Inicializar base de datos solo si no existe
if [ ! -f "$DB_FILE" ]; then
  echo "📀 Base de datos no encontrada. Creando nueva..."
  sqlite3 "$DB_FILE" < "$INIT_FILE"
  echo "✅ Base de datos inicializada correctamente."
else
  echo "ℹ️  Base de datos existente. No se recrea."
fi

# Permitir acceso al backend
chmod 660 "$DB_FILE"

echo "✅ Servicio SQLite listo. Esperando conexiones..."
exec sleep infinity
