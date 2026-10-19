"""Build the Story House (stories.html) data from Max's original story files.

Input folder (not in the repo):
  <src>/原创故事/第N篇：《title》.docx      text stories
  <src>/原创故事/*_32頁.pdf                 illustrated picture books
  <src>/原創故事封面/NN_*.png               one cover per text story

Writes
  stories/data/index.json                  the bookshelf
  stories/data/<id>.json                   pages + "after reading" sections
  stories/img/<id>/*.webp                  covers and picture-book pages

Needs macOS (textutil, Vision OCR via tools/ocr.swift), poppler (pdftoppm,
pdftotext) and `pip install pillow opencc-python-reimplemented`.

Usage
  swiftc -O tools/ocr.swift -o /tmp/ocr
  python tools/build_stories.py <src> /tmp/ocr
  python tools/make_story_voice.py          # then record the narration
"""
import glob, json, pathlib, re, subprocess, sys, tempfile

import opencc
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'stories'
FONT = glob.glob('/System/Library/AssetsV2/com_apple_MobileAsset_Font*/*/AssetData/PingFang.ttc')
FONT = FONT[0] if FONT else '/System/Library/Fonts/Hiragino Sans GB.ttc'

S2HK = opencc.OpenCC('s2hk')
def trad(s):
    """the after-reading notes mix in simplified characters; the stories use HK forms"""
    s = S2HK.convert(s).replace('什麼', '甚麼')
    return s.translate(str.maketrans('説悦脱税蜕兑衞', '說悅脫稅蛻兌衛'))   # keep the stories' own 說, not the HK 説

PAGE_SOFT, PAGE_HARD = 95, 150      # characters per page for a five-year-old reader

def sentences(par):
    out = re.findall(r'[^。！？…]*(?:[。！？]+|…+)[」』）]*|[^。！？…]+$', par)
    return [s for s in (x.strip() for x in out) if s]

def paginate(paras):
    """pages of whole paragraphs (each a list of sentences); only an over-long paragraph is split"""
    pages, cur, n = [], [], 0
    def flush():
        nonlocal cur, n
        if cur:
            pages.append(cur); cur, n = [], 0
    for p in paras:
        ss = sentences(p)
        if cur and (n >= PAGE_SOFT or n + len(p) > PAGE_HARD):
            flush()
        if len(p) <= PAGE_HARD:
            cur.append(ss); n += len(p); continue
        chunk = []
        for s in ss:
            if (chunk or cur) and n + len(s) > PAGE_HARD:
                if chunk:
                    cur.append(chunk); chunk = []
                flush()
            chunk.append(s); n += len(s)
        cur.append(chunk)
    flush()
    return pages

MAIN = re.compile(r'^(今天(認識)?的新朋友|回來和我們見面的詞|讀完想一想|請滿滿.*說一說|我也來試一試|犯錯以後，可以這樣做|滿滿可以試着說)$')
BODY_END = re.compile(r'^(今天(認識)?的新朋友|回來和我們見面的詞|讀完想一想)$')

def join_arrows(lines):
    """retelling paths are sometimes written down the page (step / ↓ / step): join them into one line"""
    out = []
    for raw in lines:
        t = raw.strip()
        if out and (re.match(r'^[↓→]', t) or re.search(r'[↓→]$', out[-1].strip())):
            out[-1] = out[-1].rstrip() + '→' + t
        else:
            out.append(raw)
    return out

def extras_of(lines):
    secs = []
    for raw in join_arrows(lines):
        l = trad(raw.strip().replace('\u2028', '：'))
        if not l:
            continue
        if MAIN.match(l):
            secs.append({'h': l, 'items': []}); continue
        if not secs:
            secs.append({'h': '', 'items': []})
        items = secs[-1]['items']
        bullet = raw.lstrip().startswith('•') or raw.startswith('\t')
        l = l.lstrip('•').strip()
        if '→' in l or '↓' in l:
            items.append({'k': 'path', 'steps': [x.strip() for x in re.split(r'[→↓]', l) if x.strip()]})
        elif secs[-1]['h'].endswith('新朋友') and ('：' in l and (bullet or '\u2028' in raw) or len(l) <= 4):
            w, d = l.split('：', 1) if '：' in l else (l, '')
            items.append({'k': 'word', 'w': w.strip(), 'd': d.strip()})
        elif bullet:
            items.append({'k': 'li', 't': l})
        else:
            items.append({'k': 'p', 't': l})
    return [s for s in secs if s['items']]

def webp(src, dst, width, q=72):
    im = Image.open(src).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'WEBP', quality=q, method=6)

def text_story(docx, covers):
    n = int(re.search(r'第(\d+)篇', docx.name).group(1))
    title = re.search(r'《(.+)》', docx.name).group(1)
    txt = subprocess.run(['textutil', '-convert', 'txt', '-stdout', str(docx)], capture_output=True, text=True, check=True).stdout
    lines = [l.rstrip() for l in txt.split('\n') if l.strip()]    # not splitlines(): U+2028 joins word and meaning
    if title in lines[0] or '《' in lines[0]:
        lines = lines[1:]
    cut = next((i for i, l in enumerate(lines) if BODY_END.match(l.strip())), len(lines))
    body = [trad(l.strip().replace('\u2028', '')) for l in lines[:cut]]
    sid = f's{n:02d}'
    cov = next(c for c in covers if re.match(rf'0?{n}_', c.name))
    webp(cov, OUT / 'img' / sid / 'cover.webp', 540)
    return {'id': sid, 'n': n, 'kind': 'text', 'title': title,
            'cover': f'stories/img/{sid}/cover.webp',
            'pages': [{'s': pg} for pg in paginate(body)],
            'extras': extras_of(lines[cut:])}

def ocr_lines(ocr, img):
    out = subprocess.run([ocr, str(img)], capture_output=True, text=True, check=True).stdout
    res = []
    for l in out.splitlines():
        if '\t' in l:
            box, t = l.split('\t', 1)
            res.append((tuple(map(float, box.split())), t))
    return res

def patch_name(img_path, lines):
    """the printed credits name him 知一; the site calls him 滿滿/Max — repaint those lines"""
    im = Image.open(img_path).convert('RGB'); W, H = im.size; px = im.load()
    for (x, y, w, h), t in lines:
        if '知一' not in t:
            continue
        x0, x1 = int(x * W) - 4, int((x + w) * W) + 4
        y0, y1 = int((1 - y - h) * H) - 5, int((1 - y) * H) + 5
        ink = sorted((px[i, j] for i in range(x0, x1) for j in range(y0, y1)), key=sum)[: max(1, (x1 - x0) * (y1 - y0) // 40)]
        ink = tuple(sum(c[k] for c in ink) // len(ink) for k in range(3))
        for i in range(x0, x1):                      # fill by blending the rows just above and below
            a, b = px[i, y0 - 1], px[i, y1 + 1]
            for j in range(y0, y1):
                f = (j - y0) / (y1 - y0)
                px[i, j] = tuple(round(a[k] * (1 - f) + b[k] * f) for k in range(3))
        size = int(h * H * .98)
        font = ImageFont.truetype(FONT, size, index=0)
        ImageDraw.Draw(im).text((x0 + 4, int((1 - y - h) * H) - size * .1), t.replace('知一', '滿滿'), font=font, fill=ink)
    im.save(img_path)

def picture_book(pdf, bid, title, ocr, use_text_layer):
    n = int(subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout.split('Pages:')[1].split()[0])
    pages = []
    with tempfile.TemporaryDirectory() as tmp:
        for p in range(1, n + 1):
            if p == 2:              # "this book belongs to ____" — only for the printed copy
                continue
            base = pathlib.Path(tmp) / f'p{p:02d}'
            subprocess.run(['pdftoppm', '-r', '150', '-png', '-singlefile', '-f', str(p), '-l', str(p), str(pdf), str(base)], check=True)
            png = base.with_suffix('.png')
            lines = ocr_lines(ocr, png)
            patch_name(png, lines)
            if use_text_layer:
                t = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), str(pdf), '-'], capture_output=True, text=True).stdout
                paras = [re.sub(r'\s+', '', x) for x in re.split(r'\n\s*\n', t)]
            else:
                paras = [''.join(t for _, t in lines)]
            text = '\n'.join(x for x in paras if x).replace('知一', '滿滿')
            text = re.sub(r'_{2,}', '……', text)
            if p == 1:
                text = title
            name = f'p{len(pages) + 1:02d}.webp'
            webp(png, OUT / 'img' / bid / name, 760, 70)
            pages.append({'img': f'stories/img/{bid}/{name}', 'say': trad(text)})
    webp(OUT / 'img' / bid / 'p01.webp', OUT / 'img' / bid / 'cover.webp', 540)
    return {'id': bid, 'kind': 'book', 'title': title, 'cover': f'stories/img/{bid}/cover.webp', 'pages': pages}

BOOKS = [   # id, title, file name part, has a real text layer
    ('b1', '滿滿和會變色的情緒怪獸', '情緒怪獸', False),
    ('b2', '滿滿腦子裏的紅黃綠小隊', '紅黃綠小隊', False),
    ('b3', '小綠的兩種練習', '小綠的兩種練習', True),
]

def main(src, ocr):
    src = pathlib.Path(src)
    covers = sorted((src / '原創故事封面').glob('[0-9]*.png'))
    items = []
    for d in sorted((src / '原创故事').glob('第*篇*.docx'), key=lambda f: int(re.search(r'第(\d+)', f.name).group(1))):
        items.append(text_story(d, covers)); print('story', items[-1]['n'], items[-1]['title'], len(items[-1]['pages']), 'pages')
    s10 = next(s for s in items if s['n'] == 10)     # the five-elements story has two extra charts
    for i, f in enumerate(sorted((src / '原創故事封面').glob('五行*.png'))):
        webp(f, OUT / 'img' / 's10' / f'chart{i + 1}.webp', 900, 76)
        s10['extras'].insert(1 + i, {'h': f.stem, 'items': [{'k': 'img', 'src': f'stories/img/s10/chart{i + 1}.webp'}]})
    for bid, title, part, layer in BOOKS:
        pdf = next((src / '原创故事').glob(f'*{part}*.pdf'))
        items.append(picture_book(pdf, bid, title, ocr, layer)); print('book', title, len(items[-1]['pages']), 'pages')
    (OUT / 'data').mkdir(parents=True, exist_ok=True)
    for it in items:
        (OUT / 'data' / f"{it['id']}.json").write_text(json.dumps(it, ensure_ascii=False, separators=(',', ':')))
    shelf = [{'id': it['id'], 'kind': it['kind'], 'title': it['title'], 'cover': it['cover'], 'n': it.get('n')} for it in items]
    (OUT / 'data' / 'index.json').write_text(json.dumps(shelf, ensure_ascii=False, separators=(',', ':')))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
