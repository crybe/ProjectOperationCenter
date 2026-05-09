""" Design-System und Theme-Management """
import os
from flask import Blueprint, render_template as render, request, jsonify
from core.utils import login_required

design_bp = Blueprint('design', __name__)

THEME_FILE = 'static/theme.css'

DEFAULT_VARS = {
    '--bg': '#0d1117', '--sidebar': '#13171f', '--surface': '#1c2333',
    '--surface2': '#21262d', '--border': '#30363d', '--text': '#e6edf3',
    '--muted': '#7d8590', '--accent': '#58a6ff', '--green': '#3fb950',
    '--amber': '#d29922', '--red': '#f85149', '--sand': '#f6f1e5',
    '--sand-strong': '#d4ac0d', '--teal': '#2ce3cc'
}

PRESETS = {
    'Cyber': {'--bg':'#050505','--sidebar':'#0a0a0a','--surface':'#111','--surface2':'#181818','--border':'#222','--text':'#eee','--muted':'#666','--accent':'#00f3ff','--green':'#0f0','--amber':'#ff0','--red':'#f00','--sand':'#ff00ff','--sand-strong':'#ff00ff','--teal':'#0ff'},
    'GitHub Dark': DEFAULT_VARS,
    'Dracula': {'--bg':'#282a36','--sidebar':'#21222c','--surface':'#44475a','--surface2':'#6272a4','--border':'#44475a','--text':'#f8f8f2','--muted':'#6272a4','--accent':'#bd93f9','--green':'#50fa7b','--amber':'#f1fa8c','--red':'#ff5555','--sand':'#ffb86c','--sand-strong':'#ffb86c','--teal':'#8be9fd'},
}

def _read_theme():
    vars_dict = DEFAULT_VARS.copy()
    if not os.path.exists(THEME_FILE): return vars_dict
    try:
        with open(THEME_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if ':' in line and line.strip().startswith('--'):
                    k, v = line.split(':', 1)
                    k = k.strip(); v = v.strip().rstrip(';')
                    if k in vars_dict: vars_dict[k] = v
    except: pass
    return vars_dict

def _write_theme(vars_dict):
    lines = [':root {']
    for k, v in vars_dict.items(): lines.append(f'  {k}: {v};')
    lines.append('}')
    with open(THEME_FILE, 'w', encoding='utf-8') as f: f.write('\n'.join(lines) + '\n')

@design_bp.route('/design')
@login_required
def design():
    return render('design.html', current=_read_theme(), defaults=DEFAULT_VARS, presets=list(PRESETS.keys()), active_page='design')

@design_bp.route('/design/save', methods=['POST'])
@login_required
def design_save():
    _write_theme(request.get_json())
    return jsonify({'ok': True})

@design_bp.route('/design/preset/<name>', methods=['POST'])
@login_required
def design_preset(name):
    if name in PRESETS:
        _write_theme(PRESETS[name])
        return jsonify({'ok': True, 'vars': PRESETS[name]})
    return jsonify({'ok': False}), 404

@design_bp.route('/design/reset', methods=['POST'])
@login_required
def design_reset():
    _write_theme(DEFAULT_VARS)
    return jsonify({'ok': True, 'vars': DEFAULT_VARS})
