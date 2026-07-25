#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/zeroone-website}"

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  echo "Missing $APP_DIR/.env. Copy .env.docker.example to .env and fill production secrets first."
  exit 1
fi

docker compose --env-file .env config >/dev/null
docker compose --env-file .env up -d --build --remove-orphans
docker compose --env-file .env ps
