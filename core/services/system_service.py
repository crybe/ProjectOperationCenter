import os
import shutil
import json
import urllib.request
import re
from datetime import datetime
from core.constants import BOT_CTRL_URL, CTRL_TOKEN

def get_sysinfo():
    """ 
    Sammelt System-Informationen (RAM, CPU, Disk, Uptime, Temp) 
    direkt vom Host-System via /proc und System-Calls.
    """
    result = {}
    
    # 1. RAM aus /proc/meminfo
    try:
        mem = {}
        with open('/proc/meminfo') as f:
            for line in f:
                p = line.split()
                if p[0] in ('MemTotal:', 'MemAvailable:'):
                    mem[p[0].rstrip(':')] = int(p[1])
        total = mem.get('MemTotal', 1)
        avail = mem.get('MemAvailable', 0)
        used = total - avail
        result['ram_pct'] = round(used / total * 100)
        result['ram'] = f'{used//1024} / {total//1024} MB'
    except Exception:
        result['ram_pct'] = 0; result['ram'] = '–'

    # 2. CPU Last via Load-Average
    try:
        with open('/proc/loadavg') as f:
            load = float(f.read().split()[0])
        result['cpu_pct'] = min(round(load / 4 * 100), 100) 
        result['cpu'] = f'Load {load:.2f}'
    except Exception:
        result['cpu_pct'] = 0; result['cpu'] = '–'

    # 3. Speicherplatz
    try:
        du = shutil.disk_usage('/')
        result['disk_pct'] = round(du.used / du.total * 100)
        result['disk_used'] = f'{du.used/1073741824:.1f} GB'
        result['disk_total'] = f'{du.total/1073741824:.1f} GB'
        result['disk'] = f"{result['disk_used']} / {result['disk_total']}"
    except Exception:
        result['disk_pct'] = 0; result['disk'] = '–'

    # 4. System-Uptime
    try:
        with open('/proc/uptime') as f:
            secs = float(f.read().split()[0])
        d, rem = divmod(int(secs), 86400)
        h, rem = divmod(rem, 3600)
        m = rem // 60
        result['uptime'] = f'{d}d {h}h {m}m' if d else f'{h}h {m}m'
        result['uptime_secs'] = int(secs)
    except Exception:
        result['uptime'] = '–'

    # 5. RPi5 Kern-Temperatur
    try:
        for zone in range(6):
            path = f'/sys/class/thermal/thermal_zone{zone}/temp'
            if os.path.exists(path):
                with open(path) as f:
                    result['temp'] = round(int(f.read().strip()) / 1000, 1)
                break
    except Exception:
        result['temp'] = None
        
    return result

def _bot_request(endpoint, method='GET', data=None):
    url = f'{BOT_CTRL_URL}{endpoint}'
    headers = {'X-Ctrl-Token': CTRL_TOKEN}
    if data:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(data).encode()
    else:
        body = None
        
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def get_containers():
    try:
        return _bot_request('/containers')
    except Exception as e:
        return {'error': str(e)}

def perform_container_action(name, action):
    if action not in ('start', 'stop', 'restart'):
        raise ValueError("Invalid action")
    if not re.match(r'^[a-zA-Z0-9\-_]+$', name):
        raise ValueError("Invalid container name")
    
    return _bot_request(f'/container/{name}/{action}', method='POST')

def get_bot_status():
    try:
        return _bot_request('/status')
    except Exception as e:
        return {'active': False, 'state': 'error', 'error': str(e)}
