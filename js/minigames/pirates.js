/* ============================================================
   海盜船湊十 · Pirate Ships: Make Ten   (Number Land mini-game)

   Max invented a pirate friend who sails big ships and small boats to
   learn adding and taking away, and "making ten" (湊十法). Here the big
   ship has ten seats in a ten-frame; some pirates are already aboard,
   and you pick the small boat that brings exactly enough to fill it.
   Five ships a round, a gold coin for each; no timer, no typing.
   Spoken lines come from pirateLines() so they can be pre-recorded.
   ============================================================ */

const TEXT = {
  en: {
    title: 'Pirate Ships: Make Ten', coins: n => `🪙 ${n}/5`, again: '↺ Play again', back: '← Back to Number Land',
    intro: "I'm your Pirate Pal! The big ship has ten seats — let's fill it up!",
    q: n => `There ${n === 1 ? 'is 1 pirate' : `are ${n} pirates`} on the ship. How many more do we need to make ten?`,
    right: (n, m) => `Yes! ${n} plus ${m} makes ten! Set sail!`,
    hint: 'Almost! Count the empty seats on the ship.',
    end: 'Hooray! You helped five ships set sail!',
  },
  zh: {
    title: '海盜船湊十', coins: n => `🪙 ${n}/5`, again: '↺ 再玩一次', back: '← 回到數字樂園',
    intro: '我是海盜好朋友！大船有十個座位，我們一起把它坐滿吧！',
    q: n => `船上已經有${n}個海盜。還要幾個海盜上船，才能湊成十個？`,
    right: (n, m) => `答對了！${n}加${m}等於十！起航啦！`,
    hint: '差一點點！數一數，船上還有幾個空位？',
    end: '太棒了！你幫海盜們開走了五艘大船！',
  },
};

/* every line the game can say, for tools/make_voice.py */
export function pirateLines(lang){
  const t = TEXT[lang], out = [t.intro, t.hint, t.end];
  for (let n = 1; n <= 9; n++) out.push(t.q(n), t.right(n, 10 - n));
  return out;
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
#pg .say{z-index:3;max-width:min(92vw,560px);margin:6px 16px 0;background:#fff;border-radius:20px;padding:12px 16px 12px 58px;position:relative;
  font-size:18px;font-weight:800;line-height:1.45;box-shadow:0 8px 22px rgba(0,30,80,.18);min-height:56px}
#pg .say .pal{position:absolute;left:8px;top:50%;transform:translateY(-50%);width:44px;height:44px}
#pg .sea{flex:1;width:100%;position:relative;display:flex;align-items:flex-end;justify-content:center;min-height:0}
#pg .ship{position:relative;width:min(88vw,520px);margin-bottom:6vh;transition:transform 1.6s cubic-bezier(.5,0,.8,.4)}
#pg .ship.sail{transform:translateX(120vw) rotate(4deg)}
#pg .ship.bob{animation:bob 2.4s ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-6px) rotate(-1deg)}}
#pg .mast{position:absolute;left:50%;bottom:58%;width:8px;height:120%;background:#8a5a35;transform:translateX(-50%);border-radius:4px}
#pg .sail{position:absolute;left:50%;bottom:76%;width:46%;height:70%;transform:translateX(-50%);background:#fffaf0;border-radius:10px 10px 40% 40%;
  box-shadow:inset 0 -10px 0 rgba(0,0,0,.05);display:flex;align-items:center;justify-content:center;font-size:clamp(28px,7vw,46px)}
#pg .flag{position:absolute;left:50%;bottom:calc(58% + 120%);width:44px;height:26px;background:#2b2b33;color:#fff;font-size:16px;
  display:flex;align-items:center;justify-content:center;border-radius:2px 8px 8px 2px}
#pg .hull{position:relative;background:linear-gradient(#a8693d,#7c4a28);border-radius:14px 14px 50% 50%/14px 14px 60% 60%;padding:14px 18px 34px;
  box-shadow:0 14px 0 rgba(0,40,90,.25)}
#pg .frame{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;background:#f2d8a8;border-radius:12px;padding:8px}
#pg .seat{aspect-ratio:1;border-radius:50%;background:#e7c48a;box-shadow:inset 0 3px 6px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center}
#pg .seat.empty.blink{animation:blink .6s ease-in-out 4}
@keyframes blink{50%{background:#fff3b0;box-shadow:0 0 0 4px #ffd84d}}
#pg .seat .pp{width:86%;height:86%}
#pg .seat .pp.new{animation:hop .45s ease-out}
@keyframes hop{0%{transform:translateY(-60px) scale(.6);opacity:0}70%{transform:translateY(4px)}100%{transform:none;opacity:1}}
#pg .boats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(94vw,600px);padding:0 10px calc(16px + env(safe-area-inset-bottom))}
#pg .boat{border:none;border-radius:18px 18px 40% 40%;background:linear-gradient(#ffd27a,#f0a84a);padding:8px 4px 14px;cursor:pointer;
  box-shadow:0 8px 0 #c47d2a,0 12px 18px rgba(0,30,80,.25);display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit}
#pg .boat:active{transform:translateY(4px);box-shadow:0 4px 0 #c47d2a}
#pg .boat b{font-size:28px;font-weight:900;color:#5a3412;line-height:1}
#pg .boat .crew{display:flex;flex-wrap:wrap;justify-content:center;gap:1px;min-height:22px}
#pg .boat .crew .pp{width:20px;height:20px}
#pg .boat.no{animation:shake .45s}
@keyframes shake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
#pg .boat.used{opacity:.35;pointer-events:none}
#pg .done{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(10,40,90,.55);z-index:2}
#pg .done .card{background:#fff;border-radius:26px;padding:22px 26px;text-align:center;max-width:88vw}
#pg .done .big{font-size:54px}
#pg .done h3{font-size:22px;font-weight:900;margin:6px 0 14px}
#pg .done button{display:block;width:100%;margin-top:8px;border:none;border-radius:14px;padding:12px;font-family:inherit;font-size:17px;font-weight:800;cursor:pointer;
  color:#fff;background:linear-gradient(135deg,#2bb6c4,#4f7fe0)}
#pg .done button.alt{background:#eef0f5;color:#2b2b33}
@media(max-height:620px){ #pg .say{font-size:16px} #pg .ship{width:min(70vw,420px);margin-bottom:3vh} }
`;

let root = null, ctx = null, state = null;

function build(){
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  root = document.createElement('div'); root.id = 'pg';
  root.innerHTML = `
    <div class="bar"><button class="rb x" aria-label="Close">✕</button><h2></h2><div class="coins"></div><button class="rb spk" aria-label="Read aloud">🔊</button></div>
    <div class="say">${pirate('pal')}<span class="txt"></span></div>
    <div class="sea">
      <div class="ship bob">
        <div class="mast"></div><div class="flag">☠</div><div class="sail">10</div>
        <div class="hull"><div class="frame"></div></div>
      </div>
      <div class="done"><div class="card"><div class="big">🪙🪙🪙🪙🪙</div><h3></h3><button class="again"></button><button class="alt back"></button></div></div>
    </div>
    <div class="boats"></div>`;
  document.body.appendChild(root);
  root.querySelector('.x').onclick = close;
  root.querySelector('.back').onclick = close;
  root.querySelector('.again').onclick = () => startRound();
  root.querySelector('.spk').onclick = () => { if (state?.line) ctx.speak(state.line, true); };
  addEventListener('keydown', e => { if (root.style.display === 'flex' && e.key === 'Escape') close(); });
}

const T = () => TEXT[ctx.lang()];
function say(line){ if (!state) return; state.line = line; root.querySelector('.txt').textContent = line; ctx.speak(line); }

function startRound(){
  state = { coins:0, asked:0, line:'', busy:false, used:new Set() };
  root.querySelector('.done').style.display = 'none';
  root.querySelector('h2').textContent = T().title;
  root.querySelector('.again').textContent = T().again;
  root.querySelector('.back').textContent = T().back;
  updateCoins();
  say(T().intro);
  setTimeout(nextShip, 2600);
}
function updateCoins(){ root.querySelector('.coins').textContent = T().coins(state.coins); }

/* a new ship: n pirates aboard (each number used once a round), four boats to choose from */
function nextShip(){
  if (!root || root.style.display !== 'flex') return;
  if (state.asked >= 5) return finish();
  state.asked++; state.busy = false;
  let n; do { n = 1 + Math.floor(Math.random() * 9); } while (state.used.has(n)); state.used.add(n);
  state.n = n; const need = 10 - n;
  const ship = root.querySelector('.ship'); ship.classList.remove('sail'); ship.classList.add('bob');
  const frame = root.querySelector('.frame'); frame.innerHTML = '';
  for (let i = 0; i < 10; i++) { const s = document.createElement('div'); s.className = 'seat' + (i < n ? '' : ' empty'); if (i < n) s.innerHTML = pirate(); frame.appendChild(s); }
  const opts = new Set([need]);
  while (opts.size < 4) { const k = 1 + Math.floor(Math.random() * 9); if (Math.abs(k - need) <= 4) opts.add(k); }
  const boats = root.querySelector('.boats'); boats.innerHTML = '';
  [...opts].sort((a, b) => a - b).forEach(k => {
    const b = document.createElement('button'); b.className = 'boat';
    b.innerHTML = `<b>${k}</b><div class="crew">${pirate().repeat(k)}</div>`;
    b.onclick = () => pick(k, b);
    boats.appendChild(b);
  });
  say(T().q(n));
}

function pick(k, btn){
  if (!state || state.busy) return;
  const need = 10 - state.n;
  if (k !== need) {
    btn.classList.remove('no'); void btn.offsetWidth; btn.classList.add('no'); btn.classList.add('used');
    ctx.sfx.miss();
    root.querySelectorAll('.seat.empty').forEach(s => { s.classList.remove('blink'); void s.offsetWidth; s.classList.add('blink'); });
    say(T().hint);
    return;
  }
  state.busy = true;
  root.querySelectorAll('.boat').forEach(b => { if (b !== btn) b.classList.add('used'); });
  const empties = [...root.querySelectorAll('.seat.empty')];
  empties.forEach((s, i) => setTimeout(() => { if (!state) return; s.classList.remove('empty', 'blink'); s.innerHTML = pirate('new'); ctx.sfx.hop(i); }, 160 * i));
  setTimeout(() => {
    if (!state) return;   /* closed meanwhile */
    state.coins++; updateCoins(); ctx.sfx.win();
    say(T().right(state.n, need));
    const ship = root.querySelector('.ship'); ship.classList.remove('bob'); ship.classList.add('sail');
    setTimeout(nextShip, 4200);
  }, 160 * empties.length + 300);
}

function finish(){
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
  if (!root) return;
  root.style.display = 'none'; state = null;
  ctx?.onClose?.();
}
export const piratesOpen = () => !!root && root.style.display === 'flex';
