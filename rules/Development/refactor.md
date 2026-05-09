# Refactor – Antigravity / Nexus-Control-Hub

## Wann refactoren?

### Ja – klarer Anlass
- Eine Funktion ist länger als ~80 Zeilen und hat mehr als 3 Verantwortlichkeiten
- Gleicher Code-Block taucht in 3+ Routes auf (DRY-Grenze)
- `app.py` bekommt eine neue Kategorie (neues Feature-Gebiet) – dann als Modul auslagern

### Nein – lieber lassen
- Wenn der Code funktioniert und keine Bugs hat → kein kosmetisches Refactor
- Wenn eine Route "hässlich" aber klar lesbar ist → lesbar schlägt elegant
- Niemals mitten in einer Feature-Entwicklung refactoren – erst Feature fertig, dann aufräumen

---

## app.py Modularisierung (wenn nötig)

`app.py` ist bewusst monolithisch (102 KB, eine Datei). Wenn ausgelagert wird:

```
Nexus-Control-Hub/
├── app.py          # Nur Flask-App-Init und Imports
├── routes/
│   ├── auth.py     # /login, /logout
│   ├── board.py    # /board, /api/tasks/*
│   ├── files.py    # /files, /api/file/*
│   └── ai.py       # /api/ai/*, Token-Tracking
├── utils/
│   ├── storage.py  # JSON-Locking-Helpers (_load, _save)
│   └── auth.py     # login_required Dekorator
```

**Aber:** Erst auslagern wenn `app.py` > 150 KB oder wenn mehrere Entwickler gleichzeitig arbeiten. Derzeit ist ein File einfacher.

---

## Konkrete Kandidaten (Stand April 2026)

### 1. Storage-Helpers vereinheitlichen
`_usage_load()` / `_usage_save()` und die Project-JSON-Funktionen haben fast identisches File-Locking. Könnten zu einer generischen `json_load(path)` / `json_save(path, data)` Funktion werden.

```python
def json_load(path: str, default=None):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            fcntl.flock(f, fcntl.LOCK_SH)
            try:    return json.load(f)
            finally: fcntl.flock(f, fcntl.LOCK_UN)
    except (FileNotFoundError, json.JSONDecodeError):
        return default if default is not None else {}
```

### 2. Groq-API-Call kapseln
Alle KI-Requests direkt aus Routes heraus zu machen erschwert das Austauschen des Providers. Eine `call_ai(prompt, system=None, model=None)` Funktion mit Token-Tracking wäre sinnvoll wenn ein zweiter AI-Provider dazukommt.

---

## Refactor-Prozess

1. Bestehende Tests (falls vorhanden) laufen lassen → Baseline
2. Änderung in eigenem Git-Branch
3. `docker compose up -d --build` und manuell die betroffene Feature testen
4. `app.py` Syntax prüfen: `python3 -m py_compile app.py`
5. Merge wenn keine Regression

---

## Was nie refactored werden soll

- `fcntl.flock()` durch Locks aus Threading-Modulen ersetzen (Gunicorn ist multi-process, nicht multi-thread)
- JSON-Storage durch SQLite/Redis ersetzen ohne konkreten Bedarf (Complexity ohne Benefit)
- `@app.template_global()` durch Context-Processor ersetzen (funktioniert, lass es)
