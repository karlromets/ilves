#!/bin/sh

set -e

echo "Running database migrations..."

node /app/ilves-backend/migrate.js

echo "Migrations finished. Starting application..."

exec "$@"