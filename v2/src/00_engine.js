/* =========================================================================
   ZTRACENÝ LIST — 00_engine.js
   Jádro hry: registry, game loop, kamera+parallax, chůze, verb coin,
   inventář, řeč, dialogy, cutscény, save/load, menu, Kronika, i18n, titulka.
   Vanilla JS + canvas 2D + WebAudio. Namespace: window.BNJ.
   ========================================================================= */
(function () {
'use strict';

const BNJ = (window.BNJ = window.BNJ || {});
const W = 1920, H = 1080, TAU = Math.PI * 2;
const PLAYER = 'jirka';
const FONT = 'Georgia, "Palatino Linotype", "Times New Roman", serif';
const SAVE_KEYS = ['bnj_save_1', 'bnj_save_2', 'bnj_save_3'];
const SAVE_AUTO = 'bnj_save_auto';

BNJ.version = '2.0.0';

/* ------------------------------------------------------------------ utils */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function nearestOnPoly(px, py, poly) {
  let bx = px, by = py, bd = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0], ay = poly[j][1], cx = poly[i][0], cy = poly[i][1];
    const vx = cx - ax, vy = cy - ay;
    const len2 = vx * vx + vy * vy || 1;
    let t = ((px - ax) * vx + (py - ay) * vy) / len2;
    t = clamp(t, 0, 1);
    const qx = ax + vx * t, qy = ay + vy * t;
    const d = (px - qx) * (px - qx) + (py - qy) * (py - qy);
    if (d < bd) { bd = d; bx = qx; by = qy; }
  }
  return [bx, by];
}

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ------------------------------------------------------------ logging */
const _warned = {};
let _lastErrT = 0;
function warnOnce(key, msg) {
  if (_warned[key]) return;
  _warned[key] = true;
  console.warn('[BNJ] ' + msg);
}
function err(msg, e) {
  const now = performance.now();
  if (now - _lastErrT > 250) {
    _lastErrT = now;
    if (e) console.error('[BNJ] ' + msg, e); else console.error('[BNJ] ' + msg);
  }
}
function safeCall(fn, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn(...args); } catch (e) { err('Chyba v uživatelské funkci', e); return undefined; }
}

/* ---------------------------------------------------------------- state */
BNJ.state = { flags: {}, inventory: [], scene: null, lang: 'cz', facts: [] };

BNJ.T = function (o) {
  if (o == null) return '';
  if (typeof o === 'string' || typeof o === 'number') return String(o);
  const v = o[BNJ.state.lang];
  return v != null ? v : (o.cz != null ? o.cz : (o.en != null ? o.en : ''));
};

function S(key) {
  const s = BNJ.strings && BNJ.strings[key];
  return s != null ? BNJ.T(s) : key;
}

/* ------------------------------------------------------------ registries */
const R = { scenes: {}, characters: {}, dialogs: {}, items: {}, hotspots: {}, combos: {} };
BNJ._registry = R;

BNJ.registerScene = function (def) {
  if (!def || !def.id) { err('registerScene: chybí id'); return; }
  if (R.scenes[def.id]) warnOnce('sc_' + def.id, 'Scéna přepsána: ' + def.id);
  if (!def.width || def.width < W) def.width = W;
  R.scenes[def.id] = def;
};
BNJ.registerCharacter = function (def) {
  if (!def || !def.id) { err('registerCharacter: chybí id'); return; }
  R.characters[def.id] = def;
};
BNJ.registerDialog = function (def) {
  if (!def || !def.id) { err('registerDialog: chybí id'); return; }
  R.dialogs[def.id] = def;
};
BNJ.registerItem = function (def) {
  if (!def || !def.id) { err('registerItem: chybí id'); return; }
  R.items[def.id] = def;
};
BNJ.registerHotspot = function (sceneId, def) {
  if (!sceneId || !def || !def.id) { err('registerHotspot: chybí sceneId/id'); return; }
  (R.hotspots[sceneId] = R.hotspots[sceneId] || []).push(def);
};
BNJ.combine = function (a, b, fn) {
  if (!a || !b || typeof fn !== 'function') { err('combine: špatné argumenty'); return; }
  R.combos[a + '|' + b] = fn;
  R.combos[b + '|' + a] = fn;
};

/* ------------------------------------------------------------ nastavení */
const SETTINGS_KEY = 'bnj2_settings';
BNJ.settings = { music: 0.8, sfx: 0.9, amb: 0.8, fx: 2, textSpeed: 1 };
try {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) Object.assign(BNJ.settings, JSON.parse(raw));
} catch (e) { /* ignore */ }
BNJ.saveSettings = function () {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(BNJ.settings)); } catch (e) { /* ignore */ }
  audio.applyVolumes();
};

/* ---------------------------------------------------------------- audio */
/* v2: master řetězec  hudba/SFX/ambient → (dry + send do konvolučního
   dozvuku) → měkký kompresor → výstup. Dozvuk = generovaná impulsní odezva
   (exponenciálně doznívající stereo šum), vlhkost se mění podle scény
   (kamenná observatoř zní jinak než otevřené náměstí). */
const audio = BNJ.audio = {
  tracks: {}, sfxFns: {}, sceneMusic: {}, ambiences: {}, sceneAmbience: {}, sceneReverb: {},
  _ac: null, _musicBus: null, _sfxBus: null, _ambBus: null, _verbSend: null, _cur: null, _amb: null,
  _pending: null, _pendingAmb: null, _unlocked: false,
  registerTrack(id, f) { this.tracks[id] = f; },
  registerSfx(id, f) { this.sfxFns[id] = f; },
  registerAmbience(id, f) { this.ambiences[id] = f; },
  _ensure() {
    if (this._ac) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const ac = this._ac = new AC();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3.5;
      comp.attack.value = 0.01; comp.release.value = 0.3;
      comp.connect(ac.destination);
      const master = this._master = ac.createGain();
      master.gain.value = 0.95;
      master.connect(comp);
      // dozvuk
      const conv = ac.createConvolver();
      conv.buffer = this._makeIR(ac, 2.8, 2.6);
      const verbOut = ac.createGain(); verbOut.gain.value = 0.55;
      const verbHp = ac.createBiquadFilter(); verbHp.type = 'highpass'; verbHp.frequency.value = 180;
      conv.connect(verbHp); verbHp.connect(verbOut); verbOut.connect(master);
      this._verbSend = ac.createGain(); this._verbSend.gain.value = 0.3;
      this._verbSend.connect(conv);
      const bus = (vol, send) => {
        const g = ac.createGain(); g.gain.value = vol;
        g.connect(master);
        const sg = ac.createGain(); sg.gain.value = send;
        g.connect(sg); sg.connect(this._verbSend);
        g._send = sg;
        return g;
      };
      this._musicBus = bus(0.8, 0.5);
      this._sfxBus = bus(0.9, 0.6);
      this._ambBus = bus(0.8, 0.35);
      this.applyVolumes();
      return true;
    } catch (e) { err('WebAudio nedostupné', e); return false; }
  },
  _makeIR(ac, dur, decay) {
    const sr = ac.sampleRate, len = Math.floor(sr * dur);
    const buf = ac.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        // časné odrazy + hustý ocas, ztmavující se s časem
        const er = (i < sr * 0.08 && Math.random() < 0.004) ? (Math.random() * 2 - 1) * 0.8 : 0;
        const n = Math.random() * 2 - 1;
        const damp = 0.25 + 0.7 * k;
        lp = lp + (n - lp) * (1 - damp);
        d[i] = (lp * 0.9 + er) * Math.pow(1 - k, decay);
      }
    }
    return buf;
  },
  applyVolumes() {
    if (!this._ac) return;
    const st = BNJ.settings, t = this._ac.currentTime;
    const set = (g, v) => { try { g.gain.setTargetAtTime(v, t, 0.08); } catch (e) { g.gain.value = v; } };
    set(this._musicBus, 0.8 * st.music);
    set(this._sfxBus, 1.0 * st.sfx);
    set(this._ambBus, 0.9 * st.amb);
  },
  setReverb(wet) {
    if (!this._ac || !this._verbSend) return;
    try { this._verbSend.gain.setTargetAtTime(clamp(wet, 0, 1), this._ac.currentTime, 0.6); } catch (e) { /* ignore */ }
  },
  unlock() {
    if (this._unlocked) { if (this._ac && this._ac.state === 'suspended') this._ac.resume(); return; }
    this._unlocked = true;
    if (!this._ensure()) return;
    if (this._ac.state === 'suspended') this._ac.resume();
    if (this._pending) { const p = this._pending; this._pending = null; this.play(p); }
    if (this._pendingAmb !== null) { const p = this._pendingAmb; this._pendingAmb = null; this.playAmbience(p); }
  },
  play(id) {
    if (!id) { this.stopMusic(); return; }
    if (!this._unlocked) { this._pending = id; return; }
    if (!this._ensure()) return;
    if (this._cur && this._cur.id === id) return;
    const f = this.tracks[id];
    if (!f) { warnOnce('trk_' + id, 'Hudební track není registrován: ' + id); return; }
    this.stopMusic();
    try {
      const g = this._ac.createGain();
      g.gain.setValueAtTime(0.0001, this._ac.currentTime);
      g.gain.linearRampToValueAtTime(1, this._ac.currentTime + 2);
      g.connect(this._musicBus);
      const handle = f(this._ac, g) || {};
      this._cur = { id, gain: g, handle };
    } catch (e) { err('Chyba tracku ' + id, e); }
  },
  _fadeKill(c, sec) {
    if (!c || !this._ac) return;
    try {
      c.gain.gain.cancelScheduledValues(this._ac.currentTime);
      c.gain.gain.setValueAtTime(c.gain.gain.value, this._ac.currentTime);
      c.gain.gain.linearRampToValueAtTime(0.0001, this._ac.currentTime + sec);
    } catch (e) { /* ignore */ }
    setTimeout(() => {
      try { c.handle && c.handle.stop && c.handle.stop(); } catch (e) { /* ignore */ }
      try { c.gain.disconnect(); } catch (e) { /* ignore */ }
    }, sec * 1000 + 200);
  },
  stopMusic() {
    const c = this._cur;
    this._cur = null;
    this._fadeKill(c, 2);
  },
  playAmbience(id) {
    if (!this._unlocked) { this._pendingAmb = id || ''; return; }
    if (!this._ensure()) return;
    if (this._amb && this._amb.id === id) return;
    const old = this._amb; this._amb = null;
    this._fadeKill(old, 2.5);
    const f = id && this.ambiences[id];
    if (!f) return;
    try {
      const g = this._ac.createGain();
      g.gain.setValueAtTime(0.0001, this._ac.currentTime);
      g.gain.linearRampToValueAtTime(1, this._ac.currentTime + 3);
      g.connect(this._ambBus);
      const handle = f(this._ac, g) || {};
      this._amb = { id, gain: g, handle };
    } catch (e) { err('Chyba ambience ' + id, e); }
  },
  playSfx(id, opts) {
    if (!this._unlocked || !this._ensure()) return;
    const f = this.sfxFns[id];
    if (!f) { warnOnce('sfx_' + id, 'SFX není registrován: ' + id); return; }
    try {
      const g = this._ac.createGain();
      let tail = g;
      if (opts && opts.pan != null && this._ac.createStereoPanner) {
        const pn = this._ac.createStereoPanner();
        pn.pan.value = clamp(opts.pan, -1, 1);
        g.connect(pn); tail = pn;
      }
      if (opts && opts.vol != null) {
        const vg = this._ac.createGain(); vg.gain.value = opts.vol;
        tail.connect(vg); tail = vg;
      }
      tail.connect(this._sfxBus);
      f(this._ac, g);
    } catch (e) { err('Chyba SFX ' + id, e); }
  }
};
BNJ.sfx = (id, opts) => audio.playSfx(id, opts);

/* --------------------------------------------------------------- G (běh) */
const G = {
  booted: false, canvas: null, ctx: null, cssScale: 1,
  mode: 'title',                       // 'title' | 'play'
  overlay: null,                       // null | 'menu' | 'save' | 'load' | 'journal'
  time: 0,
  mouse: { x: -100, y: -100, inside: false },
  ui: [],                              // klikací oblasti aktuálního frame
  sceneId: null, scene: null, camX: 0,
  player: { x: 960, y: 950, dir: 1, walking: false, tx: 0, ty: 0, speed: 240, ph: 0, onArrive: null, faceDir: 0, _bt: 2, _bv: 0 },
  hover: null, coin: null, selItem: null,
  invPin: false, invAnim: 0, invPeekT: 0, invFlash: null,
  sayQ: [], say: null,
  dlg: null, dlgGen: 0,
  cut: null, cutBar: 0,
  fader: 1, faderTarget: 1, faderCb: null,
  toasts: [], sceneNameT: 0, jScroll: 0,
  title: null, lastDef: {},
  camLock: null,
  // v2
  showHs: false, showHsT: 0, hsKey: false, hint: null, lastClick: { t: 0, x: 0, y: 0 },
  flyItems: [], hovPrev: null, setTab: 0, touch: false, iris: null
};
BNJ._G = G;   // v2: přístup pro ladicí nástroje (tools/pano.html)

/* --------------------------------------------------------------- fading */
function fadeTo(target, cb) {
  G.faderTarget = target;
  G.faderCb = cb || null;
  if (Math.abs(G.fader - target) < 0.001) {
    const f = G.faderCb; G.faderCb = null;
    if (f) f();
  }
}

function toast(text, icon) {
  G.toasts.push({ text, t: 0, icon: icon || null });
  if (G.toasts.length > 3) G.toasts.shift();
}

/* --------------------------------------------------------- item ikony */
const _iconCache = {};
function itemIcon(id) {
  if (_iconCache[id]) return _iconCache[id];
  const c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  const x = c.getContext('2d');
  const it = R.items[id];
  let ok = false;
  if (it && typeof it.drawIcon === 'function') {
    try { it.drawIcon(x); ok = true; } catch (e) { err('drawIcon ' + id, e); }
  }
  if (!ok) {
    // náhradní ikona: svinutý pergamen s voskovou pečetí
    x.clearRect(0, 0, 96, 96);
    x.save();
    x.translate(48, 48); x.rotate(-0.18);
    const g = x.createLinearGradient(-30, -34, 30, 34);
    g.addColorStop(0, '#efe3c2'); g.addColorStop(0.5, '#dcc99c'); g.addColorStop(1, '#c2a878');
    x.fillStyle = g;
    rr(x, -28, -36, 56, 72, 6); x.fill();
    x.strokeStyle = '#7a5c34'; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = '#b89868';
    x.beginPath(); x.ellipse(0, -36, 28, 7, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(0, 36, 28, 7, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(90,64,32,0.55)'; x.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      x.beginPath(); x.moveTo(-18, i * 12 - 2); x.lineTo(18, i * 12 + 1); x.stroke();
    }
    x.fillStyle = '#8a2c22';
    x.beginPath(); x.arc(14, 20, 10, 0, TAU); x.fill();
    x.fillStyle = '#a94434';
    x.beginPath(); x.arc(12, 18, 7, 0, TAU); x.fill();
    x.restore();
  }
  _iconCache[id] = c;
  return c;
}

/* --------------------------------------------------- kreslení postav */
function hashColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const pal = ['#5a6a3e', '#6a4a5e', '#3e5a6a', '#6a5a3e', '#4e3e6a', '#6a3e3e'];
  return pal[Math.abs(h) % pal.length];
}

function fallbackChar(ctx, pose, id) {
  const isJ = id === PLAYER;
  const t = pose.t || 0, ph = pose.phase || 0;
  const walking = pose.action === 'walk';
  const sw = walking ? Math.sin(ph * Math.PI * 2) : 0;
  const bob = walking ? Math.abs(Math.sin(ph * Math.PI * 2)) * 7 : Math.sin(t * 1.7) * 2.5;
  const bodyH = isJ ? 210 : 235;
  const headR = isJ ? 34 : 33;
  const coat = isJ ? '#7a5232' : hashColor(id);
  const dark = 'rgba(20,12,8,0.9)';
  ctx.save();
  ctx.scale(pose.dir || 1, 1);
  // stín
  ctx.fillStyle = 'rgba(10,14,26,0.30)';
  ctx.beginPath(); ctx.ellipse(0, -4, 58, 13, 0, 0, TAU); ctx.fill();
  // nohy + boty
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 17;
  ctx.beginPath(); ctx.moveTo(-9, -bodyH * 0.44); ctx.lineTo(-9 + sw * 26, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -bodyH * 0.44); ctx.lineTo(10 - sw * 26, -8); ctx.stroke();
  ctx.fillStyle = '#241812';
  ctx.beginPath(); ctx.ellipse(-9 + sw * 26 + 7, -6, 17, 8, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10 - sw * 26 + 7, -6, 17, 8, 0, 0, TAU); ctx.fill();
  // kabátec
  const topY = -bodyH - bob;
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(-30, topY + 26);
  ctx.quadraticCurveTo(-40, topY + bodyH * 0.55, -32, -bodyH * 0.38);
  ctx.lineTo(32, -bodyH * 0.38);
  ctx.quadraticCurveTo(40, topY + bodyH * 0.55, 30, topY + 26);
  ctx.quadraticCurveTo(0, topY + 12, -30, topY + 26);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,18,10,0.5)'; ctx.lineWidth = 3; ctx.stroke();
  // záplata + pás
  ctx.fillStyle = 'rgba(255,240,210,0.14)';
  ctx.beginPath(); ctx.ellipse(-12, -bodyH * 0.62 - bob, 9, 12, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(-31, -bodyH * 0.52 - bob, 62, 9);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(-6, -bodyH * 0.525 - bob, 12, 10);
  // paže
  ctx.strokeStyle = coat; ctx.lineWidth = 15;
  const armA = walking ? -sw * 0.7 : Math.sin(t * 1.7) * 0.06;
  const talkG = pose.action === 'talk' ? Math.sin(t * 6.5) * 0.35 : 0;
  ctx.beginPath();
  ctx.moveTo(-26, topY + 44);
  ctx.lineTo(-26 + Math.sin(armA) * 40, topY + 44 + Math.cos(armA) * 62);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(26, topY + 44);
  ctx.lineTo(26 + Math.sin(-armA + talkG) * 42, topY + 44 + Math.cos(-armA + talkG) * 62);
  ctx.stroke();
  ctx.fillStyle = '#e4b083';
  ctx.beginPath(); ctx.arc(-26 + Math.sin(armA) * 40, topY + 48 + Math.cos(armA) * 62, 8, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(26 + Math.sin(-armA + talkG) * 42, topY + 48 + Math.cos(-armA + talkG) * 62, 8, 0, TAU); ctx.fill();
  // brašna (jirka)
  if (isJ) {
    ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-24, topY + 30); ctx.lineTo(24, -bodyH * 0.52 - bob); ctx.stroke();
    ctx.fillStyle = '#5c422a';
    rr(ctx, 14, -bodyH * 0.56 - bob, 30, 24, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(20,12,8,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  }
  // šála (jirka) — vlaje
  if (isJ) {
    ctx.strokeStyle = '#a63a2e'; ctx.lineWidth = 13; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(6, topY + 16);
    ctx.quadraticCurveTo(-24, topY + 26 + Math.sin(t * 2.3) * 5, -46, topY + 44 + Math.sin(t * 2.3 + 1) * 9);
    ctx.quadraticCurveTo(-62, topY + 62 + Math.sin(t * 2.3 + 2) * 12, -70, topY + 88 + Math.sin(t * 2.3 + 3) * 12);
    ctx.stroke();
    ctx.strokeStyle = '#7c2a20'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-70, topY + 84 + Math.sin(t * 2.3 + 3) * 12); ctx.lineTo(-74, topY + 100 + Math.sin(t * 2.3 + 3.4) * 12); ctx.stroke();
  }
  // krk + hlava
  const hy = topY - headR + 14;
  ctx.fillStyle = '#e4b083';
  ctx.fillRect(-8, topY - 2, 16, 16);
  ctx.beginPath(); ctx.arc(0, hy, headR, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(120,70,40,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, hy, headR, 0, TAU); ctx.stroke();
  // vlasy / čepice
  if (isJ) {
    ctx.fillStyle = '#c9722e';
    ctx.beginPath();
    ctx.moveTo(-headR, hy - 4);
    ctx.quadraticCurveTo(-headR - 6, hy + 10, -headR + 4, hy + 14);
    ctx.quadraticCurveTo(-headR + 2, hy + 2, -headR, hy - 4);
    ctx.fill();
    ctx.fillStyle = '#7a3020';
    ctx.beginPath(); ctx.arc(0, hy - 10, headR + 3, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a3a28';
    ctx.fillRect(-headR - 3, hy - 12, (headR + 3) * 2, 8);
    ctx.fillStyle = '#e0c9a0';
    ctx.beginPath(); ctx.arc(0, hy - headR - 8, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c9722e';
    ctx.beginPath();
    ctx.moveTo(headR - 6, hy - 6); ctx.quadraticCurveTo(headR + 8, hy, headR - 2, hy + 8);
    ctx.quadraticCurveTo(headR - 8, hy + 2, headR - 6, hy - 6);
    ctx.fill();
  } else {
    ctx.fillStyle = '#3e3428';
    ctx.beginPath(); ctx.arc(0, hy - 8, headR + 2, Math.PI * 0.95, Math.PI * 0.05); ctx.closePath(); ctx.fill();
  }
  // obličej
  const blink = pose.blink || 0;
  ctx.fillStyle = dark;
  if (blink > 0.5) {
    ctx.fillRect(8, hy - 5, 10, 2.4);
    ctx.fillRect(24, hy - 5, 8, 2.4);
  } else {
    ctx.beginPath(); ctx.arc(13, hy - 5, 3.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(27, hy - 5, 3.1, 0, TAU); ctx.fill();
  }
  // nos
  ctx.strokeStyle = 'rgba(120,70,40,0.7)'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(20, hy - 1); ctx.quadraticCurveTo(25, hy + 4, 19, hy + 7); ctx.stroke();
  // ústa
  const m = pose.mouth || 0;
  ctx.fillStyle = '#7c3a2c';
  if (m > 0.12) {
    ctx.beginPath(); ctx.ellipse(19, hy + 14, 6, 3 + m * 6, 0, 0, TAU); ctx.fill();
  } else {
    ctx.strokeStyle = '#7c3a2c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(12, hy + 14); ctx.quadraticCurveTo(19, hy + 18, 26, hy + 13); ctx.stroke();
  }
  // ruměnec
  ctx.fillStyle = 'rgba(220,90,70,0.25)';
  ctx.beginPath(); ctx.ellipse(8, hy + 8, 6, 4, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

const _tintC = document.createElement('canvas');
_tintC.width = 720; _tintC.height = 700;
const _tintX = _tintC.getContext('2d');

function paintChar(ctx, id, pose) {
  const ch = R.characters[id];
  if (ch && typeof ch.draw === 'function') {
    try { ch.draw(ctx, pose); return; } catch (e) { err('Chyba draw postavy ' + id, e); }
  } else {
    warnOnce('char_' + id, 'Postava není registrována (náhradní kresba): ' + id);
  }
  fallbackChar(ctx, pose, id);
}

const _shC = document.createElement('canvas');
_shC.width = 720; _shC.height = 700;
const _shX = _shC.getContext('2d');

/* v2: postava se vždy kreslí do offscreen bufferu → nad ní tónování scény
   (lightTint), lokální světlo (oheň, svíce, okna — BNJ.fx.actorLight)
   a z její siluety vržený stín ve směru od zdroje světla. */
function drawActor(ctx, a) {
  const sc = sceneScale(a.y);
  const def = G.scene;
  const tint = def && def.lightTint;
  const ch = R.characters[a.id];
  const hh = ((ch && ch.height) || 320);
  _tintX.clearRect(0, 0, 720, 700);
  _tintX.save();
  _tintX.translate(360, 680);
  paintChar(_tintX, a.id, a.pose);
  _tintX.restore();
  if (tint) {
    _tintX.save();
    _tintX.globalCompositeOperation = 'source-atop';
    _tintX.fillStyle = tint;
    _tintX.fillRect(0, 0, 720, 700);
    _tintX.restore();
  }
  const fx = BNJ.fx;
  const L = fx && fx.actorLight ? fx.actorLight(def, a.x, a.y, hh * sc, G.camX, G.time) : null;
  const SH = fx && fx.actorShadow ? fx.actorShadow(def, a.x, a.y, G.time) : null;
  if (L || SH) {
    // silueta postavy (pro světlo i stín)
    _shX.globalCompositeOperation = 'copy';
    _shX.drawImage(_tintC, 0, 0);
    _shX.globalCompositeOperation = 'source-in';
  }
  if (L) {
    // směrové světlo: přivrácená strana jasnější, 'screen' zachová kresbu
    const sd = L.side || 0;
    const gr = _shX.createLinearGradient(360 - 160, 0, 360 + 160, 0);
    const near = (L.k * 0.95).toFixed(3), far = (L.k * 0.25).toFixed(3);
    gr.addColorStop(0, 'rgba(' + L.c + ',' + (sd < 0 ? near : sd > 0 ? far : (L.k * 0.6).toFixed(3)) + ')');
    gr.addColorStop(1, 'rgba(' + L.c + ',' + (sd > 0 ? near : sd < 0 ? far : (L.k * 0.6).toFixed(3)) + ')');
    _shX.fillStyle = gr;
    _shX.fillRect(0, 0, 720, 700);
    _tintX.save();
    _tintX.globalCompositeOperation = 'screen';
    _tintX.drawImage(_shC, 0, 0);
    _tintX.restore();
    if (SH) { _shX.globalCompositeOperation = 'copy'; _shX.drawImage(_tintC, 0, 0); _shX.globalCompositeOperation = 'source-in'; }
  }
  if (SH && SH.a > 0.01) {
    _shX.fillStyle = 'rgb(' + SH.c + ')';
    _shX.fillRect(0, 0, 720, 700);
    _shX.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.transform(1, 0, -SH.vx, -SH.vy, 0, 0);
    // měkký okraj: tři vrstvy s mírným posunem
    ctx.globalAlpha = SH.a * 0.55;
    ctx.drawImage(_shC, -360 * sc, -680 * sc, 720 * sc, 700 * sc);
    ctx.globalAlpha = SH.a * 0.3;
    ctx.drawImage(_shC, -360 * sc - 4, -680 * sc - 3, 720 * sc + 8, 700 * sc + 3);
    ctx.drawImage(_shC, -360 * sc + 4, -680 * sc + 3, 720 * sc - 8, 700 * sc - 3);
    ctx.restore();
  }
  _shX.globalCompositeOperation = 'source-over';
  ctx.drawImage(_tintC, a.x - 360 * sc, a.y - 680 * sc, 720 * sc, 700 * sc);
}

function makePose(a, action) {
  // mrkání
  a._bt = (a._bt === undefined ? 1 + Math.random() * 3 : a._bt) - _dt;
  if (a._bt < 0) { a._bv = 0.16; a._bt = 2 + Math.random() * 4; }
  a._bv = Math.max(0, (a._bv || 0) - _dt);
  const speaking = G.say && G.say.c === a.id;
  const m = speaking ? clamp(0.5 + 0.5 * Math.sin(G.time * 15) + 0.3 * Math.sin(G.time * 23.7), 0, 1) : 0;
  return {
    t: G.time,
    dir: a.dir || 1,
    action: speaking && action !== 'walk' ? 'talk' : action,
    mouth: m,
    blink: a._bv > 0 ? 1 : 0,
    phase: a.ph || 0
  };
}

/* --------------------------------------------------------- scény, kamera */
const _fallbackScenes = {};
function fallbackScene(id) {
  if (_fallbackScenes[id]) return _fallbackScenes[id];
  warnOnce('scene_' + id, 'Scéna není registrována — nouzová scéna: ' + id);
  const def = {
    id, width: W,
    name: { cz: id, en: id },
    _fallback: true,
    layers: [{
      parallax: 0,
      paint(ctx) {
        const rng = mulberry(77);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#141f3e');
        g.addColorStop(0.45, '#31355e');
        g.addColorStop(0.68, '#7a5a78');
        g.addColorStop(0.8, '#d88a5a');
        g.addColorStop(1, '#3a3f5e');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f5f0dc';
        for (let i = 0; i < 120; i++) {
          ctx.globalAlpha = 0.25 + rng() * 0.6;
          ctx.beginPath(); ctx.arc(rng() * W, rng() * 480, 0.6 + rng() * 1.4, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // linie zasněžených stromů
        ctx.fillStyle = '#1a2038';
        for (let x = -40; x < W + 40; x += 60) {
          const h2 = 60 + rng() * 90;
          ctx.beginPath();
          ctx.moveTo(x, 800); ctx.lineTo(x + 30, 800 - h2); ctx.lineTo(x + 60, 800);
          ctx.closePath(); ctx.fill();
        }
        // sníh
        const sg = ctx.createLinearGradient(0, 790, 0, H);
        sg.addColorStop(0, '#dfe9f5'); sg.addColorStop(1, '#9db4d6');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.moveTo(0, 812);
        for (let x = 0; x <= W; x += 80) ctx.lineTo(x, 800 + Math.sin(x * 0.011) * 14);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 90; i++) {
          ctx.globalAlpha = 0.2 + rng() * 0.5;
          ctx.beginPath(); ctx.arc(rng() * W, 820 + rng() * 250, 1 + rng(), 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(230,240,255,0.5)';
        ctx.font = 'italic 30px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(S('missing_scene'), W / 2, 120);
        ctx.font = '22px ' + FONT;
        ctx.fillStyle = 'rgba(230,240,255,0.32)';
        ctx.fillText('« ' + id + ' »', W / 2, 158);
        ctx.textAlign = 'left';
      }
    }],
    walkArea: [[160, 810], [1760, 810], [1760, 1050], [160, 1050]],
    exits: []
  };
  _fallbackScenes[id] = def;
  return def;
}

function prerender(def) {
  if (def._pre) return;
  def._pre = [];
  const layers = (def.layers && def.layers.length) ? def.layers : fallbackScene(def.id + '~').layers;
  for (const layer of layers) {
    const c = document.createElement('canvas');
    c.width = Math.max(W, Math.min(def.width || W, 6000));
    c.height = H;
    const x = c.getContext('2d');
    try { layer.paint && layer.paint(x); } catch (e) { err('Chyba paint vrstvy scény ' + def.id, e); }
    let wb = null;
    // v2: layer.walkBehindPaint(ctx) — kresba JEN předmětů, které stojí před
    // hráčem (průhledné okolí). Na rozdíl od polygonů walkBehind nekopíruje
    // pozadí mezi tvary, takže za řídkým předmětem nevzniká „díra".
    if (typeof layer.walkBehindPaint === 'function') {
      wb = document.createElement('canvas');
      wb.width = c.width; wb.height = H;
      try { layer.walkBehindPaint(wb.getContext('2d')); } catch (e) { err('walkBehindPaint ' + def.id, e); }
    }
    if (layer.walkBehind && layer.walkBehind.length) {
      if (!wb) { wb = document.createElement('canvas'); wb.width = c.width; wb.height = H; }
      const wx = wb.getContext('2d');
      // položka = pole bodů, nebo v2 {poly, key:'snow'} — u řídkých předmětů
      // na sněhu (rákosí, železný koš) se z masky vyklíčují sněhové pixely,
      // aby se přes hráče kreslila jen stébla/železo, ne „díra" ve tvaru masky
      for (const ent of layer.walkBehind) {
        const poly = Array.isArray(ent) ? ent : (ent && ent.poly);
        if (!poly || poly.length < 3) continue;
        const tmp = document.createElement('canvas');
        tmp.width = c.width; tmp.height = H;
        const tx = tmp.getContext('2d');
        tx.beginPath();
        tx.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) tx.lineTo(poly[i][0], poly[i][1]);
        tx.closePath();
        tx.clip();
        tx.drawImage(c, 0, 0);
        if (ent && ent.key === 'snow') {
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const q of poly) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
          x0 = clamp(Math.floor(x0), 0, c.width - 1); y0 = clamp(Math.floor(y0), 0, H - 1);
          const bw = clamp(Math.ceil(x1) - x0, 1, c.width - x0), bh = clamp(Math.ceil(y1) - y0, 1, H - y0);
          try {
            const id = tx.getImageData(x0, y0, bw, bh), d = id.data;
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i + 1], bl = d[i + 2];
              const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
              // sníh / led / modravé stíny sněhu: světlé, málo syté, modrá ≥ červená
              const snow = mn > 105 && (mx - mn) < 75 && bl >= r - 6;
              if (snow) d[i + 3] = 0;
            }
            tx.putImageData(id, x0, y0);
          } catch (e) { /* ignore */ }
        }
        wx.drawImage(tmp, 0, 0);
      }
    }
    // layer.dynamic — volitelný dynamický pass VRSTVY: kreslí se hned nad
    // její statikou (tedy POD dalšími vrstvami), ve stejném souřadném
    // prostoru jako její paint. Scénový def.dynamic se naopak kreslí nad
    // všemi vrstvami — animace za popředím (odlesky řeky…) patří sem.
    def._pre.push({ p: layer.parallax != null ? layer.parallax : 1, c, wb, dyn: layer.dynamic || null });
  }
  if (BNJ.fx && BNJ.fx.prepare) { try { BNJ.fx.prepare(def); } catch (e) { err('fx.prepare ' + def.id, e); } }
}

function sceneScale(y) {
  const def = G.scene;
  if (def && typeof def.scaleAt === 'function') {
    const v = safeCall(def.scaleAt, y);
    if (typeof v === 'number' && isFinite(v)) return clamp(v, 0.15, 2);
  }
  return clamp(0.45 + 0.55 * (y - 780) / 270, 0.3, 1.15);
}

function walkCenter(def) {
  const wa = def.walkArea;
  if (!wa || !wa.length) return [def.width / 2, 950];
  let sx = 0, sy = 0;
  for (const p of wa) { sx += p[0]; sy += p[1]; }
  return [sx / wa.length, sy / wa.length];
}

function setScene(id, spawn) {
  const def = R.scenes[id] || fallbackScene(id);
  G.sceneId = id;
  G.scene = def;
  BNJ.state.scene = id;
  prerender(def);
  def._actors = (def.actors || []).map(a => ({ id: a.id, x: a.x, y: a.y, dir: a.dir || 1, ph: 0 }));
  const sp = spawn || def.spawn || walkCenter(def);
  const p = G.player;
  p.x = sp[0]; p.y = sp[1];
  p.walking = false; p.onArrive = null; p.faceDir = 0;
  G.camX = clamp(p.x - W / 2, 0, def.width - W);
  G.hover = null; G.coin = null; G.selItem = null;
  G.sceneNameT = 3.2;
  G.hint = null;
  audio.play(audio.sceneMusic[id]);
  audio.playAmbience(audio.sceneAmbience[id] || null);
  audio.setReverb(audio.sceneReverb[id] != null ? audio.sceneReverb[id] : 0.3);
}

function gotoScene(id, spawn, cb) {
  fadeTo(1, () => {
    setScene(id, spawn);
    G.mode = 'play';
    fadeTo(0, () => { cb && cb(); });
    autosave();
  });
}
BNJ.goto = (id, spawn) => gotoScene(id, spawn);

function walkPlayerTo(x, y, cb, faceDir) {
  const p = G.player, def = G.scene;
  if (!def) { cb && cb(); return; }
  const wa = def.walkArea;
  let tx = x, ty = y;
  if (wa && wa.length > 2 && !pointInPoly(tx, ty, wa)) {
    const n = nearestOnPoly(tx, ty, wa);
    tx = n[0]; ty = n[1];
  }
  if (dist(p.x, p.y, tx, ty) < 8) {
    if (faceDir) p.dir = faceDir;
    cb && cb();
    return;
  }
  p.tx = tx; p.ty = ty; p.walking = true;
  p.onArrive = cb || null;
  p.faceDir = faceDir || 0;
}

/* ------------------------------------------------------------------ řeč */
BNJ.say = function (charId, text, then) {
  G.sayQ.push({ c: charId, t: text, then });
};

function startSay(s) {
  const txt = BNJ.T(s.t);
  s.dur = clamp(1.4 + txt.length * 0.05, 1.9, 9) * (BNJ.settings.textSpeed || 1);
  s.time = 0;
  G.say = s;
}

function endSay(skip) {
  const s = G.say;
  if (!s) return;
  G.say = null;
  if (s.then) safeCall(s.then, BNJ.state);
}

/* -------------------------------------------------------------- dialogy */
function startDialog(id, onEnd) {
  const def = R.dialogs[id];
  if (!def || !def.nodes) {
    warnOnce('dlg_' + id, 'Dialog není registrován: ' + id);
    if (onEnd) safeCall(onEnd, BNJ.state);
    return;
  }
  G.coin = null; G.selItem = null;
  G.dlg = { id, def, onEnd, gen: ++G.dlgGen, nodeKey: null, choices: null };
  enterNode('start');
}
BNJ.dialog = (id) => startDialog(id);

function enterNode(key) {
  const d = G.dlg;
  if (!d) return;
  if (key == null) { endDialog(); return; }
  const n = d.def.nodes[key];
  if (!n) { err('Dialog ' + d.id + ': chybí uzel "' + key + '"'); endDialog(); return; }
  d.nodeKey = key; d.choices = null;
  if (n.fact) BNJ.fact(n.fact);
  if (n.choices) {
    const s = BNJ.state, vis = [];
    n.choices.forEach((c, i) => {
      if (!c) return;
      if (c.once && s.flags['_once_' + d.id + '_' + key + '_' + i]) return;
      if (c.cond && !safeCall(c.cond, s)) return;
      vis.push({ c, i });
    });
    if (!vis.length) { endDialog(); return; }
    d.choices = vis.slice(0, 5);
  } else {
    const gen = d.gen;
    if (n.effect) safeCall(n.effect, BNJ.state);
    if (G.dlg !== d || d.gen !== gen) return;
    BNJ.say(n.speaker || PLAYER, n.text || { cz: '…', en: '…' }, () => {
      if (G.dlg === d && d.gen === gen) enterNode(n.next !== undefined ? n.next : null);
    });
  }
}

function chooseChoice(idx) {
  const d = G.dlg;
  if (!d || !d.choices) return;
  const v = d.choices[idx];
  if (!v) return;
  const { c, i } = v;
  if (c.once) BNJ.state.flags['_once_' + d.id + '_' + d.nodeKey + '_' + i] = true;
  d.choices = null;
  const gen = d.gen;
  BNJ.say(PLAYER, c.text, () => {
    if (G.dlg !== d || d.gen !== gen) return;
    if (c.effect) safeCall(c.effect, BNJ.state);
    if (G.dlg !== d || d.gen !== gen) return;
    enterNode(c.next !== undefined ? c.next : null);
  });
}

function endDialog() {
  const d = G.dlg;
  G.dlg = null;
  if (d && d.onEnd) safeCall(d.onEnd, BNJ.state);
  if (!G.cut && G.mode === 'play') autosave();
}

/* ------------------------------------------------------------- cutscény */
BNJ.cutscene = function (steps, onDone) {
  if (!Array.isArray(steps)) steps = [steps];
  const cs = { steps, i: 0, onDone, wait: 0, next: null };
  G.cut = cs;
  advanceCut();
};

function advanceCut() {
  const cs = G.cut;
  if (!cs) return;
  if (cs.i >= cs.steps.length) {
    G.cut = null;
    if (cs.onDone) safeCall(cs.onDone, BNJ.state);
    if (G.mode === 'play') autosave();
    return;
  }
  const st = cs.steps[cs.i++];
  const next = () => { if (G.cut === cs) advanceCut(); };
  try { runStep(st, next); } catch (e) { err('Chyba kroku cutscény', e); next(); }
}

function runStep(st, next) {
  if (st == null) { next(); return; }
  if (typeof st === 'function') {
    if (st.length >= 2) st(BNJ.state, next);
    else { st(BNJ.state); next(); }
    return;
  }
  if (typeof st === 'number') { G.cut.wait = st; G.cut.next = next; return; }
  if (st.wait != null) { G.cut.wait = st.wait; G.cut.next = next; return; }
  if (st.say) { BNJ.say(st.say[0], st.say[1], next); return; }
  if (st.dialog) { startDialog(st.dialog, next); return; }
  if (st.goto) { const g2 = Array.isArray(st.goto) ? st.goto : [st.goto]; gotoScene(g2[0], g2[1], next); return; }
  if (st.walk) { walkPlayerTo(st.walk[0], st.walk[1], next, st.face); return; }
  if (st.sfx) { BNJ.sfx(st.sfx); next(); return; }
  if (st.music) { audio.play(st.music); next(); return; }
  if (st.give) { BNJ.give(st.give); next(); return; }
  if (st.take) { BNJ.take(st.take); next(); return; }
  if (st.flag) { const f = Array.isArray(st.flag) ? st.flag : [st.flag, true]; BNJ.flag(f[0], f[1]); next(); return; }
  if (st.fact) { BNJ.fact(st.fact); next(); return; }
  if (st.fade === 'out') { fadeTo(1, next); return; }
  if (st.fade === 'in') { fadeTo(0, next); return; }
  if (st.fn) { runStep(st.fn, next); return; }
  next();
}

/* --------------------------------------------------------------- efekty */
BNJ.give = function (id) {
  const s = BNJ.state;
  if (!R.items[id]) warnOnce('item_' + id, 'Předmět není registrován: ' + id);
  if (!s.inventory.includes(id)) s.inventory.push(id);
  BNJ.sfx('sfx_pickup');
  G.invFlash = { id, t: 0 };
  G.invPeekT = 2.6;
  const p = G.player, sc = sceneScale(p.y);
  G.flyItems.push({ id, t: 0, x: p.x - G.camX, y: p.y - 200 * sc });
  const it = R.items[id];
  if (it && it.name) toast({ cz: 'Získáno: ' + BNJ.T(it.name), en: 'Got: ' + BNJ.T(it.name) }, id);
};

BNJ.take = function (id) {
  const s = BNJ.state;
  const i = s.inventory.indexOf(id);
  if (i >= 0) s.inventory.splice(i, 1);
  if (G.selItem === id) G.selItem = null;
};

BNJ.flag = function (name, val) {
  BNJ.state.flags[name] = val === undefined ? true : val;
};

BNJ.fact = function (id) {
  const s = BNJ.state;
  if (s.facts.includes(id)) return;
  s.facts.push(id);
  if (!(BNJ.strings && BNJ.strings.facts && BNJ.strings.facts[id])) {
    warnOnce('fact_' + id, 'Fakt nemá text v BNJ.strings.facts: ' + id);
  }
  toast('✒ ' + S('fact_toast'));
  BNJ.sfx('sfx_quill');
};

/* --------------------------------------------------------------- saves */
function saveTo(key) {
  try {
    const d = {
      v: 1, when: Date.now(), scene: G.sceneId,
      state: {
        flags: BNJ.state.flags, inventory: BNJ.state.inventory,
        scene: BNJ.state.scene, lang: BNJ.state.lang, facts: BNJ.state.facts
      },
      player: { x: Math.round(G.player.x), y: Math.round(G.player.y), dir: G.player.dir }
    };
    localStorage.setItem(key, JSON.stringify(d));
    return true;
  } catch (e) { err('Uložení selhalo', e); return false; }
}

function readSave(key) {
  try {
    const s = localStorage.getItem(key);
    if (!s) return null;
    const d = JSON.parse(s);
    return (d && d.scene) ? d : null;
  } catch (e) { return null; }
}

function loadFrom(key) {
  const d = readSave(key);
  if (!d) return false;
  BNJ.state = {
    flags: (d.state && d.state.flags) || {},
    inventory: (d.state && d.state.inventory) || [],
    scene: d.scene,
    lang: BNJ.state.lang,
    facts: (d.state && d.state.facts) || []
  };
  G.overlay = null; G.dlg = null; G.cut = null;
  G.sayQ = []; G.say = null; G.selItem = null; G.coin = null;
  G.mode = 'play';
  fadeTo(1, () => {
    setScene(d.scene, [d.player.x, d.player.y]);
    G.player.dir = d.player.dir || 1;
    fadeTo(0);
  });
  return true;
}

function autosave() {
  if (G.mode === 'play' && G.sceneId) saveTo(SAVE_AUTO);
}

function anySave() {
  if (readSave(SAVE_AUTO)) return SAVE_AUTO;
  let best = null, bt = 0;
  for (const k of SAVE_KEYS) {
    const d = readSave(k);
    if (d && d.when > bt) { bt = d.when; best = k; }
  }
  return best;
}

/* --------------------------------------------------- slovesa, interakce */
function pickDefault(kind) {
  const arr = BNJ.strings && BNJ.strings.defaults && BNJ.strings.defaults[kind];
  if (!arr || !arr.length) return { cz: 'Hmm…', en: 'Hmm…' };
  let i = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && i === G.lastDef[kind]) i = (i + 1) % arr.length;
  G.lastDef[kind] = i;
  return arr[i];
}

function sayDefault(kind) {
  BNJ.say(PLAYER, pickDefault(kind));
}

function walkThen(hs, cb) {
  if (hs && hs.walkTo) walkPlayerTo(hs.walkTo[0], hs.walkTo[1], cb, hs.faceDir);
  else cb();
}

function execVerb(hs, verb) {
  const s = BNJ.state;
  walkThen(hs, () => {
    if (verb === 'look') {
      const L = hs.lookAt;
      if (typeof L === 'function') safeCall(L, s);
      else if (L) BNJ.say(PLAYER, L);
      else sayDefault('look');
    } else if (verb === 'use') {
      useHotspot(hs, null);
    } else if (verb === 'talk') {
      const T2 = hs.talk;
      if (typeof T2 === 'string') startDialog(T2);
      else if (typeof T2 === 'function') safeCall(T2, s);
      else sayDefault('talk');
    }
  });
}

function useHotspot(hs, itemId) {
  const s = BNJ.state;
  const U = hs.use;
  if (itemId) {
    const arr = Array.isArray(U) ? U : (U ? [U] : []);
    const m = arr.find(u => u && typeof u === 'object' && u.item === itemId && typeof u.fn === 'function');
    if (m) { safeCall(m.fn, s, itemId); return; }
    sayDefault('use');
    return;
  }
  if (typeof U === 'function') { safeCall(U, s); return; }
  // v2: pole reakcí smí obsahovat i položku bez předmětu = holá ruka
  if (Array.isArray(U)) {
    const bare = U.find(u => u && typeof u === 'object' && !u.item && typeof u.fn === 'function');
    if (bare) { safeCall(bare.fn, s); return; }
  }
  if (U && typeof U === 'object' && !Array.isArray(U) && !U.item && typeof U.fn === 'function') { safeCall(U.fn, s); return; }
  sayDefault('use');
}

function tryCombine(a, b) {
  const fn = R.combos[a + '|' + b];
  if (fn) safeCall(fn, BNJ.state);
  else sayDefault('combine');
}

/* --------------------------------------------------------------- vstup */
let _dt = 0.016;

function uiBtn(x, y, w, h, cb, rcb) {
  G.ui.push({ x, y, w, h, cb, rcb });
  const m = G.mouse;
  return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
}

function hitUi(mx, my, right) {
  for (let i = G.ui.length - 1; i >= 0; i--) {
    const b = G.ui[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      const f = right ? b.rcb : b.cb;
      if (f) { safeCall(f); return true; }
      if (!right) return true;
      return false;
    }
  }
  return false;
}

function computeHover() {
  G.hover = null;
  if (G.mode !== 'play' || G.cut || G.dlg || G.overlay || G.coin || !G.scene) return;
  if (G.mouse.y > H - 150 && (G.invPin || G.invAnim > 0.4)) return;
  const wx = G.mouse.x + G.camX, wy = G.mouse.y;
  const list = R.hotspots[G.sceneId] || [];
  for (let i = list.length - 1; i >= 0; i--) {
    const hs = list[i];
    if (hs.hidden && safeCall(hs.hidden, BNJ.state)) continue;
    // poly smí být i funkce stavu → hotspot se může přesouvat podle flagů
    // (např. husa Markyta: na hnízdě / po goose_lured na břehu)
    const hp = typeof hs.poly === 'function' ? safeCall(hs.poly, BNJ.state) : hs.poly;
    if (hp && hp.length > 2 && pointInPoly(wx, wy, hp)) { G.hover = { type: 'hs', hs }; return; }
  }
  for (const e of (G.scene.exits || [])) {
    if (e.at && dist(wx, wy, e.at[0], e.at[1]) < 100) { G.hover = { type: 'exit', exit: e }; return; }
  }
}

function coinSlots() {
  const c = G.coin;
  const rr2 = 62;
  const ang = [-Math.PI / 2, Math.PI * 0.833, Math.PI * 0.167];
  const verbs = ['look', 'use', 'talk'];
  return verbs.map((v, i) => ({
    v,
    x: c.x + Math.cos(ang[i]) * rr2,
    y: c.y + Math.sin(ang[i]) * rr2
  }));
}

function coinClick() {
  const c = G.coin;
  if (!c) return;
  const slots = coinSlots();
  for (const sl of slots) {
    if (dist(G.mouse.x, G.mouse.y, sl.x, sl.y) < 40) {
      const hs = c.hs;
      G.coin = null;
      BNJ.sfx('sfx_ui_click');
      execVerb(hs, sl.v);
      return;
    }
  }
  // klik mimo slovesa = zavřít coin A jít na kliknuté místo (à la RtMI).
  // Jinak se hráč zasekne tam, kde hotspot překrývá celou pochozí zem
  // (např. marsh: hs_ma_ice_pool přes koridor walkArea) — každý klik jen
  // střídavě otevíral/zavíral coin a postava se nikdy nerozešla.
  G.coin = null;
  walkPlayerTo(G.mouse.x + G.camX, G.mouse.y);
}

function onClick() {
  const m = G.mouse;
  if (hitUi(m.x, m.y, false)) return;
  if (G.fader > 0.55) return;
  if (G.mode === 'title') return;
  if (G.overlay) return;
  if (G.say) { endSay(true); return; }
  if (G.cut) return;
  if (G.dlg) return;
  if (G.coin) { coinClick(); return; }
  if (!G.scene) return;

  const hover = G.hover;
  // v2: dvojklik — na exit = okamžitý přechod, na zem = běh
  const now = performance.now();
  const dbl = now - G.lastClick.t < 380 && dist(m.x, m.y, G.lastClick.x, G.lastClick.y) < 60;
  G.lastClick = { t: dbl ? 0 : now, x: m.x, y: m.y };
  if (G.selItem) {
    if (hover && hover.type === 'hs') {
      const hs = hover.hs, it = G.selItem;
      G.selItem = null;
      walkThen(hs, () => useHotspot(hs, it));
    } else {
      G.selItem = null;
    }
    return;
  }
  if (hover && hover.type === 'exit') {
    const e = hover.exit;
    if (dbl) { G.player.walking = false; G.player.onArrive = null; gotoScene(e.to, e.spawn); return; }
    walkPlayerTo(e.at[0], e.at[1], () => gotoScene(e.to, e.spawn));
    G.player.run = false;
    return;
  }
  if (hover && hover.type === 'hs') {
    G.coin = {
      x: clamp(m.x, 130, W - 130),
      y: clamp(m.y, 150, H - 190),
      hs: hover.hs, t: 0
    };
    BNJ.sfx('sfx_coin_open');
    return;
  }
  walkPlayerTo(m.x + G.camX, m.y);
  G.player.run = dbl && G.player.walking;
  G.clickFx = { x: m.x + G.camX, y: clamp(m.y, 0, H), t: 0, run: G.player.run };
}

function onRightClick() {
  const m = G.mouse;
  if (hitUi(m.x, m.y, true)) return;
  if (G.mode !== 'play' || G.overlay || G.cut || G.dlg) return;
  if (G.selItem) { G.selItem = null; return; }
  if (G.coin) { G.coin = null; return; }
  if (G.say) { endSay(true); return; }
  if (G.hover && G.hover.type === 'hs') execVerb(G.hover.hs, 'look');
}

function onKey(e) {
  const k = e.key;
  if (k === 'Escape') {
    if (G.mode === 'title') { if (G.overlay) { G.overlay = null; BNJ.saveSettings(); } return; }
    if (G.overlay === 'save' || G.overlay === 'load' || G.overlay === 'settings') { if (G.overlay === 'settings') BNJ.saveSettings(); G.overlay = 'menu'; return; }
    if (G.overlay) { G.overlay = null; return; }
    if (G.coin) { G.coin = null; return; }
    if (G.selItem) { G.selItem = null; return; }
    if (G.dlg || G.cut) return;
    if (G.mode === 'play') G.overlay = 'menu';
    return;
  }
  if (G.mode !== 'play') return;
  // v2: číslice = volba v dialogu
  if (G.dlg && G.dlg.choices && !G.say && /^[1-5]$/.test(k)) { chooseChoice(+k - 1); return; }
  if (k === ' ' || k === '.') { if (G.say) { endSay(true); e.preventDefault(); return; } }
  if (G.cut || G.dlg) return;
  if (k === ' ') { G.hsKey = true; e.preventDefault(); return; }
  if (k === 'Tab') { G.showHs = !G.showHs; e.preventDefault(); return; }
  if (G.overlay && G.overlay !== 'journal' && G.overlay !== 'hint') return;
  if (k === 'i' || k === 'I') { G.invPin = !G.invPin; BNJ.sfx('sfx_inv_open'); }
  if (k === 'j' || k === 'J') { G.overlay = G.overlay === 'journal' ? null : 'journal'; BNJ.sfx('sfx_page'); }
  if (k === 'h' || k === 'H') openHint();
  if (k === 'F5') { e.preventDefault(); if (saveTo(SAVE_KEYS[0])) toast(S('saved') + ' (1)'); }
  if (k === 'F9') { e.preventDefault(); if (readSave(SAVE_KEYS[0])) loadFrom(SAVE_KEYS[0]); }
}

function onKeyUp(e) {
  if (e.key === ' ') G.hsKey = false;
}

function openHint() {
  if (!BNJ.hints) return;
  if (G.overlay === 'hint') { G.overlay = null; return; }
  const h = BNJ.hints.get(BNJ.state);
  const key = BNJ.T(h.goal);
  if (!G.hint || G.hint.key !== key) G.hint = { key, shown: 0 };
  G.hint.data = h;
  G.overlay = 'hint';
  BNJ.sfx('sfx_hint');
}

/* ------------------------------------------------------------ jazyk atd. */
BNJ.setLang = function (l) {
  BNJ.state.lang = l === 'en' ? 'en' : 'cz';
  try { localStorage.setItem('bnj_lang', BNJ.state.lang); } catch (e) { /* ignore */ }
};

BNJ.startNewGame = function () {
  BNJ.state = { flags: {}, inventory: [], scene: null, lang: BNJ.state.lang, facts: [] };
  G.selItem = null; G.sayQ = []; G.say = null; G.dlg = null; G.cut = null;
  G.overlay = null; G.jScroll = 0; G.invPin = false;
  const start = R.scenes.river_bank ? 'river_bank' : (R.scenes.castle_yard ? 'castle_yard' : 'river_bank');
  G.mode = 'play';
  gotoScene(start, null, () => {
    if (R.dialogs.dlg_intro && !BNJ.state.flags._intro_done) {
      BNJ.state.flags._intro_done = true;
      startDialog('dlg_intro');
    }
  });
};

BNJ.continueGame = function () {
  const k = anySave();
  if (k) loadFrom(k);
};

BNJ.toTitle = function () {
  fadeTo(1, () => {
    G.mode = 'title'; G.overlay = null; G.dlg = null; G.cut = null;
    G.sayQ = []; G.say = null; G.coin = null; G.selItem = null;
    audio.play('title_theme');
    audio.playAmbience('amb_title');
    audio.setReverb(0.45);
    fadeTo(0);
  });
};

/* ------------------------------------------------------- text pomůcky */
function outText(ctx, txt, x, y, o) {
  o = o || {};
  const size = o.size || 30;
  ctx.font = (o.bold ? 'bold ' : '') + size + 'px ' + (o.font || FONT);
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = o.stroke || 'rgba(12,8,16,0.9)';
  ctx.lineWidth = o.sw != null ? o.sw : Math.max(3, size * 0.16);
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(txt, x, y);
}

function wrapLines(ctx, txt, maxW, font) {
  ctx.font = font;
  const words = String(txt).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w2 of words) {
    const t = cur ? cur + ' ' + w2 : w2;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w2; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* --------------------------------------------------------- render: scéna */
function actorsList() {
  const list = [{ id: PLAYER, x: G.player.x, y: G.player.y, dir: G.player.dir, ref: G.player }];
  if (G.scene && G.scene._actors) for (const a of G.scene._actors) list.push({ id: a.id, x: a.x, y: a.y, dir: a.dir, ref: a });
  return list;
}

function renderScene(ctx) {
  const def = G.scene;
  if (!def || !def._pre) { ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H); return; }
  const camX = G.camX, t = G.time, fx = BNJ.fx;
  def._pre.forEach((L, i) => {
    ctx.drawImage(L.c, -camX * L.p, 0);
    if (L.dyn) {
      ctx.save(); ctx.translate(-camX * L.p, 0);
      try { L.dyn(ctx, t, camX); } catch (e) { err('layer dynamic ' + def.id, e); }
      ctx.restore();
    }
    if (fx) { try { fx.afterLayer(ctx, def, i, camX, t); } catch (e) { err('fx.afterLayer', e); } }
  });
  if (def.dynamic) {
    ctx.save(); ctx.translate(-camX, 0);
    try { def.dynamic(ctx, t, camX); } catch (e) { err('dynamic ' + def.id, e); }
    ctx.restore();
  }
  if (fx) { try { fx.ground(ctx, def, camX, t); } catch (e) { err('fx.ground', e); } }
  renderFootprints(ctx);
  // postavy dle y
  const acts = actorsList().sort((a, b) => a.y - b.y);
  for (const a of acts) {
    const ref = a.ref;
    const action = (a.id === PLAYER && G.player.walking) ? 'walk' : 'idle';
    ref.pose = makePose(ref, action);
    ref.pose.dir = a.dir;
    ctx.save(); ctx.translate(-camX, 0);
    drawActor(ctx, { id: a.id, x: a.x, y: a.y, pose: ref.pose });
    ctx.restore();
  }
  renderPuffs(ctx);
  for (const L of def._pre) if (L.wb) ctx.drawImage(L.wb, -camX * L.p, 0);
  if (def.overlayDynamic) {
    ctx.save(); ctx.translate(-camX, 0);
    try { def.overlayDynamic(ctx, t, camX); } catch (e) { err('overlayDynamic ' + def.id, e); }
    ctx.restore();
  }
  if (fx) { try { fx.post(ctx, def, camX, t); } catch (e) { err('fx.post', e); } }
}

/* v2: stopy ve sněhu za Jiříkem (mizí po ~9 s) */
const _steps = [];
function addFootprint() {
  const p = G.player, def = G.scene;
  if (!def || def.interior || def.id === 'observatory') return;
  const sc = sceneScale(p.y);
  const side = (_steps.length & 1) ? 1 : -1;
  _steps.push({ x: p.x, y: p.y + side * 5 * sc, sc, dir: p.dir, t: G.time, scene: G.sceneId });
  if (_steps.length > 60) _steps.shift();
}
function renderFootprints(ctx) {
  if (!_steps.length) return;
  ctx.save();
  ctx.translate(-G.camX, 0);
  for (const st of _steps) {
    if (st.scene !== G.sceneId) continue;
    const age = G.time - st.t;
    if (age > 9) continue;
    const a = 0.3 * (1 - age / 9) * Math.min(1, age * 6 + 0.3);
    ctx.fillStyle = 'rgba(60,80,130,' + a.toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(st.x, st.y, 9 * st.sc, 4 * st.sc, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.6).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(st.x, st.y + 3 * st.sc, 9 * st.sc, 2 * st.sc, 0, 0, Math.PI); ctx.fill();
  }
  ctx.restore();
}

/* ----------------------------------------------------- render: titulky */
function renderSay(ctx) {
  const s = G.say;
  if (!s) return;
  const txt = BNJ.T(s.t);
  if (!txt) return;
  const ch = R.characters[s.c];
  const color = (ch && ch.textColor) || (s.c === PLAYER ? '#ffe9a8' : '#ffffff');
  const font = '31px ' + FONT;
  const lines = wrapLines(ctx, txt, 640, font);
  const lh = 38;
  let x = W / 2, y = 150;
  const act = actorsList().find(a => a.id === s.c);
  if (act) {
    const sc = sceneScale(act.y);
    const hh = ((ch && ch.height) || 320) * sc;
    x = act.x - G.camX;
    y = act.y - hh - 34 - (lines.length - 1) * lh;
  }
  let maxw = 0;
  ctx.font = font;
  for (const L of lines) maxw = Math.max(maxw, ctx.measureText(L).width);
  x = clamp(x, maxw / 2 + 34, W - maxw / 2 - 34);
  y = clamp(y, 66, H - 220);
  const ain = clamp(s.time / 0.14, 0, 1);
  ctx.save();
  ctx.globalAlpha = ain;
  lines.forEach((L, i) => {
    outText(ctx, L, x, y + i * lh, { size: 31, color, sw: 6, stroke: 'rgba(14,9,18,0.88)' });
  });
  ctx.restore();
}

/* ------------------------------------------------ render: dialog volby */
function renderDialogChoices(ctx) {
  const d = G.dlg;
  if (!d || !d.choices || G.say) return;
  const n = d.choices.length;
  const lineH = 54, pad = 30;
  const h = n * lineH + pad * 2;
  const y0 = H - h;
  const grd = ctx.createLinearGradient(0, y0 - 40, 0, H);
  grd.addColorStop(0, 'rgba(10,7,14,0.0)');
  grd.addColorStop(0.22, 'rgba(14,10,18,0.88)');
  grd.addColorStop(1, 'rgba(8,6,10,0.97)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, y0 - 40, W, h + 40);
  // ornamentální linka
  const lg = ctx.createLinearGradient(120, 0, W - 120, 0);
  lg.addColorStop(0, 'rgba(232,182,76,0)'); lg.addColorStop(0.2, 'rgba(232,182,76,0.75)');
  lg.addColorStop(0.8, 'rgba(232,182,76,0.75)'); lg.addColorStop(1, 'rgba(232,182,76,0)');
  ctx.fillStyle = lg; ctx.fillRect(120, y0 + 6, W - 240, 2);
  outText(ctx, '❦', W / 2, y0 + 16, { size: 26, color: '#e8b64c', sw: 4 });
  const partner = dialogPartner(d);
  let tx = 170;
  if (partner) {
    const pr = Math.min(96, h / 2 - 8);
    drawPortrait(ctx, partner, 150, y0 + h / 2 + 4, pr);
    const ch = R.characters[partner];
    if (ch && ch.textColor) outText(ctx, charName(partner), 150, y0 + h / 2 + pr + 2, { size: 20, color: ch.textColor, sw: 4 });
    tx = 300;
  }
  d.choices.forEach((v, i) => {
    const y = y0 + pad + i * lineH + 30;
    const txt = BNJ.T(v.c.text);
    const hov = uiBtn(tx - 50, y - 36, W - tx - 70, lineH - 6, () => { BNJ.sfx('sfx_ui_click'); chooseChoice(i); });
    if (hov) {
      const hg = ctx.createLinearGradient(tx - 50, 0, W - 120, 0);
      hg.addColorStop(0, 'rgba(232,182,76,0.18)'); hg.addColorStop(1, 'rgba(232,182,76,0)');
      ctx.fillStyle = hg;
      rr(ctx, tx - 50, y - 36, W - tx - 70, lineH - 6, 10); ctx.fill();
    }
    outText(ctx, String(i + 1), tx - 26, y, { size: 22, color: hov ? '#ffd97a' : 'rgba(232,182,76,0.6)', sw: 3 });
    outText(ctx, txt, tx, y, { size: 29, color: hov ? '#ffe9a8' : '#cdbf94', align: 'left', sw: 4 });
  });
  ctx.textAlign = 'left';
}
const CHAR_NAMES = { brahe: 'Tycho Brahe', kepler: 'Johannes Kepler', benda: 'Matěj Benda', prevoznik: 'Vávra', trhovkyne: 'Bětka', jirka: 'Jiřík' };
function charName(id) { const ch = R.characters[id]; return (ch && ch.name && BNJ.T(ch.name)) || CHAR_NAMES[id] || id; }

/* ---------------------------------------------------- render: verb coin */
function drawVerbIcon(ctx, verb) {
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ink = '#2e1d0a', pale = '#f3dfae';
  if (verb === 'look') {
    ctx.beginPath();
    ctx.moveTo(-21, 0);
    ctx.quadraticCurveTo(0, -17, 21, 0);
    ctx.quadraticCurveTo(0, 17, -21, 0);
    ctx.closePath();
    ctx.fillStyle = pale; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 2.6; ctx.stroke();
    const ig = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
    ig.addColorStop(0, '#e8b64c'); ig.addColorStop(1, '#8a5f1e');
    ctx.fillStyle = ig;
    ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(-2.6, -2.6, 1.7, 0, TAU); ctx.fill();
  } else if (verb === 'use') {
    ctx.fillStyle = pale; ctx.strokeStyle = ink; ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-15, 19);
    ctx.lineTo(-15, -3);
    for (let i = 0; i < 4; i++) ctx.arc(-15 + i * 8.6 + 4.3, -5, 4.3, Math.PI, 0);
    ctx.lineTo(19, 19);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-16, 7, 5, 8.5, 0.6, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(46,29,10,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-14, 15); ctx.lineTo(18, 15); ctx.stroke();
  } else {
    ctx.fillStyle = '#b2503a'; ctx.strokeStyle = ink; ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-19, -1);
    ctx.quadraticCurveTo(-9, -11, 0, -5);
    ctx.quadraticCurveTo(9, -11, 19, -1);
    ctx.quadraticCurveTo(9, 13, 0, 13);
    ctx.quadraticCurveTo(-9, 13, -19, -1);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = pale;
    ctx.beginPath();
    ctx.moveTo(-12, -1);
    ctx.quadraticCurveTo(0, 3, 12, -1);
    ctx.quadraticCurveTo(0, 5.5, -12, -1);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function renderCoin(ctx) {
  const c = G.coin;
  if (!c) return;
  c.t = Math.min(1, c.t + _dt / 0.16);
  const sc = easeOutBack(c.t);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(sc, sc);
  // disk
  const g = ctx.createRadialGradient(-20, -26, 10, 0, 0, 104);
  g.addColorStop(0, '#7c5a26');
  g.addColorStop(0.55, '#4a3312');
  g.addColorStop(1, '#241705');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#e8b64c'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(232,182,76,0.4)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.stroke();
  // vryté zoubky
  ctx.strokeStyle = 'rgba(232,182,76,0.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 94, Math.sin(a) * 94);
    ctx.lineTo(Math.cos(a) * 98, Math.sin(a) * 98);
    ctx.stroke();
  }
  ctx.restore();
  // sloty
  const slots = coinSlots();
  let label = null;
  slots.forEach((sl, i) => {
    const pop = clamp((c.t - i * 0.07) / 0.5, 0, 1);
    const hov = dist(G.mouse.x, G.mouse.y, sl.x, sl.y) < 40;
    const ss = easeOutBack(pop) * (hov ? 1.18 : 1);
    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.scale(ss, ss);
    const sg = ctx.createRadialGradient(-6, -8, 2, 0, 0, 36);
    sg.addColorStop(0, hov ? '#8a6a2e' : '#5c441c');
    sg.addColorStop(1, hov ? '#3a2a0e' : '#241705');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
    ctx.strokeStyle = hov ? '#ffd97a' : 'rgba(232,182,76,0.75)';
    ctx.lineWidth = hov ? 3.4 : 2.4;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke();
    if (hov) {
      ctx.shadowColor = '#ffd97a'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    drawVerbIcon(ctx, sl.v);
    ctx.restore();
    if (hov) label = sl.v;
  });
  if (label) {
    const names = { look: S('verb_look'), use: S('verb_use'), talk: S('verb_talk') };
    outText(ctx, names[label], c.x, c.y + 138, { size: 27, color: '#ffe9a8', sw: 5 });
  }
}

/* ----------------------------------------------------- render: inventář */
function invLayout() {
  const inv = BNJ.state.inventory;
  const n = inv.length;
  const size = 100, gap = 14;
  const slotW = Math.min(size, Math.floor((W - 100) / Math.max(1, n)) - gap);
  const totalW = n * (slotW + gap) - gap;
  const x0 = W / 2 - totalW / 2;
  const y = H - 128 + (1 - G.invAnim) * 140;
  return inv.map((id, i) => ({ id, x: x0 + i * (slotW + gap), y: y + 12, w: slotW, h: slotW }));
}

function renderInventory(ctx) {
  if (G.mode !== 'play' || G.dlg || G.cut || G.overlay) return;
  const want = (G.invPin || G.mouse.y > H - 46 || G.invPeekT > 0 || (G.invAnim > 0.05 && G.mouse.y > H - 150)) ? 1 : 0;
  G.invAnim = clamp(G.invAnim + (want ? _dt * 6 : -_dt * 5), 0, 1);
  if (G.invAnim < 0.02) return;
  const y0 = H - 140 + (1 - G.invAnim) * 150;
  const g = ctx.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, 'rgba(16,11,7,0.0)');
  g.addColorStop(0.25, 'rgba(24,16,10,0.92)');
  g.addColorStop(1, 'rgba(14,9,6,0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, 150);
  ctx.fillStyle = 'rgba(232,182,76,0.5)';
  ctx.fillRect(60, y0 + 10, W - 120, 2);
  const slots = invLayout();
  let hoverName = null;
  for (const sl of slots) {
    const hov = uiBtn(sl.x, sl.y, sl.w, sl.h,
      () => {
        if (G.selItem && G.selItem !== sl.id) { const a = G.selItem; G.selItem = null; tryCombine(a, sl.id); }
        else if (G.selItem === sl.id) G.selItem = null;
        else G.selItem = sl.id;
      },
      () => {
        const it = R.items[sl.id];
        if (it && it.desc) BNJ.say(PLAYER, it.desc);
        else if (it && it.name) BNJ.say(PLAYER, it.name);
      });
    const sel = G.selItem === sl.id;
    const flash = G.invFlash && G.invFlash.id === sl.id ? Math.max(0, 1 - G.invFlash.t / 0.9) : 0;
    ctx.save();
    const sg = ctx.createLinearGradient(sl.x, sl.y, sl.x, sl.y + sl.h);
    sg.addColorStop(0, sel ? '#4a3a1c' : '#2a2016');
    sg.addColorStop(1, sel ? '#33270f' : '#1a130c');
    ctx.fillStyle = sg;
    rr(ctx, sl.x, sl.y, sl.w, sl.h, 10); ctx.fill();
    ctx.strokeStyle = sel ? '#ffd97a' : (hov ? 'rgba(232,182,76,0.9)' : 'rgba(232,182,76,0.35)');
    ctx.lineWidth = sel || hov ? 3 : 2;
    rr(ctx, sl.x, sl.y, sl.w, sl.h, 10); ctx.stroke();
    if (flash > 0) {
      ctx.globalAlpha = flash * 0.6;
      ctx.fillStyle = '#ffe9a8';
      rr(ctx, sl.x, sl.y, sl.w, sl.h, 10); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const ic = itemIcon(sl.id);
    const pad2 = 6;
    ctx.drawImage(ic, sl.x + pad2, sl.y + pad2, sl.w - pad2 * 2, sl.h - pad2 * 2);
    ctx.restore();
    if (hov) {
      const it = R.items[sl.id];
      hoverName = it && it.name ? BNJ.T(it.name) : sl.id;
    }
  }
  if (!slots.length) {
    ctx.font = 'italic 24px ' + FONT;
    ctx.fillStyle = 'rgba(200,185,138,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText(S('inv_empty'), W / 2, y0 + 80);
    ctx.textAlign = 'left';
  }
  if (hoverName) outText(ctx, hoverName, W / 2, y0 - 4, { size: 25, color: '#ffe9a8', sw: 4 });
}

/* ----------------------------------------------- render: HUD, kursor aj. */
function renderTopButtons(ctx) {
  if (G.mode !== 'play' || G.dlg || G.cut || G.overlay) return;
  const by = 24, bw = 64, bh = 52, gap = 12;
  let x = W - 24 - bw;
  const hovL = uiBtn(x, by, bw, bh, () => { BNJ.sfx('sfx_ui_click'); BNJ.setLang(BNJ.state.lang === 'cz' ? 'en' : 'cz'); });
  ctx.save();
  ctx.globalAlpha = hovL ? 1 : 0.74;
  ctx.fillStyle = 'rgba(20,14,8,0.8)';
  rr(ctx, x, by, bw, bh, 12); ctx.fill();
  ctx.strokeStyle = hovL ? '#ffd97a' : 'rgba(232,182,76,0.6)'; ctx.lineWidth = 2;
  rr(ctx, x, by, bw, bh, 12); ctx.stroke();
  ctx.globalAlpha = 1;
  outText(ctx, BNJ.state.lang === 'cz' ? 'CZ' : 'EN', x + 32, by + 35, { size: 24, color: hovL ? '#ffe9a8' : '#d9c28a', sw: 3, bold: true });
  ctx.restore();
  x -= bw + gap;
  topBtn(ctx, x, by, bw, bh, iconBook, S('menu_journal') + ' (J)', () => { G.overlay = 'journal'; BNJ.sfx('sfx_page'); });
  x -= bw + gap;
  topBtn(ctx, x, by, bw, bh, iconOwl, L2('Co dál? (H)', 'What next? (H)'), openHint);
  x -= bw + gap;
  topBtn(ctx, x, by, bw, bh, iconSpark, L2('Ukaž místa (Mezerník/Tab)', 'Show hotspots (Space/Tab)'), () => { G.showHs = !G.showHs; }, G.showHs || G.hsKey);
  x -= bw + gap;
  topBtn(ctx, x, by, bw, bh, iconMenu, L2('Menu (Esc)', 'Menu (Esc)'), () => { G.overlay = 'menu'; });
}

function renderSceneName(ctx) {
  if (G.sceneNameT <= 0 || !G.scene || G.mode !== 'play') return;
  const a = clamp(G.sceneNameT > 2.6 ? (3.2 - G.sceneNameT) / 0.6 : G.sceneNameT / 0.8, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  const nm = BNJ.T(G.scene.name || { cz: G.sceneId, en: G.sceneId });
  outText(ctx, nm, 56, H - 178, { size: 40, color: '#e8dcbe', align: 'left', sw: 6 });
  ctx.fillStyle = 'rgba(232,182,76,0.8)';
  ctx.fillRect(58, H - 166, Math.min(360, nm.length * 19), 3);
  ctx.restore();
}

function renderHoverLabel(ctx) {
  if (!G.hover || G.coin || G.overlay) return;
  const m = G.mouse;
  let txt = null;
  if (G.hover.type === 'hs') txt = BNJ.T(G.hover.hs.name || {});
  else if (G.hover.type === 'exit') txt = BNJ.T(G.hover.exit.label || {});
  if (!txt) return;
  const y = clamp(m.y - 30, 40, H - 40);
  outText(ctx, txt, clamp(m.x, 100, W - 100), y, { size: 26, color: '#ffe9a8', sw: 5 });
}

function renderCursor(ctx) {
  const m = G.mouse;
  if (!m.inside) return;
  if (G.selItem) {
    const ic = itemIcon(G.selItem);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(Math.sin(G.time * 3) * 0.06);
    ctx.drawImage(ic, -36, -36, 72, 72);
    ctx.restore();
    return;
  }
  if (G.hover && G.hover.type === 'exit' && !G.coin) {
    ctx.save();
    ctx.translate(m.x, m.y);
    const dir = exitDir(G.hover.exit);
    const off = Math.sin(G.time * 7) * 4;
    ctx.translate(dir === 'l' ? -off : dir === 'r' ? off : 0, dir === 'u' ? -off : dir === 'd' ? off : 0);
    drawArrow(ctx, dir, 1);
    ctx.restore();
    return;
  }
  const interactive = !!G.hover || G.coin;
  ctx.save();
  ctx.lineWidth = 2.4;
  if (interactive) {
    const p = 1 + Math.sin(G.time * 5) * 0.12;
    ctx.strokeStyle = '#ffd97a';
    ctx.shadowColor = 'rgba(255,217,122,0.8)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(m.x, m.y, 11 * p, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, TAU); ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(240,244,255,0.9)';
    ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(240,244,255,0.9)';
    ctx.beginPath(); ctx.arc(m.x, m.y, 2.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function renderToasts(ctx) {
  let row = 0;
  for (const t2 of G.toasts) {
    const a = t2.t < 0.4 ? t2.t / 0.4 : (t2.t > 2.9 ? clamp((3.4 - t2.t) / 0.5, 0, 1) : 1);
    if (a <= 0) continue;
    const txt = typeof t2.text === 'string' ? t2.text : BNJ.T(t2.text);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '26px ' + FONT;
    const iw = t2.icon ? 52 : 0;
    const w2 = ctx.measureText(txt).width + 70 + iw;
    const x = W / 2 - w2 / 2, y = 30 + row * 66 - (1 - a) * 10;
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    const g = ctx.createLinearGradient(x, y, x, y + 56);
    g.addColorStop(0, '#f3e8c8'); g.addColorStop(1, '#d6c49a');
    ctx.fillStyle = g;
    rr(ctx, x, y, w2, 56, 12); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#8a6f42'; ctx.lineWidth = 2.5;
    rr(ctx, x, y, w2, 56, 12); ctx.stroke();
    if (t2.icon) ctx.drawImage(itemIcon(t2.icon), x + 18, y + 4, 48, 48);
    ctx.fillStyle = '#3a2c1a';
    ctx.textAlign = 'center';
    ctx.fillText(txt, W / 2 + iw / 2, y + 37);
    ctx.restore();
    row++;
  }
  ctx.textAlign = 'left';
}

function renderCutBars(ctx) {
  const want = G.cut ? 1 : 0;
  G.cutBar = clamp(G.cutBar + (want ? _dt * 3 : -_dt * 3), 0, 1);
  if (G.cutBar <= 0) return;
  const h = 88 * easeOutCubic(G.cutBar);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, h);
  ctx.fillRect(0, H - h, W, h);
}

/* =================================================== v2: nové UI prvky */
const L2 = (cz, en) => (BNJ.state.lang === 'en' ? en : cz);

function hsCenter(hs) {
  const hp = typeof hs.poly === 'function' ? safeCall(hs.poly, BNJ.state) : hs.poly;
  if (!hp || hp.length < 3) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of hp) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (!pointInPoly(cx, cy, hp)) { let sx = 0, sy = 0; for (const q of hp) { sx += q[0]; sy += q[1]; } cx = sx / hp.length; cy = sy / hp.length; }
  return [cx, cy];
}

function drawSparkle(ctx, x, y, r, a, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
  g.addColorStop(0, 'rgba(' + col + ',0.55)'); g.addColorStop(1, 'rgba(' + col + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff8e0';
  ctx.rotate(G.time * 0.6);
  for (let i = 0; i < 2; i++) {
    ctx.rotate(Math.PI / 4 * (i ? 1 : 0));
    const k = i ? 0.55 : 1;
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const an = j * Math.PI / 2;
      ctx.lineTo(Math.cos(an) * r * k, Math.sin(an) * r * k);
      ctx.lineTo(Math.cos(an + Math.PI / 4) * r * 0.18, Math.sin(an + Math.PI / 4) * r * 0.18);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function renderHotspotHighlight(ctx) {
  const k = G.showHsT;
  if (k <= 0.01 || G.mode !== 'play' || G.cut || G.dlg || G.overlay || !G.scene) return;
  const list = R.hotspots[G.sceneId] || [];
  const a = easeOutCubic(k);
  const placed = [];
  for (const hs of list) {
    if (hs.hidden && safeCall(hs.hidden, BNJ.state)) continue;
    const c = hsCenter(hs);
    if (!c) continue;
    const x = c[0] - G.camX, y = c[1];
    if (x < -40 || x > W + 40) continue;
    const pulse = 1 + Math.sin(G.time * 4 + c[0] * 0.01) * 0.15;
    drawSparkle(ctx, x, y, 15 * pulse, a, '255,214,120');
    const nm = BNJ.T(hs.name || {});
    if (nm) {
      let ly = y - 30;
      for (const p of placed) if (Math.abs(p[0] - x) < 170 && Math.abs(p[1] - ly) < 30) ly = p[1] - 32;
      placed.push([x, ly]);
      ctx.save(); ctx.globalAlpha = a;
      outText(ctx, nm, clamp(x, 90, W - 90), ly, { size: 21, color: '#ffe9a8', sw: 4 });
      ctx.restore();
    }
  }
  for (const e of (G.scene.exits || [])) {
    if (!e.at) continue;
    const x = e.at[0] - G.camX, y = e.at[1] - 40;
    if (x < -60 || x > W + 60) continue;
    const dir = exitDir(e);
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(clamp(x, 50, W - 50), y + Math.sin(G.time * 4) * 5);
    drawArrow(ctx, dir, 1.2);
    ctx.restore();
    const nm = BNJ.T(e.label || {});
    if (nm) { ctx.save(); ctx.globalAlpha = a * 0.9; outText(ctx, nm, clamp(x, 160, W - 160), y - 44, { size: 20, color: '#cfe4ff', sw: 4 }); ctx.restore(); }
  }
}

function exitDir(e) {
  const wdt = (G.scene && G.scene.width) || W;
  if (e.at[0] < wdt * 0.22) return 'l';
  if (e.at[0] > wdt * 0.78) return 'r';
  return e.at[1] < 870 ? 'u' : 'd';
}

function drawArrow(ctx, dir, s) {
  ctx.save();
  ctx.scale(s, s);
  ctx.rotate({ r: 0, l: Math.PI, u: -Math.PI / 2, d: Math.PI / 2 }[dir] || 0);
  ctx.beginPath();
  ctx.moveTo(18, 0); ctx.lineTo(-2, -16); ctx.lineTo(-2, -7); ctx.lineTo(-18, -7);
  ctx.lineTo(-18, 7); ctx.lineTo(-2, 7); ctx.lineTo(-2, 16); ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(14,10,20,0.9)'; ctx.lineWidth = 6; ctx.stroke();
  const g = ctx.createLinearGradient(0, -16, 0, 16);
  g.addColorStop(0, '#fff2c4'); g.addColorStop(1, '#e8b64c');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
}

function renderClickFx(ctx) {
  const c = G.clickFx;
  if (!c) return;
  c.t += _dt;
  if (c.t > 0.6) { G.clickFx = null; return; }
  const k = c.t / 0.6;
  const sc = sceneScale(c.y);
  ctx.save();
  ctx.translate(c.x - G.camX, c.y);
  ctx.scale(1, 0.38);
  ctx.globalAlpha = (1 - k) * 0.8;
  ctx.strokeStyle = c.run ? '#ffd97a' : '#f0f6ff';
  ctx.lineWidth = 3 / 0.38 * 0.5;
  ctx.beginPath(); ctx.arc(0, 0, (14 + k * 34) * sc, 0, TAU); ctx.stroke();
  if (c.run) { ctx.beginPath(); ctx.arc(0, 0, (6 + k * 22) * sc, 0, TAU); ctx.stroke(); }
  ctx.restore();
}

/* létající předmět: od Jiříka do inventáře */
function renderFlyItems(ctx) {
  for (let i = G.flyItems.length - 1; i >= 0; i--) {
    const f = G.flyItems[i];
    f.t += _dt;
    const k = clamp(f.t / 0.9, 0, 1);
    if (k >= 1) { G.flyItems.splice(i, 1); continue; }
    const e = easeOutCubic(k);
    const tx = W / 2, ty = H - 70;
    const x = lerp(f.x, tx, e), y = lerp(f.y, ty, e) - Math.sin(k * Math.PI) * 160;
    const s = 70 + Math.sin(k * Math.PI) * 50 - k * 20;
    ctx.save();
    ctx.globalAlpha = k < 0.85 ? 1 : (1 - k) / 0.15;
    const g = ctx.createRadialGradient(x, y, 0, x, y, s);
    g.addColorStop(0, 'rgba(255,230,160,0.55)'); g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    ctx.translate(x, y); ctx.rotate(Math.sin(k * 9) * 0.25);
    ctx.drawImage(itemIcon(f.id), -s / 2, -s / 2, s, s);
    ctx.restore();
  }
}

/* portrét NPC v dialogu (výřez hlavy z jeho kresby) */
const _portC = document.createElement('canvas');
_portC.width = 720; _portC.height = 700;
const _portX = _portC.getContext('2d');
function dialogPartner(d) {
  if (d._partner !== undefined) return d._partner;
  d._partner = null;
  for (const k in d.def.nodes) {
    const n = d.def.nodes[k];
    if (n && n.speaker && n.speaker !== PLAYER && R.characters[n.speaker]) { d._partner = n.speaker; break; }
  }
  return d._partner;
}
function drawPortrait(ctx, id, x, y, r) {
  const ch = R.characters[id];
  if (!ch) return;
  const hh = ch.height || 320;
  _portX.clearRect(0, 0, 720, 700);
  _portX.save();
  _portX.translate(360, 680);
  const sp = G.say && G.say.c === id;
  paintChar(_portX, id, { t: G.time, dir: 1, action: sp ? 'talk' : 'idle', mouth: sp ? clamp(0.5 + 0.5 * Math.sin(G.time * 15), 0, 1) : 0, blink: (G.time % 4.2) < 0.13 ? 1 : 0, phase: 0 });
  _portX.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.closePath();
  const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 4, x, y, r);
  const col = (ch.textColor || '#ffe9a8');
  bg.addColorStop(0, '#3a2f40'); bg.addColorStop(1, '#120c16');
  ctx.fillStyle = bg; ctx.fill();
  ctx.save(); ctx.clip();
  const crop = hh * 0.42, sx = 360 - crop * 0.62, sy = 680 - hh - crop * 0.12;
  ctx.drawImage(_portC, sx, sy, crop * 1.24, crop * 1.24, x - r * 1.05, y - r * 0.95, r * 2.1, r * 2.1);
  ctx.restore();
  ctx.lineWidth = 5; ctx.strokeStyle = '#e8b64c';
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = col;
  ctx.beginPath(); ctx.arc(x, y, r - 7, 0, TAU); ctx.stroke();
  ctx.restore();
}

/* top tlačítka v2 */
function topBtn(ctx, x, y, w, h, icon, label, cb, active) {
  const hov = uiBtn(x, y, w, h, () => { BNJ.sfx('sfx_ui_click'); cb(); });
  ctx.save();
  ctx.globalAlpha = hov || active ? 1 : 0.74;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, active ? 'rgba(70,50,20,0.9)' : 'rgba(34,24,14,0.82)');
  g.addColorStop(1, active ? 'rgba(40,28,10,0.9)' : 'rgba(14,10,6,0.82)');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = hov || active ? '#ffd97a' : 'rgba(232,182,76,0.6)'; ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12); ctx.stroke();
  ctx.translate(x + w / 2, y + h / 2);
  icon(ctx, hov);
  ctx.restore();
  if (hov) outText(ctx, label, x + w / 2, y + h + 26, { size: 20, color: '#ffe9a8', sw: 4 });
  return hov;
}
function iconBook(ctx) {
  ctx.fillStyle = '#e8dcbe'; ctx.strokeStyle = '#7a5c34'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -10); ctx.quadraticCurveTo(-8, -14, 0, -10); ctx.quadraticCurveTo(8, -14, 16, -10);
  ctx.lineTo(16, 10); ctx.quadraticCurveTo(8, 6, 0, 10); ctx.quadraticCurveTo(-8, 6, -16, 10); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
}
function iconOwl(ctx) {
  // sova = moudrá rada
  ctx.fillStyle = '#c9a46a'; ctx.strokeStyle = '#3a2610'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 3, 13, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(-10, -17); ctx.lineTo(-3, -9); ctx.moveTo(12, -6); ctx.lineTo(10, -17); ctx.lineTo(3, -9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff4d0';
  ctx.beginPath(); ctx.arc(-5.5, -2, 5, 0, TAU); ctx.arc(5.5, -2, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a08';
  ctx.beginPath(); ctx.arc(-5.5, -2, 2.2, 0, TAU); ctx.arc(5.5, -2, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8a040';
  ctx.beginPath(); ctx.moveTo(-2, 3); ctx.lineTo(2, 3); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill();
}
function iconSpark(ctx) {
  ctx.fillStyle = '#ffe9a8';
  for (const [x, y, r] of [[0, 0, 12], [-11, -9, 5], [11, 8, 6]]) {
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const an = j * Math.PI / 2;
      ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r);
      ctx.lineTo(x + Math.cos(an + Math.PI / 4) * r * 0.22, y + Math.sin(an + Math.PI / 4) * r * 0.22);
    }
    ctx.closePath(); ctx.fill();
  }
}
function iconMenu(ctx) {
  ctx.fillStyle = '#e8dcbe';
  for (let i = -1; i <= 1; i++) { rr(ctx, -14, i * 8 - 2, 28, 4.5, 2); ctx.fill(); }
}

/* --------------------------------------------- overlay: nápověda (sova) */
function renderHintOverlay(ctx) {
  const h = G.hint && G.hint.data;
  if (!h) { G.overlay = null; return; }
  const pw = 1080, ph = 640, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  uiBtn(0, 0, W, H, () => { G.overlay = null; });
  panelBg(ctx, px, py, pw, ph, L2('Co dál?', 'What next?'));
  ctx.save();
  ctx.translate(px + 90, py + 74); ctx.scale(1.6, 1.6); iconOwl(ctx);
  ctx.restore();
  ctx.save();
  ctx.translate(px + pw - 90, py + 74); ctx.scale(-1.6, 1.6); iconOwl(ctx);
  ctx.restore();
  const cx0 = px + 90, cw = pw - 180;
  let y = py + 160;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7a3020';
  ctx.font = 'bold 30px ' + FONT;
  for (const Ln of wrapLines(ctx, BNJ.T(h.goal), cw, 'bold 30px ' + FONT)) { ctx.fillText(Ln, cx0, y); y += 40; }
  y += 16;
  ctx.strokeStyle = 'rgba(122,92,52,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx0, y - 18); ctx.lineTo(cx0 + cw, y - 18); ctx.stroke();
  const shown = Math.min(G.hint.shown, h.steps.length);
  for (let i = 0; i < shown; i++) {
    ctx.fillStyle = '#8a5f1e'; ctx.font = '24px ' + FONT;
    ctx.fillText('✦', cx0, y + 4);
    ctx.fillStyle = '#3a2c1a'; ctx.font = '27px ' + FONT;
    for (const Ln of wrapLines(ctx, BNJ.T(h.steps[i]), cw - 44, '27px ' + FONT)) { ctx.fillText(Ln, cx0 + 40, y + 4); y += 35; }
    y += 14;
    if (y > py + ph - 140) break;
  }
  if (!shown) {
    ctx.fillStyle = 'rgba(58,44,26,0.6)'; ctx.font = 'italic 26px ' + FONT;
    ctx.fillText(L2('Sova si odkašle… chceš radu?', 'The owl clears its throat… want a hint?'), cx0, y + 4);
  }
  ctx.textAlign = 'left';
  const more = shown < h.steps.length;
  if (more) menuButton(ctx, shown ? L2('Další rada', 'Another hint') : L2('Poraď mi', 'Give me a hint'), W / 2 - 170, py + ph - 46, () => { G.hint.shown++; BNJ.sfx('sfx_hint'); });
  menuButton(ctx, L2('Zavřít', 'Close'), more ? W / 2 + 170 : W / 2, py + ph - 46, () => { G.overlay = null; });
}

/* ------------------------------------------------- overlay: nastavení */
function slider(ctx, label, key, x, y, w) {
  const st = BNJ.settings;
  ctx.fillStyle = '#3a2c1a'; ctx.font = '28px ' + FONT; ctx.textAlign = 'left';
  ctx.fillText(label, x, y);
  const tx = x + 330, tw = w - 330 - 70, ty = y - 10;
  uiBtn(tx - 14, ty - 22, tw + 28, 44, () => {
    st[key] = clamp((G.mouse.x - tx) / tw, 0, 1);
    BNJ.saveSettings();
    BNJ.sfx('sfx_ui_click');
  });
  if (G.mouse.down && G.mouse.y > ty - 22 && G.mouse.y < ty + 22 && G.mouse.x > tx - 14 && G.mouse.x < tx + tw + 14) {
    st[key] = clamp((G.mouse.x - tx) / tw, 0, 1);
    audio.applyVolumes();
    G._setDirty = true;
  }
  const v = st[key];
  ctx.fillStyle = 'rgba(90,64,32,0.3)'; rr(ctx, tx, ty - 5, tw, 10, 5); ctx.fill();
  const g = ctx.createLinearGradient(tx, 0, tx + tw, 0);
  g.addColorStop(0, '#a66b28'); g.addColorStop(1, '#e8b64c');
  ctx.fillStyle = g; rr(ctx, tx, ty - 5, Math.max(10, tw * v), 10, 5); ctx.fill();
  ctx.fillStyle = '#7a3020'; ctx.strokeStyle = '#f3e3b8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(tx + tw * v, ty, 14, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2c1a'; ctx.font = '24px ' + FONT; ctx.textAlign = 'right';
  ctx.fillText(Math.round(v * 100) + ' %', x + w, y);
  ctx.textAlign = 'left';
}
function chooser(ctx, label, opts, cur, x, y, w, cb) {
  ctx.fillStyle = '#3a2c1a'; ctx.font = '28px ' + FONT; ctx.textAlign = 'left';
  ctx.fillText(label, x, y);
  let ox = x + 330;
  const bw = (w - 330) / opts.length;
  opts.forEach((o, i) => {
    const sel = o.v === cur;
    const hov = uiBtn(ox + 4, y - 36, bw - 8, 48, () => { cb(o.v); BNJ.sfx('sfx_ui_click'); });
    ctx.fillStyle = sel ? '#7a3020' : (hov ? 'rgba(122,48,32,0.18)' : 'rgba(90,64,32,0.12)');
    rr(ctx, ox + 4, y - 36, bw - 8, 48, 10); ctx.fill();
    ctx.fillStyle = sel ? '#f6e7c0' : '#3a2c1a';
    ctx.font = (sel ? 'bold ' : '') + '23px ' + FONT; ctx.textAlign = 'center';
    ctx.fillText(o.label, ox + bw / 2, y - 4);
    ox += bw;
  });
  ctx.textAlign = 'left';
}
function renderSettingsOverlay(ctx) {
  const pw = 980, ph = 720, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  const back = () => { G.overlay = G.mode === 'play' ? 'menu' : null; BNJ.saveSettings(); };
  uiBtn(0, 0, W, H, back);
  panelBg(ctx, px, py, pw, ph, L2('Nastavení', 'Settings'));
  const x = px + 80, w = pw - 160;
  let y = py + 170;
  slider(ctx, L2('Hudba', 'Music'), 'music', x, y, w); y += 76;
  slider(ctx, L2('Zvuky', 'Sound effects'), 'sfx', x, y, w); y += 76;
  slider(ctx, L2('Okolní ruchy', 'Ambience'), 'amb', x, y, w); y += 90;
  chooser(ctx, L2('Světlo a efekty', 'Light & effects'), [
    { v: 0, label: L2('Vypnuto', 'Off') }, { v: 1, label: L2('Úsporné', 'Low') }, { v: 2, label: L2('Plné', 'Full') }
  ], BNJ.settings.fx, x, y, w, (v) => { BNJ.settings.fx = v; BNJ.saveSettings(); }); y += 86;
  chooser(ctx, L2('Rychlost titulků', 'Subtitle speed'), [
    { v: 1.4, label: L2('Pomalé', 'Slow') }, { v: 1, label: L2('Běžné', 'Normal') }, { v: 0.7, label: L2('Rychlé', 'Fast') }
  ], BNJ.settings.textSpeed, x, y, w, (v) => { BNJ.settings.textSpeed = v; BNJ.saveSettings(); }); y += 86;
  ctx.fillStyle = 'rgba(58,44,26,0.7)'; ctx.font = 'italic 21px ' + FONT; ctx.textAlign = 'center';
  ctx.fillText(L2('Mezerník/Tab = ukaž místa · H = nápověda · dvojklik = běh/rychlý odchod · 1–5 = volby · F5/F9 = rychlé uložení/načtení',
    'Space/Tab = show hotspots · H = hint · double-click = run/quick exit · 1–5 = choices · F5/F9 = quick save/load'), W / 2, y + 6);
  ctx.textAlign = 'left';
  menuButton(ctx, L2('Zpět', 'Back'), W / 2, py + ph - 46, back);
}

/* --------------------------------------------------------- overlaye UI */
function panelBg(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(6,5,10,0.62)';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#efe3c2'); g.addColorStop(0.5, '#e2d0a6'); g.addColorStop(1, '#cdb88c');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = '#7a5c34'; ctx.lineWidth = 4;
  rr(ctx, x, y, w, h, 18); ctx.stroke();
  ctx.strokeStyle = 'rgba(122,92,52,0.55)'; ctx.lineWidth = 1.6;
  rr(ctx, x + 12, y + 12, w - 24, h - 24, 12); ctx.stroke();
  // rohové ornamenty
  ctx.fillStyle = 'rgba(138,111,66,0.8)';
  ctx.font = '26px ' + FONT; ctx.textAlign = 'center';
  ctx.fillText('❦', x + 34, y + 44);
  ctx.fillText('❦', x + w - 34, y + 44);
  ctx.fillText('❦', x + 34, y + h - 24);
  ctx.fillText('❦', x + w - 34, y + h - 24);
  if (title) {
    ctx.fillStyle = '#3a2c1a';
    ctx.font = 'bold 46px ' + FONT;
    ctx.fillText(title, x + w / 2, y + 74);
    ctx.strokeStyle = 'rgba(122,92,52,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + w / 2 - 180, y + 94); ctx.lineTo(x + w / 2 + 180, y + 94); ctx.stroke();
  }
  ctx.textAlign = 'left';
  // klik na panel nikam nepropadá
  uiBtn(x, y, w, h, () => { });
}

function menuButton(ctx, label, cx, y, cb, dim) {
  ctx.font = '34px ' + FONT;
  const w2 = ctx.measureText(label).width + 60;
  const x = cx - w2 / 2;
  const hov = !dim && uiBtn(x, y - 32, w2, 46, cb);
  outText(ctx, label, cx, y, {
    size: 34,
    color: dim ? 'rgba(90,80,60,0.8)' : (hov ? '#7a3020' : '#3a2c1a'),
    stroke: 'rgba(240,230,200,0.6)', sw: hov ? 1.5 : 0.01
  });
  if (hov) {
    outText(ctx, '✦', cx - w2 / 2 - 6, y, { size: 22, color: '#a63a2e', sw: 0.01 });
    outText(ctx, '✦', cx + w2 / 2 + 6, y, { size: 22, color: '#a63a2e', sw: 0.01 });
  }
  return hov;
}

function renderMenuOverlay(ctx) {
  const pw = 640, ph = 760, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  uiBtn(0, 0, W, H, () => { G.overlay = null; });
  panelBg(ctx, px, py, pw, ph, S('menu_pause'));
  const cx = W / 2;
  let y = py + 170;
  menuButton(ctx, S('menu_resume'), cx, y, () => { G.overlay = null; }); y += 70;
  menuButton(ctx, L2('Co dál? (nápověda)', 'What next? (hint)'), cx, y, () => { G.overlay = null; openHint(); }); y += 70;
  menuButton(ctx, L2('Nastavení', 'Settings'), cx, y, () => { G.overlay = 'settings'; }); y += 70;
  menuButton(ctx, S('menu_save'), cx, y, () => { G.overlay = 'save'; }); y += 70;
  menuButton(ctx, S('menu_load'), cx, y, () => { G.overlay = 'load'; }); y += 70;
  menuButton(ctx, S('menu_journal'), cx, y, () => { G.overlay = 'journal'; }); y += 70;
  menuButton(ctx, S('menu_lang_label') + ': ' + S('lang_name'), cx, y, () => BNJ.setLang(BNJ.state.lang === 'cz' ? 'en' : 'cz')); y += 70;
  menuButton(ctx, S('menu_totitle'), cx, y, () => { BNJ.toTitle(); });
}

function slotCard(ctx, key, label, x, y, w, h, mode) {
  const d = readSave(key);
  const canClick = mode === 'save' ? key !== SAVE_AUTO : !!d;
  const hov = uiBtn(x, y, w, h, () => {
    if (mode === 'save') {
      if (key === SAVE_AUTO) return;
      if (saveTo(key)) { toast(S('saved')); G.overlay = 'menu'; }
    } else if (d) {
      loadFrom(key);
    }
  });
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, hov && canClick ? '#f5ead0' : '#e8d9b4');
  g.addColorStop(1, hov && canClick ? '#e0cfa4' : '#d2bf94');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = hov && canClick ? '#7a3020' : 'rgba(122,92,52,0.8)';
  ctx.lineWidth = hov && canClick ? 3 : 2;
  rr(ctx, x, y, w, h, 12); ctx.stroke();
  ctx.fillStyle = '#3a2c1a';
  ctx.font = 'bold 27px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 26, y + 40);
  ctx.font = '24px ' + FONT;
  if (d) {
    const scDef = R.scenes[d.scene];
    const nm = scDef && scDef.name ? BNJ.T(scDef.name) : d.scene;
    ctx.fillText(nm, x + 26, y + 76);
    ctx.fillStyle = 'rgba(58,44,26,0.75)';
    ctx.font = '20px ' + FONT;
    const loc = BNJ.state.lang === 'cz' ? 'cs-CZ' : 'en-GB';
    let when = '';
    try { when = new Date(d.when).toLocaleString(loc); } catch (e) { when = ''; }
    ctx.textAlign = 'right';
    ctx.fillText(when, x + w - 26, y + 40);
    const fc = (d.state && d.state.facts ? d.state.facts.length : 0);
    ctx.fillText(S('journal_count') + ': ' + fc, x + w - 26, y + 76);
  } else {
    ctx.fillStyle = 'rgba(58,44,26,0.55)';
    ctx.font = 'italic 24px ' + FONT;
    ctx.fillText(S('slot_empty'), x + 26, y + 76);
  }
  ctx.restore();
  ctx.textAlign = 'left';
}

function renderSaveLoadOverlay(ctx, mode) {
  const pw = 980, ph = 700, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  uiBtn(0, 0, W, H, () => { G.overlay = 'menu'; });
  panelBg(ctx, px, py, pw, ph, mode === 'save' ? S('save_title') : S('load_title'));
  let y = py + 130;
  const cw = pw - 120, cx0 = px + 60, chh = 100;
  if (mode === 'load') {
    slotCard(ctx, SAVE_AUTO, S('slot_auto'), cx0, y, cw, chh, mode);
    y += chh + 22;
  }
  SAVE_KEYS.forEach((k, i) => {
    slotCard(ctx, k, S('slot') + ' ' + (i + 1), cx0, y, cw, chh, mode);
    y += chh + 22;
  });
  menuButton(ctx, S('menu_back'), W / 2, py + ph - 46, () => { G.overlay = 'menu'; });
}

function renderJournalOverlay(ctx) {
  const pw = 1240, ph = 880, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  uiBtn(0, 0, W, H, () => { G.overlay = null; });
  panelBg(ctx, px, py, pw, ph, S('journal_title'));
  ctx.fillStyle = 'rgba(58,44,26,0.7)';
  ctx.font = 'italic 24px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText(S('journal_sub'), W / 2, py + 128);
  const factsDb = (BNJ.strings && BNJ.strings.facts) || {};
  const total = Object.keys(factsDb).length;
  const known = BNJ.state.facts;
  // obsah s ořezem
  const cx0 = px + 80, cy0 = py + 160, cw = pw - 160, chh = ph - 260;
  ctx.save();
  ctx.beginPath(); ctx.rect(cx0 - 10, cy0, cw + 20, chh); ctx.clip();
  let yy = cy0 + 34 - G.jScroll;
  ctx.textAlign = 'left';
  if (!known.length) {
    ctx.fillStyle = 'rgba(58,44,26,0.65)';
    ctx.font = 'italic 27px ' + FONT;
    const lines = wrapLines(ctx, S('journal_empty'), cw - 40, 'italic 27px ' + FONT);
    lines.forEach((L, i) => ctx.fillText(L, cx0 + 20, cy0 + 80 + i * 36));
  } else {
    const order = Object.keys(factsDb);
    const sorted = known.slice().sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    for (const fid of sorted) {
      const txtO = factsDb[fid];
      const txt = txtO ? BNJ.T(txtO) : fid;
      ctx.font = '26px ' + FONT;
      const lines = wrapLines(ctx, txt, cw - 70, '26px ' + FONT);
      ctx.fillStyle = '#8a5f1e';
      ctx.font = '24px ' + FONT;
      ctx.fillText('✦', cx0, yy);
      ctx.fillStyle = '#3a2c1a';
      ctx.font = '26px ' + FONT;
      lines.forEach((L, i) => ctx.fillText(L, cx0 + 40, yy + i * 34));
      yy += lines.length * 34 + 22;
    }
  }
  const contentH = Math.max(0, yy + G.jScroll - cy0 - chh + 20);
  G._jMax = Math.max(0, contentH);
  ctx.restore();
  // počet
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3a2c1a';
  ctx.font = 'bold 28px ' + FONT;
  ctx.fillText(S('journal_count') + ': ' + known.length + ' / ' + total, W / 2, py + ph - 90);
  menuButton(ctx, S('menu_back'), W / 2, py + ph - 42, () => { G.overlay = null; });
  ctx.textAlign = 'left';
}

function renderOverlay(ctx) {
  if (G.overlay === 'menu') renderMenuOverlay(ctx);
  else if (G.overlay === 'save') renderSaveLoadOverlay(ctx, 'save');
  else if (G.overlay === 'load') renderSaveLoadOverlay(ctx, 'load');
  else if (G.overlay === 'journal') renderJournalOverlay(ctx);
  else if (G.overlay === 'hint') renderHintOverlay(ctx);
  else if (G.overlay === 'settings') renderSettingsOverlay(ctx);
}

/* ------------------------------------------------------------- titulka */
function initTitle() {
  if (G.title) return;
  const rng = mulberry(1599);
  const T = { chimneys: [], obsWin: { x: 843, y: 356, w: 34, h: 46 } };

  // hvězdy (třpyt dynamicky)
  T.stars = [];
  for (let i = 0; i < 240; i++) {
    T.stars.push({ x: rng() * W, y: rng() * 640, r: 0.5 + rng() * 1.5, ph: rng() * TAU, sp: 0.6 + rng() * 1.8 });
  }
  // sníh — 3 hloubky
  T.snow = [];
  const counts = [72, 52, 34], sizes = [1.4, 2.4, 3.8], spds = [26, 46, 78];
  for (let d = 0; d < 3; d++) {
    for (let i = 0; i < counts[d]; i++) {
      T.snow.push({ x0: rng() * W, y0: rng() * H, r: sizes[d] * (0.7 + rng() * 0.6), sp: spds[d] * (0.8 + rng() * 0.4), sw: 24 + rng() * 40, ph: rng() * TAU, a: 0.35 + d * 0.22 });
    }
  }

  // ---- statické vrstvy ----
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

  // nebe + mléčná dráha + statické hvězdičky
  T.sky = mk();
  {
    const x = T.sky.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1d3a');
    g.addColorStop(0.55, '#132a4c');
    g.addColorStop(1, '#1c3a5e');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    // pás mléčné dráhy
    x.save();
    x.translate(W / 2, 340);
    x.rotate(-0.42);
    const mg = x.createLinearGradient(0, -130, 0, 130);
    mg.addColorStop(0, 'rgba(200,215,240,0)');
    mg.addColorStop(0.5, 'rgba(210,222,245,0.10)');
    mg.addColorStop(1, 'rgba(200,215,240,0)');
    x.fillStyle = mg;
    x.fillRect(-1400, -130, 2800, 260);
    const mg2 = x.createLinearGradient(0, -50, 0, 50);
    mg2.addColorStop(0, 'rgba(220,230,250,0)');
    mg2.addColorStop(0.5, 'rgba(230,238,252,0.09)');
    mg2.addColorStop(1, 'rgba(220,230,250,0)');
    x.fillStyle = mg2;
    x.fillRect(-1400, -60, 2800, 120);
    x.fillStyle = '#f5f0dc';
    for (let i = 0; i < 650; i++) {
      const t = rng();
      const gx = -1300 + t * 2600;
      const gy = (rng() + rng() + rng() - 1.5) * 120;
      x.globalAlpha = 0.06 + rng() * 0.3;
      x.beginPath(); x.arc(gx, gy, 0.4 + rng() * 1.1, 0, TAU); x.fill();
    }
    x.restore();
    x.globalAlpha = 1;
    // statický hvězdný prach
    x.fillStyle = '#f5f0dc';
    for (let i = 0; i < 300; i++) {
      x.globalAlpha = 0.1 + rng() * 0.35;
      x.beginPath(); x.arc(rng() * W, rng() * 700, 0.4 + rng() * 0.9, 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
  }

  // vzdálené kopce + měsíc
  T.far = mk();
  {
    const x = T.far.getContext('2d');
    // měsíc
    x.fillStyle = '#f0e6c8';
    x.beginPath(); x.arc(1520, 210, 56, 0, TAU); x.fill();
    x.fillStyle = 'rgba(200,190,160,0.5)';
    x.beginPath(); x.arc(1500, 196, 9, 0, TAU); x.fill();
    x.beginPath(); x.arc(1538, 226, 12, 0, TAU); x.fill();
    x.beginPath(); x.arc(1512, 236, 6, 0, TAU); x.fill();
    // kopce
    const hill = (base, amp, col, seed) => {
      const r2 = mulberry(seed);
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(-10, H);
      let y = base;
      for (let px2 = -10; px2 <= W + 10; px2 += 40) {
        y = base + Math.sin(px2 * 0.004 + seed) * amp + (r2() - 0.5) * 18;
        x.lineTo(px2, y);
      }
      x.lineTo(W + 10, H);
      x.closePath(); x.fill();
    };
    hill(600, 46, '#14213a', 3);
    hill(650, 40, '#101b30', 7);
    // sněžný přísvit na hřebenech
    x.strokeStyle = 'rgba(190,205,230,0.14)';
    x.lineWidth = 3;
    x.beginPath();
    for (let px2 = -10; px2 <= W + 10; px2 += 40) {
      const y = 600 + Math.sin(px2 * 0.004 + 3) * 46;
      if (px2 === -10) x.moveTo(px2, y); else x.lineTo(px2, y);
    }
    x.stroke();
  }

  // zámek na návrší
  T.castle = mk();
  {
    const x = T.castle.getContext('2d');
    // návrší
    x.fillStyle = '#0e1830';
    x.beginPath();
    x.moveTo(360, H);
    x.quadraticCurveTo(600, 610, 960, 596);
    x.quadraticCurveTo(1320, 610, 1560, H);
    x.closePath(); x.fill();
    x.strokeStyle = 'rgba(170,190,220,0.16)';
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(420, 900);
    x.quadraticCurveTo(640, 620, 960, 600);
    x.stroke();
    // silueta zámku
    x.fillStyle = '#111a2e';
    // hlavní křídlo
    x.fillRect(700, 452, 520, 160);
    // cimbuří
    for (let bx = 700; bx < 1220; bx += 40) x.fillRect(bx, 436, 22, 20);
    // velká věž s cibulí
    x.fillRect(1130, 300, 96, 320);
    x.beginPath();
    x.moveTo(1116, 302);
    x.quadraticCurveTo(1178, 210, 1240, 302);
    x.closePath(); x.fill();
    x.beginPath(); x.moveTo(1170, 232); x.lineTo(1186, 232); x.lineTo(1178, 178); x.closePath(); x.fill();
    // observatorní věž
    x.fillRect(806, 320, 110, 300);
    x.beginPath();
    x.moveTo(792, 322);
    x.quadraticCurveTo(861, 240, 930, 322);
    x.closePath(); x.fill();
    // korouhvička
    x.strokeStyle = '#111a2e'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(861, 262); x.lineTo(861, 224); x.stroke();
    x.fillStyle = '#111a2e';
    x.beginPath(); x.moveTo(861, 224); x.lineTo(892, 232); x.lineTo(861, 242); x.closePath(); x.fill();
    // menší štíty
    x.fillRect(640, 500, 70, 112);
    x.beginPath(); x.moveTo(632, 502); x.lineTo(675, 458); x.lineTo(718, 502); x.closePath(); x.fill();
    // okna — spící (studená)
    x.fillStyle = 'rgba(140,160,200,0.12)';
    for (let i = 0; i < 6; i++) x.fillRect(740 + i * 76, 500, 20, 34);
    // teplá okna
    x.fillStyle = 'rgba(255,207,110,0.34)';
    x.fillRect(1156, 420, 18, 28);
    // sněhové linky na římsách
    x.strokeStyle = 'rgba(223,233,245,0.35)';
    x.lineWidth = 3.4;
    x.beginPath(); x.moveTo(700, 452); x.lineTo(1220, 452); x.stroke();
    x.beginPath(); x.moveTo(792, 322); x.quadraticCurveTo(861, 244, 930, 322); x.stroke();
    x.beginPath(); x.moveTo(1116, 302); x.quadraticCurveTo(1178, 214, 1240, 302); x.stroke();
  }

  // střechy Nových Benátek v popředí
  T.roofs = mk();
  {
    const x = T.roofs.getContext('2d');
    const r2 = mulberry(42);
    let bx = -60;
    while (bx < W + 80) {
      const bw = 150 + r2() * 190;
      const bh = 120 + r2() * 130;
      const by = H - bh;
      const peak = by - (40 + r2() * 70);
      x.fillStyle = '#0b1222';
      x.fillRect(bx, by, bw, bh);
      x.beginPath();
      x.moveTo(bx - 8, by);
      x.lineTo(bx + bw / 2, peak);
      x.lineTo(bx + bw + 8, by);
      x.closePath(); x.fill();
      // sníh na hřebeni
      x.strokeStyle = 'rgba(223,233,245,0.85)';
      x.lineWidth = 5;
      x.beginPath();
      x.moveTo(bx - 4, by - 2);
      x.lineTo(bx + bw / 2, peak - 2);
      x.lineTo(bx + bw + 4, by - 2);
      x.stroke();
      // komín
      if (r2() > 0.35) {
        const cx2 = bx + bw * (0.3 + r2() * 0.4);
        const cy2 = peak + (by - peak) * 0.35;
        x.fillStyle = '#0b1222';
        x.fillRect(cx2 - 10, cy2 - 34, 20, 40);
        x.fillStyle = 'rgba(223,233,245,0.8)';
        x.fillRect(cx2 - 12, cy2 - 38, 24, 6);
        T.chimneys.push({ x: cx2, y: cy2 - 38 });
      }
      // teplé okno
      if (r2() > 0.4) {
        x.fillStyle = 'rgba(255,207,110,' + (0.25 + r2() * 0.35) + ')';
        x.fillRect(bx + 20 + r2() * (bw - 60), by + 24 + r2() * (bh - 70), 16, 24);
      }
      bx += bw + 26 + r2() * 60;
    }
  }
  G.title = T;
}

function titleMenuItems() {
  const items = [];
  items.push({ label: S('menu_new'), cb: () => { audio.unlock(); BNJ.startNewGame(); } });
  const has = anySave();
  items.push({ label: S('menu_continue'), cb: has ? () => { audio.unlock(); BNJ.continueGame(); } : null, dim: !has });
  items.push({ label: L2('Nastavení', 'Settings'), cb: () => { audio.unlock(); G.overlay = 'settings'; } });
  items.push({ label: S('menu_lang_label') + ': ' + S('lang_name'), cb: () => BNJ.setLang(BNJ.state.lang === 'cz' ? 'en' : 'cz') });
  return items;
}

function renderTitle(ctx) {
  initTitle();
  const T = G.title, t = G.time;
  const custom = R.scenes.title;
  if (custom) {
    if (!custom._pre) prerender(custom);
    for (const L of custom._pre) {
      ctx.drawImage(L.c, 0, 0);
      if (L.dyn) { try { L.dyn(ctx, t, 0); } catch (e) { err('title layer dynamic', e); } }
    }
    if (custom.dynamic) { try { custom.dynamic(ctx, t, 0); } catch (e) { err('title dynamic', e); } }
    if (custom.overlayDynamic) { try { custom.overlayDynamic(ctx, t, 0); } catch (e) { err('title overlayDynamic', e); } }
  } else {
    ctx.drawImage(T.sky, 0, 0);
    // třpyt hvězd
    ctx.fillStyle = '#f5f0dc';
    for (const s of T.stars) {
      const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a * 0.85;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // padající hvězda ~ každých 27 s
    {
      const cyc = Math.floor(t / 27);
      const ph = t % 27;
      if (ph < 1.0) {
        const r2 = mulberry(cyc + 11);
        const sx = 200 + r2() * 1300, sy = 80 + r2() * 260;
        const dx2 = 260 + r2() * 200, dy2 = 120 + r2() * 80;
        const p = ph / 1.0;
        const hx = sx + dx2 * p, hy = sy + dy2 * p;
        const grad = ctx.createLinearGradient(hx - dx2 * 0.18, hy - dy2 * 0.18, hx, hy);
        grad.addColorStop(0, 'rgba(245,240,220,0)');
        grad.addColorStop(1, 'rgba(245,240,220,' + (0.9 * Math.sin(p * Math.PI)) + ')');
        ctx.strokeStyle = grad; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(hx - dx2 * 0.18, hy - dy2 * 0.18);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }
    }
    // svit měsíce
    {
      const p = 0.9 + Math.sin(t * 0.35) * 0.1;
      const mg = ctx.createRadialGradient(1520, 210, 30, 1520, 210, 170 * p);
      mg.addColorStop(0, 'rgba(240,230,200,0.25)');
      mg.addColorStop(1, 'rgba(240,230,200,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(1520, 210, 170 * p, 0, TAU); ctx.fill();
    }
    ctx.drawImage(T.far, 0, 0);
    ctx.drawImage(T.castle, 0, 0);
    // okno observatoře — Brahe pozoruje (občas zhasne)
    {
      const wv = T.obsWin;
      const cycle = t % 17;
      const on = cycle > 2.2;
      const fl = on ? 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * 9.1) * Math.sin(t * 4.7)) : 0.05;
      const wg = ctx.createRadialGradient(wv.x + wv.w / 2, wv.y + wv.h / 2, 4, wv.x + wv.w / 2, wv.y + wv.h / 2, 70);
      wg.addColorStop(0, 'rgba(255,179,71,' + 0.5 * fl + ')');
      wg.addColorStop(1, 'rgba(255,179,71,0)');
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.arc(wv.x + wv.w / 2, wv.y + wv.h / 2, 70, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,199,101,' + 0.85 * fl + ')';
      ctx.fillRect(wv.x, wv.y, wv.w, wv.h);
      ctx.fillStyle = 'rgba(17,26,46,0.9)';
      ctx.fillRect(wv.x + wv.w / 2 - 2, wv.y, 4, wv.h);
      ctx.fillRect(wv.x, wv.y + wv.h / 2 - 2, wv.w, 4);
    }
    ctx.drawImage(T.roofs, 0, 0);
    // kouř z komínů — analyticky
    for (let ci = 0; ci < T.chimneys.length; ci++) {
      const ch = T.chimneys[ci];
      for (let i = 0; i < 9; i++) {
        const life = ((t * 0.55 + i * 0.47 + ci * 0.31) % 4) / 4;
        const yy = ch.y - life * 130;
        const xx = ch.x + Math.sin(life * 5 + i * 2.1 + ci) * (8 + life * 26);
        const rr2 = 4 + life * 16;
        ctx.fillStyle = 'rgba(159,176,200,' + (0.16 * (1 - life)) + ')';
        ctx.beginPath(); ctx.arc(xx, yy, rr2, 0, TAU); ctx.fill();
      }
    }
    // sníh
    for (const f of T.snow) {
      const yy = (f.y0 + t * f.sp) % (H + 30) - 15;
      const xx = f.x0 + Math.sin(t * 0.8 + f.ph) * f.sw;
      ctx.globalAlpha = f.a;
      ctx.fillStyle = '#dfe9f5';
      ctx.beginPath(); ctx.arc(((xx % (W + 40)) + W + 40) % (W + 40) - 20, yy, f.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // vinětace
    const vg = ctx.createRadialGradient(W / 2, H * 0.42, 300, W / 2, H * 0.5, 1200);
    vg.addColorStop(0, 'rgba(4,6,14,0)');
    vg.addColorStop(1, 'rgba(4,6,14,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  // ---- titul + menu (vždy engine) ----
  const ty = 268 + Math.sin(t * 0.8) * 4;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 118px ' + FONT;
  ctx.shadowColor = 'rgba(232,182,76,0.55)';
  ctx.shadowBlur = 34;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,12,4,0.9)';
  ctx.lineWidth = 12;
  ctx.strokeText(S('title'), W / 2, ty);
  const tg = ctx.createLinearGradient(0, ty - 100, 0, ty + 16);
  tg.addColorStop(0, '#f6d88a');
  tg.addColorStop(0.55, '#e8b64c');
  tg.addColorStop(1, '#b17c22');
  ctx.fillStyle = tg;
  ctx.fillText(S('title'), W / 2, ty);
  ctx.shadowBlur = 0;
  ctx.restore();
  outText(ctx, S('subtitle'), W / 2, ty + 62, { size: 33, color: '#b8cfe8', sw: 5 });
  outText(ctx, S('tagline'), W / 2, ty + 104, { size: 24, color: 'rgba(184,207,232,0.75)', sw: 4 });

  // menu — iluminované položky: tmavý pergamenový pás s vlaštovčími konci,
  // zlatý lem, zlacená kapitálka (žádný holý bílý text)
  const items = titleMenuItems();
  let y = 668;
  for (const it of items) {
    const label = String(it.label);
    const cap = label.charAt(0), rest = label.slice(1);
    ctx.font = 'bold 46px ' + FONT;
    const capW = ctx.measureText(cap).width;
    ctx.font = '35px ' + FONT;
    const restW = ctx.measureText(rest).width;
    const tw = capW + restW;
    const bw = tw + 128, bh = 58;
    const x0 = W / 2 - bw / 2, y0 = y - 40;
    const hov = !it.dim && it.cb && uiBtn(x0, y0, bw, bh, it.cb);
    ctx.save();
    // pás s vykrojenými (vlaštovčími) konci
    ctx.globalAlpha = it.dim ? 0.45 : (hov ? 1 : 0.88);
    const bg = ctx.createLinearGradient(0, y0, 0, y0 + bh);
    bg.addColorStop(0, hov ? 'rgba(56,42,20,0.88)' : 'rgba(22,22,36,0.72)');
    bg.addColorStop(0.5, hov ? 'rgba(40,30,14,0.88)' : 'rgba(14,14,26,0.72)');
    bg.addColorStop(1, hov ? 'rgba(28,20,10,0.88)' : 'rgba(8,9,18,0.72)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + bw, y0);
    ctx.lineTo(x0 + bw - 17, y0 + bh / 2);
    ctx.lineTo(x0 + bw, y0 + bh);
    ctx.lineTo(x0, y0 + bh);
    ctx.lineTo(x0 + 17, y0 + bh / 2);
    ctx.closePath();
    ctx.fill();
    // zlatý lem pásu
    ctx.strokeStyle = it.dim ? 'rgba(150,140,110,0.30)'
      : (hov ? 'rgba(240,196,110,0.95)' : 'rgba(210,168,90,0.5)');
    ctx.lineWidth = hov ? 2.5 : 1.8;
    ctx.stroke();
    // drobné zlaté routy na špičkách zářezů
    ctx.fillStyle = it.dim ? 'rgba(150,140,110,0.35)' : (hov ? '#f2ca74' : 'rgba(210,168,90,0.7)');
    for (const dx of [26, bw - 26]) {
      ctx.beginPath();
      ctx.moveTo(x0 + dx, y0 + bh / 2 - 5);
      ctx.lineTo(x0 + dx + 4.5, y0 + bh / 2);
      ctx.lineTo(x0 + dx, y0 + bh / 2 + 5);
      ctx.lineTo(x0 + dx - 4.5, y0 + bh / 2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // text: zlacená kapitálka + řezaný serif se stínem
    const tx0 = W / 2 - tw / 2;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    const goldG = ctx.createLinearGradient(0, y - 36, 0, y + 8);
    goldG.addColorStop(0, '#f6d88a');
    goldG.addColorStop(0.55, '#e8b64c');
    goldG.addColorStop(1, '#b17c22');
    if (hov) { ctx.shadowColor = 'rgba(232,182,76,0.55)'; ctx.shadowBlur = 14; }
    // kapitálka
    ctx.font = 'bold 46px ' + FONT;
    ctx.strokeStyle = 'rgba(14,10,6,0.9)'; ctx.lineWidth = 6;
    ctx.strokeText(cap, tx0, y + 2);
    ctx.fillStyle = it.dim ? 'rgba(150,155,170,0.5)' : goldG;
    ctx.fillText(cap, tx0, y + 2);
    // zbytek slova
    ctx.font = '35px ' + FONT;
    ctx.strokeStyle = 'rgba(14,10,6,0.85)'; ctx.lineWidth = 5;
    ctx.strokeText(rest, tx0 + capW, y);
    ctx.fillStyle = it.dim ? 'rgba(140,148,164,0.45)' : (hov ? goldG : '#ecdfbe');
    ctx.fillText(rest, tx0 + capW, y);
    ctx.restore();
    y += 76;
  }
  outText(ctx, S('footer'), W / 2, H - 30, { size: 19, color: 'rgba(159,176,200,0.55)', sw: 3 });
  outText(ctx, L2('verze 2 · světlo, zvuk a hratelnost', 'version 2 · light, sound & play'), W - 40, H - 30, { size: 18, color: 'rgba(232,182,76,0.6)', sw: 3, align: 'right' });
}

/* -------------------------------------------- v2: pára od úst (zima!) */
const _puffs = [];
function updatePuffs(dt) {
  const def = G.scene;
  for (let i = _puffs.length - 1; i >= 0; i--) { _puffs[i].t += dt; if (_puffs[i].t > 2.2) _puffs.splice(i, 1); }
  if (!def || def.interior || def.id === 'observatory' || G.overlay) return;
  for (const a of actorsList()) {
    const ref = a.ref;
    const talking = G.say && G.say.c === a.id;
    ref._puffT = (ref._puffT == null ? Math.random() * 3 : ref._puffT) - dt * (talking ? 2.6 : 1);
    if (ref._puffT <= 0) {
      ref._puffT = 2.6 + Math.random() * 1.8;
      const ch = R.characters[a.id];
      const sc = sceneScale(a.y), hh = ((ch && ch.height) || 320) * sc;
      _puffs.push({ x: a.x + (a.dir || 1) * 26 * sc, y: a.y - hh * 0.8, dir: a.dir || 1, sc, t: 0, scene: G.sceneId });
    }
  }
}
function renderPuffs(ctx) {
  if (!_puffs.length) return;
  ctx.save();
  ctx.translate(-G.camX, 0);
  for (const p of _puffs) {
    if (p.scene !== G.sceneId) continue;
    const k = p.t / 2.2;
    const a = 0.28 * Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - k);
    if (a <= 0.005) continue;
    for (let j = 0; j < 3; j++) {
      const x = p.x + p.dir * (10 + k * 46 + j * 9) * p.sc;
      const y = p.y - (k * 24 + j * 4) * p.sc;
      const r = (7 + k * 26 + j * 4) * p.sc;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(240,246,255,' + (a * (1 - j * 0.25)).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(240,246,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------- update */
function update(dt) {
  G.time += dt;
  // fader
  const fd = G.faderTarget - G.fader;
  if (Math.abs(fd) > 0.0005) {
    G.fader += clamp(fd, -dt * 2.6, dt * 2.6);
    if (Math.abs(G.faderTarget - G.fader) <= 0.0005) {
      G.fader = G.faderTarget;
      const f = G.faderCb; G.faderCb = null;
      if (f) safeCall(f);
    }
  }
  // toasty
  for (const t2 of G.toasts) t2.t += dt;
  G.toasts = G.toasts.filter(t2 => t2.t < 3.4);
  if (G.invFlash) { G.invFlash.t += dt; if (G.invFlash.t > 0.9) G.invFlash = null; }
  if (G.invPeekT > 0) G.invPeekT -= dt;
  if (G.sceneNameT > 0) G.sceneNameT -= dt;

  if (G.mode !== 'play') return;
  if (G.overlay) return;

  // cutscéna: čekání
  if (G.cut && G.cut.wait > 0) {
    G.cut.wait -= dt;
    if (G.cut.wait <= 0) {
      const n = G.cut.next; G.cut.next = null;
      if (n) n();
    }
  }
  // řeč
  if (!G.say && G.sayQ.length) startSay(G.sayQ.shift());
  if (G.say) {
    G.say.time += dt;
    if (G.say.time >= G.say.dur) endSay(false);
  }
  // hráč
  const p = G.player, def = G.scene;
  if (def && p.walking) {
    const sc = sceneScale(p.y);
    const spd = p.speed * Math.max(0.35, sc) * (p.run ? 1.85 : 1);
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 5) {
      p.walking = false; p.run = false;
      if (p.faceDir) { p.dir = p.faceDir; p.faceDir = 0; }
      const f = p.onArrive; p.onArrive = null;
      if (f) safeCall(f);
    } else {
      const step = Math.min(d, spd * dt);
      let nx = p.x + (dx / d) * step, ny = p.y + (dy / d) * step;
      if (Math.abs(dx) > 3) p.dir = dx > 0 ? 1 : -1;
      const wa = def.walkArea;
      if (wa && wa.length > 2 && !pointInPoly(nx, ny, wa)) {
        if (pointInPoly(nx, p.y, wa)) { ny = p.y; p.ty = p.y; }
        else if (pointInPoly(p.x, ny, wa)) { nx = p.x; p.tx = p.x; }
        else {
          p.walking = false;
          const f = p.onArrive; p.onArrive = null;
          if (f) safeCall(f);
          nx = p.x; ny = p.y;
        }
      }
      const prevPh = p.ph;
      p.ph += step * 0.010 / (p.run ? 1.25 : 1);
      if (Math.floor(prevPh * 2) !== Math.floor(p.ph * 2)) {
        const pan = clamp(((p.x - G.camX) / W) * 2 - 1, -1, 1) * 0.6;
        const surf = def.stepSfx || (def.interior || def.id === 'observatory' ? 'sfx_step_wood' : 'sfx_snow_step');
        BNJ.sfx(surf, { pan, vol: p.run ? 1.15 : 1 });
        addFootprint();
      }
      p.x = nx; p.y = ny;
    }
  }
  // kamera
  if (def) {
    const target = clamp(p.x - W / 2, 0, def.width - W);
    G.camX = lerp(G.camX, target, 1 - Math.exp(-dt * 4.2));
    if (G.camLock != null) G.camX = clamp(G.camLock, 0, def.width - W);
  }
  updatePuffs(dt);
  G.showHsT = clamp(G.showHsT + ((G.showHs || G.hsKey) ? dt * 5 : -dt * 4), 0, 1);
  computeHover();
  if (G.hover && (!G.hovPrev || G.hover.hs !== G.hovPrev.hs || G.hover.exit !== G.hovPrev.exit)) BNJ.sfx('sfx_ui_hover');
  G.hovPrev = G.hover;
}

/* -------------------------------------------------------------- render */
function render() {
  const ctx = G.ctx;
  if (!ctx) return;
  G.ui.length = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  if (G.mode === 'title') {
    renderTitle(ctx);
    if (BNJ.fx) { try { BNJ.fx.screenFx(ctx, G.time, 'title'); } catch (e) { err('fx title', e); } }
  } else {
    renderScene(ctx);
    renderClickFx(ctx);
    renderHotspotHighlight(ctx);
    renderCutBars(ctx);
    renderSceneName(ctx);
    renderInventory(ctx);
    renderFlyItems(ctx);
    renderDialogChoices(ctx);
    renderSay(ctx);
    if (!G.overlay) { renderHoverLabel(ctx); renderCoin(ctx); }
    renderTopButtons(ctx);
  }
  renderToasts(ctx);
  if (G.overlay) renderOverlay(ctx);
  if (G.fader > 0.001) renderFader(ctx);
  renderCursor(ctx);
}

/* v2: kruhová clona (iris) à la klasické adventury, soustředěná na Jiříka */
function renderFader(ctx) {
  const f = G.fader;
  if (G.mode !== 'play' || !G.scene || BNJ.settings.fx === 0 || f > 0.995) {
    ctx.fillStyle = 'rgba(2,3,8,' + (f > 0.995 ? 1 : f).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const e = f * f * (3 - 2 * f);
  const sc = sceneScale(G.player.y);
  const cx = clamp(G.player.x - G.camX, 0, W), cy = G.player.y - 150 * sc;
  const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
  const r = Math.max(0, (1 - e) * maxR);
  ctx.save();
  ctx.fillStyle = '#020308';
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.arc(cx, cy, r, 0, TAU, true);
  ctx.fill();
  if (r > 2) {
    const g = ctx.createRadialGradient(cx, cy, Math.max(0, r - 60), cx, cy, r);
    g.addColorStop(0, 'rgba(2,3,8,0)'); g.addColorStop(1, 'rgba(2,3,8,0.85)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(232,182,76,' + (0.5 * Math.sin(Math.PI * e)).toFixed(3) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(2,3,8,' + (e * 0.25).toFixed(3) + ')';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* ---------------------------------------------------------------- loop */
let _lastTs = 0, _frameErrT = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (!_lastTs) _lastTs = ts;
  _dt = clamp((ts - _lastTs) / 1000, 0, 0.05);
  _lastTs = ts;
  try {
    update(_dt);
    render();
  } catch (e) {
    if (ts - _frameErrT > 1000) { _frameErrT = ts; err('Chyba ve frame', e); }
  }
}

/* ---------------------------------------------------------------- boot */
BNJ.boot = function (opts) {
  if (G.booted) return;
  G.booted = true;
  try { BNJ.state.lang = localStorage.getItem('bnj_lang') === 'en' ? 'en' : 'cz'; } catch (e) { /* ignore */ }
  const host = (opts && opts.parent) || document.getElementById('game') || document.body;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  cv.style.cursor = 'none';
  host.appendChild(cv);
  G.canvas = cv;
  G.ctx = cv.getContext('2d');

  function resize() {
    const w2 = window.innerWidth, h2 = window.innerHeight;
    const s = Math.min(w2 / W, h2 / H);
    G.cssScale = s;
    cv.style.width = Math.round(W * s) + 'px';
    cv.style.height = Math.round(H * s) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function toGame(e) {
    const r2 = cv.getBoundingClientRect();
    return [
      clamp((e.clientX - r2.left) / (r2.width / W), 0, W),
      clamp((e.clientY - r2.top) / (r2.height / H), 0, H)
    ];
  }
  cv.addEventListener('mousemove', (e) => {
    const p = toGame(e);
    G.mouse.x = p[0]; G.mouse.y = p[1]; G.mouse.inside = true;
  });
  cv.addEventListener('mouseleave', () => { G.mouse.inside = false; G.mouse.x = -100; G.mouse.y = -100; G.mouse.down = false; });
  cv.addEventListener('mousedown', (e) => {
    audio.unlock();
    const p = toGame(e);
    G.mouse.x = p[0]; G.mouse.y = p[1]; G.mouse.inside = true;
    if (e.button === 0) { G.mouse.down = true; onClick(); }
    else if (e.button === 2) onRightClick();
  });
  window.addEventListener('mouseup', () => {
    G.mouse.down = false;
    if (G._setDirty) { G._setDirty = false; BNJ.saveSettings(); }
  });
  // v2: dotyk — klepnutí = klik, podržení (0,5 s) = prohlédnout
  let _lp = null;
  cv.addEventListener('touchstart', (e) => {
    audio.unlock();
    G.touch = true;
    const t0 = e.changedTouches[0];
    const p = toGame(t0);
    G.mouse.x = p[0]; G.mouse.y = p[1]; G.mouse.inside = true;
    computeHover();
    _lp = { x: p[0], y: p[1], fired: false, timer: setTimeout(() => { _lp.fired = true; onRightClick(); }, 520) };
    e.preventDefault();
  }, { passive: false });
  cv.addEventListener('touchmove', (e) => {
    const p = toGame(e.changedTouches[0]);
    G.mouse.x = p[0]; G.mouse.y = p[1];
    if (_lp && dist(p[0], p[1], _lp.x, _lp.y) > 24) { clearTimeout(_lp.timer); }
    e.preventDefault();
  }, { passive: false });
  cv.addEventListener('touchend', (e) => {
    if (_lp) {
      clearTimeout(_lp.timer);
      if (!_lp.fired) { computeHover(); onClick(); }
      _lp = null;
    }
    G.mouse.inside = false;
    e.preventDefault();
  }, { passive: false });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (e) => {
    if (G.overlay === 'journal') {
      G.jScroll = clamp(G.jScroll + e.deltaY * 0.7, 0, G._jMax || 0);
      e.preventDefault();
    }
  }, { passive: false });
  window.addEventListener('keydown', (e) => { audio.unlock(); onKey(e); });
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => { G.hsKey = false; });

  G.mode = 'title';
  G.fader = 1;
  audio.play('title_theme');
  audio.playAmbience('amb_title');
  fadeTo(0);
  requestAnimationFrame(frame);
};

})();
