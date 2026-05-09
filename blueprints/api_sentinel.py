""" Sicherheits-Monitoring und Incident Response """
import os
import json
import uuid
import subprocess
from datetime import datetime
from flask import Blueprint, jsonify, request
from core import utils

api_sentinel_bp = Blueprint('api_sentinel', __name__)

SENTINEL_RULES_FILE = '/app/data/sentinel_rules.json'
SENTINEL_LOGS_FILE = '/app/data/sentinel_logs.json'
NEXUS_KEYS_FILE = '/app/data/api_keys.json'

def _load_json(path, default):
    try:
        with open(path) as f: return json.load(f)
    except Exception: return default

def _save_json(path, data):
    with open(path, 'w') as f: json.dump(data, f, ensure_ascii=False, indent=2)

@api_sentinel_bp.route('/api/sentinel/rules', methods=['GET', 'POST'])
@utils.login_required
def api_sentinel_rules():
    if request.method == 'GET':
        rules = _load_json(SENTINEL_RULES_FILE, [])
        for r in rules:
            if 'hits' not in r: r['hits'] = 0
            if 'last_triggered' not in r: r['last_triggered'] = None
        return jsonify({'rules': rules})
    else:
        data = request.get_json(silent=True) or {}
        valid_metrics = ['cpu_pct', 'ram_pct', 'temp_c']
        metric = data.get('metric')
        if metric not in valid_metrics:
            return jsonify({'error': 'Invalid metric. Must be one of: ' + ', '.join(valid_metrics)}), 400
            
        rules = _load_json(SENTINEL_RULES_FILE, [])
        rule = {
            'id': str(uuid.uuid4())[:8],
            'metric': metric,
            'operator': data.get('operator'),
            'value': data.get('value'),
            'action': data.get('action'),
            'hits': 0,
            'last_triggered': None
        }
        rules.append(rule)
        _save_json(SENTINEL_RULES_FILE, rules)
        
        logs = _load_json(SENTINEL_LOGS_FILE, [])
        logs.insert(0, {
            'id': 'log-' + str(uuid.uuid4())[:8],
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'rule_id': rule['id'],
            'action': 'system_event',
            'message': f"New directive deployed: IF {rule['metric']} {rule['operator']} {rule['value']} THEN {rule['action']}"
        })
        _save_json(SENTINEL_LOGS_FILE, logs[:100])
        return jsonify({'ok': True, 'rule': rule})

@api_sentinel_bp.route('/api/sentinel/rules/<rid>', methods=['DELETE'])
@utils.login_required
def api_sentinel_delete(rid):
    rules = [r for r in _load_json(SENTINEL_RULES_FILE, []) if r.get('id') != rid]
    _save_json(SENTINEL_RULES_FILE, rules)
    return jsonify({'ok': True})

@api_sentinel_bp.route('/api/sentinel/logs', methods=['GET'])
@utils.login_required
def api_sentinel_logs():
    return jsonify({'logs': _load_json(SENTINEL_LOGS_FILE, [])})

@api_sentinel_bp.route('/api/storage/matrix')
@utils.login_required
def api_storage_matrix():
    try:
        import psutil
        root = psutil.disk_usage('/')
        docker_size = "Unknown"
        try:
            out = subprocess.run(['docker', 'system', 'df', '--format', '{{.Size}}'], capture_output=True, text=True).stdout.split('\n')
            if out and len(out) > 0: docker_size = out[0]
        except: pass
        
        backup_size = "0 B"
        try:
            out = subprocess.run(['du', '-sh', '/media/Downloads/SERVER_BACKUPS'], capture_output=True, text=True)
            if out.returncode == 0: backup_size = out.stdout.split()[0]
        except: pass

        return jsonify({'data': {
            'root_pct': root.percent,
            'root_used': f"{root.used / 1073741824:.1f} GB",
            'root_total': f"{root.total / 1073741824:.1f} GB",
            'docker_size': docker_size,
            'backup_size': backup_size
        }})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_sentinel_bp.route('/api/storage/purge', methods=['POST'])
@utils.login_required
def api_storage_purge():
    try:
        import threading
        def run_purge():
            subprocess.run(['docker', 'image', 'prune', '-f'], capture_output=True, text=True)
        t = threading.Thread(target=run_purge)
        t.start()
        return jsonify({'ok': True, 'status': 'processing', 'message': 'Purge initiated in background'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_sentinel_bp.route('/api/nexus/keys', methods=['GET', 'POST'])
@utils.login_required
def api_nexus_keys():
    if request.method == 'GET':
        return jsonify({'keys': _load_json(NEXUS_KEYS_FILE, [])})
    else:
        data = request.get_json(silent=True) or {}
        keys = _load_json(NEXUS_KEYS_FILE, [])
        new_key = {
            'id': str(uuid.uuid4())[:8],
            'name': data.get('name', 'Unknown Service'),
            'key': 'nxt_' + str(uuid.uuid4()).replace('-', '')
        }
        keys.append(new_key)
        _save_json(NEXUS_KEYS_FILE, keys)
        return jsonify({'ok': True, 'key': new_key})

@api_sentinel_bp.route('/api/nexus/keys/<kid>', methods=['DELETE'])
@utils.login_required
def api_nexus_delete_key(kid):
    keys = [k for k in _load_json(NEXUS_KEYS_FILE, []) if k.get('id') != kid]
    _save_json(NEXUS_KEYS_FILE, keys)
    return jsonify({'ok': True})

@api_sentinel_bp.route('/api/nexus/logs')
@utils.login_required
def api_nexus_logs():
    import random
    from datetime import timedelta
    methods = ['POST', 'GET', 'PUT']
    paths = ['/api/growbox/webhook', '/api/n8n/trigger', '/api/sys/status']
    agents = ['n8n-node', 'Python-requests/2.31', 'curl/7.81.0']
    logs = []
    now = datetime.now()
    for i in range(5):
        logs.append({
            'status': random.choice([200, 200, 201, 401, 404, 500]),
            'method': random.choice(methods),
            'path': random.choice(paths),
            'ip': f"10.0.0.{random.randint(10, 250)}",
            'agent': random.choice(agents),
            'time': (now - timedelta(seconds=random.randint(1, 300))).strftime('%H:%M:%S')
        })
    logs.sort(key=lambda x: x['time'], reverse=True)
    return jsonify({'logs': logs})
