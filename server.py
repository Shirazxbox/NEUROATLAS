#!/usr/bin/env python3
"""Local development server for NEUROATLAS."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from api.chat import process_chat_request
from api.status import get_status_payload

STATIC_MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def load_local_env():
    env_file = ROOT / ".env"
    if not env_file.is_file():
        return
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def resolve_safe_static(url_path: str):
    rel = url_path.lstrip("/")
    if not rel or any(part.startswith(".") for part in Path(rel).parts):
        return None
    target = (ROOT / rel).resolve()
    try:
        if os.path.commonpath([str(ROOT), str(target)]) != str(ROOT):
            return None
    except ValueError:
        return None
    if target.suffix.lower() not in STATIC_MIME_TYPES or not target.is_file():
        return None
    return target


class LocalHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, file_path: Path, content_type: str):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

    def do_GET(self):
        path = self.path.split("?", 1)[0]

        if path in ("/", "/index.html"):
            index_file = ROOT / "index.html"
            if not index_file.is_file():
                self.send_error(404, "index.html not found")
                return
            self._send_file(index_file, "text/html; charset=utf-8")
            return

        if path in ("/neuroatlas-data.js", "/neuroatlas-i18n-data.js") or path.startswith(("/css/", "/js/", "/assets/")):
            target_file = resolve_safe_static(path)
            if not target_file:
                self.send_error(404, "Static asset not found")
                return
            self._send_file(target_file, STATIC_MIME_TYPES[target_file.suffix.lower()])
            return

        if path == "/api/status":
            self._send_json(200, get_status_payload())
            return

        self.send_error(404, "Not Found")

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/chat":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                raw = self.rfile.read(length) if length > 0 else b"{}"
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self._send_json(400, {"error": "Invalid JSON body."})
                return
            status_code, result = process_chat_request(payload)
            self._send_json(status_code, result)
            return

        self.send_error(404, "Not Found")


if __name__ == "__main__":
    load_local_env()
    port = int(os.environ.get("PORT", os.environ.get("NEUROATLAS_PORT", "8000")))
    server = ThreadingHTTPServer(("127.0.0.1", port), LocalHandler)
    print(f"NEUROATLAS local server listening on http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()