# Guardian Integrity System (P.I.G.E.O.N. v16.1)

Das Guardian Integrity System ist die autonome Schutzschicht von Shinra_Gate. Es kombiniert proaktive Überwachung mit automatisierter Fehlerbehebung.

## 🛠️ Kern-Komponenten

### 1. Stability Monitor (`intelligence_worker/pigeon/monitor.py`)
Überwacht alle Docker-Container im 5-Minuten-Takt.
- **Crash Detection**: Erkennt Container im `exited` State (Code != 0) und startet sie neu.
- **Health Awareness**: Reagiert auf Docker Healthchecks (`unhealthy`) und führt präventive Restarts durch.

### 2. Autonomous Maintenance (`intelligence_worker/pigeon/maintenance.py`)
Sorgt für die langfristige Performance des Systems.
- **Log Rotation**: Überwacht `nexus_events.jsonl`, `aktionen.log` und `gemini.log`.
- **Threshold**: Bei Überschreiten von 5MB wird das Log rotiert (bis zu 5 Backups).

### 3. User Matrix & Access Control
Zentralisierte Benutzerverwaltung auf Datenbankbasis (`SQLAlchemy`).
- **Modell**: `User` in `core/models.py`.
- **Rollen**: Admin, User.
- **Sicherheit**: Passwort-Hashing via `werkzeug.security`.

## 📊 Visualisierung

Die Guardian-Aktivitäten sind an folgenden Stellen sichtbar:
- **VPanel**: Detaillierte Historie aller Heilungsprozesse.
- **ShinraDashboard**: "Guardian Feed" (Top 3 Fixes) und "User Matrix" Übersicht.
- **Fixer Hub**: Zusammenfassung der autonomen Reparaturen.

## ⚙️ Konfiguration

Die Schwellenwerte und Pfade werden zentral in `core/config.py` gesteuert.
- `MAX_LOG_SIZE`: 5MB
- `LOG_BACKUP_COUNT`: 5
- `SCAN_INTERVAL`: 300s (5 Min)
