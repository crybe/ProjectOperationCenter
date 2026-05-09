# Nexus Command Hub – Serverstand (2026-05-05)

## 1. System-Überblick
*   **Projektname:** Nexus Command Hub (ehem. Nexus-Control-Hub / Emerald Tactical 2.0)
*   **Status:** Mission-Ready / Stabilisiert & Modularisiert
*   **Host:** Raspberry Pi 5 (@localhost)
*   **Zugriff:** Port 5666 (Nginx Proxy Manager -> Docker DevHub)
*   **Ästhetik:** Red Tactical Theme (Rose-Palette, Glow-Effekte, Holografie)

## 2. Architektur (4-Layer Modell)
Das System wurde auf eine strikte Layer-Trennung refaktoriert und gehärtet:
1.  **DATA LAYER:** SQLite (Persistence), Prometheus (Metrics), JSON (Config).
2.  **CONTROL LAYER:** Flask API Gateways & Business Logic in `core/services/`.
3.  **INTELLIGENCE LAYER:** AI-Agenten & Zentrales Event-System (`JSONL` Logging).
4.  **EXECUTION LAYER:** n8n, Unified Execution API & Semantic Watchdog.
*   **Enforcement:** Strikte Interaktionsmatrix (Intelligence -> Control -> Execution).

## 3. Implementierte Features (Letzte Session)
*   **Systemic Hardening:** Implementierung von 6 Kernbereichen zur strukturellen Absicherung.
*   **Striktes Event-Schema:** Umstellung auf append-only JSONL mit konsistenten Keys für KI-Audits.
*   **Unified Execution Interface:** Zentrale `/api/execute` Schnittstelle isoliert Systembefehle und n8n-Webhooks.
*   **Semantischer Watchdog:** Upgrade auf `watchdog.py` mit Deep-Validation (API, DB, Prometheus, Disk).
*   **Zentrale Fehlerklassen:** Standardisierung von System-, Validierungs- und Ausführungsfehlern.

## 4. Infrastruktur & Dienste
*   **Monitoring:** Prometheus & Grafana (Telemetrie & Grow-Visualisierung).
*   **Automatisierung:** n8n (Workflows, Webhooks, Telegram-Integration).
*   **Execution Bridge:** Unified API (Port 5000) -> `/api/execute/` für sichere Aktionen.

## 5. Dateistruktur (Refaktoriert)
*   `core/services/`: Reine Business-Logik (entkoppelt von Flask).
*   `blueprints/api/`: Modulare Endpunkte inkl. `system_api.py` (Execution & State).
*   `System-Utilities/devops/`: Gehärtete Wartungs-Skripte (`watchdog.py`).
*   `data/logs/`: Gehärtete Log-Ablage (`nexus_events.jsonl`).

## 6. Sicherheit & Regeln
*   **Fail-Safes:** Semantische Selbstheilung durch den neuen Watchdog.
*   **Isolation:** Intelligenz-Layer hat keinen direkten Zugriff auf Subprozesse.
*   **Audit-Log:** Lückenlose, KI-lesbare Protokollierung im JSONL-Format.

---
**Administrator:** admin
**Build-ID:** 20260505-NEXUS-HARDENED-V1
