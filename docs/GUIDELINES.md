# CLAUDE.md – Antigravity / Nexus-Control-Hub (Server-Änderungen)

## Projektkontext

**Antigravity Nexus-Control-Hub** ist ein persönliches Flask-Dev-Hub auf dem Raspberry Pi 5.

- **Live-Server-Pfad:** `/app/` (auf `localhost`)
- **Lokaler Arbeitspfad:** `/home/user/Dokumente/Antigravity/Server-Änderungen/Nexus-Control-Hub/`
- **Stack:** Python 3 · Flask 3 · Gunicorn · Docker · Groq AI
- **Container:** `devhub` läuft auf `127.0.0.1:5666` (nur auf Server)

## Verbindliche Regeln (immer beachten)

Alle Regeln gelten bei **jeder** Arbeit an diesem Projekt. Keine darf ohne Begründung ignoriert werden:

@rules/rules.md
@rules/security.md
@rules/styling.md
@rules/refactor.md
@rules/audit.md
@rules/deploy-workflow.md
@rules/integration.md
@rules/frontend.md

## Deployment-Workflow (Server-Änderungen)

Dieses Verzeichnis ist der lokale Arbeits-Spiegel des Live-Projekts.
Scripts liegen in `../` (ein Ordner höher als dieses Verzeichnis):

```bash
# Lokale Änderungen → Server pushen + Container-Restart (~2s)
cd /home/user/Dokumente/Antigravity/Server-Änderungen
./deploy.sh

# Aktuellen Stand vom Server holen (z.B. nach direkter Bearbeitung auf Server)
./pull.sh

# Vollständiger Rebuild (nur bei Änderungen an Dockerfile oder requirements.txt)
./rebuild.sh

# Logs direkt auf Server prüfen
ssh -p 50022 admin@localhost "docker logs devhub -f --tail=50"

# Container-Shell auf Server
ssh -p 50022 admin@localhost "docker exec -it devhub /bin/bash"
```

## Wichtiger Hinweis zu security.md

`security.md` ist bei diesem Projekt besonders kritisch:
- Path-Traversal-Schutz bei **jeder** Datei-Route prüfen
- `SECRET_KEY` niemals hardcoden oder in Logs ausgeben
- Neue subprocess-Aufrufe immer mit `shell=False`

## Wichtiger Hinweis zum Arbeitsablauf

- **`.env`** liegt lokal in diesem Ordner und enthält Produktionswerte – niemals committen
- **`data/`** ist vom rsync ausgeschlossen – Live-Daten bleiben nur auf dem Server
- Nach `./deploy.sh` antwortet der Container auf dem Server – kein lokaler Testlauf
- Wenn du direkt auf dem Server etwas änderst: vorher `./pull.sh` ausführen, sonst überschreibt der nächste `./deploy.sh` die Änderung
