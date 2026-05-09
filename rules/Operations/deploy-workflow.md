# Deploy-Workflow – Server-Änderungen

## Goldene Regel

**Vor jeder Arbeitssession:** Prüfen ob auf dem Server direkt etwas geändert wurde:
```bash
ssh -p 50022 admin@localhost "git -C /app log --oneline -3"
```
Wenn ja → `./pull.sh` zuerst. Sonst überschreibt das nächste `./deploy.sh` die Server-Änderungen.

---

## deploy.sh vs rebuild.sh

| Situation | Script |
|---|---|
| Python-Code, HTML, CSS, Jinja geändert | `./deploy.sh` (Container restart, ~3s) |
| `Dockerfile` oder `requirements.txt` geändert | `./rebuild.sh` (Image neu bauen, ~2-5 min) |
| Nur Frontend (`.tsx`/`.ts`) geändert | → **Siehe frontend.md**, Build erfolgt lokal via `npm run build` |

## Was rsync NICHT überträgt

Diese Dateien/Ordner existieren nur auf dem Server und werden nie überschrieben:
- `data/` → Live-Daten (projects.json, token_usage.json, etc.) – niemals lokal simulieren
- `.env` → Produktions-Secrets – Änderungen manuell per SCP übertragen:
  ```bash
  scp -P 50022 Nexus-Control-Hub/.env admin@localhost:/app/.env
  ```
- `backups/`, `*.bak*`, `*.log` → Rauschen, nicht relevant
- `frontend/node_modules/` → zu groß, verbleibt auf dem jeweiligen System (lokal/server)

## Nach dem Deploy verifizieren

```bash
# Schnell-Check: Läuft der Container noch?
ssh -p 50022 admin@localhost "docker ps | grep devhub"

# Logs auf Fehler prüfen
ssh -p 50022 admin@localhost "docker logs devhub --tail=30 2>&1 | grep -E 'ERROR|Traceback|error' || echo 'Keine Fehler'"

# Syntax-Check vor dem Deploy (lokal)
python3 -m py_compile Nexus-Control-Hub/app.py && echo "Syntax OK"
```

## Konflikt-Vermeidung

- Niemals gleichzeitig lokal und direkt auf dem Server editieren
- Nach direkter SSH-Bearbeitung auf dem Server immer `./pull.sh` lokal ausführen
- `data/`-Inhalte nie lokal anlegen – sie entstehen ausschließlich durch den laufenden Container

## .env-Änderungen

Neue Umgebungsvariablen brauchen **drei Schritte**:
1. Lokal in `Nexus-Control-Hub/.env` eintragen
2. Manuell per SCP auf Server übertragen (oben)
3. `./deploy.sh` (Container liest .env beim Start neu)
