# Nexus Command Hub – Mobile PWA Dokumentation

## Übersicht
Dieses Dokument beschreibt die Erweiterung des DevHubs um eine mobile-optimierte Progressive Web App (PWA), genannt **Nexus**.

## Architektur
- **Frontend**: React 19 / Vite 8 / Tailwind CSS 4.
- **PWA-Support**: Realisiert via `vite-plugin-pwa` (Service Worker & Web-Manifest).
- **Backend**: Flask 3 Blueprint (`react_ui.py`), der die `dist/` statisch ausliefert und API-Requests an den Host-Controller weiterleitet.

## Features & Komponenten

### 1. Status-Dashboard (`MobileStatus.tsx`)
- **Live-Metrics**: CPU-Last, RAM-Verbrauch, Speicherplatz und Temperatur des RPi5.
- **Growbox-Werte**: Temperatur, Luftfeuchtigkeit, VPD und Lampen-Status.
- **Quick Actions**: Direkte Steuerung von Licht und Bewässerung ohne Umweg über n8n.

### 2. Grafana Integration (`MobileDashboards.tsx`)
- Eingebettete Iframes der wichtigsten Dashboards (`rpi5-main`, `pihole-dns-v1`).
- Optimiert für Querformat und Kiosk-Mode.
- **Security**: Erfordert `GF_SECURITY_ALLOW_EMBEDDING=true` und aktivierten anonymen Zugriff in Grafana.

### 3. n8n Workflow-Editor (`MobileWorkflows.tsx`)
- Vollständiger n8n-Editor im Iframe.
- Spezieller "Full-Screen Mode": Blendet die untere Navigation aus, um den Platz am Handy maximal zu nutzen.

### 4. Docker Management (`MobileServices.tsx`)
- Liste aller laufenden Container auf dem Server.
- Steuerung: Start, Stop und Neustart direkt aus der App heraus.

### 5. PIN-Lock Sicherheit (`PinLock.tsx` / `MobileSettings.tsx`)
- **Nexus Safe**: Optionaler 4-stelliger PIN-Code zum Schutz der App.
- Wird im `localStorage` gespeichert und ermöglicht schnellen Zugriff ohne Passwort-Eingabe.

## Technische Details

### Sicherheit
- Alle mobilen Routen (`/ui/mobile`) sind serverseitig via `@login_required` geschützt.
- Der `useApi` Hook im Frontend erkennt Session-Timeouts und leitet automatisch zur Login-Seite weiter.

### Netzwerk & Ports
- Der Container `devhub` ist nun an `0.0.0.0:5666` gebunden, um den Zugriff von anderen Geräten im WLAN zu ermöglichen.
- Interne Kommunikation zum Controller erfolgt über `host.docker.internal:5667`.

## Deployment
Änderungen am Frontend erfordern einen lokalen Build und anschließenden Sync:
```bash
cd frontend && npm run build
bash deploy.sh
```

---
*Erstellt am 28.04.2026 von Antigravity.*
