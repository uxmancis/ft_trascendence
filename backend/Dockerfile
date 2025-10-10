# ======================================
# Backend Fastify (Node.js + SQLite)
# ======================================
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias sin dev (compatible sin package-lock)
RUN npm install --omit=dev

# Copiar código fuente
COPY ./src ./src

# Crear carpeta persistente para la base
RUN mkdir -p /data && chown -R node:node /data

# Cambiar a usuario no-root
USER node

# Variables por defecto
ENV PORT=3000
ENV DB_PATH=/data/sqlite.db

# Volumen compartido con microservicio DB
VOLUME ["/data"]

# Exponer puerto Fastify
EXPOSE 3000

# Healthcheck simple
HEALTHCHECK CMD wget -qO- http://localhost:3000/users || exit 1

# Comando de inicio
CMD ["node", "src/app.js"]
