import time
import json
import os
from datetime import datetime

GROW_STAGES_FILE = '/app/data/grow_stages.json'

def get_aggregated_metrics():
    """
    Sammelt alle Grow-Metriken und Status-Informationen für das Dashboard.
    """
    from core.services import system_service
    from core.utils import safe_load_json
    
    # Grundlegende Sensordaten (via Prometheus/System-Stats)
    sysinfo = system_service.get_sysinfo()
    
    # Grow-Status (Phasen, Tage, etc.)
    stages = get_detailed_grow_status()
    
    # Heuristische Analyse
    # Wir nehmen an, dass es nur einen aktiven Grow gibt
    active_strain = next((s for s, d in stages.items() if d.get('is_active')), None)
    stage_name = stages[active_strain]['phase'] if active_strain else "BLOOM"
    
    # Mock-Metriken für Sensoren (da wir hier kein Prometheus-Objekt direkt haben)
    # In Produktion würden diese aus Prometheus kommen.
    metrics = {
        'temperature': sysinfo.get('temp', 24),
        'humidity': 50, # Default / Fallback
        'vpd': 1.1      # Default / Fallback
    }
    
    interpretation = get_grow_interpretation(metrics, stage_name)
    score = calculate_run_score(metrics, [])
    risk = get_mold_risk(metrics, stage_name)
    
    return {
        'ok': True,
        'metrics': metrics,
        'interpretation': interpretation,
        'stages': stages,
        'score': score,
        'mold_risk': risk,
        'timestamp': datetime.now().isoformat()
    }

def get_grow_interpretation(metrics, stage="BLOOM"):
    """
    Interpretiert die aktuellen Sensordaten basierend auf der aktuellen Grow-Phase.
    Gibt Empfehlungen zur Optimierung von VPD, Temperatur und Luftfeuchtigkeit.
    """
    interp = {}
    vpd = metrics.get('vpd')
    if vpd is not None:
        if "SEEDLING" in stage.upper() or "SAEMLING" in stage.upper():
            opt_min, opt_max = 0.4, 0.8
        elif "VEG" in stage.upper():
            opt_min, opt_max = 0.8, 1.2
        elif "BLOOM" in stage.upper() or "BLUETE" in stage.upper():
            opt_min, opt_max = 1.2, 1.6
        else:
            opt_min, opt_max = 0.8, 1.4
            
        if vpd < opt_min:
            interp['vpd'] = {'status': 'WARN', 'label': 'Zu niedrig', 'interpretation': 'Transpiration gehemmt.', 'recommendation': 'Temp +1-2°C ODER RLF -5%.'}
        elif vpd > opt_max:
            interp['vpd'] = {'status': 'CRIT' if vpd > opt_max + 0.4 else 'WARN', 'label': 'Zu hoch', 'interpretation': 'Trockenstress.', 'recommendation': 'RLF +5% ODER Temp -2°C.'}
        else:
            interp['vpd'] = {'status': 'OK', 'label': 'Optimal', 'interpretation': 'Maximale Photosynthese.', 'recommendation': 'Parameter stabil halten.'}

    temp = metrics.get('temperature')
    if temp is not None:
        if temp > 30:
            interp['temperature'] = {'status': 'CRIT', 'label': 'Hitzewarnung', 'interpretation': 'Stressrisiko.', 'recommendation': 'Abluft +1 / Lampe -10%.'}
        elif temp < 18:
            interp['temperature'] = {'status': 'WARN', 'label': 'Zu kühl', 'interpretation': 'Stoffwechsel verzögert.', 'recommendation': 'Abluft drosseln.'}
        else:
            interp['temperature'] = {'status': 'OK', 'label': 'Nominal', 'recommendation': 'Optimaler Bereich.'}

    hum = metrics.get('humidity')
    if hum is not None:
        if ("BLOOM" in stage.upper() or "BLUETE" in stage.upper()) and hum > 58:
            interp['humidity'] = {'status': 'CRIT', 'label': 'Botrytis-Gefahr', 'interpretation': 'Schimmelgefahr!', 'recommendation': 'RLF senken (< 50%).'}
        elif hum < 30:
            interp['humidity'] = {'status': 'WARN', 'label': 'Zu trocken', 'interpretation': 'Schädlingsgefahr.', 'recommendation': 'Luftbefeuchter an.'}
        else:
            interp['humidity'] = {'status': 'OK', 'label': 'Stabil', 'recommendation': 'Kein Handlungsbedarf.'}
    return interp

def get_detailed_grow_status():
    if not os.path.exists(GROW_STAGES_FILE):
        return {}
    try:
        with open(GROW_STAGES_FILE) as f:
            stages = json.load(f)
    except:
        return {}
    
    now = time.time()
    result = {}
    
    for strain, dates in stages.items():
        # Sortiere Phasen nach Zeit
        sorted_phases = sorted(dates.items(), key=lambda x: x[1])
        current_phase = "Unbekannt"
        next_phase = None
        days_in_phase = 0
        days_to_next = None
        
        for i, (name, ts) in enumerate(sorted_phases):
            if ts <= now:
                current_phase = name
                days_in_phase = int((now - ts) / 86400)
                if i + 1 < len(sorted_phases):
                    next_phase_info = sorted_phases[i+1]
                    next_phase = next_phase_info[0]
                    days_to_next = int((next_phase_info[1] - now) / 86400)
            else:
                if not next_phase:
                    next_phase = name
                    days_to_next = int((ts - now) / 86400)
                break
        
        result[strain] = {
            'phase': current_phase,
            'next_phase': next_phase,
            'days_in_phase': days_in_phase,
            'days_to_next': days_to_next,
            'is_active': (now - sorted_phases[0][1]) < (150 * 86400) # Grober Check ob Run vorbei
        }
    return result

def calculate_run_score(metrics, history):
    score = 100
    vpd = metrics.get("vpd") or 1.0
    if vpd < 0.6 or vpd > 1.8: score -= 15
    elif vpd < 0.8 or vpd > 1.6: score -= 5
    temp = metrics.get('temperature') or 24
    if temp > 32 or temp < 16: score -= 20
    elif temp > 28 or temp < 20: score -= 5
    return max(0, score)

def get_mold_risk(metrics, stage):
    if "BLOOM" not in stage.upper() and "BLUETE" not in stage.upper():
        return 5
    hum = metrics.get('humidity', 50)
    if hum > 70: return 95
    if hum > 65: return 75
    if hum > 60: return 40
    if hum > 55: return 20
    return 10
