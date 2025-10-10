# ======================================
# Pong Game + Chat - SQLite Microservice
# Autor: Okene
# ======================================

# Imagen base ligera
FROM alpine:3.20

# Instalar SQLite
RUN apk add --no-cache sqlite

# Crear usuario no-root
RUN addgroup -g 1000 appgroup && adduser -D -u 1000 -G appgroup appuser

# Directorio de trabajo
WORKDIR /data

# Copiar los archivos necesarios
COPY init.sql /docker-entrypoint-initdb.d/init.sql
COPY entrypoint.sh /entrypoint.sh

# Permisos correctos
RUN chmod +x /entrypoint.sh && \
    chown -R appuser:appgroup /data /docker-entrypoint-initdb.d

# Volumen para persistencia
VOLUME ["/data"]

# Cambiar a usuario no-root
USER appuser

# Healthcheck opcional
HEALTHCHECK CMD sqlite3 /data/sqlite.db "SELECT 1;" || exit 1

# Ejecutar entrypoint
ENTRYPOINT ["/entrypoint.sh"]
