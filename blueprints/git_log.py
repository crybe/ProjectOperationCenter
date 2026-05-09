""" Anzeige von Git-Commits und Repository-Status """
import subprocess
import json
import os
from datetime import datetime
from flask import Blueprint, jsonify, request
from core.utils import login_required, load_projects

git_log_bp = Blueprint('git_log', __name__)

_REPO = '/app'


def _git(*args, timeout=15):
    result = subprocess.run(
        ['git'] + list(args),
        cwd=_REPO, capture_output=True, text=True, timeout=timeout
    )
    return result.stdout.strip(), result.returncode


def _projects_file():
    return os.path.join(_REPO, 'data', 'projects.json')


def _save_projects(projects):
    with open(_projects_file(), 'w') as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)


@git_log_bp.route('/api/git/log')
@login_required
def api_git_log():
    out, code = _git('log', '--format=%H|%s|%ai|%an', '-30')
    if code != 0:
        return jsonify({'ok': False, 'error': 'git log fehlgeschlagen'})

    commits = []
    for line in out.splitlines():
        if '|' not in line:
            continue
        parts = line.split('|', 3)
        hash_, subject, date, author = parts
        commits.append({
            'hash': hash_,
            'short': hash_[:8],
            'subject': subject,
            'date': date[:16].replace('T', ' '),
            'author': author,
        })

    # Welche Commits haben bereits ein Projekt?
    projects = load_projects()
    existing_ids = {p['id'] for p in projects}

    for c in commits:
        c['has_project'] = f"git-{c['short']}" in existing_ids

    return jsonify({'ok': True, 'commits': commits})


@git_log_bp.route('/api/git/diff/<commit_hash>')
@login_required
def api_git_diff(commit_hash):
    # Sicherheit: nur hex-Zeichen erlauben
    if not all(c in '0123456789abcdefABCDEF' for c in commit_hash):
        return jsonify({'ok': False, 'error': 'Ungültiger Hash'}), 400

    # Dateien die sich geändert haben
    files_out, _ = _git('diff', f'{commit_hash}~1', commit_hash, '--name-only')
    if not files_out:
        # Erster Commit hat keinen Parent → git show nutzen
        files_out, _ = _git('show', '--name-only', '--format=', commit_hash)

    files = [f for f in files_out.splitlines() if f]

    # Vollständiger Diff (max. 8000 Zeichen um Payload klein zu halten)
    diff_out, _ = _git('diff', f'{commit_hash}~1', commit_hash)
    if not diff_out:
        diff_out, _ = _git('show', commit_hash)

    return jsonify({
        'ok': True,
        'files': files,
        'diff': diff_out[:8000],
        'truncated': len(diff_out) > 8000,
    })


@git_log_bp.route('/api/git/create-project', methods=['POST'])
@login_required
def api_git_create_project():
    data = request.json or {}
    commit_hash = data.get('hash', '')
    short = commit_hash[:8]

    if not all(c in '0123456789abcdefABCDEF' for c in commit_hash):
        return jsonify({'ok': False, 'error': 'Ungültiger Hash'}), 400

    project_id = f'git-{short}'
    projects = load_projects()

    if any(p['id'] == project_id for p in projects):
        return jsonify({'ok': True, 'project_id': project_id, 'existed': True})

    files = data.get('files', [])
    diff  = data.get('diff', '')
    subject = data.get('subject', f'Server-Änderung {short}')
    date    = data.get('date', datetime.now().isoformat())

    tasks = [
        {
            'id': f'{project_id}-f{i}',
            'title': f'Geändert: {f}',
            'status': 'erledigt',
            'labels': ['server-change'],
            'description': '',
            'due_date': '',
            'created': date,
            'automation_slug': '',
            'ai_applied': '',
            'ai_patch': None,
        }
        for i, f in enumerate(files)
    ]

    project = {
        'id': project_id,
        'name': subject,
        'description': f'Auto-Commit {short} · {date[:10]}',
        'status': 'erledigt',
        'git_repo': _REPO,
        'tags': ['server-change', 'auto'],
        'file_paths': files,
        'tasks': tasks,
        'changelog': [{'date': date[:10], 'version': short, 'changes': diff[:1000]}],
        'notes_list': [],
        'created': date,
        'updated': date,
    }

    projects.insert(0, project)
    _save_projects(projects)

    return jsonify({'ok': True, 'project_id': project_id, 'existed': False})
