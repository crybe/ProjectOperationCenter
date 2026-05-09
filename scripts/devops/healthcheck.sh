#!/bin/bash
# Healthcheck for DevHub

URL="http://localhost:5666"
STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" $URL)

if [ "$STATUS" -eq 200 ]; then
  echo "[OK] DevHub is responsive (200)"
  exit 0
else
  echo "[ERROR] DevHub returned status $STATUS"
  exit 1
fi
