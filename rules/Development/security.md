# Sicherheitsregeln: Credential Management

Um die Sicherheit des Systems zu gewährleisten, dürfen niemals sensible Daten direkt im Quellcode oder in statischen Dateien (HTML, JS, Python) gespeichert werden.

## 1. Umgebungsvariablen (.env)
- Alle API-Keys, Passwörter, Tokens und Chat-IDs müssen in der zentralen `.env` Datei gespeichert werden.
- Im Python-Code werden diese via `os.environ.get('KEY_NAME')` geladen.
- Im Frontend (React/Vite) werden sie via `import.meta.env.VITE_KEY_NAME` eingebunden (nur wenn für das Frontend absolut notwendig).

## 2. Statische Templates
- HTML-Templates (Jinja2) dürfen keine vorinstallierten Creds in `value`-Attributen enthalten.
- Falls Werte angezeigt werden müssen, sind diese vom Backend als Variable zu übergeben.

## 3. Deployment
- Die `.env` Datei auf dem Server muss manuell oder über sichere Secret-Manager gepflegt werden und darf niemals in das Git-Repository eingecheckt werden (siehe `.gitignore`).

## 4. P.I.G.E.O.N. Integration
- P.I.G.E.O.N. scannt regelmäßig nach Mustern, die auf hartkodierte Credentials hindeuten, und meldet diese als Sicherheitsanomalie.
