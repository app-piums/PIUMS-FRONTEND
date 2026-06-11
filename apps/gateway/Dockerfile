# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm typescript

# Copiar archivos de dependencias del workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/gateway/package.json ./apps/gateway/package.json

# Instalar dependencias
RUN pnpm install --no-frozen-lockfile

# Copiar código fuente del gateway
COPY apps/gateway/ ./apps/gateway/

# Compilar TypeScript desde la raíz del workspace
RUN cd apps/gateway && npx tsc

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copiar package.json y instalar solo producción con npm (sin pnpm symlinks)
COPY apps/gateway/package.json ./package.json
RUN npm install --production --ignore-scripts 2>/dev/null || npm install --production

# Copiar el build compilado
COPY --from=builder /app/apps/gateway/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

USER node
CMD ["node", "dist/index.js"]
