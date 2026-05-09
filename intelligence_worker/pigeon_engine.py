"""
P.I.G.E.O.N. Deep Health Monitoring & Intelligence
Predictive Intelligent Guardian & Emergency Operations Network
"""
import os
import subprocess
import json
import re
import requests
import psutil
import threading
import time
import fcntl
from datetime import datetime, timedelta
from enum import Enum
from core.event_system import events, EventSeverity, EventType, EventSource
from intelligence_worker.memory_logic import add_memory
from core.config import Config
from core.utils import safe_load_json, safe_write_json
import uuid
from intelligence_worker.pigeon.security import check_security_audit
from intelligence_worker.pigeon.reporter import generate_weekly_report
from intelligence_worker.pigeon.monitor import check_container_stability
from intelligence_worker.pigeon.maintenance import rotate_logs

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "https://server-1.ghoul-pyruvate.ts.net/ui/")

class ActionCategory(Enum):
    SAFE = "safe"
    CRITICAL = "critical"

class TacticalFormatter:
    """ Formats technical data into human-readable tactical reports. """
    @staticmethod
    def format_anomaly(service_name, error_count, status):
        if error_count > 5:
            return f"Kritische Instabilität bei '{service_name}': Massive Fehlerrate ({error_count} Treffer). Dienst-Status: {status}."
        elif error_count > 0:
            return f"Anomalie in '{service_name}': Ungewöhnliche Fehlermuster entdeckt ({error_count} Treffer). Überwachung aktiv."
        return f"Dienst '{service_name}' operiert im Normalbereich ({status})."

class TrendPredictor:
    """ Manages historical data and predicts resource depletion. """
    def __init__(self):
        self.history_file = os.path.join(Config.LOG_DIR, 'pigeon_history.json')
        self.history_limit = 48

    def record_and_predict(self, disk_pct, ram_pct):
        history = safe_load_json(self.history_file, default=[])
        now = time.time()
        
        history.append({'ts': now, 'disk': disk_pct, 'ram': ram_pct})
        if len(history) > self.history_limit: history.pop(0)
        safe_write_json(self.history_file, history)
        
        predictions = []
        if len(history) < 2: return predictions

        disk_delta = history[-1]['disk'] - history[0]['disk']
        time_delta_h = (history[-1]['ts'] - history[0]['ts']) / 3600

        if time_delta_h > 0 and disk_delta > 0:
            h_remaining = (100 - history[-1]['disk']) / (disk_delta / time_delta_h)
            if h_remaining < 72:
                predictions.append(f"KRITISCH: Speicherplatz wird voraussichtlich in {h_remaining:.1f} Stunden erschöpft sein.")
        return predictions

class ActionEngine:
    """ Manages P.I.G.E.O.N. system actions with safety locks and audit logging. """
    def __init__(self):
        self.audit_log_path = Config.ACTIONS_LOG
        self.cooldown_file = os.path.join(Config.LOG_DIR, 'pigeon_cooldowns.json')
        self.queue_file = os.path.join(Config.LOG_DIR, 'pigeon_queue.json')
        self.cooldown_configs = {
            "docker_log_cleanup": 3600 * 6,   # 6h
            "restart_container": 3600 * 12,  # 12h
            "telegram_alert": 1800,          # 30m
            "db_optimization": 3600 * 24,    # 24h
            "network_repair": 3600,          # 1h
            "log_rotation": 3600 * 12,       # 12h
            "security_hardening": 3600 * 6,  # 6h
            "weekly_report": 3600 * 24 * 7,  # 7d
            "container_fix": 300,            # 5m
        }

    def _check_cooldown(self, action_name):
        cooldowns = safe_load_json(self.cooldown_file, default={})
        last_run = cooldowns.get(action_name, 0)
        now = time.time()
        
        required_cooldown = self.cooldown_configs.get(action_name, 3600)
        if now - last_run < required_cooldown:
            remaining = int((required_cooldown - (now - last_run)) / 60)
            return False, f"Cooldown aktiv ({remaining} Min übrig)"
        return True, ""

    def _update_cooldown(self, action_name):
        cooldowns = safe_load_json(self.cooldown_file, default={})
        cooldowns[action_name] = time.time()
        safe_write_json(self.cooldown_file, cooldowns)

    def log_audit(self, action_name, result, details, category: ActionCategory, status="executed"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        details_flat = str(details).replace('\n', ' ').replace('\r', '')
        log_entry = f"[{timestamp}] [P.I.G.E.O.N.] [{category.value.upper()}] {action_name}: {status.upper()} | {result} - {details_flat}\n"
        
        add_memory(
            title=f"Taktisches Audit: {action_name}",
            content=f"Status: {status.upper()}\nErgebnis: {result}\nKontext: {details}",
            category='ki',
            importance=3 if category == ActionCategory.CRITICAL else 2
        )
        
        try:
            os.makedirs(os.path.dirname(self.audit_log_path), exist_ok=True)
            with open(self.audit_log_path, 'a', encoding='utf-8') as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                try: f.write(log_entry)
                finally: fcntl.flock(f, fcntl.LOCK_UN)
        except Exception: pass

    def execute_safe_action(self, name, command_func, description="", dry_run=False, confidence=1.0):
        """ Executes a safe action with cooldown and confidence checks. """
        if confidence < 0.85:
            self.log_audit(name, "SKIPPED", f"Confidence zu gering ({confidence:.2f} < 0.85)", ActionCategory.SAFE, status="ignored")
            return False, "Confidence too low"

        ok, msg = self._check_cooldown(name)
        if not ok:
            self.log_audit(name, "SKIPPED", msg, ActionCategory.SAFE, status="cooldown")
            return False, msg

        if dry_run:
            self.log_audit(name, "DRY_RUN", f"[WOULD_EXECUTE] {description}", ActionCategory.SAFE)
            return True, "Dry-run successful"

        try:
            result = command_func()
            self._update_cooldown(name)
            self.log_audit(name, "SUCCESS", f"{description} -> {result}", ActionCategory.SAFE)
            return True, result
        except Exception as e:
            self.log_audit(name, "FAILED", f"Fehler: {str(e)}", ActionCategory.SAFE, status="failed")
            return False, str(e)

    def queue_critical_action(self, name, command_str, reason, risk):
        """ Adds a critical action to the approval queue. """
        queue = safe_load_json(self.queue_file, default=[])
        if any(item['name'] == name and item['status'] == 'pending' for item in queue):
            return False, "Bereits in Warteschlange."

        queue.append({
            'id': str(uuid.uuid4()),
            'ts': datetime.now().isoformat(),
            'name': name,
            'command': command_str,
            'reason': reason,
            'risk': risk,
            'status': 'pending'
        })
        safe_write_json(self.queue_file, queue)
        self.log_audit(name, "QUEUED", f"Grund: {reason} | Risiko: {risk}", ActionCategory.CRITICAL, status="pending")
        return True, "Aktion eingereiht"

action_engine = ActionEngine()
trend_predictor = TrendPredictor()

class DeepHealthScanner:
    def __init__(self):
        self.critical_services = ['n8n-n8n-1', 'devhub', 'uptime-kuma', 'nginx-proxy-manager', 'authentik-server-1']
        self._docker_available = None
        self.health_stats = {
            'last_scan': None,
            'last_error': None,
            'status': 'active',
            'scans_total': 0,
            'errors_total': 0,
            'history_valid': False,
            'actions_log_writable': False
        }

    def _check_preflight(self):
        """ Checks if required tools like docker are available. """
        if self._docker_available is not None: return self._docker_available
        try:
            subprocess.run(['docker', '--version'], capture_output=True, check=True)
            self._docker_available = True
        except:
            self._docker_available = False
            print("[P.I.G.E.O.N.] CRITICAL: Docker not available in this context.")
        return self._docker_available

    def get_container_status(self, name):
        if not self._check_preflight(): return None
        try:
            cmd = ['docker', 'inspect', name, '--format', '{{json .State}}']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if result.returncode == 0: return json.loads(result.stdout)
        except: pass
        return None

    def get_container_logs(self, name, tail=50):
        if not self._check_preflight(): return ""
        try:
            cmd = ['docker', 'logs', '--tail', str(tail), name]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            return result.stdout + result.stderr
        except: return ""

    def get_health(self):
        """ Returns current health status of P.I.G.E.O.N. itself. """
        self.health_stats['history_valid'] = os.path.exists(trend_predictor.history_file)
        self.health_stats['actions_log_writable'] = os.access(os.path.dirname(Config.ACTIONS_LOG), os.W_OK)
        return self.health_stats

    def run_deep_scan(self):
        self.health_stats['scans_total'] += 1
        self.health_stats['last_scan'] = datetime.now().isoformat()
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'anomalies': [],
                'trends': [],
                'confidence': 1.0
            }

            # Pre-flight
            if not self._check_preflight():
                report['anomalies'].append("SYSTEM_ERROR: Docker-Daemon nicht erreichbar. Monitoring eingeschränkt.")

            # Resource Trends
            try:
                du_pct = psutil.disk_usage('/').percent
                ram_pct = psutil.virtual_memory().percent
                predictions = trend_predictor.record_and_predict(du_pct, ram_pct)
                for pred in predictions:
                    report['anomalies'].append(f"PREDICTION: {pred}")
                    if "KRITISCH" in pred and du_pct > 85:
                        # Berechne Confidence
                        confidence = 0.95 if du_pct > 90 else 0.88
                        action_engine.execute_safe_action(
                            "docker_log_cleanup", 
                            self._cleanup_docker_logs, 
                            "Notfall-Log-Cleanup wegen Speicherplatz-Trend",
                            confidence=confidence
                        )
            except Exception as e:
                report['anomalies'].append(f"RESOURCE_ERROR: Metriken konnten nicht gelesen werden ({str(e)})")

            # Database Optimization
            try:
                db_path = os.path.join(Config.DATA_PATH, "dashboard.db")
                if os.path.exists(db_path) and os.path.getsize(db_path) > 100 * 1024 * 1024: # 100MB
                    action_engine.execute_safe_action(
                        "db_optimization",
                        self._optimize_databases,
                        "SQLite VACUUM Operation zur Speicherplatz-Rückgewinnung",
                        confidence=0.98
                    )
            except Exception: pass

            # Log Rotation
            try:
                action_engine.execute_safe_action(
                    "log_rotation",
                    rotate_logs,
                    "Automatisierte Rotation der System- und Audit-Logs",
                    confidence=1.0
                )
            except: pass

            # Network Self-Healing
            try:
                if not self._check_network_health():
                    report['anomalies'].append("NET_FAILURE: Externer Ping fehlgeschlagen. Prüfe VPN/Gateway.")
                    action_engine.execute_safe_action(
                        "network_repair",
                        self._attempt_network_repair,
                        "Gateway/DNS Check und Cache-Flush",
                        confidence=0.90
                    )
            except: pass

            # Container Stability Auto-Fix
            try:
                action_engine.execute_safe_action(
                    "container_fix",
                    check_container_stability,
                    "Automatischer Neustart instabiler Docker-Container",
                    confidence=1.0
                )
            except: pass

            # Security Audit (Logins)
            try:
                sec_report = self._check_security_audit()
                if sec_report['failed_count'] > 5 or sec_report['new_bans']:
                    msg = f"SECURITY_ALERT: {sec_report['failed_count']} Fehlversuche detektiert."
                    if sec_report['new_bans']:
                        msg += f" Automatischer Bann für: {', '.join(sec_report['new_bans'])}"
                    
                    report['anomalies'].append(msg)
                    action_engine.execute_safe_action(
                        "security_hardening",
                        lambda: f"Sicherheits-Audit abgeschlossen. {len(sec_report['new_bans'])} neue Bans.",
                        msg,
                        confidence=0.99
                    )
            except: pass

            # Weekly Security Audit Report
            try:
                action_engine.execute_safe_action(
                    "weekly_report",
                    self.generate_weekly_report,
                    "Automatisierte Erstellung des wöchentlichen Sicherheitsberichts",
                    confidence=1.0
                )
            except: pass

            # Service Health
            for service in self.critical_services:
                try:
                    state = self.get_container_status(service)
                    if not state:
                        report['anomalies'].append(f"Dienst-Ausfall: '{service}' offline oder nicht gefunden.")
                        # Queue critical action instead of automatic execution
                        action_engine.queue_critical_action(
                            name=f"Service_Restart_{service}",
                            command_str=f"docker restart {service}",
                            reason=f"Dienst '{service}' ist offline oder nicht erreichbar.",
                            risk="Kurze Unterbrechung des Dienstes, mögliche Datenverluste bei ungespeicherten Zuständen."
                        )
                        continue

                    logs = self.get_container_logs(service)
                    error_keywords = ['error', 'exception', 'failed', 'fatal', 'critical']
                    error_count = sum(1 for line in logs.split('\n') if any(kw in line.lower() for kw in error_keywords))

                    if not state.get('Running') or error_count > 10: # Erhöhe Schwelle für kritischen Auto-Vorschlag
                        msg = TacticalFormatter.format_anomaly(service, error_count, state.get('Status'))
                        report['anomalies'].append(msg)
                        if not state.get('Running'):
                             action_engine.queue_critical_action(
                                name=f"Service_Start_{service}",
                                command_str=f"docker start {service}",
                                reason=f"Dienst '{service}' ist nicht im Status 'Running'.",
                                risk="Minimal."
                            )
                except: pass

            if report['anomalies']:
                sum_msg = " | ".join(report['anomalies'][:3])
                action_engine.log_audit("Scan", "ALERT", sum_msg, ActionCategory.SAFE, status="warning")
                self.send_telegram_alert(report)
            
            return report
        except Exception as e:
            self.health_stats['errors_total'] += 1
            self.health_stats['last_error'] = str(e)
            print(f"[P.I.G.E.O.N.] Scan crashed: {e}")
            return {'error': str(e)}

    def _cleanup_docker_logs(self):
        subprocess.run("find /var/lib/docker/containers/ -type f -name \"*.log\" -exec truncate -s 0 {} +", shell=True, check=True)
        return "Logs bereinigt."

    def _optimize_databases(self):
        db_path = os.path.join(Config.DATA_PATH, "dashboard.db")
        subprocess.run(['sqlite3', db_path, 'VACUUM;'], check=True, timeout=30)
        return "Datenbank optimiert (VACUUM)."

    def _check_network_health(self):
        try:
            subprocess.run(['ping', '-c', '1', '-W', '2', '8.8.8.8'], capture_output=True, check=True)
            return True
        except:
            return False

    def _attempt_network_repair(self):
        # Basic repair: flush DNS or similar if possible in this context
        # For now, we just log the attempt and check local connectivity
        try:
            subprocess.run(['ping', '-c', '1', '-W', '1', '1.1.1.1'], capture_output=True, check=True)
            return "Backup-DNS (1.1.1.1) erreichbar. Primär-DNS (8.8.8.8) gestört."
        except:
            return "Vollständiger Netzwerk-Timeout. Prüfung der physischen Verbindung empfohlen."

    def _check_security_audit(self):
        """ Scans nexus_events.jsonl for brute force attempts and manages bans. """
        return check_security_audit()

    def generate_weekly_report(self):
        """ Generates a tactical markdown report for the last 7 days. """
        return generate_weekly_report()

    def start_background_monitoring(self, app):
        def watcher():
            print("[P.I.G.E.O.N.] Background Watcher active.")
            while True:
                try:
                    with app.app_context():
                        self.run_deep_scan()
                except Exception as e:
                    print(f"[P.I.G.E.O.N.] Watcher cycle error: {e}")
                time.sleep(1800)
        
        lock_file = "/tmp/pigeon_watcher.lock"
        try:
            # Handle stale locks
            if os.path.exists(lock_file):
                try: os.remove(lock_file)
                except: pass
            
            f = open(lock_file, "w")
            fcntl.lockf(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
            threading.Thread(target=watcher, daemon=True).start()
        except: pass

    def send_telegram_alert(self, report):
        if not report.get('anomalies'): return
        
        # Cooldown check for Telegram alerts
        ok, _ = action_engine._check_cooldown("telegram_alert")
        if not ok: return

        problems = "\n".join([f"⚠️ {a}" for a in report['anomalies'][:5]])
        message = f"🤖 <b>P.I.G.E.O.N. STATUS</b>\n\n{problems}\n\n<a href='{DASHBOARD_URL}'>👉 Dashboard</a>"
        try:
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage", 
                          json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}, timeout=10)
            action_engine._update_cooldown("telegram_alert")
        except: pass

pigeon_scanner = DeepHealthScanner()
