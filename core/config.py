import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me-set-a-real-secret-key')
    
    # Pfad-Erkennung
    PROJ_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_PATH = '/data' if os.path.exists('/data') and os.access('/data', os.W_OK) else os.path.join(PROJ_ROOT, 'data')
    
    # Datenbank
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(DATA_PATH, "dashboard.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.environ.get('DATA_DIR', '/data')
    LOG_DIR = os.environ.get('LOG_DIR', os.path.join(PROJ_ROOT, 'logs'))
    
    PROJECTS_FILE = os.path.join(DATA_DIR, 'projects.json')
    USAGE_FILE = os.path.join(DATA_DIR, 'token_usage.json')
    
    # Logs
    ACTIONS_LOG = os.path.join(LOG_DIR, 'aktionen.log')
    GEMINI_LOG = os.path.join(LOG_DIR, 'gemini.log')
    NEXUS_EVENTS_LOG = os.path.join(DATA_DIR, 'audit', 'nexus_events.jsonl')
    BANNED_IPS_FILE = os.path.join(DATA_DIR, 'security', 'banned_ips.json')
    WHITELIST_IPS_FILE = os.path.join(DATA_DIR, 'security', 'whitelist_ips.json')
    
    GROWBOX_PIN = os.environ.get('GROWBOX_PIN', '0000')
    LAMP_WEBHOOK_URL = os.environ.get('LAMP_WEBHOOK_URL', 'http://localhost:8767')
    LAMP_WEBHOOK_TOKEN = os.environ.get('LAMP_WEBHOOK_TOKEN', '')
    
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    XAI_API_KEY = os.environ.get('XAI_API_KEY')
    OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
    ENABLE_OLLAMA_FALLBACK = os.environ.get('ENABLE_OLLAMA_FALLBACK', '0') == '1'

    @classmethod
    def validate(cls):
        if not os.path.exists(cls.DATA_PATH): os.makedirs(cls.DATA_PATH, exist_ok=True)
        if not os.path.exists(cls.LOG_DIR): os.makedirs(cls.LOG_DIR, exist_ok=True)
        if cls.SECRET_KEY == 'change-me-set-a-real-secret-key':
            print('WARNING: Using default SECRET_KEY. Set SECRET_KEY in your .env file!')
