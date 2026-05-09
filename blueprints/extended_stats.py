""" Erweiterte Systemstatistiken und Metriken """
from flask import Blueprint, jsonify
from core.utils import login_required
import subprocess
import json
import re
import urllib.request
import time as _time
import os
from core.services.grow_service import get_detailed_grow_status

extended_bp = Blueprint('extended_stats', __name__)

GRAFANA_DASHBOARD_PATH = '/home/user/docker/grafana/provisioning/dashboards/rpi5-main.json'

def get_network_connections():
    try:
        # ss -tun Estab counts
        result = subprocess.check_output(['ss', '-tun'], text=True)
        ips = re.findall(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+\s+Established', result)
        external_ips = [ip for ip in set(ips) if not ip.startswith(('127.', '192.168.', '10.', '172.'))]
        return external_ips[:5]
    except:
        return []

def get_outdoor_weather():
    try:
        url = "https://wttr.in?format=j1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            current = data['current_condition'][0]
            return {
                "temp": current['temp_C'],
                "desc": current['lang_de'][0]['value'] if 'lang_de' in current else current['weatherDesc'][0]['value']
            }
    except:
        return {"temp": "--", "desc": "Wetter-Service Offline"}

def get_paperless_stats():
    try:
        # Schnellabfrage via Docker Exec
        # Gesamtzahl
        total_cmd = ["docker", "exec", "paperless-ngx-db-1", "psql", "-U", "paperless", "-d", "paperless", "-t", "-c", "SELECT count(*) FROM documents_document;"]
        total = subprocess.check_output(total_cmd, text=True).strip()
        
        # Rechnungen (Tag-ID für 'Rechnungen' finden oder direkt über Name)
        invoices_cmd = ["docker", "exec", "paperless-ngx-db-1", "psql", "-U", "paperless", "-d", "paperless", "-t", "-c", "SELECT count(*) FROM documents_document_tags dt JOIN documents_tag t ON dt.tag_id = t.id WHERE t.name = 'Rechnungen';"]
        invoices = subprocess.check_output(invoices_cmd, text=True).strip()
        
        return {
            "total_docs": int(total) if total.isdigit() else 0,
            "invoices": int(invoices) if invoices.isdigit() else 0
        }
    except Exception as e:
        return {"total_docs": 0, "invoices": 0, "error": str(e)}

@extended_bp.route('/api/dashboard/extended-stats', methods=['GET'])
@login_required
def get_extended_stats():
    grow_details = get_detailed_grow_status()
    paperless = get_paperless_stats()
    
    # Filtere Grow-Details auf aktive Runs
    active_grow = {k: v for k, v in grow_details.items() if v.get('is_active')}
    
    stats = {
        "network": {
            "connections": get_network_connections()
        },
        "weather": get_outdoor_weather(),
        "growbox": {
            "active_runs": active_grow,
            "health_score": 100 # Könnte später aus VPD berechnet werden
        },
        "paperless": paperless
    }
    return jsonify(stats)
