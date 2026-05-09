""" 
Zentrale API-Logik für das DevHub Projekt.
Verwaltet System-Metriken, Hardware-Steuerung (Growbox), 
Docker-Interaktionen und externe Service-Kommunikation.
"""
import os
import json
import re


BACKUP_WHITELIST_FILE = '/data/backup_whitelist.json'

def _load_backup_whitelist():
    return utils.safe_load_json(BACKUP_WHITELIST_FILE, default=[])

def _save_backup_whitelist(entries):
    return utils.safe_write_json(BACKUP_WHITELIST_FILE, entries)

def _parse_last_backup_errors(lines):
    import re as _re
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
            m = _re.search(r'] (.+)', stripped)
            if m:
                errors.append(m.group(1).strip())
    return errors
import time
import uuid
import shutil
import sys
import subprocess
import requests
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
from flask import Blueprint, jsonify, request, render_template as render
from core import utils
from core.constants import BOT_CTRL_URL, CTRL_TOKEN, PROM_URL, n8n_BASE_URL
from core.services.grow_service import get_grow_interpretation, calculate_run_score, get_mold_risk
from core.provider.ai_provider import get_core_report
from core.services import grow_service, system_service, storage_service
from intelligence_worker.pigeon_engine import pigeon_scanner, action_engine

# Pfade zu lokalen Datenspeichern (Legacy JSON Support)
SHORTCUTS_FILE = '/app/data/shortcuts.json'
GROW_LOG_FILE  = '/app/data/grow_log.json'

def _load_json(path, default):
    return utils.safe_load_json(path, default=default)

def _save_json(path, data):
    return utils.safe_write_json(path, data)

api_bp = Blueprint('api', __name__)

# --- Simple Cache Logic ---
_CACHE = {}
def _get_cached(key, max_age=15):
    entry = _CACHE.get(key)
    if entry and (time.time() - entry['ts'] < max_age):
        return entry['val']
    return None

def _set_cached(key, val):
    _CACHE[key] = {'ts': time.time(), 'val': val}

def _fetch_json(url, timeout=4):
    req = urllib.request.Request(url, headers={'User-Agent': 'DevHub/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))

def _prom_get_all(query):
    try:
        data = _fetch_json(f'{PROM_URL}?query={urllib.parse.quote(query)}')
        return data.get('data', {}).get('result', [])
    except:
        return []

def _prom_query(query, cache_age=15):
    """ Führt eine Prometheus-Abfrage aus und nutzt einen internen Cache. """
    cache_key = f"prom_{query}"
    cached = _get_cached(cache_key, cache_age)
    if cached is not None: return cached
    
    try:
        payload = _fetch_json(f'{PROM_URL}?query={urllib.parse.quote(query)}')
        result = payload.get('data', {}).get('result', [])
        val = float(result[0]['value'][1]) if result else None
        if val is not None: _set_cached(cache_key, val)
        return val
    except Exception:
        return None

@api_bp.route('/api/projects')
@utils.login_required
def api_projects():
    return jsonify(utils.load_projects())
@api_bp.route('/services')
@utils.login_required
def services():
    return render('services.html', active_page='services')

@api_bp.route('/api/sysinfo')
@utils.login_required
def sysinfo():
    """ Proxy for system_service.get_sysinfo() """
    return jsonify(system_service.get_sysinfo())


@api_bp.route('/api/lamp', methods=['POST'])
@utils.login_required
def api_lamp_set():
    """ 
    Einfacher Endpunkt zum Schalten der Growbox-Lampe.
    Leitet den Request an den lokalen Webhook weiter.
    """
    b = request.get_json(silent=True) or {}
    level = b.get('level')
    if level is None or not isinstance(level, int) or not (0 <= level <= 10):
        return jsonify({'ok': False, 'error': 'level muss 0–10 sein'}), 400
    try:
        lamp_url = os.environ.get('LAMP_WEBHOOK_URL', 'http://host.docker.internal:8767')
        token = os.environ.get('LAMP_WEBHOOK_TOKEN', '')
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        req = urllib.request.Request(
            f'{lamp_url}/light?level={level}', data=b'', headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=15) as r:
            return jsonify(json.loads(r.read()))
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/grow/port-control', methods=['POST'])
@utils.login_required
def api_grow_port_control():
    """
    Sicherer Endpunkt zur Hardware-Steuerung (Growbox).
    Prüft PIN und leitet Befehle an den lokalen Webhook weiter.
    """
    b = request.get_json(silent=True) or {}
    key = b.get('key')
    level = b.get('level')
    pin = b.get('pin')
    
    # 1. Sicherheits-Check: PIN-Abfrage (0000)
    from flask import current_app
    required_pin = current_app.config.get('GROWBOX_PIN', '0000')
    if str(pin) != str(required_pin):
        utils.log_action('GROW', 'PORT_CONTROL_FAILED', f"Key: {key}, Level: {level}, Reason: Invalid PIN")
        return jsonify({'ok': False, 'error': 'Ungültiger PIN'}), 403
    
    # 2. Parameter-Validierung
    if key is None or level is None or not isinstance(level, int) or not (0 <= level <= 10):
        return jsonify({'ok': False, 'error': 'Ungültige Parameter'}), 400
        
    # 3. Mapping von Frontend-Bezeichnern auf Webhook-Pfade
    mapping = {
        'spider_farmer_lampe': '/light',
        'cloudray_s6_luefter': '/fan/umluft',
        'abluft':              '/fan/abluft',
        'abluft_ac':           '/fan/abluft'
    }
    
    path = mapping.get(key)
    if not path:
        return jsonify({'ok': False, 'error': f'Port {key} nicht steuerbar'}), 400
        
    # 4. Kommunikation mit dem Hardware-Webhook (auf dem Host-System)
    try:
        base_url = current_app.config.get('LAMP_WEBHOOK_URL')
        token = current_app.config.get('LAMP_WEBHOOK_TOKEN')
        
        # Authentifizierung via Bearer-Token (erforderlich für den Webhook)
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        req = urllib.request.Request(
            f'{base_url}{path}?level={level}', data=b'', headers=headers, method='POST')
        
        with urllib.request.urlopen(req, timeout=15) as r:
            res_data = json.loads(r.read())
            # Erfolg im Audit-Log vermerken
            utils.log_action('GROW', 'PORT_CONTROL_SUCCESS', f"Key: {key}, Level: {level}")
            return jsonify(res_data)
            
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace') if e.fp else ''
        utils.log_action('GROW', 'PORT_CONTROL_ERROR', f"Key: {key}, Level: {level}, HTTP {e.code}: {e.reason} | Body: {err_body}")
        return jsonify({'ok': False, 'error': f"Hardware-Fehler ({e.code})", 'details': err_body}), e.code
    except Exception as e:
        # Fehler im Audit-Log vermerken (z.B. Timeout)
        utils.log_action('GROW', 'PORT_CONTROL_ERROR', f"Key: {key}, Level: {level}, Error: {str(e)}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/admin/audit-logs', methods=['GET'])
@utils.login_required
def api_admin_audit_logs():
    """Gibt die letzten N Einträge aus dem Audit-Log zurück."""
    from flask import current_app
    log_file = current_app.config.get('ACTIONS_LOG')
    lines = int(request.args.get('lines', 50))
    
    if not os.path.exists(log_file):
        return jsonify({'ok': True, 'logs': []})
        
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            # Effizientes Lesen der letzten N Zeilen
            all_lines = f.readlines()
            last_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            return jsonify({'ok': True, 'logs': [l.strip() for l in reversed(last_lines)]})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/watering', methods=['POST'])
@utils.login_required
def api_watering():
    try:
        url = 'http://host.docker.internal:8766/water?duration=10'
        req = urllib.request.Request(url, data=b'', method='POST')
        with urllib.request.urlopen(req, timeout=15) as r:
            res = json.loads(r.read())
            if res.get('ok') is not False:
                # Zeitstempel lokal loggen
                log_path = '/app/data/watering_log.json'
                try:
                    with open(log_path, 'w') as lf:
                        json.dump({'last_watering': time.time()}, lf)
                except Exception: pass
            return jsonify(res)
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/bot/status')
@utils.login_required
def bot_status():
    """ Proxy for system_service.get_bot_status() """
    return jsonify(system_service.get_bot_status())

@api_bp.route('/api/grow/archive')
@utils.login_required
def grow_archive():
    """
    Aggregiert historische Ernte-Daten aus Prometheus und lokalen JSON-Archiven.
    Erfordert eine Passphrase zur Autorisierung.
    """
    from core.constants import LOGIN_PASSWORD
    provided = (request.args.get('passphrase') or '').strip()
    secret   = os.environ.get('ADMIN_PASSPHRASE', LOGIN_PASSWORD).strip()
    
    print(f"[ARCHIVE] Auth check: received={provided[:3]}***, expected={secret[:3]}***", file=sys.stderr)
    
    if provided != secret:
        return jsonify({'ok': False, 'error': 'PASS_REQUIRED'})

    # --- Server-side caching for archive performance ---
    cache_key = "grow_archive_full_data"
    cached = _get_cached(cache_key, 1800) # 30 min cache
    if cached is not None:
        return jsonify(cached)

    try:
        print("[ARCHIVE] Start fetching Prometheus data", file=sys.stderr)
        info_results = _prom_get_all("grow_info{job='growbox_ernte_history'}")
        print(f"[ARCHIVE] Found {len(info_results)} info entries", file=sys.stderr)
        
        def _get_metric_map(query):
            res = _prom_get_all(query)
            # Use sorte as key, or full metric as fallback for debugging
            return { r['metric'].get('sorte', 'unknown'): float(r['value'][1]) for r in res }

        ertrag = _get_metric_map("grow_ertrag_gramm{job='growbox_ernte_history'}")
        dauer  = _get_metric_map("grow_dauer_tage{job='growbox_ernte_history'}")
        power  = _get_metric_map("grow_avg_power_watt{job='growbox_ernte_history'}")
        kwh    = _get_metric_map("grow_kwh_gesamt{job='growbox_ernte_history'}")
        kosten = _get_metric_map("grow_stromkosten_eur{job='growbox_ernte_history'}")
        eff    = _get_metric_map("grow_effizienz_g_kwh{job='growbox_ernte_history'}")
        
        # --- Merge Manual JSON Archive ---
        manual_history = []
        ARCHIVE_FILE = os.path.join("data", "grow_archive.json")
        if os.path.exists(ARCHIVE_FILE):
            try:
                with open(ARCHIVE_FILE, 'r') as f:
                    manual_data = json.load(f)
                    # Normalize manual data to match Prometheus structure where possible
                    for m in manual_data:
                        manual_history.append({
                            'id': m.get('id', 'manual'),
                            'sorte': m.get('strain', 'unknown'),
                            'datum': m.get('harvest_date', 'N/A'),
                            'ertrag': m.get('yield_g', 0),
                            'dauer': 'N/A', # Manual runs don't have duration in days yet
                            'notes': m.get('notes', ''),
                            'rating': m.get('rating', 0),
                            'is_manual': True
                        })
            except Exception as e:
                print(f"[ARCHIVE] Manual load error: {e}", file=sys.stderr)

        history = manual_history + []
        for r in info_results:
            labels = r['metric']
            sorte = labels.get('sorte', 'unknown')
            history.append({
                'id': labels.get('grow_nr', '0'),
                'sorte': sorte,
                'datum': labels.get('datum', 'N/A'),
                'trainings': labels.get('trainings', 'None'),
                'pflanzen': labels.get('pflanzen', '1'),
                'ertrag': ertrag.get(sorte, 0),
                'dauer': dauer.get(sorte, 0),
                'power': power.get(sorte, 0),
                'kwh': kwh.get(sorte, 0),
                'kosten': kosten.get(sorte, 0),
                'effizienz': eff.get(sorte, 0),
                'is_manual': False
            })

        def _get_stages_map(query):
             res = _prom_get_all(query)
             return { r['metric'].get('sorte', 'unknown'): float(r['value'][1]) for r in res }

        print("[ARCHIVE] Fetching timeline stages", file=sys.stderr)
        keimung  = _get_stages_map("grow_keimung_ts{job='growbox_stages'} * 1000")
        saemling = _get_stages_map("grow_saemling_ts{job='growbox_stages'} * 1000")
        vegi     = _get_stages_map("grow_vegi_ts{job='growbox_stages'} * 1000")
        bluete   = _get_stages_map("grow_bluete_ts{job='growbox_stages'} * 1000")
        trocknung= _get_stages_map("grow_trocknung_ts{job='growbox_stages'} * 1000")
        curing   = _get_stages_map("grow_curing_ts{job='growbox_stages'} * 1000")

        timeline = []
        for h in history:
            s = h['sorte']
            timeline.append({
                'sorte': s,
                'keimung': keimung.get(s),
                'saemling': saemling.get(s),
                'vegi': vegi.get(s),
                'bluete': bluete.get(s),
                'trocknung': trocknung.get(s),
                'curing': curing.get(s)
            })

        print(f"[ARCHIVE] Success: {len(history)} items", file=sys.stderr)
        resp_data = {'ok': True, 'history': history, 'timeline': timeline}
        _set_cache(cache_key, resp_data)
        return jsonify(resp_data)
    except Exception as e:
        print(f"[ARCHIVE] Error: {e}", file=sys.stderr)
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/grow/archive', methods=['POST'])
@utils.login_required
def grow_archive_post():
    data = request.json
    password = data.get('password', '')
    
    # Simple passphrase check
    secret = os.environ.get('ADMIN_PASSPHRASE', 'admin-dev')
    if password != secret:
        return jsonify({"ok": False, "error": "Ungültige Passphrase"}), 403
        
    ARCHIVE_FILE = os.path.join("data", "grow_archive.json")
    archive = []
    if os.path.exists(ARCHIVE_FILE):
        with open(ARCHIVE_FILE, 'r') as f:
            archive = json.load(f)
    
    import uuid
    new_entry = {
        "id": str(uuid.uuid4()),
        "strain": data.get('strain', 'Unbekannt'),
        "start_date": data.get('start_date'),
        "harvest_date": data.get('harvest_date'),
        "yield_g": float(data.get('yield_g', 0)),
        "avg_temp": float(data.get('avg_temp', 0)),
        "avg_vpd": float(data.get('avg_vpd', 0)),
        "notes": data.get('notes', ''),
        "rating": int(data.get('rating', 3))
    }
    
    archive.append(new_entry)
    with open(ARCHIVE_FILE, 'w') as f:
        json.dump(archive, f, indent=2)
        
    # Clear cache to reflect new manual entry
    _set_cache("grow_archive_full_data", None)
        
    return jsonify({"ok": True, "entry": new_entry})

@api_bp.route('/api/bot/<action>', methods=['POST'])
@utils.login_required
def bot_action(action):
    """ Steuert den KI-Bot (start/stop/restart) via Webhook. """
    if action not in ('start', 'stop', 'restart'):
        return jsonify({'error': 'Unbekannte Aktion'}), 400
    try:
        req = urllib.request.Request(f'{BOT_CTRL_URL}/{action}', data=b'', headers={'X-Ctrl-Token': CTRL_TOKEN}, method='POST')
        with urllib.request.urlopen(req, timeout=10) as r:
            return jsonify(json.loads(r.read()))
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/botlog')
@utils.login_required
def bot_log():
    log_path = '/app/logs/aktionen.log'
    try:
        with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
            lines = [l.rstrip() for l in f.readlines()[-150:]]
    except Exception as e:
        lines = [f'Fehler: {e}']
    return jsonify({'lines': lines})

@api_bp.route('/api/services')
@utils.login_required
def api_services():
    try:
        req = urllib.request.Request(f'{BOT_CTRL_URL}/services', headers={'X-Ctrl-Token': CTRL_TOKEN})
        with urllib.request.urlopen(req, timeout=5) as r:
            return jsonify(json.loads(r.read()))
    except Exception as e:
        return jsonify({'error': str(e)})

@api_bp.route('/api/service/<name>/<action>', methods=['POST'])
@utils.login_required
def api_service_action(name, action):
    if action not in ('start', 'stop', 'restart'):
        return jsonify({'error': 'Ungültige Aktion'}), 400
    if not re.match(r'^[a-zA-Z0-9\-_\.]+$', name):
        return jsonify({'error': 'Ungültiger Service-Name'}), 400
    try:
        req = urllib.request.Request(f'{BOT_CTRL_URL}/service/{name}/{action}', data=b'', method='POST')
        with urllib.request.urlopen(req, timeout=15) as r:
            return jsonify(json.loads(r.read()))
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/container/<name>/<action>', methods=['POST'])
@utils.login_required
def api_container_action(name, action):
    """ Proxy for system_service.perform_container_action() """
    try:
        return jsonify(system_service.perform_container_action(name, action))
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400

@api_bp.route('/api/container-list')
@utils.login_required
def api_container_list():
    """ Proxy for system_service.get_containers() """
    return jsonify(system_service.get_containers())

@api_bp.route('/api/backup-status')
@utils.login_required
def backup_status():
    """ Proxy for storage_service.get_backup_status() """
    return jsonify(storage_service.get_backup_status())

@api_bp.route('/api/backup-whitelist', methods=['GET'])
@utils.login_required
def get_backup_whitelist():
    """ Proxy for storage_service.manage_whitelist('get') """
    return jsonify(storage_service.manage_whitelist('get'))

@api_bp.route('/api/backup-whitelist', methods=['POST'])
@utils.login_required
def add_backup_whitelist():
    """ Proxy for storage_service.manage_whitelist('add') """
    entry = (request.json or {}).get('entry', '').strip()
    if not entry:
        return jsonify({'ok': False, 'error': 'entry required'})
    wl = storage_service.manage_whitelist('add', entry)
    return jsonify({'ok': True, 'whitelist': wl})

@api_bp.route('/api/backup-whitelist/<path:entry>', methods=['DELETE'])
@utils.login_required
def del_backup_whitelist(entry):
    """ Proxy for storage_service.manage_whitelist('del') """
    wl = storage_service.manage_whitelist('del', entry)
    return jsonify({'ok': True, 'whitelist': wl})

@api_bp.route('/api/backup-trigger', methods=['POST'])
@utils.login_required
def backup_trigger():
    """ Proxy for storage_service.trigger_backup() """
    return jsonify(storage_service.trigger_backup())



def _calc_vpd(temp_c, humidity_pct):
    if temp_c is None or humidity_pct is None:
        return None
    saturation = 0.61078 * (2.718281828 ** ((17.27 * temp_c) / (temp_c + 237.3)))
    return round(saturation - (saturation * (humidity_pct / 100.0)), 2)


def _watering_from_prometheus():
    """Reads all watering timestamps from Prometheus, returns (days_since, avg_interval, count)."""
    import time as _wt
    try:
        raw = _fetch_json(
            'http://host.docker.internal:9090/api/v1/query?query=growbox_watering_ts',
            timeout=3
        )
        results = raw.get('data', {}).get('result', [])
        timestamps = sorted(float(r['value'][1]) for r in results if float(r['value'][1]) > 0)
        
        # Lokales Log pruefen (fuer sofortiges Feedback vor Prometheus-Sync)
        try:
            log_path = '/app/data/watering_log.json'
            if os.path.exists(log_path):
                with open(log_path, 'r') as lf:
                    local_data = json.load(lf)
                    l_ts = local_data.get('last_watering')
                    if l_ts and (not timestamps or l_ts > timestamps[-1]):
                        timestamps.append(l_ts)
                        timestamps.sort()
        except Exception: pass

        if not timestamps:
            return None, None, 0
        count = len(timestamps)
        now = _wt.time()
        days_since = round((now - timestamps[-1]) / 86400, 2)
        if count >= 2:
            gaps = [(timestamps[i] - timestamps[i-1]) / 86400
                    for i in range(1, count)
                    if (timestamps[i] - timestamps[i-1]) > 3600]  # ignore < 1h gaps (double entries)
            avg = round(sum(gaps) / len(gaps), 2) if gaps else None
        else:
            avg = None
        return days_since, avg, count
    except Exception:
        return None, None, 0

@api_bp.route('/api/growbox')
@utils.login_required
def growbox_api():
    result = {}
    try:
        with open('/app/lamp_level.state') as f:
            result['lamp_level'] = int(f.read().strip())
    except Exception: result['lamp_level'] = None
    return jsonify(result)

@api_bp.route('/api/grow-metrics')
@utils.login_required
def grow_metrics():
    """ Proxy for grow_service.get_aggregated_metrics() """
    try:
        return jsonify(grow_service.get_aggregated_metrics())
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/watering-history')
@utils.login_required
def watering_history():
    import time as _time
    WATERING_LOG = '/home/user/Dokumente/watering_log.json'
    try:
        with open(WATERING_LOG) as f:
            entries = json.load(f)
    except Exception:
        entries = []

    entries = sorted(entries, key=lambda e: e.get('ts', 0))
    count = len(entries)
    now_ts = _time.time()

    days_since = None
    if entries:
        days_since = round((now_ts - entries[-1]['ts']) / 86400, 1)

    avg_days = None
    if count >= 2:
        gaps = [(entries[i]['ts'] - entries[i-1]['ts']) / 86400 for i in range(1, count)]
        avg_days = round(sum(gaps) / len(gaps), 1)

    events = [{'ts': e['ts'] * 1000, 'dt': e.get('dt', '')} for e in entries]
    return jsonify({
        'count': count,
        'days_since_last': days_since,
        'avg_interval_days': avg_days,
        'events': events,
    })

@api_bp.route('/api/grow/watered', methods=['POST'])
@utils.login_required
def grow_watered():
    import fcntl
    WATERING_LOG = '/home/user/Dokumente/watering_log.json'
    try:
        mode = 'r+' if os.path.exists(WATERING_LOG) else 'w+'
        with open(WATERING_LOG, mode) as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                if mode == 'r+':
                    data = json.load(f)
                else:
                    data = []
                now = time.time()
                dt = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(now))
                data.append({'ts': now, 'dt': dt})
                f.seek(0)
                f.truncate()
                json.dump(data, f, indent=2)
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        return jsonify({'ok': True, 'msg': 'Bewässerung gespeichert'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/grow/watering-history')
@utils.login_required
def grow_watering_history():
    WATERING_LOG = '/home/user/Dokumente/watering_log.json'
    if not os.path.exists(WATERING_LOG):
        return jsonify({'ok': True, 'history': []})
    try:
        with open(WATERING_LOG, 'r') as f:
            data = json.load(f)
        
        # Sortieren nach Zeit
        data.sort(key=lambda x: x['ts'])
        
        history = []
        for i in range(len(data)):
            entry = data[i].copy()
            if i > 0:
                # Intervall in Stunden berechnen
                interval_h = round((data[i]['ts'] - data[i-1]['ts']) / 3600, 1)
                entry['interval_h'] = interval_h
            else:
                entry['interval_h'] = None
            history.append(entry)
        
        # Nur die letzten 15 Einträge zurückgeben
        return jsonify({'ok': True, 'history': history[-15:]})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

_LOG_ALLOWED_SERVICES = {
    'Shinra_Gate', 'ollama', 'fan-controller', 'lamp-webhook',
    'acinfinity-exporter', 'tapo-exporter', 'watering-webhook',
    'aria2', 'jdownloader', 'ntfy', 'pihole-FTL',
    'ntfy-yt-downloader', 'plexmediaserver', 'devhub-ctrl',
}

@api_bp.route('/api/service-log/<name>')
@utils.login_required
def service_log(name):
    if name not in _LOG_ALLOWED_SERVICES:
        return jsonify({'ok': False, 'lines': [], 'error': 'nicht erlaubt'}), 403
    try:
        req = urllib.request.Request(
            f'{BOT_CTRL_URL}/exec', method='POST',
            data=json.dumps({'cmd': f'journalctl -u {name} -n 120 --no-pager --output=short 2>&1'}).encode(),
            headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN})
        with urllib.request.urlopen(req, timeout=12) as r:
            result = json.loads(r.read())
        lines = result.get('stdout', result.get('stderr', '')).split('\n')
        return jsonify({'ok': True, 'lines': lines})
    except Exception as e:
        return jsonify({'ok': False, 'lines': [], 'error': str(e)})

@api_bp.route('/api/bot/logs')
@utils.login_required
def bot_logs():
    try:
        req = urllib.request.Request(
            f'{BOT_CTRL_URL}/exec', method='POST',
            data=json.dumps({'cmd': 'journalctl -u Shinra_Gate -n 200 --no-pager 2>&1'}).encode(),
            headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN})
        with urllib.request.urlopen(req, timeout=12) as r:
            lines = r.read().decode().split('\n')
        return jsonify({'ok': True, 'lines': lines})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/docker/list')
@utils.login_required
def docker_list():
    """ 
    Listet alle Docker-Container auf dem Host-System auf.
    Nutzt das lokale Docker-Binary im Container (via Socket-Mount).
    """
    try:
        # We now use local docker as it is properly configured in the container
        out = subprocess.check_output(['/usr/bin/docker', 'ps', '-a', '--format', '{{json .}}'], text=True)
        containers = []
        for line in out.strip().split('\n'):
            if line.strip():
                try:
                    c = json.loads(line)
                    containers.append({
                        'id': c.get('ID'),
                        'name': c.get('Names'),
                        'image': c.get('Image'),
                        'status': c.get('Status'),
                        'state': c.get('State', 'unknown'),
                        'cpu': c.get('CPUPerc', '0%'),
                        'mem': c.get('MemUsage', '0B')
                    })
                except: pass
        return jsonify({'ok': True, 'containers': containers})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/docker/control', methods=['POST'])
@utils.login_required
def docker_control():
    """ Steuert einzelne Docker-Container (start/stop/restart) mit Namens-Validierung. """
    data = request.json
    name = data.get('name')
    act  = data.get('action')
    if not name or act not in ('start', 'stop', 'restart'):
        return jsonify({'ok': False, 'error': 'Ungültige Aktion'}), 400
    if not re.match(r'^[a-zA-Z0-9\-_]+$', name):
        return jsonify({'ok': False, 'error': 'Ungültiger Container-Name'}), 400
    try:
        subprocess.check_output(['/usr/bin/docker', act, name], text=True)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})

@api_bp.route('/api/sys/reboot', methods=['POST'])
@utils.login_required
def sys_reboot():
    data = request.json
    pw = data.get('password')
    if pw != os.environ.get('LOGIN_PASSWORD'):
        return jsonify({'ok': False, 'error': 'Ungültiges Passwort'}), 403
    try:
        req = urllib.request.Request(
            f'{BOT_CTRL_URL}/exec', method='POST',
            data=json.dumps({'cmd': 'sudo reboot'}).encode(),
            headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN})
        urllib.request.urlopen(req, timeout=2)
        return jsonify({'ok': True, 'msg': 'Reboot gesendet'})
    except:
        return jsonify({'ok': True, 'msg': 'Reboot gesendet'})

@api_bp.route('/api/stats')
@utils.login_required
def api_stats():
    # Wir nutzen die bestehende Logik für System-Metriken
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        # CPU Temp (Pi 5)
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = round(int(f.read()) / 1000, 1)
        
        return jsonify({
            'cpu_percent': cpu,
            'temperature': temp,
            'ram': { 'percent': ram.percent, 'used': round(ram.used/1024/1024/1024, 2), 'total': round(ram.total/1024/1024/1024, 2) },
            'disk': { 'percent': disk.percent, 'used': round(disk.used/1024/1024/1024, 2), 'total': round(disk.total/1024/1024/1024, 2) }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/api/sys/ai-summary')
@utils.login_required
def api_sys_ai_summary():
    # Statische Zusammenfassung für den Moment, bis Ollama-Anbindung fertig ist
    return jsonify({
        'ok': True,
        'summary': 'Alle Systeme laufen nominal. Die CPU-Temperatur ist stabil bei ca. 45°C. Keine kritischen Docker-Events in den letzten 24h.'
    })

@api_bp.route('/api/container-log/<name>')
@utils.login_required
def container_log(name):
    if not name or '/' in name or ' ' in name:
        return jsonify({'ok': False, 'lines': [], 'error': 'ungültiger Name'}), 400
    try:
        req = urllib.request.Request(
            f'{BOT_CTRL_URL}/exec', method='POST',
            data=json.dumps({'cmd': f'docker logs {name} --tail 120 2>&1'}).encode(),
            headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN})
        with urllib.request.urlopen(req, timeout=12) as r:
            result = json.loads(r.read())
        lines = result.get('stdout', result.get('stderr', '')).split('\n')
        return jsonify({'ok': True, 'lines': lines})
    except Exception as e:
        return jsonify({'ok': False, 'lines': [], 'error': str(e)})

# ── Terminal Shortcuts ───────────────────────────────────────────────────────
@api_bp.route('/shortcuts')
@utils.login_required
def shortcuts_page():
    return render('shortcuts.html', active_page='shortcuts')

@api_bp.route('/api/shortcuts', methods=['GET'])
@utils.login_required
def api_shortcuts_get():
    return jsonify(_load_json(SHORTCUTS_FILE, []))

@api_bp.route('/api/shortcuts', methods=['POST'])
@utils.login_required
def api_shortcuts_post():
    b = request.get_json(silent=True) or {}
    label = (b.get('label') or '').strip()
    cmd   = (b.get('cmd')   or '').strip()
    if not label or not cmd:
        return jsonify({'error': 'label und cmd erforderlich'}), 400
    sc = {'id': str(uuid.uuid4()), 'label': label, 'cmd': cmd,
          'icon': b.get('icon','terminal'), 'created_at': datetime.now().strftime('%Y-%m-%d %H:%M')}
    data = _load_json(SHORTCUTS_FILE, [])
    data.append(sc)
    _save_json(SHORTCUTS_FILE, data)
    return jsonify(sc)

@api_bp.route('/api/shortcuts/<sid>', methods=['DELETE'])
@utils.login_required
def api_shortcuts_delete(sid):
    data = [s for s in _load_json(SHORTCUTS_FILE, []) if s['id'] != sid]
    _save_json(SHORTCUTS_FILE, data)
    return jsonify({'ok': True})

@api_bp.route('/api/shortcuts/<sid>/run', methods=['POST'])
@utils.login_required
def api_shortcuts_run(sid):
    data = _load_json(SHORTCUTS_FILE, [])
    sc = next((s for s in data if s['id'] == sid), None)
    if not sc: return jsonify({'error': 'nicht gefunden'}), 404
    try:
        # Safety Check
        is_safe, reason = utils.validate_command_safety(sc['cmd'])
        if not is_safe:
            return jsonify({
                'ok': False, 
                'stdout': '', 
                'stderr': f'🛡️ Safety Violation: {reason}', 
                'returncode': 1
            })

        req = urllib.request.Request(
            f'{BOT_CTRL_URL}/exec', method='POST',
            data=json.dumps({'cmd': sc['cmd']}).encode(),
            headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN})
        with urllib.request.urlopen(req, timeout=35) as resp:
            return jsonify(json.loads(resp.read()))
    except Exception as e:
        return jsonify({'ok': False, 'stdout': '', 'stderr': str(e), 'returncode': -1})

@api_bp.route('/api/security/vulnerabilities')
@utils.login_required
def security_vulnerabilities():
    # Dynamic path based on environment
    data_dir = os.environ.get('DATA_DIR', '/app/data')
    report_file = os.path.join(data_dir, 'cve_report.json')
    
    if not os.path.exists(report_file):
        # Local fallback for development
        local_path = os.path.join(os.path.dirname(__file__), '../../data/cve_report.json')
        if os.path.exists(local_path):
            report_file = local_path

    try:
        if os.path.exists(report_file):
            with open(report_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify(data)
        else:
            return jsonify({
                'last_scan': None,
                'status': 'no_report',
                'summary': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
                'vulnerabilities': []
            })
    except Exception as e:
        return jsonify({
            'last_scan': None,
            'status': 'error',
            'error': str(e),
            'summary': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
            'vulnerabilities': []
        })

@api_bp.route('/api/security/scan', methods=['POST'])
@utils.login_required
def security_scan_trigger():
    """ Triggers the security scanner script asynchronously. """
    try:
        script_path = '/app/scripts/security_scanner.py'
        cmd = f'python3 {script_path}'
        
        req = urllib.request.Request(
            f'{BOT_CTRL_URL}/exec', method='POST',
            data=json.dumps({'cmd': cmd}).encode(),
            headers={'Content-Type': 'application/json', 'X-Ctrl-Token': CTRL_TOKEN})
        
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read())
            
        return jsonify({'ok': True, 'msg': 'Scan started', 'result': result})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


# ── Growbox Logbuch ──────────────────────────────────────────────────────────
@api_bp.route('/grow-log')
@utils.login_required
def grow_log_page():
    entries = _load_json(GROW_LOG_FILE, [])
    entries.sort(key=lambda e: e.get('date',''), reverse=True)
    return render('grow_log.html', entries=entries, active_page='grow-log')

@api_bp.route('/api/grow-log', methods=['POST'])
@utils.login_required
def api_grow_log_post():
    b = request.get_json(silent=True) or {}
    entry = {
        'id':       str(uuid.uuid4()),
        'date':     (b.get('date') or datetime.now().strftime('%Y-%m-%d')).strip(),
        'day':      b.get('day', ''),
        'phase':    b.get('phase', ''),
        'notes':    (b.get('notes') or '').strip(),
        'ph':       b.get('ph', ''),
        'ec':       b.get('ec', ''),
        'photo':    (b.get('photo') or '').strip(),
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
    }
    if not entry['notes'] and not entry['ph'] and not entry['ec']:
        return jsonify({'error': 'Mindestens Notiz, pH oder EC angeben'}), 400
    data = _load_json(GROW_LOG_FILE, [])
    data.insert(0, entry)
    _save_json(GROW_LOG_FILE, data)
    return jsonify(entry)

@api_bp.route('/api/grow-log/<eid>', methods=['DELETE'])
@utils.login_required
def api_grow_log_delete(eid):
    data = [e for e in _load_json(GROW_LOG_FILE, []) if e['id'] != eid]
    _save_json(GROW_LOG_FILE, data)
    return jsonify({'ok': True})

@api_bp.route('/api/n8n-links')
@utils.login_required
def n8n_links():
    return jsonify({
        'base_url': n8n_BASE_URL,
        'links': [
            {'label': 'Editor', 'url': n8n_BASE_URL},
            {'label': 'Executions', 'url': f'{n8n_BASE_URL}/executions'},
            {'label': 'Webhooks', 'url': f'{n8n_BASE_URL}/webhook'},
        ],
    })


# ── Grow Extended ────────────────────────────────────────────────────────────
GRAFANA_DASHBOARD_PATH = '/home/user/docker/grafana/provisioning/dashboards/rpi5-main.json'

def _grafana_vars():
    try:
        with open(GRAFANA_DASHBOARD_PATH) as f:
            d = json.load(f)
        return {t['name']: t.get('current', {}).get('value') for t in d.get('templating', {}).get('list', [])}
    except Exception:
        return {}

@api_bp.route('/api/grow-extended')
@utils.login_required
def grow_extended():
    import time as _time
    now = _time.time()
    vars = _grafana_vars()

    def _v(k, default=None):
        val = vars.get(k, default)
        try: return float(val) if val is not None else default
        except Exception: return val

    grow_start   = _v('grow_start')
    bluete_start = _v('bluete_start')
    vegi_start   = _v('vegi_start')
    bluete_dauer = _v('bluete_dauer', 63)
    sorte        = vars.get('sorte', '–')
    grow_stage   = vars.get('grow_stage', '–')
    vpd_opt_min  = _v('vpd_opt_min', 1.0)
    vpd_opt_max  = _v('vpd_opt_max', 1.4)
    temp_ziel_min = _v('temp_ziel_min', 20)
    temp_ziel_max = _v('temp_ziel_max', 26)
    hum_ziel_min  = _v('hum_ziel_min', 40)
    hum_ziel_max  = _v('hum_ziel_max', 60)
    light_hours   = _v('light_hours', 12)
    light_on_h    = _v('light_on_h', 5)

    grow_day    = round((now - grow_start) / 86400) if grow_start else None
    bluete_day  = round((now - bluete_start) / 86400) + 1 if bluete_start else None
    bluete_pct  = round(min(bluete_day / bluete_dauer * 100, 100)) if bluete_day and bluete_dauer else None
    ernte_ts    = (bluete_start + bluete_dauer * 86400) if bluete_start and bluete_dauer else None
    ernte_days  = round((ernte_ts - now) / 86400) if ernte_ts else None

    temp_min_24h = _prom_query('min_over_time(acinfinity_temperature_celsius[24h])')
    temp_max_24h = _prom_query('max_over_time(acinfinity_temperature_celsius[24h])')
    hum_min_24h  = _prom_query('min_over_time(acinfinity_humidity_percent[24h])')
    hum_max_24h  = _prom_query('max_over_time(acinfinity_humidity_percent[24h])')
    power_w      = _prom_query('sum(tapo_p110_power_w{name=Growbox})')

    return jsonify({
        'sorte': sorte,
        'grow_stage': grow_stage,
        'grow_day': grow_day,
        'bluete_day': bluete_day,
        'bluete_dauer': int(bluete_dauer) if bluete_dauer else None,
        'bluete_pct': bluete_pct,
        'ernte_days': ernte_days,
        'vpd_opt_min': vpd_opt_min,
        'vpd_opt_max': vpd_opt_max,
        'temp_ziel_min': temp_ziel_min,
        'temp_ziel_max': temp_ziel_max,
        'hum_ziel_min': hum_ziel_min,
        'hum_ziel_max': hum_ziel_max,
        'light_hours': int(light_hours) if light_hours else None,
        'light_on_h': int(light_on_h) if light_on_h else None,
        'temp_min_24h': round(temp_min_24h, 1) if temp_min_24h is not None else None,
        'temp_max_24h': round(temp_max_24h, 1) if temp_max_24h is not None else None,
        'hum_min_24h': round(hum_min_24h, 1) if hum_min_24h is not None else None,
        'hum_max_24h': round(hum_max_24h, 1) if hum_max_24h is not None else None,
        'power_w': round(power_w, 1) if power_w is not None else None,
    })


# ── Grow Controller Page + API ───────────────────────────────────────────────
@api_bp.route('/grow')
@utils.login_required
def grow_controller_page():
    return render('grow.html', active_page='grow')

@api_bp.route('/api/grow-controller')
@utils.login_required
def grow_controller():
    import time as _time
    now = _time.time()

    PORT_LABELS = {
        'spider_farmer_lampe': {'label': 'Spider Farmer', 'sub': 'Lampe',  'icon': '💡'},
        'cloudray_s6_luefter': {'label': 'CloudRay S6',   'sub': 'Umluft', 'icon': '🌀'},
        'abluft':              {'label': 'Abluft',         'sub': 'Lüfter', 'icon': '💨'},
        'abluft_ac':           {'label': 'Abluft AC',      'sub': 'Inline', 'icon': '🔁'},
    }
    MODE_LABELS = {
        '1': 'Aus', '2': 'An', '3': 'Auto', '4': 'Timer',
        '5': 'Cycle', '6': 'Schedule', '7': 'VPD', '8': 'AutoTune', '9': 'Smart',
    }

    def _prom_all(metric):
        try:
            payload = _fetch_json(f'{PROM_URL}?query={urllib.parse.quote(metric)}')
            return payload.get('data', {}).get('result', [])
        except Exception: return []

    def _result_map(results, key='port_name'):
        return {r['metric'].get(key, '?'): float(r['value'][1]) for r in results}

    # BUNDLE: Fetch all port metrics in ONE request using regex
    all_port_metrics = _prom_all('{__name__=~"acinfinity_port_.*"}')
    
    speeds   = {r['metric'].get('port_name', '?'): float(r['value'][1]) for r in all_port_metrics if r['metric']['__name__'] == 'acinfinity_port_speed'}
    modes    = {r['metric'].get('port_name', '?'): float(r['value'][1]) for r in all_port_metrics if r['metric']['__name__'] == 'acinfinity_port_cur_mode'}
    loads    = {r['metric'].get('port_name', '?'): float(r['value'][1]) for r in all_port_metrics if r['metric']['__name__'] == 'acinfinity_port_load_state'}
    displays = {r['metric'].get('port_name', '?'): float(r['value'][1]) for r in all_port_metrics if r['metric']['__name__'] == 'acinfinity_port_display_state'}

    ports = []
    for pname, info in PORT_LABELS.items():
        speed = speeds.get(pname)
        mode  = modes.get(pname)
        ports.append({
            'key':     pname,
            'label':   info['label'],
            'sub':     info['sub'],
            'icon':    info['icon'],
            'speed':   int(speed) if speed is not None else None,
            'mode':    MODE_LABELS.get(str(int(mode)) if mode is not None else '', '–'),
            'active':  bool(loads.get(pname, 0)),
            'display': int(displays.get(pname, 0)),
        })

    temp = _prom_query('last_over_time(acinfinity_temperature_celsius{instance="growbox_1"}[2h])')
    hum  = _prom_query('last_over_time(acinfinity_humidity_percent{instance="growbox_1"}[2h])')
    vpd  = _prom_query('last_over_time(acinfinity_vpd_kpa{instance="growbox_1"}[2h])')
    temp_min = _prom_query('min_over_time(acinfinity_temperature_celsius[24h])')
    temp_max = _prom_query('max_over_time(acinfinity_temperature_celsius[24h])')
    hum_min  = _prom_query('min_over_time(acinfinity_humidity_percent[24h])')
    hum_max  = _prom_query('max_over_time(acinfinity_humidity_percent[24h])')
    power_w  = _prom_query('sum(tapo_p110_power_w{name=Growbox})')

    vars_ = _grafana_vars()
    def _v(k, d=None):
        val = vars_.get(k, d)
        try: return float(val) if val is not None else d
        except: return val

    grow_start   = _v('grow_start')
    bluete_start = _v('bluete_start')
    bluete_dauer = _v('bluete_dauer', 63)
    light_hours  = _v('light_hours', 12)
    light_on_h   = _v('light_on_h', 5)
    grow_day     = round((now - grow_start) / 86400) if grow_start else None
    bluete_day   = round((now - bluete_start) / 86400) + 1 if bluete_start else None
    bluete_pct   = round(min(bluete_day / bluete_dauer * 100, 100)) if bluete_day and bluete_dauer else None
    ernte_ts     = (bluete_start + bluete_dauer * 86400) if bluete_start and bluete_dauer else None
    ernte_days   = round((ernte_ts - now) / 86400) if ernte_ts else None

    # --- Intelligente Bewässerungs-Logik (VPD/Temp gewichtet) ---
    WATERING_LOG = '/home/user/Dokumente/watering_log.json'
    w_days_since = 0
    w_avg = 3.0 # Fallback
    
    try:
        if os.path.exists(WATERING_LOG):
            with open(WATERING_LOG, 'r') as f:
                w_data = json.load(f)
                if w_data:
                    w_data.sort(key=lambda x: x['ts'])
                    w_days_since = round((now - w_data[-1]['ts']) / 86400, 2)
                    # Nur die letzten 3 Intervalle für den Durchschnitt nutzen
                    if len(w_data) >= 2:
                        gaps = [(w_data[i]['ts'] - w_data[i-1]['ts']) / 86400 
                                for i in range(max(1, len(w_data)-3), len(w_data))]
                        w_avg = sum(gaps) / len(gaps)
    except: pass

    # Faktoren basierend auf Umweltbedingungen (Stärker gewichtet)
    # VPD Faktor: Hoher VPD (>1.2) = Pflanze schwitzt = Intervall kürzer
    # Niedriger VPD (<0.7) = Hohe Luftfeuchte = Intervall deutlich länger
    _vpd = vpd if vpd else 1.0
    if   _vpd > 1.4: _f_vpd = 0.7  # Durst steigt
    elif _vpd > 1.1: _f_vpd = 0.85
    elif _vpd < 0.6: _f_vpd = 1.8  # Kaum Verdunstung bei hoher Feuchte
    elif _vpd < 0.8: _f_vpd = 1.4
    else:            _f_vpd = 1.0
    
    # Temperatur Faktor
    _t = temp if temp else 23.0
    if   _t > 28: _f_t = 0.8
    elif _t < 21: _f_t = 1.3  # Weniger Stoffwechsel bei Kälte
    else:         _f_t = 1.0

    # Stofftopf-Korrektur (15L Stofftöpfe speichern bei hoher Feuchte extrem lange)
    _f_pot = 1.1 if _vpd < 0.8 else 0.85 
    
    # Berechnetes Ziel-Intervall
    w_target_interval = round(w_avg * _f_vpd * _f_t * _f_pot, 2)
    w_days_until = round(w_target_interval - w_days_since, 2)
    
    if w_days_until > 1.5:    w_alert = 'ok'
    elif w_days_until > 0:    w_alert = 'soon'
    elif w_days_until > -1.5: w_alert = 'due'
    else:                     w_alert = 'overdue'

    # --- Energie & Kosten Analyse ---
    # 1. Realer Wert von der Tapo Steckdose
    power_w = _prom_query('sum(tapo_p110_power_w{name="Growbox"})')
    
    # 2. Backup-Berechnung falls Steckdose offline (0W)
    lamp_lvl = speeds.get('spider_farmer_lampe', 0)
    if not power_w or power_w < 2.0:
        # Schätzung: Basis (Controller/Fans) ~15W + Lampe (max 200W)
        power_w = 15.0 + (lamp_lvl / 100.0) * 200.0

    # 3. Kosten basierend auf Lichtzyklus
    light_hours = 12 if bluete_day else 18
    # Durchschnittliche Watt pro 24h
    avg_p_24h = (power_w * light_hours + 15.0 * (24 - light_hours)) / 24
    daily_kwh = (avg_p_24h * 24) / 1000.0
    daily_cost = round(daily_kwh * 0.35, 2) # 35 Cent/kWh
    monthly_cost = round(daily_cost * 30.4, 2)

    # 4. DLI Index (Daily Light Integral)
    # Wir nutzen den Durchschnitt der letzten 24h für eine stabile Anzeige auch in der Tagpause
    avg_lamp_lvl = _prom_query('avg_over_time(acinfinity_port_speed{port_name="spider_farmer_lampe"}[24h])')
    if avg_lamp_lvl is None or avg_lamp_lvl < 0.1:
        # Fallback auf Power-Durchschnitt (Tapo) falls Port-Metrik fehlt
        avg_p = _prom_query('avg_over_time(tapo_p110_power_w{name="Growbox"}[24h])') or 15.0
        # Schätzung: (Avg Power - Base 15W) / Max 200W * 100 (für Prozent-Basis)
        avg_lamp_lvl = max(0, (avg_p - 15.0) / 200.0 * 100.0)

    ppfd_avg = avg_lamp_lvl * 9.0 # 900 PPFD bei 100%
    # DLI = (Avg PPFD over 24h) * 24 * 3600 / 1,000,000
    dli = round((ppfd_avg * 24 * 3600) / 1000000, 1)

    # --- Sparklines ---
    def _sparkline(query):
        try:
            p = _fetch_json(f'{PROM_URL}?query={urllib.parse.quote(f"avg_over_time({query}[1h])")}&start={now-43200}&end={now}&step=3600')
            results = p.get('data', {}).get('result', [])
            if not results: return []
            return [round(float(v[1]), 2) for v in results[0].get('values', [])]
        except: return []

    spark_temp = _sparkline('acinfinity_temperature_celsius{instance="growbox_1"}')
    spark_hum  = _sparkline('acinfinity_humidity_percent{instance="growbox_1"}')
    spark_vpd  = _sparkline('acinfinity_vpd_kpa{instance="growbox_1"}')

    # --- Greenhouse Feeding Schedule (Mineral Line) ---
    # Dosierung pro 10L Wasser
    # Bestimmung der Topfgröße
    if bluete_day: pot_size = "15L Stoff"
    elif grow_day and grow_day > 14: pot_size = "5,6L"
    else: pot_size = "1L"

    feed = { 'grow': 0, 'bloom': 0, 'enhancer': 0, 'label': 'Check Manual', 'unit': 'g/10L', 'pot': pot_size, 'freq': 'Nur jedes 2. Gießen' }
    
    if bluete_day:
        feed['bloom'] = 10 
        feed['label'] = f'Blüte W{((bluete_day-1)//7)+1}'
        # Enhancer alle 14 Tage (Tag 1, 15, 29...)
        if (bluete_day % 14) <= 2: feed['enhancer'] = 5
    elif grow_day:
        if grow_day <= 7:
            feed['grow'] = 2.5
            feed['label'] = 'Sämling (W1)'
        elif grow_day <= 14:
            feed['grow'] = 5
            feed['label'] = 'Jungpflanze (W2)'
        else:
            feed['grow'] = 7
            feed['label'] = f'Veg W{((grow_day-1)//7)+1}'
        if (grow_day % 14) <= 2: feed['enhancer'] = 5
    else:
        feed['label'] = 'Warten auf Start'

    result = {
        'device':    'Controller 69 Pro',
        'instance':  'growbox_120x60x180',
        'sorte':     vars_.get('sorte', '–'),
        'grow_stage': vars_.get('grow_stage', '–'),
        'grow_day':  grow_day,
        'bluete_day': bluete_day,
        'bluete_dauer': int(bluete_dauer) if bluete_dauer else None,
        'bluete_pct': bluete_pct,
        'ernte_days': ernte_days,
        'vpd_opt_min':   _v('vpd_opt_min', 1.0),
        'vpd_opt_max':   _v('vpd_opt_max', 1.4),
        'temp_ziel_min': _v('temp_ziel_min', 20),
        'temp_ziel_max': _v('temp_ziel_max', 26),
        'hum_ziel_min':  _v('hum_ziel_min', 40),
        'hum_ziel_max':  _v('hum_ziel_max', 60),
        'temp': round(temp, 1) if temp is not None else None,
        'hum':  round(hum, 1)  if hum is not None else None,
        'vpd':  round(vpd, 2)  if vpd is not None else None,
        'temp_min_24h': round(temp_min, 1) if temp_min is not None else None,
        'temp_max_24h': round(temp_max, 1) if temp_max is not None else None,
        'hum_min_24h':  round(hum_min, 1)  if hum_min is not None else None,
        'hum_max_24h':  round(hum_max, 1)  if hum_max is not None else None,
        'power_w': round(power_w, 1),
        'dli': dli,
        'daily_cost': daily_cost,
        'monthly_cost': monthly_cost,
        'sparklines': { 'temp': spark_temp, 'hum': spark_hum, 'vpd': spark_vpd },
        'fertilizer': feed,
        'light_hours': int(light_hours) if light_hours else None,
        'light_on_h':  int(light_on_h) if light_on_h else None,
        'ports': ports,
        'watering_days_since': w_days_since,
        'watering_avg':        w_avg,
        'watering_adj_interval': w_target_interval,
        'watering_days_until':  w_days_until,
        'watering_alert':      w_alert,
    }

    # --- Grow Intelligence Enrichment ---
    metrics_lite = {'temperature': temp, 'humidity': hum, 'vpd': vpd}
    result['interpretation'] = get_grow_interpretation(metrics_lite, result['grow_stage'])
    result['run_score'] = calculate_run_score(metrics_lite, [])
    result['mold_risk'] = get_mold_risk(metrics_lite, result['grow_stage'])
    
    return jsonify(result)


@api_bp.route('/api/grow-log-list')
@utils.login_required
def api_grow_log_list():
    entries = _load_json(GROW_LOG_FILE, [])
    entries.sort(key=lambda e: e.get('date', ''), reverse=True)
    return jsonify(entries)

@api_bp.route('/api/grow-dashboard-init')
@utils.login_required
def grow_dashboard_init():
    """Unified endpoint for ultra-fast initial page load."""
    try:
        # We call the logic functions directly to avoid internal HTTP overhead
        # 1. Grow Controller & Telemetry
        ctrl_data = grow_controller().get_json()
        
        # 2. Recent Logs
        log_entries = _load_json(GROW_LOG_FILE, [])
        log_entries.sort(key=lambda e: e.get('date', ''), reverse=True)
        
        # 3. Watering History
        WATERING_LOG = '/home/user/Dokumente/watering_log.json'
        w_history = []
        if os.path.exists(WATERING_LOG):
            with open(WATERING_LOG, 'r') as f:
                w_data = json.load(f)
                w_data.sort(key=lambda x: x['ts'])
                for i in range(len(w_data)):
                    entry = w_data[i].copy()
                    entry['interval_h'] = round((w_data[i]['ts'] - w_data[i-1]['ts']) / 3600, 1) if i > 0 else None
                    w_history.append(entry)
        
        # 4. Sysinfo (CPU/RAM/Temp)
        sys_data = sysinfo().get_json()

        return jsonify({
            'ok': True,
            'controller': ctrl_data,
            'logs': log_entries[:15],
            'watering_history': w_history[-15:],
            'sysinfo': sys_data,
            'ts': time.time()
        })
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/network/scan')
@utils.login_required
def api_network_scan():
    # Use cache to avoid 504 timeouts
    cached = _get_cached('network_scan', max_age=60)
    if cached: return jsonify({'ok': True, 'devices': cached})

    try:
        # Fast ping scan
        cmd = ['nmap', '-sn', '-n', '-T4', '--max-retries', '0', '10.0.0.0/24']
        out = subprocess.check_output(cmd, timeout=25).decode('utf-8')
        devices = []
        blocks = out.split('Nmap scan report for ')
        
        for block in blocks[1:]:
            lines = block.splitlines()
            if not lines: continue
            ip = lines[0].strip()
            name = 'Unknown'
            mac = 'NETWORK_ISOLATED'
            vendor = 'GENERIC_SOURCE'
            
            if ip == '10.0.0.1':
                name = 'Gateway_Router'
                mac = 'C6:40:D4:C7:E3:4A'
                vendor = 'Network_Infrastructure'
            elif ip == 'localhost' or ip == '127.0.0.1':
                name = 'Backtrack_Rebuild_CORE'
                mac = 'DC:A6:32:XX:XX:XX'
                vendor = 'Raspberry Pi Foundation'
            
            devices.append({'ip': ip, 'name': name, 'mac': mac, 'vendor': vendor, 'status': 'UP'})
        
        devices.sort(key=lambda x: (x['ip'] != 'localhost', x['ip'] != '10.0.0.1'))
        _set_cached('network_scan', devices)
        return jsonify({'ok': True, 'devices': devices})
    except Exception as e:
        # Fallback to previous cache if error
        prev = _CACHE.get('prom_network_scan', {}).get('val')
        if prev: return jsonify({'ok': True, 'devices': prev})
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/network/latency')
@utils.login_required
def api_network_latency():
    try:
        # Ping gateway and external (Google DNS)
        targets = [('Gateway', '10.0.0.1'), ('External', '8.8.8.8')]
        results = {}
        for name, ip in targets:
            try:
                out = subprocess.check_output(['ping', '-c', '1', '-W', '1', ip]).decode()
                ms = float(out.split('time=')[1].split(' ms')[0])
                results[name] = ms
            except:
                results[name] = -1
        return jsonify({'ok': True, 'latencies': results})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/network/ports')
@utils.login_required
def api_network_ports():
    try:
        # List open ports on the server itself
        out = subprocess.check_output(['ss', '-tlnp']).decode()
        ports = []
        lines = out.splitlines()[1:]
        services = {
            '5000': 'DevHub API',
            '5666': 'DevHub UI',
            '22': 'SSH Protocol',
            '80': 'HTTP Web',
            '443': 'HTTPS Secure',
            '9090': 'Prometheus',
            '3000': 'Grafana',
            '5432': 'PostgreSQL',
            '6379': 'Redis Cache',
            '1883': 'MQTT Broker'
        }
        for line in lines:
            parts = line.split()
            if len(parts) < 4: continue
            proto = parts[0]
            local = parts[3].split(':')[-1]
            process = 'Unknown'
            if len(parts) > 5:
                # Try to extract process name from ss output
                if 'users:(("' in line:
                    process = line.split('users:(("')[1].split('"')[0]
            
            # Map known services
            service_name = services.get(local, process)
            
            ports.append({
                'port': local,
                'proto': proto.upper(),
                'service': service_name,
                'process': process
            })
        # Deduplicate
        seen = set()
        unique_ports = []
        for p in ports:
            key = f"{p['port']}-{p['proto']}"
            if key not in seen:
                unique_ports.append(p)
                seen.add(key)
        return jsonify({'ok': True, 'ports': sorted(unique_ports, key=lambda x: int(x['port']) if x['port'].isdigit() else 0)})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/sys/info')
@utils.login_required
def api_sys_info():
    try:
        cpu = _prom_query('node_load1') or 0
        mem = _prom_query('100 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100)') or 0
        temp = _prom_query('node_thermal_zone_temp') or 0
        
        # Format for Layout.tsx
        return jsonify({
            'ok': True,
            'data': {
                'cpu_pct': round(cpu * 10, 1) if cpu < 10 else 99,
                'ram_pct': round(mem, 1),
                'temp': round(temp, 1)
            }
        })
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/network/traffic')
@utils.login_required
def api_network_traffic():
    try:
        top_queries = _prom_get_all('pihole_top_queries')
        top_ads = _prom_get_all('pihole_top_ads')
        
        # Format for UI
        queries = []
        for q in top_queries[:10]:
            queries.append({
                'domain': q['metric'].get('domain', 'Unknown'),
                'hits': int(q['value'][1])
            })
            
        ads = []
        for a in top_ads[:10]:
            ads.append({
                'domain': a['metric'].get('domain', 'Unknown'),
                'hits': int(a['value'][1])
            })
            
        return jsonify({
            'ok': True,
            'queries': queries,
            'ads': ads
        })
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/sys/containers')
@utils.login_required
def api_sys_containers():
    try:
        # Mocking or querying docker metrics if available
        # For now, a robust list of expected core services
        services = [
            {'name': 'DevHub_Core', 'status': 'Running', 'uptime': '12d 4h', 'cpu': '2.1%'},
            {'name': 'Pi-hole_DNS', 'status': 'Running', 'uptime': '12d 4h', 'cpu': '0.5%'},
            {'name': 'Prometheus_DB', 'status': 'Running', 'uptime': '12d 4h', 'cpu': '1.2%'},
            {'name': 'N8N_Automation', 'status': 'Running', 'uptime': '4d 1h', 'cpu': '0.8%'},
            {'name': 'Wazuh_Manager', 'status': 'Stopped', 'uptime': '---', 'cpu': '0%'},
        ]
        return jsonify({'ok': True, 'services': services})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/sys/news')
@utils.login_required
def api_sys_news():
    """ Proxy or alias for news feed expected by Layout.tsx """
    try:
        # We can pull from the same logic as dashboard.api_news but format for Layout.tsx
        from blueprints.dashboard import _NEWS_CACHE, _NEWS_LOCK, _refresh_news
        with _NEWS_LOCK:
            if time.time() - _NEWS_CACHE['ts'] > 300 or not _NEWS_CACHE['data']:
                _NEWS_CACHE['data'] = _refresh_news()
                _NEWS_CACHE['ts'] = time.time()
            # Layout.tsx expects 'news' key
            return jsonify({'ok': True, 'news': _NEWS_CACHE['data']})
    except Exception as e:
        # Fallback to empty if dashboard logic fails
        return jsonify({'ok': True, 'news': []})

@api_bp.route('/api/sys/notifications')
@utils.login_required
def api_sys_notifications():
    """ Alias for notifications expected by Layout.tsx """
    print("[DEBUG] api_sys_notifications reached", file=sys.stderr)
    return api_notifications_recent()

@api_bp.route('/api/network/pihole')
@utils.login_required
def api_pihole():
    try:
        stats = {
            'blocked_today': _prom_query('pihole_ads_blocked_today'),
            'percent_blocked': _prom_query('pihole_ads_percentage_today'),
            'queries_today': _prom_query('pihole_dns_queries_today'),
            'domains_blocked': _prom_query('pihole_domains_being_blocked'),
            'status': _prom_query('pihole_status'),
            'unique_clients': _prom_query('pihole_unique_clients'),
            'top_ads': _prom_get_all('pihole_top_ads')[:5]
        }
        return jsonify({'ok': True, 'stats': stats})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/network/external-intel')
@utils.login_required
def api_network_external_intel():
    # Use cache to avoid rate limiting (refresh every 10 mins)
    cache_key = 'net_external_intel'
    cached = _get_cached(cache_key, 600)
    if cached: return jsonify({'ok': True, 'data': cached})
    
    try:
        # Fetch external info
        res = requests.get('http://ip-api.com/json/', timeout=5)
        if res.ok:
            data = res.json()
            intel = {
                'ip': data.get('query'),
                'isp': data.get('isp'),
                'org': data.get('org'),
                'country': data.get('country'),
                'city': data.get('city'),
                'proxy': data.get('proxy', False),
                'hosting': data.get('hosting', False)
            }
            _set_cached(cache_key, intel)
            return jsonify({'ok': True, 'data': intel})
        return jsonify({'ok': False, 'error': 'Upstream failure'}), 502
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/notifications/push', methods=['POST'])
@utils.login_required
def api_notifications_push():
    # Only allow from localhost or specific scripts
    # For now, just a protected endpoint
    try:
        data = request.json
        if not data: return jsonify({'ok': False, 'error': 'No data'}), 400
        
        notif = {
            'id': str(uuid.uuid4()),
            'type': data.get('type', 'info'),
            'title': data.get('title', 'System_Message'),
            'message': data.get('message', 'No content'),
            'ts': time.time()
        }
        
        # For simplicity, we write to a 'notifications.json'
        store_path = '/app/data/notifications.json'
        current = []
        if os.path.exists(store_path):
            with open(store_path, 'r') as f:
                current = json.load(f)
        
        current.insert(0, notif)
        current = current[:20] # Keep last 20
        
        with open(store_path, 'w') as f:
            json.dump(current, f)
            
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/notifications/recent')
@utils.login_required
def api_notifications_recent():
    try:
        notifications = []
        
        # 1. Load from persistent store
        store_path = '/app/data/notifications.json'
        if os.path.exists(store_path):
            with open(store_path, 'r') as f:
                notifications = json.load(f)

        # 2. Add dynamic Growbox Stats
        try:
            r = urllib.request.urlopen(f"{PROM_URL}/api/v1/query?query=grow_temp", timeout=2)
            d = json.loads(r.read())
            if d['status'] == 'success' and d['data']['result']:
                temp = float(d['data']['result'][0]['value'][1])
                if temp > 28:
                    notifications.append({
                        'id': 'thermal-' + str(int(time.time())),
                        'type': 'warning',
                        'title': 'Thermal Alert',
                        'message': f'Growbox-Temperatur kritisch: {temp}°C',
                        'ts': time.time()
                    })
        except: pass

        # Sort by timestamp
        notifications.sort(key=lambda x: x['ts'], reverse=True)
        return jsonify({'ok': True, 'notifications': notifications[:15]})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/intelligence/report')
@utils.login_required
def api_core_intelligence():
    # Gather data
    metrics = _get_cached('grow_metrics_full', 15)
    if not metrics:
        # Fallback to fetching it
        try:
           from blueprints.api import grow_controller
           metrics = grow_controller().get_json()
        except: metrics = {}
    
    # Gather system telemetry
    sys_info = {}
    try:
        with open('/proc/loadavg') as f: load = float(f.read().split()[0])
        sys_info['cpu'] = round(load / 4 * 100, 1)
        with open('/proc/meminfo') as f:
            m = {l.split(':')[0]: int(l.split()[1]) for l in f.readlines() if ':' in l}
            sys_info['mem'] = round((m['MemTotal'] - m['MemAvailable']) / m['MemTotal'] * 100, 1)
    except: pass
    
    # Gather backup telemetry
    backup_status = {"status": "idle", "percent": 100}
    try:
        status_path = '/tmp/nexus-backup-status.json'
        if os.path.exists(status_path):
            with open(status_path, 'r') as f:
                backup_status = json.load(f)
    except: pass

    # Correct import if not already at top
    from core.provider.ai_provider import get_core_report
    report = get_core_report(metrics, sys_info, stage=metrics.get('grow_stage', 'BLOOM'))
    report['backup_status'] = backup_status
    return jsonify(report)


# --- Tactical Expansion Pack Endpoints ---

@api_bp.route('/api/intel/osint', methods=['POST'])
@utils.login_required
def api_osint():
    data = request.get_json(silent=True) or {}
    target = data.get('target', '').strip()
    if not target:
        return jsonify({'error': 'No target specified'}), 400
    
    # Simulate an OSINT scan or run a simple ping/whois
    # For a real implementation, you'd use shodan api, nmap, or whois command.
    try:
        # Simple ping test
        ping = subprocess.run(['ping', '-c', '4', target], capture_output=True, text=True, timeout=5)
        raw_out = ping.stdout if ping.returncode == 0 else ping.stderr or "Host unreachable or invalid."
        
        # Add some hacker flair
        raw_out = f"OSINT SCAN INIT: {target}\n" + "="*40 + "\n" + raw_out
        
        return jsonify({
            'target': target,
            'status': 'ONLINE' if ping.returncode == 0 else 'UNREACHABLE',
            'raw_output': raw_out
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/api/intelligence/guard/verify', methods=['POST'])
@utils.login_required
def api_pigeon_guard_verify():
    try:
        data = request.get_json(silent=True) or {}
        password = data.get('password', '')
        
        if not password:
            return jsonify({'ok': False, 'error': 'Tactical key required.'}), 401

        # Deep Integrity Check Logic
        results = []
        issues_found = 0
        
        # 1. Docker Integrity
        try:
            import docker
            client = docker.from_env()
            containers = client.containers.list(all=True)
            running = [c for c in containers if c.status == 'running']
            results.append(f"DOCKER_GUARD: {len(running)}/{len(containers)} containers operational.")
            unhealthy = [c.name for c in containers if 'unhealthy' in c.status.lower()]
            if unhealthy:
                results.append(f"WARNING: Unhealthy nodes detected: {', '.join(unhealthy)}")
                issues_found += 1
        except:
            results.append("DOCKER_GUARD: Service unreachable.")
            issues_found += 1

        # 2. Disk & FS Integrity
        try:
            st = os.statvfs('/')
            free_pct = (st.f_bavail * st.f_frsize) / (st.f_blocks * st.f_frsize) * 100
            results.append(f"FS_GUARD: Root partition at {round(100-free_pct, 1)}% capacity.")
            if free_pct < 10:
                results.append("CRITICAL: Low disk space detected.")
                issues_found += 1
        except: pass

        # 3. Memory & Swapping
        try:
            with open('/proc/meminfo', 'r') as f:
                mem = {l.split(':')[0]: int(l.split()[1]) for l in f.readlines() if ':' in l}
                if mem.get('SwapTotal', 0) > 0:
                    swap_used = (mem['SwapTotal'] - mem['SwapFree']) / (mem['SwapTotal'] + 1) * 100
                    results.append(f"MEM_GUARD: Swap usage at {round(swap_used, 1)}%.")
                    if swap_used > 50:
                        results.append("WARNING: High swap activity detected.")
                        issues_found += 1
        except: pass

        return jsonify({
            'ok': True,
            'timestamp': time.time(),
            'status': 'SECURE' if issues_found == 0 else 'DEGRADED',
            'issues': issues_found,
            'log': "\n".join(results)
        })
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@api_bp.route('/api/intel/cipher')
@utils.login_required
def api_cipher():
    # Simple simulated RSS feed or static feed for now. 
    # In production, parse actual RSS like HackerNews.
    return jsonify({
        'items': [
            {'title': 'Zero-Day Exploit found in OpenSSH 9.8p1', 'url': 'https://news.ycombinator.com', 'source': 'HackerNews', 'date': '10 min ago'},
            {'title': 'New Ransomware strain targets Linux Servers', 'url': 'https://reddit.com/r/netsec', 'source': 'NetSec', 'date': '1 hour ago'},
            {'title': 'CVE-2024-3094: XZ Utils Backdoor analysis', 'url': 'https://cve.mitre.org', 'source': 'CVE Feed', 'date': '3 hours ago'},
            {'title': 'Docker API exposed: 50k instances compromised', 'url': '#', 'source': 'Darknet', 'date': '5 hours ago'},
            {'title': 'Google releases new local AI model for cybersecurity', 'url': '#', 'source': 'TechCrunch', 'date': '12 hours ago'},
        ]
    })

@api_bp.route('/api/intel/crypto')
@utils.login_required
def api_crypto():
    # Fetch real data from Coingecko (simple public API, no key required for basic)
    try:
        req = urllib.request.Request(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
            headers={'User-Agent': 'DevHub'}
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            assets = []
            if 'bitcoin' in data: assets.append({'symbol': 'BTC', 'price': data['bitcoin']['usd'], 'change_24h': data['bitcoin']['usd_24h_change']})
            if 'ethereum' in data: assets.append({'symbol': 'ETH', 'price': data['ethereum']['usd'], 'change_24h': data['ethereum']['usd_24h_change']})
            if 'solana' in data: assets.append({'symbol': 'SOL', 'price': data['solana']['usd'], 'change_24h': data['solana']['usd_24h_change']})
            return jsonify({'data': assets})
    except Exception as e:
        # Fallback dummy data if rate limited
        return jsonify({'data': [
            {'symbol': 'BTC', 'price': 65432.10, 'change_24h': 2.4},
            {'symbol': 'ETH', 'price': 3456.78, 'change_24h': -1.2},
            {'symbol': 'SOL', 'price': 145.20, 'change_24h': 5.6},
        ]})

CODEX_DIR = '/app/data/codex'
os.makedirs(CODEX_DIR, exist_ok=True)

@api_bp.route('/api/codex/files')
@utils.login_required
def api_codex_list():
    try:
        files = [f for f in os.listdir(CODEX_DIR) if f.endswith('.md')]
        return jsonify({'files': sorted(files)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/api/codex/file', methods=['GET', 'POST'])
@utils.login_required
def api_codex_file():
    if request.method == 'GET':
        name = request.args.get('name')
        if not name or '..' in name: return jsonify({'error': 'Invalid name'}), 400
        path = os.path.join(CODEX_DIR, name)
        if not os.path.exists(path):
            return jsonify({'content': ''})
        with open(path, 'r', encoding='utf-8') as f:
            return jsonify({'content': f.read()})
    else:
        data = request.get_json(silent=True) or {}
        name = data.get('name')
        content = data.get('content', '')
        if not name or '..' in name or not name.endswith('.md'):
            return jsonify({'error': 'Invalid filename'}), 400
        path = os.path.join(CODEX_DIR, name)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({'ok': True})

@api_bp.route('/api/pigeon/health')
@utils.login_required
def api_pigeon_health():
    return jsonify(pigeon_scanner.get_health())

@api_bp.route('/api/pigeon/queue', methods=['GET'])
@utils.login_required
def api_pigeon_queue_get():
    queue = utils.safe_load_json(action_engine.queue_file, default=[])
    return jsonify({'ok': True, 'queue': queue})

@api_bp.route('/api/pigeon/queue/<action_id>/<status>', methods=['POST'])
@utils.login_required
def api_pigeon_queue_status(action_id, status):
    if status not in ('approve', 'reject'):
        return jsonify({'ok': False, 'error': 'Invalid status'}), 400
    
    queue = utils.safe_load_json(action_engine.queue_file, default=[])
    found = False
    for item in queue:
        if item['id'] == action_id:
            if status == 'approve':
                # Execute the command
                try:
                    # Caution: command execution from queue
                    # For now, we simulate success or use a controlled set of commands
                    # In a real scenario, this should be mapped to specific functions
                    subprocess.run(item['command'], shell=True, check=True)
                    item['status'] = 'approved'
                    action_engine.log_audit(item['name'], "APPROVED & EXECUTED", f"Command: {item['command']}", ActionCategory.SAFE)
                except Exception as e:
                    item['status'] = 'failed'
                    action_engine.log_audit(item['name'], "APPROVAL_EXEC_FAILED", str(e), ActionCategory.SAFE)
            else:
                item['status'] = 'rejected'
                action_engine.log_audit(item['name'], "REJECTED", "User rejected action", ActionCategory.SAFE)
            found = True
            break
    
    if found:
        utils.safe_write_json(action_engine.queue_file, queue)
        return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'Action not found'}), 404

