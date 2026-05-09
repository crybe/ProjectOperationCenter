# Architecture Overview

## Technology Stack
- **OS:** Raspberry Pi OS (Debian based)
- **Hardware:** Raspberry Pi 5
- **Backend:** Flask 3 (Python)
- **Frontend:** React + Vite + TypeScript (TailwindCSS 4)
- **Database:** JSON files in `./data/`
- **Containerization:** Docker & Docker Compose

## Component Breakdown
1. **DevHub Dashboard (Flask):** The main entry point, handling API requests and serving the frontend.
2. **DevHub Controller (Tactical-Bot-Core):** A system-level helper that executes commands that require higher privileges.
3. **Monitoring (Prometheus):** Scrapes metrics from exporters and provides time-series data.
4. **Automation (n8n):** Handles complex background workflows.
5. **AI Logic:** Integrates with local (Ollama) and cloud (Groq/Gemini) AI providers.

## Data Flow
- Users interact with the React Frontend.
- React calls Flask API.
- Flask reads/writes JSON data or queries Prometheus.
- Flask calls DevHub Controller for system actions.

## Visual Identity & Design System
The "Backtrack-Rebuild" project follows a strict **Tactical Cybernetics** aesthetic to reflect its mission-critical nature.

### Branding
- **Project Name:** Backtrack-Rebuild
- **Mascot:** "Tactical Druff & Bored" (A cybernetic pigeon with emerald glowing eye-implant).
- **Mascot Path:** `/static/assets/mascot_tactical.png`
- **Core Color:** Emerald Green (#10b981) - Used for optimal status and active system processes.
- **Accent Color:** Deep Crimson (#cc0000) - Used for alerts and critical system warnings (Legacy "Backtrack" accent).

### UI Layout (The Zone System)
The dashboard is structured into logical, labeled zones to maintain operational order:
- **Zone Alpha (Strategic Intelligence):** Intelligence Engine reports and global health scoring.
- **Zone Beta (Bio-Telemetry):** Real-time environmental metrics (VPD, Temp, RH).
- **Zone Gamma (Predictive Analysis):** AI-driven growth forecasting and VPD visualization.
- **Zone Delta (Tactical Operations):** Gunning-level equipment control, logs, and history.

### Design Principles
- **Glassmorphism:** Use of high-blur (`backdrop-blur-3xl`) and low-opacity backgrounds (`bg-black/40`) for panels.
- **Tactical Framing:** All panels utilize the `clip-path-tactical` (notched corners) and `border-flow` (animated borders) for a professional OS look.
- **Holographic Overlays:** Scanner lines and scan-horizontal animations for active components.
