# Etapa base
FROM node:22-alpine AS base
LABEL maintainer="Desarrollador <soporte@ejemplo.com>"
LABEL version="1.0"
LABEL description="sistema de gestión de bar"
RUN apk --no-cache add bash curl

# Etapa de construcción
FROM base AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa de producción
FROM base
RUN mkdir /code
WORKDIR /code
COPY package*.json ./
COPY --from=builder /build/node_modules ./node_modules
RUN ln -s /usr/share/zoneinfo/America/Cordoba /etc/localtime

CMD ["node", "src/app.js"]
