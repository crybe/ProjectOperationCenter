import os
import mimetypes
from datetime import datetime, timedelta
from flask import Flask, session, redirect, request, jsonify, render_template as render
from werkzeug.exceptions import NotFound
from werkzeug.middleware.proxy_fix import ProxyFix

# Import der Blueprints (Modularisierte Route-Handler)
from blueprints.auth import auth_bp
from blueprints.dashboard import dashboard_bp
from blueprints.board import board_bp
from blueprints.files import files_bp
from blueprints.api import api_bp
from intelligence_worker.ai import ai_bp
from blueprints.design import design_bp
from blueprints.chat_log import chat_log_bp
from blueprints.react_ui import react_ui_bp
from blueprints.api_sentinel import api_sentinel_bp
from blueprints.vps import vps_bp
from blueprints.git_log import git_log_bp
from blueprints.extended_stats import extended_bp
from blueprints.api.grow_api import grow_api_bp
from blueprints.api.sentinel_api import sentinel_api_bp
from blueprints.api.storage_api import storage_api_bp
from blueprints.api.system_api import system_api_bp

from core.config import Config

def create_app():
    app = Flask(__name__)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
    mimetypes.add_type('image/webp', '.webp')
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(days=7)
    
    app.config.from_object(Config)
    Config.validate()
    
    app.permanent_session_lifetime = timedelta(hours=8)
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        # We don't want to log 404s as errors unless it's unusual
        if not isinstance(e, NotFound):
            app.logger.error(f"Unhandled Exception: {str(e)}")
        
        # If it's a 404, we return a proper 404 JSON for API calls
        if isinstance(e, NotFound):
            if request.path.startswith('/api/'):
                return jsonify({
                    'ok': False, 
                    'error': 'Not Found', 
                    'details': f"Der Endpunkt '{request.path}' existiert nicht."
                }), 404
            return render('404.html'), 404
            
        if request.path.startswith('/api/'):
            import traceback
            error_details = traceback.format_exc() if app.debug or True else 'Kontaktieren Sie den Administrator'
            return jsonify({
                'ok': False, 
                'error': 'Interner Serverfehler', 
                'details': error_details
            }), 500
        return render('500.html', error=str(e)), 500

    from core.db import db
    db.init_app(app)
    
    with app.app_context():
        from core.models import Project, Task, Changelog, Note, ChatSession, User
        db.create_all()
        from core.migrate import migrate_json_to_db
        try:
            migrate_json_to_db()
        except Exception as e:
            print(f'Migration error: {e}')

    from core.ai_agent import start_agent, start_json_agent
    from intelligence_worker.pigeon_engine import pigeon_scanner
    try:
        start_agent(app)
        start_json_agent(app)
        pigeon_scanner.start_background_monitoring(app)
    except Exception as e:
        print(f'AI Agent / P.I.G.E.O.N. start error: {e}')

    @app.template_global()
    def now():
        return datetime.now()

    @app.template_global()
    def asset_version(filename):
        try:
            static_root = os.path.join(app.root_path, 'static')
            return int(os.path.getmtime(os.path.join(static_root, filename)))
        except OSError:
            return int(datetime.now().timestamp())

    from core.utils import load_projects
    @app.context_processor
    def inject_sidebar():
        projects = load_projects()
        n8n_proj = next((p for p in projects if p['id'] == 'n8n-ai-projects'), None)
        return dict(sidebar_projects=projects, sidebar_n8n_project=n8n_proj)

    @app.before_request
    def check_banned_ips():
        from core.utils import safe_load_json
        from datetime import datetime
        # 1. Whitelist-Check
        whitelist = safe_load_json(Config.WHITELIST_IPS_FILE, default=['127.0.0.1'])
        if request.remote_addr in whitelist:
            return None
            
        # 2. Ban-Check (with Expiry)
        banned_data = safe_load_json(Config.BANNED_IPS_FILE, default=[])
        now = datetime.now().isoformat()
        
        for entry in banned_data:
            if isinstance(entry, dict) and entry.get('ip') == request.remote_addr:
                expiry = entry.get('expiry')
                if not expiry or expiry > now:
                    return jsonify({"ok": False, "error": "BANNED", "details": f"IP gesperrt bis {expiry if expiry else 'unendlich'}."}), 403
                break # Expired entries are handled by P.I.G.E.O.N. scan
                
    # 3. Simple Rate Limiting (Exposed for Analytics)
    app.rate_limiter_data = {}
    @app.before_request
    def rate_limit_middleware():
        from time import time
        from core.utils import safe_load_json
        
        # Exclude static assets and UI entry points
        if (request.path.startswith('/static/') 
            or request.path.startswith('/ui/') 
            or request.path == '/favicon.ico'
            or request.path == '/health'):
            return None
        
        ip = request.remote_addr
        
        # Whitelist & Local Network Bypass
        whitelist = safe_load_json(Config.WHITELIST_IPS_FILE, default=['127.0.0.1'])
        if ip in whitelist or ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
            return None
            
        now = time()
        window = 60 # 1 minute
        limit = 200 # 200 requests per minute
        
        history = app.rate_limiter_data.get(ip, [])
        history = [t for t in history if now - t < window]
        
        if len(history) >= limit:
            return jsonify({"ok": False, "error": "RATE_LIMIT", "details": "Zu viele Anfragen. Bitte warten."}), 429
            
        history.append(now)
        app.rate_limiter_data[ip] = history

    _PASS_THROUGH = ('/health', '/login', '/logout', '/ui', '/ui/', '/favicon.ico')
    @app.before_request
    def redirect_old_ui():
        p = request.path
        if p in ('/ui/login', '/ui/login/'):
            return redirect('/login')
        
        # Only redirect if it's the root or a known old path that needs migration
        # This prevents redirect loops for unknown assets or sub-paths
        if p == '/':
            return redirect('/ui/')
            
        return None

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(board_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(design_bp)
    app.register_blueprint(chat_log_bp)
    app.register_blueprint(react_ui_bp)
    app.register_blueprint(api_sentinel_bp)
    app.register_blueprint(vps_bp)
    app.register_blueprint(git_log_bp)
    app.register_blueprint(extended_bp)
    app.register_blueprint(grow_api_bp)
    app.register_blueprint(sentinel_api_bp)
    app.register_blueprint(storage_api_bp)
    app.register_blueprint(system_api_bp)

    return app

app = create_app()

@app.route('/health')
def health():
    from flask import jsonify
    from core.db import db
    from sqlalchemy import text
    import shutil
    health_status = {'status': 'ok', 'timestamp': datetime.now().isoformat(), 'checks': {}}
    try:
        db.session.execute(text('SELECT 1')).scalar()
        health_status['checks']['database'] = 'connected'
    except Exception as e:
        health_status['status'] = 'error'
        health_status['checks']['database'] = f'failed: {str(e)}'
    try:
        du = shutil.disk_usage('/')
        free_gb = du.free / (1024**3)
        health_status['checks']['storage'] = f'{free_gb:.1f} GB free'
        if free_gb < 1.0: health_status['status'] = 'degraded'
    except Exception: health_status['checks']['storage'] = 'unknown'
    code = 200 if health_status['status'] != 'error' else 500
    return jsonify(health_status), code

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
