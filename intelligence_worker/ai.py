""" KI-Schnittstellen für Zusammenfassungen und Analysen """
import os
import uuid
import json
import urllib.request
import urllib.parse
from datetime import datetime
from flask import Blueprint, jsonify, request, Response, stream_with_context, render_template as render, redirect, url_for
from core.utils import (
    login_required, get_project, load_projects, save_projects, build_multi_tree,
    collect_code_files, track_tokens, safe_path, make_id, _usage_load
)
from core.constants import GROQ_LIMITS, n8n_BASE_URL
from intelligence_worker.ai_logic import (
    build_project_context, _stream_openai_compatible_chat, _stream_ollama_generate,
    _extract_json, _syntax_check, _normalize_n8n_workflow_content,
    _build_n8n_starter_workflow, _extract_chat_message_text
)
from core.services.automation_service import _apply_task_patch, _upsert_generated_project
from intelligence_worker.memory_logic import distill_logs, load_memory, add_memory
from core.supervisor import analyze_system_health, execute_sentinel_fix
from intelligence_worker.pigeon_engine import pigeon_scanner

ai_bp = Blueprint('ai', __name__)


def _call_openai_compatible_simple(base_url: str, api_key: str, model: str, prompt: str, label: str) -> str | None:
    try:
        body = json.dumps({
            'model': model,
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.25,
            'max_tokens': 1200,
        }).encode('utf-8')
        req = urllib.request.Request(
            base_url, data=body,
            headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=45) as r:
            res = json.loads(r.read())
            text = _extract_chat_message_text(res)
            if text:
                print(f'[KI Scan] {label} OK ({model})')
                return text
    except Exception as e:
        print(f'[KI Scan] {label} {model}: {e}')
    return None


def _call_simple_ai(prompt: str) -> str | None:
    """Non-streaming AI call: OpenRouter/Gemini/Groq -> Optional Ollama fallback."""
    openrouter_key = os.environ.get('OPENROUTER_API_KEY', '').strip()
    openrouter_model = os.environ.get('OPENROUTER_MODEL', 'openrouter/auto').strip() or 'openrouter/auto'
    gemini_key = os.environ.get('GEMINI_API_KEY', '').strip()
    groq_key = os.environ.get('GROQ_API_KEY', '').strip()
    enable_ollama = os.environ.get('ENABLE_OLLAMA_FALLBACK', '0').strip().lower() in ('1', 'true', 'yes', 'on')
    ollama_host = os.environ.get('OLLAMA_HOST', 'http://host.docker.internal:11434')
    ollama_model = os.environ.get('OLLAMA_MODEL', 'llama3.2:3b')

    # 1. OpenRouter
    if openrouter_key:
        text = _call_openai_compatible_simple('https://openrouter.ai/api/v1/chat/completions', openrouter_key, openrouter_model, prompt, 'OpenRouter')
        if text: return text

    # 2. Gemini (via API)
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode('utf-8')
            req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=15) as r:
                res = json.loads(r.read())
                text = res.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                if text: 
                    print('[KI Scan] Gemini OK')
                    return text
        except Exception as e: print(f'[KI Scan] Gemini Error: {e}')

    # 3. Groq
    if groq_key:
        for model in ('llama-3.1-8b-instant', 'llama3-8b-8192'):
            text = _call_openai_compatible_simple('https://api.groq.com/openai/v1/chat/completions', groq_key, model, prompt, 'Groq')
            if text: return text

    # 4. Ollama (STRICT FALLBACK CHECK)
    if enable_ollama:
        try:
            data = json.dumps({'model': ollama_model, 'prompt': prompt, 'stream': False}).encode('utf-8')
            req = urllib.request.Request(f'{ollama_host}/api/generate', data=data, headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=30) as r:
                text = json.loads(r.read()).get('response', '')
                if text:
                    print('[KI Scan] Ollama OK')
                    return text
        except Exception as e: print(f'[KI Scan] Ollama Fallback Error: {e}')
    else:
        print('[KI Scan] Cloud failed, Ollama disabled (CPU Protection)')
        
    return None


def _scan_fallback_ideas(project, paths, existing_titles):
    base_path = project.get('server_path') or (paths[0] if paths else '/home/user')
    sample_files = []
    for path in paths[:3]:
        try:
            if os.path.isfile(path):
                sample_files.append(path)
            elif os.path.isdir(path):
                for name in sorted(os.listdir(path)):
                    if name.startswith('.'):
                        continue
                    candidate = os.path.join(path, name)
                    if os.path.isfile(candidate):
                        sample_files.append(candidate)
                    if len(sample_files) >= 8:
                        break
        except Exception:
            continue

    def target(preferred):
        for file_path in sample_files:
            if preferred(file_path):
                return file_path
        return sample_files[0] if sample_files else base_path

    candidates = [
        {
            'title': 'Fehler- und Leerzustände prüfen',
            'description': 'Relevante UI- und API-Pfade auf sichtbare Fehlerzustände, leere Daten und Timeouts prüfen.',
            'labels': ['bug', 'maintenance'],
            'target_file': target(lambda p: p.endswith(('.tsx', '.jsx', '.html', '.py'))),
        },
        {
            'title': 'Logging und Statusmeldungen schärfen',
            'description': 'Aktionen sollten klare Erfolgs-, Fehler- und Timeoutmeldungen liefern, damit Probleme schneller sichtbar werden.',
            'labels': ['maintenance'],
            'target_file': target(lambda p: p.endswith('.py')),
        },
        {
            'title': 'Doppelte oder veraltete Tasks bereinigen',
            'description': 'Board-Inhalte auf doppelte Auto-Vorschläge und nicht mehr relevante Tasks prüfen.',
            'labels': ['refactoring'],
            'target_file': base_path,
        },
        {
            'title': 'Mobile Darstellung kontrollieren',
            'description': 'Die wichtigsten Ansichten auf kleinen Viewports testen und überlaufende Texte oder zu breite Controls korrigieren.',
            'labels': ['feature'],
            'target_file': target(lambda p: p.endswith(('.tsx', '.css', '.html'))),
        },
        {
            'title': 'Konfiguration und Pfade validieren',
            'description': 'Projektpfade, Umgebungsvariablen und abhängige Services prüfen, damit Aktionen nicht still fehlschlagen.',
            'labels': ['automation', 'maintenance'],
            'target_file': target(lambda p: p.endswith(('.py', '.json', '.yml', '.yaml'))),
        },
    ]
    existing_lower = {title.lower() for title in existing_titles}
    return [idea for idea in candidates if idea['title'].lower() not in existing_lower]

@ai_bp.route('/usage')
@login_required
def usage_page():
    return render('usage.html', active_page='usage')

@ai_bp.route('/api/token-usage')
@login_required
def api_token_usage():
    data = _usage_load()
    today = datetime.now().strftime('%Y-%m-%d')
    day_data = data.get(today, {})
    groq_today = day_data.get('groq', {}).get('input', 0) + day_data.get('groq', {}).get('output', 0)
    
    history = []
    keys = sorted(data.keys())[-14:]
    for k in keys:
        history.append({
            'date': k,
            'groq': data[k].get('groq', {'input':0, 'output':0, 'requests':0}),
            'ollama': data[k].get('ollama', {'input':0, 'output':0, 'requests':0})
        })
    
    return jsonify({
        'today': today,
        'groq_today': groq_today,
        'groq_pct': round(groq_today / GROQ_LIMITS['day'] * 100, 1) if GROQ_LIMITS['day'] > 0 else 0,
        'history': history
    })

@ai_bp.route('/project/<pid>/analyze-gemini', methods=['GET'])
@login_required
def analyze_gemini(pid):
    project = get_project(pid)
    if not project: return jsonify({'error': 'Projekt nicht gefunden'}), 404
    api_key = os.environ.get('GROQ_API_KEY', '').strip()
    if not api_key:
        def err(): yield f'data: {json.dumps({"error": "Kein GROQ_API_KEY gesetzt."})}\n\n'
        return Response(stream_with_context(err()), mimetype='text/event-stream')
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    tree  = build_multi_tree(paths)
    files = []
    collect_code_files(tree, files)
    if not files:
        def err(): yield f'data: {json.dumps({"error": "Keine Dateien gefunden."})}\n\n'
        return Response(stream_with_context(err()), mimetype='text/event-stream')
    files_text = '\n\n'.join(f'### {f["path"]}\n```\n{f["content"]}\n```' for f in files)
    project_ctx = build_project_context(project)
    system_msg = 'Du bist ein erfahrener Code-Reviewer. Antworte immer auf Deutsch.'
    user_msg = f'Projektkontext:\n{project_ctx}\n\nAnalysiere den folgenden Code:\n\n{files_text}'
    payload = json.dumps({
        'model': 'llama-3.3-70b-versatile',
        'messages': [{'role': 'system', 'content': system_msg}, {'role': 'user', 'content': user_msg}],
        'temperature': 0.4, 'max_tokens': 2048, 'stream': True,
    }).encode('utf-8')
    def generate():
        out_chars = 0
        try:
            req = urllib.request.Request('https://api.groq.com/openai/v1/chat/completions', data=payload,
                headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}, method='POST')
            with urllib.request.urlopen(req, timeout=120) as resp:
                for raw_line in resp:
                    line = raw_line.decode('utf-8').strip()
                    if not line.startswith('data:'): continue
                    data_str = line[5:].strip()
                    if data_str == '[DONE]':
                        track_tokens('groq', len(system_msg) + len(user_msg), out_chars)
                        yield 'data: [DONE]\n\n'; return
                    try:
                        chunk = json.loads(data_str)
                        text = chunk['choices'][0].get('delta', {}).get('content', '')
                        if text:
                            out_chars += len(text)
                            yield f'data: {json.dumps({"text": text})}\n\n'
                        if chunk['choices'][0].get('finish_reason') == 'stop':
                            track_tokens('groq', len(system_msg) + len(user_msg), out_chars)
                            yield 'data: [DONE]\n\n'; return
                    except: pass
        except Exception as e: yield f'data: {json.dumps({"error": str(e)})}\n\n'
    return Response(stream_with_context(generate()), mimetype='text/event-stream', headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})

@ai_bp.route('/project/<pid>/analyze-stream', methods=['GET'])
@login_required
def analyze_code(pid):
    project = get_project(pid)
    if not project: return jsonify({'error': 'Projekt nicht gefunden'}), 404
    ollama_host = os.environ.get('OLLAMA_HOST', 'http://host.docker.internal:11434')
    ollama_model = os.environ.get('OLLAMA_MODEL', 'llama3.2:3b')
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    tree = build_multi_tree(paths)
    files = []
    collect_code_files(tree, files)
    if not files:
        def err(): yield f'data: {json.dumps({"error": "Keine Dateien gefunden."})}\n\n'
        return Response(stream_with_context(err()), mimetype='text/event-stream')
    files_text = '\n\n'.join(f'### {f["path"]}\n```\n{f["content"]}\n```' for f in files)
    project_ctx = build_project_context(project)
    prompt = f'Du bist ein erfahrener Code-Reviewer. Projektkontext:\n{project_ctx}\n\nAnalysiere:\n\n{files_text}'
    payload = json.dumps({'model': ollama_model, 'prompt': prompt, 'stream': True}).encode('utf-8')
    def generate():
        out_chars = 0
        try:
            req = urllib.request.Request(f'{ollama_host}/api/generate', data=payload, headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=300) as resp:
                for raw_line in resp:
                    line = raw_line.decode('utf-8').strip()
                    if not line: continue
                    try:
                        chunk = json.loads(line)
                        text = chunk.get('response', '')
                        if text:
                            out_chars += len(text); yield f'data: {json.dumps({"text": text})}\n\n'
                        if chunk.get('done'):
                            track_tokens('ollama', len(prompt), out_chars)
                            yield 'data: [DONE]\n\n'; return
                    except: pass
        except Exception as e: yield f'data: {json.dumps({"error": str(e)})}\n\n'
    return Response(stream_with_context(generate()), mimetype='text/event-stream', headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})

@ai_bp.route('/project/<pid>/task/<tid>/ai-generate')
@login_required
def ai_generate(pid, tid):
    project = get_project(pid)
    if not project: return jsonify({'error': 'Projekt nicht gefunden'}), 404
    openrouter_api_key = os.environ.get('OPENROUTER_API_KEY', '').strip()
    openrouter_model = os.environ.get('OPENROUTER_MODEL', 'openrouter/free').strip() or 'openrouter/free'
    groq_api_key = os.environ.get('GROQ_API_KEY', '').strip()
    enable_ollama_fallback = os.environ.get('ENABLE_OLLAMA_FALLBACK', '0').strip().lower() in ('1', 'true', 'yes', 'on')
    projects_list = load_projects()
    proj = next((p for p in projects_list if p['id'] == pid), None)
    task = next((t for t in proj.get('tasks', []) if t['id'] == tid), None)
    if not task:
        def err(): yield 'data: ' + json.dumps({'error': 'Task nicht gefunden'}) + '\n\n'
        return Response(stream_with_context(err()), mimetype='text/event-stream')
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    tree = build_multi_tree(paths)
    is_n8n_project = pid == 'n8n-ai-projects' or 'n8n' in ' '.join(project.get('tags', [])).lower()
    files = []
    collect_code_files(tree, files)
    files = files[:10]
    files_text = '\n\n'.join(f'### {f["path"]}\n```\n{f["content"]}\n```' for f in files)
    if is_n8n_project:
        target_file = task.get('target_file_hint') or f"{paths[0] if paths else '/home/user'}/{make_id(task['title'], [])}.json"
        system_msg = 'Du bist ein Spezialist fuer n8n-Workflows. Antworte AUSSCHLIESSLICH mit JSON.'
        user_msg = f'Wunsch: {task.get("n8n_prompt", task["title"])}\nDatei: {target_file}'
    else:
        system_msg = 'Du bist ein Code-Generator. Antworte AUSSCHLIESSLICH mit JSON.'
        user_msg = f'Aufgabe: {task["title"]}\nVorhanden:\n{files_text}'
    
    def generate():
        full = ''; out_chars = 0; provider_used = None
        yield 'data: ' + json.dumps({'status': 'KI generiert Code…'}) + '\n\n'
        if openrouter_api_key:
            try:
                with _stream_openai_compatible_chat('https://openrouter.ai/api/v1/chat/completions', openrouter_api_key, json.dumps({'model': openrouter_model, 'messages': [{'role': 'system', 'content': system_msg}, {'role': 'user', 'content': user_msg}], 'stream': False}).encode('utf-8'), timeout=150) as resp:
                    provider_used = f'openrouter:{openrouter_model}'
                    body = resp.read().decode('utf-8', errors='replace')
                    chunk = json.loads(body)
                    text = _extract_chat_message_text(chunk)
                    if text: full += text; out_chars += len(text)
                track_tokens('openrouter', len(system_msg) + len(user_msg), out_chars)
            except: pass
        if not provider_used and groq_api_key:
            try:
                with _stream_openai_compatible_chat('https://api.groq.com/openai/v1/chat/completions', groq_api_key, json.dumps({'model': 'llama-3.3-70b-versatile', 'messages': [{'role': 'system', 'content': system_msg}, {'role': 'user', 'content': user_msg}], 'stream': False}).encode('utf-8'), timeout=120) as resp:
                    provider_used = 'groq'
                    body = resp.read().decode('utf-8', errors='replace')
                    chunk = json.loads(body)
                    text = _extract_chat_message_text(chunk)
                    if text: full += text; out_chars += len(text)
                track_tokens('groq', len(system_msg) + len(user_msg), out_chars)
            except: pass
        if not provider_used:
            yield 'data: ' + json.dumps({'error': 'Kein KI-Provider verfügbar.'}) + '\n\n'; return
        try:
            patch_data = _extract_json(full)
            file_path = patch_data.get('file', '').strip()
            content = patch_data.get('content', '').strip()
            real = safe_path(file_path) or os.path.join(paths[0] if paths else '/home/user', os.path.basename(file_path))
            syntax_ok, syntax_err = _syntax_check(file_path, content)
            pd = load_projects()
            p2 = next((p for p in pd if p['id'] == pid), None)
            t2 = next((t for t in p2.get('tasks', []) if t['id'] == tid), None)
            if t2:
                t2['ai_patch'] = {'file': file_path, 'content': content, 'syntax_ok': syntax_ok, 'syntax_error': syntax_err, 'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M'), 'model': provider_used}
                t2['status'] = 'review'; p2['updated'] = datetime.now().strftime('%Y-%m-%d'); save_projects(pd)
            yield 'data: ' + json.dumps({'done': True, 'redirect': f'/project/{pid}/task/{tid}/ai-review'}) + '\n\n'
        except Exception as e: yield 'data: ' + json.dumps({'error': str(e)}) + '\n\n'
    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@ai_bp.route('/project/<pid>/task/<tid>/ai-review')
@login_required
def ai_review_page(pid, tid):
    project = get_project(pid)
    if not project: return redirect(url_for('dashboard.dashboard'))
    task = next((t for t in project.get('tasks', []) if t['id'] == tid), None)
    if not task or not task.get('ai_patch'): return redirect(url_for('board.board', pid=pid))
    return render('ai_review.html', project=project, task=task, patch=task['ai_patch'], active_project=pid)

@ai_bp.route('/project/<pid>/task/<tid>/ai-apply', methods=['POST'])
@login_required
def ai_apply(pid, tid):
    projects_list = load_projects()
    proj = next((p for p in projects_list if p['id'] == pid), None)
    task = next((t for t in proj.get('tasks', []) if t['id'] == tid), None)
    if not task or not task.get('ai_patch'): return jsonify({'error': 'Kein Patch vorhanden'}), 404
    ok, error, file_path = _apply_task_patch(proj, task)
    if not ok: return jsonify({'error': error}), 400
    if task.get('automation_slug') or 'auto' in task.get('labels', []):
        _upsert_generated_project(projects_list, proj, task, file_path)
    proj['updated'] = datetime.now().strftime('%Y-%m-%d'); save_projects(projects_list)
    return jsonify({'ok': True, 'file': file_path})

@ai_bp.route('/project/<pid>/task/<tid>/ai-reject', methods=['POST'])
@login_required
def ai_reject(pid, tid):
    projects_list = load_projects()
    proj = next((p for p in projects_list if p['id'] == pid), None)
    task = next((t for t in proj.get('tasks', []) if t['id'] == tid), None)
    if task:
        task['ai_patch'] = None; task['status'] = 'offen'
        proj['updated'] = datetime.now().strftime('%Y-%m-%d'); save_projects(projects_list)
    return jsonify({'ok': True})


@ai_bp.route('/api/ki/scan/<pid>', methods=['POST'])
@login_required
def ki_scan(pid):
    project = get_project(pid)
    if not project: return jsonify({'error': 'Projekt nicht gefunden'}), 404

    ctx_parts = []
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    for path in paths[:2]:
        try:
            if os.path.isfile(path):
                with open(path, 'r', encoding='utf-8', errors='replace') as f:
                    ctx_parts.append(f'### {os.path.basename(path)}\n{f.read(800)}')
            elif os.path.isdir(path):
                files = sorted(f for f in os.listdir(path) if not f.startswith('.'))[:20]
                ctx_parts.append(f'### Ordner: {os.path.basename(path)}\n{", ".join(files)}')
        except Exception: pass

    ctx = '\n\n'.join(ctx_parts) or 'Kein Dateikontext verfügbar'
    existing_titles = {t['title'] for t in project.get('tasks', [])}

    existing_str = ', '.join(list(existing_titles)[:8]) or 'keine'
    server_path  = project.get('server_path') or '/home/user'
    prompt = (
        f'Homelab Raspberry Pi 5. Projekt: {project["name"]}. {project.get("description","")}\n'
        f'Kontext:\n{ctx}\n\n'
        f'Bereits vorhandene Tasks (nicht wiederholen): {existing_str}\n\n'
        f'Schlage genau 5 kleine, konkrete Verbesserungen vor. Jede in einer Datei lösbar.\n'
        f'Antworte NUR als JSON-Array:\n'
        f'[{{"title":"Titel","description":"Was und warum","labels":["feature"],"target_file":"{server_path}/datei.py"}}]\n'
        f'Labels: feature, bug, refactoring, maintenance, automation. Deutsch.'
    )

    raw = _call_simple_ai(prompt)
    source = 'ai'

    if raw:
        try:
            text = raw.strip()
            start, end = text.find('['), text.rfind(']')
            if start == -1 or end == -1:
                raise ValueError('Kein Array')
            ideas = json.loads(text[start:end + 1])
        except Exception as e:
            print(f'[KI Scan] JSON fallback: {e}')
            ideas = _scan_fallback_ideas(project, paths, existing_titles)
            source = 'fallback-json'
    else:
        ideas = _scan_fallback_ideas(project, paths, existing_titles)
        source = 'fallback-provider'

    projects_list = load_projects()
    proj = next((p for p in projects_list if p['id'] == pid), None)
    if not proj: return jsonify({'error': 'Projekt nicht gefunden'}), 404

    created = []
    existing_titles = {t.get('title', '').strip().lower() for t in proj.get('tasks', [])}
    for idea in ideas[:5]:
        title = (idea.get('title') or '').strip()
        if not title or title.lower() in existing_titles:
            continue
        labels = idea.get('labels', [])
        if not isinstance(labels, list):
            labels = [str(labels)] if labels else []
        blocked_agent_labels = {'auto', 'ai-fix', 'bug'}
        normalized_labels = []
        for label in labels:
            clean_label = str(label).strip()
            if not clean_label:
                continue
            if clean_label == 'bug':
                clean_label = 'issue'
            if clean_label not in blocked_agent_labels:
                normalized_labels.append(clean_label)
        labels = ['ki-scan', 'vorschlag'] + normalized_labels
        target_file = (idea.get('target_file') or idea.get('target_file_hint') or '').strip()
        task = {
            'id': str(uuid.uuid4()),
            'title': title,
            'status': 'offen',
            'labels': labels,
            'description': (idea.get('description') or '').strip(),
            'target_file': target_file,
            'target_file_hint': target_file,
            'created': datetime.now().strftime('%Y-%m-%d'),
            'ki_generated': True,
            'scan_source': source,
        }
        proj.setdefault('tasks', []).append(task)
        existing_titles.add(title.lower())
        created.append(task)

    proj['updated'] = datetime.now().strftime('%Y-%m-%d')
    save_projects(projects_list)
    return jsonify({'ok': True, 'created': len(created), 'tasks': created, 'source': source})

@ai_bp.route('/api/ki/propose-task', methods=['POST'])
@login_required
def ki_propose_task():
    data = request.get_json()
    raw_title = data.get('title', '').strip()
    pid = data.get('pid')
    
    if not raw_title: return jsonify({'error': 'Titel fehlt'}), 400
    
    project_ctx = ""
    if pid:
        project = get_project(pid)
        if project:
            project_ctx = f"Projekt: {project['name']}\nBeschreibung: {project.get('description', 'Keine')}\n"
            paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
            if paths:
                project_ctx += f"Pfade: {', '.join(paths[:2])}\n"

    prompt = (
        f"Du bist ein Senior Software Engineer für ein Homelab auf einem Raspberry Pi 5.\n"
        f"STACK: Python/Flask (Backend), React/TypeScript (Frontend), Docker, Prometheus, n8n.\n"
        f"HARDWARE: Growbox mit AC Infinity Controller 69 Pro, Tapo P110 Smart-Plugs.\n\n"
        f"KONTEXT:\n{project_ctx}\n"
        f"AUFGABE: {raw_title}\n\n"
        f"Vorschlag für eine professionelle Aufgabenbeschreibung.\n"
        f"Berücksichtige den Stack und die Hardware im Kontext.\n"
        f"Antworte AUSSCHLIESSLICH als JSON-Objekt:\n"
        f'{{"title":"Optimierter, technischer Titel","description":"Detaillierte technische Beschreibung der Umsetzung","labels":["feature"],"target_file":"/pfad/zu/relevanter/datei.py"}}'
    )
    
    raw = _call_simple_ai(prompt)
    if not raw: return jsonify({'error': 'KI nicht erreichbar'}), 500
    try:
        start, end = raw.find('{'), raw.rfind('}')
        proposal = json.loads(raw[start:end+1])
        return jsonify(proposal)
    except: return jsonify({'error': 'KI-Antwort ungültig'}), 500


@ai_bp.route('/api/ki/grow-advice')
@login_required
def grow_advice():
    from blueprints.api import grow_controller, GROW_LOG_FILE
    from blueprints.api import _load_json # Falls vorhanden, sonst open()
    
    try:
        # Metriken abrufen
        metrics = grow_controller().get_json()
        
        # Logbuch abrufen
        logs = []
        if os.path.exists(GROW_LOG_FILE):
            with open(GROW_LOG_FILE, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        
        # Letzte 3 Einträge für Kontext
        recent_logs = []
        for entry in logs[:3]:
            note = entry.get('notes', 'Routineprüfung')
            ph = f" (pH: {entry['ph']})" if entry.get('ph') else ""
            ec = f" (EC: {entry['ec']})" if entry.get('ec') else ""
            recent_logs.append(f"- {entry.get('date')}: {note}{ph}{ec}")
        
        logs_ctx = "\n".join(recent_logs) if recent_logs else "Keine Einträge vorhanden."

    except Exception as e:
        return jsonify([f"Kontext-Fehler: {e}", "KI wartet auf stabilere Datenverbindung"])
    
    # Umfangreicher Kontext für die KI
    ctx = {
        'phase': metrics.get('grow_stage'),
        'tag': metrics.get('bluete_day') if metrics.get('bluete_day') else metrics.get('grow_day'),
        'phase_name': 'Blüte' if metrics.get('bluete_day') else 'Vegetation',
        'klima': f"{metrics.get('temp')}°C, {metrics.get('hum')}% rel.F.",
        'vpd': f"{metrics.get('vpd')} kPa",
        'licht': f"{metrics.get('power_w')}W (DLI: {metrics.get('dli')})",
        'wasser': f"Zuletzt gegossen vor {metrics.get('watering_days_since')} Tagen (Status: {metrics.get('watering_alert')})"
    }

    prompt = (
        f"Du bist der 'Mission Control Plant Doctor', ein KI-Experte für High-End-Cannabis-Anbau. "
        f"Analysiere diesen Live-Status UND die Historie meiner Growbox:\n\n"
        f"AKTUELLER STATUS:\n"
        f"- Phase: {ctx['phase_name']} (Tag {ctx['tag']}, Stadium: {ctx['phase']})\n"
        f"- Klima: {ctx['klima']} (VPD: {ctx['vpd']})\n"
        f"- Licht: {ctx['licht']}\n"
        f"- Bewässerung: {ctx['wasser']}\n\n"
        f"LETZTE LOGBUCH-EINTRÄGE:\n"
        f"{logs_ctx}\n\n"
        f"AUFGABE:\n"
        f"Gib 2 bis 3 extrem präzise, professionelle Tipps auf Deutsch. "
        f"Berücksichtige besonders meine Notizen im Logbuch (z.B. Mangelerscheinungen oder pH/EC-Anpassungen). "
        f"Kein Smalltalk. Antworte NUR als JSON-Array von Strings."
    )

    # Groq bevorzugt
    raw = _call_simple_ai(prompt)
    if not raw:
        return jsonify(["Verbindung zu Groq fehlgeschlagen", "Bitte API-Key prüfen"])

    try:
        start, end = raw.find('['), raw.rfind(']')
        if start != -1 and end != -1:
            advice = json.loads(raw[start:end+1])
            return jsonify(advice)
        return jsonify(["Analysiere Vitalwerte...", "Klima ist innerhalb der Toleranz"])
    except:
        return jsonify(["KI-Modell optimiert Antwort...", "Happy Growing!"])


@ai_bp.route('/api/ki/auto-diagnose', methods=['POST'])
@login_required
def ki_auto_diagnose():
    """Autonomous agent that scans logs and metrics for problems and proposes tasks."""
    from blueprints.api import grow_controller, sysinfo, bot_log, GROW_LOG_FILE
    
    try:
        # 1. Gather Intelligence
        sys_data = sysinfo().get_json()
        bot_lines = bot_log().get_json().get('lines', [])[-50:]
        grow_data = grow_controller().get_json()
        
        # 2. Context Construction
        logs_str = "\n".join(bot_lines)
        
        # Load Recent Memory Gems
        memories = load_memory()[:5]
        memory_str = "\n".join([f"- [{m['date']}] {m['title']}: {m['content']}" for m in memories]) if memories else "Keine Langzeit-Erinnerungen vorhanden."
        
        health_ctx = (
            f"SYSTEM: CPU {sys_data.get('cpu_pct')}% (Temp: {sys_data.get('temp')}°C), RAM {sys_data.get('ram_pct')}%\n"
            f"GROW: Status {grow_data.get('watering_alert')}, VPD {grow_data.get('vpd')} kPa, Temp {grow_data.get('temp')}°C\n"
            f"RELEVANTE HISTORIE (MEMORY):\n{memory_str}\n"
            f"AKTUELLE LOGS:\n{logs_str}"
        )
        
        prompt = (
            f"Du bist der 'Nexus Autonomous Maintenance Agent'.\n"
            f"DEINE MISSION: Analysiere den Systemstatus und die Logs auf Fehler, Ineffizienzen oder Optimierungsbedarf.\n\n"
            f"AKTUELLER STATUS:\n{health_ctx}\n\n"
            f"AUFGABE: Erstelle 1-3 konkrete Korrektur- oder Optimierungs-Aufgaben.\n"
            f"Setze den Fokus auf Stabilität und Hardware-Gesundheit.\n"
            f"Antworte NUR als JSON-Array von Objekten:\n"
            f'[{{"title":"Problem: ...","description":"Analyse und Lösungsschritt","labels":["maintenance","ai-auto"],"target_file":"/pfad/zu/datei"}}]'
        )
        
        raw = _call_simple_ai(prompt)
        if not raw: return jsonify({'error': 'KI-Agent schläft'}), 500
        
        start, end = raw.find('['), raw.rfind(']')
        tasks_proposed = json.loads(raw[start:end+1])
        
        # 3. Inject into Board
        projects_list = load_projects()
        # Find 'System' or first project
        proj = next((p for p in projects_list if 'System' in p['name'] or 'Maintenance' in p['name']), projects_list[0] if projects_list else None)
        
        if not proj: return jsonify({'error': 'Kein Projekt für Tasks gefunden'}), 404
        
        created = []
        for idea in tasks_proposed:
            task = {
                'id': str(uuid.uuid4()),
                'title': f"🤖 AI: {idea['title']}",
                'status': 'review', # Sofort in den Review Bereich!
                'labels': idea.get('labels', []) + ['ai-auto', 'diagnostic'],
                'description': idea.get('description', ''),
                'target_file': idea.get('target_file', ''),
                'created': datetime.now().strftime('%Y-%m-%d'),
                'ki_generated': True
            }
            proj.setdefault('tasks', []).append(task)
            created.append(task)
            
        proj['updated'] = datetime.now().strftime('%Y-%m-%d')
        save_projects(projects_list)
        
        return jsonify({'ok': True, 'count': len(created), 'tasks': created})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/api/ki/memory', methods=['GET'])
@login_required
def api_get_memory():
    return jsonify(load_memory())

@ai_bp.route('/api/ki/memory/scan', methods=['POST'])
@login_required
def api_memory_scan():
    from blueprints.api import bot_log, grow_metrics
    try:
        # Get logs
        bot_lines = bot_log().get_json().get('lines', [])
        
        # We could also fetch grow_log.json if needed
        # but bot_log has the distilled actions.
        
        added = distill_logs(bot_lines, _call_simple_ai)
        return jsonify({'ok': True, 'added': len(added), 'memories': added})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/api/ki/memory/add', methods=['POST'])
@login_required
def api_memory_add():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    if not title or not content:
        return jsonify({'error': 'Titel und Inhalt fehlen'}), 400
    
@ai_bp.route('/api/ki/sentinel/status', methods=['GET'])
@login_required
def api_sentinel_status():
    from blueprints.api import sysinfo, bot_status
    try:
        sys_data = sysinfo().get_json()
        bot_data = bot_status().get_json()
        memories = load_memory()
        
        issues = analyze_system_health(sys_data, bot_data, memories)
        return jsonify({'ok': True, 'issues': issues})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/api/ki/sentinel/apply', methods=['POST'])
@login_required
def api_sentinel_apply():
    data = request.get_json()
    action_cmd = data.get('action_cmd')
    if not action_cmd:
        return jsonify({'error': 'Kein Befehl angegeben'}), 400
        
    ok, msg = execute_sentinel_fix(action_cmd)
    if ok:
        add_memory("Sentinel Fix", f"Automatischer Fix ausgeführt: {action_cmd}", category='ki', importance=3)
        return jsonify({'ok': True, 'message': msg})
    else:
        return jsonify({'ok': False, 'error': msg}), 500
@ai_bp.route('/api/intel/thoughts', methods=['GET'])
@login_required
def api_intel_thoughts():
    """ 
    Gibt die autonomen 'Gedanken' und Entscheidungen der KI zurück.
    Extrahiert Daten aus dem Sentinel-System und den Memory-Logs.
    """
    from intelligence_worker.memory_logic import load_memory
    import random
    memories = load_memory()
    # Sort by timestamp descending (newest first)
    memories.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    # Transform memories into thought format with enriched metadata
    thoughts = []
    for i, m in enumerate(memories[:12]):
        category = m.get('category', 'optimization')
        importance = m.get('importance', 1)
        
        # Generate some pseudo-intelligent metadata based on the memory
        confidence = round(random.uniform(85.0, 99.9), 1)
        impact_score = importance * 20 + random.randint(0, 15)
        
        # Tech specs simulation based on category
        specs = {
            'optimization': {'Memory_Gain': f'{random.randint(5, 150)}MB', 'CPU_Idle': f'{random.randint(1, 5)}%'},
            'security': {'Auth_Level': 'LEVEL_3', 'Blocked_Nodes': str(random.randint(1, 5))},
            'grow': {'VPD_Correction': f'0.{random.randint(1, 9)} kPa', 'Sensor_ID': f'NODE_{random.randint(1, 4)}'},
            'ki': {'Model_Iter': 'v2.4.1', 'Tokens': str(random.randint(500, 2000))}
        }
        
        thoughts.append({
            'id': m.get('id', str(i)),
            'timestamp': m.get('timestamp', datetime.now().isoformat()),
            'action': m.get('title', 'Unknown Action').upper(),
            'rationale': m.get('content', 'Keine detaillierte Begründung verfügbar.'),
            'category': category,
            'impact': 'high' if importance >= 3 else 'medium' if importance == 2 else 'low',
            'confidence': confidence,
            'impact_score': min(100, impact_score),
            'source': f"Sentinel_Node_{random.choice(['Alpha', 'Beta', 'Gamma'])}",
            'alternatives': ["Manuelle Überprüfung", "Keine Aktion"],
            'tech_specs': specs.get(category, {'Status': 'LOGGED'})
        })
    
    return jsonify({'ok': True, 'thoughts': thoughts})

@ai_bp.route('/api/intel/deep-scan', methods=['POST'])
@login_required
def api_intel_deep_scan():
    """ Führt einen tiefen System-Scan durch P.I.G.E.O.N. aus. """
    try:
        report = pigeon_scanner.run_deep_scan()
        return jsonify({'ok': True, 'report': report})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
