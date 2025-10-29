# --- build ---
FROM node:20-alpine AS build
WORKDIR /app

# Copiamos manifest(s) primero para aprovechar cache
COPY package.json package-lock.json* ./

# Instala deps del proyecto
RUN npm ci || npm install

# 👇 Asegura Babylon en el entorno de build (por si no está en package.json)
#    Recomendado también añadirlas a tu package.json en local.
RUN npm install @babylonjs/core @babylonjs/loaders @babylonjs/gui @babylonjs/materials --save

# Copiamos resto de fuentes
COPY tsconfig.json vite.config.ts tailwind.config.cjs postcss.config.cjs index.html ./
COPY src ./src

# Compila Tailwind si lo usas
RUN npx tailwindcss -i ./src/styles.css -o /tmp/_tw.css --minify --config ./tailwind.config.cjs || \
    (echo '❌ Tailwind no está configurado correctamente' && exit 1)

ENV NODE_ENV=production

# 🔹 Compila el bundle con Vite
RUN npm run build

# --- runtime ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
