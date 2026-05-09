# Release Notes // Tactical_OS

## Version: v2.5.5 Public Baseline
**Date:** 2026-05-10
**Status:** Stable Release

### Overview
This is the first public baseline release of the Antigravity Tactical Dashboard (Nexus Command Hub). It incorporates all hardening and readability improvements from the private production cycle.

### Key Features
- **Tactical UI System:** Premium glassmorphism design with high-contrast panels (`0.85` opacity).
- **Growbox HUD:** Full integration for AC Infinity and other grow hardware via Prometheus/Webhooks.
- **Docker Orchestration:** Real-time container monitoring and control (Start/Stop/Restart).
- **AI Integration:** Support for Gemini, Groq, and OpenRouter for system analysis and autonomous task management.
- **Responsive Architecture:** Fully optimized for mobile and desktop viewports.
- **P.I.G.E.O.N. Failguard:** Integrated security and health monitoring system.

### Public Cleanup
- Removed all private API keys and tokens.
- Sanitized internal IP addresses and hostnames.
- Replaced absolute home directory paths with generic placeholders.
- Removed private history and logs.
- Added `.env.example` and `docker-compose.example.yml`.

### Installation
Refer to the `README.md` for detailed setup instructions.
