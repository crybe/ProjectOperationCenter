""" UI-Widgets für das Dashboard """
from copy import deepcopy

WIDGET_REGISTRY = {
    'host_status': {
        'id': 'host_status',
        'zone': 'hero_secondary',
        'order': 10,
        'title': 'Host Status',
        'description': 'Live-Zustand des Raspberry Pi und der wichtigsten Betriebskennzahlen.',
        'template': 'widgets/dashboard/host_status.html',
    },
    'project_spotlight': {
        'id': 'project_spotlight',
        'zone': 'hero_secondary',
        'order': 20,
        'title': 'Projekt Spotlight',
        'description': 'Aktive Streams und Fokusprojekte für die aktuelle Session.',
        'template': 'widgets/dashboard/project_spotlight.html',
    },
    'growbox': {
        'id': 'growbox',
        'zone': 'main_grid',
        'order': 10,
        'title': 'Growbox Live',
        'description': 'Sensorwerte, Prometheus-Fallback und Bewässerungsstatus.',
        'template': 'widgets/dashboard/growbox.html',
    },
    'activity': {
        'id': 'activity',
        'zone': 'main_grid',
        'order': 20,
        'title': 'Aktivität',
        'description': 'Letzte Ereignisse aus Bot, Files, Reviews und Systemaktivität.',
        'template': 'widgets/dashboard/activity.html',
    },
    'notes': {
        'id': 'notes',
        'zone': 'lower_sections',
        'order': 10,
        'title': 'Schnell-Notizen',
        'description': 'Direkt im Dashboard Ideen, TODOs und Fokusnotizen festhalten.',
        'template': 'widgets/dashboard/notes.html',
    },
    'pipeline': {
        'id': 'pipeline',
        'zone': 'lower_sections',
        'order': 20,
        'title': 'Delivery Pipeline',
        'description': 'Projektübersicht mit Task-Dichte und letztem Update.',
        'template': 'widgets/dashboard/pipeline.html',
    },
}


def default_dashboard_layout():
    return {
        'panels': [
            {
                'id': widget['id'],
                'zone': widget['zone'],
                'order': widget['order'],
                'enabled': True,
                'title': widget['title'],
                'description': widget['description'],
            }
            for widget in WIDGET_REGISTRY.values()
        ]
    }


def hydrate_dashboard_widgets(grouped_layout):
    hydrated = {}
    for zone, panels in grouped_layout.items():
        hydrated[zone] = []
        for panel in panels:
            registry_item = WIDGET_REGISTRY.get(panel['id'])
            if not registry_item:
                continue
            item = deepcopy(registry_item)
            item.update(panel)
            hydrated[zone].append(item)
        hydrated[zone].sort(key=lambda widget: (widget['order'], widget['id']))
    return hydrated
