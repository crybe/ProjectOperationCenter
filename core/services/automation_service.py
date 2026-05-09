""" Automatisierungs-Engine für Tasks """
import os
import re
import json
from datetime import datetime
from core.utils import load_projects, save_projects, safe_path, make_id

def _ensure_project_file_path(project, file_path):
    if not file_path: return
    fps = project.setdefault('file_paths', [])
    if file_path not in fps:
        # Wenn es eine Datei im Hauptverzeichnis ist, nimm den Ordner
        dir_p = os.path.dirname(file_path)
        if dir_p and dir_p not in fps and dir_p != '/home/user':
            fps.append(dir_p)
        else:
            fps.append(file_path)

def _apply_task_patch(project, task):
    patch = task.get('ai_patch')
    if not patch: return False, "Kein Patch gefunden", None
    real = safe_path(patch['file'])
    if not real: return False, f"Pfad nicht erlaubt: {patch['file']}", None
    try:
        os.makedirs(os.path.dirname(real), exist_ok=True)
        with open(real, 'w', encoding='utf-8') as f:
            f.write(patch['content'])
        task['status'] = 'erledigt'
        task['ai_applied'] = datetime.now().strftime('%Y-%m-%d %H:%M')
        _ensure_project_file_path(project, real)
        project.setdefault('changelog', []).insert(0, {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'version': 'AI-Patch',
            'changes': f"Task '{task['title']}' automatisch angewendet auf {os.path.basename(real)}"
        })
        return True, None, real
    except Exception as e:
        return False, str(e), None

def _handle_task_status_change(project, task, new_status):
    old_status = task.get('status')
    task['status'] = new_status
    if new_status == 'erledigt' and old_status != 'erledigt':
        if task.get('ai_patch') and not task.get('ai_applied'):
            return _apply_task_patch(project, task)
    return True, None, None

def _upsert_generated_project(projects_list, parent_proj, task, file_path):
    pid = f"ki-gen-{make_id(task['title'], [])}"
    now = datetime.now().strftime('%Y-%m-%d')
    file_name = os.path.basename(file_path)
    project = next((p for p in projects_list if p['id'] == pid), None)
    if not project:
        project = {
            'id': pid,
            'name': task['title'],
            'description': task.get('description', f'Automatisch von KI generiert aus Projekt "{parent_proj.get("name", "")}"'),
            'status': 'active',
            'server_path': os.path.dirname(file_path),
            'file_paths': [file_path],
            'tags': ['ki-generiert', 'auto'],
            'created': now,
            'updated': now,
            'tasks': [],
            'changelog': [{
                'date': now,
                'version': '1.0',
                'changes': f'Initiale Version: {file_name} von KI generiert und angewendet',
            }],
            'notes_list': [],
        }
        projects_list.append(project)
    else:
        project['updated'] = now
        if file_path not in project.get('file_paths', []):
            project.setdefault('file_paths', []).append(file_path)
        project.setdefault('changelog', []).insert(0, {
            'date': now,
            'version': 'Update',
            'changes': f'{file_name} von KI aktualisiert',
        })
    return project

def auto_seed_automation_tasks(projects):
    # Logik zum automatischen Hinzufügen von n8n/System-Tasks falls nötig
    pass
