/* ============================================================
   滿滿故事屋 · Max's Story House

   A bookshelf of Max's original stories and picture books. Each page is
   read aloud from a pre-recorded clip (stories/voice, made by
   tools/make_story_voice.py) while the sentence being read lights up;
   pages without a clip fall back to the device's speech engine.
   Data comes from stories/data (tools/build_stories.py).
   ============================================================ */
import { createNarrator, textKey } from './narrator.js?v=0c90647d';

const $ = s => document.querySelector(s);
const SAVE_KEY = 'maxstories.v1';
const VOICE = 'stories/voice/';

const save = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } })();
const store = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };

let shelf = [], clips = new Set(), marks = {};
let book = null, views = [], at = 0, auto = true, fromShelf = false;

/* ---------------- voice ---------------- */
const audio = new Audio(); audio.preload = 'auto'; audio.setAttribute('playsinline', '');
let onDone = null, hl = null, raf = 0, viaTTS = false;
const fallback = createNarrator({ getLang: () => 'zh', isSoundOn: () => true, zhVoice: /zh[-_](CN|Hans)|cmn/i, zhLang: 'zh-CN',
  onSpeaking: on => { if (!on && viaTTS) { viaTTS = false; finish(); } } });

function finish(){
  cancelAnimationFrame(raf); setHL(-1);
  $('#rplay').classList.toggle('on', false);
  const f = onDone; onDone = null; if (f) f();
}
audio.onended = finish;
audio.onerror = () => { if (onDone) { const t = audio.dataset.text; audio.removeAttribute('src'); viaTTS = true; fallback.speak(t, true); } };

function setHL(i){
  if (!hl) return;
  hl.els.forEach((el, k) => el.classList.toggle('now', k === i));
}
function tick(){
  if (!hl || audio.paused) return;
  const t = audio.currentTime * 1000 + 60;
  let i = 0; while (i + 1 < hl.marks.length && hl.marks[i + 1] <= t) i++;
  if (i !== hl.cur) { hl.cur = i; setHL(i); hl.els[i]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  raf = requestAnimationFrame(tick);
}

/* speak text; els = elements to light up (one per sentence, or a single one); then() runs when it ends */
/* clips are keyed by voice + text: a man reads the stories marked "voice": "man", a woman the rest */
const clipKey = text => textKey((book?.voice || 'f') + '|' + text);
function speak(text, els = [], then = null, fromSentence = 0){
  stop();
  if (!text) return;
  const key = clipKey(text);
  onDone = then;
  hl = { els, marks: marks[key] || (els.length === 1 ? [0] : []), cur: -1 };
  $('#rplay').classList.toggle('on', true);
  if (!clips.has(key)) { viaTTS = true; setHL(els.length === 1 ? 0 : -1); fallback.speak(text, true); return; }
  audio.dataset.text = text;
  audio.src = VOICE + key + '.m4a';
  const start = fromSentence && hl.marks[fromSentence] ? hl.marks[fromSentence] / 1000 : 0;
  if (start) audio.addEventListener('loadedmetadata', () => { audio.currentTime = start; }, { once: true });
  audio.play().then(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); })
    .catch(() => { stop(); setAuto(false); });   /* opened from a link without a tap: wait for 🔈 */
}
function stop(){
  onDone = null; cancelAnimationFrame(raf);
  if (!audio.paused) audio.pause();
  if (viaTTS) { viaTTS = false; fallback.stop(); }
  setHL(-1); hl = null;
  $('#rplay').classList.toggle('on', false);
}
/* warm the cache for the next page so turning it starts at once */
function prefetch(text){
  const key = text && clipKey(text);
  if (key && clips.has(key)) fetch(VOICE + key + '.m4a', { priority: 'low' }).catch(() => {});
}

/* ---------------- shelf ---------------- */
function bookTile(b){
  const el = document.createElement('button'); el.className = 'book';
  el.innerHTML = `<img loading="lazy" alt=""><div class="t"></div>` + (b.n ? `<div class="n">${b.n}</div>` : '') +
    (save[b.id]?.done ? '<div class="done">✓</div>' : '');
  el.querySelector('img').src = b.cover;
  el.querySelector('.t').textContent = b.title;
  el.onclick = () => { fromShelf = true; location.hash = b.id; };
  return el;
}
function drawShelf(){
  $('#books').replaceChildren(...shelf.filter(b => b.kind === 'book').map(bookTile));
  $('#stories').replaceChildren(...shelf.filter(b => b.kind === 'text').map(bookTile));
}

/* ---------------- reader ---------------- */
const pageText = v => v.type === 'text' ? v.s.map(p => p.join('')).join('\n') : v.type === 'pic' ? v.say : v.type === 'cover' ? book.title : '';
function itemSpeech(it){   /* must match item_text() in tools/make_story_voice.py */
  if (it.k === 'word') return it.w + '。' + (it.d || '');
  if (it.k === 'li' || it.k === 'p') return it.t;
  if (it.k === 'path') return it.steps.join('，') + '。';
  return '';
}

async function openBook(id){
  const meta = shelf.find(b => b.id === id); if (!meta) return;
  const r = await fetch(`stories/data/${id}.json?v=0c90647d`); if (!r.ok) return;
  book = await r.json();
  views = book.kind === 'book'
    ? book.pages.map(p => ({ type: 'pic', img: p.img, say: p.say }))
    : [{ type: 'cover' }, ...book.pages.map(p => ({ type: 'text', s: p.s })), ...(book.extras?.length ? [{ type: 'after' }] : [])];
  $('#rtitle').textContent = book.title;
  $('#reader').hidden = false; document.body.style.overflow = 'hidden';
  show(0);
}
function closeBook(){
  stop(); book = null;
  $('#reader').hidden = true; document.body.style.overflow = '';
  drawShelf();
}

function show(i){
  stop();
  at = Math.max(0, Math.min(views.length - 1, i));
  const v = views[at], stage = $('#stage');
  stage.scrollTop = 0; stage.classList.toggle('picmode', v.type === 'pic');
  let els = [];
  if (v.type === 'cover'){
    stage.innerHTML = `<div class="cover"><img alt=""><button class="go">開始讀 ▶</button></div>`;
    stage.querySelector('img').src = book.cover;
    stage.querySelector('.go').onclick = () => show(1);
  } else if (v.type === 'text'){
    const page = document.createElement('div'); page.className = 'page';
    v.s.forEach(par => {
      const p = document.createElement('p');
      par.forEach(s => { const sp = document.createElement('span'); sp.className = 's'; sp.textContent = s; p.appendChild(sp); els.push(sp); });
      page.appendChild(p);
    });
    els.forEach((sp, k) => sp.onclick = () => speak(pageText(v), els, afterPage, k));
    stage.replaceChildren(page);
  } else if (v.type === 'pic'){
    const img = document.createElement('img'); img.className = 'pic'; img.src = v.img; img.alt = v.say;
    img.onclick = () => speak(v.say, [], afterPage);
    stage.replaceChildren(img);
    const nx = views[at + 1]; if (nx?.img) { const pre = new Image(); pre.src = nx.img; }
  } else {
    stage.replaceChildren(afterReading());
  }
  $('#rprev').disabled = at === 0;
  $('#rnext').disabled = at === views.length - 1;
  $('#rpage').textContent = v.type === 'after' ? '讀完啦 🎉' : `${at + 1} / ${views.length}`;
  if (at === views.length - 1 && !save[book.id]?.done){ save[book.id] = { done: true }; store(); }
  if (auto && v.type !== 'after') speak(pageText(v), els, afterPage);
  prefetch(views[at + 1] && pageText(views[at + 1]));
}
/* in read-aloud mode, turn the page by itself (but wait on the cover for "開始讀") */
function afterPage(){
  if (!auto || views[at].type === 'cover') return;
  const was = at;
  setTimeout(() => { if (book && at === was && auto && at < views.length - 1) show(at + 1); }, 900);
}

/* stories that lead on to another part of the site */
const LINKS = {
  s02: ['galaxy.html#pluto', '🚀 坐火箭去看看冥王星'],
  s03: ['./?from=stories&art=bumblebee', '🎨 看看 Max 畫的 Bumblebee'],
  s15: ['galaxy.html', '🚀 坐上真正的火箭去太空'],
};
function afterReading(){
  const box = document.createElement('div'); box.className = 'after';
  const tap = (el, text) => { el.onclick = () => speak(text, [el]); };
  book.extras.forEach(sec => {
    if (sec.h){ const h = document.createElement('h3'); h.textContent = sec.h; box.appendChild(h); }
    let words = null;
    sec.items.forEach(it => {
      if (it.k === 'word'){
        if (!words){ words = document.createElement('div'); words.className = 'words'; box.appendChild(words); }
        const b = document.createElement('button'); b.className = 'word';
        b.innerHTML = '<b></b><span></span>'; b.firstChild.textContent = it.w; b.lastChild.textContent = it.d;
        tap(b, itemSpeech(it)); words.appendChild(b); return;
      }
      words = null;
      if (it.k === 'img'){ const im = document.createElement('img'); im.className = 'chart'; im.loading = 'lazy'; im.src = it.src; im.alt = sec.h; box.appendChild(im); return; }
      if (it.k === 'path'){
        const d = document.createElement('div'); d.className = 'path';
        it.steps.forEach((s, k) => {
          if (k){ const a = document.createElement('span'); a.className = 'ar'; a.textContent = '→'; d.appendChild(a); }
          const st = document.createElement('span'); st.className = 'st'; st.textContent = s; d.appendChild(st);
        });
        tap(d, itemSpeech(it)); box.appendChild(d); return;
      }
      const q = document.createElement('button'); q.className = it.k === 'li' ? 'q' : 'q plain'; q.textContent = it.t;
      tap(q, itemSpeech(it)); box.appendChild(q);
    });
  });
  const go = LINKS[book.id];
  if (go){ const a = document.createElement('a'); a.className = 'again link'; a.href = go[0]; a.textContent = go[1]; box.appendChild(a); }
  const again = document.createElement('button'); again.className = 'again'; again.textContent = '↺ 再讀一次';
  again.onclick = () => show(0); box.appendChild(again);
  return box;
}

/* ---------------- controls ---------------- */
$('#rclose').onclick = () => { if (fromShelf) { fromShelf = false; history.back(); } else history.replaceState(null, '', location.pathname), route(); };
$('#rprev').onclick = () => show(at - 1);
$('#rnext').onclick = () => show(at + 1);
function setAuto(on){ auto = on; $('#rplay').textContent = on ? '🔊' : '🔈'; }
$('#rplay').onclick = () => {
  setAuto(!auto);
  if (auto && views[at].type !== 'after') speak(pageText(views[at]), [...$('#stage').querySelectorAll('.s')], afterPage);
  else stop();
};
addEventListener('keydown', e => {
  if ($('#reader').hidden) return;
  if (e.key === 'ArrowRight') show(at + 1);
  else if (e.key === 'ArrowLeft') show(at - 1);
  else if (e.key === 'Escape') $('#rclose').onclick();
});
/* swipe left / right to turn pages */
let sx = 0, sy = 0;
$('#stage').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
$('#stage').addEventListener('pointerup', e => {
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.abs(dx) > 60 && Math.abs(dy) < 50) show(at + (dx < 0 ? 1 : -1));
});
function route(){
  const id = location.hash.slice(1);
  if (id && shelf.some(b => b.id === id)) { if (book?.id !== id) openBook(id); }
  else if (book) closeBook();
}
addEventListener('hashchange', route);

/* ---------------- boot ---------------- */
Promise.all([
  fetch('stories/data/index.json?v=0c90647d').then(r => r.json()),
  fetch(VOICE + 'index.json?v=0c90647d').then(r => r.ok ? r.json() : {}).catch(() => ({})),
]).then(([s, v]) => {
  shelf = s; clips = new Set(v.clips || []); marks = v.marks || {};
  drawShelf(); route();
});
