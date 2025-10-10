# --- build igual que ya tienes ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json vite.config.ts tailwind.config.cjs postcss.config.cjs index.html ./
COPY src ./src
RUN npx tailwindcss -i ./src/styles.css -o /tmp/_tw.css --minify --config ./tailwind.config.cjs || \
    (echo '❌ Tailwind no está configurado correctamente' && exit 1)
ENV NODE_ENV=production
RUN npm run build

# --- runtime ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# 👇 Copiamos el nginx.conf completo al path global
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
