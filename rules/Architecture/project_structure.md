# Projektstruktur: Shinra_Gate

## 📂 Verzeichnishierarchie

Das Projekt folgt einer strikten Trennung zwischen Frontend, Backend und operativen Skripten.

| Verzeichnis | Inhalt | Verantwortung |
| :--- | :--- | :--- |
| `frontend/` | React, Vite, Tailwind | Gesamte Benutzeroberfläche (UI/UX) |
| `blueprints/` | Flask Blueprints (Python) | API-Endpunkte und Business-Logik |
| `intelligence_worker/` | P.I.G.E.O.N. Engine | Autonome Systemüberwachung & Heilung |
| `scripts/` | Bash/Python Skripte | DevOps, Automatisierung, Scanner |
| `data/` | JSON, SQLite, State | Persistente Datenhaltung |
| `rules/` | Markdown Dokumente | Architektur-, Entwicklungs- und Betriebsregeln |
| `core/` | Gemeinsame Python Utilities | Hilfsfunktionen, Security-Validatoren |
| `templates/` | Jinja2 Templates | Legacy HTML-Ansichten |
| `static/` | Assets (CSS, JS, Bilder) | Statische Dateien für Legacy-Templates |

## 🏷️ Benennungskonventionen

- **Projektname**: `Shinra_Gate` (Server-Pfad: `/app`)
- **Docker-Container**: `shinra-gate`
- **Variablen**: CamelCase im Frontend (TSX), snake_case im Backend (Python).
- **Dateien**: PascalCase für React-Komponenten, snake_case für Python-Module.

## 🚀 Deployment-Regel

Änderungen müssen immer über das zentrale Deployment-Skript eingespielt werden:
`scripts/devops/deploy.sh`

Dies stellt sicher, dass:
1. Das Frontend neu gebaut wird.
2. Backups erstellt werden.
3. Der Container sauber neugestartet wird.
4. Ein Healthcheck durchgeführt wird.

## ⚠️ Pfad-Integrität

Absolute Pfade im Code müssen immer auf `/app/` referenzieren. Die Verwendung von relativen Pfaden (`os.path.join(os.path.dirname(__file__), ...)`) ist für die Portabilität innerhalb des Containers zu bevorzugen.
