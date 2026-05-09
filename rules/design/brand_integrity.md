# 🛡️ Brand Integrity & Design Protection

Dieses Dokument definiert die Regeln zum Schutz der visuellen Identität von Antigravity und Tactical_OS. Ziel ist es, die Konsistenz und Wertigkeit der Marke über alle Module hinweg zu bewahren.

---

## 📐 1. Logo-Schutz (Antigravity Core)

Das Antigravity-Logo ist das primäre Identitätsmerkmal. Folgende Regeln sind strikt einzuhalten:

1.  **Keine Verzerrung:** Das Logo darf niemals gestreckt, gestaucht oder in unproportionalen Verhältnissen skaliert werden.
2.  **Farbtreue:** Das Logo darf nur in den definierten Primärfarben (`Aerith-Gold` auf Schwarz oder Weiß-Invers) verwendet werden. Keine Verläufe, die nicht im Original-Asset enthalten sind.
3.  **Schutzzone:** Um das Logo muss ein definierter Freiraum (mindestens 20% der Logo-Breite) eingehalten werden, in den keine anderen UI-Elemente ragen dürfen.
4.  **Keine Modifikation:** Das Logo darf nicht dekonstruiert oder mit anderen Symbolen kombiniert werden, sofern dies nicht explizit als Sub-Branding definiert ist.

---

## 👩‍🎤 2. Mascot Integrity (Aerith)

Die Aerith-Mascot ist das Gesicht des Systems. Ihr Schutz genießt höchste Priorität:

1.  **Stil-Konsistenz:** Neue Illustrationen oder Zustände müssen exakt dem etablierten Cyberpunk-Anime-Stil entsprechen. "Off-Model" Darstellungen sind untersagt.
2.  **Kontext-Sensitivität:** Aerith darf nicht für triviale oder deplatzierte Meldungen verwendet werden. Sie repräsentiert den System-Status und die KI-Intelligenz.
3.  **Hintergrund-Integration:** Mascot-Assets müssen sauber freigestellt sein und dürfen keine Artefakte oder unsaubere Kanten aufweisen.

---

## 📺 3. UI-Ästhetik & "Look and Feel"

Der "Tactical HUD"-Stil ist das Alleinstellungsmerkmal von Antigravity.

1.  **Keine Stil-Brüche:** Das Einbinden von Standard-Bootstrap-Elementen, grellen Farben (außerhalb der Akzent-Palette) oder unpassenden Icons (z.B. Material Design Icons) ist untersagt.
2.  **Layer-Respekt:** Die Hierarchie des 4-Layer-Modells muss sich im UI widerspiegeln (z.B. Execution-Buttons müssen sich optisch von reinen Daten-Anzeigen unterscheiden).
3.  **Hard-Coding Verbot:** Stil-Elemente dürfen nicht als Inline-Styles implementiert werden. Sie müssen aus dem zentralen CSS-Variablensystem (`tactical_os_design.md`) abgeleitet werden.

---

## 🔒 4. Asset-Management

1.  **Original-Dateien:** Alle Logos und Mascot-Grafiken müssen in einem geschützten Verzeichnis (`assets/branding/`) in den Formaten `.svg` oder High-Res `.png` vorliegen.
2.  **Versionierung:** Änderungen an Branding-Assets müssen als "Major Version Change" dokumentiert werden.
3.  **Watermarking:** In Exporten oder Berichten ist das dezente Antigravity-Branding (unten rechts oder im Footer) verpflichtend.

---

## 📋 5. Compliance Check

Bevor ein neues Modul als "Produktionsreif" gilt, muss es das Branding-Audit bestehen:
*   [ ] Ist das Logo proportional korrekt eingebunden?
*   [ ] Entspricht die Aerith-Darstellung dem Core-Design?
*   [ ] Werden ausschließlich Farben der Tactical-Palette genutzt?
*   [ ] Ist die Schutzzone um Branding-Elemente gewahrt?

---
*Branding Integrity Protocol – Stand Mai 2026. Antigravity Legal & Design.*
