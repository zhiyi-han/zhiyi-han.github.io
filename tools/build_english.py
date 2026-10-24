"""Build english/bank.json for 滿滿背單詞 (english.html).

Reads tools/english_words.tsv — one word per line, tab-separated:
  word  level(1-3)  pos(a/b)  note  alt  zh(繁體)  en(simple definition)  example  emoji(or -)  category

and writes english/bank.json:
  {words: [[word, level, [pos…], zh, en, example, emoji, category, alt, note]…]}

Chinese is normalised to the character forms the family's spreadsheet uses (説 not 說, 裏 not 裡…),
the same convention as words/bank.json. Run:  python3 tools/build_english.py
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
# variant → the form in 滿滿中文認字遊戲總字庫.xlsx (see tools/build_words.py)
FORMS = str.maketrans({'說': '説', '裡': '裏', '著': '着', '溫': '温', '戶': '户', '没': '沒', '黄': '黃', '儿': '兒', '爲': '為',
                       '床': '牀', '群': '羣', '綫': '線', '麪': '麵', '鷄': '雞', '臺': '台', '氷': '冰', '祕': '秘', '鉤': '鈎', '麽': '麼'})
CATS = {'animals', 'food', 'body', 'clothes', 'colours', 'family', 'home', 'school', 'sports', 'toys', 'transport', 'places', 'nature',
        'weather', 'time', 'numbers', 'jobs', 'health', 'feelings', 'actions', 'describing', 'words', 'phrases'}


def main():
    words, seen, bad = [], set(), []
    for ln, line in enumerate((ROOT / 'tools' / 'english_words.tsv').read_text().splitlines(), 1):
        if not line.strip() or line.startswith('#'):
            continue
        f = line.split('\t')
        if len(f) != 10:
            bad.append(f'line {ln}: {len(f)} columns'); continue
        w, lv, pos, note, alt, zh, en, ex, emoji, cat = [x.strip() for x in f]
        if w.lower() in seen:
            bad.append(f'line {ln}: duplicate {w}'); continue
        if cat not in CATS:
            bad.append(f'line {ln}: category {cat}')
        seen.add(w.lower())
        words.append([w, int(lv), [p for p in pos.split('/') if p and p != '-'], zh.translate(FORMS).replace('⋯', '……'), en, ex,
                      '' if emoji == '-' else emoji, cat, '' if alt == '-' else alt, '' if note == '-' else note])
    if bad:
        print('\n'.join(bad)); sys.exit(1)
    out = ROOT / 'english' / 'bank.json'
    out.write_text(json.dumps({'words': words}, ensure_ascii=False, separators=(',', ':')))
    print(f'{len(words)} words → {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
