# Imagen base
FROM alpine:3.20

RUN apk add --no-cache sqlite

# Usuario no-root
RUN addgroup -g 1000 appgroup && adduser -D -u 1000 -G appgroup appuser

WORKDIR /data

# Copia archivos
COPY init.sql /docker-entrypoint-initdb.d/init.sql
COPY entrypoint.sh /entrypoint.sh

# 🔧 Normaliza EOL y permisos (muy importante en Windows)
RUN sed -i 's/\r$//' /entrypoint.sh && \
    chmod +x /entrypoint.sh && \
    chown -R appuser:appgroup /data /docker-entrypoint-initdb.d

VOLUME ["/data"]

USER appuser

HEALTHCHECK CMD sqlite3 /data/sqlite.db "SELECT 1;" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
