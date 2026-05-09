""" Globale Konstanten und Pfade """
import os
from datetime import timedelta

ALLOWED_EXTENSIONS = {
    '.py', '.sh', '.js', '.ts', '.json', '.yml', '.yaml',
    '.html', '.css', '.md', '.txt', '.conf', '.env', '.cfg',
    '.ini', '.toml', '.sql', '.dockerfile', '.service',
    '.nginx', '.j2', '.xml', '.csv', '.log', '.kdl',
}
SKIP_DIRS = {
    '__pycache__', 'venv', 'venv_tapo', 'tapo_venv', 'node_modules',
    '.git', '.idea', 'dist', 'build', 'logs', 'backups', 'berichte',
    'grow_archiv', 'geoip', 'tsdb_import', 'image-backup', 'ariang',
    'bin', 'skills', 'Pi-hole', 'wazuh-docker', 'jdownloader',
    'image_backup', 'data',
}
SKIP_SUFFIXES = ('.bak', '.backup', '.old', '.bak_20260315_003819', '.log',
                 '.png', '.jpg', '.jpeg', '.gif', '.ico', '.state',
                 '.txt.bak', 'cron.log')
SKIP_FILES = {'.DS_Store', 'Thumbs.db', 'cookies.txt', 'grafana_token.txt',
              'sa_id.txt', 'voe_links.txt', '.env'}
BASE_PATH  = os.path.expanduser('~')

LANG_MAP = {
    '.py': 'python', '.sh': 'bash', '.js': 'javascript', '.ts': 'typescript',
    '.json': 'json', '.yml': 'yaml', '.yaml': 'yaml', '.html': 'html',
    '.css': 'css', '.md': 'markdown', '.sql': 'sql', '.xml': 'xml',
    '.toml': 'toml', '.ini': 'ini', '.conf': 'nginx', '.nginx': 'nginx',
    '.service': 'ini', '.kdl': 'text',
}

FILE_ICONS = {
    'py': '🐍', 'sh': '⚡', 'bash': '⚡', 'json': '{ }',
    'yml': '📋', 'yaml': '📋', 'md': '📝', 'html': '🌐',
    'css': '🎨', 'js': '🌐', 'ts': '🌐', 'sql': '🗄',
    'conf': '⚙', 'ini': '⚙', 'cfg': '⚙', 'env': '🔑',
    'txt': '📄', 'toml': '⚙', 'dockerfile': '🐳', 'service': '⚙',
    'xml': '📋', 'kdl': '📋',
}

LOGIN_USER     = os.environ.get('LOGIN_USER',     'admin')
LOGIN_PASSWORD = os.environ.get('LOGIN_PASSWORD', 'change_me')

DATA_FILE = os.environ.get('DATA_FILE', '/data/projects.json')
COLUMNS = ['offen', 'in-arbeit', 'review', 'erledigt']

USAGE_FILE = os.environ.get('USAGE_FILE', '/data/token_usage.json')
# AI Limits
GROQ_LIMITS = {'day': 500_000, 'minute': 6_000}

# Bot & Service URLs
BOT_CTRL_URL = os.environ.get('BOT_CTRL_URL', 'http://localhost:5667')
CTRL_TOKEN   = os.environ.get('CTRL_TOKEN',   'default-token')
PROM_URL     = os.environ.get('PROM_URL',     'http://localhost:9090/api/v1/query')
n8n_BASE_URL = os.environ.get('N8N_BASE_URL', 'http://localhost:5678')
