#!/bin/bash
# ------------------------------------------------------------------------------
# Tactical Deployment Script
# ------------------------------------------------------------------------------
# Funktion: Synchronisiert lokale Änderungen auf den Server und startet den
#           Docker-Container (devhub) neu. Enthält automatischen Rollback-Schutz.
# ------------------------------------------------------------------------------
set -e

# Konfiguration
SERVER="admin@localhost"
PORT="50022"
REMOTE="/app/"
BACKUP_REMOTE="/app_bak_deploy/"
LOCAL="$(cd "$(dirname "$0")/../../" && pwd)/"

echo "=== Pre-Deploy: Frontend Build ==="
cd "$LOCAL/frontend" && npm run build
cd "$LOCAL"

echo "=== Pre-Deploy: Server Backup erstellen ==="
ssh -p $PORT $SERVER "rm -rf $BACKUP_REMOTE && cp -r $REMOTE $BACKUP_REMOTE"

echo "=== Deploy: Lokale Änderungen → Server ==="

rsync -avz --delete --progress \
  -e "ssh -p $PORT" \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.git' \
  --exclude='backups/' \
  --exclude='*.bak*' \
  --exclude='*.old' \
  --exclude='*.backup' \
  --exclude='node_modules/' \
  --exclude='data/' \
  --exclude='*.log' \
  --exclude='.env' \
  "$LOCAL" "$SERVER:$REMOTE"

echo ""
echo "=== Container neu starten ==="
ssh -p $PORT $SERVER "cd /app && docker compose up -d --build"

echo ""
echo "=== Healthcheck & Rollback-Schutz ==="
ssh -p $PORT $SERVER "
  echo 'Warte 5 Sekunden auf Container-Start...'
  sleep 5
  if curl -sSf http://127.0.0.1:5666/login > /dev/null; then
      echo 'Healthcheck OK. DevHub läuft stabil auf http://localhost:5666'
  else
      echo '!!! HEALTHCHECK FEHLGESCHLAGEN !!!'
      echo 'Führe Auto-Rollback aus...'
      rm -rf /app/*
      cp -r /app_bak_deploy/* /app/
      cd /app
      docker compose up -d
      echo 'Rollback abgeschlossen. Alter Zustand wiederhergestellt.'
      exit 1
  fi
"

