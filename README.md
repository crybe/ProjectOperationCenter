# ⚡ Tactical Dashboard (Nexus Command Hub)

![Version](https://img.shields.io/badge/version-v2.5.5-emerald?style=flat-square)
![Status](https://img.shields.io/badge/status-stable-emerald?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

Ein hochmodernes, taktisches Dashboard zur Überwachung und Steuerung von Home-Server-Infrastruktur, Growbox-Hardware und automatisierten KI-Workflows.

---

## 🛰️ Übersicht
Das (Nexus Command Hub) dient als zentrale Kommandozentrale für technik-affine Homelab-Betreiber. Es vereint System-Metriken, Docker-Management und spezialisierte Hardware-Steuerung in einem konsistenten, taktischen Design.

### Hauptmerkmale
- **Emerald Tactical Design:** Hochoptimierte Benutzeroberfläche mit Fokus auf Lesbarkeit und Ästhetik (Glassmorphism).
- **Docker Control Center:** Verwalten Sie Ihre Container direkt über das Web-UI.
- **Growbox Telemetrie:** Überwachung von VPD, Temperatur und Luftfeuchtigkeit sowie Steuerung von Lampen und Lüftern.
- **KI-Integration:** Schnittstellen zu Gemini, Groq und OpenRouter für intelligente Systemanalysen.
- **Sicherheits-Fokus:** Integrierter P.I.G.E.O.N. Failguard und IP-Whitelisting.

---

## 🛠️ Tech Stack
- **Backend:** Flask 3 (Python 3.11+)
- **Datenbank:** SQLAlchemy (SQLite / PostgreSQL Support)
- **Frontend:** React + TailwindCSS (Vite Build)
- **Monitoring:** Prometheus Integration
- **Container:** Docker & Docker Compose

---

## 🚀 Installation

### 1. Repository klonen
```bash
git clone https://github.com/crybe/ProjectOperationCenter.git
cd ProjectOperationCenter
```

### 2. Konfiguration
Kopieren Sie die Beispiel-Konfiguration und passen Sie Ihre Secrets an:
```bash
cp .env.example .env
# Edit .env with your favorite editor
nano .env
```

### 3. Start mit Docker
```bash
docker compose up -d --build
```
Das Dashboard ist anschließend unter `http://localhost:5666` erreichbar.

---

## 🔑 Environment Variables
| Variable | Beschreibung | Standard |
| :--- | :--- | :--- |
| `SECRET_KEY` | Flask Session Secret | - |
| `LOGIN_USER` | Admin-Benutzername | `admin` |
| `LOGIN_PASSWORD` | Admin-Passwort | - |
| `GEMINI_API_KEY` | Google Gemini API Key | - |
| `GROQ_API_KEY` | Groq API Key | - |
| `PROM_URL` | Prometheus API Endpunkt | `http://localhost:9090` |

---

## 🛡️ Sicherheitshinweis

> **Do not expose this dashboard directly to the public internet.**

Dieses Projekt ist für den Einsatz im privaten Netzwerk konzipiert. Stellen Sie sicher, dass der Zugang von außen nur über gesicherte Tunnel (VPN) oder einen authentifizierten Reverse-Proxy erfolgt.

**`docker-compose.yml` is intended for local/private homelab use only.** Bind-Ports sind standardmäßig auf `127.0.0.1` beschränkt und sollten nicht öffentlich erreichbar sein.

**WICHTIG:** Committen Sie niemals Ihre `.env` Datei mit echten Zugangsdaten!

---

## 📄 Lizenz
Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE` für Details.

---

**[ END_OF_TRANSMISSION ]**
