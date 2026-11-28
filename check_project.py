#!/usr/bin/env python3
"""Automated integrity & readiness check for NEUROATLAS."""
import ast
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent

REQUIRED_FILES = [
    "index.html",
    "server.py",
    "api/__init__.py",
    "api/status.py",
    "api/chat.py",
    "css/layout.css",
    "js/data/neuroatlas-data.js",
    "js/data/neuroatlas-i18n-data.js",
    "js/data/themes-registry.js",
    "js/data/ui-i18n.js",
    "js/core/state.js",
    "js/core/ui.js",
    "js/modules/chat.js",
    "js/modules/atlas.js",
    "js/modules/research.js",
    "js/modules/learn.js",
    "js/modules/contact.js",
]


def main() -> int:
    errors = []
    warnings = []

    print("=== NEUROATLAS Project Integrity Check ===")

    # 1. Required files
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).is_file():
            errors.append(f"Missing required file: {rel}")

    # 2. Python syntax check
    for py_file in [ROOT / "server.py", *(ROOT / "api").glob("*.py")]:
        if py_file.is_file():
            try:
                ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
            except SyntaxError as exc:
                errors.append(f"Python syntax error in {py_file.relative_to(ROOT)}: {exc}")

    # 3. Theme registry vs css/themes/
    reg_file = ROOT / "js/data/themes-registry.js"
    if reg_file.is_file():
        reg_text = reg_file.read_text(encoding="utf-8")
        theme_ids = re.findall(r'id:\s*"([a-z0-9-]+)"', reg_text)
        theme_paths = re.findall(r'css:\s*"(/css/themes/[a-z0-9-]+\.css)"', reg_text)

        if len(theme_ids) != len(theme_paths):
            errors.append("Mismatch between theme ids and css paths in themes-registry.js")

        registered_files = set()
        for tid, tpath in zip(theme_ids, theme_paths):
            target = ROOT / tpath.lstrip("/")
            registered_files.add(target.name)
            if not target.is_file():
                errors.append(f"Theme '{tid}' points to missing file: {tpath}")
            else:
                css_text = target.read_text(encoding="utf-8")
                if f'[data-theme="{tid}"]' not in css_text:
                    warnings.append(f"Theme CSS {tpath} is missing selector [data-theme=\"{tid}\"]")

        themes_dir = ROOT / "css/themes"
        if themes_dir.is_dir():
            for css_file in themes_dir.glob("*.css"):
                if css_file.name not in registered_files:
                    warnings.append(f"Unregistered theme file in css/themes/: {css_file.name}")

    # 4. index.html local asset links & data-i18n keys
    index_file = ROOT / "index.html"
    i18n_file = ROOT / "js/data/ui-i18n.js"
    if index_file.is_file():
        html = index_file.read_text(encoding="utf-8")
        local_refs = re.findall(r'(?:src|href)="(/(?!/)[^"]+)"', html)
        for ref in local_refs:
            if not (ROOT / ref.lstrip("/")).is_file():
                errors.append(f"index.html references missing local asset: {ref}")

        if i18n_file.is_file():
            i18n_text = i18n_file.read_text(encoding="utf-8")
            keys = set(re.findall(r'data-i18n(?:-placeholder)?="([A-Za-z0-9_]+)"', html))
            for k in sorted(keys):
                if f"{k}:" not in i18n_text:
                    errors.append(f"index.html uses i18n key '{k}' not found in js/data/ui-i18n.js")

    # 5. Security / .gitignore check
    gitignore = ROOT / ".gitignore"
    if not gitignore.is_file():
        warnings.append("No .gitignore file found. Ensure .env is never committed to GitHub!")
    else:
        gi_text = gitignore.read_text(encoding="utf-8")
        if ".env" not in gi_text:
            errors.append(".gitignore exists but does NOT ignore '.env'!")

    # 6. Legacy cleanup reminders
    for legacy in ("css/themes.css", "js/ui.js", "js/app.js", "neuroatlas-data.js", "neuroatlas-i18n-data.js"):
        if (ROOT / legacy).is_file():
            warnings.append(f"Legacy file still at old path (safe to remove after testing): {legacy}")

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  [!] {w}")

    if errors:
        print("\nErrors found:")
        for e in errors:
            print(f"  [X] {e}")
        return 1

    print("\n[OK] All files, themes, i18n keys, and Python modules passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())