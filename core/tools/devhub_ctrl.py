from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess, json

ALLOWED = {'start', 'stop', 'restart'}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _respond(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.strip('/') == 'status':
            r = subprocess.run(['systemctl', 'is-active', 'Tactical-Bot-Core'],
                               capture_output=True, text=True)
            state = r.stdout.strip()
            self._respond({'active': state == 'active', 'state': state})
        else:
            self._respond({'error': 'not found'}, 404)

    def do_POST(self):
        action = self.path.strip('/')
        if action not in ALLOWED:
            self._respond({'error': 'unknown action'}, 400)
            return
        r = subprocess.run(['sudo', 'systemctl', action, 'Tactical-Bot-Core'],
                           capture_output=True, text=True)
        r2 = subprocess.run(['systemctl', 'is-active', 'Tactical-Bot-Core'],
                            capture_output=True, text=True)
        self._respond({'ok': r.returncode == 0,
                       'state': r2.stdout.strip(),
                       'output': r.stderr.strip()})

HTTPServer(('0.0.0.0', 5667), Handler).serve_forever()
