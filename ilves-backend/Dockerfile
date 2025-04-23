FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

COPY ilves-backend/package.json ./ilves-backend/
COPY shared/schemas/package.json ./shared/schemas/

RUN pnpm install --frozen-lockfile

COPY ilves-backend ./ilves-backend
COPY shared/schemas ./shared/schemas

RUN cd shared/schemas && pnpm build

RUN cd ilves-backend && pnpm build

RUN pnpm prune --prod --no-optional

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/ilves-backend/node_modules ./ilves-backend/node_modules
COPY --from=builder /app/shared/schemas/node_modules ./shared/schemas/node_modules
COPY --from=builder /app/shared/schemas/dist ./shared/schemas/dist
COPY --from=builder /app/shared/schemas/package.json ./shared/schemas/package.json
COPY --from=builder /app/ilves-backend/dist ./ilves-backend/dist
COPY --from=builder /app/ilves-backend/package.json ./ilves-backend/package.json
COPY --from=builder /app/ilves-backend/drizzle ./ilves-backend/drizzle

RUN npm install -g pnpm

COPY ilves-backend/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]

CMD ["node", "dist/src/index.js"]