""" Langzeitgedächtnis und Kontext-Management für die KI """
import os
import json
import uuid
from datetime import datetime
from intelligence_worker.ai_logic import _extract_json
from core.utils import safe_load_json, safe_write_json

# Using the project's standard absolute path pattern
MEMORY_FILE = '/app/data/system_memory.json'

def load_memory():
    return safe_load_json(MEMORY_FILE, default=[])

def save_memory(memories):
    return safe_write_json(MEMORY_FILE, memories)

def add_memory(title, content, category='info', importance=1):
    memories = load_memory()
    memory = {
        'id': str(uuid.uuid4()),
        'timestamp': datetime.now().isoformat(),
        'date': datetime.now().strftime('%Y-%m-%d'),
        'time': datetime.now().strftime('%H:%M'),
        'title': title,
        'content': content,
        'category': category,
        'importance': importance
    }
    memories.insert(0, memory)
    # Keep last 100 memories to prevent bloat
    save_memory(memories[:100])
    return memory

def distill_logs(log_lines, ai_caller_func):
    """
    Takes log lines and uses AI to distill them into memories.
    ai_caller_func: a function that takes a prompt and returns a string response.
    """
    if not log_lines:
        return []
        
    # We take a reasonable chunk of logs for analysis
    context = "\n".join(log_lines[-80:]) 
    
    prompt = f"""
    Du bist der 'Nexus Memory Distiller'. Deine Aufgabe ist es, aus System-Logs wichtige 'Erinnerungen' zu extrahieren.
    Konzentriere dich auf signifikante Ereignisse, Fehler und KI-Aktionen.
    
    LOGS:
    {context}
    
    Antworte AUSSCHLIESSLICH als JSON-Array von Objekten:
    [
      {{
        "title": "Kurzer technischer Titel", 
        "content": "Destillierte Zusammenfassung des Ereignisses", 
        "category": "system|grow|ki|security", 
        "importance": 1-5,
        "confidence": 0-100,
        "impact_score": 0-100,
        "alternatives": ["Alt 1", "Alt 2"],
        "tech_specs": {{"Key": "Value"}}
      }}
    ]
    """
    
    raw = ai_caller_func(prompt)
    if not raw:
        return []
        
    try:
        # Extract JSON from AI response
        new_memories = _extract_json(raw)
        if not isinstance(new_memories, list):
            return []
            
        stored = load_memory()
        existing_titles = {m['title'].lower() for m in stored[:30]} # Check last 30 for duplicates
        
        added = []
        for m in new_memories:
            title = m.get('title', '').strip()
            if title and title.lower() not in existing_titles:
                mem = add_memory(
                    title, 
                    m.get('content', ''), 
                    m.get('category', 'info'), 
                    m.get('importance', 1)
                )
                added.append(mem)
                existing_titles.add(title.lower())
                
        return added
    except Exception as e:
        print(f"[Memory] Distill error: {e}")
        return []
