#!/bin/sh
echo "Pushing database schema..."
until npx prisma db push --accept-data-loss; do
  echo "Database is unavailable - sleeping for 5 seconds..."
  sleep 5
done
echo "Starting Next.js..."
exec node server.js
