FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Montamos el volumen /data para sqlite
VOLUME ["/data"]

EXPOSE 3000
CMD ["npm", "start"]
