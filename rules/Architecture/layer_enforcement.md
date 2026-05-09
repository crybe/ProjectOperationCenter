# Nexus Command Hub – Layer Enforcement Rules

Das System folgt einer strikten 4-Layer-Architektur, um Sicherheit, Wartbarkeit und Skalierbarkeit zu garantieren.

## 🏛️ Das 4-Layer-Modell

1.  **DATA (L1):** Rohdaten, Dateizugriff, DB-Interaktion.
2.  **CONTROL (L2):** Geschäftslogik, Dienst-Koordination, Status-Management.
3.  **INTELLIGENCE (L3):** KI-Logik, Entscheidungsfindung, Mustererkennung.
4.  **EXECUTION (L4):** Systembefehle, n8n-Webhooks, physische Aktionen.

---

## 🚦 Interaktions-Matrix (Strict Enforcement)

| Von \ Zu | DATA | CONTROL | INTELLIGENCE | EXECUTION |
| :--- | :---: | :---: | :---: | :---: |
| **DATA** | ✅ | ❌ | ❌ | ❌ |
| **CONTROL** | ✅ | ✅ | ✅ | ✅ |
| **INTELLIGENCE** | ✅ | ✅ | ✅ | ❌ |
| **EXECUTION** | ❌ | ✅ | ❌ | ✅ |

### Kern-Direktiven:
*   **DATA** ist zustandslos und "blind". Es ruft niemals höhere Schichten auf.
*   **CONTROL** ist das einzige Gehirn mit "Handlungsvollmacht". Es koordiniert alle Schichten.
*   **INTELLIGENCE** ist ein Berater. Es darf Daten lesen und CONTROL Empfehlungen geben, aber niemals selbst eine EXECUTION (L4) triggern.
*   **EXECUTION** ist der Arm des Systems. Es führt Befehle atomar aus und meldet Status-Codes an CONTROL zurück.

---

## ⚔️ Schicht-Spezifische Garantien

### DATA (L1): Atomarität & Persistence
*   **Atomic-Writes:** Jede Dateiänderung muss via `tmp`-File und `rename` erfolgen.
*   **Locking:** Bei konkurrierenden Zugriffen ist `fcntl.flock` zwingend.
*   **No Logic:** Keine Berechnungen oder KI-Calls innerhalb von DB-Modellen.

### CONTROL (L2): State-Machine Integrity
*   **Single-Source-of-Truth:** Der App-State wird zentral in CONTROL verwaltet.
*   **Validation:** Alle Daten von L1 oder L3 werden vor der Verarbeitung validiert.
*   **Auth:** Zugriff auf L2-Services erfordert eine gültige Session/Token.

### INTELLIGENCE (L3): Token-Sicherheit & Fallbacks
*   **Isolation:** KI-Prompts dürfen niemals direkte System-Befehle generieren ohne L2-Filter.
*   **Fallback:** Bei API-Timeout (OpenAI/Grok) muss L3 automatisch auf L3-Local (Ollama) umschalten.
*   **Privacy:** Keine sensiblen User-Daten (Passwörter, Keys) an externe KI-APIs senden.

### EXECUTION (L4): Idempotenz & Sicherheit
*   **Idempotenz:** Mehrfache Ausführung desselben Befehls darf keinen Schaden anrichten.
*   **Dry-Run:** Komplexe Aktionen (z.B. Mass-Update) müssen einen `dry_run` Modus unterstützen.
*   **Sanitization:** Jeder Shell-Befehl wird gegen die globale `security_whitelist` geprüft.

---

## 🛠️ Enforcement-Tools

1.  **Import-Sentinel:** Skripte in L1 dürfen keine Module aus L2, L3 oder L4 importieren.
2.  **Event-Auditing:** Jede EXECUTION muss die CONTROL-Event-ID des Triggers loggen.
3.  **Mascot-Feedback:** UI-Fehler in L2/L4 werden durch Aerith (State: ERROR) visualisiert.

---
*Layer-Architektur Hardening – Stand Mai 2026. Antigravity Core-Logic.*
