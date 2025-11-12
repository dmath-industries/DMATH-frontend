#!/bin/sh

set -e

git fetch origin
git reset --hard origin/master

docker compose -f docker-compose.nginx.yml down || true
docker compose -f docker-compose.nginx.yml build --no-cache
docker compose -f docker-compose.nginx.yml up -d
docker image prune -f || true

sleep 5
docker compose -f docker-compose.nginx.yml ps
