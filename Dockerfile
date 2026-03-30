FROM node:20-slim AS web-builder

WORKDIR /app/web

COPY web/package*.json ./
RUN npm ci

COPY web/ ./
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=3000

COPY api/package*.json ./
RUN npm ci --omit=dev

COPY api/ ./
COPY --from=web-builder /app/web/dist ./public

EXPOSE 3000

CMD ["node", "server.js"]
