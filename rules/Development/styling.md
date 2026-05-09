# Styling & Struktur – Antigravity / Nexus-Control-Hub

## 📂 Projekt-Struktur (Strict Repository Maintenance)

Um das Root-Verzeichnis sauber zu halten, gelten folgende Regeln:
- **`core/tools/`**: Helfer-Skripte (Logging, Fixer), losgelöst vom Backend.
- **`System-Utilities/devops/`**: Deployment, Docker-Management, Backups.
- **`System-Utilities/automation/`**: Hintergrund-Worker und n8n-Schnittstellen.
- **`backups/`**: Archiv für veraltete Quellcode-Backups (`.bak`) und Configs. **Keine `.bak`-Dateien im Hauptverzeichnis!**

---

## 🐍 Python (Backend-Standards)

### Struktur & Formatierung
- **Max Length:** 120 Zeichen.
- **Atomic-Writes:** Nutzung des `tempfile`-Patterns für alle kritischen Dateioperationen.
- **Locking:** `fcntl.flock` ist Pflicht bei Lese/Schreibzugriffen auf globale State-Dateien.

### Kompakt-Code Pattern
Im Projekt ist ein kompakter Stil etabliert (Imports, Variablen-Zuweisungen). Beibehalten, aber mit klaren Kommentaren versehen.

### File-Locking Standard (Mandatory)
```python
import fcntl, json

def save_atomic(filepath, data):
    with open(filepath + '.tmp', 'w') as f:
        json.dump(data, f, indent=4)
        f.flush()
        os.fsync(f.fileno())
    os.rename(filepath + '.tmp', filepath)
```

---

## 🎨 CSS & Design (Tactical_OS HUD)

### CSS-Variablen (:root)
Alle Farben und Effekte **müssen** über Variablen gesteuert werden:
```css
:root {
  --color-bg: #050505;
  --color-surface: rgba(20, 20, 25, 0.7);
  --color-gold: #FFD700;
  --color-red: #FF3131;
  --color-green: #39FF14;
  --blur-factor: blur(15px);
  --border-tactical: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Glassmorphism-Standard
Jedes Panel/Card nutzt:
```css
.card-tactical {
  background: var(--color-surface);
  backdrop-filter: var(--blur-factor);
  border: var(--border-tactical);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
}
```

---

## 🏗️ HTML & React (Frontend)

- **Semantic HTML:** Nutzung von `<header>`, `<main>`, `<section>`, `<aside>`.
- **Tabular Nums:** Metriken nutzen `font-variant-numeric: tabular-nums`.
- **Mascot Presence:** Jede Hauptseite inkludiert die `<AerithMascot />` Komponente mit dynamischem `state`-Prop.

---

## 🐋 Docker & DevOps

- **Restart-Policy:** `unless-stopped` für alle produktiven Container.
- **Naming:** Container-Namen folgen dem Schema `antigravity-<service>`.
- **Safety:** Vor `docker-compose up` immer ein Backup der `docker-compose.yml` erstellen.

---
*Styling-Guide Hardening – Stand Mai 2026. Antigravity System-Design.*
