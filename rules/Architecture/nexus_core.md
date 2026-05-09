# Rules – Nexus Command Hub (ehem. Nexus-Control-Hub)

## Projektkontext

Zentrales Steuerungs-Hub (Nexus) für Server-Monitoring, Growbox-Automatisierung und n8n-Workflows.
- **Name**: Nexus Command Hub
- **Container**: `devhub` · Port `0.0.0.0:5666 → 5000`
- **Stack**: Flask 3 + React 19 + SQLAlchemy (SQLite)

---

## Entwicklungsregeln (Core)

### 1. Datenhaltung & Sicherheit
- Primär-DB: `data/dashboard.db` (SQLite).
- Kritische API-Endpunkte **müssen** via `@login_required` geschützt sein.
- Netzwerkzugriff via Port 5666 ist auf `0.0.0.0` gebunden, um Mobile-Zugriff zu ermöglichen. Sicherheitskritische Operationen (z.B. Terminal) sollten zusätzliche Checks haben.

### 2. Frontend & Mobile-First
- Das Projekt ist eine **PWA**. Jede UI-Änderung muss auf Mobilgeräten (Screen-Breite < 400px) validiert werden.
- **Session-Management**: Alle API-Calls im Frontend müssen den `useApi` Hook nutzen, um Session-Timeouts (Redirect zu `/login`) sauber abzufangen.
- **Interaktions-Design**: Mobile Views sollten Einhand-bedienbar sein (Bottom-Nav, große Klickflächen).

### 3. API & Performance
- **Polling**: Live-Daten (Sysinfo, Growbox) sollten im Frontend nicht häufiger als alle 5-10 Sekunden abgefragt werden, um den RPi5 nicht unnötig zu belasten.
- **Fehler-Feedback**: Jeder API-Fehler muss dem User via Toast-Nachricht oder Platzhalter (z.B. "–") angezeigt werden.

---

## Deployment Workflow

1.  **Lokal Bauen**: `cd frontend && npm run build` (erzeugt PWA Assets).
2.  **Sync & Deploy**: `./deploy.sh` ausführen (kopiert Code + `dist/` und startet Container neu).

---

## Was nicht verändert werden soll
- Gunicorn als Produktions-Server.
- Token-Tracking bei KI-Calls (Groq).
- Verzeichnis-Limitierung im File-Browser (`/home/user`).

---

## Zukünftige Standards (Geplant)
- **API v1**: Langfristige Umstellung aller Endpunkte auf `/api/v1/*`.
- **Offline-Mode**: Erweiterung des Service-Workers für Basis-Funktionalität ohne Netzwerk.
