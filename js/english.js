// 滿滿背單詞 · Max English — the English vocabulary game (english.html).
// Cambridge YLE Starters / Movers / Flyers words. Each card shows a word and four meanings
// (emoji + a simple English definition, Traditional Chinese underneath as a helper); Max picks one. The first time he picks the right meaning
// by himself the word is 背會 and earns $1; it then comes back after 1, 2, 4, 8… days and
// becomes 熟練 (+$2) when he still knows it on three later days. Money buys pets.
// Progress lives in localStorage on this device only.

const KEY = 'maxworld.english.v1';
const LV = ['', 'Starters', 'Movers', 'Flyers'];
const INT = [0, 1, 2, 4, 8, 16, 32];        // days until the next review after box 0, 1, 2…
const MASTER_BOX = 4;                        // right on three later days → 熟練
const PAY_LEARN = 1, PAY_MASTER = 2;
const CATS = { animals: '動物', food: '食物', body: '身體', clothes: '衣服', colours: '顏色', family: '家人', home: '家裏', school: '學校',
  sports: '運動', toys: '玩具', transport: '交通', places: '地方', nature: '大自然', weather: '天氣', time: '時間', numbers: '數字',
  jobs: '職業', health: '健康', feelings: '心情', actions: '動作', describing: '形容', words: '小詞', phrases: '常用語' };
const TIER = { feelings: 1, actions: 1, describing: 1, time: 1, words: 2, phrases: 2 };   // concrete things first, grammar words last
const POS = { n: '名詞', v: '動詞', adj: '形容詞', adv: '副詞', prep: '介詞', pron: '代詞', det: '限定詞', conj: '連詞', excl: '感嘆詞',
  int: '疑問詞', dis: '語氣詞', 'poss adj': '物主詞', poss: '物主詞', title: '稱呼' };
const PETS = [
  ['chick', '🐣', '小雞仔', 'Chick', 5], ['cat', '🐱', '小貓', 'Kitten', 8], ['dog', '🐶', '小狗', 'Puppy', 10], ['rabbit', '🐰', '小兔', 'Bunny', 12],
  ['hamster', '🐹', '倉鼠', 'Hamster', 15], ['turtle', '🐢', '小烏龜', 'Turtle', 18], ['fox', '🦊', '小狐狸', 'Fox', 20], ['panda', '🐼', '熊貓', 'Panda', 25],
  ['koala', '🐨', '樹熊', 'Koala', 30], ['lion', '🦁', '獅子', 'Lion', 35], ['penguin', '🐧', '企鵝', 'Penguin', 40], ['owl', '🦉', '貓頭鷹', 'Owl', 45],
  ['unicorn', '🦄', '獨角獸', 'Unicorn', 50], ['dragon', '🐲', '小龍', 'Dragon', 60], ['dino', '🦖', '霸王龍', 'T-Rex', 80],
  ['whale', '🐳', '鯨魚', 'Whale', 100], ['robot', '🤖', '機械人', 'Robot', 120], ['fairy', '🧚', '小精靈', 'Fairy', 150],
];
const CHEER = ['太棒了！', '答對了！', '好厲害！', '就是它！', 'Yes!', '真聰明！'];
const SORRY = ['沒關係，再記一記～', '等一下再試試！', '慢慢來～'];
const $ = id => document.getElementById(id);

let BANK = [], BY = {};
let S = load();
let card = null, answered = false, speakT = 0;

// ---------- storage ----------
function fresh() { return { v: 1, sn: 0, recs: {}, cur: null, log: [], money: 0, earned: 0, pets: [], pet: null, lv: [1], newN: 8, acc: 'GB' }; }
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) {}
  return fresh();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
const today = () => { const d = new Date(); return Math.floor((d - d.getTimezoneOffset() * 6e4) / 864e5); };
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[rand(0, a.length - 1)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function hash(s) { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h; }
const rec = w => S.recs[w];
const status = w => (S.recs[w] ? S.recs[w].st : 'N');   // N 未學, L 正在學, K 背會, M 熟練
const active = () => BANK.filter(e => S.lv.includes(e.lv));
const esc = s => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

// ---------- speech ----------
// macOS/iOS list novelty voices (Albert, Bad News, Bubbles…) before the real ones, so prefer known good
// voices for each accent, then any ordinary voice of that accent, and only then the rest.
const GOOD = { US: /Samantha|Ava|Allison|Nicky|Joelle|Zoe|Evan|Tom|Aaron|Nathan|Siri|Google US|Aria|Jenny|Guy/i,
               GB: /Daniel|Kate|Oliver|Serena|Jamie|Stephanie|Martha|Arthur|Siri|Google UK|Sonia|Ryan|Libby/i };
const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Junior|Kathy|Organ|Ralph|Fred|Rocko|Shelley|Superstar|Trinoids|Whisper|Wobble|Zarvox|Eddy|Flo|Grandma|Grandpa|Reed|Sandy/i;
function voice(lang) {
  const vs = speechSynthesis.getVoices();
  if (lang === 'en') {
    const acc = S.acc === 'US' ? 'US' : 'GB', re = new RegExp(`en[-_]${acc}`, 'i');
    const mine = vs.filter(v => re.test(v.lang));
    return mine.find(v => GOOD[acc].test(v.name)) || mine.find(v => !NOVELTY.test(v.name)) || mine[0]
      || vs.find(v => /^en/i.test(v.lang) && !NOVELTY.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  for (const re of [/zh[-_](TW|Hant)/i, /zh[-_](CN|Hans)|cmn/i, /^zh/i]) { const v = vs.find(v => re.test(v.lang)); if (v) return v; }
  return null;
}
function say(text, lang = 'en', rate = .85) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text), v = voice(lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang === 'en' ? (S.acc === 'US' ? 'en-US' : 'en-GB') : 'zh-TW';
  u.rate = rate; u.pitch = 1.05;
  speechSynthesis.speak(u);
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();

// ---------- scheduling ----------
// first: this is the first time the word is answered in this session (later tries follow a wrong answer, so they
// may earn the $1 but never move the word forward)
function grade(w, ok, first) {
  const r = S.recs[w] || (S.recs[w] = { b: 0, due: 0, n: 0, ok: 0, st: 'L', h: [], p1: 0, p2: 0 });
  const d = today(), C = S.cur;
  r.n++; r.h.push([d, ok ? 1 : 0]); if (r.h.length > 12) r.h.shift();
  let pay = 0;
  if (ok) {
    r.ok++;
    if (first) r.b = Math.min(r.b + 1, INT.length - 1); else r.b = Math.max(r.b, 1);
    r.st = r.b >= MASTER_BOX ? 'M' : 'K';
    r.due = d + INT[r.b];
    if (!r.p1) { r.p1 = 1; pay += PAY_LEARN; C.learned.push(w); }
    if (r.st === 'M' && !r.p2) { r.p2 = 1; pay += PAY_MASTER; C.mastered.push(w); }
  } else {
    r.b = r.b > 0 ? 1 : 0;
    r.st = r.b ? 'K' : 'L';
    r.due = d + r.b;
  }
  if (pay) { S.money += pay; S.earned += pay; C.earned += pay; }
  return pay;
}

// new words come in a fixed order per level: things you can see first (and those with a picture first),
// then feelings / actions / describing words, grammar words last; within a group the order is a stable shuffle
const order = e => [e.lv, TIER[e.cat] || 0, e.e ? 0 : 1, hash(e.w)];
const cmp = (a, b) => { const x = order(a), y = order(b); for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

function startSession() {
  S.sn++;
  const d = today();
  const due = active().filter(e => rec(e.w) && rec(e.w).due <= d).sort((a, b) => rec(a.w).due - rec(b.w).due || rec(a.w).b - rec(b.w).b).map(e => e.w);
  const fresh = active().filter(e => !rec(e.w)).sort(cmp).slice(0, S.newN).map(e => e.w);
  // two reviews, one new word, two reviews… so the new ones are spread through the session
  const q = [];
  while (due.length || fresh.length) {
    for (let i = 0; i < 2 && due.length; i++) q.push({ w: due.shift(), k: 'R' });
    if (fresh.length) q.push({ w: fresh.shift(), k: 'N' });
  }
  S.cur = { sn: S.sn, day: d, no: 0, q, card: null, seen: {}, learned: [], mastered: [], earned: 0, ok: 0, bad: 0 };
  save();
}

function taskText() {
  const d = today();
  const due = active().filter(e => rec(e.w) && rec(e.w).due <= d).length;
  const fresh = Math.min(S.newN, active().filter(e => !rec(e.w)).length);
  if (!due && !fresh) return S.lv.length < 3 ? '今天的單詞都看完了！可以在家長設定加一個級別。' : '今天的單詞都看完了！明天再來。';
  return `今天：${due ? `複習 ${due} 個` : ''}${due && fresh ? ' ＋ ' : ''}${fresh ? `新單詞 ${fresh} 個` : ''}`;
}

// four meanings: the right one and three others of the same kind of word (same level and part of speech
// when there are enough), never two with the same Chinese or the same picture
function options(w) {
  const e = BY[w], used = new Set([e.zh.split('；')[0]]), em = new Set([e.e]);
  const okay = x => x.w !== w && !used.has(x.zh.split('；')[0]) && !(x.e && em.has(x.e));
  const take = (list, n, out) => { for (const x of shuffle(list.slice())) { if (out.length >= n) break; if (okay(x)) { out.push(x.w); used.add(x.zh.split('；')[0]); if (x.e) em.add(x.e); } } };
  const same = BANK.filter(x => x.lv === e.lv && x.pos[0] === e.pos[0]);
  const out = [];
  take(same.filter(x => x.cat === e.cat), rand(0, 2), out);
  take(same, 3, out);
  take(BANK.filter(x => x.pos[0] === e.pos[0]), 3, out);
  take(BANK, 3, out);
  return shuffle(out.concat(w));
}

function nextCard() {
  const C = S.cur;
  const it = C.q.shift();
  if (!it) return null;
  C.no++;
  C.card = { w: it.w, k: it.k, opts: options(it.w) };
  save();
  return C.card;
}

// ---------- play ----------
function show(c) {
  const C = S.cur, e = BY[c.w];
  card = c; answered = false;
  const el = $('card'); el.className = ''; void el.offsetWidth;
  $('tag').innerHTML = `${c.k === 'N' ? '<b>新</b>' : status(c.w) === 'M' ? '<b>熟練</b>' : ''}${LV[e.lv]} · ${e.pos.map(p => POS[p] || p).join('、')}${e.note ? ` · ${esc(e.note)}` : ''}`;
  $('word').innerHTML = esc(e.w) + (e.alt ? ` <small>/ ${esc(e.alt)}</small>` : '');
  $('word').classList.toggle('long', e.w.length > 11);
  $('ans').hidden = true;
  $('opts').innerHTML = c.opts.map(w => `<button class="opt" data-w="${esc(w)}"><span class="e">${BY[w].e}</span><span class="t"><b>${esc(BY[w].en)}</b><small>${esc(BY[w].zh.split('；')[0])}</small></span></button>`).join('');
  $('dunno').hidden = false; $('verdict').hidden = true; $('next').hidden = true;
  $('buddy').classList.remove('pop');
  $('pcount').textContent = `還有 ${C.q.length} 個`;
  clearTimeout(speakT); speakT = setTimeout(() => say(e.w), 250);
}

function answer(w) {
  if (answered || !card) return;
  answered = true;
  const C = S.cur, e = BY[card.w], ok = w === card.w;
  const s = C.seen[card.w];
  let pay = 0;
  if (!s) { C.seen[card.w] = { f: ok ? 1 : 0, t: 1, done: ok }; pay = grade(card.w, ok, true); }
  else { s.t++; if (ok) s.done = true; if (!s.done || ok) pay = s.f ? 0 : grade(card.w, ok, false); }
  if (ok) C.ok++; else C.bad++;
  if (!ok && (C.seen[card.w].t < 3)) C.q.splice(Math.min(C.q.length, rand(3, 6)), 0, { w: card.w, k: 'A' });   // comes back a few cards later
  C.card = null;
  save();

  document.querySelectorAll('.opt').forEach(b => {
    b.disabled = true;
    if (b.dataset.w === card.w) b.classList.add('ok');
    else if (b.dataset.w === w) b.classList.add('bad');
  });
  $('azh').innerHTML = `${esc(e.zh)} <button class="zsay" aria-label="讀中文">🔉</button>`;
  $('aen').textContent = e.en;
  $('aex').innerHTML = `${mark(e.ex, e.w)} <button class="xsay" aria-label="讀例句">🔊</button>`;
  $('ans').hidden = false;
  $('dunno').hidden = true;
  const v = $('verdict');
  v.hidden = false; v.className = ok ? 'ok' : 'bad';
  v.textContent = ok ? (pay ? `✅ 答對了！背會 ${e.w}，賺 $${pay}${pay > PAY_LEARN ? '（熟練！）' : ''}` : '✅ 答對了！') : w ? '❌ 不是這個，看看答案～' : '🤔 記一記，等一下再來';
  $('next').hidden = false;
  if (pay) coin(pay);
  buddy(ok ? pick(CHEER) : pick(SORRY), ok);
  $('money').textContent = $('money2').textContent = S.money;
  if (pay) ['money', 'money2'].forEach(id => { const p = $(id).parentElement; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); });
  if (!ok) { const el = $('card'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  clearTimeout(speakT); speakT = setTimeout(() => say(`${e.w}. ${e.en} ${e.ex}`, 'en', .9), ok ? 500 : 900);
}

const mark = (s, w) => { const re = new RegExp(`\\b(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)`, 'i'); return esc(s).replace(re, '<em>$1</em>'); };

function coin(n) {
  const c = $('coin'); c.textContent = `+$${n}`;
  c.classList.remove('fly'); void c.offsetWidth; c.classList.add('fly');
}
function buddy(text, happy) {
  const b = $('buddy'), p = petOf(S.pet);
  $('bpet').textContent = p ? p[1] : '🥚';
  $('bubble').textContent = p ? text : happy ? '去寵物店找我！' : text;
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
}
const petOf = id => PETS.find(p => p[0] === id);

function advance() {
  const c = nextCard();
  if (!c) return finish(true);
  show(c);
}

function play() {
  if (!S.cur) startSession();
  $('home').hidden = $('done').hidden = true; $('top').hidden = true;
  $('play').hidden = false;
  $('money2').textContent = S.money;
  const c = S.cur.card || nextCard();
  if (!c) return finish(true);
  show(c);
}

function finish(all) {
  const C = S.cur;
  if (!C) return home();
  const n = Object.keys(C.seen).length;
  if (n) { S.log.push({ day: C.day, sn: C.sn, n, ok: C.ok, bad: C.bad, learned: C.learned.length, earned: C.earned }); if (S.log.length > 100) S.log.shift(); }
  S.cur = null; card = null;
  save();
  speechSynthesis.cancel && speechSynthesis.cancel();
  $('play').hidden = true; $('top').hidden = false; $('home').hidden = true; $('done').hidden = false;
  $('dsum').textContent = n ? `${all ? '今天的單詞都看完了！' : ''}本次一共看了 ${n} 個單詞${C.earned ? `，賺了 $${C.earned}` : ''}。` : '這一次還沒有看單詞。';
  $('dcounts').innerHTML = [['✅', '答對', C.ok, 'var(--ok)'], ['❌', '答錯', C.bad, 'var(--bad)'], ['⭐', '背會', C.learned.length, 'var(--gold)'], ['💰', '賺到', `$${C.earned}`, '#b87a00']]
    .map(([i, t, v, c]) => `<div class="k"><b style="background:${c}">${i}</b><span>${t}<strong>${v}</strong></span></div>`).join('');
  $('dlearn').innerHTML = C.learned.length ? C.learned.map(w => chip(w, 'k')).join('') : '<p class="tip">這次沒有新背會的單詞。</p>';
  const again = Object.entries(C.seen).filter(([, s]) => !s.f).map(([w]) => w);
  $('dnext').innerHTML = again.length ? again.map(w => chip(w, 'd')).join('') : '<p class="tip">沒有！這次的單詞全部一次答對。</p>';
  scrollTo(0, 0);
}

const chip = (w, cls = '') => `<button class="chip ${cls}" data-w="${esc(w)}">${BY[w].e ? `<span>${BY[w].e}</span>` : ''}${esc(w)}</button>`;

// ---------- home ----------
function home() {
  $('play').hidden = $('done').hidden = true; $('top').hidden = false; $('home').hidden = false;
  const C = S.cur;
  $('resume').hidden = !C || !Object.keys(C.seen).length;
  $('start').textContent = $('resume').hidden ? '開始' : '開始新的一次';
  if (!$('resume').hidden) $('resume').textContent = `繼續上次（還有 ${C.q.length + (C.card ? 1 : 0)} 個）`;
  $('task').textContent = taskText();
  $('money').textContent = S.money;
  const p = petOf(S.pet);
  $('pet').textContent = p ? p[1] : '🥚';
  $('petbtn').title = p ? `${p[2]} ${p[3]}` : '還沒有寵物，去寵物店看看';
  $('petcount').textContent = `${S.pets.length} 隻`;
  $('pets').innerHTML = S.pets.length ? S.pets.map(id => { const q = petOf(id); return `<button data-pet="${id}" class="${id === S.pet ? 'on' : ''}" title="${q[2]}">${q[1]}</button>`; }).join('')
    : '<span class="empty">還沒有寵物。背會單詞賺錢，去寵物店換一隻吧！</span>';

  const count = list => list.reduce((o, e) => (o[status(e.w)]++, o), { N: 0, L: 0, K: 0, M: 0 });
  const bar = (n, total) => `<div class="bar">${['M', 'K', 'L'].map(x => `<i class="b${x.toLowerCase()}" style="width:${(100 * n[x]) / total}%"></i>`).join('')}</div>`;
  const all = count(BANK);
  $('total').textContent = `${BANK.length} 個單詞`;
  let html = `<div class="lvrow all"><span>全部</span>${bar(all, BANK.length)}<span class="n">${all.M + all.K}/${BANK.length}</span></div>`;
  for (let lv = 1; lv <= 3; lv++) {
    const list = BANK.filter(e => e.lv === lv), n = count(list);
    html += `<div class="lvrow ${S.lv.includes(lv) ? '' : 'off'}"><span>${LV[lv]}</span>${bar(n, list.length)}<span class="n">${n.M + n.K}/${list.length}</span></div>`;
  }
  html += `<div class="keys"><span><i style="background:var(--master)"></i>熟練 ${all.M}</span><span><i style="background:var(--known)"></i>背會 ${all.K}</span>
    <span><i style="background:var(--learn)"></i>正在學 ${all.L}</span><span><i style="background:var(--new)"></i>未學 ${all.N}</span>
    <span>💰 一共賺了 $${S.earned}</span></div>`;
  $('bars').innerHTML = html;

  const learning = BANK.filter(e => status(e.w) === 'L');
  $('due').innerHTML = learning.length
    ? `<h3>還沒背會（${learning.length}）</h3><div class="chips">${learning.slice(0, 40).map(e => chip(e.w, 'd')).join('')}</div>`
    : '';
  if ($('all').open) grid();
  document.querySelectorAll('[data-lv]').forEach(b => b.classList.toggle('on', S.lv.includes(+b.dataset.lv)));
  document.querySelectorAll('[data-new]').forEach(b => b.classList.toggle('on', +b.dataset.new === S.newN));
  document.querySelectorAll('[data-acc]').forEach(b => b.classList.toggle('on', b.dataset.acc === S.acc));
}

function grid() {
  let html = '';
  for (let lv = 1; lv <= 3; lv++) {
    html += `<h3>${LV[lv]}</h3>`;
    for (const cat of Object.keys(CATS)) {
      const list = BANK.filter(e => e.lv === lv && e.cat === cat);
      if (!list.length) continue;
      html += `<h4>${CATS[cat]} · ${list.length}</h4><div class="g">` +
        list.map(e => `<button class="${status(e.w).toLowerCase()}" data-w="${esc(e.w)}">${e.e ? e.e + ' ' : ''}${esc(e.w)}</button>`).join('') + '</div>';
    }
  }
  $('grid').innerHTML = html;
}

function info(w) {
  const e = BY[w], r = rec(w);
  const st = { N: '未學', L: '正在學', K: '背會', M: '熟練' }[status(w)];
  const hist = r ? r.h.slice(-8).map(([, k]) => (k ? '✅' : '❌')).join(' ') : '—';
  $('info').innerHTML = `${e.e ? `<div class="ie">${e.e}</div>` : ''}<div class="iw">${esc(e.w)}${e.alt ? ` <small>/ ${esc(e.alt)}</small>` : ''}</div>
    <button class="say" data-say="${esc(e.w)}">🔊</button>
    <div class="id">${esc(e.en)}</div><div class="iz">${esc(e.zh)}</div>
    <div class="is">${mark(e.ex, e.w)} <button class="xsay" data-say="${esc(e.ex)}" style="border:none;background:none;font-size:18px">🔊</button></div>
    <dl><dt>級別</dt><dd>${LV[e.lv]} · ${e.pos.map(p => POS[p] || p).join('、')}${e.note ? `（${esc(e.note)}）` : ''}</dd>
    <dt>類別</dt><dd>${CATS[e.cat] || e.cat}</dd>
    <dt>狀態</dt><dd>${st}${r ? `，看過 ${r.n} 次，答對 ${r.ok} 次` : ''}</dd>
    <dt>最近</dt><dd>${hist}</dd></dl>
    <button class="close">好</button>`;
  $('info').showModal();
}

// ---------- pets ----------
function shop() {
  $('money3').textContent = S.money;
  $('shoplist').innerHTML = PETS.map(([id, e, zh, en, price]) => {
    const own = S.pets.includes(id), on = S.pet === id;
    return `<div class="sp ${own ? 'own' : ''} ${on ? 'on' : ''}"><div class="e">${e}</div><div class="n">${zh}<small>${en}</small></div>
      ${own ? `<button data-choose="${id}">${on ? '陪着我 ✓' : '選它'}</button>`
        : `<button data-buy="${id}" ${S.money < price ? 'disabled' : ''}>$${price}${S.money < price ? ` · 差 $${price - S.money}` : ''}</button>`}</div>`;
  }).join('');
  $('shop').showModal();
}
function buy(id) {
  const p = petOf(id);
  if (!p || S.pets.includes(id) || S.money < p[4]) return;
  if (!confirm(`用 $${p[4]} 換 ${p[1]} ${p[2]}？`)) return;
  S.money -= p[4]; S.pets.push(id); S.pet = id; save();
  $('money').textContent = $('money2').textContent = S.money;
  shop();
  if (!$('home').hidden) home();
}

// ---------- input ----------
function wire() {
  $('start').onclick = () => { if (S.cur) finishQuiet(); say(' '); play(); };
  $('resume').onclick = () => { say(' '); play(); };
  $('end').onclick = () => finish(false);
  $('again').onclick = play;
  $('home-btn').onclick = home;
  $('next').onclick = advance;
  $('say').onclick = () => card && say(BY[card.w].w);
  $('dunno').onclick = () => answer(null);
  $('shop-btn').onclick = $('shop-btn2').onclick = $('wallet').onclick = $('petbtn').onclick = shop;
  $('all').addEventListener('toggle', () => $('all').open && grid());
  document.querySelectorAll('[data-lv]').forEach(b => (b.onclick = () => {
    const lv = +b.dataset.lv, on = S.lv.includes(lv);
    if (on && S.lv.length === 1) return;
    S.lv = on ? S.lv.filter(x => x !== lv) : S.lv.concat(lv).sort(); save(); home();
  }));
  document.querySelectorAll('[data-new]').forEach(b => (b.onclick = () => { S.newN = +b.dataset.new; save(); home(); }));
  document.querySelectorAll('[data-acc]').forEach(b => (b.onclick = () => {
    S.acc = b.dataset.acc; save(); home();
    say(S.acc === 'US' ? 'Hi Max! This is the American voice. Tomato, water, banana.' : 'Hello Max! This is the British voice. Tomato, water, banana.');
  }));
  document.addEventListener('click', e => {
    const o = e.target.closest('.opt'); if (o && !o.disabled) return answer(o.dataset.w);
    if (e.target.closest('.zsay')) return say(BY[card.w].zh.replace(/；/g, '，'), 'zh', .9);
    if (e.target.closest('#aex .xsay')) return say(BY[card.w].ex, 'en', .9);
    const sy = e.target.closest('[data-say]'); if (sy) return say(sy.dataset.say, 'en', .9);
    const b = e.target.closest('[data-w]'); if (b && !b.classList.contains('opt')) return info(b.dataset.w);
    const buyB = e.target.closest('[data-buy]'); if (buyB) return buy(buyB.dataset.buy);
    const ch = e.target.closest('[data-choose]'); if (ch) { S.pet = ch.dataset.choose; save(); shop(); if (!$('home').hidden) home(); return; }
    const pb = e.target.closest('[data-pet]'); if (pb) { S.pet = pb.dataset.pet; save(); home(); return; }
    if (e.target.closest('dialog .close')) { $('info').open && $('info').close(); $('shop').open && $('shop').close(); }
    if (e.target === $('info')) $('info').close();
    if (e.target === $('shop')) $('shop').close();
  });
  $('export').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
    a.download = `max-english-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('import').onchange = async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (s.v !== 1 || !s.recs || !('money' in s)) throw 0;
      if (!confirm(`用這個備份取代現在的進度？（備份裏有 ${Object.keys(s.recs).length} 個單詞的記錄，$${s.money}）`)) return;
      S = s; save(); home();
    } catch (err) { alert('這不是滿滿背單詞的備份檔。'); }
  };
  $('reset').onclick = () => {
    if (!confirm('清除全部進度？單詞、錢和寵物都會清空。')) return;
    const { lv, newN, acc } = S; S = fresh(); Object.assign(S, { lv, newN, acc }); save(); home();
  };

  addEventListener('keydown', e => {
    if ($('play').hidden || $('info').open || $('shop').open || e.metaKey || e.ctrlKey || e.altKey) return;
    if (answered && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) { e.preventDefault(); return advance(); }
    const n = +e.key;
    if (!answered && n >= 1 && n <= 4 && card) { e.preventDefault(); return answer(card.opts[n - 1]); }
    if (e.key === ' ') { e.preventDefault(); card && say(BY[card.w].w); }
    else if (!answered && (e.key === 'd' || e.key === 'ArrowDown')) { e.preventDefault(); answer(null); }
  });
}

// a session left open (page closed without 結束本次) still counts when a new one starts
function finishQuiet() {
  const C = S.cur, n = Object.keys(C.seen).length;
  if (n) S.log.push({ day: C.day, sn: C.sn, n, ok: C.ok, bad: C.bad, learned: C.learned.length, earned: C.earned });
  S.cur = null; save();
}

async function init() {
  const d = await (await fetch('english/bank.json')).json();
  BANK = d.words.map(([w, lv, pos, zh, en, ex, e, cat, alt, note]) => ({ w, lv, pos, zh, en, ex, e, cat, alt, note }));
  BANK.forEach((e, i) => { e.i = i; BY[e.w] = e; });
  if (S.cur && S.cur.card && !BY[S.cur.card.w]) S.cur = null;   // the bank changed under an open session
  wire();
  home();
}
init();

// for checking the schedule from the console
window.__english = { get state() { return S; }, BY: () => BY, today, PETS };
