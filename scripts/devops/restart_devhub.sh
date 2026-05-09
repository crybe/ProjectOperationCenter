#!/bin/bash
# Restart script for DevHub container

echo "Restarting DevHub container..."
docker compose restart devhub
echo "Done."
