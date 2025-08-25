# Etapa 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependencias para desarrollo y compilación
COPY package*.json ./
RUN npm install

# Copia todo el código fuente
COPY . .

# Genera cliente Prisma y compila la app
RUN npx prisma generate
RUN npm run build

# Etapa 2: Producción
FROM node:22-alpine

WORKDIR /app

# Solo dependencias necesarias en producción
COPY package*.json ./
RUN npm install --production

# Copia la app compilada y Prisma desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Si usas .env (opcional)
COPY --from=builder /app/.env .env

ENV NODE_ENV=production
EXPOSE 3000

# Ejecuta Prisma migrate con manejo de errores explícito
CMD ["sh", "-c", "npx prisma migrate deploy || (echo '[ERROR] Prisma migrate failed' && exit 1); node dist/src/main"]
