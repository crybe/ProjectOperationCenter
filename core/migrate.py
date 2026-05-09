import os
import json
import fcntl
from datetime import datetime
from core.db import db
from core.models import Project, Task, Changelog, Note, ChatSession
from core.constants import DATA_FILE

CHAT_LOG_FILE = '/app/data/chat_log.json'

def migrate_json_to_db():
    migrate_projects()
    migrate_chat_log()

def migrate_projects():
    if not os.path.exists(DATA_FILE):
        return
    if Project.query.first():
        return
    print('Migrating projects.json to SQLite...')
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for p_data in data:
        p = Project(
            id=p_data['id'], name=p_data['name'], description=p_data.get('description', ''),
            status=p_data.get('status', 'active'), server_path=p_data.get('server_path', ''),
            git_repo=p_data.get('git_repo', ''), tags=p_data.get('tags', []),
            file_paths=p_data.get('file_paths', []), created=p_data.get('created', ''),
            updated=p_data.get('updated', '')
        )
        db.session.add(p)
        for t_data in p_data.get('tasks', []):
            db.session.add(Task(
                id=t_data['id'], project_id=p_data['id'], title=t_data['title'],
                status=t_data['status'], labels=t_data.get('labels', []),
                description=t_data.get('description', ''), due_date=t_data.get('due_date', ''),
                created=t_data.get('created', ''), automation_slug=t_data.get('automation_slug', ''),
                ai_applied=t_data.get('ai_applied', '')
            ))
        for n_data in p_data.get('notes_list', []):
            db.session.add(Note(
                id=n_data['id'], project_id=p_data['id'], content=n_data['content'],
                created=n_data.get('created', '')
            ))
        for cl_data in p_data.get('changelog', []):
            db.session.add(Changelog(
                project_id=p_data['id'], date=cl_data.get('date', ''),
                version=cl_data.get('version', ''), changes=cl_data.get('changes', '')
            ))
    db.session.commit()

def migrate_chat_log():
    if not os.path.exists(CHAT_LOG_FILE):
        return
    if ChatSession.query.first():
        return
    print('Migrating chat_log.json to SQLite...')
    with open(CHAT_LOG_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for c_data in data:
        session = ChatSession(
            id=c_data.get('id'),
            session_id=c_data.get('session_id'),
            title=c_data.get('title', 'Untitled'),
            provider=c_data.get('provider', 'unknown'),
            messages=c_data.get('messages', [])
        )
        db.session.add(session)
    db.session.commit()
    print('Chat migration completed.')
