# DevHub / Mission Control Agent Rules

## Projektziel
Dieses Projekt ist ein Raspberry-Pi-5 Mission Control Dashboard für Homelab, Growbox, Docker, Prometheus, n8n und KI-Diagnosen.

## Architektur
- Backend: Flask 3 in app.py
- Frontend: React + Vite + TypeScript + TailwindCSS
- Container: devhub auf Port 5666
- Controller: /home/user/Tactical-Bot-Core/ über BOT_CTRL_URL
- Daten: ./data/*.json
- Monitoring: Prometheus localhost:9090
- KI: Ollama localhost:11434, optional Groq/OpenRouter/Gemini

## Harte Regeln
- Niemals .env ausgeben, verändern oder committen.
- Niemals rm -rf, chmod -R 777, chown -R oder destructive shell commands ohne explizite Freigabe.
- Niemals data/*.json überschreiben, ohne vorher Backup anzulegen.
- Keine großen Refactors ohne Plan.
- Keine Secrets in Logs, UI oder Commits.
- Änderungen immer klein, testbar und rückrollbar halten.

## Arbeitsweise
Vor jeder Änderung:
1. Relevante Dateien lesen.
2. Plan mit betroffenen Dateien erstellen.
3. Minimalen Patch machen.
4. Build/Test ausführen.
5. Ergebnis und Risiken zusammenfassen.

## Testbefehle
Frontend:
npm run build

Backend:
python -m py_compile app.py

Docker:
docker compose config
docker logs --tail=100 devhub
