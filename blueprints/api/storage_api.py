from flask import Blueprint, jsonify, request
from core import utils
from core.services import storage_service
from core.event_system import events, EventSeverity, EventType, EventSource

storage_api_bp = Blueprint('storage_api', __name__, url_prefix='/api/storage')

@storage_api_bp.route('/status')
@utils.login_required
def status():
    """Returns current backup and disk status."""
    return jsonify(storage_service.get_backup_status())

@storage_api_bp.route('/trigger', methods=['POST'])
@utils.login_required
def trigger():
    """Manually triggers the backup script."""
    try:
        res = storage_service.trigger_backup()
        events.emit(
            name="backup_triggered",
            module="storage",
            event_type=EventType.ACTION,
            source=EventSource.API,
            data={"status": "started"}
        )
        return jsonify(res)
    except Exception as e:
        events.emit(
            name="backup_trigger_fail",
            module="storage",
            event_type=EventType.ERROR,
            severity=EventSeverity.CRITICAL,
            source=EventSource.API,
            data={"error": str(e)}
        )
        return jsonify({'ok': False, 'error': str(e)}), 500

@storage_api_bp.route('/whitelist', methods=['GET', 'POST'])
@utils.login_required
def whitelist():
    """Manage backup error whitelist."""
    if request.method == 'POST':
        entry = (request.json or {}).get('entry', '').strip()
        if not entry:
            return jsonify({'ok': False, 'error': 'entry required'}), 400
        wl = storage_service.manage_whitelist('add', entry)
        return jsonify({'ok': True, 'whitelist': wl})
    
    return jsonify(storage_service.manage_whitelist('get'))

@storage_api_bp.route('/whitelist/<path:entry>', methods=['DELETE'])
@utils.login_required
def delete_whitelist(entry):
    """Remove entry from whitelist."""
    wl = storage_service.manage_whitelist('del', entry)
    return jsonify({'ok': True, 'whitelist': wl})
