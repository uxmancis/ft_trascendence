# ======================================
# Frontend (Vite + TS + Tailwind)
# Hot reload permanente
# Build disponible para corrección
# ======================================
FROM node:20-alpine

WORKDIR /app

# Dependencias (cache-friendly)
COPY package.json package-lock.json* ./
RUN npm install

# Código fuente (fallback, el volume manda)
COPY tsconfig.json vite.config.ts tailwind.config.cjs postcss.config.cjs index.html ./
COPY src ./src

EXPOSE 5173

# Hot reload siempre activo
CMD ["npm", "run", "dev"]
