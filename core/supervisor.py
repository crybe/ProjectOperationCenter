""" Prozess-Überwachung und Supervisor-Logik """
import os
import json
import subprocess
from datetime import datetime

def analyze_system_health(sys_data, bot_status, memories):
    """
    Analyzes system state and returns potential issues and their fixes.
    """
    issues = []
    
    # 1. Check CPU Temperature
    temp = sys_data.get('temp', 0)
    if temp > 75:
        issues.append({
            'id': 'high_temp',
            'severity': 'error',
            'title': 'CPU Überhitzung erkannt',
            'description': f'Die CPU-Temperatur liegt bei {temp}°C. Das System drosselt möglicherweise.',
            'action_label': 'Lüfter auf Max (n8n)',
            'action_cmd': 'n8n_trigger_fan_high' # This would be mapped to a specific action
        })
    
    # 2. Check Bot Status
    if bot_status and not bot_status.get('active'):
        issues.append({
            'id': 'bot_down',
            'severity': 'warning',
            'title': 'Ki-Bot ist offline',
            'description': 'Der zentrale Management-Bot reagiert nicht.',
            'action_label': 'Bot Neustarten',
            'action_cmd': 'bot_restart'
        })
        
    # 3. Check for specific memory patterns (from recent memories)
    for mem in memories[:5]:
        if 'error' in mem['content'].lower() or mem['importance'] >= 4:
            if 'database' in mem['title'].lower():
                issues.append({
                    'id': 'db_issue',
                    'severity': 'error',
                    'title': 'Datenbank Anomalie',
                    'description': mem['content'],
                    'action_label': 'DB Repair-Script',
                    'action_cmd': 'script_db_repair'
                })

    return issues

def execute_sentinel_fix(action_cmd):
    """
    Executes a predefined fix command.
    """
    # Mappings to real commands/scripts
    commands = {
        'bot_restart': '/app/scripts/devops/restart_devhub.sh',
        'n8n_trigger_fan_high': 'curl -X POST http://localhost:5678/webhook/fan-high'
    }
    
    cmd = commands.get(action_cmd)
    if not cmd:
        return False, "Unbekannter Befehl"
        
    try:
        # If it's a curl command, use requests or similar, if shell, use subprocess
        if cmd.startswith('curl'):
             subprocess.run(cmd, shell=True, check=True)
        else:
             subprocess.run(['bash', cmd], check=True)
        return True, "Fix erfolgreich ausgeführt"
    except Exception as e:
        return False, str(e)
