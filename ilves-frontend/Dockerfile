FROM node:20-slim AS builder

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml* ./

COPY ilves-frontend/package.json /app/ilves-frontend/
COPY shared/schemas/package.json ./shared/schemas/

RUN pnpm install --frozen-lockfile

COPY ilves-frontend /app/ilves-frontend
COPY shared /app/shared

RUN cd /app/shared/schemas && pnpm build

WORKDIR /app/ilves-frontend

RUN pnpm build

CMD ["echo", "Frontend build container. Build output is in /app/ilves-frontend/dist"]