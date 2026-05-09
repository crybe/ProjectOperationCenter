import uuid
import os
import time
from datetime import datetime
from flask import Blueprint, render_template as render, request, redirect, url_for, jsonify
from core.utils import (
    login_required, load_projects, save_projects, get_project, make_id,
    collect_recent_files, format_relative_time
)
from core.services.automation_service import auto_seed_automation_tasks, _handle_task_status_change, _upsert_generated_project
from core.constants import COLUMNS

board_bp = Blueprint('board', __name__)

@board_bp.route('/project/<pid>/board')
@login_required
def board(pid):
    projects = load_projects()
    auto_seed_automation_tasks(projects)
    project = get_project(pid)
    if not project: return redirect(url_for('dashboard.dashboard'))
    tasks_by_col = {c: [t for t in project.get('tasks', []) if t['status'] == c] for c in COLUMNS}
    active_page = 'n8n-ai' if pid == 'n8n-ai-projects' else ('automation' if pid == 'automatisierungen' else None)
    return render('board.html', project=project, tasks_by_col=tasks_by_col, columns=COLUMNS, active_project=pid, active_page=active_page)

@board_bp.route('/project/<pid>/task/add', methods=['POST'])
@login_required
def task_add(pid):
    data = request.get_json()
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project: return jsonify({'error': 'Projekt nicht gefunden'}), 404
    task = {
        'id': str(uuid.uuid4()),
        'title': data.get('title', 'Neue Aufgabe').strip() or 'Neue Aufgabe',
        'status': data.get('status', 'offen'),
        'labels': [l.strip() for l in data.get('labels', '').split(',') if l.strip()],
        'description': data.get('description', '').strip(),
        'created': datetime.now().strftime('%Y-%m-%d'),
    }
    project.setdefault('tasks', []).append(task)
    project['updated'] = datetime.now().strftime('%Y-%m-%d')
    save_projects(projects)
    return jsonify(task)

@board_bp.route('/project/<pid>/task/<tid>/move', methods=['POST'])
@login_required
def task_move(pid, tid):
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in COLUMNS: return jsonify({'error': 'Ungültiger Status'}), 400
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project: return jsonify({'error': 'Projekt nicht gefunden'}), 404
    task = next((t for t in project.get('tasks', []) if t['id'] == tid), None)
    if not task: return jsonify({'error': 'Task nicht gefunden'}), 404
    ok, error, file_path = _handle_task_status_change(project, task, new_status)
    project['updated'] = datetime.now().strftime('%Y-%m-%d')
    if ok and file_path and 'auto' in task.get('labels', []):
        _upsert_generated_project(projects, project, task, file_path)
    save_projects(projects)
    if not ok: return jsonify({'error': error, 'task': task}), 400
    return jsonify({'ok': True, 'task': task, 'applied_file': file_path})

@board_bp.route('/project/<pid>/task/<tid>/edit', methods=['POST'])
@login_required
def task_edit(pid, tid):
    data = request.get_json()
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project: return jsonify({'error': 'Nicht gefunden'}), 404
    task = next((t for t in project.get('tasks', []) if t['id'] == tid), None)
    if not task: return jsonify({'error': 'Task nicht gefunden'}), 404

    if data.get('title', '').strip(): task['title'] = data['title'].strip()
    if 'labels' in data: task['labels'] = [l.strip() for l in data['labels'].split(',') if l.strip()]
    if 'description' in data: task['description'] = data['description'].strip()
    if 'due_date' in data: task['due_date'] = data['due_date'].strip()
    
    # Fortschritts-Felder
    if 'progress' in data:
        try: task['progress'] = int(data['progress'])
        except: pass
    if 'eta' in data: task['eta'] = data['eta'].strip()
    if 'current_step' in data: task['current_step'] = data['current_step'].strip()
    if 'subtasks' in data: task['subtasks'] = data['subtasks']

    if data.get('status') in COLUMNS:
        ok, error, _ = _handle_task_status_change(project, task, data['status'])
        if not ok:
            save_projects(projects)
            return jsonify({'error': error, 'task': task}), 400
    project['updated'] = datetime.now().strftime('%Y-%m-%d')
    save_projects(projects)
    return jsonify({'ok': True, 'task': task})

@board_bp.route('/project/<pid>/task/<tid>/delete', methods=['POST'])
@login_required
def task_delete(pid, tid):
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if project:
        project['tasks'] = [t for t in project.get('tasks', []) if t['id'] != tid]
        save_projects(projects)
    return jsonify({'ok': True})

@board_bp.route('/project/new', methods=['GET', 'POST'])
@login_required
def project_new():
    if request.method == 'POST':
        projects = load_projects()
        name = request.form.get('name', 'Neues Projekt').strip()
        pid = make_id(name, [p['id'] for p in projects])
        project = {
            'id': pid, 'name': name, 'description': request.form.get('description', '').strip(),
            'status': request.form.get('status', 'active'), 'server_path': request.form.get('server_path', '').strip(),
            'git_repo': request.form.get('git_repo', '').strip(),
            'tags': [t.strip() for t in request.form.get('tags', '').split(',') if t.strip()],
            'created': datetime.now().strftime('%Y-%m-%d'), 'updated': datetime.now().strftime('%Y-%m-%d'),
            'tasks': [], 'changelog': [], 'notes_list': [],
        }
        projects.append(project)
        save_projects(projects)
        return redirect(url_for('board.board', pid=pid))
    return render('project_form.html', project=None)

@board_bp.route('/project/<pid>/edit', methods=['GET', 'POST'])
@login_required
def project_edit(pid):
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project: return redirect(url_for('dashboard.dashboard'))
    if request.method == 'POST':
        project['name'] = request.form.get('name', project['name']).strip()
        project['description'] = request.form.get('description', '').strip()
        project['status'] = request.form.get('status', 'active')
        project['server_path'] = request.form.get('server_path', '').strip()
        project['git_repo'] = request.form.get('git_repo', '').strip()
        project['tags'] = [t.strip() for t in request.form.get('tags', '').split(',') if t.strip()]
        project['updated'] = datetime.now().strftime('%Y-%m-%d')
        save_projects(projects)
        return redirect(url_for('board.board', pid=pid))
    return render('project_form.html', project=project, active_project=pid)

@board_bp.route('/project/<pid>/delete', methods=['POST'])
@login_required
def project_delete(pid):
    projects = [p for p in load_projects() if p['id'] != pid]
    save_projects(projects)
    return redirect(url_for('dashboard.dashboard'))

@board_bp.route('/project/<pid>/notes', methods=['GET', 'POST'])
@login_required
def project_notes(pid):
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project: return redirect(url_for('dashboard.dashboard'))
    if request.method == 'POST':
        content = request.form.get('content', '').strip()
        if content:
            note = {'id': str(uuid.uuid4()), 'content': content, 'created': datetime.now().strftime('%Y-%m-%d %H:%M')}
            project.setdefault('notes_list', []).insert(0, note)
            project['updated'] = datetime.now().strftime('%Y-%m-%d')
            save_projects(projects)
        return redirect(url_for('board.project_notes', pid=pid))
    return render('notes.html', project=project, active_project=pid)

@board_bp.route('/project/<pid>/notes/<nid>/delete', methods=['POST'])
@login_required
def project_note_delete(pid, nid):
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if project:
        project['notes_list'] = [n for n in project.get('notes_list', []) if n['id'] != nid]
        save_projects(projects)
    return redirect(url_for('board.project_notes', pid=pid))

@board_bp.route('/project/<pid>/api/notes', methods=['POST'])
@login_required
def note_add_api(pid):
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Inhalt fehlt'}), 400
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project:
        return jsonify({'error': 'Nicht gefunden'}), 404
    note = {
        'id': str(uuid.uuid4()),
        'content': content,
        'author': data.get('author', 'admin').strip() or 'admin',
        'created': datetime.now().strftime('%Y-%m-%d %H:%M'),
    }
    project.setdefault('notes_list', []).insert(0, note)
    project['updated'] = datetime.now().strftime('%Y-%m-%d')
    save_projects(projects)
    return jsonify({'ok': True, 'note': note})

@board_bp.route('/project/<pid>/api/notes/<nid>', methods=['PATCH'])
@login_required
def note_update_api(pid, nid):
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Inhalt fehlt'}), 400
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project:
        return jsonify({'error': 'Nicht gefunden'}), 404
    note = next((n for n in project.get('notes_list', []) if n['id'] == nid), None)
    if not note:
        return jsonify({'error': 'Notiz nicht gefunden'}), 404
    note['content'] = content
    note['updated'] = datetime.now().strftime('%Y-%m-%d %H:%M')
    save_projects(projects)
    return jsonify({'ok': True})

@board_bp.route('/project/<pid>/api/notes/<nid>', methods=['DELETE'])
@login_required
def note_delete_api(pid, nid):
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if not project:
        return jsonify({'error': 'Nicht gefunden'}), 404
    before = len(project.get('notes_list', []))
    project['notes_list'] = [n for n in project.get('notes_list', []) if n['id'] != nid]
    if len(project['notes_list']) < before:
        save_projects(projects)
    return jsonify({'ok': True})

@board_bp.route('/project/<pid>/activity')
@login_required
def project_activity(pid):
    project = get_project(pid)
    if not project: return redirect(url_for('dashboard.dashboard'))
    return render('activity.html', project=project, active_project=pid)

@board_bp.route('/project/<pid>/activity/log')
@login_required
def activity_log(pid):
    project = get_project(pid)
    if not project: return jsonify({'lines': []})
    log_path = '/app/logs/aktionen.log'
    lines = []
    try:
        with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
            all_lines = f.readlines()
        pname = project['name'].lower()
        for l in reversed(all_lines):
            if pname in l.lower(): lines.append(l.strip())
            if len(lines) >= 100: break
    except Exception: pass
    return jsonify({'lines': lines})

@board_bp.route('/project/<pid>/activity/files')
@login_required
def activity_files(pid):
    project = get_project(pid)
    if not project: return jsonify({'files': []})
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    cutoff = time.time() - 86400 * 7
    recent = collect_recent_files(paths, cutoff, limit=30)
    for r in recent: r['time_label'] = format_relative_time(r['mtime'])
    return jsonify({'files': recent})

@board_bp.route('/project/<pid>/changelog/add', methods=['POST'])
@login_required
def changelog_add(pid):
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if project:
        project.setdefault('changelog', []).insert(0, {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'version': request.form.get('version', '').strip(),
            'changes': request.form.get('changes', '').strip(),
        })
        save_projects(projects)
    return redirect(url_for('board.review', pid=pid) + '#changelog')

@board_bp.route('/project/<pid>/changelog/<int:idx>/delete', methods=['POST'])
@login_required
def changelog_delete(pid, idx):
    projects = load_projects()
    project = next((p for p in projects if p['id'] == pid), None)
    if project and 0 <= idx < len(project.get('changelog', [])):
        project['changelog'].pop(idx)
        save_projects(projects)
    return redirect(url_for('board.review', pid=pid) + '#changelog')

@board_bp.route('/project/<pid>/review')
@login_required
def review(pid):
    project = get_project(pid)
    if not project: return redirect(url_for('dashboard.dashboard'))
    return render('review.html', project=project, active_project=pid)
