# P.I.G.E.O.N. PROTOCOL
## Primary Interface for Global Entity Operations & Networking

Das P.I.G.E.O.N. Protokoll ist die autonome Intelligenz-Schicht des Systems. Es agiert als strategischer Berater und proaktiver Wächter über alle operativen Parameter.

---

## 🏗️ 1. Operative Intelligenz (Decision Logic)

P.I.G.E.O.N. nutzt ein Multi-Vektor-Analysesystem:
1.  **Vektor A (Hardware):** Echtzeit-Telemetrie (CPU, RAM, Temp).
2.  **Vektor B (Network):** Latenz, Packet-Loss und unübliche Traffic-Muster.
3.  **Vektor C (Security):** Login-Versuche, SSH-Aktivität und Container-Health.

### Entscheidungs-Matrix:
*   **ANALYSE:** Alle 60 Sekunden erfolgt ein Full-System-Scan.
*   **ADVISORY:** Bei Anomalien generiert P.I.G.E.O.N. einen Bericht im `Nexus-Log`.
*   **INTERVENTION:** Bei Erreichen von Stufe **DEFENSIVE** triggert P.I.G.E.O.N. via CONTROL-Layer sofortige Sicherheitsmaßnahmen (z.B. Blockieren von IPs).

---

## 📊 2. Kommunikations-Standards (Event Schema)

Alle P.I.G.E.O.N.-Events müssen folgendem JSON-Schema entsprechen, um vom Nexus Dashboard verarbeitet werden zu können:

```json
{
  "event_id": "PIG-YYYYMMDD-XXXX",
  "timestamp": "ISO-8601",
  "status": "CALM | NERVOUS | ALERT | DEFENSIVE",
  "vector": "HARDWARE | NETWORK | SECURITY",
  "message": "Menschlich lesbare Beschreibung",
  "action_taken": "Optional: Automatisch durchgeführte Aktion",
  "payload": {
    "metric": 0.0,
    "threshold": 0.0
  }
}
```

---

## 🛡️ 3. Belastungsgrenzen & Verhaltensmuster

| Zustand | Trigger | P.I.G.E.O.N. Reaktion |
| :--- | :--- | :--- |
| **CALM** | Normalbetrieb | Gurrt entspannt; aggregiert Hintergrunddaten. |
| **NERVOUS** | Temp > 65°C | "Feather-Ruffling"; erhöht Scan-Intervall auf 30s. |
| **ALERT** | Last > 90% | "Wing-Flapping"; warnt via Telegram (Voice: `high_cpu.ogg`). |
| **DEFENSIVE** | Angriffsszenario | "Pecking-Mode"; isoliert betroffene Dienste/Container. |

---

## 🛠️ 4. Wartung der Logik

*   Die `pigeon_engine.py` muss bei Änderungen an der Hardware-Konfiguration (z.B. neuer Pi oder Cluster) re-kalibriert werden.
*   Log-Dateien von P.I.G.E.O.N. werden in `Tactical-Bot-Core/logs/pigeon.log` geführt.

---
*Status: P.I.G.E.O.N. ENHANCEMENT COMPLETE. ALL WINGS READY.*
