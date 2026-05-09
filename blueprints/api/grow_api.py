from flask import Blueprint, jsonify, request, current_app
from core import utils
from core.event_system import events, EventSeverity, EventType, EventSource
from core.services import grow_service
import os
import json
import urllib.request

grow_api_bp = Blueprint('grow_api', __name__, url_prefix='/api/grow')

@grow_api_bp.route('/metrics')
@utils.login_required
def get_metrics():
    """Aggregated grow metrics including predictions."""
    try:
        metrics = grow_service.get_aggregated_metrics()
        return jsonify(metrics)
    except Exception as e:
        events.emit(
            name="metrics_error",
            module="grow",
            event_type=EventType.ERROR,
            severity=EventSeverity.WARN,
            source=EventSource.API,
            data={"error": str(e)}
        )
        return jsonify({'ok': False, 'error': str(e)}), 500

@grow_api_bp.route('/lamp', methods=['POST'])
@utils.login_required
def set_lamp():
    """Controls the grow lamp level (0-10)."""
    # Reuse existing logic for now, but via redirected call or direct port
    # In a full refactor, this would call a HardwareService
    from blueprints.api import api_lamp_set
    return api_lamp_set()

@grow_api_bp.route('/water', methods=['POST'])
@utils.login_required
def trigger_watering():
    """Triggers the watering pump."""
    from blueprints.api import api_watering
    return api_watering()


@grow_api_bp.route('/archive')
@utils.login_required
def grow_archive():
    """Historical grow data."""
    from blueprints.api import grow_archive
    return grow_archive()
