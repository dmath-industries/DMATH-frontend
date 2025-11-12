#!/bin/sh

set -e

echo "🚀 Starting deployment..."

BRANCH="${DEPLOY_BRANCH:-master}"

echo "📁 Working directory: $(pwd)"
echo "🌿 Branch: $BRANCH"

echo "📥 Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/$BRANCH

echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.nginx.yml down || true

echo "🧹 Cleaning up old images..."
docker image prune -f || true

echo "🔨 Building Docker images..."
docker compose -f docker-compose.nginx.yml build --no-cache

echo "▶️ Starting containers..."
docker compose -f docker-compose.nginx.yml up -d

echo "⏳ Waiting for containers to start..."
sleep 10

echo "✅ Checking container status..."
docker compose -f docker-compose.nginx.yml ps

echo "🏥 Checking health status..."
docker compose -f docker-compose.nginx.yml ps --filter "health=healthy" || echo "⚠️ Some containers may still be starting..."

echo "📋 Recent logs:"
docker compose -f docker-compose.nginx.yml logs --tail=20 nextjs

echo "🎉 Deployment completed successfully!"

