#!/usr/bin/env python3
"""
Beobachtet das DevHub-Repo auf Änderungen (z.B. durch Claude/Gemini via SSH)
und committed diese automatisch mit einem KI-generierten deutschen Titel.
"""
import os
import time
import json
import subprocess
import urllib.request
from datetime import datetime

REPO = '/app'
DEBOUNCE_SECONDS = 90   # Wartezeit nach letzter Änderung bevor Commit
POLL_INTERVAL    = 30   # Prüfintervall in Sekunden
GROQ_KEY         = None


def _load_env():
    global GROQ_KEY
    env_path = os.path.join(REPO, '.env')
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith('GROQ_API_KEY='):
                GROQ_KEY = line.split('=', 1)[1]
                break


def _git(*args):
    result = subprocess.run(
        ['git'] + list(args),
        cwd=REPO, capture_output=True, text=True, timeout=20
    )
    return result.stdout.strip(), result.returncode


def _has_changes():
    out, _ = _git('status', '--porcelain')
    return bool(out.strip())


def _collect_context():
    status, _ = _git('status', '--short')
    diff, _   = _git('diff', 'HEAD')
    if not diff:
        diff, _ = _git('diff')
    return diff[:3000], status[:500]


def _generate_title(diff, status):
    if not GROQ_KEY:
        files = [l.strip()[2:].strip() for l in status.splitlines() if l.strip()]
        short = ', '.join(files[:3]) + ('…' if len(files) > 3 else '')
        return f"KI: {short or 'Automatische Änderung'}"

    prompt = (
        "Du bist ein Git-Commit-Message-Generator.\n"
        "Analysiere diese Änderungen und schreibe eine KURZE deutsche Commit-Message (max 72 Zeichen).\n"
        "Format: \"KI: <was wurde gemacht>\" – beschreibe die ABSICHT, nicht die Technik.\n"
        "Beispiele: \"KI: Bot-Handler für /stats korrigiert\", \"KI: Growbox-Schwellwerte angepasst\"\n\n"
        f"Geänderte Dateien:\n{status}\n\n"
        f"Diff (Auszug):\n{diff[:2000]}\n\n"
        "Antworte NUR mit der Commit-Message, ohne Anführungszeichen, ohne Erklärung."
    )

    payload = json.dumps({
        'model': 'llama-3.3-70b-versatile',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.1,
        'max_tokens': 80,
    }).encode()

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {GROQ_KEY}',
    }
    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/chat/completions',
        data=payload, headers=headers, method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.loads(r.read().decode())
            title = res['choices'][0]['message']['content'].strip().strip('"\'')
            # Sicherstellen dass Titel mit "KI:" anfängt
            if not title.lower().startswith('ki:'):
                title = 'KI: ' + title
            return title[:72]
    except Exception as e:
        print(f"[git-watcher] Groq-Fehler: {e}")
        # Aussagekräftiger Fallback: Dateinamen aus status
        files = [l.strip()[2:].strip() for l in status.splitlines() if l.strip()]
        short = ', '.join(files[:3]) + ('…' if len(files) > 3 else '')
        return f"KI: {short or 'Automatische Änderung'}"


def main():
    _load_env()
    print(f"[git-watcher] Starte – Repo: {REPO} | Poll: {POLL_INTERVAL}s | Debounce: {DEBOUNCE_SECONDS}s")

    dirty_since = None

    while True:
        time.sleep(POLL_INTERVAL)
        try:
            if _has_changes():
                if dirty_since is None:
                    dirty_since = time.time()
                    print(f"[git-watcher] Änderungen erkannt – warte {DEBOUNCE_SECONDS}s …")
                elif time.time() - dirty_since >= DEBOUNCE_SECONDS:
                    diff, status = _collect_context()
                    title = _generate_title(diff, status)
                    print(f"[git-watcher] Committe: {title}")

                    _git('add', '-A')
                    out, code = _git(
                        'commit', '-m', title,
                        '--author=KI-Watcher <ki@devhub.local>'
                    )
                    if code == 0:
                        log, _ = _git('log', '--format=%h %s', '-1')
                        print(f"[git-watcher] Commit: {log}")
                    else:
                        print(f"[git-watcher] Commit fehlgeschlagen: {out}")
                    dirty_since = None
            else:
                dirty_since = None
        except Exception as e:
            print(f"[git-watcher] Fehler: {e}")
            dirty_since = None


if __name__ == '__main__':
    main()
