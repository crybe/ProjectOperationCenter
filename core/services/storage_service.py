import os
import json
import re
import fcntl
import urllib.request
from core.constants import BOT_CTRL_URL, CTRL_TOKEN

BACKUP_WHITELIST_FILE = '/data/backup_whitelist.json'
BACKUP_LOG_PATH = '/media/Downloads/SERVER_BACKUPS/backup.log'
BACKUPS_DIR = '/media/Downloads/SERVER_BACKUPS'

def _load_whitelist():
    try:
        if os.path.exists(BACKUP_WHITELIST_FILE):
            with open(BACKUP_WHITELIST_FILE, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return []

def _save_whitelist(entries):
    os.makedirs(os.path.dirname(BACKUP_WHITELIST_FILE), exist_ok=True)
    with open(BACKUP_WHITELIST_FILE, 'w') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            json.dump(entries, f, indent=2)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)

def _parse_errors(lines):
    last_idx = None
    for i in range(len(lines) - 1, -1, -1):
        if 'Backup abgeschlossen' in lines[i]:
            last_idx = i
            break
    if last_idx is None:
        return []
    
    start_idx = 0
    for i in range(last_idx - 1, -1, -1):
        if 'Backup abgeschlossen' in lines[i]:
            start_idx = i + 1
            break
            
    errors = []
    for line in lines[start_idx:last_idx]:
        stripped = line.strip()
        if '❌' in stripped:
            m = re.search(r'] (.+)', stripped)
            if m:
                errors.append(m.group(1).strip())
    return errors

def get_backup_status():
    try:
        if not os.path.exists(BACKUP_LOG_PATH):
            return {'error': 'Log file not found'}
            
        with open(BACKUP_LOG_PATH, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
            
        last_date = last_size = last_errors = None
        for line in reversed(lines):
            if 'Backup abgeschlossen' in line:
                m = re.search(r'\[(\d+\.\d+\.\d+ \d+:\d+:\d+)\]', line)
                if m: last_date = m.group(1)
                m = re.search(r'Größe: ([^,]+)', line)
                if not m: m = re.search(r'Gr.ße: ([^,]+)', line)
                if m: last_size = m.group(1).strip()
                m = re.search(r'Fehler: (\d+)', line)
                if m: last_errors = int(m.group(1))
                break
                
        backups = [f for f in os.listdir(BACKUPS_DIR) if f.startswith('backup_') and f.endswith('.zip')] if os.path.isdir(BACKUPS_DIR) else []
        wl = _load_whitelist()
        raw_errors = _parse_errors(lines)
        filtered = [e for e in raw_errors if not any(w in e for w in wl)]
        
        return {
            'last': last_date, 
            'size': last_size, 
            'errors': len(filtered) if raw_errors else last_errors,
            'raw_errors': last_errors, 
            'error_labels': raw_errors, 
            'count': len(backups)
        }
    except Exception as e:
        return {'error': str(e)}

def trigger_backup():
    url = f'{BOT_CTRL_URL}/exec'
    data = {'cmd': 'bash /app/scripts/devops/backup_devhub.sh > /tmp/backup_manual.log 2>&1 &'}
    req = urllib.request.Request(
        url, method='POST',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN}
    )
    with urllib.request.urlopen(req, timeout=5) as r:
        return {'ok': True, 'msg': 'Backup gestartet (läuft im Hintergrund)'}

def manage_whitelist(action, entry=None):
    wl = _load_whitelist()
    if action == 'get':
        return wl
    elif action == 'add' and entry:
        if entry not in wl:
            wl.append(entry)
            _save_whitelist(wl)
    elif action == 'del' and entry:
        wl = [x for x in wl if x != entry]
        _save_whitelist(wl)
    return wl
