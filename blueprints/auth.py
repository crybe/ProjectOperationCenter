import hmac
from flask import Blueprint, render_template, request, redirect, url_for, session
from werkzeug.security import check_password_hash, generate_password_hash
from core.constants import LOGIN_USER, LOGIN_PASSWORD
from core.models import User
from core.db import db
from core import utils

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # If user visits login page with ?reauth=1, clear the logout cookie
    if request.args.get('reauth') == '1':
        resp = redirect('/login')
        resp.set_cookie('tactical_logout', '', expires=0)
        return resp

    error = None
    # Skip proxy login if manual logout cookie is present
    if request.cookies.get('tactical_logout') != '1':
        if utils.sync_proxy_login():
            next_page = request.args.get('next')
            return redirect(next_page or '/ui/')
    
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        
        # Clear logout cookie on manual login
        resp_redirect = None
        
        # 1. Check Database User
        user = User.query.filter_by(username=username).first()
        auth_success = False
        
        if user and user.is_active:
            if check_password_hash(user.password_hash, password):
                auth_success = True
                session['user_role'] = user.role
        
        # 2. Legacy Fallback (if no DB user matched)
        if not auth_success:
            if hmac.compare_digest(username, LOGIN_USER) and hmac.compare_digest(password, LOGIN_PASSWORD):
                auth_success = True
                session['user_role'] = 'admin'
        
        if auth_success:
            session.permanent = True
            session['logged_in'] = True
            session['username'] = username
            utils.log_action("auth", "LOGIN_SUCCESS", f"Benutzer: {username} von {request.remote_addr}")
            next_page = request.args.get('next')
            resp = redirect(next_page or '/ui/')
            # Clear tactical logout cookie
            resp.set_cookie('tactical_logout', '', expires=0)
            return resp
        else:
            utils.log_action("auth", "LOGIN_FAILED", f"Versuch: {username} von {request.remote_addr}", source=utils.EventSource.API)
            error = 'Ungültige Zugangsdaten'
            
    return render_template('login.html', error=error, manual_logout=request.cookies.get('tactical_logout') == '1')

@auth_bp.route('/logout')
def logout():
    session.clear()
    resp = redirect('/login?logout=1')
    # Set a cookie to prevent immediate auto-login from proxy headers
    resp.set_cookie('tactical_logout', '1', max_age=3600)
    return resp
