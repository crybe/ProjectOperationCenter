# Struktur-Logging Regeln (Server_Struktur_Log)

Diese Regeln stellen sicher, dass die Dokumentation der Server-Architektur stets aktuell bleibt.

## 1. Pflicht zur Aktualisierung
Nach jeder strukturellen Änderung am Server oder an der App-Architektur **muss** der Bericht in `Server_Struktur_Log/server_structure.md` aktualisiert werden.

### Relevante Änderungen sind:
- Anpassungen der `docker-compose.yml` (Volumes, Ports, Umgebungsvariablen).
- Einführung neuer Hauptverzeichnisse oder Module (z.B. neue Backend-Layer).
- Migration von Datenbank- oder Speichersystemen.
- Grundlegende Änderungen am Deployment-Prozess.

## 2. Inhaltliche Anforderungen
- Der Bericht muss den aktuellen Stand ("Current State") widerspiegeln.
- Es dürfen **keine Passwörter, API-Keys oder Secrets** enthalten sein.
- Die Struktur muss klar, lesbar und für nachfolgende KIs optimiert sein.

## 3. Speicherort
- Der Ordner `Server_Struktur_Log` verbleibt **nur lokal** im Projektverzeichnis, um eine unnötige Aufblähung des Server-Deployments zu vermeiden.

## 4. Zeitstempel
Jede Aktualisierung des Berichts muss mit einem "Zuletzt aktualisiert" Zeitstempel am Ende der Datei versehen werden.
