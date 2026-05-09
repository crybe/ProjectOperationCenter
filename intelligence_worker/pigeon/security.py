import os
import json
import re
from datetime import datetime, timedelta
from core.config import Config
from core.utils import safe_load_json, safe_write_json

def check_security_audit():
    """ Scans nexus_events.jsonl for brute force attempts and manages bans. """
    events_file = Config.NEXUS_EVENTS_LOG
    failed_count = 0
    new_bans = []
    ip_fails = {}
    
    try:
        if os.path.exists(events_file):
            with open(events_file, 'r', encoding='utf-8') as f:
                # Letzte 500 Events prüfen
                lines = f.readlines()[-500:]
                cutoff = datetime.now() - timedelta(hours=1)
                
                for line in lines:
                    try:
                        ev = json.loads(line)
                        ev_ts = datetime.fromisoformat(ev['timestamp'])
                        if ev_ts > cutoff and ev['name'] == 'login_failed':
                            failed_count += 1
                            # IP extrahieren aus details: "Versuch: user von 192..."
                            m = re.search(r'von ([\d\.]+)', ev['data'].get('details', ''))
                            if m:
                                ip = m.group(1)
                                ip_fails[ip] = ip_fails.get(ip, 0) + 1
                    except: continue
        
        # Autonome Bann-Entscheidung & Expiry Cleanup
        banned_data = safe_load_json(Config.BANNED_IPS_FILE, default=[])
        now_dt = datetime.now()
        modified = False
        
        # Track usernames per IP
        ip_usernames = {}
        for ip in ip_fails:
            try:
                with open(events_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()[-300:]
                    for line in lines:
                        ev = json.loads(line)
                        if ev['name'] == 'login_failed' and f"von {ip}" in ev['data'].get('details', ''):
                            m = re.search(r'Versuch: (.*?) von', ev['data'].get('details', ''))
                            if m:
                                user = m.group(1)
                                ip_usernames.setdefault(ip, set()).add(user)
            except: continue

        # Filter expired bans
        original_len = len(banned_data)
        banned_data = [
            b for b in banned_data 
            if isinstance(b, dict) and (not b.get('expiry') or datetime.fromisoformat(b['expiry']) > now_dt)
        ]
        if len(banned_data) < original_len:
            modified = True

        # Add new bans
        banned_ips = [b['ip'] for b in banned_data if isinstance(b, dict)]
        for ip, count in ip_fails.items():
            if count >= 5 and ip not in banned_ips:
                expiry = (now_dt + timedelta(hours=24)).isoformat()
                users = list(ip_usernames.get(ip, set()))[:3]
                banned_data.append({
                    "ip": ip, 
                    "expiry": expiry, 
                    "reason": "Brute Force Detected",
                    "attempts": count,
                    "targets": users
                })
                new_bans.append(ip)
                modified = True
        
        if modified:
            safe_write_json(Config.BANNED_IPS_FILE, banned_data)
            
    except: pass
    return {'failed_count': failed_count, 'new_bans': new_bans}
