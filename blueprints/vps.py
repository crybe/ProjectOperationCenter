""" Verwaltung von VPS-Instanzen und Cloud-Servern """
import os
import json
import urllib.request
import urllib.parse
from flask import Blueprint, jsonify, render_template as render
from core.utils import login_required
from core.constants import BOT_CTRL_URL, CTRL_TOKEN

vps_bp = Blueprint('vps', __name__)

def _ctrl_exec(cmd):
    try:
        req = urllib.request.Request(
            f'{BOT_CTRL_URL}/exec',
            method='POST',
            data=json.dumps({'cmd': cmd}).encode(),
            headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        return {'ok': False, 'error': str(e)}

from flask import Blueprint, jsonify, render_template as render, session, redirect, url_for, request

@vps_bp.route('/vpanel/verify', methods=['GET', 'POST'])
@login_required
def vpanel_verify():
    if request.method == 'POST':
        pw = request.form.get('password')
        # Check against LOGIN_PASSWORD from .env
        if pw == os.environ.get('LOGIN_PASSWORD'):
            session['vpanel_authorized'] = True
            return redirect(url_for('vps.vpanel_page'))
        return render('vpanel_verify.html', error='Falsches Passwort')
    return render('vpanel_verify.html')

@vps_bp.route('/vpanel')
@login_required
def vpanel_page():
    if not session.get('vpanel_authorized'):
        return redirect(url_for('vps.vpanel_verify'))
    return render('vpanel.html', active_page='vpanel', vpanel_authorized=True)

import re

@vps_bp.route('/api/vps/metrics')
@login_required
def vps_metrics():
    # Wir holen uns detaillierte Infos direkt vom Host via devhub-ctrl
    # CPU: top, RAM: free, Disk: df, Uptime: uptime, Temp: thermal_zone0
    cmd = "top -bn1 | grep 'Cpu(s)'; free -m; df -h /; uptime; cat /sys/class/thermal/thermal_zone0/temp"
    res = _ctrl_exec(cmd)
    if not res.get('ok'):
        return jsonify(res), 500
    
    stdout = res.get('stdout', '')
    lines = [l.strip() for l in stdout.split('\n') if l.strip()]
    
    data = {
        'cpu': {'usage': 0, 'temp': 0},
        'ram': {'total': 0, 'used': 0, 'pct': 0},
        'disk': {'total': '', 'used': '', 'pct': 0},
        'uptime': '',
        'load': [0, 0, 0],
        'ok': True
    }
    
    try:
        # CPU usage (top)
        cpu_match = re.search(r'Cpu\(s\):\s*([\d.]+)\s*us', stdout)
        if cpu_match: data['cpu']['usage'] = float(cpu_match.group(1))
        
        # RAM (free -m)
        mem_line = next((l for l in lines if l.startswith('Mem:')), None)
        if mem_line:
            p = mem_line.split()
            data['ram']['total'] = int(p[1])
            data['ram']['used']  = int(p[2])
            data['ram']['pct']   = round(data['ram']['used'] / data['ram']['total'] * 100, 1)
            
        # Disk (df -h /)
        disk_line = next((l for l in lines if l.endswith(' /')), None)
        if disk_line:
            p = disk_line.split()
            data['disk']['total'] = p[1]
            data['disk']['used']  = p[2]
            data['disk']['pct']   = int(p[4].replace('%', ''))
            
        # Uptime & Load
        uptime_line = next((l for l in lines if 'load average:' in l), None)
        if uptime_line:
            up_match = re.search(r'up\s+(.*?),\s+\d+\s+user', uptime_line)
            if up_match: data['uptime'] = up_match.group(1)
            load_match = re.search(r'load average:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)', uptime_line)
            if load_match: data['load'] = [float(x) for x in load_match.groups()]

        # Temp (cat temp)
        temp_line = lines[-1]
        if temp_line.isdigit():
            data['cpu']['temp'] = round(int(temp_line) / 1000, 1)
                
    except Exception as e:
        data['error'] = str(e)
        data['debug_stdout'] = stdout
        
    return jsonify(data)

@vps_bp.route('/api/vps/docker/stats')
@login_required
def vps_docker_stats():
    # Docker stats im JSON Format (pseudo-json von docker stats)
    cmd = "docker stats --no-stream --format '{\"container\":\"{{ .Name }}\", \"cpu\":\"{{ .CPUPerc }}\", \"mem\":\"{{ .MemUsage }}\", \"mem_pct\":\"{{ .MemPerc }}\", \"net\":\"{{ .NetIO }}\", \"block\":\"{{ .BlockIO }}\"}'"
    res = _ctrl_exec(cmd)
    if not res.get('ok'):
        return jsonify(res), 500
    
    lines = res.get('stdout', '').strip().split('\n')
    stats = []
    for line in lines:
        if line.strip():
            try: stats.append(json.loads(line))
            except: pass
    return jsonify(stats)

@vps_bp.route('/api/vps/processes')
@login_required
def vps_processes():
    # Top 15 Prozesse nach CPU
    cmd = "ps aux --sort=-%cpu | head -n 16"
    res = _ctrl_exec(cmd)
    return jsonify(res)

@vps_bp.route('/api/vps/network')
@login_required
def vps_network():
    # Offene Ports
    cmd = "ss -lntup"
    res = _ctrl_exec(cmd)
    return jsonify(res)

@vps_bp.route('/api/shortcuts/run_raw', methods=['POST'])
@login_required
def api_run_raw():
    from flask import request
    b = request.get_json(silent=True) or {}
    cmd = b.get('cmd', '').strip()
    if not cmd:
        return jsonify({'error': 'kein befehl'}), 400
    return jsonify(_ctrl_exec(cmd))
