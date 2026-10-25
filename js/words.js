// 滿滿認字 · Max Word — the character review game (words.html).
// One big character per card; a parent grades Max's answer with a direction:
//   ↑ U 秒認到   → R 想一想認到   ← L 提示後認到   ↓ D 今天還不認得
// 小黃 gives two hints (the word, then a story sentence). Characters come back by the
// rules below, and progress lives in localStorage on this device only.

const KEY = 'maxworld.words.v1';
const LEVELS = ['', '基礎核心', '基礎擴展', '核心進階', '故事高頻擴展', '故事情境字', '主題挑戰字'];
const NAMES = { U: '秒認到', R: '想一想認到', L: '提示後認到', D: '今天還不認得' };
const ARROW = { U: '↑', R: '→', L: '←', D: '↓' };
const RANK = { D: 0, L: 1, R: 2, U: 3 };
const SPOT = [0, 2, 4, 10, 21, 45, 90];   // days until the next spot check after 1, 2, 3… instant days in a row
const MASTER = 3;                          // instant on three different days, no hints in between → 已熟練
const EVERY = 7;                           // at most one 已熟練 spot check every this many cards
const $ = id => document.getElementById(id);

let BANK = [], BY = {}, WORKS = [];
let S = load();
let card = null, hint = 0, shown = 0, answered = false, undoSnap = null, reveal = 0, fly = 0;
let sentMode = false, maxHint = 2;   // the last check before 已熟練 shows the character inside its story sentence

// ---------- storage ----------
function fresh() { return { v: 1, sn: 0, recs: {}, cur: null, log: [], font: 'kai' }; }
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) {}
  return fresh();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
const today = () => { const d = new Date(); return Math.floor((d - d.getTimezoneOffset() * 6e4) / 864e5); };
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// keep the overall order but mix each small group, so Max can't learn a fixed sequence
const jumble = (a, n) => a.reduce((o, x, i) => (i % n ? o[o.length - 1].push(x) : o.push([x]), o), []).flatMap(shuffle);
const status = c => (S.recs[c] ? S.recs[c].st : 'N');   // N 待觀察, L 正在學, K 已認得, M 已熟練
const isDue = (r, sn, d) => r.ds <= sn && r.dd <= d;

// ---------- scheduling ----------
// the first answer a character gets in a session decides when it comes back in later sessions;
// answers to in-session repeats only decide whether it repeats again today
function grade(c, k) {
  const r = S.recs[c] || (S.recs[c] = { st: 'L', k: 0, kd: -1, ds: 0, dd: 0, p: 0, n: 0, h: [] });
  const d = today(), next = S.sn + 1;
  if (k === 'U') {
    if (r.kd !== d) { r.k++; r.kd = d; }
    r.st = r.k >= MASTER ? 'M' : 'K';
    Object.assign(r, { ds: next, dd: d + SPOT[Math.min(r.k, SPOT.length - 1)], p: 3 });
  } else if (k === 'R') {
    r.k = Math.min(r.k, MASTER - 1);   // no hint used, so the streak survives, but it needs one more instant day
    Object.assign(r, { st: 'K', ds: next + (r.k ? 1 : 0), dd: d, p: 2 });
  } else {
    Object.assign(r, { st: 'L', k: 0, kd: -1, ds: next, dd: d, p: k === 'L' ? 1 : 0 });
  }
  r.n++; r.h.push([d, k]); if (r.h.length > 12) r.h.shift();
}

// Cards are drawn from the whole bank, never level by level. Each pick is either an "easy" card
// (a character Max already reads, or an untested 四五快讀 one) or a "harder" one (one he needed help
// with, one to think about, or an untested story character). The two alternate loosely so there are
// never more than two harder cards or three easy ones in a row. Within each kind, characters due for
// review come first; untested ones follow in random order. The levels only guess how an untested
// character will go; after that, Max's own answers decide.
function startSession() {
  S.sn++;
  const d = today(), due = BANK.filter(e => S.recs[e.c] && isDue(S.recs[e.c], S.sn, d)).map(e => e.c);
  const byP = p => jumble(due.filter(c => S.recs[c].st !== 'M' && p.includes(S.recs[c].p))
    .sort((a, b) => S.recs[a].p - S.recs[b].p || S.recs[a].dd - S.recs[b].dd), 4);
  const untested = shuffle(BANK.filter(e => !S.recs[e.c]));
  S.cur = {
    sn: S.sn, day: d, no: 0, card: null, hint: 0, last: null, run: [], lastChk: 0,
    hard: byP([0, 1]), mid: byP([2]), easy: byP([3]),
    chk: shuffle(due.filter(c => S.recs[c].st === 'M')),
    newEasy: untested.filter(e => e.lv <= 3).map(e => e.c),
    newHard: untested.filter(e => e.lv > 3).map(e => e.c),
    q: [], seen: {},
  };
  save();
}

function nextChar() {
  const C = S.cur;
  C.no++;
  const later = C.q.filter(x => x.c !== C.last).sort((a, b) => a.at - b.at);
  const ready = later.length && later[0].at <= C.no ? later[0] : null;
  const fromQ = x => { C.q.splice(C.q.indexOf(x), 1); return x.c; };
  const harder = () => (ready && fromQ(ready)) || C.hard.shift() || C.mid.shift() || C.newHard.shift();
  const easier = () => {
    if (C.chk.length && C.no - C.lastChk >= EVERY) { C.lastChk = C.no; return C.chk.shift(); }
    return C.easy.shift() || C.newEasy.shift() || C.chk.shift();
  };
  // how many harder / easy cards in a row just now
  const tail = v => { let n = 0; for (let i = C.run.length - 1; i >= 0 && C.run[i] === v; i--) n++; return n; };
  const h = tail(1), e = tail(0);
  const wantHard = h >= 2 ? false : e >= 3 ? true : h === 1 ? Math.random() < 0.3 : Math.random() < 0.7;
  let c = wantHard ? harder() : easier(), hard = wantHard;
  if (!c) { c = wantHard ? easier() : harder(); hard = !wantHard; }
  if (!c && later.length) { c = fromQ(later[0]); hard = true; }
  if (!c && C.q.length) { c = fromQ(C.q[0]); hard = true; }   // only the card just answered is left to repeat
  if (!c) return null;
  C.run.push(hard ? 1 : 0); if (C.run.length > 6) C.run.shift();
  return c;
}

// ---------- play ----------
function show(c) {
  const C = S.cur;
  clearTimeout(reveal);
  card = c; hint = shown = C.card === c ? C.hint : 0; answered = false;
  $('buddy').classList.remove('pop');
  C.card = c; C.hint = hint; save();
  const e = BY[c], el = $('card'), r = S.recs[c];
  // 七: before a character counts as 已熟練 it must also be recognised inside a sentence
  sentMode = !!r && r.st === 'K' && r.k === MASTER - 1 && !C.seen[c];
  maxHint = sentMode ? 1 : 2;
  el.className = sentMode ? 'sent' : ''; void el.offsetWidth; el.style.animation = '';
  $('glyph').innerHTML = sentMode ? mark(e.s, c) : esc(c);
  $('lv').textContent = sentMode ? '在句子裏認出它' : '';
  $('py').textContent = '';
  renderHints();
  $('pcount').textContent = `本次 ${Object.keys(C.seen).length} 個字`;
  $('undo').disabled = !undoSnap;
  setMode(false);
}

function renderHints() {
  const e = BY[card];
  $('hw').innerHTML = shown >= 1 || answered ? mark(e.w, card) + (answered ? `<span class="wp">${e.wpy}</span>` : '') : '';
  $('hs').innerHTML = (shown >= 2 || answered) && !sentMode ? `${mark(e.s, card)}${e.src >= 0 ? `<cite>——《${WORKS[e.src][1]}》</cite>` : ''}` : '';
  const dots = $('xh').querySelectorAll('i');
  dots.forEach((d, i) => { d.classList.toggle('used', hint > i); d.hidden = i >= maxHint; });
  $('xh').disabled = hint >= maxHint;
  document.querySelectorAll('.dir.up,.dir.right').forEach(b => b.classList.toggle('off', hint > 0));
}
const esc = s => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
const mark = (s, c) => esc(s).split(c).join(`<em>${c}</em>`);

// 小黃 jumps up for a moment to remind Max to think before reading the hint
function buddy(say) {
  const b = $('buddy');
  $('bubble').textContent = say;
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
}

function setMode(ans) {
  $('card').classList.toggle('ans', ans);
  document.querySelectorAll('.dir').forEach(b => (b.hidden = ans));
  $('next').hidden = !ans;
}

function useHint() {
  if (answered || hint >= maxHint) return;
  hint++; S.cur.hint = hint; save();
  renderHints();
  // 小黃 first says 想一想; the hint shows up only as he steps back
  buddy(hint === 1 ? '想一想～' : '再想一想～');
  clearTimeout(reveal);
  reveal = setTimeout(() => { shown = hint; renderHints(); }, 1000);
}

function answer(k) {
  if (answered || !card) return;
  if (hint > 0 && (k === 'U' || k === 'R')) {   // a hint was used: only ← or ↓ make sense now
    const el = $('card'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    return;
  }
  clearTimeout(reveal); shown = hint;
  undoSnap = JSON.stringify(S);
  const C = S.cur, c = card, s = C.seen[c];
  if (!s) { C.seen[c] = { f: k, w: k, t: 1 }; grade(c, k); }
  else {
    s.t++;
    if (RANK[k] < RANK[s.w]) { s.w = k; if (k === 'D') S.recs[c].p = 0; }
  }
  if ((k === 'L' || k === 'D') && C.seen[c].t < 4) C.q.push({ c, at: C.no + (k === 'D' ? rand(4, 6) : rand(5, 8)) });   // waits for a harder slot, so it lands about 5–10 cards later
  C.last = c; C.card = null; C.hint = 0;
  save();
  flash(k);
  answered = true;
  $('pcount').textContent = `本次 ${Object.keys(C.seen).length} 個字`;
  $('undo').disabled = false;
  if (k === 'D') {   // show the whole answer, then wait for 下一個
    $('py').textContent = BY[c].cpy;
    renderHints();
    setMode(true);
    $('next').focus({ preventScroll: true });
  } else {
    $('card').classList.add('fly-' + k);
    fly = setTimeout(advance, 230);
  }
}

function flash(k) {
  const b = document.querySelector(`.dir[data-k="${k}"]`);
  b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 180);
}

function advance() {
  const c = nextChar();
  if (!c) return finish(true);
  show(c);
}

function undo() {
  if (!undoSnap) return;
  clearTimeout(fly);
  const snap = JSON.parse(undoSnap);
  const c = snap.cur.card || card;
  S = snap; undoSnap = null;
  S.cur.card = c; S.cur.hint = 0; save();
  show(c);
  $('undo').disabled = true;
}

function play() {
  if (!S.cur) startSession();
  $('home').hidden = $('done').hidden = true; $('top').hidden = true;
  $('play').hidden = false;
  undoSnap = null;
  const c = S.cur.card || nextChar();
  if (!c) return finish(true);
  show(c);
}

function finish(all) {
  const C = S.cur;
  if (!C) return home();
  const seen = Object.entries(C.seen);
  const n = { U: 0, R: 0, L: 0, D: 0 };
  seen.forEach(([, s]) => n[s.f]++);
  if (seen.length) { S.log.push({ day: C.day, sn: C.sn, n: seen.length, ...n }); if (S.log.length > 100) S.log.shift(); }
  S.cur = null; card = null; undoSnap = null;
  save();
  $('play').hidden = true; $('top').hidden = false; $('home').hidden = true; $('done').hidden = false;
  $('dsum').textContent = seen.length ? `${all ? '全部字都看完了！' : ''}本次一共看了 ${seen.length} 個字。` : '這一次還沒有看字。';
  $('dcounts').innerHTML = 'URLD'.split('').map(k =>
    `<div class="k ${{ U: 'up', R: 'right', L: 'left', D: 'down' }[k]}"><b>${ARROW[k]}</b><span>${NAMES[k]}<strong>${n[k]}</strong></span></div>`).join('');
  const again = seen.filter(([, s]) => s.w === 'L' || s.w === 'D').sort((a, b) => RANK[a[1].w] - RANK[b[1].w]);
  $('dnext').innerHTML = again.length ? again.map(([c, s]) => chip(c, s.w === 'D' ? 'd' : 'l')).join('') : '<p class="tip">沒有！這次的字都不用提示。</p>';
  scrollTo(0, 0);
}

const chip = (c, cls = '') => `<button class="chip ${cls}" data-c="${c}">${c}</button>`;

// ---------- home ----------
function home() {
  $('play').hidden = $('done').hidden = true; $('top').hidden = false; $('home').hidden = false;
  const C = S.cur;
  $('resume').hidden = !C || !Object.keys(C.seen).length;
  $('start').textContent = $('resume').hidden ? '開始' : '開始新的一次';
  if (!$('resume').hidden) $('resume').textContent = `繼續上次（已看 ${Object.keys(C.seen).length} 個字）`;

  const count = list => list.reduce((o, e) => (o[status(e.c)]++, o), { N: 0, L: 0, K: 0, M: 0 });
  const bar = (n, total) => `<div class="bar">${['M', 'K', 'L'].map(x => `<i class="b${x.toLowerCase()}" style="width:${(100 * n[x]) / total}%"></i>`).join('')}</div>`;
  const all = count(BANK);
  $('total').textContent = `${BANK.length} 個字`;
  let html = `<div class="lvrow all"><span>全部</span>${bar(all, BANK.length)}<span class="n">${all.M + all.K}/${BANK.length}</span></div>`;
  for (let lv = 1; lv <= 6; lv++) {
    const list = BANK.filter(e => e.lv === lv), n = count(list);
    html += `<div class="lvrow"><span>${lv}. ${LEVELS[lv]}</span>${bar(n, list.length)}<span class="n">${n.M + n.K}/${list.length}</span></div>`;
  }
  html += `<div class="keys"><span><i style="background:var(--master)"></i>已熟練 ${all.M}</span><span><i style="background:var(--known)"></i>已認得 ${all.K}</span>
    <span><i style="background:var(--learn)"></i>正在學 ${all.L}</span><span><i style="background:var(--new)"></i>待觀察 ${all.N}</span></div>`;
  $('bars').innerHTML = html;

  const learning = BANK.filter(e => status(e.c) === 'L').sort((a, b) => S.recs[a.c].p - S.recs[b.c].p);
  $('due').innerHTML = learning.length
    ? `<h3>下次優先複習（${learning.length}）</h3><div class="chips">${learning.slice(0, 60).map(e => chip(e.c, S.recs[e.c].p ? 'l' : 'd')).join('')}</div>`
    : '';
  if ($('all').open) grid();
  setFont(S.font);
}

function grid() {
  let html = '';
  for (let lv = 1; lv <= 6; lv++) {
    html += `<h4>${lv}. ${LEVELS[lv]}</h4><div class="g">` +
      BANK.filter(e => e.lv === lv).map(e => `<button class="${status(e.c).toLowerCase()}" data-c="${e.c}">${e.c}</button>`).join('') + '</div>';
  }
  $('grid').innerHTML = html;
}

function info(c) {
  const e = BY[c], r = S.recs[c];
  const st = { N: '待觀察', L: '正在學', K: '已認得', M: '已熟練' }[status(c)];
  const hist = r ? r.h.slice(-6).map(([, k]) => ARROW[k]).join(' ') : '—';
  $('info').innerHTML = `<div class="ig">${c}</div><div class="ip">${e.cpy}</div>
    <div class="iw">${mark(e.w, c)}</div>
    <div class="is">${mark(e.s, c)}${e.src >= 0 ? `<cite>——《${WORKS[e.src][1]}》</cite>` : ''}</div>
    <dl><dt>級別</dt><dd>${e.lv}. ${LEVELS[e.lv]}</dd>
    ${e.lesson ? `<dt>四五快讀</dt><dd>${e.lesson}</dd>` : ''}
    <dt>故事</dt><dd>${e.wk.length ? `出現 ${e.freq} 次：${e.wk.map(i => `《${WORKS[i][1]}》`).join('')}` : '還沒有在故事裏出現'}</dd>
    <dt>狀態</dt><dd>${st}${r ? `，看過 ${r.n} 次` : ''}</dd>
    <dt>最近</dt><dd>${hist}</dd></dl>
    <button class="close">好</button>`;
  $('info').showModal();
}

function setFont(f) {
  S.font = f; save();
  document.body.classList.toggle('hei', f === 'hei');
  document.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('on', b.dataset.font === f));
}

// ---------- input ----------
function wire() {
  $('start').onclick = () => { if (S.cur) finishQuiet(); play(); };
  $('resume').onclick = play;
  $('end').onclick = () => finish(false);
  $('again').onclick = play;
  $('home-btn').onclick = home;
  $('undo').onclick = undo;
  $('next').onclick = advance;
  $('xh').onclick = e => { e.stopPropagation(); useHint(); };
  document.querySelectorAll('.dir').forEach(b => (b.onclick = () => answer(b.dataset.k)));
  $('all').addEventListener('toggle', () => $('all').open && grid());
  document.querySelectorAll('[data-font]').forEach(b => (b.onclick = () => setFont(b.dataset.font)));
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-c]');
    if (b) info(b.dataset.c);
    if (e.target.closest('dialog .close') || e.target === $('info')) $('info').close();
  });
  $('export').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
    a.download = `max-word-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('import').onchange = async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (s.v !== 1 || !s.recs) throw 0;
      if (!confirm(`用這個備份取代現在的進度？（備份裏有 ${Object.keys(s.recs).length} 個字的記錄）`)) return;
      S = s; save(); home();
    } catch (err) { alert('這不是滿滿認字的備份檔。'); }
  };
  $('reset').onclick = () => {
    if (!confirm('清除全部進度？所有字會回到「待觀察」。')) return;
    const font = S.font; S = fresh(); S.font = font; save(); home();
  };

  addEventListener('keydown', e => {
    if ($('play').hidden || $('info').open || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = { ArrowUp: 'U', ArrowRight: 'R', ArrowLeft: 'L', ArrowDown: 'D' }[e.key];
    if (answered && (k || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (!$('next').hidden) advance(); return; }
    if (k) { e.preventDefault(); answer(k); }
    else if (e.key === ' ' || e.key === 'h') { e.preventDefault(); useHint(); }
    else if (e.key === 'Backspace') { e.preventDefault(); undo(); }
  });

  // swipe on the card
  let p0 = null;
  $('card').addEventListener('pointerdown', e => { if (!e.target.closest('#xh')) p0 = { x: e.clientX, y: e.clientY }; });
  $('card').addEventListener('pointerup', e => {
    if (!p0) return;
    const dx = e.clientX - p0.x, dy = e.clientY - p0.y; p0 = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) { if (answered && !$('next').hidden) advance(); return; }
    if (answered) { if (!$('next').hidden) advance(); return; }
    answer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : dy < 0 ? 'U' : 'D');
  });
  $('card').addEventListener('pointercancel', () => (p0 = null));
}

// a session left open (page closed without 結束本次) still counts when a new one starts
function finishQuiet() {
  const C = S.cur, seen = Object.values(C.seen);
  if (seen.length) {
    const n = { U: 0, R: 0, L: 0, D: 0 }; seen.forEach(s => n[s.f]++);
    S.log.push({ day: C.day, sn: C.sn, n: seen.length, ...n });
  }
  S.cur = null; save();
}

async function init() {
  const d = await (await fetch('words/bank.json?v=6d9d6096')).json();
  WORKS = d.works;
  BANK = d.chars.map(([c, lv, lesson, nworks, freq, w, wpy, cpy, s, src, wk]) => ({ c, lv, lesson, nworks, freq, w, wpy, cpy, s, src, wk }));
  BANK.sort((a, b) => a.lv - b.lv || b.freq - a.freq);
  BANK.forEach((e, i) => { e.i = i; BY[e.c] = e; });
  wire();
  home();
}
init();

// for checking the schedule from the console
window.__words = { get state() { return S; }, BY: () => BY, today };
