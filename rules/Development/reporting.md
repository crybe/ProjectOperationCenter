# Berichterstattungs-Regeln (Reporting)

Diese Regeln definieren den Standard für die Dokumentation von Projektfortschritten und strukturellen Änderungen im Antigravity-Projekt.

## 1. Pflicht zur Berichterstattung
Bei jeder signifikanten Änderung am Projekt (Refactoring, neue Features, Architektur-Anpassungen) **muss** ein datierter Bericht erstellt werden.

## 2. Speicherort und Format
- **Speicherort**: Alle Berichte werden im Verzeichnis `Berichte/` abgelegt (sowohl lokal als auch auf dem Server).
- **Dateiname**: Das Format muss `YYYY-MM-DD_<Kurzbeschreibung>.md` folgen (z.B. `2026-05-07_Dashboard-Refactoring.md`).
- **Format**: Markdown (`.md`).

## 3. Struktur eines Berichts
Ein Bericht muss folgende Sektionen enthalten:
1.  **Zusammenfassung**: Kurzer Überblick über die getroffenen Maßnahmen.
2.  **Durchgeführte Änderungen**: Detaillierte Liste der modifizierten Dateien und Logik-Anpassungen.
3.  **Fehlerprüfung & Validierung**: Dokumentation der Tests (Builds, Logs, Funktionsprüfung).
4.  **Rollback-Strategie**: Dokumentation der Rückfallmöglichkeiten.
    - Letzter stabiler Stand
    - Backup-Pfad
    - Git-Commit
    - Docker-Image/Tag
    - Rsync-Ziel
5.  **Bekannte Risiken**: Offene Punkte oder potenzielle Instabilitäten (z.B. Langzeitprüfung, Mobile Layout, Alerting).
6.  **Status**: Aktueller Zustand des Systems nach der Änderung.

## 4. Stil und Klarheit
- **Lesbarkeit**: Berichte müssen sauber strukturiert und für den Administrator (Crybe) leicht verständlich sein.
- **Kommentierung**: Wichtige Entscheidungen oder "Breaking Changes" müssen explizit kommentiert und begründet werden.
- **Minimalismus**: Fokus auf Fakten und Ergebnisse, keine unnötigen Details.

## 5. Synchronisation
Berichte müssen unmittelbar nach der Erstellung zwischen lokalem System und Server synchronisiert werden, um die Konsistenz der Dokumentation zu gewährleisten.

## 6. Fortgeschrittener Projektstatus (Advanced State)
Da sich das Projekt in einem weit fortgeschrittenen Stadium befindet, gilt ab sofort das Prinzip **"Stability over Speed"**:

*   **Change-Management:** Vor jeder Änderung an Kern-Komponenten (`bot.py`, `pigeon_engine.py`, `devhub` Backend) ist ein manuelles Backup der betroffenen Dateien oder ein Git-Snapshot zwingend erforderlich.
*   **Audit-Pflicht:** Signifikante Änderungen müssen zusätzlich im operativen Audit-Log (`rules/Operations/audit.md`) kurz vermerkt werden.
*   **Regression-Testing:** Jedes neue Feature muss explizit auf Kompatibilität mit bestehenden n8n-Workflows und der Telegram-Alert-Chain geprüft werden.
*   **Mascot-Alignment:** Grafische oder funktionale UI-Anpassungen müssen die Mascot-State-Logik (Aerith) berücksichtigen, um eine konsistente User-Experience zu wahren.

---
*Zuletzt aktualisiert am 2026-05-08 von Antigravity.*
