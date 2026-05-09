#!/usr/bin/env python3
import requests
import sqlite3
import shutil
import os
import sys
import time
import subprocess

# Add project root to path for core imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from core.event_system import events, EventSeverity, EventType, EventSource

# Configuration
API_URL = "http://localhost:5000/health"
DB_PATH = "/data/dashboard.db"
PROMETHEUS_URL = "http://localhost:9090/api/v1/query"
DISK_THRESHOLD_PCT = 90
CHECK_INTERVAL = 300 # 5 minutes

def check_api():
    try:
        resp = requests.get(API_URL, timeout=5)
        if resp.status_code == 200:
            return True, "API healthy"
        return False, f"API returned status {resp.status_code}"
    except Exception as e:
        return False, f"API unreachable: {str(e)}"

def check_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        conn.close()
        if len(tables) > 0:
            return True, f"DB healthy ({len(tables)} tables)"
        return False, "DB empty or corrupted"
    except Exception as e:
        return False, f"DB error: {str(e)}"

def check_prometheus():
    try:
        # Simple query to see if Prometheus is alive
        params = {"query": "up"}
        resp = requests.get(PROMETHEUS_URL, params=params, timeout=5)
        if resp.status_code == 200:
            return True, "Prometheus healthy"
        return False, f"Prometheus returned status {resp.status_code}"
    except Exception as e:
        return False, f"Prometheus unreachable: {str(e)}"

def check_disk():
    try:
        total, used, free = shutil.disk_usage("/")
        usage_pct = (used / total) * 100
        if usage_pct < DISK_THRESHOLD_PCT:
            return True, f"Disk space OK ({usage_pct:.1f}%)"
        return False, f"Disk usage high: {usage_pct:.1f}%"
    except Exception as e:
        return False, f"Disk check failed: {str(e)}"

def run_watchdog():
    checks = [
        ("api_reachable", check_api),
        ("db_query_works", check_db),
        ("prometheus_valid", check_prometheus),
        ("disk_usage_threshold", check_disk)
    ]

    for name, func in checks:
        success, message = func()
        if not success:
            events.emit(
                name=name,
                module="watchdog",
                event_type=EventType.ERROR,
                severity=EventSeverity.CRITICAL,
                source=EventSource.WATCHDOG,
                data={"message": message}
            )
            # Optional restart for API if failing
            if name == "api_reachable":
                # Only restart if safe (e.g. systemd or docker)
                # subprocess.run(["sudo", "systemctl", "restart", "devhub"])
                pass
        else:
            # Periodic info log (maybe only every 10th run to avoid noise)
            if time.time() % 3600 < CHECK_INTERVAL:
                events.emit(
                    name=name,
                    module="watchdog",
                    event_type=EventType.EVENT,
                    severity=EventSeverity.INFO,
                    source=EventSource.WATCHDOG,
                    data={"message": message}
                )

if __name__ == "__main__":
    run_watchdog()
