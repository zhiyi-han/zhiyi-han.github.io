"""Generate natural narration for the cards in Max's World, the Galaxy game and Max's Footprints.

Neural voices (Microsoft, via the free `edge-tts` package):
  Cantonese  zh-HK-HiuMaanNeural
  English    en-GB-LibbyNeural

Usage
  1. pip install edge-tts
  2. Export the spoken text of BOTH games (run in each page's console, save
     the clipboard to a file):
       galaxy.html:  copy(JSON.stringify(await __galaxy.voiceLines()))  -> galaxy_lines.json
       index.html:   copy(JSON.stringify(__max.voiceLines()))           -> world_lines.json
       earth.html:   copy(JSON.stringify(__earth.voiceLines()))         -> earth_lines.json
  3. python tools/make_voice.py galaxy_lines.json world_lines.json earth_lines.json
     (pass every file: clips not listed in any of them are deleted)

Only cards whose text changed (new hash key) are generated; files for
cards that no longer exist are deleted. Each clip is fetched as 96 kbps MP3,
then shrunk to AAC 32 kbps (.m4a) with macOS's built-in `afconvert` — about a
third of the size and still clear for speech. Writes audio/voice/<lang>/<key>.m4a
and audio/voice/manifest.json, which the game reads at start-up.
"""
import asyncio, json, pathlib, subprocess, sys

import edge_tts
import edge_tts.communicate as _comm

VOICES = {'zh': 'zh-HK-HiuMaanNeural', 'en': 'en-GB-LibbyNeural'}
RATE = '-6%'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'audio' / 'voice'


def use_high_quality():
    """edge-tts hard-codes 48 kbps; the service also serves 96 kbps, so patch it in."""
    src = pathlib.Path(_comm.__file__).read_text()
    if 'audio-24khz-48kbitrate-mono-mp3' in src:
        exec(compile(src.replace('audio-24khz-48kbitrate-mono-mp3', 'audio-24khz-96kbitrate-mono-mp3'),
                     _comm.__file__, 'exec'), _comm.__dict__)


async def make(line, sem):
    path = OUT / line['lang'] / f"{line['key']}.m4a"
    if path.exists() and path.stat().st_size > 0:
        return 'kept'
    mp3 = path.with_suffix('.mp3')
    async with sem:
        for attempt in range(3):
            try:
                await _comm.Communicate(line['text'], VOICES[line['lang']], rate=RATE).save(str(mp3))
                subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '32000', str(mp3), str(path)], check=True)
                return 'made'
            except Exception as e:  # network hiccup: retry, then report
                if attempt == 2:
                    print(f"  ! {line['lang']} {line['id']}: {e}")
                    if path.exists():
                        path.unlink()
                    return 'failed'
                await asyncio.sleep(2)
            finally:
                if mp3.exists():
                    mp3.unlink()


async def main(lines):
    for lang in VOICES:
        (OUT / lang).mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*(make(l, sem) for l in lines))
    wanted = {(l['lang'], l['key']) for l in lines}
    removed = 0
    for lang in VOICES:
        for f in (OUT / lang).glob('*.m4a'):
            if (lang, f.stem) not in wanted:
                f.unlink(); removed += 1
    manifest = {lang: sorted(f.stem for f in (OUT / lang).glob('*.m4a')) for lang in VOICES}
    (OUT / 'manifest.json').write_text(json.dumps(manifest, separators=(',', ':')))
    print(f"made {results.count('made')}, kept {results.count('kept')}, failed {results.count('failed')}, removed {removed}")
    print(f"manifest: {len(manifest['en'])} en, {len(manifest['zh'])} zh")


if __name__ == '__main__':
    use_high_quality()
    lines = [l for f in sys.argv[1:] for l in json.loads(pathlib.Path(f).read_text())]
    asyncio.run(main(lines))
