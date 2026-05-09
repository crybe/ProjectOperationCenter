# Audit – Antigravity / Nexus-Control-Hub

## Wann ein Audit durchführen?

- Vor größeren Feature-Releases
- Nach Sicherheitsvorfällen oder Verdacht auf unautorisierten Zugriff
- Quartalsweise (Docker-Image-Updates, Python-Dependency-Updates)

---

## Code-Audit Checkliste

### Auth & Session
- [ ] `SECRET_KEY` ist ein zufälliger Wert (≥ 32 Bytes) in `.env`, nicht im Code
- [ ] Alle nicht-public Routes haben `@login_required`
- [ ] Session wird bei `/logout` vollständig geleert (`session.clear()`)
- [ ] Session-Lifetime ist auf 8h begrenzt

### Input-Validierung
- [ ] Alle Pfad-Parameter werden gegen `BASE_PATH` geprüft (`os.path.realpath()`)
- [ ] Kein User-Input fließt unvalidiert in `subprocess.run()` oder `os.system()`
- [ ] AJAX-Parameter (POST-Body JSON) werden auf Typ und Länge geprüft
- [ ] `..` in Dateinamen-Parametern wird blockiert

### Secrets & Konfiguration
- [ ] `.env` enthält keine Test-Werte (`change-me`, `test123`, `admin`)
- [ ] Groq-API-Key ist gültig und nicht im Code oder Git-History
- [ ] `.env` steht in `.gitignore`
- [ ] Kein Secret taucht in Docker-Logs auf

### Abhängigkeiten
```bash
# Installierte Versionen prüfen
docker exec devhub pip list

# Flask und Gunicorn auf aktuelle Version prüfen
docker exec devhub pip install flask gunicorn --dry-run 2>&1 | grep -E "flask|gunicorn"
```
- [ ] Flask ≥ 3.0 (aktuelle Security-Patches)
- [ ] Gunicorn ≥ 22.0
- [ ] Kein bekanntes CVE in `requirements.txt` (via `pip audit`)

### Dateisystem
- [ ] `SKIP_FILES` enthält alle sensiblen Dateien (`.env`, `cookies.txt`, Token-Files)
- [ ] `SKIP_DIRS` enthält Ordner die nicht exponiert werden sollen
- [ ] File-Browser zeigt keine Inhalte außerhalb von `BASE_PATH`

---

## Docker-Audit

```bash
# Laufende Container und ihre Ports
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

# Image-Alter prüfen
docker inspect devhub --format '{{.Created}}'

# Volumes prüfen
docker inspect devhub --format '{{json .Mounts}}' | python3 -m json.tool

# Logs auf Fehler prüfen
docker logs devhub --tail=200 2>&1 | grep -E "ERROR|WARN|Traceback"
```

- [ ] Port 5666 ist nur auf `127.0.0.1` gebunden (nicht `0.0.0.0`)
- [ ] Backup-Volume ist `:ro` gemountet
- [ ] Kein Container mit `privileged: true` ohne Begründung
- [ ] `watchtower` updated keine kritischen Container ohne Review

---

## Groq Token-Audit

```bash
# Token-Usage der letzten Tage anzeigen
docker exec devhub cat /data/token_usage.json | python3 -m json.tool
```

- [ ] Tages-Verbrauch unter 500k Tokens (Free-Tier-Limit)
- [ ] Kein ungewöhnlicher Spike (könnte auf Missbrauch hindeuten)
- [ ] Minuten-Rate unter 6k Tokens/min

---

## Nginx Proxy Manager Audit

- [ ] devhub ist nur über HTTPS erreichbar (kein HTTP-Redirect nach HTTP)
- [ ] Kein direkter Port-Exposure von 5666 nach außen (nur über NPM)
- [ ] SSL-Zertifikat ist gültig und nicht abgelaufen

---

## Incident Response

Bei Verdacht auf unautorisierten Zugriff:

```bash
# 1. Container sofort stoppen
docker stop devhub

# 2. Logs sichern
docker logs devhub > /media/Downloads/SERVER_BACKUPS/devhub_incident_$(date +%Y%m%d).log

# 3. SECRET_KEY rotieren (neue .env, neuer Wert)
python3 -c "import secrets; print(secrets.token_hex(32))"

# 4. Container neu starten
docker compose up -d --build

# 5. Session-Data löschen (alle aktiven Sessions ungültig machen)
# → passiert automatisch durch neuen SECRET_KEY
```

---

## Letzter Audit

| Datum | Durchgeführt von | Befunde | Status |
|---|---|---|---|
| 2026-04-13 | Setup | Initialaufbau | ✅ |
| — | — | — | — |
