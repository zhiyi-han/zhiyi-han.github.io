"""Build words/bank.json for the 識字複習 game (words.html).

Reads
  the character spreadsheet (滿滿中文認字遊戲總字庫.xlsx, sheet 總字庫) — level, 四五快讀 lesson, counts
  tools/word_hints.txt   — the hint word 小黃 shows for each character (and a sentence when no story has one)
  stories/data/*.json    — the Story House texts, to pick a short example sentence for each hint word

and writes words/bank.json:
  {works: [[id, title]…], chars: [[字, 級別, 四五快讀課次, 作品數, 總頻次, 詞語, 詞語拼音, 字拼音, 例句, 例句作品(-1 = 自編), [出現過的作品…]]…]}

  pip install openpyxl pypinyin opencc-python-reimplemented
  python tools/build_words.py path/to/滿滿中文認字遊戲總字庫.xlsx
"""
import json, pathlib, re, sys

import openpyxl
import opencc
from pypinyin import pinyin, Style

ROOT = pathlib.Path(__file__).resolve().parent.parent
T2S = opencc.OpenCC('t2s')
PY_FIX = {'甚麼': 'shén me', '什麼': 'shén me', '彈來彈去': 'tán lái tán qù', '繫鞋帶': 'jì xié dài'}   # pypinyin misreads these
GLYPH = {'説': '說'}   # the sheet uses HK glyphs; the card shows the form the stories print


def load_hints():
    hints = {}
    for line in (ROOT / 'tools' / 'word_hints.txt').read_text().splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        parts = line.split()
        hints[GLYPH.get(parts[0], parts[0])] = (parts[1], parts[2] if len(parts) > 2 else None)
    return hints


def unquote(s):
    """drop a 「 or 」 left without its partner when a sentence is cut out of a page"""
    while s.count('「') > s.count('」') and '「' in s:
        i = s.rfind('「'); s = s[:i] + s[i + 1:]
    while s.count('」') > s.count('「') and '」' in s:
        i = s.find('」'); s = s[:i] + s[i + 1:]
    return s.strip('：:，, ')


def load_sentences():
    index = json.loads((ROOT / 'stories' / 'data' / 'index.json').read_text())
    works, sents, sets = [], [], []   # sents: (text, work index, from the story body?); sets: the characters each work uses
    for wi, w in enumerate(index):
        works.append([w['id'], w['title']])
        d = json.loads((ROOT / 'stories' / 'data' / f"{w['id']}.json").read_text())
        sets.append(set(json.dumps(d, ensure_ascii=False)))
        for p in d['pages']:
            if 's' in p:
                body = [s for para in p['s'] for s in para]
            else:
                body = re.findall(r'[^。！？]+[。！？]*[」』]?', p.get('say', ''))
            sents += [(unquote(s), wi, True) for s in body if s.strip()]
        for ex in d.get('extras', []):
            for it in ex['items']:
                for k in ('d', 't'):
                    if it.get(k):
                        sents += [(unquote(s), wi, False) for s in re.split(r'(?<=[。！？])', it[k]) if s.strip()]
    return works, [x for x in sents if 'NASA' not in x[0]], sets   # the Pluto story's reading list is no example sentence


def clause(s, w):
    """a long sentence is cut down to the clauses around the hint word"""
    parts = re.split(r'(?<=[，；：、])', s)
    i = next(i for i, p in enumerate(parts) if w in p)
    a = b = i
    while len(''.join(parts[a:b + 1])) < 9 and (a > 0 or b < len(parts) - 1):
        if b < len(parts) - 1: b += 1
        elif a > 0: a -= 1
    return unquote(''.join(parts[a:b + 1]).rstrip('，；：、'))


def pick(sents, w, c):
    have = [x for x in sents if w in x[0]] or [x for x in sents if c in x[0]]
    if not have:
        return None, -1

    def score(x):
        n = len(x[0])
        return (0 if x[2] else 6) + (0 if 7 <= n <= 18 else abs(n - 12) / 3)

    s, wi, _ = min(have, key=score)
    if len(s) > 24:
        s = clause(s, w if w in s else c)
    return s, wi


def py(word):
    if word in PY_FIX:
        return PY_FIX[word].split()
    return [p[0] for p in pinyin(T2S.convert(word), style=Style.TONE, heteronym=False)]


def main(xlsx):
    hints = load_hints()
    works, sents, sets = load_sentences()
    rows = [r for r in openpyxl.load_workbook(xlsx, data_only=True)['總字庫'].iter_rows(min_row=5, values_only=True) if r[0]]
    out, problems = [], []
    for r in rows:
        c, lv, book, lesson, freq = GLYPH.get(r[0], r[0]), r[1], r[3], r[5], r[7] or 0
        wk = [i for i, chs in enumerate(sets) if c in chs]   # counted from the texts; the sheet's 作品數 differs a little
        if c not in hints:
            problems.append(f'{c}: no hint word'); continue
        w, own = hints[c]
        if c not in w:
            problems.append(f'{c}: hint word {w} does not contain it')
        if own:
            s, wi = own, -1
        else:
            s, wi = pick(sents, w, c)
            if s is None:
                problems.append(f'{c}: no story sentence — add one to word_hints.txt'); continue
        if c not in s:
            problems.append(f'{c}: sentence {s} does not contain it')
        p = py(w)
        if len(p) != len(w):
            problems.append(f'{c}: pinyin {p} does not line up with {w}')
        out.append([c, lv, (lesson or '').split(';')[0] if book == '是' else '', len(wk), freq, w, ' '.join(p), p[w.index(c)], s, wi, wk])
    extra = set(hints) - {GLYPH.get(r[0], r[0]) for r in rows}
    if extra:
        problems.append('hints for characters not in the sheet: ' + ''.join(sorted(extra)))
    if problems:
        print('\n'.join(problems)); sys.exit(1)
    dest = ROOT / 'words' / 'bank.json'
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps({'works': works, 'chars': out}, ensure_ascii=False, separators=(',', ':')))
    print(f'{len(out)} characters → {dest.relative_to(ROOT)} ({dest.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main(sys.argv[1])
