""" Flask-Erweiterungen und globale Objekte """
from copy import deepcopy

EXTENSION_REGISTRY = {
    'dashboard': {
        'id': 'dashboard',
        'title': 'Dashboard',
        'icon': 'layout-dashboard',
        'group': 'navigation',
        'order': 10,
        'enabled': True,
        'endpoint': 'dashboard.dashboard',
        'subtitle': 'Übersicht öffnen',
    },
    'services': {
        'id': 'services',
        'title': 'Dienste',
        'icon': 'server',
        'group': 'navigation',
        'order': 20,
        'enabled': True,
        'endpoint': 'api.services',
        'subtitle': 'Systemd und Docker',
    },
    'chat_log': {
        'id': 'chat_log',
        'title': 'KI-Gespräche',
        'icon': 'message-square',
        'group': 'navigation',
        'order': 30,
        'enabled': True,
        'endpoint': 'chat_log.chat_log',
        'subtitle': 'Verläufe und Sessions',
    },
    'shortcuts': {
        'id': 'shortcuts',
        'title': 'Shortcuts',
        'icon': 'terminal',
        'group': 'navigation',
        'order': 40,
        'enabled': True,
        'endpoint': 'api.shortcuts_page',
        'subtitle': 'Terminal-Kommandos',
    },
    'grow_log': {
        'id': 'grow_log',
        'title': 'Growbox Log',
        'icon': 'leaf',
        'group': 'navigation',
        'order': 50,
        'enabled': True,
        'endpoint': 'api.grow_log_page',
        'subtitle': 'Grow-Verlauf und Metriken',
    },
    'design': {
        'id': 'design',
        'title': 'Design Studio',
        'icon': 'palette',
        'group': 'navigation',
        'order': 60,
        'enabled': True,
        'endpoint': 'design.design',
        'subtitle': 'Theme und Panels steuern',
    },
    'n8n_ai_projects': {
        'id': 'n8n_ai_projects',
        'title': 'N8N AI Projects',
        'icon': 'workflow',
        'group': 'navigation',
        'order': 70,
        'enabled': True,
        'target_type': 'n8n_project',
        'subtitle': 'Schnellzugriff auf das N8N-Projekt',
    },
}


def default_extensions_config():
    return {
        'items': [
            {
                'id': item['id'],
                'group': item['group'],
                'order': item['order'],
                'enabled': item.get('enabled', True),
                'title': item['title'],
            }
            for item in EXTENSION_REGISTRY.values()
        ]
    }


def hydrate_extension_items(config_items):
    result = []
    for item in config_items:
        reg = EXTENSION_REGISTRY.get(item['id'])
        if not reg:
            continue
        merged = deepcopy(reg)
        merged['enabled'] = bool(item.get('enabled', reg.get('enabled', True)))
        merged['order'] = item.get('order', reg.get('order', 999))
        title = str(item.get('title', reg['title'])).strip()
        if title:
            merged['title'] = title[:80]
        result.append(merged)
    result.sort(key=lambda ext: (ext.get('order', 999), ext['id']))
    return result
