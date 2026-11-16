#!/usr/bin/env python3
"""Check what README.md says about this site against the files.

Standard library only. Exit 1, naming each mismatch. Covers the privacy and
security statements (no tracking, no network requests from the page, scripts
only from this site) and the data week the README names.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
read = lambda name: (ROOT / name).read_text(encoding="utf-8")
index, app, data_js, readme = read("index.html"), read("app.js"), read("data.js"), read("README.md")
problems = []


def check(ok, message):
    print(f"  {'ok  ' if ok else 'FAIL'} {message}")
    if not ok:
        problems.append(message)


# --- "Static site: index.html, style.css, app.js, data.js" ---
for name in ("index.html", "style.css", "app.js", "data.js", "sw.js", "manifest.webmanifest", "tools/build_artifact.py"):
    check((ROOT / name).is_file(), f"{name} exists")

# --- Content-Security-Policy, as the README describes it ---
m = re.search(r'http-equiv="Content-Security-Policy"\s+content="([^"]+)"', index)
check(bool(m), "index.html carries a Content-Security-Policy")
csp = dict((part.split()[0], part.split()[1:]) for part in (m.group(1) if m else "").split(";") if part.strip())
check(csp.get("script-src") == ["'self'"], "scripts only from this site (script-src 'self')")
check(csp.get("connect-src") == ["'none'"], "no network requests from the page (connect-src 'none')")
check(csp.get("default-src") == ["'none'"], "everything else denied by default (default-src 'none')")
check(csp.get("font-src") == ["https://fonts.gstatic.com"], "fonts from Google Fonts only")

# --- The page itself: no external scripts, no request APIs, only the font hosts ---
scripts = re.findall(r"<script[^>]*\bsrc=[\"']([^\"']+)", index)
check(all(not re.match(r"(https?:)?//", s) for s in scripts), f"no external <script> ({scripts})")
check(not re.search(r"<script(?![^>]*\bsrc=)[^>]*>\s*\S", index), "no inline <script> (the policy would block it)")
for api in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket(", "EventSource("):
    check(api not in app, f"app.js does not use {api.rstrip('(')}")
hosts = set(re.findall(r"https?://([A-Za-z0-9.-]+)", index))
check(hosts <= {"fonts.googleapis.com", "fonts.gstatic.com"}, f"index.html references only the font hosts ({sorted(hosts)})")

# --- "noindex", "no-referrer" ---
check(bool(re.search(r'name="robots"\s+content="[^"]*noindex', index)), "noindex is set")
check(bool(re.search(r'name="referrer"\s+content="no-referrer"', index)), "no-referrer is set")

# --- data.js: the shape the README lists, and the week it names ---
prefix = "window.__WK_DATA__="
check(data_js.lstrip().startswith(prefix), "data.js assigns window.__WK_DATA__")
data = json.loads(data_js.strip()[len(prefix):].rstrip(";"))
for key in ("meta", "offers", "staples", "stores", "homes", "recipes"):
    check(bool(data.get(key)), f"data.js has a non-empty '{key}'")

meta = data["meta"]
valid_from, valid_to, updated = (date.fromisoformat(meta[k]) for k in ("validFrom", "validTo", "updated"))
check(valid_from <= valid_to, "validFrom is not after validTo")
MONTH = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
span = f"{valid_from.day} {MONTH[valid_from.month]} – {valid_to.day} {MONTH[valid_to.month]} {valid_to.year}"
# The README names a specific week only while it carries the notice that the
# weekly refresh has stopped. Once the refresh runs again and that notice is
# removed, the week changes every Monday and is no longer a README claim.
if "not currently running" in readme:
    check(meta["weekLabel"] in readme, f"README names the data week ({meta['weekLabel']})")
    check(span in readme, f"README gives the validity the data has ({span})")
    check(f"{updated.day} {updated:%B}" in readme, f"README gives the data's last update ({updated.day} {updated:%B})")
else:
    check(not re.search(r"\bKW \d+\b", readme), "README does not pin a data week while the refresh is running")

if problems:
    print(f"\n{len(problems)} statement(s) in README.md no longer match the files.")
    sys.exit(1)
print("\nREADME claims match the files")
