# Code-Commit Regeln (Antigravity Project)

Diese Regeln dienen dazu, eine saubere und nachvollziehbare Historie im Git-Repository zu gewährleisten.

## 1. Atomare Commits
- Jede Änderung sollte eine logische Einheit bilden (z. B. "Neues Modul hinzugefügt" oder "Bugfix in der API").
- Vermeide "Mega-Commits", die hunderte Dateien ohne klaren Fokus ändern.
- Wenn eine Synchronisation (Sync) stattfindet, sollte dies klar als solche benannt werden.

## 2. Commit-Nachrichten
- Die Nachrichten sollten präzise und aussagekräftig sein.
- Format: `[Modul] Beschreibung der Änderung` oder `Typ: Beschreibung`.
- Sprachen: Deutsch oder Englisch (konsistent bleiben).
- Beispiel: `[Frontend] Umstellung auf Lazy Loading für bessere Performance`

## 3. Pre-Commit Hooks & Qualität
- Vor jedem Commit sollten (wenn möglich) die installierten Hooks (z. B. Ruff, ESLint) laufen.
- Sollten Hooks aufgrund von Umgebungsproblemen fehlschlagen, ist ein `--no-verify` erlaubt, muss aber im Logging vermerkt werden.

## 4. Server-Synchronisation & Logging
- Jeder signifikante Commit oder Sync-Vorgang **muss** auf dem Server geloggt werden:
  `python3 /home/user/Tactical-Bot-Core/logs/gemini_logger.py 'Beschreibung der Aktion'`
- Nach lokalen Änderungen sollte zeitnah ein Abgleich mit dem Server erfolgen, um Konflikte zu minimieren.

## 6. Session-Abschluss & KI-Kontext
- **Zwingende Regel**: Am Ende jeder Arbeitssession **muss** die Datei `Ki-Overview/Serverstand.md` aktualisiert werden.
- Diese Datei dient als "Gedächtnis" für nachfolgende KIs und den Administrator. Sie muss den aktuellen Systemstatus, alle neuen Features und wichtige strukturelle Änderungen enthalten.
- Achte beim Update streng darauf, **keine Passwörter, API-Keys oder Secrets** zu leaken.
