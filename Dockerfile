# syntax=docker/dockerfile:1
# QR Menü — canlı imaj (Next.js standalone). Ayrıntılar: docs/YAYIN.md

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma'nın migration motoru openssl ister.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Bağımlılıklar (postinstall Prisma istemcisini üretir)
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# Derleme. NEXT_PUBLIC_* değişkenleri derleme anında koda gömülür.
# R2_PUBLIC_URL de derlemede gerekir: next.config'deki görsel izin listesi
# (images.remotePatterns) standalone çıktıya derleme anında yazılır; verilmezse
# canlıda R2'deki görseller next/image tarafından reddedilir.
FROM deps AS builder
ARG NEXT_PUBLIC_APP_URL
ARG R2_PUBLIC_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL R2_PUBLIC_URL=$R2_PUBLIC_URL
COPY . .
RUN npx prisma generate && npm run build

# Migration ve seed için (tek seferlik çalışır): tam node_modules ile
FROM deps AS migrator
COPY prisma ./prisma
COPY lib ./lib
COPY messages ./messages
CMD ["npx", "prisma", "migrate", "deploy"]

# Çalışan uygulama: yalnızca standalone çıktı
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
