#!/bin/sh
set -e

echo "🚀 Initializing BuddyAi container..."

# Run database push to ensure SQLite database is up to date
npx prisma db push --accept-data-loss

# Seed initial default companions
node prisma/seed.js || true

# Start Telegram daemon in background if enabled
if [ "$ENABLE_TELEGRAM_BOT" = "true" ]; then
  echo "🤖 Launching Telegram polling daemon..."
  node scripts/telegram-daemon.mjs &
fi

echo "✨ Starting BuddyAi web application on port 3005..."
exec npm run start -- -p 3005
