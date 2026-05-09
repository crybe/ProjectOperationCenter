"""
P.I.G.E.O.N. Stability Monitor
Überwacht die Docker-Infrastruktur auf Instabilitäten und führt autonome Heilungsprozesse aus.
"""
import subprocess
from core.event_system import events, EventSeverity, EventType, EventSource
from core.utils import log_action

def check_container_stability():
    """ 
    Prüft alle Docker-Container auf 'Unhealthy'-Status oder unerwartete Abstürze.
    Bei Erkennung wird der betroffene Container automatisch neugestartet.
    """
    try:
        # Abfrage aller Container-Statusinformationen
        result = subprocess.run(
            ["docker", "ps", "-a", "--format", "{{.Names}}|{{.Status}}|{{.State}}"],
            capture_output=True, text=True, check=True
        )
        containers = result.stdout.strip().split('\n')
        
        restarted = []
        for line in containers:
            if not line: continue
            name, status, state = line.split('|')
            
            # Fall 1: Container ist mit Fehlercode beendet (Crash)
            if state == 'exited' and 'Exited (0)' not in status:
                log_action("system", "CONTAINER_CRASH_DETECTED", f"Guardian_Fix: Container {name} ist gecrasht ({status}). Restart eingeleitet.")
                subprocess.run(["docker", "restart", name], check=False)
                restarted.append(name)
            
            # Fall 2: Docker Healthcheck meldet 'unhealthy'
            if 'unhealthy' in status:
                log_action("system", "CONTAINER_UNHEALTHY", f"Guardian_Fix: Container {name} ist UNHEALTHY. Proaktiver Restart eingeleitet.")
                subprocess.run(["docker", "restart", name], check=False)
                restarted.append(name)
                
        return restarted
    except Exception as e:
        print(f"[P.I.G.E.O.N. Monitor] Error checking containers: {e}")
        return []
