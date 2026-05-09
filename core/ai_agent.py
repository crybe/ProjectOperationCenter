import os, time, json, types, threading, urllib.request
from datetime import datetime
_agent_started = False
def _call_groq_or_xai(prompt):
    """Interne Hilfsfunktion für KI-Abfragen via Groq oder Ollama-Fallback."""
    from core.config import Config
    api_key = Config.GROQ_API_KEY
    url = "https://api.groq.com/openai/v1/chat/completions"
    model = "llama-3.3-70b-versatile"
    
    if not api_key and Config.ENABLE_OLLAMA_FALLBACK:
        host = Config.OLLAMA_HOST
        try:
            p = json.dumps({"model": "llama3.2:3b", "messages": [{"role": "user", "content": prompt}], "stream": False}).encode("utf-8")
            req = urllib.request.Request(f"{host}/api/chat", data=p, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode("utf-8")).get("message", {}).get("content", "")
        except: return ""
        
    if not api_key: return "" # Weder Cloud noch Local verfügbar
    
    p = json.dumps({"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.2}).encode("utf-8")
    req = urllib.request.Request(url, data=p, headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))["choices"][0]["message"]["content"]
    except: return ""
def generate_patch_for_task(title, description, project, target_file=""):
    from intelligence_worker.ai_logic import _extract_json, _syntax_check
    path = getattr(project, "server_path", "/home/user")
    hint = target_file or f"{path}/generated_script.py"
    prompt = f"Du bist KI-Entwickler. Ticket: {title}\n{description}\nAntworte NUR JSON: {{\"file\": \"{hint}\", \"content\": \"Code\"}}"
    raw = _call_groq_or_xai(prompt)
    if not raw: return None
    try:
        d = _extract_json(raw); f_p = d.get("file", hint); cont = d.get("content", "")
        ok, err = _syntax_check(f_p, cont)
        return {"file": f_p, "content": cont, "syntax_ok": ok, "syntax_error": err, "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"), "model": "auto-agent"}
    except: return None
def run_agent_loop(app):
    """
    Hauptschleife des autonomen KI-Agenten.
    Sucht nach offenen Tasks mit dem Label 'auto' oder 'ai-fix'
    und generiert Code-Vorschläge (Patches) dafür.
    """
    from core.db import db
    from core.models import Task, Project
    with app.app_context():
        while True:
            time.sleep(120) # Alle 2 Minuten prüfen
            try:
                tasks = Task.query.filter_by(status="offen").all()
                for t in tasks:
                    if "auto" in (t.labels or []) or "ai-fix" in (t.labels or []):
                        if t.ai_patch or t.agent_error: continue
                        t.status = "in-arbeit"; t.progress = 10; t.current_step = "Initialisiere..."; t.agent_started = datetime.now().strftime("%Y-%m-%d %H:%M")
                        db.session.commit()
                        t.progress = 30; t.current_step = "Analysiere..."; db.session.commit()
                        t.progress = 60; t.current_step = "KI generiert..."; db.session.commit()
                        patch = generate_patch_for_task(t.title, t.description, Project.query.get(t.project_id), t.target_file_hint)
                        if patch:
                            t.ai_patch = patch; t.status = "review"; t.progress = 100; t.current_step = "Fertig"
                        else:
                            t.status = "offen"; t.agent_error = "Fehler"; t.progress = 0; t.current_step = ""
                        db.session.commit(); break
            except: db.session.rollback()

def start_agent(app):
    """
    Initialisiert den KI-Agenten in einem separaten Thread.
    Stellt sicher, dass der Agent nur einmal pro Instanz läuft.
    """
    global _agent_started
    if _agent_started: return
    
    # Nutze Lock-Datei um Mehrfachstart durch Gunicorn Worker zu verhindern
    import os, fcntl
    lock_file = "/tmp/devhub_agent.lock"
    f = open(lock_file, "w")
    try:
        fcntl.lockf(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        _agent_started = True
        threading.Thread(target=run_agent_loop, args=(app,), daemon=True).start()
        print("[AI Agent] Started exclusively on this worker.")
    except IOError:
        pass # Agent läuft bereits in einem anderen Worker

def start_json_agent(app): pass
