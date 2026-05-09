#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime

DEFAULT_LOG_FILE = os.environ.get('CHATGPT_LOG_FILE', '/home/user/Tactical-Bot-Core/logs/chatgpt.log')
DEFAULT_API_URL = os.environ.get('DEVHUB_CHAT_LOG_URL', 'http://localhost:5666/api/chat-log')
DEFAULT_PROVIDER = 'chatgpt'


def log_to_file(message: str, log_file: str = DEFAULT_LOG_FILE) -> None:
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{timestamp}] {message}'
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    with open(log_file, 'a', encoding='utf-8') as handle:
        handle.write(line + '\n')


def _content_to_text(content) -> str:
    if content is None:
        return ''
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for item in content:
            text = _content_to_text(item)
            if text:
                parts.append(text)
        return '\n'.join(parts).strip()
    if isinstance(content, dict):
        item_type = (content.get('type') or '').strip().lower()
        if item_type in ('text', 'input_text', 'output_text'):
            return str(content.get('text') or '').strip()
        if item_type == 'message':
            return _content_to_text(content.get('content'))
        if isinstance(content.get('text'), str):
            return content['text'].strip()
        if isinstance(content.get('content'), str):
            return content['content'].strip()
        if isinstance(content.get('content'), list):
            return _content_to_text(content['content'])
        return ''
    return str(content).strip()


def normalize_messages(messages) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    role_map = {'developer': 'system', 'tool': 'assistant'}
    for message in messages or []:
        if not isinstance(message, dict):
            continue
        role = str(message.get('role') or 'assistant').strip().lower()
        role = role_map.get(role, role)
        if role not in ('user', 'assistant', 'system'):
            role = 'assistant'
        content = _content_to_text(message.get('content'))
        if not content:
            continue
        normalized.append({'role': role, 'content': content})
    return normalized


def extract_assistant_message(response_body) -> str:
    if response_body is None:
        return ''
    if isinstance(response_body, str):
        return response_body.strip()
    if not isinstance(response_body, dict):
        return ''

    choices = response_body.get('choices') or []
    if choices:
        choice = choices[0] or {}
        message = choice.get('message') or {}
        content = _content_to_text(message.get('content'))
        if content:
            return content
        delta = choice.get('delta') or {}
        content = _content_to_text(delta.get('content'))
        if content:
            return content

    output_text = response_body.get('output_text')
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()
    if isinstance(output_text, list):
        content = _content_to_text(output_text)
        if content:
            return content

    output = response_body.get('output') or []
    for item in output:
        if not isinstance(item, dict):
            continue
        if item.get('type') == 'message':
            content = _content_to_text(item.get('content'))
            if content:
                return content

    message = response_body.get('message')
    if isinstance(message, dict):
        content = _content_to_text(message.get('content'))
        if content:
            return content

    return ''


def build_openai_conversation(request_messages, response_body) -> list[dict[str, str]]:
    conversation = normalize_messages(request_messages)
    assistant_text = extract_assistant_message(response_body)
    if assistant_text:
        conversation.append({'role': 'assistant', 'content': assistant_text})
    return conversation


def push_to_devhub(
    title: str,
    messages,
    tags: list[str] | None = None,
    session_id: str | None = None,
    api_url: str = DEFAULT_API_URL,
    token: str | None = None,
    provider: str = DEFAULT_PROVIDER,
) -> tuple[bool, str]:
    token = token or os.environ.get('CHAT_LOG_TOKEN', '').strip()
    if not token:
        return False, 'CHAT_LOG_TOKEN fehlt'

    payload = {
        'provider': provider,
        'title': title,
        'messages': normalize_messages(messages),
        'tags': tags or ['chatgpt', 'openai-api', 'auto-logged'],
        'session_id': (session_id or '').strip(),
    }
    if not payload['messages']:
        return False, 'Keine nutzbaren messages vorhanden'

    request_body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    request_headers = {
        'Content-Type': 'application/json',
        'X-Chat-Log-Token': token,
    }
    request_obj = urllib.request.Request(api_url, data=request_body, headers=request_headers, method='POST')

    try:
        with urllib.request.urlopen(request_obj, timeout=5) as response:
            body = response.read().decode('utf-8', errors='replace')
            if response.status in (200, 201):
                return True, body
            return False, f'HTTP {response.status}: {body}'
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        return False, f'HTTP {exc.code}: {body}'
    except Exception as exc:
        return False, str(exc)


def log_openai_chat(
    title: str,
    request_messages,
    response_body,
    tags: list[str] | None = None,
    session_id: str | None = None,
    api_url: str = DEFAULT_API_URL,
    token: str | None = None,
) -> tuple[bool, str]:
    conversation = build_openai_conversation(request_messages, response_body)
    return push_to_devhub(
        title=title,
        messages=conversation,
        tags=tags,
        session_id=session_id,
        api_url=api_url,
        token=token,
        provider=DEFAULT_PROVIDER,
    )


def _load_json_input(raw_json: str | None, file_path: str | None):
    if raw_json:
        return json.loads(raw_json)
    if file_path:
        with open(file_path, 'r', encoding='utf-8') as handle:
            return json.load(handle)
    return None


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Loggt OpenAI/ChatGPT API-Gespraeche in DevHub.'
    )
    parser.add_argument('text', nargs='*', help='Optionaler Freitext fuer die lokale Logdatei.')
    parser.add_argument('--json', dest='raw_json', help='JSON-Payload mit title/messages/tags/session_id.')
    parser.add_argument('--file', dest='json_file', help='Pfad zu einer JSON-Datei mit Payload.')
    parser.add_argument('--title', help='Fallback-Titel fuer den JSON-Import.')
    parser.add_argument('--session-id', help='Fallback-Session-ID fuer den JSON-Import.')
    parser.add_argument('--api-url', default=DEFAULT_API_URL, help='DevHub API URL.')
    parser.add_argument('--token', help='Optionaler Chat-Log-Token. Sonst CHAT_LOG_TOKEN aus env.')
    parser.add_argument('--log-file', default=DEFAULT_LOG_FILE, help='Lokale Logdatei fuer Freitext-Eintraege.')
    return parser.parse_args()


def main() -> int:
    args = _parse_args()

    try:
        payload = _load_json_input(args.raw_json, args.json_file)
    except Exception as exc:
        print(f'Fehler beim Laden des JSON-Payloads: {exc}', file=sys.stderr)
        return 1

    if payload is not None:
        title = (payload.get('title') or args.title or 'ChatGPT Gespräch').strip()
        session_id = (payload.get('session_id') or args.session_id or '').strip()
        ok, detail = push_to_devhub(
            title=title,
            messages=payload.get('messages', []),
            tags=payload.get('tags'),
            session_id=session_id,
            api_url=args.api_url,
            token=args.token,
            provider=DEFAULT_PROVIDER,
        )
        if ok:
            log_to_file(f'Chat geloggt: {title}', args.log_file)
            print('Erfolgreich an DevHub übertragen.')
            return 0
        print(f'Fehler beim Übertragen an DevHub: {detail}', file=sys.stderr)
        return 1

    if args.text:
        message = ' '.join(args.text).strip()
        if message:
            log_to_file(message, args.log_file)
            print(f'Geloggt: {message}')
            return 0

    print('Nichts zu tun. Nutze --json, --file oder uebergib Freitext.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
