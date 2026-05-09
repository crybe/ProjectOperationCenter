""" Zentrale Intelligenz-Engine für System-Analysen """
import time
import os
import json
import subprocess

def get_core_report(grow_metrics, system_telemetry, stage="BLOOM", control_mode="assisted"):
    """
    Generiert einen hybriden Core-Intelligence Report.
    """
    # 1. State Classification
    status = "OPTIMAL"
    summary = "System arbeitet innerhalb der Parameter."
    
    # Grow Analysis
    grow_state = "optimal"
    grow_issues = []
    grow_actions = []
    
    temp = grow_metrics.get('temperature', 24)
    vpd = grow_metrics.get('vpd', 1.0)
    hum = grow_metrics.get('humidity', 50)
    
    if temp < 20 or temp > 28:
        grow_state = "suboptimal"
        status = "WARNING"
        grow_issues.append(f"Temperatur Abweichung: {temp}°C")
        grow_actions.append("Temperatur auf 24-26°C stabilisieren.")
        
    if vpd < 0.8 or vpd > 1.6:
        grow_state = "suboptimal"
        if status == "OPTIMAL": status = "WARNING"
        grow_issues.append(f"VPD außerhalb Zielbereich: {vpd} kPa")
        grow_actions.append("Luftfeuchte oder Temperatur anpassen, um VPD zu optimieren.")

    # System Analysis
    sys_state = "healthy"
    sys_issues = []
    sys_actions = []
    
    cpu = system_telemetry.get('cpu', 0)
    mem = system_telemetry.get('mem', 0)
    
    if cpu > 80:
        sys_state = "stressed"
        status = "WARNING"
        sys_issues.append(f"Hohe CPU-Last: {cpu}%")
        sys_actions.append("Nicht benötigte Dienste beenden oder Container-Limit prüfen.")
        
    if mem > 90:
        sys_state = "stressed"
        status = "WARNING"
        sys_issues.append(f"Kritischer Speicherverbrauch: {mem}%")
        sys_actions.append("Speicherbereinigung durchführen.")

    # Risks
    risks = []
    if ("BLOOM" in stage or "BLUETE" in stage) and hum > 60:
        risks.append({
            "type": "mold",
            "level": "high" if hum > 65 else "medium",
            "reason": f"Erhöhte RLF ({hum}%) in der Blütephase begünstigt Botrytis.",
            "eta": "24-48h"
        })
    
    if vpd < 0.7:
        risks.append({
            "type": "stress",
            "level": "medium",
            "reason": "Geringe Transpiration führt zu Nährstoffstau.",
            "eta": "ongoing"
        })

    # Scores
    grow_score = 100
    if grow_state != "optimal": grow_score -= 25
    if risks: grow_score -= 15
    
    sys_score = 100
    if sys_state != "healthy": sys_score -= 30
    
    combined_score = int((grow_score * 0.7) + (sys_score * 0.3))

    # Trends (Mocked for now or passed from metrics)
    trends = {
        "vpd": grow_metrics.get('vpd_trend', 'stable'),
        "temp": grow_metrics.get('temp_trend', 'stable'),
        "humidity": grow_metrics.get('hum_trend', 'stable'),
        "note": "Parameter-Trends weitgehend stabil."
    }

    # Auto Actions
    auto_actions = []
    if control_mode == "auto":
        if temp < 22: auto_actions.append("target_temp +1")
        if hum > 60: auto_actions.append("fan_speed +1")

    report = {
        "status": status,
        "summary": summary if status == "OPTIMAL" else "Optimierungsbedarf in mehreren Subsystemen erkannt.",
        "root_cause": {
            "primary": grow_issues[0] if grow_issues else "System stabil",
            "secondary": sys_issues
        },
        "grow_analysis": {
            "state": grow_state,
            "issues": grow_issues,
            "actions": grow_actions
        },
        "system_analysis": {
            "state": sys_state,
            "issues": sys_issues,
            "actions": sys_actions
        },
        "risks": risks,
        "trends": trends,
        "scores": {
            "grow_score": grow_score,
            "system_score": sys_score,
            "combined_score": combined_score
        },
        "confidence": 95,
        "recommended_actions": grow_actions + sys_actions,
        "auto_actions": auto_actions
    }
    
    return report
