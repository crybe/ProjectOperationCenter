#!/bin/bash
# Nexus Watchdog - Minimalist health monitor for Raspberry Pi 5
# To be run via crontab: * * * * * /app/System-Utilities/maintenance/watchdog.sh

HEALTH_URL="http://127.0.0.1:5000/health"
LOG_FILE="/app/data/logs/watchdog.log"
MAX_RETRIES=3

function log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

FAIL_COUNT=0
for i in $(seq 1 $MAX_RETRIES); do
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL")
    
    if [ "$STATUS_CODE" -eq 200 ]; then
        exit 0 # All good
    else
        log "Health check failed (Attempt $i/$MAX_RETRIES) - Status: $STATUS_CODE"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        sleep 5
    fi
done

if [ "$FAIL_COUNT" -ge "$MAX_RETRIES" ]; then
    log "CRITICAL: Nexus Hub unresponsive. Triggering container restart..."
    # Safe restart via docker-compose
    cd /app && docker-compose restart hub
    log "Restart command sent."
fi
