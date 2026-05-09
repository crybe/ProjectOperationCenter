#!/usr/bin/env python3
import os
import shutil
import subprocess
import requests
import time
import json

# Configuration
API_BASE = "http://localhost:5666/api"
DOCKER_CONTAINERS = ["devhub", "prometheus", "grafana"]
DISK_THRESHOLD_GB = 5

def push_notification(type, title, message):
    try:
        # Note: In a real script, you'd need a token or local bypass
        # For now, we assume local access or pre-auth
        requests.post(f"{API_BASE}/notifications/push", json={
            "type": type,
            "title": title,
            "message": message
        }, timeout=5)
    except:
        print(f"Failed to push notification: {title}")

def check_disk():
    total, used, free = shutil.disk_usage("/")
    free_gb = free // (2**30)
    if free_gb < DISK_THRESHOLD_GB:
        push_notification("warning", "Low Disk Space", f"Verbleibender Speicher: {free_gb}GB. Bitte aufräumen.")
    return free_gb

def check_docker():
    for container in DOCKER_CONTAINERS:
        try:
            status = subprocess.check_output(["docker", "inspect", "-f", "{{.State.Running}}", container]).decode().strip()
            if status != "true":
                push_notification("error", "Container Down", f"Container {container} ist gestoppt! Starte neu...")
                subprocess.run(["docker", "start", container])
        except:
            print(f"Container {container} not found or error checking status.")

def cleanup_logs():
    # Example: cleanup old gemini logs if they get too big
    log_file = "/home/user/Tactical-Bot-Core/logs/gemini.log"
    if os.path.exists(log_file) and os.path.getsize(log_file) > 100 * 1024 * 1024: # 100MB
        shutil.copy(log_file, f"{log_file}.old")
        with open(log_file, "w") as f:
            f.write("Log rotated by CyberMaintenance\n")
        push_notification("info", "Log Rotation", "System-Logs wurden rotiert (Größe > 100MB).")

def main():
    print("Starting CyberMaintenance Routine...")
    free_gb = check_disk()
    check_docker()
    cleanup_logs()
    print(f"Routine complete. Disk: {free_gb}GB free.")

if __name__ == "__main__":
    main()
