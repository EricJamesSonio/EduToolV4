# ---------- BUILD STAGE ----------
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Prisma generate
RUN npx prisma generate

# Build NestJS
RUN npm run build


# ---------- PRODUCTION STAGE ----------
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
# TICK-INFRA-018: documents intent — production runs in UTC (like Render).
# The code must NOT depend on this (every read uses ORG_TIMEZONE or an
# explicit zone); the value only reproduces prod behavior for anything that
# still reads the process zone.
ENV TZ=UTC

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Static assets (org logos, profiles, seeded school images)
COPY uploads ./uploads

EXPOSE 5000

CMD ["node", "dist/main.js"]