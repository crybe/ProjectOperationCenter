#!/bin/bash
# Für Änderungen an Dockerfile oder requirements.txt: Vollständiger Rebuild
set -e

SERVER="admin@localhost"
PORT="50022"
REMOTE="/app/"
LOCAL="$(cd "$(dirname "$0")/../../" && pwd)/"

echo "=== Deploy + vollständiger Docker-Rebuild ==="

rsync -avz --progress \
  -e "ssh -p $PORT" \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.git' \
  --exclude='backups/' \
  --exclude='*.bak*' \
  --exclude='*.old' \
  --exclude='*.backup' \
  --exclude='node_modules/' \
  --exclude='frontend/dist/' \
  --exclude='data/' \
  --exclude='*.log' \
  --exclude='.env' \
  "$LOCAL" "$SERVER:$REMOTE"

echo ""
echo "=== Docker Image neu bauen ==="
ssh -p $PORT $SERVER "cd /app && docker compose down devhub && docker compose build devhub && docker compose up -d devhub && sleep 3 && docker ps | grep devhub"

echo ""
echo "=== Done! Rebuild abgeschlossen ==="
