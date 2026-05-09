""" Archivierung und Historie von Growbox-Daten """
import os
import json
import uuid
import hmac
from flask import Blueprint, jsonify, request
from core.utils import login_required
from core.constants import LOGIN_PASSWORD

archive_bp = Blueprint('grow_archive', __name__)
DATA_DIR = 'data'
ARCHIVE_FILE = os.path.join(DATA_DIR, 'grow_archive.json')

def load_archive():
    if not os.path.exists(ARCHIVE_FILE):
        example_data = [
            {
                "id": str(uuid.uuid4()),
                "strain": "Bubba Kush (Run 1)",
                "start_date": "2024-01-10",
                "harvest_date": "2024-03-25",
                "yield_g": 145,
                "avg_temp": 24.8,
                "avg_vpd": 1.15,
                "notes": "Sehr stabiler Run, AKF musste am Ende getauscht werden.",
                "rating": 5
            }
        ]
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
        with open(ARCHIVE_FILE, 'w') as f:
            json.dump(example_data, f, indent=2)
        return example_data
    
    with open(ARCHIVE_FILE, 'r') as f:
        return json.load(f)

@archive_bp.route('/api/grow/archive', methods=['GET'])
@login_required
def get_archive():
    return jsonify(load_archive())

@archive_bp.route('/api/grow/archive', methods=['POST'])
@login_required
def add_to_archive():
    data = request.json
    password = data.get('password', '')
    
    # Password verification
    if not hmac.compare_digest(password, LOGIN_PASSWORD):
        return jsonify({"ok": False, "error": "Ungültige Passphrase"}), 403
        
    archive = load_archive()
    
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
        
    return jsonify({"ok": True, "entry": new_entry})
