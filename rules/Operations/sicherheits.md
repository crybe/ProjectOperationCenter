# Sicherheits- & Architekturregeln – Emerald Tactical 2.0

## 1. Bedrohungsmodell & Zugriffsschutz
Das Dashboard läuft hinter einem Nginx Proxy Manager (Port 5666).
*   **Regel:** Der Port 5666 darf nur auf `127.0.0.1` binden, niemals auf `0.0.0.0` (Exposure-Risiko).
*   **Authentifizierung:** Der `login_required` Decorator muss vor **jedem** API-Endpunkt stehen, der Daten liest oder Aktionen auslöst.
*   **Secrets:** Der `SECRET_KEY` in der `.env` muss mindestens 32 Zeichen lang und zufällig generiert sein.

## 2. Path-Traversal & Dateizugriff
Der File-Browser und API-Endpunkte, die Dateien lesen, sind kritisch.
*   **Regel:** Alle Pfade müssen mit `os.path.realpath()` aufgelöst und gegen den `BASE_PATH` geprüft werden.
*   **Validierung:**
    ```python
    abs_path = os.path.realpath(user_input)
    if not abs_path.startswith(os.path.realpath(BASE_PATH)):
        abort(403)
    ```
*   **Sicherheits-Check:** Symlinks müssen aufgelöst werden, um Escape-Versuche aus dem Root-Verzeichnis zu verhindern.

## 3. Hardware-Sicherheit & Fail-Safes (NEU)
*   **Regel:** Das Dashboard darf niemals die alleinige Kontrolle über den "Stop"-Zeitpunkt von Hardware-Prozessen haben.
*   **Implementierung:** Jeder Hardware-Befehl (z.B. Bewässerung) muss einen serverseitigen Timeout im Befehl selbst enthalten (z.B. `?duration=10`). Verlasse dich nicht darauf, dass ein manueller Stop-Befehl vom Frontend immer ankommt.

## 4. Command Injection (subprocess)
*   **Regel:** Keine Shell-Interpolation verwenden. Nutze `subprocess.run(cmd_list, shell=False)`.
*   **Eingabeprüfung:** User-Input (z.B. Containernamen) muss via Regex (`^[a-zA-Z0-9\-_]+$`) validiert werden, bevor er in einen Befehl einfließt.

## 4. Frontend-Sicherheit & API-Resilienz
*   **Secrets:** Keine Secrets (API-Keys, Passwörter) in Frontend-Variablen mit dem Präfix `VITE_` speichern, da diese im Browser-Bundle landen.
*   **Adaptive Polling (NEU):** Um Serverlast und Akku zu sparen, müssen Polling-Intervalle (z.B. via `setInterval`) den Tab-Status prüfen:
    *   Sichtbar: 10 Sekunden Intervall.
    *   Hintergrund: 90 Sekunden Intervall (via `visibilitychange`).
*   **API-Stacks:** Frontend-Calls müssen Overlaps verhindern (z.B. durch `isPollingRef` Flags).

## 6. Daten-Integrität & KI-Ethik (NEU)
*   **AI-Privacy:** Bevor Daten an externe AI-APIs (Groq, etc.) gesendet werden, müssen sensible Informationen (IPs, Passwörter aus Logs) anonymisiert werden.
*   **SQLite Concurrency:** Direkte Schreibzugriffe auf die Datenbank oder JSON-Files müssen via `fcntl.flock` geschützt werden, um Datenkorruption bei parallelen Zugriffen zu verhindern.

## 7. Daten-Integrität & Logging
*   **Audit-Logs:** Alle administrativen Aktionen (Start/Stop/Update) werden in `/data/logs/actions.log` gespeichert. Diese Logs sind Append-Only.
*   **Fehler-Whitelist (NEU):** Bekannte Fehlalarme in System-Logs (z.B. unkritische rsync-Fehler beim Backup) müssen über eine Whitelist (`data/backup_whitelist.json`) filterbar sein. Der Dashboard-Status darf nur bei echten Anomalien auf "Error" springen.

## 6. Docker & Privilegien
*   **Regel:** Docker-Container sollten, wenn möglich, nicht als Root laufen.
*   **Mounts:** Das Backup-Volume muss als `ro` (read-only) gemountet werden, um versehentliches Löschen von Backups durch den Container zu verhindern.

## 7. Deployment Workflow
*   **Build-Strategie:** Das Frontend wird **lokal** via `npm run build` gebaut. Der resultierende `dist/`-Ordner wird per `rsync` auf den Server übertragen.
*   **Sync-Zwang:** Vor jedem Deploy muss geprüft werden, ob direkt auf dem Server Änderungen vorgenommen wurden. Falls ja, ist zuerst ein `./pull.sh` (oder manueller Sync) erforderlich.

---
**Administrator:** admin
**Letzte Prüfung:** 2026-05-05 (Consolidated & Updated)
