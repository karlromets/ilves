#!/bin/sh

set -e

echo "Running database migrations..."

cd /app/ilves-backend

pnpm db:migrate --config ./dist/drizzle.config.js

echo "Migrations finished. Starting application..."

exec "$@"