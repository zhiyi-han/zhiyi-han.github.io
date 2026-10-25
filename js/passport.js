/* ============================================================
   Max 的探險護照 · Max's Explorer Passport

   One stamp for each part of the site, read from the progress each part
   already keeps on this device (nothing is sent anywhere). A stamp is
   pressed the first time its goal is met, and remembered with the date;
   all nine unlock a printable Explorer Certificate.
   ============================================================ */
import { readProgress } from './progress.js?v=6d9d6096';

const $ = s => document.querySelector(s);
const read = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
const world = read('maxworld.v1');
let lang = world.lang || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');

const count = (recs, sts) => Object.values(recs || {}).filter(r => sts.includes(r.st)).length;
const prog = readProgress();

/* [id, icon, colour, name, how to earn, value, goal, link] */
function stamps(){
  const zh = lang === 'zh';
  const W = world.visited || [], zones = world.zones || 8;
  const stories = Object.values(read('maxstories.v1')).filter(s => s && s.done).length;
  const planets = (read('maxgalaxy.v1').visited || []).length;
  const fp = prog.footprints || {};
  return [
    ['world', '🏝️', '#2bb6a0', zh ? 'Max 的小世界' : "Max's World", zh ? '逛遍每一個區域' : 'Visit every zone', W.length, zones, './'],
    ['stories', '📖', '#e0703a', zh ? '滿滿故事屋' : 'Story House', zh ? '讀完 5 本故事' : 'Finish 5 stories', stories, 5, 'stories.html'],
    ['galaxy', '🚀', '#6a4fd0', zh ? '銀河大冒險' : 'Galaxy', zh ? '飛到 9 個星球' : 'Visit all 9 planets', planets, 9, 'galaxy.html'],
    ['footprints', '🌍', '#3fae6a', zh ? 'Max 的足跡' : 'Footprints', zh ? '看遍每個足跡' : 'See every place', (fp.seen || []).length, fp.total || 16, 'earth.html'],
    ['pirates', '🏴‍☠️', '#d99a1e', zh ? '海盜船算一算' : 'Pirate Ships', zh ? '完成一輪 5 艘船' : 'Finish a round of 5 ships', (prog.pirates || {}).rounds || 0, 1, './?play=pirates'],
    ['flood', '🌊', '#2f8fd6', zh ? '分洪小工程師' : 'Flood Fixers', zh ? '過完 3 關' : 'Clear all 3 levels', (prog.flood || {}).cleared || 0, 1, './?play=flood'],
    ['words', '🔤', '#d9578f', zh ? '和小黃認字' : 'Chinese words', zh ? '認得 30 個字' : 'Know 30 characters', count(read('maxworld.words.v1').recs, ['K', 'M']), 30, 'words.html'],
    ['english', '🔠', '#4f7fe0', zh ? '背英文單詞' : 'English words', zh ? '背會 20 個單詞' : 'Learn 20 words', count(read('maxworld.english.v1').recs, ['K', 'M']), 20, 'english.html'],
    ['heroes', '⚡', '#e0483a', zh ? '英雄基地' : 'Hero Base', zh ? '認識 10 位英雄' : 'Meet 10 heroes', (read('maxheroes.v1').seen || []).length, 10, 'heroes.html'],
  ];
}

const UI = {
  en:{ title:"Max's Explorer Passport", intro:'Play in every corner of Max\'s World and collect all 9 stamps to earn the Explorer Certificate!',
       tally:(n, t) => `${n} / ${t} stamps`, lang:'中文', certT:'Explorer Certificate', to:'Awarded to', what:'for exploring every corner of Max\'s World: stories, space, the globe, numbers, building, words and heroes.',
       lock:n => `🔒 ${n} more stamp${n === 1 ? '' : 's'} to unlock the certificate`, print:'🖨️ Print the certificate', got:d => `Stamped ${d}`, date:d => d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) },
  zh:{ title:'Max 的探險護照', intro:'去 Max 小世界的每個角落玩一玩，集齊 9 個印章，就可以拿到探險家證書！',
       tally:(n, t) => `已集 ${n} / ${t} 個印章`, lang:'EN', certT:'探險家證書', to:'頒發給', what:'走遍了 Max 小世界的每個角落：故事、太空、地球、數字、搭建、文字和英雄。',
       lock:n => `🔒 再集 ${n} 個印章就可以打開證書`, print:'🖨️ 列印證書', got:d => `${d} 蓋章`, date:d => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` },
};
const U = () => UI[lang];

/* stamps already pressed, with the day they were earned */
const PKEY = 'maxpassport.v1';
const book = read(PKEY); book.got = book.got || {};
const fresh = new Set();
const today = (d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)(new Date());   /* local date, not UTC */

function render(){
  document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
  $('#title').textContent = U().title; $('#intro').textContent = U().intro; $('#lang').textContent = U().lang;
  const list = stamps();
  list.forEach(([id, , , , , v, goal]) => { if (v >= goal && !book.got[id]) { book.got[id] = today; fresh.add(id); } });
  try { localStorage.setItem(PKEY, JSON.stringify(book)); } catch (e) {}
  const n = list.filter(s => book.got[s[0]]).length;
  $('#tally').innerHTML = `<div>${U().tally(n, list.length)}</div><div class="bar"><i style="width:${n / list.length * 100}%"></i></div>`;
  const grid = $('#stamps'); grid.innerHTML = '';
  list.forEach(([id, icon, col, name, how, v, goal, href], i) => {
    const done = !!book.got[id];
    const a = document.createElement('a'); a.href = href; a.className = 'st' + (done ? ' done' : '') + (fresh.has(id) ? ' fresh' : '');
    a.style.setProperty('--c', col); a.style.setProperty('--r', `${[-8, 5, -3, 7, -6, 4, -5, 6, -4][i]}deg`);
    const d = done ? new Date(book.got[id] + 'T12:00:00') : null;
    a.innerHTML = `<div class="seal"><span class="ic"></span><span class="num"></span></div><b></b><small></small><div class="bar"><i style="width:${Math.min(1, v / goal) * 100}%"></i></div>`;
    a.querySelector('.ic').textContent = icon;
    a.querySelector('.num').textContent = done ? '★' : `${Math.min(v, goal)}/${goal}`;
    a.querySelector('b').textContent = name;
    a.querySelector('small').textContent = done ? U().got(U().date(d)) : how;
    grid.appendChild(a);
  });
  /* certificate */
  const all = n === list.length, cert = $('#cert');
  cert.classList.toggle('locked', !all);
  $('#ctitle').textContent = U().certT; $('#cto').textContent = U().to; $('#cwhat').textContent = U().what;
  $('#crow').textContent = list.map(s => s[1]).join(' ');
  const last = Object.values(book.got).sort().pop();
  $('#cdate').textContent = all && last ? U().date(new Date(last + 'T12:00:00')) : '';
  $('#clock').textContent = U().lock(list.length - n);
  $('#print').textContent = U().print;
  if (fresh.size) chime(fresh.size);
}

/* a little stamping sound for newly pressed stamps (needs one tap on iOS; silent otherwise) */
function chime(k){
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].slice(0, 2 + Math.min(2, k)).forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, ac.currentTime + i * .12); g.gain.linearRampToValueAtTime(.12, ac.currentTime + i * .12 + .02);
      g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + i * .12 + .35);
      o.connect(g).connect(ac.destination); o.start(ac.currentTime + i * .12); o.stop(ac.currentTime + i * .12 + .4);
    });
  } catch (e) {}
}

$('#lang').onclick = () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  try { const w = read('maxworld.v1'); w.lang = lang; localStorage.setItem('maxworld.v1', JSON.stringify(w)); } catch (e) {}
  fresh.clear(); render();
};
$('#print').onclick = () => print();
render();
