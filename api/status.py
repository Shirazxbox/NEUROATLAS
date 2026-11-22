from http.server import BaseHTTPRequestHandler
import json
import os


def get_status_payload():
    has_gemini = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    has_groq = bool(os.environ.get("GROQ_API_KEY", "").strip())
    return {
        "status": "ok",
        "project": "NEUROATLAS",
        "owner": "Narges11",
        "ai_ready": has_gemini or has_groq,
        "providers": {
            "gemini": has_gemini,
            "groq": has_groq,
        },
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps(get_status_payload()).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return