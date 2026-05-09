import os
import subprocess
import requests
import hmac
from flask import Blueprint, jsonify, request, session, current_app
from core.utils import login_required, log_action, validate_command_safety, safe_load_json
from core.event_system import events, EventSeverity, EventType, EventSource
from core.errors import ExecutionError, ValidationError
from core.models import User, db

system_api_bp = Blueprint('system_api', __name__)

# Action Mapping Configuration
# For a single developer hub, this mapping can be extended easily.
ACTION_MAPPING = {
    "restart_service": {"type": "script", "command": "/usr/bin/sudo /usr/bin/systemctl restart {service}"},
    "trigger_n8n": {"type": "webhook", "url": "http://n8n:5678/webhook/{slug}"},
    "backup_db": {"type": "script", "command": "/app/scripts/devops/backup_devhub.sh"},
}

@system_api_bp.route('/api/execute/<action>', methods=['POST'])
@login_required
def execute_action(action):
    """
    Unified execution interface.
    No direct script execution outside this layer.
    """
    config = ACTION_MAPPING.get(action)
    if not config:
        return jsonify({"status": "error", "message": f"Action '{action}' not defined"}), 404

    params = request.json or {}
    
    events.emit(
        name="execution_triggered",
        module="execution",
        event_type=EventType.ACTION,
        source=EventSource.API,
        data={"action": action, "params": params}
    )

    try:
        if config["type"] == "script":
            cmd = config["command"].format(**params)
            
            # Safety Check
            is_safe, reason = validate_command_safety(cmd)
            if not is_safe:
                raise ValidationError(f"Command Safety Check failed: {reason}", "execution")

            # Safe execution with timeout
            result = subprocess.run(cmd.split(), capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                raise ExecutionError(f"Script failed: {result.stderr}", "execution", "critical", {"action": action})
            output = result.stdout
        
        elif config["type"] == "webhook":
            url = config["url"].format(**params)
            resp = requests.post(url, json=params, timeout=10)
            resp.raise_for_status()
            output = resp.json()
        
        else:
            raise ValidationError("Unknown execution type", "execution")

        events.emit(
            name="execution_success",
            module="execution",
            event_type=EventType.EVENT,
            data={"action": action, "output": output}
        )
        return jsonify({"status": "success", "output": output})

    except Exception as e:
        events.emit(
            name="execution_failed",
            module="execution",
            event_type=EventType.ERROR,
            severity=EventSeverity.CRITICAL,
            data={"action": action, "error": str(e)}
        )
        return jsonify({"status": "error", "message": str(e)}), 500


@system_api_bp.route('/api/system/security/ips', methods=['GET'])
@login_required
def get_security_ips():
    from core.config import Config
    from core.utils import safe_load_json
    return jsonify({
        "banned": safe_load_json(Config.BANNED_IPS_FILE, default=[]),
        "whitelisted": safe_load_json(Config.WHITELIST_IPS_FILE, default=['127.0.0.1'])
    })

@system_api_bp.route('/api/system/security/action', methods=['POST'])
@login_required
def security_action():
    from core.config import Config
    from core.utils import safe_load_json, safe_write_json
    data = request.json or {}
    action = data.get('action') # 'unban' or 'whitelist'
    ip = data.get('ip')
    
    if not ip or not action:
        return jsonify({"status": "error", "message": "Missing IP or action"}), 400

    if action == 'unban':
        banned_data = safe_load_json(Config.BANNED_IPS_FILE, default=[])
        new_banned = [b for b in banned_data if (b.get('ip') if isinstance(b, dict) else b) != ip]
        if len(new_banned) < len(banned_data):
            safe_write_json(Config.BANNED_IPS_FILE, new_banned)
            return jsonify({"status": "success", "message": f"IP {ip} entbannt."})
    
    elif action == 'whitelist':
        whitelist = safe_load_json(Config.WHITELIST_IPS_FILE, default=['127.0.0.1'])
        if ip not in whitelist:
            whitelist.append(ip)
            safe_write_json(Config.WHITELIST_IPS_FILE, whitelist)
            # Remove from banned
            banned_data = safe_load_json(Config.BANNED_IPS_FILE, default=[])
            new_banned = [b for b in banned_data if (b.get('ip') if isinstance(b, dict) else b) != ip]
            safe_write_json(Config.BANNED_IPS_FILE, new_banned)
            return jsonify({"status": "success", "message": f"IP {ip} whitelisted."})

    return jsonify({"status": "error", "message": "Invalid action"}), 400

@system_api_bp.route('/api/system/reports', methods=['GET'])
@login_required
def list_reports():
    from core.config import Config
    reports_dir = os.path.join(Config.DATA_PATH, "reports")
    if not os.path.exists(reports_dir):
        return jsonify({"reports": []})
    
    files = [f for f in os.listdir(reports_dir) if f.endswith('.md')]
    # Sort by date (descending)
    files.sort(reverse=True)
    return jsonify({"reports": files})

@system_api_bp.route('/api/system/reports/<filename>', methods=['GET'])
@login_required
def get_report(filename):
    # ... (existing code) ...
    pass # for slice

@system_api_bp.route('/api/system/users', methods=['GET'])
@login_required
def list_users():
    """ 
    Gibt eine Liste aller registrierten Benutzer zurück.
    Nur für Administratoren zugänglich.
    """
    if session.get('user_role') != 'admin':
        return jsonify({"error": "Forbidden"}), 403
    users = User.query.all()
    return jsonify({"users": [u.to_dict() for u in users]})

@system_api_bp.route('/api/system/users/add', methods=['POST'])
@login_required
def add_user():
    """ 
    Erstellt einen neuen Benutzer in der Datenbank.
    Passwörter werden automatisch gehasht.
    """
    if session.get('user_role') != 'admin':
        return jsonify({"error": "Forbidden"}), 403
    from werkzeug.security import generate_password_hash
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'operator')
    
    if not username or not password:
        return jsonify({"error": "Missing data"}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exists"}), 400
        
    new_user = User(
        username=username,
        password_hash=generate_password_hash(password),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()
    log_action("admin", "USER_CREATED", f"Benutzer {username} mit Rolle {role} wurde erstellt.")
    return jsonify({"status": "success", "message": f"User {username} created."})

@system_api_bp.route('/api/system/users/action', methods=['POST'])
@login_required
def user_action():
    """ 
    Führt administrative Aktionen auf Benutzern aus (Löschen, Aktivieren/Deaktivieren).
    """
    if session.get('user_role') != 'admin':
        return jsonify({"error": "Forbidden"}), 403
    data = request.json or {}
    user_id = data.get('id')
    action = data.get('action') # delete, toggle_active
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if action == 'delete':
        username = user.username
        db.session.delete(user)
        log_action("admin", "USER_DELETED", f"Benutzer {username} wurde gelöscht.")
    elif action == 'toggle_active':
        user.is_active = not user.is_active
        status = "aktiviert" if user.is_active else "deaktiviert"
        log_action("admin", "USER_STATUS_TOGGLED", f"Benutzer {user.username} wurde {status}.")
    
    db.session.commit()
    return jsonify({"status": "success"})
    from core.config import Config
    # Security: Prevent path traversal
    if '..' in filename or '/' in filename:
        return jsonify({"error": "Unauthorized"}), 403
        
    reports_dir = os.path.join(Config.DATA_PATH, "reports")
    report_path = os.path.join(reports_dir, filename)
    
    if not os.path.exists(report_path):
        return jsonify({"error": "Report not found"}), 404
        
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    return jsonify({"filename": filename, "content": content})

@system_api_bp.route('/api/system/fixes', methods=['GET'])
@login_required
def get_system_fixes():
    """
    Returns the P.I.G.E.O.N. Action Audit Log parsed as JSON.
    """
    from core.config import Config
    import re
    
    log_path = Config.ACTIONS_LOG
    if not os.path.exists(log_path):
        return jsonify([])

    fixes = []
    # Regex: [timestamp] [P.I.G.E.O.N.] [CATEGORY] Action: STATUS | Result - Details
    pattern = re.compile(r'\[(?P<ts>.*?)\] \[P\.I\.G\.E\.O\.N\.\] \[(?P<cat>.*?)\] (?P<action>.*?): (?P<status>.*?) \| (?P<result>.*?) - (?P<details>.*)')

    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            # Reverse for newest first
            for line in reversed(lines):
                match = pattern.match(line.strip())
                if match:
                    fixes.append(match.groupdict())
                else:
                    # Fallback for non-matching lines (if any)
                    fixes.append({"ts": "Unknown", "cat": "INFO", "action": "Manual Entry", "status": "UNKNOWN", "result": line.strip(), "details": ""})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(fixes[:100]) # Limit to last 100 entries

@system_api_bp.route('/api/system/state', methods=['GET'])
@login_required
def get_system_state():
    """
    Centralized system state view with P.I.G.E.O.N. intelligence.
    """
    from intelligence_worker.pigeon_engine import pigeon_scanner
    sec_report = pigeon_scanner._check_security_audit()
    
    from flask import current_app
    from time import time
    
    # Analytics Calculation
    rate_data = getattr(current_app, 'rate_limiter_data', {})
    total_reqs_1m = sum(len(h) for h in rate_data.values())
    
    threat_level = "LOW"
    if sec_report['failed_count'] > 0 or total_reqs_1m > 300: threat_level = "ELEVATED"
    if sec_report['failed_count'] > 10 or total_reqs_1m > 1000: threat_level = "CRITICAL"
    
    # Lightweight aggregation
    state = {
        "status": "stable",
        "active_issues": [],
        "services": {
            "api": "online",
            "db": "online",
            "prometheus": "online"
        },
        "security": {
            "failed_logins_1h": sec_report['failed_count'],
            "banned_count": len(safe_load_json(Config.BANNED_IPS_FILE, default=[])),
            "status": "SECURE" if sec_report['failed_count'] < 5 else "WARNING",
            "threat_level": threat_level,
            "requests_1m": total_reqs_1m
        },
        "confidence": 0.95
    }

    # Simple health check integration
    try:
        # Check disk space as an example
        import shutil
        total, used, free = shutil.disk_usage("/")
        usage_pct = (used / total) * 100
        if usage_pct > 90:
            state["status"] = "warning"
            state["active_issues"].append(f"Disk usage high: {usage_pct:.1f}%")
            state["confidence"] = 0.7
    except:
        pass

    return jsonify(state)
