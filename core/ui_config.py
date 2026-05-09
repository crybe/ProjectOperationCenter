""" Konfiguration der Tactical UI Elemente """
from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path
from core.dashboard_widgets import WIDGET_REGISTRY, default_dashboard_layout
from core.extensions import EXTENSION_REGISTRY, default_extensions_config, hydrate_extension_items

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / 'data'
STATIC_DIR = ROOT_DIR / 'static'

THEME_VARS_FILE = STATIC_DIR / 'theme-vars.css'
DASHBOARD_LAYOUT_FILE = DATA_DIR / 'dashboard_layout.json'
EXTENSIONS_CONFIG_FILE = DATA_DIR / 'extensions.json'

DEFAULT_THEME_VARS = {
    '--bg': '#020303',
    '--sidebar': '#050606',
    '--surface': 'rgba(8, 10, 9, 0.82)',
    '--surface2': 'rgba(13, 16, 15, 0.95)',
    '--border': 'rgba(141, 255, 177, 0.12)',
    '--text': '#edf7ef',
    '--muted': '#839485',
    '--accent': '#8dffb1',
    '--green': '#7fe39f',
    '--amber': '#f0bf74',
    '--red': '#ff7262',
    '--purple': '#b194f0',
    '--radius': '12px',
    '--sidebar-w': '280px',
    '--font-size': '15px',
}

THEME_PRESETS = {
    'Cyber Green': DEFAULT_THEME_VARS,
    'Steel Blue': {
        '--bg': '#091018',
        '--sidebar': '#0e1623',
        '--surface': 'rgba(20, 31, 48, 0.92)',
        '--surface2': 'rgba(24, 37, 57, 0.96)',
        '--border': 'rgba(125, 164, 214, 0.16)',
        '--text': '#edf3fb',
        '--muted': '#92a8c3',
        '--accent': '#6cb6ff',
        '--green': '#55d18a',
        '--amber': '#f0bf74',
        '--red': '#ff7d74',
        '--purple': '#a7b7ff',
        '--radius': '16px',
        '--sidebar-w': '288px',
        '--font-size': '15px',
    },
    'Graphite': {
        '--bg': '#0c0d0f',
        '--sidebar': '#111317',
        '--surface': 'rgba(23, 25, 30, 0.9)',
        '--surface2': 'rgba(31, 34, 41, 0.96)',
        '--border': 'rgba(255, 255, 255, 0.09)',
        '--text': '#f2f4f7',
        '--muted': '#9aa2b1',
        '--accent': '#f5c96a',
        '--green': '#79d9a2',
        '--amber': '#f5c96a',
        '--red': '#ff8278',
        '--purple': '#c2a5ff',
        '--radius': '14px',
        '--sidebar-w': '272px',
        '--font-size': '16px',
    },
}

PANEL_ZONES = {
    'hero_secondary': 'Hero rechts',
    'main_grid': 'Hauptbereich',
    'lower_sections': 'Untere Sektion',
}

DEFAULT_DASHBOARD_LAYOUT = default_dashboard_layout()

_CSS_COLOR_RE = re.compile(r'^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z-]+)$')
_CSS_SIZE_RE = re.compile(r'^\d{1,4}px$')


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def _read_json(path: Path, fallback: dict) -> dict:
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return deepcopy(fallback)


def read_theme_vars() -> dict:
    vars_dict = deepcopy(DEFAULT_THEME_VARS)
    if not THEME_VARS_FILE.exists():
        return vars_dict
    try:
        for line in THEME_VARS_FILE.read_text(encoding='utf-8').splitlines():
            if ':' not in line or not line.strip().startswith('--'):
                continue
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().rstrip(';')
            if key in vars_dict:
                vars_dict[key] = value
    except Exception:
        return deepcopy(DEFAULT_THEME_VARS)
    return vars_dict


def sanitize_theme_vars(payload: dict | None) -> dict:
    theme = deepcopy(DEFAULT_THEME_VARS)
    source = payload or {}
    for key, default in DEFAULT_THEME_VARS.items():
        value = str(source.get(key, default)).strip()
        if key in ('--radius', '--sidebar-w', '--font-size'):
            if _CSS_SIZE_RE.match(value):
                theme[key] = value
        elif _CSS_COLOR_RE.match(value) and len(value) <= 64:
            theme[key] = value
    return theme


def write_theme_vars(payload: dict | None) -> dict:
    theme = sanitize_theme_vars(payload)
    lines = [':root {']
    for key, value in theme.items():
        lines.append(f'  {key}: {value};')
    lines.append('}')
    THEME_VARS_FILE.parent.mkdir(parents=True, exist_ok=True)
    THEME_VARS_FILE.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return theme


def read_dashboard_layout() -> dict:
    stored = _read_json(DASHBOARD_LAYOUT_FILE, DEFAULT_DASHBOARD_LAYOUT)
    defaults_by_id = {panel['id']: panel for panel in DEFAULT_DASHBOARD_LAYOUT['panels']}
    panels = []
    seen = set()
    for raw in stored.get('panels', []):
        panel_id = raw.get('id')
        if panel_id not in defaults_by_id or panel_id in seen:
            continue
        base = deepcopy(defaults_by_id[panel_id])
        base['zone'] = raw.get('zone') if raw.get('zone') in PANEL_ZONES else base['zone']
        try:
            base['order'] = int(raw.get('order', base['order']))
        except (TypeError, ValueError):
            pass
        base['enabled'] = bool(raw.get('enabled', base['enabled']))
        title = str(raw.get('title', base['title'])).strip()
        desc = str(raw.get('description', base['description'])).strip()
        if title:
            base['title'] = title[:80]
        if desc:
            base['description'] = desc[:220]
        panels.append(base)
        seen.add(panel_id)
    for panel in DEFAULT_DASHBOARD_LAYOUT['panels']:
        if panel['id'] not in seen:
            panels.append(deepcopy(panel))
    panels.sort(key=lambda item: (item['zone'], item['order'], item['id']))
    return {'panels': panels}


def write_dashboard_layout(payload: dict | None) -> dict:
    if not payload:
        payload = deepcopy(DEFAULT_DASHBOARD_LAYOUT)
    layout = read_dashboard_layout()
    raw_panels = (payload or {}).get('panels', [])
    incoming = {panel.get('id'): panel for panel in raw_panels if isinstance(panel, dict)}
    merged = []
    for panel in layout['panels']:
        source = incoming.get(panel['id'], {})
        item = deepcopy(panel)
        if source.get('zone') in PANEL_ZONES:
            item['zone'] = source['zone']
        try:
            item['order'] = int(source.get('order', item['order']))
        except (TypeError, ValueError):
            pass
        item['enabled'] = bool(source.get('enabled', item['enabled']))
        title = str(source.get('title', item['title'])).strip()
        description = str(source.get('description', item['description'])).strip()
        if title:
            item['title'] = title[:80]
        if description:
            item['description'] = description[:220]
        merged.append(item)
    merged.sort(key=lambda item: (item['zone'], item['order'], item['id']))
    payload = {'panels': merged}
    _write_json(DASHBOARD_LAYOUT_FILE, payload)
    return payload


def grouped_dashboard_panels() -> dict:
    grouped = {zone: [] for zone in PANEL_ZONES}
    for panel in read_dashboard_layout()['panels']:
        if panel.get('enabled') and panel.get('id') in WIDGET_REGISTRY:
            grouped[panel['zone']].append(panel)
    for zone in grouped:
        grouped[zone].sort(key=lambda item: (item['order'], item['id']))
    return grouped


def read_extensions_config() -> dict:
    stored = _read_json(EXTENSIONS_CONFIG_FILE, default_extensions_config())
    defaults_by_id = {item['id']: item for item in default_extensions_config()['items']}
    items = []
    seen = set()
    for raw in stored.get('items', []):
        item_id = raw.get('id')
        if item_id not in defaults_by_id or item_id in seen:
            continue
        base = deepcopy(defaults_by_id[item_id])
        try:
            base['order'] = int(raw.get('order', base['order']))
        except (TypeError, ValueError):
            pass
        base['enabled'] = bool(raw.get('enabled', base['enabled']))
        title = str(raw.get('title', base['title'])).strip()
        if title:
            base['title'] = title[:80]
        items.append(base)
        seen.add(item_id)
    for item in default_extensions_config()['items']:
        if item['id'] not in seen:
            items.append(deepcopy(item))
    items.sort(key=lambda entry: (entry['group'], entry['order'], entry['id']))
    return {'items': items}


def write_extensions_config(payload: dict | None) -> dict:
    if not payload:
        payload = default_extensions_config()
    current = read_extensions_config()
    incoming = {
        item.get('id'): item
        for item in (payload or {}).get('items', [])
        if isinstance(item, dict)
    }
    merged = []
    for item in current['items']:
        source = incoming.get(item['id'], {})
        entry = deepcopy(item)
        try:
            entry['order'] = int(source.get('order', entry['order']))
        except (TypeError, ValueError):
            pass
        entry['enabled'] = bool(source.get('enabled', entry['enabled']))
        title = str(source.get('title', entry['title'])).strip()
        if title:
            entry['title'] = title[:80]
        merged.append(entry)
    merged.sort(key=lambda entry: (entry['group'], entry['order'], entry['id']))
    payload = {'items': merged}
    _write_json(EXTENSIONS_CONFIG_FILE, payload)
    return payload


def resolved_extensions():
    enabled_items = [item for item in read_extensions_config()['items'] if item.get('enabled')]
    hydrated = hydrate_extension_items(enabled_items)
    return [item for item in hydrated if item['id'] in EXTENSION_REGISTRY]
