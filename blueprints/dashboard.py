""" Legacy Dashboard UI Logik """
import os
import re
import time
import json
import uuid
import threading
import xml.etree.ElementTree as ET
import urllib.request as urllib_req
from datetime import datetime
from flask import Blueprint, render_template as render, request, redirect, url_for, jsonify
from core.utils import (
    login_required, load_projects, get_project, collect_recent_files,
    format_relative_time
)
from core.services.automation_service import auto_seed_automation_tasks
from core.constants import COLUMNS

dashboard_bp = Blueprint('dashboard', __name__)

NOTES_FILE = '/app/data/notes.json'

_ATOM_NS = 'http://www.w3.org/2005/Atom'
_NEWS_CACHE = {'data': [], 'ts': 0.0}
_NEWS_LOCK = threading.Lock()
_FEEDS_DIR = '/app/rss-feed'

def _load_feed_config():
    feeds = []
    try:
        for fname in sorted(os.listdir(_FEEDS_DIR)):
            if not fname.endswith('.md'):
                continue
            with open(os.path.join(_FEEDS_DIR, fname), encoding='utf-8') as f:
                content = f.read()
            name = url = kind = None
            for line in content.splitlines():
                line = line.strip()
                if line.startswith('# '):
                    name = line[2:].strip()
                elif line.lower().startswith('url:'):
                    url = line[4:].strip()
                elif line.lower().startswith('type:'):
                    kind = line[5:].strip()
                if name and url and kind:
                    feeds.append((name, url, kind))
                    name = url = kind = None
    except Exception:
        pass
    return feeds

def _fetch_one_feed(source, url, kind, results, lock):
    try:
        req = urllib_req.Request(url, headers={'User-Agent': 'DevHub/1.0'})
        with urllib_req.urlopen(req, timeout=5) as r:
            xml_data = r.read()
        root = ET.fromstring(xml_data)
        items = []
        if kind == 'atom':
            ns = _ATOM_NS
            for entry in root.findall(f'{{{ns}}}entry')[:5]:
                title = (entry.findtext(f'{{{ns}}}title') or '').strip()
                link_el = (entry.find(f'{{{ns}}}link[@rel="alternate"]') or entry.find(f'{{{ns}}}link'))
                link = link_el.get('href', '') if link_el is not None else ''
                if title and link:
                    items.append({'source': source, 'title': title, 'url': link})
        else:
            for item in root.findall('.//item')[:5]:
                title = (item.findtext('title') or '').strip()
                link = (item.findtext('link') or '').strip()
                if title and link:
                    items.append({'source': source, 'title': title, 'url': link})
        with lock:
            results.extend(items)
    except Exception:
        pass

def _refresh_news():
    results, lock = [], threading.Lock()
    threads = [threading.Thread(target=_fetch_one_feed, args=(s, u, k, results, lock), daemon=True)
               for s, u, k in _load_feed_config()]
    for t in threads: t.start()
    for t in threads: t.join(timeout=6)
    return results

@dashboard_bp.route('/api/news')
@login_required
def api_news():
    with _NEWS_LOCK:
        if time.time() - _NEWS_CACHE['ts'] > 300 or not _NEWS_CACHE['data']:
            _NEWS_CACHE['data'] = _refresh_news()
            _NEWS_CACHE['ts'] = time.time()
        return jsonify({'items': _NEWS_CACHE['data']})

def _load_notes():
    try:
        with open(NOTES_FILE) as f:
            return json.load(f)
    except Exception:
        return []

def _save_notes(notes):
    with open(NOTES_FILE, 'w') as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)

@dashboard_bp.route('/api/notes', methods=['GET'])
@login_required
def api_notes_get():
    return jsonify(_load_notes())

@dashboard_bp.route('/api/notes', methods=['POST'])
@login_required
def api_notes_post():
    body = request.get_json(silent=True) or {}
    text = (body.get('text') or '').strip()
    if not text:
        return jsonify({'error': 'text fehlt'}), 400
    note = {
        'id': str(uuid.uuid4()),
        'text': text,
        'color': body.get('color', '#fef08a'),
        'pinned': body.get('pinned', False),
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
    }
    notes = _load_notes()
    notes.insert(0, note)
    _save_notes(notes)
    return jsonify(note)

@dashboard_bp.route('/api/notes/<nid>', methods=['PATCH'])
@login_required
def api_notes_patch(nid):
    body = request.get_json(silent=True) or {}
    text = body.get('text')
    pinned = body.get('pinned')
    
    notes = _load_notes()
    note = next((n for n in notes if n['id'] == nid), None)
    if not note:
        return jsonify({'error': 'Nicht gefunden'}), 404
    
    if text is not None:
        note['text'] = text.strip()
    if pinned is not None:
        note['pinned'] = bool(pinned)
        
    note['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M')
    _save_notes(notes)
    return jsonify({'ok': True})

@dashboard_bp.route('/api/notes/<nid>', methods=['DELETE'])
@login_required
def api_notes_delete(nid):
    notes = [n for n in _load_notes() if n['id'] != nid]
    _save_notes(notes)
    return jsonify({'ok': True})

@dashboard_bp.route('/')
@login_required
def index():
    return redirect('/ui/')

@dashboard_bp.route('/dashboard')
@login_required
def dashboard():
    projects = load_projects()
    auto_seed_automation_tasks(projects)
    projects = load_projects()
    all_tasks = [t for p in projects for t in p.get('tasks', [])]
    total_tasks = len(all_tasks)
    open_tasks = sum(1 for t in all_tasks if t['status'] == 'offen')
    inprogress_tasks = sum(1 for t in all_tasks if t['status'] in ('in-arbeit', 'review'))
    done_tasks = sum(1 for t in all_tasks if t['status'] == 'erledigt')
    return render('dashboard.html', projects=projects,
                  total_tasks=total_tasks, open_tasks=open_tasks,
                  inprogress_tasks=inprogress_tasks, done_tasks=done_tasks,
                  active_page='dashboard')

@dashboard_bp.route('/api/dashboard-activity')
@login_required
def dashboard_activity():
    items = []
    seen = set()
    cutoff = time.time() - 86400 * 3
    def push(item):
        key = (item.get('kind'), item.get('title'), item.get('timestamp'))
        if key not in seen:
            seen.add(key); items.append(item)

    try:
        log_path = '/app/logs/aktionen.log'
        if os.path.exists(log_path):
            with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
                for line in reversed(f.readlines()[-80:]):
                    line = line.strip()
                    if not line: continue
                    match = re.match(r'\[(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})\]\s*(.*)', line)
                    ts = None; message = line
                    if match:
                        try: ts = int(datetime.strptime(match.group(1), '%d.%m.%Y %H:%M:%S').timestamp())
                        except: ts = None
                        message = match.group(2).strip() or 'Ki-Bot Aktivität'
                    if ts and ts < cutoff: continue
                    push({'kind': 'bot', 'icon': 'BOT', 'title': message[:110], 'meta': 'Ki-Bot Aktivität', 'timestamp': ts or int(time.time()), 'time_label': format_relative_time(ts or int(time.time())), 'url': url_for('api.services')})
                    if len([i for i in items if i['kind'] == 'bot']) >= 4: break
    except: pass

    try:
        gemini_log = '/app/logs/gemini.log'
        if os.path.exists(gemini_log):
            with open(gemini_log, 'r', encoding='utf-8', errors='replace') as f:
                for line in reversed(f.readlines()[-40:]):
                    line = line.strip()
                    if not line: continue
                    match = re.match(r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*(.*)', line)
                    ts = None; message = line
                    if match:
                        try: ts = int(datetime.strptime(match.group(1), '%Y-%m-%d %H:%M:%S').timestamp())
                        except: ts = None
                        message = match.group(2).strip()
                    if ts and ts < cutoff: continue
                    push({'kind': 'gemini', 'icon': '♊', 'title': message[:110], 'meta': 'Gemini CLI Chat', 'timestamp': ts or int(time.time()), 'time_label': format_relative_time(ts or int(time.time())), 'url': url_for('dashboard.dashboard')})
                    if len([i for i in items if i['kind'] == 'gemini']) >= 5: break
    except: pass

    try:
        backup_log = '/media/Downloads/SERVER_BACKUPS/backup.log'
        if os.path.exists(backup_log):
            last_line = ''
            with open(backup_log, 'r', encoding='utf-8', errors='replace') as f:
                for line in f:
                    if line.strip(): last_line = line.strip()
            if last_line:
                match = re.match(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s*[-–]?\s*(.*)', last_line)
                ts = int(time.time()); message = last_line
                if match:
                    try: ts = int(datetime.strptime(match.group(1), '%Y-%m-%d %H:%M:%S').timestamp())
                    except: ts = int(time.time())
                    message = match.group(2).strip() or 'Backup aktualisiert'
                push({'kind': 'backup', 'icon': 'BKP', 'title': message[:110], 'meta': 'Letzter Backup-Lauf', 'timestamp': ts, 'time_label': format_relative_time(ts), 'url': url_for('dashboard.dashboard')})
    except: pass

    for project in load_projects()[:12]:
        paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
        for file_item in collect_recent_files(paths, cutoff, limit=2):
            push({'kind': 'file', 'icon': 'FILE', 'title': f"{project['name']} · {file_item['name']}"[:110], 'meta': 'Datei zuletzt geändert', 'timestamp': file_item['mtime'], 'time_label': format_relative_time(file_item['mtime']), 'url': url_for('files.files', pid=project['id'])})
        for entry in project.get('changelog', [])[:2]:
            raw_date = (entry.get('date') or '').strip(); ts = None
            if raw_date:
                for fmt in ('%Y-%m-%d %H:%M', '%Y-%m-%d'):
                    try: ts = int(datetime.strptime(raw_date, fmt).timestamp()); break
                    except: continue
            if ts and ts < cutoff: continue
            push({'kind': 'review', 'icon': 'REV', 'title': f"{project['name']} · {entry.get('changes', 'Review-Update')[:90]}", 'meta': 'Review / Changelog', 'timestamp': ts or int(time.time()), 'time_label': format_relative_time(ts or int(time.time())), 'url': url_for('board.review', pid=project['id'])})

    items.sort(key=lambda item: item.get('timestamp', 0), reverse=True)
    return jsonify({'items': items[:10]})

@dashboard_bp.route('/search')
@login_required
def search():
    q = request.args.get('q', '').strip()
    return render('search.html', q=q, results=build_search_results(q), active_page='search')

def build_search_results(q: str):
    results = []
    if not q: return results
    ql = q.lower()
    for p in load_projects():
        if ql in p['name'].lower() or ql in p.get('description', '').lower():
            results.append({'type': 'project', 'icon': '◫', 'title': p['name'], 'subtitle': p.get('description', ''), 'url': url_for('board.board', pid=p['id'])})
        for t in p.get('tasks', []):
            if ql in t['title'].lower() or ql in t.get('description', '').lower():
                results.append({'type': 'task', 'icon': '☑', 'title': t['title'], 'subtitle': f"{p['name']} · {t['status']}", 'url': url_for('board.board', pid=p['id'])})
    return results

@dashboard_bp.route('/api/command-palette')
@login_required
def command_palette_api():
    q = request.args.get('q', '').strip()
    items = []
    static_items = [
        {'type': 'navigation', 'icon': '▣', 'title': 'Dashboard', 'subtitle': 'Übersicht öffnen', 'url': url_for('dashboard.dashboard')},
        {'type': 'navigation', 'icon': '◌', 'title': 'Dienste', 'subtitle': 'Systemd und Docker', 'url': url_for('api.services')},
        {'type': 'action', 'icon': '+', 'title': 'Neues Projekt', 'subtitle': 'Projekt anlegen', 'url': url_for('board.project_new')},
    ]
    if q:
        ql = q.lower()
        items.extend([i for i in static_items if ql in i['title'].lower() or ql in i['subtitle'].lower()])
        items.extend(build_search_results(q))
    else:
        items.extend(static_items)
        for p in load_projects()[:8]:
            items.append({'type': 'project', 'icon': '•', 'title': p['name'], 'subtitle': p.get('description', '') or p.get('status', ''), 'url': url_for('board.board', pid=p['id'])})
    return jsonify({'items': items[:20]})
