import json
from datetime import datetime
from core.db import db

class Project(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    status = db.Column(db.String(50), default='active')
    server_path = db.Column(db.String(300), default='')
    git_repo = db.Column(db.String(300), default='')
    tags = db.Column(db.JSON, default=list)
    file_paths = db.Column(db.JSON, default=list)
    created = db.Column(db.String(50), default=lambda: datetime.now().strftime('%Y-%m-%d'))
    updated = db.Column(db.String(50), default=lambda: datetime.now().strftime('%Y-%m-%d'))
    
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan', order_by='desc(Task.created)')
    changelogs = db.relationship('Changelog', backref='project', lazy=True, cascade='all, delete-orphan', order_by='desc(Changelog.date)')
    notes = db.relationship('Note', backref='project', lazy=True, cascade='all, delete-orphan', order_by='desc(Note.created)')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'server_path': self.server_path,
            'git_repo': self.git_repo,
            'tags': self.tags or [],
            'file_paths': self.file_paths or [],
            'created': self.created,
            'updated': self.updated,
            'tasks': [t.to_dict() for t in self.tasks],
            'changelog': [c.to_dict() for c in self.changelogs],
            'notes_list': [n.to_dict() for n in self.notes]
        }

class Task(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    project_id = db.Column(db.String(100), db.ForeignKey('project.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='offen')
    labels = db.Column(db.JSON, default=list)
    description = db.Column(db.Text, default='')
    due_date = db.Column(db.String(50), default='')
    created = db.Column(db.String(50), default=lambda: datetime.now().strftime('%Y-%m-%d'))
    automation_slug = db.Column(db.String(100), default='')
    ai_applied = db.Column(db.String(50), default='')
    ai_patch = db.Column(db.JSON, default=dict)
    progress = db.Column(db.Integer, default=0)
    current_step = db.Column(db.String(200), default='')
    agent_started = db.Column(db.String(50), default='')
    agent_error = db.Column(db.Text, default='')
    target_file = db.Column(db.String(300), default='')
    target_file_hint = db.Column(db.String(300), default='')

    def to_dict(self):
        d = {
            'id': self.id,
            'title': self.title,
            'status': self.status,
            'labels': self.labels or [],
            'description': self.description,
            'created': self.created
        }
        if self.due_date: d['due_date'] = self.due_date
        if self.automation_slug: d['automation_slug'] = self.automation_slug
        if self.ai_applied: d['ai_applied'] = self.ai_applied
        if self.ai_patch: d['ai_patch'] = self.ai_patch
        if self.progress is not None: d['progress'] = self.progress
        if self.current_step: d['current_step'] = self.current_step
        if self.agent_started: d['agent_started'] = self.agent_started
        if self.agent_error: d['agent_error'] = self.agent_error
        if self.target_file: d['target_file'] = self.target_file
        if self.target_file_hint: d['target_file_hint'] = self.target_file_hint
        return d

class Changelog(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.String(100), db.ForeignKey('project.id'), nullable=False)
    date = db.Column(db.String(50))
    version = db.Column(db.String(50))
    changes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'version': self.version,
            'changes': self.changes
        }

class Note(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    project_id = db.Column(db.String(100), db.ForeignKey('project.id'), nullable=False)
    content = db.Column(db.Text)
    created = db.Column(db.String(50))
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'created': self.created
        }

class ChatSession(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    session_id = db.Column(db.String(100))
    title = db.Column(db.String(200))
    provider = db.Column(db.String(50))
    created = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'title': self.title,
            'provider': self.provider,
            'created': self.created.isoformat() if isinstance(self.created, datetime) else self.created,
            'messages': self.messages or []
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), default='operator') # admin, operator, guest
    is_active = db.Column(db.Boolean, default=True)
    created = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'is_active': self.is_active,
            'created': self.created.isoformat()
        }
