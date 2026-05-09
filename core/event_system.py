import os
import json
import fcntl
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

class EventSeverity(Enum):
    INFO = "info"
    WARN = "warn"
    CRITICAL = "critical"

class EventType(Enum):
    EVENT = "event"
    ACTION = "action"
    ERROR = "error"

class EventSource(Enum):
    API = "api"
    WATCHDOG = "watchdog"
    N8N = "n8n"
    SYSTEM = "system"

from core.config import Config

class EventSystem:
    """
    Hardenend Event-System for Nexus Command Hub.
    Produces append-only JSONL logs for AI and human consumption.
    """
    
    def __init__(self, log_dir: str = Config.LOG_DIR):
        # On some systems, /data might not be writable or exist, 
        # using a fallback if necessary or ensuring it exists.
        self.log_dir = log_dir
        self.jsonl_file = os.path.join(log_dir, "nexus_events.jsonl")
        os.makedirs(log_dir, exist_ok=True)

    def emit(self, 
             name: str,
             module: str, 
             event_type: EventType = EventType.EVENT,
             severity: EventSeverity = EventSeverity.INFO, 
             source: EventSource = EventSource.SYSTEM,
             data: Optional[Dict[str, Any]] = None):
        """
        Emits a structured event to the JSONL log.
        """
        event_obj = {
            "timestamp": datetime.now().isoformat(),
            "module": module.lower(),
            "type": event_type.value,
            "name": name.lower(),
            "severity": severity.value,
            "source": source.value,
            "data": data or {}
        }

        self._write_jsonl(event_obj)

    def _write_jsonl(self, obj: Dict[str, Any]):
        try:
            with open(self.jsonl_file, 'a', encoding='utf-8') as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                try:
                    f.write(json.dumps(obj, ensure_ascii=False) + '\n')
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)
        except Exception as e:
            # Fallback to stderr if logging fails to prevent system crash
            import sys
            print(f"FAILED TO LOG EVENT: {e}", file=sys.stderr)

# Singleton instance
events = EventSystem()

# Example helper functions
def log_watering(duration: int, success: bool):
    events.emit(
        name="watering_logged",
        module="grow",
        event_type=EventType.ACTION,
        data={"duration": duration, "success": success}
    )

def log_cpu_spike(usage: float):
    events.emit(
        name="cpu_spike_detected",
        module="system",
        severity=EventSeverity.WARN,
        data={"usage_pct": usage}
    )

def log_container_restart(name: str, reason: str):
    events.emit(
        name="container_restarted",
        module="docker",
        event_type=EventType.ERROR,
        severity=EventSeverity.CRITICAL,
        data={"container": name, "reason": reason}
    )
