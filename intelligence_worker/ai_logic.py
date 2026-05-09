""" KI-Verarbeitungslogik und JSON-Extraktion """
import json
import re
import urllib.request
import os
import subprocess

def build_project_context(project):
    ctx = f"Projekt: {project['name']}\n"
    if project.get('description'): ctx += f"Beschreibung: {project['description']}\n"
    if project.get('tags'): ctx += f"Tags: {', '.join(project['tags'])}\n"
    return ctx

def _stream_openai_compatible_chat(url, api_key, payload, timeout=120, extra_headers=None):
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
    if extra_headers: headers.update(extra_headers)
    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
    return urllib.request.urlopen(req, timeout=timeout)

def _stream_ollama_generate(prompt, model="llama3.2:3b", timeout=300):
    host = os.environ.get('OLLAMA_HOST', 'http://host.docker.internal:11434')
    payload = json.dumps({'model': model, 'prompt': prompt, 'stream': True}).encode('utf-8')
    req = urllib.request.Request(f'{host}/api/generate', data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    return urllib.request.urlopen(req, timeout=timeout)

def _extract_json(text):
    text = text.strip()
    if text.startswith('```json'):
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
    elif text.startswith('```'):
        text = re.sub(r'^```\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
    
    # Suche nach dem ersten { und letzten }
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        text = text[start:end+1]
    return json.loads(text)

def _syntax_check(file_path, content):
    if not file_path or not content: return True, ""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.py':
        try:
            compile(content, file_path, 'exec')
            return True, ""
        except Exception as e:
            return False, str(e)
    if ext == '.json':
        try:
            json.loads(content)
            return True, ""
        except Exception as e:
            return False, str(e)
    return True, ""

def _normalize_n8n_workflow_content(content):
    try:
        data = json.loads(content)
        if isinstance(data, list): return json.dumps(data)
        if isinstance(data, dict) and 'nodes' in data: return json.dumps(data)
    except: pass
    return content

def _build_n8n_starter_workflow(name):
    return json.dumps({
        "nodes": [{"parameters": {}, "name": "Start", "type": "n8n-nodes-base.start", "typeVersion": 1, "position": [250, 300]}],
        "connections": {}
    })

def _extract_chat_message_text(chat_response):
    try:
        return chat_response['choices'][0]['message']['content']
    except:
        return ""
