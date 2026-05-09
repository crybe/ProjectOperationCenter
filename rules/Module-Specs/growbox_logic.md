# 🌱 Growbox Intelligence & Hardware Rules

Dieses Dokument definiert die operativen Standards für das Growbox-Modul. Ziel ist die Maximierung des Ertrags bei gleichzeitiger Schonung der Hardware.

---

## ⚡ 1. Hardware-Sicherheitsgrenzen

Um Hardware-Schäden zu vermeiden, gelten folgende Grenzwerte für die Growbox-Dienste:

*   **Lüftersteuerung (Umluft/Abluft):**
    *   Stufen: 0 (Aus) bis 10 (Max).
    *   Auto-VPD Modus: Regelt dynamisch basierend auf Phase.
*   **Lampen-Management:**
    *   Maximale Stufe: 10.
    *   Schutz: Lampen dürfen nur eingeschaltet werden, wenn die Abluft mindestens auf Stufe 2 läuft (Wärmestau-Vermeidung).
*   **Feuchtigkeit:** Bei > 75% rH muss die Abluft automatisch auf Stufe 10 hochfahren (Schimmel-Prävention).

---

## 📐 2. Phasen-Logik (Growth Stages)

Die Growbox folgt einem strikten Phasen-Plan, der in `grow_stages.json` definiert ist:

1.  **Sämling (Seedling):** Hohe RLF (65-70%), moderates Licht, Ziel-VPD: 0.4 - 0.8 kPa.
2.  **Vegetation (Vegi):** Mittlere RLF (55-60%), starkes Licht, Ziel-VPD: 0.8 - 1.2 kPa.
3.  **Blüte (Bloom):** Niedrige RLF (40-50%), maximales Licht, Ziel-VPD: 1.2 - 1.6 kPa.

---

## 📊 3. Daten-Logging & Webhooks

Jede Statusänderung (Gießen, Lampen-Wechsel, Phasen-Sprung) muss geloggt werden:

*   **Speicherort:** `/home/user/Tactical-Bot-Core/n8n_state/grow_status.json` (Atomic Write Pflicht!).
*   **Reporting:** Jede Aktion triggert einen Webhook an n8n für das Nexus-Dashboard.
*   **Kalkulation:** Ernte-Effizienz wird automatisch basierend auf Strompreis (`strompreis` Parameter) und Ertrag berechnet.

---

## 🤖 4. KI-Interaktion

Der Bot unterstützt spezifische Befehle wie `/umluft`, `/abluft`, `/lampe` und `/growstatus`.

*   **Validierung:** Die KI darf keine Werte außerhalb der definierten Min/Max-Bereiche setzen.
*   **Vorschlag:** Bei suboptimalem VPD soll P.I.G.E.O.N. automatisch eine Optimierung via `/mach` vorschlagen.

---
*Status: GROWBOX LOGIC HARDENED. PLANT HEALTH OPTIMIZED.*
