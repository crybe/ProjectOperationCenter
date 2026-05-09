# Service-Integration – Antigravity / Nexus-Control-Hub

## Übersicht der verbundenen Dienste

```
Telegram-User
     │
     ▼
 Tactical-Bot-Core (Port 5667 → devhub_ctrl.py)
     │                    │
     │              systemctl Tactical-Bot-Core (start/stop/restart)
     │
     ▼
devhub (Port 5666) ←─── Nginx Proxy Manager (HTTPS extern)
     │
     ├─ /data/projects.json  ←── direkt gelesen von Tactical-Bot-Core (Dateipfad!)
     ├─ BOT_CTRL_URL:5667    ──► devhub_ctrl.py
     ├─ PROM_URL:9090        ──► Prometheus
     └─ n8n_BASE_URL:5678    ──► n8n Workflows
```

---

## devhub_ctrl.py (Port 5667)

- Läuft als **eigener Python-Prozess** direkt auf dem Host (kein Docker)
- Steuert den Tactical-Bot-Core via `sudo systemctl {start|stop|restart} Tactical-Bot-Core`
- Whitelist: nur `start`, `stop`, `restart` erlaubt – keine freie Befehlsausführung
- Endpunkte: `GET /status`, `POST /start`, `POST /stop`, `POST /restart`
- Authentifizierung: `X-Ctrl-Token` Header muss mit `CTRL_TOKEN` aus `.env` übereinstimmen

**Änderungen an devhub_ctrl.py** erfordern manuellen Neustart auf dem Server:
```bash
ssh -p 50022 admin@localhost "sudo systemctl restart devhub-ctrl"
```
devhub_ctrl.py wird **nicht** per rsync übertragen — es liegt direkt im Server-Projektordner.

---

## Ki-Bot liest Daten direkt per Dateipfad

Der Tactical-Bot-Core liest `/app/data/projects.json` **ohne API-Aufruf**:
```python
DEVHUB_DATA = "/app/data/projects.json"
with open(DEVHUB_DATA, encoding="utf-8") as f:
    data = json.load(f)
```

Das bedeutet:
- **fcntl.flock() ist absolut zwingend** bei jedem Schreibzugriff im devhub-Code
- Gunicorn (multi-process) und Tactical-Bot-Core können gleichzeitig schreiben → Race Condition ohne Lock
- Nur `LOCK_EX` für Writes, `LOCK_SH` für Reads – niemals direktes `json.dump()` ohne Lock

---

## Konstanten in core/constants.py

| Konstante | Zweck | .env-Variable |
|---|---|---|
| `BOT_CTRL_URL` | devhub → devhub_ctrl (Tactical-Bot-Core steuern) | `BOT_CTRL_URL` |
| `CTRL_TOKEN` | Auth-Token für devhub_ctrl | `CTRL_TOKEN` |
| `PROM_URL` | Prometheus Query-API | `PROM_URL` |
| `n8n_BASE_URL` | n8n Workflow-API | `N8N_BASE_URL` |
| `GROQ_LIMITS` | Free-Tier Limits: 500k/Tag, 6k/Min | hardcoded |
| `BASE_PATH` | File-Browser Wurzel (`/home/user`) | hardcoded |

`BASE_PATH` ist **hardcoded** und darf nicht per Env überschreibbar gemacht werden (Sicherheitsgrenze).

---

## Groq Token-Tracking

Jeder KI-Aufruf **muss** `track_tokens()` aufrufen:
```python
from core.ai_logic import call_ai, track_tokens
response, usage = call_ai(prompt)
track_tokens(usage)  # Nie weglassen – sonst laufen Free-Tier-Limits unbemerkt voll
```

Tageslimit: 500.000 Tokens · Minutenlimit: 6.000 Tokens
Bei Limit-Überschreitung: HTTP 429 von Groq → im Frontend als Fehler anzeigen, nicht crashen.

---

## React Frontend-Routes

Das React-Frontend wird unter `/ui/` servert (via `blueprints/react_ui.py`):
- `/ui/` → `frontend/dist/index.html`
- `/ui/assets/*` → `frontend/dist/assets/`
- Alle anderen `/ui/*`-Routen → SPA-Fallback auf `index.html`

Die Flask-API-Routes unter `/api/*` sind davon unabhängig und werden direkt von Blueprints bedient.
