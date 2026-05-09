# Server-Struktur & Architektur-Bericht (Nexus Command Hub)

Dieser Bericht dokumentiert den aktuellen Aufbau, die Funktionen und die Datenstruktur des Nexus Command Hub (Projekt-Dashboard) auf dem Primär-Server.

## 1. Host-System & Umgebung
- **Hardware**: Raspberry Pi 5
- **Betriebssystem**: Linux (Ubuntu/Debian-basiert)
- **Netzwerk**: Erreichbar unter `localhost` (SSH Port 50022).
- **Zweck**: Zentrale Schaltstelle für System-Automatisierung, Monitoring (P.I.G.E.O.N.), Projekt-Management und Strategic Intelligence.

## 2. Containerisierung (Docker Stack)
Die Anwendung läuft als Docker-Container namens `devhub`.
- **Image**: Basierend auf `python:3.11-slim` (siehe Dockerfile).
- **Port-Mapping**: `5666 (Host) -> 5000 (Container)`.
- **Privilegierter Modus**: Aktiv (für Hardware-Zugriff und Docker-Steuerung).
- **Volumes**:
    - `/app`: Das Projekt-Root Verzeichnis.
    - `/data`: Separates Volume für die JSON-Datenbank.
    - `/home/user`: Vollzugriff auf das Home-Verzeichnis des Administrators für File-Browsing.
    - `/media/Downloads/SERVER_BACKUPS`: Lesezugriff auf externe Backups.
    - `/var/run/docker.sock`: Zugriff auf den Docker-Daemon zur Steuerung anderer Container.

## 3. Applikations-Architektur (Nexus v2.4)
Das System ist in eine 4-Layer-Architektur unterteilt (oder im Übergang dazu):

### 3.1. Frontend (React / Vite)
- **Technologie**: React mit TypeScript, Vite als Build-Tool.
- **Styling**: Tailwind CSS + Custom Tactical CSS (`index.css`).
- **Icons**: Lucide-React.
- **Seiten**:
    - `DevHubDashboard`: Strategische Übersicht.
    - `Sentinel`: Sicherheits-Überwachung und Hardware-Telemetrie.
    - `Growbox`: Botanische Automatisierung.
    - `Command Hub`: Terminal und direkte Befehlsgewalt.

### 3.2. Backend (Flask / Python)
- **Technologie**: Flask 3.x mit Gunicorn als WSGI-Server.
- **Struktur**:
    - `app.py`: Haupteinstiegspunkt und globale Konfiguration.
    - `blueprints/`: Modularisierte API-Endpunkte.
    - `core/`: Kern-Logik (System-Status, AI-Agent Integration).
    - `intelligence_worker/`: Autonome Hintergrund-Tasks und Speicher-Logik.

## 4. Datenhaltung & Sicherheit
- **Persistenz**: JSON-Dateien im Verzeichnis `/data/`.
- **Concurrency**: `fcntl.flock` (File Locking) verhindert Datenkorruption durch parallele Gunicorn-Worker.
- **Authentifizierung**: Session-basiert mit `@login_required` Schutz.
- **Logging**:
    - App-interne Logs unter `/logs/`.
    - Externer Gemini-Logger unter `/home/user/Tactical-Bot-Core/logs/gemini.log`.

## 5. Dokumentation & Regeln
- **Regelwerk**: Zentral im Ordner `rules/` (Markdown).
- **Berichte**: Datierte Berichte über Änderungen im Ordner `Berichte/`.
- **Struktur-Log**: Dieser Bericht (`Server_Struktur_Log/`) dient der langfristigen Orientierung für KIs und Administratoren.

---
*Zuletzt aktualisiert: 2026-05-07 04:30*
