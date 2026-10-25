/* ============================================================
   分洪小工程師 · Flood Fixers   (Builder's Corner mini-game)

   After seeing news of floods, Max asked how people stop them, then built
   a LEGO river, houses and a diversion channel. Here the river runs down
   the left; heavy rain will burst its bank at the crack. Tap grass to dig a
   channel from the crack to the reservoir, then make it rain: if the
   channel connects, the water fills the reservoir and the houses stay dry;
   if not, it spills toward the houses and you can dig some more.
   Three levels, no timer. Spoken lines come from floodLines().
   ============================================================ */
import { bump } from '../progress.js?v=6d9d6096';

const TEXT = {
  en: {
    title: 'Flood Fixers', level: n => `Level ${n}/3`, rain: '🌧️ Make it rain!', reset: '↺ Start over',
    again: '↺ Play again', back: "← Back to Builder's Corner",
    intro: "Heavy rain is coming and the river will overflow! Let's dig a diversion channel to lead the extra water into the reservoir and keep the houses safe.",
    how: 'Tap the grass to dig. Dig from the crack by the river all the way to the reservoir, then press Make it rain!',
    rocks: "Rocks can't be dug — find a way around them!",
    long: 'This time the reservoir is far away. Plan your channel carefully!',
    raining: "Here comes the rain! Where will the water go?",
    win: 'It worked! The extra water flowed into the reservoir, and the houses are safe!',
    fail: 'Oh no, the water ran toward the houses! The channel must go all the way from the crack to the reservoir. Dig some more and try again.',
    end: "Amazing! Just like Max, you found a smart way to control the flood!",
  },
  zh: {
    title: '分洪小工程師', level: n => `第 ${n}/3 關`, rain: '🌧️ 下大雨', reset: '↺ 重新挖',
    again: '↺ 再玩一次', back: '← 回到小小工程師',
    intro: '大雨快來了，河水會漫出來！我們來挖一條分洪道，把多出來的水引到水庫，保護村子裏的房子。',
    how: '點一點草地就可以挖水道。從河邊的裂口一直挖到水庫，挖好了就按「下大雨」！',
    rocks: '石頭是挖不動的，要繞過去哦！',
    long: '這一次水庫比較遠，想一想水道要怎樣走。',
    raining: '下大雨啦！看看水往哪裏流？',
    win: '成功了！多出來的水都流進了水庫，房子安全啦！',
    fail: '哎呀，水流到房子那邊了！水道要從裂口一直連到水庫，再挖一挖，試一次吧。',
    end: '太厲害了！你就像滿滿一樣，想到了治水的好辦法！',
  },
};
export function floodLines(lang){
  const t = TEXT[lang];
  return [t.intro, t.how, t.rocks, t.long, t.raining, t.win, t.fail, t.end];
}

/* map legend: R river, C crack (the channel starts here), . grass, # rock, T tree, H house, W reservoir */
const LEVELS = [
  { tip:'how', map:[
    'R.....',
    'RC...W',
    'R.....',
    'R.....',
    'R.T...',
    'RHH...',
    'RHH..T' ] },
  { tip:'rocks', map:[
    'R.....',
    'R..T..',
    'RC.#..',
    'R..#..',
    'R....W',
    'RHH...',
    'RHH.T.' ] },
  { tip:'long', map:[
    'R..T..',
    'RC.#..',
    'R..#.T',
    'R..#..',
    'R.....',
    'RHH.#.',
    'RHH.TW' ] },
];

const CSS = `
#fg{position:fixed;inset:0;z-index:70;display:none;flex-direction:column;align-items:center;font-family:inherit;color:#2b2b33;
  background:linear-gradient(#cfe9ff,#e9f6ff 40%,#d9f0c8);overflow:hidden;touch-action:manipulation}
#fg.rainy{background:linear-gradient(#8fa6bf,#b9c8d6 40%,#c9dcb8)}
#fg .bar{width:100%;display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 6px}
#fg .bar h2{flex:1;text-align:center;font-size:20px;font-weight:900;color:#3b2a66}
#fg .rb{width:46px;height:46px;border-radius:50%;border:none;background:#fff;font-size:19px;cursor:pointer;box-shadow:0 6px 18px rgba(0,30,80,.2)}
#fg .lv{background:#fff;border-radius:999px;padding:8px 14px;font-weight:900;font-size:15px;box-shadow:0 6px 18px rgba(0,30,80,.2)}
#fg .say{z-index:3;max-width:min(92vw,560px);margin:4px 16px 8px;background:#fff;border-radius:20px;padding:11px 16px;font-size:16.5px;font-weight:800;
  line-height:1.45;box-shadow:0 8px 22px rgba(0,30,80,.16);min-height:52px}
#fg .board{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;width:100%;padding:0 12px}
#fg .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;width:min(92vw,58vh,460px);background:#7cbf5e;padding:6px;border-radius:18px;
  box-shadow:0 10px 0 #5a9a44,0 16px 26px rgba(0,40,20,.25)}
#fg .c{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:clamp(18px,5vw,30px);position:relative;
  background:#94d272;cursor:pointer;transition:background .25s,transform .1s;user-select:none}
#fg .c.grass:active{transform:scale(.92)}
#fg .c.dug{background:#b98552;box-shadow:inset 0 3px 8px rgba(70,40,10,.45)}
#fg .c.river{background:#3b9be0;cursor:default;background-image:repeating-linear-gradient(180deg,rgba(255,255,255,.18) 0 6px,transparent 6px 14px);
  background-size:100% 28px;animation:flow 1.2s linear infinite}
@keyframes flow{to{background-position:0 28px}}
#fg .c.crack{background:#b98552;box-shadow:inset 0 0 0 3px #ff8a3d}
#fg .c.crack:after{content:'⚠️';position:absolute;top:-10px;right:-6px;font-size:16px}
#fg .c.rock,#fg .c.tree,#fg .c.house{cursor:default}
#fg .c.res{background:#bfe6ff;box-shadow:inset 0 0 0 3px #3b9be0;cursor:default;font-size:clamp(11px,2.8vw,15px);font-weight:900;color:#1d5f99;flex-direction:column;line-height:1.1}
#fg .c.water{background:#4aa8ea !important;box-shadow:inset 0 0 12px rgba(255,255,255,.55);animation:fill .35s ease-out}
@keyframes fill{from{transform:scale(.6);opacity:.4}}
#fg .c.res.full{background:#3b9be0;color:#fff}
#fg .c.house.wet{background:#4aa8ea}
#fg .c.house.safe{animation:cheer .5s ease-in-out 3}
@keyframes cheer{50%{transform:translateY(-6px) scale(1.12)}}
#fg .acts{display:flex;gap:10px;width:min(94vw,460px);padding:10px 10px calc(16px + env(safe-area-inset-bottom))}
#fg .acts button{flex:1;border:none;border-radius:16px;padding:14px 8px;font-family:inherit;font-size:17px;font-weight:900;cursor:pointer}
#fg .go{color:#fff;background:linear-gradient(135deg,#4f7fe0,#3b9be0);box-shadow:0 6px 0 #2c62b8}
#fg .go:active{transform:translateY(3px);box-shadow:0 3px 0 #2c62b8}
#fg .rs{color:#2b2b33;background:#fff;box-shadow:0 6px 0 #c9cfdb}
#fg .acts button:disabled{opacity:.45}
#fg .drops{position:absolute;inset:0;pointer-events:none;overflow:hidden;display:none}
#fg.rainy .drops{display:block}
#fg .drops i{position:absolute;top:-20px;width:2px;height:16px;background:rgba(60,110,180,.55);border-radius:2px;animation:drop linear infinite}
@keyframes drop{to{transform:translateY(110vh)}}
#fg .done{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(20,40,80,.5);z-index:5}
#fg .done .card{background:#fff;border-radius:26px;padding:22px 26px;text-align:center;max-width:88vw}
#fg .done .big{font-size:52px} #fg .done h3{font-size:21px;font-weight:900;margin:6px 0 14px}
#fg .done button{display:block;width:100%;margin-top:8px;border:none;border-radius:14px;padding:12px;font-family:inherit;font-size:17px;font-weight:800;cursor:pointer;
  color:#fff;background:linear-gradient(135deg,#2bb6c4,#4f7fe0)}
#fg .done button.alt{background:#eef0f5;color:#2b2b33}
`;

let root = null, ctx = null, st = null;
/* every delayed step goes through later(), so closing or restarting cancels the old round's timers */
const timers = new Set();
function later(fn, ms){ const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; }
function cancelTimers(){ timers.forEach(clearTimeout); timers.clear(); }

const T = () => TEXT[ctx.lang()];
const ICON = { '#':'🪨', T:'🌳', H:'🏠' };

function build(){
  const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
  root = document.createElement('div'); root.id = 'fg';
  root.innerHTML = `<div class="drops"></div>
    <div class="bar"><button class="rb x" aria-label="Close">✕</button><h2></h2><div class="lv"></div><button class="rb spk" aria-label="Read aloud">🔊</button></div>
    <div class="say"></div>
    <div class="board"><div class="grid"></div></div>
    <div class="acts"><button class="rs"></button><button class="go"></button></div>
    <div class="done"><div class="card"><div class="big">🏠🏠💧🏞️</div><h3></h3><button class="again"></button><button class="alt back"></button></div></div>`;
  document.body.appendChild(root);
  const drops = root.querySelector('.drops');
  for (let i = 0; i < 60; i++) { const d = document.createElement('i'); d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (.5 + Math.random() * .6) + 's'; d.style.animationDelay = (-Math.random()) + 's'; drops.appendChild(d); }
  root.querySelector('.x').onclick = close;
  root.querySelector('.back').onclick = close;
  root.querySelector('.again').onclick = () => startGame();
  root.querySelector('.rs').onclick = () => { if (st && !st.busy) loadLevel(st.level, true); };
  root.querySelector('.go').onclick = rain;
  root.querySelector('.spk').onclick = () => { if (st?.line) ctx.speak(st.line, true); };
  addEventListener('keydown', e => { if (root.style.display === 'flex' && e.key === 'Escape') close(); });
}
function say(line){ if (!st) return; st.line = line; root.querySelector('.say').textContent = line; ctx.speak(line); }

function startGame(){
  cancelTimers();
  st = { level:0, busy:false, line:'' };
  root.querySelector('.done').style.display = 'none';
  root.querySelector('h2').textContent = T().title;
  root.querySelector('.rs').textContent = T().reset;
  root.querySelector('.go').textContent = T().rain;
  root.querySelector('.again').textContent = T().again;
  root.querySelector('.back').textContent = T().back;
  loadLevel(0);
  say(T().intro);
  later(() => { if (st && st.level === 0 && !st.busy) say(T()[LEVELS[0].tip]); }, 9000);
}

function loadLevel(i, keepQuiet){
  st.level = i; st.busy = false;
  root.classList.remove('rainy');
  root.querySelector('.lv').textContent = T().level(i + 1);
  root.querySelector('.go').disabled = false; root.querySelector('.rs').disabled = false;
  const map = LEVELS[i].map, grid = root.querySelector('.grid'); grid.innerHTML = '';
  st.cells = map.map((row, r) => [...row].map((ch, c) => {
    const el = document.createElement('div'); el.className = 'c';
    const cell = { r, c, ch, el, dug: ch === 'C' };
    if (ch === 'R') el.classList.add('river');
    else if (ch === 'C') el.classList.add('crack');
    else if (ch === 'W') { el.classList.add('res'); el.innerHTML = `🏞️<span>${ctx.lang() === 'zh' ? '水庫' : 'Reservoir'}</span>`; }
    else if (ICON[ch]) { el.classList.add({ '#':'rock', T:'tree', H:'house' }[ch]); el.textContent = ICON[ch]; }
    else { el.classList.add('grass'); el.onclick = () => dig(cell); }
    grid.appendChild(el);
    return cell;
  }));
  if (!keepQuiet && i > 0) say(T()[LEVELS[i].tip]);
}
function dig(cell){
  if (!st || st.busy) return;
  cell.dug = !cell.dug;
  cell.el.classList.toggle('dug', cell.dug);
  ctx.sfx.dig(cell.dug);
}

const nb = (st, cell) => [[1,0],[-1,0],[0,1],[0,-1]].map(([dr,dc]) => st.cells[cell.r + dr]?.[cell.c + dc]).filter(Boolean);

/* water follows the dug channel from the crack; it reaches the reservoir only through dug cells */
function rain(){
  if (!st || st.busy) return;
  st.busy = true; root.querySelector('.go').disabled = true; root.querySelector('.rs').disabled = true;
  root.classList.add('rainy'); say(T().raining); ctx.sfx.rain();
  const start = st.cells.flat().find(c => c.ch === 'C');
  const seen = new Set([start]), order = [start], q = [start];
  let won = false;
  while (q.length) {
    const cur = q.shift();
    for (const n of nb(st, cur)) {
      if (seen.has(n)) continue;
      if (n.ch === 'W') { won = true; continue; }
      if (n.dug) { seen.add(n); order.push(n); q.push(n); }
    }
  }
  let t = 1600;
  order.forEach(c => { later(() => { if (st) c.el.classList.add('water'); }, t); t += 180; });
  if (won) {
    later(() => {
      if (!st) return;
      st.cells.flat().find(c => c.ch === 'W').el.classList.add('full');
      st.cells.flat().filter(c => c.ch === 'H').forEach(c => c.el.classList.add('safe'));
      ctx.sfx.win(); say(T().win);
      later(() => {
        if (!st) return;
        if (st.level < LEVELS.length - 1) loadLevel(st.level + 1);
        else finish();
      }, 6500);
    }, t + 300);
  } else {
    /* the overflow spreads over the grass toward the nearest house */
    later(() => {
      if (!st) return;
      const from = order, seen2 = new Set(from), q2 = [...from], prev = new Map();
      let house = null;
      while (q2.length && !house) {
        const cur = q2.shift();
        for (const n of nb(st, cur)) {
          if (seen2.has(n) || n.ch === 'R' || n.ch === '#' || n.ch === 'T' || n.ch === 'W') continue;
          seen2.add(n); prev.set(n, cur);
          if (n.ch === 'H') { house = n; break; }
          q2.push(n);
        }
      }
      const path = []; for (let c = house; c && !from.includes(c); c = prev.get(c)) path.unshift(c);
      let t2 = 0;
      path.forEach(c => { later(() => { if (!st) return; c.el.classList.add(c.ch === 'H' ? 'wet' : 'water'); }, t2); t2 += 160; });
      later(() => {
        if (!st) return;
        ctx.sfx.miss(); say(T().fail);
        later(() => {   /* dry off, keep what was dug */
          if (!st) return;
          root.classList.remove('rainy');
          st.cells.flat().forEach(c => c.el.classList.remove('water', 'wet'));
          st.busy = false; root.querySelector('.go').disabled = false; root.querySelector('.rs').disabled = false;
        }, 3500);
      }, t2 + 200);
    }, t + 200);
  }
}

function finish(){
  bump('flood', 'cleared');   /* for the Explorer Passport */
  root.classList.remove('rainy');
  root.querySelector('.done h3').textContent = T().end;
  root.querySelector('.done').style.display = 'flex';
  ctx.sfx.win(); say(T().end);
}

export function openFlood(c){
  ctx = c; if (!root) build();
  root.style.display = 'flex';
  startGame();
}
function close(){
  cancelTimers();
  if (!root) return;
  root.style.display = 'none'; root.classList.remove('rainy'); st = null;
  ctx?.onClose?.();
}
export const floodOpen = () => !!root && root.style.display === 'flex';
