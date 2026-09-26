"""Build the single-file Claude artifact version of the site from index.html, style.css, data.js, app.js.
Usage: python3 tools/build_artifact.py [output.html]   (default: dist/wochenkorb-artifact.html)"""
import os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda f: open(os.path.join(root, f), encoding="utf-8").read()
index, css, data, app = rd("index.html"), rd("style.css"), rd("data.js"), rd("app.js")
fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com[^"]+)">', index).group(1)
body = index.split("<body>", 1)[1].split("<noscript>", 1)[0].strip()
assert data.count("window.__WK_DATA__=") == 1, "data.js must define window.__WK_DATA__ exactly once"
out = (f'<title>Wochenkorb</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n'
       f'<link rel="stylesheet" href="{fonts}">\n<style>\n{css}</style>\n{body}\n'
       f'<script>\n{data}</script>\n<script>\n{app}</script>\n')
dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, "dist", "wochenkorb-artifact.html")
os.makedirs(os.path.dirname(dest), exist_ok=True)
open(dest, "w", encoding="utf-8").write(out)
print(dest, len(out))
