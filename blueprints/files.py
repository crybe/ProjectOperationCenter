""" Dateimanagement und Editor-Funktionen """
import os
import subprocess
from flask import Blueprint, render_template as render, request, jsonify, redirect, url_for
from markupsafe import Markup, escape
from core.utils import login_required, get_project, build_multi_tree, mtime_hash, safe_path
from core.constants import LANG_MAP, ALLOWED_EXTENSIONS, FILE_ICONS

files_bp = Blueprint('files', __name__)

def render_tree_html(nodes, depth=0):
    hidden = ' style="display:none;"' if depth > 0 else ''
    html = f'<ul class="tree-list"{hidden}>'
    for node in nodes:
        name_e = escape(node['name'])
        path_e = escape(node['path'])
        path_j = node['path'].replace("'", "\\'")
        name_j = node['name'].replace("'", "\\'")
        if node['is_dir']:
            children_html = render_tree_html(node.get('children', []), depth + 1)
            icon = '📂' if depth == 0 else '📁'
            html += (f'<li class="tree-item tree-dir" data-path="{path_e}">'
                     f'<span class="tree-row" onclick="toggleDir(this)">'
                     f'<span class="tree-icon">{icon}</span>'
                     f'<span class="tree-name">{name_e}</span></span>'
                     f'{children_html}</li>')
        else:
            ext = node['name'].rsplit('.', 1)[-1].lower() if '.' in node['name'] else ''
            icon = FILE_ICONS.get(ext, '📄')
            html += (f'<li class="tree-item tree-file" data-path="{path_e}">'
                     f'<span class="tree-row" onclick="loadFile(\'{path_j}\',\'{name_j}\')">'
                     f'<span class="tree-icon">{icon}</span>'
                     f'<span class="tree-name">{name_e}</span></span></li>')
    html += '</ul>'
    return Markup(html)

@files_bp.route('/project/<pid>/files')
@login_required
def files(pid):
    project = get_project(pid)
    if not project: return redirect(url_for('dashboard.dashboard'))
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    tree = build_multi_tree(paths)
    return render('files.html', project=project, tree_html=render_tree_html(tree),
                  file_paths=paths, active_project=pid)

@files_bp.route('/project/<pid>/files/tree')
@login_required
def files_tree(pid):
    project = get_project(pid)
    if not project: return ''
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    tree = build_multi_tree(paths)
    return str(render_tree_html(tree))

@files_bp.route('/project/<pid>/files/mtime')
@login_required
def files_mtime(pid):
    project = get_project(pid)
    if not project: return jsonify({'hash': ''})
    paths = project.get('file_paths') or ([project['server_path']] if project.get('server_path') else [])
    return jsonify({'hash': mtime_hash(paths)})

@files_bp.route('/project/<pid>/files/content')
@login_required
def file_content(pid):
    raw = request.args.get('path', '')
    real = safe_path(raw)
    if not real or not os.path.isfile(real):
        return jsonify({'error': 'Nicht gefunden'}), 404
    try:
        with open(real, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    ext = os.path.splitext(real)[1].lower()
    return jsonify({'content': content, 'lang': LANG_MAP.get(ext, 'text'), 'name': os.path.basename(real)})

@files_bp.route('/project/<pid>/files/save', methods=['POST'])
@login_required
def file_save(pid):
    project = get_project(pid)
    if not project: return jsonify({'error': 'Projekt nicht gefunden'}), 404
    data = request.get_json()
    raw = data.get('path', '')
    real = safe_path(raw)
    if not real or not os.path.isfile(real):
        return jsonify({'error': 'Datei nicht gefunden oder nicht erlaubt'}), 404
    ext = os.path.splitext(real)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': 'Dateityp nicht unterstützt'}), 403
    try:
        with open(real, 'w', encoding='utf-8') as f:
            f.write(data.get('content', ''))
        return jsonify({'ok': True})
    except PermissionError:
        return jsonify({'error': 'Keine Schreibberechtigung (Volume :ro?)'}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/project/<pid>/diff/<commit_hash>')
@login_required
def show_diff(pid, commit_hash):
    project = get_project(pid)
    if not project or not project.get('git_repo'): return "Kein Git-Repo", 404
    try:
        out = subprocess.check_output(['git', 'show', commit_hash], cwd=project['git_repo'], text=True)
        return render('diff.html', diff=out, project=project, active_project=pid)
    except Exception as e:
        return str(e), 500
