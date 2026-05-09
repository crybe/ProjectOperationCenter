# Betrieb

## Neustart
docker compose restart devhub

## Logs
docker logs -f devhub
journalctl -u devhub-ctrl -f

## Backup
./System-Utilities/backup_devhub.sh

## Health
curl http://localhost:5666/health
curl http://localhost:5000/health
curl http://localhost:9090/-/healthy
