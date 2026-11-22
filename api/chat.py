from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.error
import urllib.request

SYSTEM_PROMPT = """You are NEUROATLAS, a smart and helpful AI assistant created with Python by Narges Bayat (a student developer learning Python, web engineering, AI systems, and neuroscience, participating in the GenHacks 2026 hackathon).

About NEUROATLAS platform:
- Combines an interactive 23-chapter Neuroscience Atlas, live PubMed search, flashcards/quiz, concept map, 24 NIH/NCBI references, and an open AI assistant.
- Built with Python backend, 3 languages (English, Persian, Turkish), and 5 visitor-selectable themes.
- Educational resource only; never diagnose or prescribe.

Response style rules:
1. Be concise, clear, and comprehensive. Avoid unnecessary filler or long introductions.
2. For simple greetings (like "Hi", "Merhaba", or "درود"), reply in 1-2 friendly sentences and ask how you can help. Do NOT recite full creator/hackathon details unless asked.
3. Answer ANY general, scientific, coding, neuroscience, or everyday question accurately and to the point.
4. Reply in the same language the user writes in (English, Persian/Farsi, or Turkish), unless asked otherwise."""


def _http_post_json(url: str, headers: dict, payload: dict, timeout: int = 30) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"HTTP {exc.code}: {err_body[:300]}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Network error: {exc.reason}") from exc


def _call_gemini(message: str, history: list, lang: str, api_key: str) -> tuple[str, str]:
    models = []
    custom_model = os.environ.get("GEMINI_MODEL", "").strip()
    if custom_model:
        models.append(custom_model)
    for m in ("gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"):
        if m not in models:
            models.append(m)

    contents = []
    for item in history[-8:]:
        role = "model" if item.get("role") == "assistant" else "user"
        text = str(item.get("content", "")).strip()
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    lang_hint = {"fa": "Persian", "tr": "Turkish", "en": "English"}.get(lang, "English")
    payload = {
        "system_instruction": {
            "parts": [{"text": f"{SYSTEM_PROMPT}\nCurrent UI language: {lang_hint}."}]
        },
        "contents": contents,
        "generationConfig": {"maxOutputTokens": 1200},
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
        "User-Agent": "NEUROATLAS/1.0",
    }

    last_error = None
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        try:
            res = _http_post_json(url, headers, payload)
            candidates = res.get("candidates") or []
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                text = "".join(p.get("text", "") for p in parts).strip()
                if text:
                    return text, f"Gemini ({model})"
        except Exception as exc:
            last_error = exc
    raise RuntimeError(f"Gemini failed: {last_error}")


def _call_groq(message: str, history: list, lang: str, api_key: str) -> tuple[str, str]:
    models = []
    custom_model = os.environ.get("GROQ_MODEL", "").strip()
    if custom_model:
        models.append(custom_model)
    for m in ("qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"):
        if m not in models:
            models.append(m)

    lang_hint = {"fa": "Persian", "tr": "Turkish", "en": "English"}.get(lang, "English")
    messages = [{"role": "system", "content": f"{SYSTEM_PROMPT}\nCurrent UI language: {lang_hint}."}]
    for item in history[-8:]:
        role = "assistant" if item.get("role") == "assistant" else "user"
        text = str(item.get("content", "")).strip()
        if text:
            messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": message})

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "NEUROATLAS/1.0",
    }

    last_error = None
    for model in models:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1200,
        }
        try:
            res = _http_post_json(url, headers, payload)
            choices = res.get("choices") or []
            if choices:
                text = (choices[0].get("message", {}).get("content") or "").strip()
                if text:
                    return text, f"Groq ({model})"
        except Exception as exc:
            last_error = exc
    raise RuntimeError(f"Groq failed: {last_error}")


def process_chat_request(payload: dict) -> tuple[int, dict]:
    message = str(payload.get("message", "")).strip()
    if not message:
        return 400, {"error": "Message cannot be empty."}
    if len(message) > 4000:
        return 400, {"error": "Message is too long (max 4000 characters)."}

    history = payload.get("history")
    if not isinstance(history, list):
        history = []
    lang = str(payload.get("lang", "en")).strip().lower()

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    if not gemini_key and not groq_key:
        return 503, {
            "error": "No AI API key configured yet. Add GEMINI_API_KEY or GROQ_API_KEY in Vercel Environment Variables (or local .env)."
        }

    errors = []
    if gemini_key:
        try:
            reply, provider = _call_gemini(message, history, lang, gemini_key)
            return 200, {"reply": reply, "provider": provider}
        except Exception as exc:
            errors.append(str(exc))

    if groq_key:
        try:
            reply, provider = _call_groq(message, history, lang, groq_key)
            return 200, {"reply": reply, "provider": provider}
        except Exception as exc:
            errors.append(str(exc))

    return 502, {"error": "AI service temporarily unavailable.", "details": " | ".join(errors)}


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(204, {})

    def do_GET(self):
        self._send_json(200, {"endpoint": "/api/chat", "method": "POST"})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        status_code, result = process_chat_request(payload)
        self._send_json(status_code, result)

    def log_message(self, format, *args):
        return