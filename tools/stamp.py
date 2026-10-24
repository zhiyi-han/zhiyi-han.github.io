"""Give every local script, stylesheet, module import and data fetch one shared
version tag (?v=XXXXXXXX), so a browser never mixes a fresh file with a cached
old one after a deploy (GitHub Pages lets browsers cache files for 10 minutes).

The tag is a fingerprint of the site's code and data with all ?v= tags stripped,
so it only changes when something really changed, and running this twice is a
no-op. Run it right before committing a deploy:

    python3 tools/stamp.py
"""
import hashlib, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TAG = re.compile(r'\?v=[\w.-]+')

pages = sorted(ROOT.glob('*.html'))
modules = sorted(p for p in (ROOT / 'js').rglob('*.js'))
styles = sorted(ROOT.glob('*.css'))
data = [ROOT / p for p in ('audio/voice/manifest.json', 'stories/voice/index.json', 'words/bank.json', 'english/bank.json')]
data += sorted((ROOT / 'stories' / 'data').glob('*.json'))

# fingerprint: everything, tags stripped
h = hashlib.sha1()
for p in pages + modules + styles + [d for d in data if d.exists()]:
    h.update(p.relative_to(ROOT).as_posix().encode())
    h.update(TAG.sub('', p.read_text(encoding='utf-8')).encode())
VER = h.hexdigest()[:8]
V = '?v=' + VER

LOCAL = r'(?!https?:|//|data:)'
def tag_path(path):
    return TAG.sub('', path) + V

changed = []
def write(p, s):
    if p.read_text(encoding='utf-8') != s:
        p.write_text(s, encoding='utf-8'); changed.append(p.relative_to(ROOT).as_posix())

# pages: <script src> and <link href> pointing at local .js / .css
for p in pages:
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'((?:src|href)=")' + LOCAL + r'([^"?]+\.(?:js|css))(?:\?v=[\w.-]+)?(")',
               lambda m: m.group(1) + m.group(2) + V + m.group(3), s)
    write(p, s)

# modules: every relative module path, plus data fetches
for p in modules:
    s = p.read_text(encoding='utf-8')
    # any quoted relative module path: static and dynamic imports, galaxy's lazy explorer files, loadModule('./titan.js')
    s = re.sub(r"""(['"])(\.{1,2}/[^'"?\s]+\.js)(?:\?v=[\w.-]+)?\1""",
               lambda m: m.group(1) + m.group(2) + V + m.group(1), s)
    def fetch_line(line):
        if 'fetch(' not in line:
            return line
        line = TAG.sub(V, line)   # existing tags on data fetches
        return re.sub(r"""(fetch\(\s*)(['"])([^'"?]+\.json)\2""", lambda m: m.group(1) + m.group(2) + m.group(3) + V + m.group(2), line)
    s = '\n'.join(fetch_line(l) for l in s.split('\n'))
    write(p, s)

print(f'version {VER}; updated {len(changed)} files' + (':\n  ' + '\n  '.join(changed) if changed else ''))
