FROM node:20-alpine

WORKDIR /app

# Copiamos solo package.json primero (cache)
COPY package*.json ./

RUN npm install

# Copiamos el resto
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
