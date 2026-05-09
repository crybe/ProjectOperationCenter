#!/bin/bash
# Backup script for DevHub data

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "Starting backup of data directory..."
tar -czf "$BACKUP_DIR/devhub_data_$TIMESTAMP.tar.gz" ./data/
echo "Backup completed: $BACKUP_DIR/devhub_data_$TIMESTAMP.tar.gz"
