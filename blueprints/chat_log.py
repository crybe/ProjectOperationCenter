import os
import json
import uuid
import time
import urllib.request
from datetime import datetime
from flask import Blueprint, render_template as render, request, jsonify, redirect, url_for
from core.utils import login_required
from core.db import db
from core.models import ChatSession

chat_log_bp = Blueprint('chat_log', __name__)

LIVE_FILE = '/app/data/live_session.json'
LIVE_SECS = 600

PROVIDER_META = {
    'claude':  {'label': 'Claude',  'color': '#d97706', 'icon': 'bot'},
    'gemini':  {'label': 'Gemini',  'color': '#4285f4', 'icon': 'gemini'},
    'codex':   {'label': 'Codex',   'color': '#10a37f', 'icon': 'code'},
    'other':   {'label': 'Sonstige','color': '#6b7280', 'icon': 'message-circle'},
}

def _active_session_id():
    try:
        if os.path.exists(LIVE_FILE):
            with open(LIVE_FILE) as f:
                d = json.load(f)
            if time.time() - d.get('ts', 0) < LIVE_SECS:
                return d.get('session_id')
    except: pass
    return None

def _token_ok():
    token = os.environ.get('CHAT_LOG_TOKEN', '')
    return token and request.headers.get('X-Chat-Log-Token') == token

@chat_log_bp.route('/chat-log')
@login_required
def chat_log():
    provider_filter = request.args.get('provider', '')
    query = ChatSession.query
    if provider_filter:
        query = query.filter_by(provider=provider_filter)
    
    all_sessions = ChatSession.query.order_by(ChatSession.created.desc()).all()
    sessions = query.order_by(ChatSession.created.desc()).all()
    
    live_sid = _active_session_id()
    
    tok_in = tok_out = 0
    for s in all_sessions:
        for m in (s.messages or []):
            content = m.get('content') or ''
            chars = len(content)
            if m.get('role') == 'user':      tok_in  += chars // 4
            elif m.get('role') == 'assistant': tok_out += chars // 4

    return render('chat_log.html', 
                  entries=[s.to_dict() for s in sessions], 
                  all_entries=[s.to_dict() for s in all_sessions],
                  all_count=len(all_sessions), 
                  provider_meta=PROVIDER_META,
                  active_page='chat-log', 
                  provider_filter=provider_filter, 
                  live_sid=live_sid,
                  tok_in=tok_in, 
                  tok_out=tok_out)

@chat_log_bp.route('/chat-log/<eid>')
@login_required
def chat_log_detail(eid):
    session = ChatSession.query.get(eid)
    if not session:
        return redirect(url_for('chat_log.chat_log'))
    return render('chat_log_detail.html', entry=session.to_dict(), provider_meta=PROVIDER_META, active_page='chat-log', live_sid=_active_session_id())

@chat_log_bp.route('/api/chat-log', methods=['POST'])
def api_chat_log_create():
    from flask import session as flask_session
    if not flask_session.get('logged_in') and not _token_ok():
        return jsonify({'error': 'Nicht autorisiert'}), 401
    
    body = request.get_json(silent=True) or {}
    sid = (body.get('session_id') or '').strip()
    
    if sid and ChatSession.query.filter_by(session_id=sid).first():
        return jsonify({'ok': True, 'skipped': True}), 200
    
    title = (body.get('title') or '').strip() or 'Gespräch ' + datetime.now().strftime('%d.%m.%Y %H:%M')
    provider = body.get('provider', 'other').lower()
    if provider not in PROVIDER_META: provider = 'other'
    
    new_session = ChatSession(
        id=str(uuid.uuid4()),
        session_id=sid,
        title=title,
        provider=provider,
        messages=body.get('messages', [])
    )
    db.session.add(new_session)
    db.session.commit()
    
    try:
        with open(LIVE_FILE, 'w') as f:
            json.dump({'session_id': sid or new_session.id, 'ts': time.time()}, f)
    except: pass
    
    return jsonify({'ok': True, 'id': new_session.id}), 201

@chat_log_bp.route('/api/chat-log/<eid>', methods=['DELETE'])
@login_required
def api_chat_log_delete(eid):
    session = ChatSession.query.get(eid)
    if session:
        db.session.delete(session)
        db.session.commit()
    return jsonify({'ok': True})

@chat_log_bp.route('/api/chat-log/<eid>/summarize', methods=['POST'])
@login_required
def api_summarize(eid):
    session = ChatSession.query.get(eid)
    if not session: return jsonify({'error': 'nicht gefunden'}), 404
    
    ollama_host  = os.environ.get('OLLAMA_HOST', 'http://host.docker.internal:11434')
    ollama_model = os.environ.get('OLLAMA_MODEL', 'llama3.2:3b')
    
    lines = []
    for m in (session.messages or [])[:30]:
        role = 'Du' if m.get('role') == 'user' else 'KI'
        content = (m.get('content') or '')[:600]
        lines.append(f'{role}: {content}')
    
    chat_text = '\n'.join(lines)
    prompt = f'Fasse dieses KI-Gespräch in 3-5 Sätzen auf Deutsch zusammen.\n\n{chat_text}'
    
    try:
        payload = json.dumps({'model': ollama_model, 'prompt': prompt, 'stream': False}).encode()
        req = urllib.request.Request(f'{ollama_host}/api/generate', data=payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
        return jsonify({'summary': result.get('response', '').strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
