/* ============================================================
   Shared narrator for Max's World and the Galaxy Adventure.

   Plays pre-recorded neural-voice clips (audio/voice/<lang>/<key>.m4a,
   made by tools/make_voice.py), keyed by a hash of the exact text, and
   falls back to the device's speech engine for any text without a
   recording.
   ============================================================ */
const VOICE_DIR = 'audio/voice/';

export function textKey(str){   /* FNV-1a over UTF-8 — must match the keys in the manifest */
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(str)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export function silentWavURL(){
  const n = 2205, buf = new ArrayBuffer(44 + n*2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n*2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 22050, true); v.setUint32(28, 44100, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n*2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/* getLang(): 'en' | 'zh'; isSoundOn(): bool; onSpeaking(bool): UI + music ducking */
/* zhVoice / zhLang: which device voice reads Chinese when there is no recording
   (Cantonese by default; the Story House asks for Mandarin) */
let SILENT = null;   /* one silent clip, made once and reused by every unlock */
export function createNarrator({ getLang, isSoundOn, onSpeaking, zhVoice = /zh[-_]HK|yue/i, zhLang = 'zh-HK' }){
  const canSpeak = 'speechSynthesis' in window;
  let voiceSet = null, speaking = false, voiceText = '', curU = null;

  let listed = false;   /* the list of recordings has arrived (or failed) */
  const ready = Promise.race([
    fetch(VOICE_DIR + 'manifest.json?v=6d9d6096').then(r => r.ok ? r.json() : null)
      .then(m => { if (m) voiceSet = { en: new Set(m.en || []), zh: new Set(m.zh || []) }; }).catch(() => {}),
    new Promise(r => setTimeout(r, 2000)),
  ]).then(() => { listed = true; });
  let waiting = null;

  const setSpeaking = on => { if (speaking !== on) { speaking = on; onSpeaking(on); } };

  const voiceEl = new Audio(); voiceEl.preload = 'auto'; voiceEl.setAttribute('playsinline', '');
  voiceEl.onplaying = () => { if (voiceText) setSpeaking(true); };
  voiceEl.onended = () => { if (voiceText) { voiceText = ''; setSpeaking(false); } };
  voiceEl.onerror = () => { if (voiceText) { const t = voiceText; voiceText = ''; ttsSpeak(t); } };

  function pickVoice(){
    const vs = speechSynthesis.getVoices();
    if (getLang() === 'zh') return vs.find(v => zhVoice.test(v.lang)) || vs.find(v => /zh[-_](TW|Hant)/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang));
    return vs.find(v => /en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang));
  }
  function ttsSpeak(text){
    if (!canSpeak) return;
    const zh = getLang() === 'zh';
    /* one utterance per sentence (some voices silently stop long ones); keeps decimals like 2.5 whole */
    const parts = text.match(/[^。！？!?.]+(?:\.(?=\S)[^。！？!?.]*)*[。！？!?.]*/g) || [text];
    const v = pickVoice();
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part.trim());
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = zh ? zhLang : 'en-GB';
      u.rate = zh ? .95 : .9; u.pitch = 1.05;
      const last = i === parts.length - 1;
      if (last) curU = u;
      if (i === 0) u.onstart = () => { if (curU) setSpeaking(true); };
      if (last) u.onend = u.onerror = () => { if (curU === u) { curU = null; setSpeaking(false); } };
      speechSynthesis.speak(u);
    });
  }
  function stop(){
    waiting = null;
    curU = null; if (canSpeak) speechSynthesis.cancel();
    if (voiceText) { voiceText = ''; voiceEl.pause(); }
    setSpeaking(false);
  }
  /* force: an explicit tap on the speaker button reads even when sound is muted */
  function speak(text, force){
    if (!text || (!isSoundOn() && !force)) return;
    if (!listed) {   /* too early to know if there is a recording: wait for the list (max 2 s) rather than use the device voice */
      waiting = text; ready.then(() => { if (waiting === text) { waiting = null; speak(text, force); } });
      return;
    }
    waiting = null;
    stop();
    const key = textKey(text), lang = getLang();
    if (voiceSet && voiceSet[lang] && voiceSet[lang].has(key)) {
      voiceText = text;
      voiceEl.src = VOICE_DIR + lang + '/' + key + '.m4a';
      voiceEl.play().catch(() => { if (voiceText === text) { voiceText = ''; ttsSpeak(text); } });
      return;
    }
    ttsSpeak(text);
  }
  /* call inside a tap: iOS only lets audio start later if it was started once by the user */
  function unlock(){
    try { voiceEl.src = SILENT || (SILENT = silentWavURL()); voiceEl.play().then(() => voiceEl.pause()).catch(() => {}); } catch (e) {}
    if (!canSpeak) return;
    const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u);
    speechSynthesis.getVoices();
  }
  if (canSpeak) speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  /* safety net: if the engine goes quiet without telling us, release the ducking */
  setInterval(() => {
    const playing = voiceText && !voiceEl.paused;
    const talking = canSpeak && (speechSynthesis.speaking || speechSynthesis.pending);
    if (speaking && !playing && !talking) { curU = null; voiceText = ''; setSpeaking(false); }
  }, 1200);

  return { speak, stop, unlock, isSpeaking: () => speaking };
}
