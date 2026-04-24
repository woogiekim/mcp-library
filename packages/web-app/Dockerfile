FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/web-app/package.json ./packages/web-app/
COPY packages/mcp-client-core/package.json ./packages/mcp-client-core/
COPY shared/types/package.json ./shared/types/
RUN npm ci

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/web-app/package.json ./packages/web-app/
COPY packages/mcp-client-core/package.json ./packages/mcp-client-core/
COPY shared/types/package.json ./shared/types/
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/web-app ./packages/web-app
COPY packages/mcp-client-core ./packages/mcp-client-core
COPY shared/types ./shared/types
COPY package.json ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=packages/web-app

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/packages/web-app/.next/standalone ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/web-app/.next/static ./packages/web-app/.next/static
COPY --from=builder /app/packages/web-app/public ./packages/web-app/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
