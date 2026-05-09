#!/bin/bash
# Aktuelle Server-Version → Lokal synchronisieren
set -e

SERVER="admin@localhost"
PORT="50022"
REMOTE="/app/"
LOCAL="$(cd "$(dirname "$0")/../../" && pwd)/"

echo "=== Pull: Server → Lokal ==="

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
  "$SERVER:$REMOTE" "$LOCAL"

echo ""
echo "=== Lokale Kopie aktuell! ==="
