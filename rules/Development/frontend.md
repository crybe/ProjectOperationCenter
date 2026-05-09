# Frontend – Antigravity / Nexus-Control-Hub

## Stack

React 19 · TypeScript · Tailwind CSS 4 · Vite 8 · react-router-dom 7
Quellen: `frontend/src/` · Build-Output: `frontend/dist/`

---

## Deployment Workflow

### 1. Lokal Bauen (Empfohlen für PWA)
Da das PWA-Plugin Assets generiert, die im Browser gecached werden, sollte der Build lokal erfolgen und dann synchronisiert werden.

```bash
cd Nexus-Control-Hub/frontend
npm run build
```

### 2. Synchronisation
`./deploy.sh` im Hauptverzeichnis ist so konfiguriert, dass es den `dist/`-Ordner mit auf den Server überträgt.

```bash
./deploy.sh
```

---

## Mobile App (PWA)

### Installation
- Auf Android: Chrome öffnen -> `Zum Startbildschirm hinzufügen`.
- Die App nutzt `vite-plugin-pwa` für Service-Worker und Manifest.

### Komponenten
- `MobileApp.tsx`: Hauptlayout mit Bottom-Nav.
- `MobileStatus.tsx`: System- & Growbox-Metriken (nutzt `useApi` Hook).
- `MobileDashboards.tsx`: Grafana Iframes.
- `MobileWorkflows.tsx`: n8n Editor Integration.

---

## Entwicklungsregeln

- **Hooks**: Immer den `useApi` Hook für API-Calls verwenden (handelt Session-Redirects automatisch).
- **Zustand**: Navigation in der Mobile-App kann via `onToggleNav` Prop gesteuert werden (z.B. für Vollbild-Editor).
- **Icons**: Lucide-React als Icon-Set verwenden.
- **Styling**: Tailwind CSS für Responsive Design nutzen.

---

## Code-Qualität & Typisierung

### TypeScript Integrity (NEU)
- **Regel**: Die Verwendung von `any` ist für neue Komponenten untersagt.
- **Implementierung**: Nutze explizite Interfaces für Props und API-Antworten. Das verhindert, dass das Dashboard bei API-Änderungen lautlos Daten verliert oder der Build (wie bei PWA-Modulen) fehlschlägt.
- **PWA Awareness**: Bei Änderungen an API-Strukturen muss die Version in der `package.json` oder die Cache-Strategie in der `vite.config.ts` geprüft werden, um sicherzustellen, dass Clients den neuen Code via Service Worker erhalten.

---

## Neue Mobile-Seite hinzufügen

1. Neue Komponente in `frontend/src/mobile/` erstellen.
2. In `MobileApp.tsx` den Tab und die View-Logik ergänzen.
3. Build & Deploy ausführen.
