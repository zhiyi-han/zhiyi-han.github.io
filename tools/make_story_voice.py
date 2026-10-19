"""Record the Story House narration (Cantonese, zh-HK-HiuMaanNeural).

Reads stories/data/*.json (made by tools/build_stories.py) and makes one clip
per story page, picture-book page and after-reading item:
  stories/voice/<key>.m4a     HE-AAC 16 kbps mono — about half the size of the
                              game clips and still clear for a single voice
  stories/voice/index.json    {clips: [key…], marks: {key: [start ms of each sentence]}} so the
                              reader can light up the sentence being read

<key> is the FNV-1a hash of the exact text (same as js/narrator.js), so only
changed pages are recorded again; clips nobody uses any more are deleted.

  python tools/make_story_voice.py
"""
import asyncio, json, pathlib, re, subprocess

import edge_tts
import edge_tts.communicate as _comm

VOICE, RATE = 'zh-HK-HiuMaanNeural', '-6%'
ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA, OUT = ROOT / 'stories' / 'data', ROOT / 'stories' / 'voice'


def key_of(s):
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h = ((h ^ b) * 0x01000193) & 0xffffffff
    return f'{h:08x}'


def plain(s):
    return re.sub(r'[\W_]+', '', s)


def lines():
    """(text, sentences-or-None) for everything the reader can speak"""
    for f in sorted(DATA.glob('[sb]*.json')):
        d = json.loads(f.read_text())
        for p in d['pages']:
            if 's' in p:
                yield '\n'.join(''.join(par) for par in p['s']), [s for par in p['s'] for s in par]
            else:
                yield p['say'], None
        for sec in d.get('extras', []):
            for it in sec['items']:
                t = item_text(it)
                if t:
                    yield t, None


def item_text(it):   # must match itemSpeech() in js/stories.js
    k = it['k']
    if k == 'word':
        return f"{it['w']}。{it['d']}" if it['d'] else it['w'] + '。'
    if k in ('li', 'p'):
        return it['t']
    if k == 'path':
        return '，'.join(it['steps']) + '。'
    return ''


def align(sents, bounds):
    """start time (ms) of each of our sentences, from the engine's sentence boundaries"""
    marks, pos = [], 0
    for b in bounds:
        n = len(plain(b['text']))
        marks.append((pos, n, b['offset'] / 1e4, b['duration'] / 1e4)); pos += n
    out, pos = [], 0
    for s in sents:
        t = 0
        for c, n, off, dur in marks:
            if c <= pos:
                t = off + (dur * (pos - c) / n if n else 0)
        out.append(round(t)); pos += len(plain(s))
    return out


async def make(text, sents, sem, index):
    key = key_of(text)
    path = OUT / f'{key}.m4a'
    if path.exists() and path.stat().st_size > 0 and (sents is None or key in index):
        return 'kept'
    mp3 = path.with_suffix('.mp3')
    async with sem:
        for attempt in range(3):
            try:
                bounds = []
                with open(mp3, 'wb') as f:
                    async for ch in _comm.Communicate(text, VOICE, rate=RATE, boundary='SentenceBoundary').stream():
                        if ch['type'] == 'audio':
                            f.write(ch['data'])
                        elif ch['type'] == 'SentenceBoundary':
                            bounds.append(ch)
                subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aach', '-b', '16000', str(mp3), str(path)], check=True)
                if sents:
                    index[key] = align(sents, bounds)
                return 'made'
            except Exception as e:
                if attempt == 2:
                    print(f'  ! {text[:20]}…: {e}')
                    path.unlink(missing_ok=True)
                    return 'failed'
                await asyncio.sleep(2)
            finally:
                mp3.unlink(missing_ok=True)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ix_file = OUT / 'index.json'
    index = json.loads(ix_file.read_text()).get('marks', {}) if ix_file.exists() else {}
    todo = {}
    for text, sents in lines():
        todo.setdefault(key_of(text), (text, sents))
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*(make(t, s, sem, index) for t, s in todo.values()))
    removed = 0
    for f in OUT.glob('*.m4a'):
        if f.stem not in todo:
            f.unlink(); removed += 1
    index = {k: v for k, v in sorted(index.items()) if k in todo}
    ix_file.write_text(json.dumps({'clips': sorted(f.stem for f in OUT.glob('*.m4a')), 'marks': index}, separators=(',', ':')))
    print(f"made {results.count('made')}, kept {results.count('kept')}, failed {results.count('failed')}, removed {removed}")


if __name__ == '__main__':
    src = pathlib.Path(_comm.__file__).read_text()     # ask for the 96 kbps stream, as tools/make_voice.py does
    if 'audio-24khz-48kbitrate-mono-mp3' in src:
        exec(compile(src.replace('audio-24khz-48kbitrate-mono-mp3', 'audio-24khz-96kbitrate-mono-mp3'), _comm.__file__, 'exec'), _comm.__dict__)
    asyncio.run(main())
