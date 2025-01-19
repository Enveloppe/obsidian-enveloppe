# Build and export plugin artifacts.
# Usage: `docker build --output ./dist .`

FROM node:20-slim AS base
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install
COPY . .

FROM base AS builder
WORKDIR /usr/src/app
RUN pnpm run build

FROM scratch AS export
COPY --from=builder /usr/src/app/dist /
