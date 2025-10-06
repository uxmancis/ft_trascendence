# Use lightweight Node
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy TS source and tsconfig
COPY ./src ./src
COPY tsconfig.json ./

# Compile TypeScript
RUN npm run build

# Mount SQLite volume
VOLUME ["/data"]

# Expose port
EXPOSE 3000

# Run compiled JS
CMD ["node", "dist/index.js"]
