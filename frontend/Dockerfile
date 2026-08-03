# ---------- BUILD ----------
FROM node:20-alpine AS builder

# Build-time env vars — Next.js bakes NEXT_PUBLIC_* into the bundle.
# MUST be provided at build time (Render build args / docker-compose). Empty by
# default so we never bake localhost into the production bundle.
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_SOCKET_URL=
ARG NEXT_PUBLIC_WS_URL=
ARG NEXT_PUBLIC_AGORA_APP_ID=

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_AGORA_APP_ID=$NEXT_PUBLIC_AGORA_APP_ID

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# ---------- RUN ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Force the standalone server to bind all interfaces regardless of the
# container's HOSTNAME (Render/Next standalone gotcha).
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]