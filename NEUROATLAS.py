#!/usr/bin/env python3
"""Launch NEUROATLAS. Keep this file beside server.py and index.html."""
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
SERVER = ROOT / "server.py"
INDEX = ROOT / "index.html"

if not SERVER.is_file() or not INDEX.is_file():
    raise SystemExit(
        "NEUROATLAS files are incomplete. Keep NEUROATLAS.py, server.py, and index.html in the same folder."
    )

env = os.environ.copy()
env_file = ROOT / ".env"
if env_file.is_file():
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            env.setdefault(key.strip(), value.strip().strip('"').strip("'"))

port = int(env.get("PORT", env.get("NEUROATLAS_PORT", "8000")))
proc = subprocess.Popen([sys.executable, str(SERVER)], cwd=str(ROOT), env=env)
url = f"http://127.0.0.1:{port}"

try:
    for _ in range(60):
        if proc.poll() is not None:
            raise SystemExit("The NEUROATLAS server stopped unexpectedly.")
        try:
            with urllib.request.urlopen(url + "/api/status", timeout=1) as response:
                if response.status == 200:
                    break
        except Exception:
            time.sleep(0.25)
    else:
        proc.terminate()
        raise SystemExit("NEUROATLAS did not start. Check whether the configured port is already in use.")

    print("NEUROATLAS is running at " + url)
    print("Keep this window open while using the platform. Press Ctrl+C to stop.")
    webbrowser.open(url)
    proc.wait()
except KeyboardInterrupt:
    print("\nStopping NEUROATLAS...")
finally:
    if proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()