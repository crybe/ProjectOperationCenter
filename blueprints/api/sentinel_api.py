from flask import Blueprint, jsonify, request
from core import utils
from core.services import system_service
from core.event_system import events, EventSeverity, EventType, EventSource

sentinel_api_bp = Blueprint('sentinel_api', __name__, url_prefix='/api/sentinel')

@sentinel_api_bp.route('/sysinfo')
@utils.login_required
def sysinfo():
    """Returns host system metrics (CPU, RAM, Temp)."""
    try:
        return jsonify(system_service.get_sysinfo())
    except Exception as e:
        events.emit(
            name="sysinfo_error",
            module="sentinel",
            event_type=EventType.ERROR,
            severity=EventSeverity.WARN,
            source=EventSource.API,
            data={"error": str(e)}
        )
        return jsonify({'error': str(e)}), 500

@sentinel_api_bp.route('/containers')
@utils.login_required
def container_list():
    """Returns list of all docker containers."""
    return jsonify(system_service.get_containers())

@sentinel_api_bp.route('/container/<name>/<action>', methods=['POST'])
@utils.login_required
def container_action(name, action):
    """Start, stop, or restart a container."""
    try:
        res = system_service.perform_container_action(name, action)
        events.emit(
            name="container_action",
            module="docker",
            event_type=EventType.ACTION,
            source=EventSource.API,
            data={"container": name, "action": action}
        )
        return jsonify(res)
    except Exception as e:
        events.emit(
            name="container_action_fail",
            module="docker",
            event_type=EventType.ERROR,
            severity=EventSeverity.CRITICAL,
            source=EventSource.API,
            data={"container": name, "action": action, "error": str(e)}
        )
        return jsonify({'ok': False, 'error': str(e)}), 400

@sentinel_api_bp.route('/bot/status')
@utils.login_required
def bot_status():
    """Status of the autonomous AI bot."""
    return jsonify(system_service.get_bot_status())

@sentinel_api_bp.route('/bot/<action>', methods=['POST'])
@utils.login_required
def bot_action(action):
    """Start, stop, or restart the bot."""
    try:
        from core.constants import BOT_CTRL_URL, CTRL_TOKEN
        import urllib.request
        import json
        url = f'{BOT_CTRL_URL}/{action}'
        req = urllib.request.Request(url, data=b'', headers={'X-Ctrl-Token': CTRL_TOKEN}, method='POST')
        with urllib.request.urlopen(req, timeout=10) as r:
            return jsonify(json.loads(r.read()))
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)})
@sentinel_api_bp.route('/healing')
@utils.login_required
def get_healing_stats():
    """ Returns recent autonomous healing actions from P.I.G.E.O.N. """
    from core.config import Config
    import json
    import os
    events_file = Config.NEXUS_EVENTS_LOG
    healings = []
    if os.path.exists(events_file):
        try:
            with open(events_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()[-300:]
                for line in lines:
                    ev = json.loads(line)
                    if ev['name'] in ['CONTAINER_CRASH_DETECTED', 'CONTAINER_UNHEALTHY', 'LOG_ROTATION']:
                        healings.append({
                            'ts': ev['timestamp'],
                            'type': ev['name'],
                            'details': ev['data'].get('details', '')
                        })
        except: pass
    return jsonify({"healings": healings[::-1]}) # Newest first
