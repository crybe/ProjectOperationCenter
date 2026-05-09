# Autonomous Operations & Watchdog Rules

Diese Regeln definieren, wie das System autonom auf Fehler reagiert, um eine maximale Verfügbarkeit (High Availability) ohne manuellen Eingriff zu gewährleisten.

---

## 🛡️ 1. Auto-Healing Prinzipien

1.  **Restart-Limit:** Ein Dienst darf maximal **3 Mal innerhalb von 15 Minuten** automatisch neu gestartet werden. Schlägt dies fehl, muss ein `CRITICAL` Alert via Telegram (inkl. Voice-Ausgabe `backup_failed.ogg`) ausgelöst werden.
2.  **Dependency-Awareness:** Wenn ein Container (z.B. Grafana) fehlschlägt, weil die DB (Influx/Postgres) nicht erreichbar ist, muss der Watchdog zuerst den DB-Container validieren/neustarten.
3.  **State-Preservation:** Vor jedem automatischen Neustart muss der aktuelle Status des Dienstes (Logs der letzten 50 Zeilen) in `Tactical-Bot-Core/logs/watchdog.log` gesichert werden.

---

## 🤖 2. KI-Orchestrator Safety (Advanced)

1.  **Human-in-the-Loop:** Alle destruktiven Befehle (Restart von Kern-Diensten, Löschen von Files) **müssen** eine manuelle Bestätigung via Inline-Keyboard anfordern.
2.  **Prompt-Validation:** Jede KI-Antwort wird gegen die `validate_command_safety` Blacklist geprüft. Ein Bypass dieser Schicht ist technisch zu verhindern.
3.  **Fallback-Mechanismus:** Fällt das primäre KI-Backend (z.B. OpenAI) aus, muss der Bot automatisch auf das lokale `tinyllama` (Ollama) zurückgreifen, um Basisfunktionalität zu gewährleisten.

---

## 💾 3. Daten-Integrität & Atomarität

1.  **Atomic Writes:** Status-Updates (JSON) dürfen niemals direkt überschrieben werden. Workflow: `write to temp` -> `sync` -> `rename`.
2.  **Locking:** Bei konkurrierenden Zugriffen auf Konfigurationsdateien (z.B. `grow_stages.json`) muss `fcntl.flock` genutzt werden, um Race-Conditions zu vermeiden.
3.  **Telemetry Lifecycle:** Historische Telemetriedaten in der SQLite-DB werden nach **90 Tagen** automatisch aggregiert oder gelöscht, um Disk-Pressure auf dem RPi 5 zu vermeiden.

---

## 👩‍🎤 4. Mascot-State Logic (Aerith)

Das UI spiegelt den Systemzustand über die Aerith-Mascot wider:

*   **STATE_NOMINAL:** Alles im grünen Bereich. Aerith lächelt (Standard-Asset).
*   **STATE_WARNING:** Hardware-Thresholds (CPU > 80%, Temp > 70°C) erreicht. Aerith wirkt konzentriert/besorgt.
*   **STATE_CRITICAL:** Dienst ausgefallen oder kritischer Fehler. Aerith im "Battle-Mode" / Alarm-Anzeige.

---
*Dokumentation der autonomen Protokolle. Stand Mai 2026.*
