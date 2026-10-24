/* ============================================================
   滿滿英雄基地 · Max's Hero Base

   Max's favourite superheroes as collectable story cards. The first
   series is the Ultra family from the Land of Light. Each card is read
   aloud by the shared narrator (pre-recorded clips once
   tools/make_voice.py has been run on __heroes.voiceLines(), the
   device's speech engine until then). Tap ⚡ to see the hero's special
   move. Seeing every card earns the Land of Light certificate.
   ============================================================ */
import { createNarrator, textKey } from '../narrator.js';
import { HEROES, SERIES, REL, CATEGORIES } from './data.js?v=catalog-63b';
import { drawHero } from './draw.js?v=catalog-63b';

const $ = s => document.querySelector(s);
const WORLD_KEY = 'maxworld.v1', SAVE_KEY = 'maxheroes.v1';
const readJSON = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

const world = readJSON(WORLD_KEY), save = readJSON(SAVE_KEY);
let lang = world.lang || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
let soundOn = world.sound !== false;
const seen = new Set((save.seen || []).filter(id=>HEROES.some(h=>h.id===id)));
let category='all',query='';
const savePrefs = () => { const w = readJSON(WORLD_KEY); w.lang = lang; w.sound = soundOn; writeJSON(WORLD_KEY, w); };
const saveSeen = () => { save.seen = [...seen]; writeJSON(SAVE_KEY, save); };

const UI = {
  zh: {
    title: '⚡ 滿滿英雄基地', titleSmall: "Max's Hero Base",
    intro: '滿滿最喜歡超級英雄，其中最愛的就是奧特曼（香港人也叫他們「鹹蛋超人」）！點一張卡，聽聽每位英雄的故事，再按 ⚡ 看看他的必殺技。',
    prog: (n, t) => `⭐ 已收集 ${n} / ${t}`, progDone: '🏅 看看我的證書',
    tree: '🌳 家族與夥伴關係', soon: '圖鑑中的 55 個編號已收錄；連同原有英雄，共 63 張角色與形態卡。',
    search:'找一位奧特曼', placeholder:'名字、英文名或圖鑑編號，例如：迪迦 / Zero / 28', results:(n,t)=>`顯示 ${n} / ${t} 張卡`, empty:'找不到這位英雄，試試其他名字或分類。',
    book:n=>`圖鑑 #${String(n).padStart(2,'0')}`, original:'經典英雄', unknown:'不明', variable:'可變化', source:'查看角色資料來源',
    home: '來自', height: '身高', weight: '體重', move: '必殺技', family: '家人和朋友',
    floors: n => `差不多 ${n} 層樓咁高`, tonnes: w => `${w.toLocaleString('en')} 噸`,
    moveBtn: '⚡ 必殺技', againBtn: '✨ 再變身一次',
    elder: '長輩', brother: n => `奧特兄弟 No.${n}`,
    tFamily: '一家人', tBrothers: '奧特兄弟', tFriends: '好朋友和師徒',
    tParents: '奧特之父 ❤ 奧特之母', tChild: '兒子',
    pairs: [['seven', 'leo', '師父 → 徒弟'], ['leo', 'astra', '親兄弟'], ['zoffy', 'ultraman', '帶來兩條生命'], ['seven', 'jack', '送他奧特手鐲'], ['seven','zero','爸爸 → 兒子'], ['taro','taiga','爸爸 → 兒子'], ['rosso','blu','兄弟'], ['blu','grigio','哥哥 → 妹妹'], ['taiga','fuma','三人小隊'], ['ginga','victory','合體夥伴'], ['cosmos','justice','合體成雷傑多'], ['nexus','noa','同一道光的不同形態']],
    certT: '光之國勇士證書', certB: n => `恭喜 滿滿！你已經認識了光之國的全部 ${n} 張角色與形態卡，正式成為光之國的小勇士！`,
    certSig: '宇宙警備隊 · 奧特之父 敬上', certOk: '好耶！',
    newCard: '收集到新卡！',
  },
  en: {
    title: "⚡ Max's Hero Base", titleSmall: '滿滿英雄基地',
    intro: "Max loves superheroes — and his very favourite is Ultraman! Tap a card to hear each hero's story, then press ⚡ to see his special move.",
    prog: (n, t) => `⭐ Collected ${n} / ${t}`, progDone: '🏅 See my certificate',
    tree: '🌳 Family & friends', soon: 'All 55 numbered guide entries are included: 63 character and form cards with the original heroes.',
    search:'Find an Ultra hero', placeholder:'Name or guide number, for example: Tiga / Zero / 28', results:(n,t)=>`Showing ${n} / ${t} cards`, empty:'No matches. Try another name or category.',
    book:n=>`Guide #${String(n).padStart(2,'0')}`, original:'Classic hero', unknown:'Unknown', variable:'Variable', source:'View character source',
    home: 'From', height: 'Height', weight: 'Weight', move: 'Special move', family: 'Family & friends',
    floors: n => `about as tall as a ${n}-storey building`, tonnes: w => `${w.toLocaleString('en')} tonnes`,
    moveBtn: '⚡ Special move', againBtn: '✨ Transform again',
    elder: 'Elder', brother: n => `Ultra Brother No.${n}`,
    tFamily: 'A family', tBrothers: 'The Ultra Brothers', tFriends: 'Friends & teachers',
    tParents: 'Father ❤ Mother of Ultra', tChild: 'son',
    pairs: [['seven', 'leo', 'teacher → student'], ['leo', 'astra', 'real brothers'], ['zoffy', 'ultraman', 'brought two lives'], ['seven', 'jack', 'gave him the bracelet'], ['seven','zero','father → son'], ['taro','taiga','father → son'], ['rosso','blu','brothers'], ['blu','grigio','brother → sister'], ['taiga','fuma','Tri-Squad'], ['ginga','victory','fusion partners'], ['cosmos','justice','unite as Legend'], ['nexus','noa','forms of the same light']],
    certT: 'Land of Light Hero Certificate', certB: n => `Well done, Max! You have met all ${n} character and form cards — you are now an official little hero of the Land of Light!`,
    certSig: 'With thanks, Father of Ultra · Space Garrison', certOk: 'Hooray!',
    newCard: 'New card collected!',
  },
};
const T = () => UI[lang];
const byId = Object.fromEntries(HEROES.map(h => [h.id, h]));

/* ---------------- sound: synthesized, no files ---------------- */
let actx = null;
function ensureAudio(){
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === 'suspended') actx.resume();
}
function tone({ f0, f1 = f0, t = .3, type = 'sine', vol = .12, at = 0 }){
  if (!actx || !soundOn) return;
  const o = actx.createOscillator(), g = actx.createGain(), s = actx.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f1, s + t);
  g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol, s + .02); g.gain.exponentialRampToValueAtTime(.001, s + t);
  o.connect(g).connect(actx.destination); o.start(s); o.stop(s + t + .05);
}
function noise({ t = .5, f0 = 400, f1 = 3000, vol = .15, at = 0 }){
  if (!actx || !soundOn) return;
  const n = actx.sampleRate * t, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource(), bp = actx.createBiquadFilter(), g = actx.createGain(), s = actx.currentTime + at;
  src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(f0, s); bp.frequency.exponentialRampToValueAtTime(f1, s + t);
  g.gain.setValueAtTime(vol, s); g.gain.exponentialRampToValueAtTime(.001, s + t);
  src.connect(bp).connect(g).connect(actx.destination); src.start(s);
}
const SFX = {
  transform(){ tone({ f0: 220, f1: 1320, t: .7, type: 'triangle', vol: .1 }); [784, 988, 1175, 1568].forEach((f, i) => tone({ f0: f, t: .45, vol: .07, at: .55 + i * .08 })); },
  beam(){ tone({ f0: 1400, f1: 900, t: 1.2, type: 'sawtooth', vol: .05 }); tone({ f0: 700, f1: 450, t: 1.2, type: 'square', vol: .035 }); noise({ t: 1.1, f0: 2500, f1: 900, vol: .09 }); },
  whoosh(){ noise({ t: .55, f0: 300, f1: 2600, vol: .2 }); noise({ t: .55, f0: 2600, f1: 300, vol: .14, at: .7 }); },
  kick(){ noise({ t: .35, f0: 300, f1: 2000, vol: .2 }); tone({ f0: 160, f1: 50, t: .3, type: 'sine', vol: .3, at: .35 }); noise({ t: .3, f0: 1500, f1: 200, vol: .2, at: .35 }); },
  heal(){ [1047, 1319, 1568, 2093, 1568, 2093].forEach((f, i) => tone({ f0: f, t: .5, vol: .06, at: i * .12 })); },
  king(){ [523, 659, 784, 1047].forEach(f => tone({ f0: f, t: 1.4, type: 'triangle', vol: .06 })); noise({ t: 1, f0: 4000, f1: 1500, vol: .05 }); },
  beep(){ [0, .25, .5, .75].forEach(at => tone({ f0: 990, t: .14, type: 'square', vol: .05, at })); },
  tap(){ tone({ f0: 880, f1: 1320, t: .12, vol: .06 }); },
  fanfare(){ [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ f0: f, t: i > 3 ? .5 : .2, type: 'triangle', vol: .09, at: i * .15 })); },
};

/* ---------------- read aloud ---------------- */
const narrator = createNarrator({ getLang: () => lang, isSoundOn: () => soundOn,
  onSpeaking: on => $('#cspeak').classList.toggle('on', on) });
const speechOf = (h, lg = lang) => h.name[lg] + (lg === 'zh' ? '。' : '. ') + h.story[lg];

/* ---------------- the base: tiles + family tree ---------------- */
const badge = h => h.catalogNo ? `<span class="no bookno" aria-label="${T().book(h.catalogNo)}">#${String(h.catalogNo).padStart(2,'0')}</span>` : h.n ? `<span class="no">${h.n}</span>` : `<span class="no elder">👑</span>`;
function tile(h){
  const b = document.createElement('button'); b.className = 'tile' + (seen.has(h.id) ? ' seen' : '');
  b.innerHTML = `<div class="fig">${drawHero(h.look)}</div>${badge(h)}<div class="nm"></div><div class="tg"></div>` +
                (seen.has(h.id) ? '<span class="ok">✓</span>' : '');
  b.querySelector('.nm').textContent = h.name[lang];
  b.querySelector('.tg').textContent = h.tag[lang];
  b.onclick = () => { ensureAudio(); narrator.unlock(); location.hash = h.id; };
  return b;
}
function mini(id, note){
  const h = byId[id], b = document.createElement('button'); b.className = 'mini';
  b.innerHTML = `<div class="fig">${drawHero(h.look)}</div><div class="nm"></div>` + (note ? '<div class="note"></div>' : '');
  b.querySelector('.nm').textContent = h.name[lang];
  if (note) b.querySelector('.note').textContent = note;
  b.onclick = () => { ensureAudio(); narrator.unlock(); location.hash = id; };
  return b;
}
function drawTree(){
  const box = $('#treebox'); box.replaceChildren();
  const group = (title, cls) => { const g = document.createElement('div'); g.className = 'tgroup ' + cls;
    const h = document.createElement('h3'); h.textContent = title; g.appendChild(h); box.appendChild(g); return g; };
  /* the family: King above, Father ❤ Mother, Taro below */
  const fam = group(T().tFamily, 'tfam');
  const r1 = document.createElement('div'); r1.className = 'trow'; r1.append(mini('king', T().elder)); fam.appendChild(r1);
  const r2 = document.createElement('div'); r2.className = 'trow couple';
  const heart = document.createElement('span'); heart.className = 'heart'; heart.textContent = '❤';
  r2.append(mini('father'), heart, mini('mother')); fam.appendChild(r2);
  const down = document.createElement('div'); down.className = 'down'; fam.appendChild(down);
  const r3 = document.createElement('div'); r3.className = 'trow'; r3.append(mini('taro', T().tChild)); fam.appendChild(r3);
  /* the nine brothers in order */
  const bro = group(T().tBrothers, 'bros');
  const r4 = document.createElement('div'); r4.className = 'trow line';
  HEROES.filter(h => h.n).sort((a, b) => a.n - b.n).forEach(h => r4.append(mini(h.id, 'No.' + h.n)));
  bro.appendChild(r4);
  /* who is linked to whom */
  const fr = group(T().tFriends, 'pairs');
  T().pairs.forEach(([a, b, note]) => {
    const p = document.createElement('div'); p.className = 'pair';
    const lab = document.createElement('span'); lab.className = 'plab'; lab.textContent = note;
    p.append(mini(a), lab, mini(b)); fr.appendChild(p);
  });
}
// Normalise the common simplified characters as well as English names.
const variants={'奥':'奧','赛':'賽','罗':'羅','盖':'蓋','亚':'亞','欧':'歐','银':'銀','维':'維','鲁':'魯','丽':'麗','风':'風','泽':'澤','诺':'諾','杰':'傑','麦':'麥','贝':'貝','尔':'爾','乔':'喬','纳':'納','凯':'凱','莱':'萊','雷':'雷','梦':'夢','优':'優','爱':'愛','达':'達','布':'布','迦':'迦'};
const searchKey=s=>s.normalize('NFKC').toLowerCase().replace(/./gu,c=>variants[c]||c).replace(/奧特曼|超人力霸王|鹹蛋超人|ultraman/g,'').replace(/[\s・·#-]/g,'');
const aliases={dyna:'戴拿 戴纳',gaia:'盖亚',agul:'阿古茹 阿古鲁',xenon:'杰诺 杰诺斯',joneus:'乔尼亚斯 乔尼奥斯',scott:'史考特 斯科特',zearth:'哉阿斯 杰阿斯',yullian:'尤莉安 尤里安',dinas:'帝纳斯 迪纳斯',omega:'奥米迦 奥美迦 欧米伽',teo:'提欧 特欧',next:'奈克斯特 奈克斯特奥特曼'};
function drawCatalog(){
  const q=searchKey(query),numeric=/^\d+$/.test(q);
  const visible=HEROES.filter(h=>(category==='all'||h.category===category)&&(!q||(numeric?h.catalogNo===Number(q):searchKey(h.name.zh+' '+h.name.en+' '+h.id+' '+(aliases[h.id]||'')).includes(q))));
  $('#grid').replaceChildren(...visible.map(tile));
  $('#result-count').textContent=T().results(visible.length,HEROES.length);
  $('#empty-results').textContent=T().empty;$('#empty-results').hidden=visible.length>0;
  $('#categories').replaceChildren(...CATEGORIES.map(c=>{
    const b=document.createElement('button');b.type='button';b.className='category';
    b.textContent=c[lang]+' '+(c.id==='all'?HEROES.length:HEROES.filter(h=>h.category===c.id).length);
    b.setAttribute('aria-pressed',String(category===c.id));
    b.onclick=()=>{category=c.id;drawCatalog();};return b;
  }));
}
$('#hero-search').addEventListener('input',e=>{query=e.target.value;drawCatalog();});
function drawBase(){
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  $('#ttl').innerHTML = `${T().title} <small>${T().titleSmall}</small>`;
  $('#intro').textContent = T().intro;
  const s = SERIES[0];
  $('#stitle').textContent = `${s.icon} ${s.t[lang]}`;
  $('#ssub').textContent = s.sub[lang];
  $('#search-label').textContent=T().search;
  $('#hero-search').placeholder=T().placeholder;
  $('#categories').setAttribute('aria-label',lang==='zh'?'英雄分類':'Hero categories');
  drawCatalog();
  const done = seen.size >= HEROES.length;
  $('#prog').textContent = done ? T().progDone : T().prog(seen.size, HEROES.length);
  $('#prog').classList.toggle('done', done);
  $('#treetitle').textContent = T().tree;
  drawTree();
  $('#soon').textContent = T().soon;
  $('#langbtn').textContent = lang === 'zh' ? 'EN' : '中文';
  $('#sndbtn').textContent = soundOn ? '🔊' : '🔇';
}

/* ---------------- the hero card ---------------- */
let cur = null, fxTimer = 0;
const order = HEROES.map(h => h.id);
function fig(pose){ $('#cfig').innerHTML = `<div class="svgwrap">${drawHero(cur.look, pose)}<div class="fxl"></div></div>`; hookTimer(); }
function hookTimer(){
  const t = $('#cfig .timer'); if (!t) return;
  t.style.cursor = 'pointer';
  t.addEventListener('click', e => { e.stopPropagation(); ensureAudio(); SFX.beep(); t.classList.remove('blink'); void t.getBBox(); t.classList.add('blink'); });
}
function openHero(id){
  const h = byId[id]; if (!h) return;
  const fresh = !seen.has(id);
  cur = h; clearTimeout(fxTimer);
  $('#card').hidden = false; document.body.style.overflow = 'hidden';
  $('#cname').textContent = h.name[lang];
  $('#cmove').textContent = T().moveBtn;
  $('#cagain').textContent = T().againBtn;
  const i = order.indexOf(id);
  $('#cpage').textContent = `${i + 1} / ${order.length}`;
  $('#cprev').disabled = i === 0; $('#cnext').disabled = i === order.length - 1;
  $('#cstage').style.setProperty('--beam', h.beam);
  transform();
  /* facts */
  const info = $('#cinfo'); info.replaceChildren();
  const facts = document.createElement('div'); facts.className = 'facts';
  const row = (ic, k, v, extra) => {
    const d = document.createElement('div'); d.className = 'fact';
    d.innerHTML = `<span class="ic">${ic}</span><span class="k"></span><span class="v"></span>` + (extra ? '<span class="x"></span>' : '');
    d.querySelector('.k').textContent = k; d.querySelector('.v').textContent = v;
    if (extra) d.querySelector('.x').textContent = extra;
    facts.appendChild(d);
  };
  const tagline = document.createElement('div'); tagline.className = 'tagline';
  tagline.textContent = (h.n ? T().brother(h.n) + ' · ' : h.catalogNo ? T().book(h.catalogNo)+' · ' : '') + h.tag[lang];
  info.append(tagline, facts);
  row('🏠', T().home, h.home[lang]);
  row('📏', T().height, h.h==null?T().unknown:h.h===0?T().variable:`${h.h} m`, h.h>0?T().floors(Math.round(h.h/3)):null);
  row('⚖️', T().weight, h.w==null?T().unknown:h.w===0?T().variable:T().tonnes(h.w));
  row('⚡', T().move, h.moveName[lang]);
  const story = document.createElement('button'); story.className = 'story';
  story.textContent = h.story[lang];
  story.onclick = () => { ensureAudio(); narrator.speak(speechOf(h), true); };
  info.appendChild(story);
  if(h.source){const source=document.createElement('a');source.className='source-link';source.href=h.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent=T().source+' ↗';info.appendChild(source);}
  if (h.family.length){
    const fh = document.createElement('h4'); fh.textContent = T().family; info.appendChild(fh);
    const fam = document.createElement('div'); fam.className = 'fam';
    h.family.forEach(([fid, rel]) => {
      const m = mini(fid, REL[rel][lang === 'zh' ? 0 : 1]);
      fam.appendChild(m);
    });
    info.appendChild(fam);
  }
  $('#cscroll').scrollTop = 0;
  narrator.speak(speechOf(h));
  if (fresh){
    seen.add(id); saveSeen();
    const n = document.createElement('div'); n.className = 'newcard'; n.textContent = '⭐ ' + T().newCard;
    $('#cstage').appendChild(n); setTimeout(() => n.remove(), 2200);
    if (seen.size === HEROES.length) setTimeout(() => { if (cur) showCert(true); }, 2600);
  }
}
function closeHero(){
  narrator.stop(); clearTimeout(fxTimer); cur = null;
  $('#card').hidden = true; document.body.style.overflow = '';
  drawBase();
}
/* entrance: a flash of light and the hero grows into view */
function transform(){
  clearTimeout(fxTimer);
  fig('stand');
  const st = $('#cstage');
  st.classList.remove('tf'); void st.offsetWidth; st.classList.add('tf');
  SFX.transform();
}

/* special moves: each kind has its own little show */
function fx(html, cls){ const l = $('#cfig .fxl'); const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; l.appendChild(d); return d; }
function special(){
  if (!cur) return;
  clearTimeout(fxTimer);
  const k = cur.move, st = $('#cstage');
  st.classList.remove('tf');
  const back = ms => { fxTimer = setTimeout(() => fig('stand'), ms); };
  if (k === 'ray' || k === 'horn' || k === 'array'){
    fig('beam'); fx('', 'beam'); SFX.beam(); back(1700);
  } else if (k === 'ring'){
    fig('beam'); fx('', 'ringfly'); SFX.whoosh(); back(1700);
  } else if (k === 'slugger'){
    fig('stand');
    $('#cfig .slug')?.classList.add('fly');
    fx('', 'beam lamp'); SFX.whoosh(); back(1800);
  } else if (k === 'kick'){
    fig('kick'); $('#cfig .svgwrap').classList.add('kicking');
    fx('💥', 'burst'); SFX.kick(); back(1300);
  } else if (k === 'heal'){
    fig('stand');
    for (let i = 0; i < 9; i++){ const d = fx(i % 3 ? '✨' : '💗', 'spark'); d.style.left = (18 + Math.random() * 64) + '%'; d.style.animationDelay = (i * .12) + 's'; }
    SFX.heal(); back(2000);
  } else if (k === 'king'){
    fig('stand'); fx('', 'rays'); fx('', 'beam gold'); SFX.king(); back(1900);
  }
}

/* ---------------- certificate ---------------- */
function showCert(celebrate){
  $('#certt').textContent = T().certT;
  $('#certb').textContent = T().certB(HEROES.length);
  $('#certsig').textContent = T().certSig;
  $('#certok').textContent = T().certOk;
  $('#certcrew').innerHTML = HEROES.map(h => `<div class="cm">${drawHero(h.look)}</div>`).join('');
  $('#cert').hidden = false;
  if (celebrate) { ensureAudio(); SFX.fanfare(); narrator.speak(T().certB(HEROES.length)); }
}
$('#certok').onclick = () => { $('#cert').hidden = true; narrator.stop(); };
$('#prog').onclick = () => { if (seen.size >= HEROES.length) showCert(false); };

/* ---------------- controls ---------------- */
let fromBase = false;
$('#grid').addEventListener('click', () => { fromBase = true; }, true);
$('#treebox').addEventListener('click', () => { fromBase = true; }, true);
$('#cclose').onclick = () => { if (fromBase) { fromBase = false; history.back(); } else { history.replaceState(null, '', location.pathname); route(); } };
const step = d => { const i = order.indexOf(cur.id) + d; if (i >= 0 && i < order.length) history.replaceState(null, '', '#' + order[i]), route(); };
$('#cprev').onclick = () => step(-1);
$('#cnext').onclick = () => step(1);
$('#cmove').onclick = () => { ensureAudio(); special(); };
$('#cagain').onclick = () => { ensureAudio(); transform(); };
$('#cstage').onclick = () => { ensureAudio(); special(); };
$('#cspeak').onclick = () => { if (narrator.isSpeaking()) narrator.stop(); else { ensureAudio(); narrator.speak(speechOf(cur), true); } };
$('#langbtn').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; savePrefs(); narrator.stop(); drawBase(); if (cur) openHero(cur.id); };
$('#sndbtn').onclick = () => { soundOn = !soundOn; savePrefs(); if (!soundOn) narrator.stop(); drawBase(); };
addEventListener('keydown', e => {
  if ($('#card').hidden) return;
  if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'Escape') $('#cclose').onclick();
  else if (e.key === ' ') { e.preventDefault(); special(); }
});
let sx = 0, sy = 0;
$('#cstage').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
$('#cstage').addEventListener('pointerup', e => {
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.abs(dx) > 60 && Math.abs(dy) < 50) step(dx < 0 ? 1 : -1);
});
function route(){
  const id = location.hash.slice(1);
  if (byId[id]) { if (cur?.id !== id) openHero(id); }
  else if (cur) closeHero();
}
addEventListener('hashchange', route);

drawBase(); route();

/* every card's spoken text, for tools/make_voice.py */
window.__heroes = {
  voiceLines: () => HEROES.flatMap(h => ['en', 'zh'].map(lg => { const text = speechOf(h, lg); return { id: 'heroes:' + h.id, lang: lg, key: textKey(text), text }; })),
};
