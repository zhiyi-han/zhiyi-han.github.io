/* ============================================================
   海盜船算一算 · Pirate Ships: Add & Subtract   (Number Land mini-game)

   Max invented a pirate friend who sails big ships and small boats to
   learn adding and taking away. The ship's sail shows a sum within 100
   (34 + 25, 67 − 23 …); the crew on deck is drawn in tens and ones so
   the numbers can be seen, and you pick the small boat that carries the
   right answer. Five ships a round, a gold coin for each; no timer, no
   typing. Sums that carry or borrow across the tens come up only now
   and then (CARRY_RATE, at most CARRY_MAX a round).
   Spoken lines come from pirateLines() so the fixed ones can be
   pre-recorded; the lines that contain the numbers use the device voice.
   ============================================================ */
import { bump } from '../progress.js?v=6d9d6096';

const tens = n => `${n} ${n === 1 ? 'ten' : 'tens'}`, ones = n => `${n} ${n === 1 ? 'one' : 'ones'}`;
const TEXT = {
  en: {
    title: 'Pirate Ships: Add & Subtract', coins: n => `🪙 ${n}/5`, again: '↺ Play again', back: '← Back to Number Land',
    intro: "I'm your Pirate Pal! Read the sum on the sail and pick the boat with the right answer!",
    qAdd: (a, b) => `There are ${a} pirates on the ship, and ${b} more come aboard. How many pirates are there now?`,
    qSub: (a, b) => `There are ${a} pirates on the ship, and ${b} go ashore. How many pirates are left?`,
    right: (a, op, b, c) => `Yes! ${a} ${op === '+' ? 'plus' : 'minus'} ${b} is ${c}! Set sail!`,
    hint: 'Almost! Try again — count the ones first, then the tens.',
    end: 'Hooray! You helped five ships set sail!',
    /* Little Yellow's step-by-step hints: ones first, then tens, then the whole answer */
    h1: ({ oa, ob, op, carry }) => op === '+'
      ? (carry ? `Ones first: ${oa} plus ${ob} is ${oa + ob}. That's ten or more! Keep ${oa + ob - 10} and carry one ten.`
               : `Ones first: ${oa} plus ${ob} is ${oa + ob}.`)
      : (carry ? `Ones first: ${oa} is too small to take away ${ob}, so borrow a ten: ${oa + 10} minus ${ob} is ${oa + 10 - ob}.`
               : `Ones first: ${oa} minus ${ob} is ${oa - ob}.`),
    h2: ({ ta, tb, op, carry, tc }) => op === '+'
      ? (carry ? `Now the tens: ${tens(ta)} plus ${tens(tb)}, plus the one we carried, is ${tens(tc)}.`
               : tb ? `Now the tens: ${tens(ta)} plus ${tens(tb)} is ${tens(tc)}.` : `The tens don't change: still ${tens(ta)}.`)
      : (carry ? `Now the tens: we borrowed one, so ${tens(ta - 1)} minus ${tens(tb)} is ${tens(tc)}.`
               : tb ? `Now the tens: ${tens(ta)} minus ${tens(tb)} is ${tens(tc)}.` : `The tens don't change: still ${tens(ta)}.`),
    h3: ({ tc, oc, c }) => `${tens(tc)} and ${ones(oc)} together make ${c}. Find the boat with ${c}!`,
  },
  zh: {
    title: '海盜船算一算', coins: n => `🪙 ${n}/5`, again: '↺ 再玩一次', back: '← 回到數字樂園',
    intro: '我是海盜好朋友！看看帆上的算式，選出答案正確的小船吧！',
    qAdd: (a, b) => `船上有${a}個海盜，又來了${b}個。現在一共有幾個海盜？`,
    qSub: (a, b) => `船上有${a}個海盜，有${b}個上岸去了。船上還剩幾個海盜？`,
    right: (a, op, b, c) => `答對了！${a}${op === '+' ? '加' : '減'}${b}等於${c}！起航啦！`,
    hint: '差一點點！再算一算，先看個位，再看十位。',
    end: '太棒了！你幫海盜們開走了五艘大船！',
    /* 小黃的提示，一步一步來：先個位，再十位，最後合起來 */
    h1: ({ oa, ob, op, carry }) => op === '+'
      ? (carry ? `先看個位：${oa}加${ob}等於${oa + ob}，滿十了！留下${oa + ob - 10}，向十位進一個十。`
               : `先看個位：${oa}加${ob}等於${oa + ob}。`)
      : (carry ? `先看個位：${oa}不夠減${ob}，向十位借一個十：${oa + 10}減${ob}等於${oa + 10 - ob}。`
               : `先看個位：${oa}減${ob}等於${oa - ob}。`),
    h2: ({ ta, tb, op, carry, tc }) => op === '+'
      ? (carry ? `再看十位：${ta}個十加${tb}個十，再加進位的一個十，是${tc}個十。`
               : tb ? `再看十位：${ta}個十加${tb}個十，是${tc}個十。` : `十位不變，還是${ta}個十。`)
      : (carry ? `再看十位：借走了一個十，剩${ta - 1}個十，減${tb}個十，是${tc}個十。`
               : tb ? `再看十位：${ta}個十減${tb}個十，是${tc}個十。` : `十位不變，還是${ta}個十。`),
    h3: ({ tc, oc, c }) => `${tc}個十和${oc}個一合起來，就是${c}。找找寫着${c}的小船！`,
  },
};

/* the fixed lines the game can say, for tools/make_voice.py
   (question and answer lines contain the numbers, so they are read by the device voice) */
export function pirateLines(lang){
  const t = TEXT[lang];
  return [t.intro, t.hint, t.end];
}

/* the pieces Little Yellow's hints talk about: tens and ones of each number and of the answer */
export function hintParts(q){
  const { a, op, b, c, carry } = q;
  return { op, carry, oa: a % 10, ob: b % 10, ta: Math.floor(a / 10), tb: Math.floor(b / 10), tc: Math.floor(c / 10), oc: c % 10, c };
}

/* ---------- questions: add and subtract within 100 ---------- */
export const CARRY_RATE = 0.25;   /* share of sums that carry / borrow across the tens */
export const CARRY_MAX = 2;       /* and never more than this many in a round of five */
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = p => Math.random() < p;

/* does a ± b cross the tens? */
export const crosses = (a, op, b) => op === '+' ? a % 10 + b % 10 >= 10 : a % 10 < b % 10;

/* one random sum of a kid-friendly shape: two-digit ± two-digit, two-digit ± one-digit, or whole tens */
function draw(op){
  const shape = Math.random();
  let a, b;
  if (shape < .15) {                      /* whole tens: 30 + 40, 70 − 20 */
    a = ri(1, 9) * 10; b = ri(1, 9) * 10;
  } else if (shape < .55) {               /* two-digit and one-digit: 34 + 5, 48 − 6 */
    a = ri(10, 99); b = ri(1, 9);
  } else {                                /* two-digit and two-digit: 34 + 25, 67 − 23 */
    a = ri(10, 99); b = ri(10, 99);
  }
  if (op === '+' && a + b > 100) return null;
  if (op === '−' && b >= a) [a, b] = [b, a];
  if (op === '−' && b >= a) return null;  /* equal: nothing left, skip */
  return { a, op, b, c: op === '+' ? a + b : a - b, carry: crosses(a, op, b) };
}

/* a question that does / doesn't cross the tens, unseen this round */
export function makeQuestion(wantCarry, used = new Set()){
  const op = chance(.5) ? '+' : '−';   /* chosen once, so adding and taking away come up equally */
  for (let i = 0; i < 500; i++) {
    const q = draw(op);
    if (!q || q.carry !== wantCarry) continue;
    const key = `${q.a}${q.op}${q.b}`;
    if (used.has(key)) continue;
    used.add(key);
    return q;
  }
  return { a: 20, op: '+', b: 30, c: 50, carry: false };
}

/* four boats: the answer plus the three most tempting wrong ones */
export function makeOptions(q){
  const { a, op, b, c } = q;
  const swap = c >= 10 ? (c % 10) * 10 + Math.floor(c / 10) : null;
  const near = [c + 1, c - 1, c + 10, c - 10, c + 2, c - 2, swap, op === '+' ? a - b : a + b, a, b]
    .filter(v => v !== null && v >= 0 && v <= 100 && v !== c);
  const opts = new Set([c]);
  const pool = [...new Set(near)];
  while (opts.size < 4 && pool.length) opts.add(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  while (opts.size < 4) { const v = c + ri(-12, 12); if (v >= 0 && v <= 100) opts.add(v); }
  return [...opts].sort((x, y) => x - y);
}

/* a little pirate: round face, red bandana, eye patch */
const pirate = (cls = '') => `<svg class="pp ${cls}" viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="22" r="14" fill="#f7d3b0"/>
  <path d="M5 18 Q20 2 35 18 Z" fill="#e0453a"/><circle cx="31" cy="11" r="3" fill="#fff"/>
  <circle cx="14" cy="22" r="2.4" fill="#2b2b33"/><circle cx="26" cy="22" r="4" fill="#2b2b33"/>
  <path d="M8 19 L33 25" stroke="#2b2b33" stroke-width="1.6"/>
  <path d="M15 29 Q20 33 25 29" stroke="#a5513d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

const CSS = `
#pg{position:fixed;inset:0;z-index:70;display:none;flex-direction:column;align-items:center;font-family:inherit;color:#2b2b33;
  background:linear-gradient(#bfe8ff 0,#8fd3f7 46%,#3c9be0 46%,#2e7fc4 100%);overflow:hidden;touch-action:manipulation}
#pg .bar{width:100%;display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 6px}
#pg .bar h2{flex:1;text-align:center;font-size:20px;font-weight:900;color:#1d3d66}
#pg .rb{width:46px;height:46px;border-radius:50%;border:none;background:#fff;font-size:19px;cursor:pointer;box-shadow:0 6px 18px rgba(0,30,80,.2)}
#pg .coins{background:#fff;border-radius:999px;padding:8px 14px;font-weight:900;font-size:16px;box-shadow:0 6px 18px rgba(0,30,80,.2)}
#pg .say{z-index:3;max-width:min(92vw,600px);margin:6px 16px 0;background:#fff;border-radius:22px;padding:12px 18px 12px 78px;position:relative;
  font-size:21px;font-weight:800;line-height:1.4;box-shadow:0 8px 22px rgba(0,30,80,.18);min-height:72px;display:flex;align-items:center}
#pg .pal{position:absolute;left:8px;top:50%;transform:translateY(-50%);width:60px;height:60px;border:none;border-radius:50%;background:#fff6c4;padding:4px;cursor:pointer;
  box-shadow:0 3px 0 #e6c84a;font-family:inherit}
#pg .pal img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
#pg .pal::after{content:'💡';position:absolute;right:-6px;top:-6px;font-size:18px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}
#pg .pal:active{transform:translateY(-50%) scale(.94)}
#pg .pal.nudge{animation:nudge 1.1s ease-in-out infinite}
@keyframes nudge{50%{transform:translateY(calc(-50% - 4px))}}
#pg .sea{flex:1;width:100%;position:relative;display:flex;align-items:flex-end;justify-content:center;min-height:0}
#pg .ship{--sh:clamp(84px,17vh,136px);position:relative;width:min(90vw,560px);margin-bottom:4vh;transition:transform 1.6s cubic-bezier(.5,0,.8,.4)}
#pg .ship.sail{transform:translateX(120vw)}
#pg .mast{position:absolute;left:50%;bottom:50%;width:8px;height:calc(50% + var(--sh) + 30px);background:#8a5a35;transform:translateX(-50%);border-radius:4px}
#pg .sail{position:absolute;left:50%;bottom:calc(100% + 4px);width:84%;height:var(--sh);transform:translateX(-50%);background:#fffaf0;border-radius:10px 10px 40% 40%;
  box-shadow:inset 0 -10px 0 rgba(0,0,0,.05);display:flex;align-items:center;justify-content:center;gap:.16em;
  font-size:clamp(40px,10vw,72px);font-weight:900;color:#1d3d66;letter-spacing:.02em;font-variant-numeric:tabular-nums}
#pg .sail .op{color:#e0453a}#pg .sail .q{color:#c47d2a}
#pg .flag{position:absolute;left:50%;bottom:calc(100% + var(--sh) + 30px);width:44px;height:26px;background:#2b2b33;color:#fff;font-size:16px;
  display:flex;align-items:center;justify-content:center;border-radius:2px 8px 8px 2px}
#pg .hull{position:relative;background:linear-gradient(#a8693d,#7c4a28);border-radius:14px 14px 50% 50%/14px 14px 60% 60%;padding:12px 16px 30px;
  box-shadow:0 14px 0 rgba(0,40,90,.25)}
#pg .deck{--s:clamp(12px,3vw,17px);display:flex;gap:10px;align-items:flex-start;justify-content:center;background:#f2d8a8;border-radius:12px;padding:8px;min-height:calc(var(--s) * 2 + 32px)}
#pg .rods{display:flex;flex-direction:column;gap:2px}
#pg .rod{display:flex;gap:1px;background:#e7c48a;border-radius:6px;padding:2px 3px}
#pg .rod .pp{width:var(--s);height:var(--s);flex:none}
#pg .ones{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;background:#e7c48a;border-radius:8px;padding:4px}
#pg .seat{width:calc(var(--s) * 1.9);aspect-ratio:1;border-radius:50%;background:#dcb77a;box-shadow:inset 0 2px 4px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center}
#pg .seat .pp{width:92%;height:92%}
#pg .pp.go{filter:saturate(.2) opacity(.45)}
#pg .deck.blink .pp.go{animation:wave .5s ease-in-out 4}
@keyframes wave{50%{transform:translateY(-3px) rotate(-12deg);filter:none}}
#pg .deck.hl-ones .ones,#pg .deck.hl-rods .rods{animation:glow .7s ease-in-out 3;border-radius:8px}
@keyframes glow{50%{box-shadow:0 0 0 5px #ffd84d;background:#fff3b0}}
#pg .pp.new{animation:hop .45s ease-out both}
@keyframes hop{0%{transform:translateY(-40px) scale(.6);opacity:0}70%{transform:translateY(3px)}100%{transform:none;opacity:1}}
#pg .pp.bye{animation:bye .5s ease-in both}
@keyframes bye{to{transform:translateY(30px) scale(.4);opacity:0}}
#pg .boats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(94vw,600px);padding:0 10px calc(16px + env(safe-area-inset-bottom))}
#pg .boat{border:none;border-radius:18px 18px 40% 40%;background:linear-gradient(#ffd27a,#f0a84a);padding:14px 4px 18px;cursor:pointer;
  box-shadow:0 8px 0 #c47d2a,0 12px 18px rgba(0,30,80,.25);display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit}
#pg .boat:active{transform:translateY(4px);box-shadow:0 4px 0 #c47d2a}
#pg .boat b{font-size:clamp(34px,9vw,52px);font-weight:900;color:#5a3412;line-height:1;font-variant-numeric:tabular-nums}
#pg .boat .pp{width:22px;height:22px}
#pg .boat.no{animation:shake .45s}
@keyframes shake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
#pg .boat.used{opacity:.35;pointer-events:none}
#pg .boat.glow{animation:boatglow .8s ease-in-out infinite}
@keyframes boatglow{50%{box-shadow:0 8px 0 #c47d2a,0 0 0 6px #ffd84d,0 12px 18px rgba(0,30,80,.25)}}
#pg .done{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(10,40,90,.55);z-index:2}
#pg .done .card{background:#fff;border-radius:26px;padding:22px 26px;text-align:center;max-width:88vw}
#pg .done .big{font-size:54px}
#pg .done h3{font-size:22px;font-weight:900;margin:6px 0 14px}
#pg .done button{display:block;width:100%;margin-top:8px;border:none;border-radius:14px;padding:12px;font-family:inherit;font-size:17px;font-weight:800;cursor:pointer;
  color:#fff;background:linear-gradient(135deg,#2bb6c4,#4f7fe0)}
#pg .done button.alt{background:#eef0f5;color:#2b2b33}
@media(max-height:620px){ #pg .say{font-size:17px;min-height:60px} #pg .pal{width:48px;height:48px} #pg .ship{--sh:64px;width:min(70vw,420px);margin-bottom:3vh} #pg .deck{--s:10px} }
`;

let root = null, ctx = null, state = null;
/* every delayed step goes through later(), so closing or restarting cancels the old round's timers */
const timers = new Set();
function later(fn, ms){ const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; }
function cancelTimers(){ timers.forEach(clearTimeout); timers.clear(); }


function build(){
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  root = document.createElement('div'); root.id = 'pg';
  root.innerHTML = `
    <div class="bar"><button class="rb x" aria-label="Close">✕</button><h2></h2><div class="coins"></div><button class="rb spk" aria-label="Read aloud">🔊</button></div>
    <div class="say"><button class="pal" aria-label="小黃提示"><img src="words/xiaohuang-head.webp" alt=""></button><span class="txt"></span></div>
    <div class="sea">
      <div class="ship">
        <div class="mast"></div><div class="flag">☠</div><div class="sail"></div>
        <div class="hull"><div class="deck"></div></div>
      </div>
      <div class="done"><div class="card"><div class="big">🪙🪙🪙🪙🪙</div><h3></h3><button class="again"></button><button class="alt back"></button></div></div>
    </div>
    <div class="boats"></div>`;
  document.body.appendChild(root);
  root.querySelector('.x').onclick = close;
  root.querySelector('.back').onclick = close;
  root.querySelector('.again').onclick = () => startRound();
  root.querySelector('.spk').onclick = () => { if (state?.line) ctx.speak(state.line, true); };
  root.querySelector('.pal').onclick = giveHint;
  addEventListener('keydown', e => { if (root.style.display === 'flex' && e.key === 'Escape') close(); });
}

const T = () => TEXT[ctx.lang()];
function say(line){ if (!state) return; state.line = line; root.querySelector('.txt').textContent = line; ctx.speak(line); }

function startRound(){
  cancelTimers();
  state = { coins:0, asked:0, carries:0, line:'', busy:false, used:new Set() };
  root.querySelector('.done').style.display = 'none';
  root.querySelector('h2').textContent = T().title;
  root.querySelector('.again').textContent = T().again;
  root.querySelector('.back').textContent = T().back;
  updateCoins();
  say(T().intro);
  later(nextShip, 2600);
}
function updateCoins(){ root.querySelector('.coins').textContent = T().coins(state.coins); }

/* the crew on deck, drawn in tens (rods of ten) and ones (seats);
   the last `leaving` pirates are greyed out — they are about to go ashore;
   pirates from index `fresh` on have just hopped aboard */
function renderDeck(n, { leaving = 0, fresh = Infinity } = {}){
  const deck = root.querySelector('.deck'); deck.innerHTML = '';
  const tens = Math.floor(n / 10), ones = n % 10, all = [];
  const rods = document.createElement('div'); rods.className = 'rods';
  for (let r = 0; r < tens; r++) {
    const rod = document.createElement('div'); rod.className = 'rod';
    for (let i = 0; i < 10; i++) { rod.insertAdjacentHTML('beforeend', pirate()); all.push(rod.lastElementChild); }
    rods.appendChild(rod);
  }
  if (tens) deck.appendChild(rods);
  if (ones || !tens) {
    const seats = document.createElement('div'); seats.className = 'ones';
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div'); s.className = 'seat';
      if (i < ones) { s.innerHTML = pirate(); all.push(s.firstElementChild); }
      seats.appendChild(s);
    }
    deck.appendChild(seats);
  }
  all.forEach((p, i) => {
    if (i >= n - leaving) p.classList.add('go');
    if (i >= fresh) { p.classList.add('new'); p.style.animationDelay = `${Math.min(i - fresh, 30) * 40}ms`; }
  });
}

/* a new ship with a sum on its sail and four boats to choose from */
function nextShip(){
  if (!root || root.style.display !== 'flex') return;
  if (state.asked >= 5) return finish();
  state.asked++; state.busy = false; state.hints = 0;
  const wantCarry = state.carries < CARRY_MAX && Math.random() < CARRY_RATE;
  const q = makeQuestion(wantCarry, state.used);
  if (q.carry) state.carries++;
  state.q = q;
  root.querySelector('.ship').classList.remove('sail');
  root.querySelector('.pal').classList.remove('nudge');
  root.querySelector('.sail').innerHTML = `<span>${q.a}</span><span class="op">${q.op}</span><span>${q.b}</span><span class="op">=</span><span class="q">?</span>`;
  renderDeck(q.a, { leaving: q.op === '−' ? q.b : 0 });
  const boats = root.querySelector('.boats'); boats.innerHTML = '';
  makeOptions(q).forEach(k => {
    const b = document.createElement('button'); b.className = 'boat';
    b.innerHTML = `<b>${k}</b>${pirate()}`;
    b.onclick = () => pick(k, b);
    boats.appendChild(b);
  });
  say(q.op === '+' ? T().qAdd(q.a, q.b) : T().qSub(q.a, q.b));
}

function pick(k, btn){
  if (!state || state.busy) return;
  const q = state.q;
  if (k !== q.c) {
    btn.classList.remove('no'); void btn.offsetWidth; btn.classList.add('no'); btn.classList.add('used');
    ctx.sfx.miss();
    const deck = root.querySelector('.deck'); deck.classList.remove('blink'); void deck.offsetWidth; deck.classList.add('blink');
    say(T().hint);
    root.querySelector('.pal').classList.add('nudge');   /* Little Yellow offers help */
    return;
  }
  state.busy = true;
  root.querySelectorAll('.boat').forEach(b => { if (b !== btn) b.classList.add('used'); });
  let wait;
  if (q.op === '+') {               /* the new crew hops aboard, regrouped into tens and ones */
    renderDeck(q.c, { fresh: q.a });
    const hops = Math.min(q.b, 30);
    for (let i = 0; i < hops; i++) later(() => { if (state) ctx.sfx.hop(i % 10); }, 40 * i);
    wait = 40 * hops + 500;
  } else {                          /* the greyed-out pirates go ashore, then the deck is tidied */
    root.querySelectorAll('.pp.go').forEach((p, i) => { p.style.animationDelay = `${Math.min(i, 30) * 25}ms`; p.classList.add('bye'); });
    for (let i = 0; i < Math.min(q.b, 10); i++) later(() => { if (state) ctx.sfx.hop(9 - i); }, 60 * i);
    wait = Math.min(q.b, 30) * 25 + 700;
    later(() => { if (state) renderDeck(q.c); }, wait - 150);
  }
  later(() => {
    if (!state) return;   /* closed meanwhile */
    state.coins++; updateCoins(); ctx.sfx.win();
    say(T().right(q.a, q.op, q.b, q.c));
    root.querySelector('.ship').classList.add('sail');
    later(nextShip, 4200);
  }, wait);
}

/* tapping Little Yellow: one hint per tap — ones, then tens, then the whole answer (and the right boat glows) */
function giveHint(){
  if (!state || !state.q || state.busy) return;
  const step = state.hints = Math.min(state.hints + 1, 3);
  const h = hintParts(state.q), t = T();
  const deck = root.querySelector('.deck'), pal = root.querySelector('.pal');
  pal.classList.remove('nudge');
  deck.classList.remove('hl-ones', 'hl-rods'); void deck.offsetWidth;
  if (step === 1) { deck.classList.add('hl-ones'); say(t.h1(h)); }
  else if (step === 2) { deck.classList.add('hl-rods'); say(t.h2(h)); }
  else {
    root.querySelectorAll('.boat').forEach(b => b.classList.toggle('glow', +b.querySelector('b').textContent === state.q.c));
    say(t.h3(h));
  }
}

function finish(){
  bump('pirates', 'rounds');   /* for the Explorer Passport */
  root.querySelector('.boats').innerHTML = '';
  root.querySelector('.done h3').textContent = T().end;
  root.querySelector('.done').style.display = 'flex';
  ctx.sfx.win(); say(T().end);
}

export function openPirates(c){
  ctx = c; if (!root) build();
  root.style.display = 'flex';
  startRound();
}
function close(){
  cancelTimers();
  if (!root) return;
  root.style.display = 'none'; state = null;
  ctx?.onClose?.();
}
export const piratesOpen = () => !!root && root.style.display === 'flex';
