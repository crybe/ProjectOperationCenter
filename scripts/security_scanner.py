#!/usr/bin/env python3
import json
import subprocess
import datetime
import os
import sys

# Paths - adjust as needed
DATA_DIR = os.environ.get('DATA_DIR', '/home/user/project-dashboard/data')
REPORT_FILE = os.path.join(DATA_DIR, 'cve_report.json')

def get_os_vulnerabilities():
    vulnerabilities = []
    try:
        # Check for upgradable packages (Debian/Ubuntu)
        out = subprocess.check_output(['apt', 'list', '--upgradable'], text=True, stderr=subprocess.DEVNULL)
        lines = out.strip().split('\n')
        for line in lines[1:]: # Skip "Listing..."
            if '/' in line:
                parts = line.split()
                pkg_info = parts[0].split('/')
                pkg = pkg_info[0]
                new_version = parts[1]
                
                vulnerabilities.append({
                    'id': f'OS-UPDATE-{pkg.upper()}',
                    'type': 'os',
                    'severity': 'medium',
                    'package': pkg,
                    'version': 'installed',
                    'fixed_version': new_version,
                    'description': f'System update available for {pkg} to version {new_version}. Potential security fixes included.'
                })
    except Exception as e:
        print(f"OS check error: {e}", file=sys.stderr)
    return vulnerabilities

def get_python_vulnerabilities():
    vulnerabilities = []
    try:
        # Check for outdated python packages
        out = subprocess.check_output(['pip', 'list', '--outdated', '--format=json'], text=True)
        data = json.loads(out)
        for item in data:
            vulnerabilities.append({
                'id': f'PY-OUTDATED-{item["name"].upper()}',
                'type': 'python',
                'severity': 'low',
                'package': item['name'],
                'version': item['version'],
                'fixed_version': item['latest_version'],
                'description': f'Python package {item["name"]} is outdated. Latest version is {item["latest_version"]}.'
            })
    except Exception as e:
        print(f"Python check error: {e}", file=sys.stderr)
    return vulnerabilities

def main():
    vulns = get_os_vulnerabilities() + get_python_vulnerabilities()
    
    severity_map = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    vulns.sort(key=lambda v: severity_map.get(v['severity'], 99))
    
    summary = {
        'critical': len([v for v in vulns if v['severity'] == 'critical']),
        'high': len([v for v in vulns if v['severity'] == 'high']),
        'medium': len([v for v in vulns if v['severity'] == 'medium']),
        'low': len([v for v in vulns if v['severity'] == 'low']),
    }
    
    recommendations = []
    if summary['critical'] > 0:
        recommendations.append("CRITICAL: Immediate action required. Patch critical vulnerabilities now.")
    if summary['high'] > 0:
        recommendations.append("HIGH: Significant risk detected. Schedule updates for high-risk packages.")
    if summary['medium'] > 0:
        recommendations.append("MEDIUM: Maintain system hygiene by updating OS and dependencies.")
    if not vulns:
        recommendations.append("All systems nominal. No immediate security actions required.")

    report = {
        'last_scan': datetime.datetime.now().isoformat(),
        'status': 'ok',
        'summary': summary,
        'vulnerabilities': vulns,
        'recommendations': recommendations
    }
    
    os.makedirs(os.path.dirname(REPORT_FILE), exist_ok=True)
    with open(REPORT_FILE, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"Report saved to {REPORT_FILE}")

if __name__ == '__main__':
    main()
