import os
import json
import re
import fcntl
import time
import functools
import subprocess
from datetime import datetime, timedelta
from flask import session, redirect, url_for, request
from core.constants import (
    DATA_FILE, USAGE_FILE, BASE_PATH, SKIP_FILES, SKIP_SUFFIXES,
    ALLOWED_EXTENSIONS, SKIP_DIRS
)
from core.event_system import events, EventSeverity, EventType, EventSource

def log_action(category, action, details=None, source=EventSource.SYSTEM):
    """
    Protokolliert eine Aktion über das zentrale Event-System.
    """
    severity = EventSeverity.INFO
    if any(keyword in action.upper() for keyword in ["FAIL", "ERROR"]):
        severity = EventSeverity.WARN
    if "CRITICAL" in action.upper():
        severity = EventSeverity.CRITICAL

    events.emit(
        name=action.lower(),
        module=category,
        event_type=EventType.ACTION if "EXEC" in action.upper() else EventType.EVENT,
        severity=severity,
        source=source,
        data={"details": details} if details else {}
    )

def safe_load_json(file_path, default=None):
    """
    Lädt JSON-Daten sicher mit File-Locking und Fehlerbehandlung.
    Verhindert Abstürze bei korrupten Dateien.
    """
    if default is None: default = {}
    if not os.path.exists(file_path):
        return default
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            fcntl.flock(f, fcntl.LOCK_SH)
            try:
                data = json.load(f)
                return data if data is not None else default
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
    except Exception as e:
        log_action("system", "JSON_LOAD_ERROR", f"Pfad: {file_path}, Fehler: {str(e)}")
        return default

def safe_write_json(file_path, data):
    """
    Schreibt JSON-Daten sicher mit File-Locking und Verzeichnis-Erstellung.
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        # Erst in temporäre Datei schreiben, dann verschieben (Atomarität)
        tmp_path = f"{file_path}.tmp"
        with open(tmp_path, 'w', encoding='utf-8') as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.flush()
                os.fsync(f.fileno())
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        os.replace(tmp_path, file_path)
        return True
    except Exception as e:
        log_action("system", "JSON_WRITE_ERROR", f"Pfad: {file_path}, Fehler: {str(e)}")
        return False

def retry_with_backoff(retries=3, backoff_in_seconds=1):
    """
    Decorator for standard retries with exponential backoff.
    """
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            x = 0
            while True:
                try:
                    return f(*args, **kwargs)
                except Exception as e:
                    if x >= retries:
                        events.emit(
                            name="retry_exhausted",
                            module="system",
                            event_type=EventType.ERROR,
                            severity=EventSeverity.CRITICAL,
                            data={"function": f.__name__, "error": str(e), "attempts": x+1}
                        )
                        raise
                    sleep = (backoff_in_seconds * 2 ** x)
                    time.sleep(sleep)
                    x += 1
        return wrapper
    return decorator

def sync_proxy_login():
    """ 
    Versucht den Benutzer über HTTP-Header eines vorgeschalteten Proxys (z.B. Authentik)
    zu authentifizieren. Setzt die Session-Variablen bei Erfolg.
    """
    # Check if user manually logged out to prevent auto-login loop
    if request.cookies.get('tactical_logout') == '1':
        return False

    username = (request.headers.get('X-authentik-username') or '').strip()
    if not username:
        return False
    session.permanent = True
    session['logged_in'] = True
    session['auth_user'] = username
    session['user_role'] = 'admin' # Default role for proxy-authenticated users
    return True


def login_required(f):
    """
    Decorator zur Absicherung von Flask-Routes.
    Prüft ob der User eingeloggt ist, sonst Redirect zum Login.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        sync_proxy_login() # Proxy-Login Versuch bei jeder Anfrage
        if not session.get('logged_in'):
            if request.path.startswith('/api/'):
                from flask import jsonify
                return jsonify({'ok': False, 'error': 'UNAUTHORIZED', 'details': 'Bitte melden Sie sich an.'}), 401
            return redirect(url_for('auth.login', next=request.path))
        return f(*args, **kwargs)
    return decorated

def load_projects():
    from core.models import Project
    try:
        from flask import current_app
        # Sort by updated field descending (newest/most recent first)
        projects = Project.query.order_by(Project.updated.desc()).all()
        return [p.to_dict() for p in projects]
    except Exception as e:
        # Fallback or log error
        return []

def _sync_tasks(db, project_id, tasks_data):
    from core.models import Task
    existing = {t.id: t for t in Task.query.filter_by(project_id=project_id).all()}
    seen = set()
    for t_data in tasks_data:
        tid = t_data['id']
        seen.add(tid)
        t = existing.get(tid)
        if t is None:
            t = Task(id=tid, project_id=project_id)
            db.session.add(t)
        t.title          = t_data.get('title', '')
        t.status         = t_data.get('status', 'offen')
        t.labels         = t_data.get('labels', [])
        t.description    = t_data.get('description', '')
        t.due_date       = t_data.get('due_date', '')
        t.created        = t_data.get('created', '')
        t.automation_slug = t_data.get('automation_slug', '')
        t.ai_applied     = t_data.get('ai_applied', '')
        t.ai_patch       = t_data.get('ai_patch', None)
    for tid, t in existing.items():
        if tid not in seen:
            db.session.delete(t)


def _sync_notes(db, project_id, notes_data):
    from core.models import Note
    existing = {n.id: n for n in Note.query.filter_by(project_id=project_id).all()}
    seen = set()
    for n_data in notes_data:
        nid = n_data['id']
        seen.add(nid)
        n = existing.get(nid)
        if n is None:
            n = Note(id=nid, project_id=project_id)
            db.session.add(n)
        n.content = n_data.get('content', '')
        n.created = n_data.get('created', '')
    for nid, n in existing.items():
        if nid not in seen:
            db.session.delete(n)


def _sync_changelogs(db, project_id, changelogs_data):
    from core.models import Changelog
    existing = {c.id: c for c in Changelog.query.filter_by(project_id=project_id).all()}
    seen = set()
    for c_data in changelogs_data:
        cid = c_data.get('id')
        if cid and cid in existing:
            seen.add(cid)
            c = existing[cid]
            c.date    = c_data.get('date', '')
            c.version = c_data.get('version', '')
            c.changes = c_data.get('changes', '')
        else:
            cl = Changelog(project_id=project_id, date=c_data.get('date', ''),
                           version=c_data.get('version', ''), changes=c_data.get('changes', ''))
            db.session.add(cl)
    for cid, c in existing.items():
        if cid not in seen:
            db.session.delete(c)


def save_projects(projects):
    from core.models import Project, Task, Changelog, Note
    from core.db import db
    from flask import current_app as app

    from flask import current_app
    # Assumes we are running within an app context (e.g. from a request or task)
    for p_data in projects:
        project = db.session.get(Project, p_data['id'])
        if not project:
            project = Project(id=p_data['id'])
            db.session.add(project)

        project.name        = p_data.get('name', '')
        project.description = p_data.get('description', '')
        project.status      = p_data.get('status', 'active')
        project.server_path = p_data.get('server_path', '')
        project.git_repo    = p_data.get('git_repo', '')
        project.tags        = p_data.get('tags', [])
        project.file_paths  = p_data.get('file_paths', [])
        project.created     = p_data.get('created', '')
        project.updated     = p_data.get('updated', '')

        _sync_tasks(db, project.id, p_data.get('tasks', []))
        _sync_notes(db, project.id, p_data.get('notes_list', []))
        _sync_changelogs(db, project.id, p_data.get('changelog', []))

    incoming_ids = {p['id'] for p in projects}
    for p in Project.query.all():
        if p.id not in incoming_ids:
            db.session.delete(p)

    db.session.commit()

def get_project(pid):
    return next((p for p in load_projects() if p['id'] == pid), None)

def make_id(name, existing):
    base = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or 'projekt'
    uid = base
    i = 1
    while uid in existing:
        uid = f"{base}-{i}"; i += 1
    return uid

def _usage_load():
    try:
        if os.path.exists(USAGE_FILE):
            with open(USAGE_FILE, 'r', encoding='utf-8') as f:
                fcntl.flock(f, fcntl.LOCK_SH)
                try:    return json.load(f)
                finally: fcntl.flock(f, fcntl.LOCK_UN)
    except Exception:
        pass
    return {}

def _usage_save(data):
    os.makedirs(os.path.dirname(USAGE_FILE), exist_ok=True)
    with open(USAGE_FILE, 'w', encoding='utf-8') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:    json.dump(data, f, indent=2, ensure_ascii=False)
        finally: fcntl.flock(f, fcntl.LOCK_UN)

def track_tokens(provider: str, input_chars: int, output_chars: int):
    today = datetime.now().strftime('%Y-%m-%d')
    data  = _usage_load()
    day   = data.setdefault(today, {})
    entry = day.setdefault(provider, {'input': 0, 'output': 0, 'requests': 0})
    entry['input']    += max(0, input_chars  // 4)
    entry['output']   += max(0, output_chars // 4)
    entry['requests'] += 1
    _usage_save(data)

def safe_path(raw_path):
    """
    Sicherheits-Check für Dateipfade. 
    Verhindert Path-Traversal Angriffe, indem geprüft wird, 
    ob der realisierte Pfad innerhalb von BASE_PATH liegt.
    """
    real = os.path.realpath(os.path.abspath(raw_path))
    if real.startswith(os.path.realpath(BASE_PATH)):
        return real
    return None

def validate_command_safety(command):
    """
    Prüft einen Shell-Befehl auf gefährliche Muster oder verbotene Kommandos.
    Gibt (bool, reason) zurück.
    """
    if not command or not isinstance(command, str):
        return False, "Leerer oder ungültiger Befehl"
    
    cmd_lower = command.lower().strip()
    
    # 1. Blacklist gefährlicher Keywords
    forbidden = [
        "rm ", "mkfs", "dd ", "chmod", "chown", "passwd", 
        ">", ">>", "wget", "curl", "python", "perl", "bash ", "sh ",
        "nvram", "flash", "reboot", "shutdown", "kill -9", "poweroff"
    ]
    for f in forbidden:
        if f in cmd_lower:
            return False, f"Verbotenes Muster erkannt: {f}"
            
    # 2. Whitelist erlaubter Basiskommandos
    # Erlaubt sind Kommandos, die mit diesen Worten starten
    allowed_starts = [
        "ls", "ps", "top", "free", "df", "uptime", "ss ", "netstat",
        "systemctl status", "systemctl is-active",
        "docker ps", "docker logs", "docker stats",
        "journalctl", "cat ", "grep ", "tail ", "head ", "ping ", "dig ", "nmap "
    ]
    
    # Sonderregel für sudo (nur für systemctl status/restart von erlaubten Services)
    if cmd_lower.startswith("sudo "):
        # Erlaube nur spezifische sudo-Aktionen
        safe_sudo = ["sudo systemctl status", "sudo systemctl restart", "sudo systemctl stop", "sudo systemctl start"]
        if not any(cmd_lower.startswith(s) for s in safe_sudo):
            return False, "Sudo nur für System-Management erlaubt"
    else:
        # Wenn kein sudo, prüfe ob es mit einem erlaubten Wort startet
        if not any(cmd_lower.startswith(a) for a in allowed_starts):
            # Erlaube auch absolute Pfade zu eigenen Scripts, sofern sie im Workspace liegen
            if not cmd_lower.startswith("/home/user/"):
                return False, "Kommando nicht in der Whitelist"

    # 3. Zeichen-Validierung (Verhindere Verkettung/Eingabeumleitung)
    # Erlaube Pipes nur wenn sie moderat genutzt werden (z.B. grep)
    if "|" in command:
        parts = command.split("|")
        if len(parts) > 3:
            return False, "Zu viele Pipes erkannt"
        # Jeder Teil der Pipe muss ebenfalls sicher sein
        for p in parts:
            p_ok, p_reason = validate_command_safety(p.strip())
            if not p_ok:
                return False, f"Pipe-Segment unsicher: {p_reason}"
    
    # Verhindere ; und && / || für Verkettung (außer innerhalb der Pipe-Logik)
    if any(c in command for c in [";", "&&", "||", "`", "$("]):
         return False, "Befehlsverkettung oder Subshells verboten"

    return True, "Safe"

def skip_file(name):
    if name in SKIP_FILES:
        return True
    if any(name.endswith(s) for s in SKIP_SUFFIXES):
        return True
    return False

def build_tree(directory, depth=0, max_depth=5):
    if depth > max_depth:
        return []
    items = []
    try:
        entries = sorted(os.scandir(directory),
                         key=lambda e: (not e.is_dir(), e.name.lower()))
    except PermissionError:
        return []
    for e in entries:
        if e.is_dir():
            if e.name in SKIP_DIRS or e.name.startswith('.'):
                continue
            children = build_tree(e.path, depth + 1, max_depth)
            if children:
                items.append({'name': e.name, 'path': e.path, 'is_dir': True, 'children': children})
        else:
            if skip_file(e.name):
                continue
            if os.path.splitext(e.name)[1].lower() not in ALLOWED_EXTENSIONS:
                continue
            items.append({'name': e.name, 'path': e.path, 'is_dir': False})
    return items

def build_multi_tree(file_paths):
    roots = []
    for raw in file_paths:
        if not raw: continue
        real = safe_path(raw)
        if not real or not os.path.exists(real): continue
        name = os.path.basename(real)
        if os.path.isfile(real):
            if not skip_file(name) and os.path.splitext(name)[1].lower() in ALLOWED_EXTENSIONS:
                roots.append({'name': name, 'path': real, 'is_dir': False})
        elif os.path.isdir(real):
            children = build_tree(real)
            roots.append({'name': name, 'path': real, 'is_dir': True, 'children': children})
    return roots

def collect_recent_files(paths, cutoff, limit=6):
    recent = []
    def scan(path, depth=0):
        if depth > 3 or len(recent) >= limit * 4: return
        try:
            if os.path.isfile(path):
                name = os.path.basename(path)
                if skip_file(name) or os.path.splitext(name)[1].lower() not in ALLOWED_EXTENSIONS: return
                mtime = os.path.getmtime(path)
                if mtime >= cutoff:
                    recent.append({'path': path, 'name': name, 'mtime': int(mtime)})
            elif os.path.isdir(path):
                for entry in os.scandir(path):
                    if entry.is_dir() and (entry.name in SKIP_DIRS or entry.name.startswith('.')): continue
                    scan(entry.path, depth + 1)
        except (PermissionError, OSError): pass
    for raw in paths:
        real = safe_path(raw)
        if real and os.path.exists(real): scan(real)
    recent.sort(key=lambda item: item['mtime'], reverse=True)
    return recent[:limit]

def format_relative_time(ts):
    delta = max(0, int(time.time() - ts))
    if delta < 60: return 'gerade eben'
    if delta < 3600: return f'vor {delta // 60} min'
    if delta < 86400: return f'vor {delta // 3600} h'
    return datetime.fromtimestamp(ts).strftime('%d.%m. %H:%M')

def parse_dateish(value):
    if not value: return None
    text = str(value).strip()
    for fmt in ('%Y-%m-%d %H:%M', '%Y-%m-%d', '%d.%m.%Y %H:%M:%S'):
        try: return datetime.strptime(text, fmt)
        except ValueError: continue
    return None

def build_suggestion_context(projects):
    now_dt = datetime.now()
    recent_project_tokens = set()
    automation_history = {}
    active_generated_projects = 0
    for project in projects:
        if project.get('id', '').startswith('generated-'): active_generated_projects += 1
        updated_dt = parse_dateish(project.get('updated'))
        if updated_dt and (now_dt - updated_dt) <= timedelta(days=5):
            recent_project_tokens.update(re.findall(r'[a-z0-9]+', project.get('name', '').lower()))
            for tag in project.get('tags', []): recent_project_tokens.add(tag.lower())
        for task in project.get('tasks', []):
            slug = task.get('automation_slug')
            if not slug: continue
            entry = automation_history.setdefault(slug, {'applied': 0, 'review': 0, 'recent': 0})
            if task.get('ai_applied'):
                entry['applied'] += 1
                applied_dt = parse_dateish(task.get('ai_applied'))
                if applied_dt and (now_dt - applied_dt) <= timedelta(days=14): entry['recent'] += 1
            elif task.get('status') == 'review': entry['review'] += 1
    return {'recent_tokens': recent_project_tokens, 'history': automation_history, 'generated_count': active_generated_projects}

def collect_code_files(tree, result=None, total=0):
    if result is None: result = []
    CODE_PRIO = {'.py', '.sh', '.yml', '.yaml', '.conf', '.service', '.md'}
    nodes = sorted([n for n in tree if not n['is_dir']], key=lambda n: (0 if os.path.splitext(n['name'])[1] in CODE_PRIO else 1, n['name']))
    for n in nodes: result.append(n)
    for d in [n for n in tree if n['is_dir']]: collect_code_files(d.get('children', []), result, total)

def mtime_hash(file_paths):
    import hashlib
    parts = []
    def collect(path, depth=0):
        if depth > 4: return
        try:
            if os.path.isfile(path):
                name = os.path.basename(path)
                if not skip_file(name) and os.path.splitext(name)[1].lower() in ALLOWED_EXTENSIONS:
                    parts.append(f"{path}:{os.path.getmtime(path):.0f}")
            elif os.path.isdir(path):
                for e in os.scandir(path):
                    if e.is_dir() and (e.name in SKIP_DIRS or e.name.startswith('.')): continue
                    collect(e.path, depth + 1)
        except (PermissionError, OSError): pass
    for raw in file_paths:
        real = safe_path(raw)
        if real and os.path.exists(real): collect(real)
    return hashlib.md5('\n'.join(sorted(parts)).encode()).hexdigest()[:12]
