#!/bin/sh
echo "Waiting for database to be ready..."
sleep 15
echo "Pushing database schema..."
npx prisma db push --accept-data-loss
echo "Starting Next.js..."
exec node server.js
