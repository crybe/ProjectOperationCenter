# 🌌 Antigravity Design-System: Tactical_OS HUD

Dieses Dokument definiert die visuelle Identität des Antigravity-Ökosystems. Das Design folgt dem Prinzip eines **High-Fidelity Tactical HUD**, das Ästhetik und operative Klarheit vereint.

---

## 🎨 1. Farbpalette & Atmosphäre

Das System nutzt ein "Deep-Space" Farbschema mit kontrastreichen Akzenten:

*   **Background (Core):** `#050505` (Absolutes Schwarz).
*   **Surface (Cards):** `rgba(20, 20, 25, 0.7)` mit `backdrop-filter: blur(15px)`.
*   **Accent (Primary):** `Aerith-Gold` (#FFD700) – HEX-Abweichungen verboten.
*   **Accent (Alert):** `Cyber-Red` (#FF3131) – Glow: `0 0 10px rgba(255, 49, 49, 0.5)`.
*   **Accent (Success):** `Neon-Green` (#39FF14) – Glow: `0 0 10px rgba(57, 255, 20, 0.4)`.
*   **Lines/Grids:** `rgba(255, 255, 255, 0.05)` für subtile Strukturen.

---

## 🔠 2. Typografie-Matrix

Um die operative Klarheit zu wahren, gelten strikte Typografie-Regeln:

| Element | Font | Size | Weight | Line-Height | Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Titel)** | *Outfit* | 2.5rem | 700 | 1.2 | Uppercase |
| **H2 (Sektion)** | *Outfit* | 1.25rem | 600 | 1.4 | Normal |
| **Data (Zahlen)** | *Inter* | 1.1rem | 700 (Mono) | 1 | Normal |
| **Labels** | *Inter* | 0.75rem | 500 | 1.2 | Uppercase |
| **Body Text** | *Inter* | 0.95rem | 400 | 1.5 | Normal |

> [!IMPORTANT]
> Zahlen (Telemetrie) müssen immer in einem monospaced Font-Setting (`font-variant-numeric: tabular-nums`) gerendert werden, um Flattern bei Live-Updates zu verhindern.

---

## 📐 3. Komponenten-Anatomie

### A. Tactical Cards
*   **Padding:** `1.5rem` (24px).
*   **Border-Radius:** `12px` auf Desktop, `8px` auf Mobile.
*   **Border:** `1px solid rgba(255, 255, 255, 0.1)`.
*   **Shadow:** `0 8px 32px 0 rgba(0, 0, 0, 0.8)`.

### B. Action Buttons
*   **Hintergrund:** Gradient von `rgba(255, 215, 0, 0.1)` zu `transparent`.
*   **Hover-Effekt:** Rahmen-Leuchten (Glow) und Erhöhung des Blur-Faktors.
*   **Transition:** `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 🎬 4. Motion & Easing

Bewegung im HUD muss sich "mechanisch" und präzise anfühlen:

*   **Page Transitions:** `Opacity` (0 -> 1) in 400ms.
*   **Hover-Scale:** Maximal `1.02` für Karten.
*   **Alert-Puls:** `keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }` (Dauer 2s).
*   **Loading:** Scanline-Animation (horizontaler Strahl, der von oben nach unten wandert).

---

## 📱 5. Responsive Breakpoints

| Gerät | Breakpoint | Spalten (Grid) | Besonderheit |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 600px` | 1 | Sidebar wird zu Bottom-Nav |
| **Tablet** | `600px - 1024px` | 2 | Reduzierter Blur-Effekt für Performance |
| **Desktop** | `> 1024px` | 12 (Layout) | Voller Glassmorphism & Aerith Guide |

---

## 👩‍🎤 6. Mascot State Machine (Aerith)

Aerith ist kein statisches Bild, sondern ein **State-Observer**:

1.  **IDLE:** Normales Dashboard-Browsing -> Freundlich, neutral.
2.  **ACTIVE:** Daten werden geladen -> Konzentriert, Scan-Animation in den Augen.
3.  **SUCCESS:** Aktion (z.B. Backup) abgeschlossen -> Lächeln / Daumen hoch.
4.  **ERROR:** Hardware-Threshold überschritten -> Ernst, Warn-Badge neben dem Avatar.

---

## 📋 7. Audit-Checkliste für Designer & Entwickler

*   [ ] Werden tabular-nums für alle Live-Metriken genutzt?
*   [ ] Ist der Glassmorphism-Faktor auf Mobile reduziert (`blur(5px)`)?
*   [ ] Besitzt jede Karte einen subtilen Hover-Glow?
*   [ ] Reagiert die Aerith-Mascot korrekt auf den globalen App-State?

---
*Design-System Hardening – Stand Mai 2026. Antigravity Intelligence.*
