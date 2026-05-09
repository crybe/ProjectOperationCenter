"""
P.I.G.E.O.N. Maintenance Module
Verantwortlich für die automatisierte Systempflege und Ressourcen-Optimierung.
"""
import os
import shutil
from core.config import Config
from core.utils import log_action

def rotate_logs():
    """ 
    Rotiert System- und Audit-Logs, wenn diese die Größenbeschränkung überschreiten.
    Dies verhindert Performance-Einbußen im UI und schont den Speicherplatz auf dem Pi.
    """
    log_files = [
        Config.NEXUS_EVENTS_LOG,
        Config.ACTIONS_LOG,
        Config.GEMINI_LOG
    ]
    
    # Konfiguration: 5MB Limit, 5 Backups pro Log
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    BACKUP_COUNT = 5
    
    rotated = []
    for log_path in log_files:
        if os.path.exists(log_path) and os.path.getsize(log_path) > MAX_SIZE:
            # Bestehende Backups verschieben (z.B. log.4 -> log.5)
            for i in range(BACKUP_COUNT - 1, 0, -1):
                s = f"{log_path}.{i}"
                d = f"{log_path}.{i+1}"
                if os.path.exists(s):
                    shutil.move(s, d)
            
            # Aktuelles Log zu log.1 machen
            shutil.move(log_path, f"{log_path}.1")
            
            # Neues leeres Log-File initialisieren
            with open(log_path, 'w', encoding='utf-8') as f:
                f.write("")
                
            log_action("system", "LOG_ROTATION", f"Log rotiert: {os.path.basename(log_path)}. Backup-Limit: {BACKUP_COUNT}")
            rotated.append(log_path)
            
    return rotated
