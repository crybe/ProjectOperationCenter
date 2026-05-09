# P.I.G.E.O.N. Intelligence System (Deep Health Scan)

Das P.I.G.E.O.N. (Predictive Intelligent Guardian & Emergency Operations Network) System ist eine autonome Überwachungseinheit für das Antigravity Homelab.

## Kernfunktionen

### 1. Deep Health Scan
Der Scanner (`core/pigeon_intelligence.py`) überwacht den Zustand aller kritischen Docker-Container und analysiert deren Logs in Echtzeit.

**Überwachte Dienste:**
- `n8n-n8n-1`: Workflow-Automatisierung
- `devhub`: Haupt-Dashboard-Backend
- `uptime-kuma`: Monitoring-Zentrale
- `nginx-proxy-manager`: Traffic-Routing
- `authentik-server-1`: Identitäts-Management

### 2. Fehlererkennung (Hardened)
Das System nutzt zwei Layer zur Fehleranalyse:
- **Heuristisch**: Suche nach Keywords wie `error`, `failed`, `timeout`, `panic`, etc.
- **Pattern-Matching (Regex)**: Gezielte Suche nach bekannten Fehlermustern (z.B. fehlende n8n-Credentials).

### 3. Automatische Fix-Vorschläge
Für bekannte Fehlermuster generiert P.I.G.E.O.N. direkt Lösungsvorschläge, die im Dashboard angezeigt und im System-Gedächtnis gespeichert werden.

## Erweiterung der Fehler-Datenbank
Neue Fehlermuster können in `core/pigeon_intelligence.py` unter `KNOWN_ERRORS` hinzugefügt werden:

```python
KNOWN_ERRORS = {
    r"DEIN_REGEX_MUSTER": {
        "title": "Titel des Fehlers",
        "fix": "Beschreibung der Lösung",
        "severity": "warning|critical"
    }
}
```

## Dashboard Integration
Der Status des Scanners ist über die API (`/api/intel/deep-scan`) abrufbar und im **Intelligence Center** visuell aufbereitet.

- **Status-Farben**: Emerald (Optimal), Amber (Warnung), Rose (Kritisch).
- **Anomalie-Liste**: Zeigt spezifische Fehlermeldungen aus den Logs an.
- **Memory-Logging**: Alle signifikanten Funde werden dauerhaft im `P.I.G.E.O.N._LOG` gespeichert.

### 4. Telegram Failguard
Bei kritischen Funden sendet P.I.G.E.O.N. eine strukturierte Nachricht an den Administrator:
- **Problem**: Was wurde gefunden?
- **Vorhaben**: Was plant das System?
- **Lösung**: Welche Fixes werden vorgeschlagen?
- **Approve**: Ein Link zum Dashboard für die finale Bestätigung.
