/* =========================================================================
   ZTRACENÝ LIST v2 — 65_ambience.js
   Okolní ruchy scén (čistá WebAudio syntéza, žádné soubory) + UI zvuky.

   Každá ambience = smyčka kontinuálních vrstev (vítr s nárazy, proud řeky,
   praskání ohně, šum trhu) a náhodně plánovaných „událostí" (vrány, psí
   štěk, sova, praskání ledu, tikot hodin, vzdálený zvon). Engine je
   crossfaduje při změně scény (audio.playAmbience) a pouští přes vlastní
   sběrnici s dozvukem, jehož vlhkost určuje audio.sceneReverb.
   ========================================================================= */
(function () {
'use strict';
const BNJ = window.BNJ;
const audio = BNJ && BNJ.audio;
if (!audio || !audio.registerAmbience) return;

const rnd = (a, b) => a + Math.random() * (b - a);
let _nz = null, _nzAc = null, _brown = null;
function noise(ac) {
  if (_nz && _nzAc === ac) return _nz;
  const len = ac.sampleRate * 3;
  _nz = ac.createBuffer(1, len, ac.sampleRate);
  const d = _nz.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  _brown = ac.createBuffer(1, len, ac.sampleRate);
  const b = _brown.getChannelData(0);
  let l = 0;
  for (let i = 0; i < len; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = l * 3.5; }
  _nzAc = ac;
  return _nz;
}
function brown(ac) { noise(ac); return _brown; }

function src(ac, buf) {
  const s = ac.createBufferSource();
  s.buffer = buf; s.loop = true;
  s.loopStart = Math.random() * 1.5;
  s.start(ac.currentTime, Math.random() * 2);
  return s;
}

/* vítr: šum → bandpass, jehož frekvence i hlasitost dýchá (nárazy) */
function wind(ac, out, base, vol, gusty) {
  const s = src(ac, noise(ac));
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = base; bp.Q.value = 0.8;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = base * 3;
  const g = ac.createGain(); g.gain.value = vol;
  const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
  s.connect(bp); bp.connect(lp); lp.connect(g);
  if (pan) { g.connect(pan); pan.connect(out); } else g.connect(out);
  let alive = true;
  const step = () => {
    if (!alive) return;
    const t = ac.currentTime, d = rnd(2.5, 6);
    const gust = gusty && Math.random() < 0.3;
    try {
      bp.frequency.linearRampToValueAtTime(base * (gust ? rnd(1.6, 2.4) : rnd(0.7, 1.3)), t + d);
      g.gain.linearRampToValueAtTime(vol * (gust ? rnd(1.6, 2.4) : rnd(0.5, 1.1)), t + d);
      if (pan) pan.pan.linearRampToValueAtTime(rnd(-0.6, 0.6), t + d);
    } catch (e) { /* ignore */ }
    setTimeout(step, d * 1000);
  };
  step();
  return () => { alive = false; try { s.stop(); } catch (e) { /* ignore */ } };
}

/* proud vody: hnědý šum přes lowpass + jemné bublání */
function river(ac, out, vol, cut) {
  const s = src(ac, brown(ac));
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut || 900;
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(lp); lp.connect(g); g.connect(out);
  const s2 = src(ac, noise(ac));
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 3;
  const g2 = ac.createGain(); g2.gain.value = vol * 0.12;
  const lfo = ac.createOscillator(); lfo.frequency.value = 0.31;
  const lg = ac.createGain(); lg.gain.value = 500;
  lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
  s2.connect(bp); bp.connect(g2); g2.connect(out);
  return () => { try { s.stop(); s2.stop(); lfo.stop(); } catch (e) { /* ignore */ } };
}

/* oheň: hluboké hučení + náhodné praskání */
function fire(ac, out, vol) {
  const s = src(ac, brown(ac));
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
  const g = ac.createGain(); g.gain.value = vol * 0.8;
  s.connect(lp); lp.connect(g); g.connect(out);
  let alive = true;
  const crack = () => {
    if (!alive) return;
    const t = ac.currentTime;
    const n = Math.random() < 0.25 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const b = ac.createBufferSource(); b.buffer = noise(ac);
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = rnd(1500, 4000);
      const eg = ac.createGain();
      const tt = t + i * rnd(0.02, 0.07);
      eg.gain.setValueAtTime(0, tt); eg.gain.linearRampToValueAtTime(vol * rnd(0.6, 1.6), tt + 0.002);
      eg.gain.exponentialRampToValueAtTime(0.0001, tt + rnd(0.02, 0.06));
      b.connect(hp); hp.connect(eg); eg.connect(out);
      b.start(tt, Math.random() * 2); b.stop(tt + 0.1);
    }
    setTimeout(crack, rnd(60, 420));
  };
  crack();
  return () => { alive = false; try { s.stop(); } catch (e) { /* ignore */ } };
}

/* šum davu: několik formantově filtrovaných šumů s pomalou modulací */
function crowd(ac, out, vol) {
  const stops = [];
  [[420, 6], [780, 7], [1250, 8], [2400, 9]].forEach(([f, q], i) => {
    const s = src(ac, noise(ac));
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ac.createGain(); g.gain.value = vol * (i === 0 ? 1 : 0.6);
    const lfo = ac.createOscillator(); lfo.frequency.value = rnd(2, 5);
    const lg = ac.createGain(); lg.gain.value = vol * 0.5;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    s.connect(bp); bp.connect(g); g.connect(out);
    stops.push(() => { s.stop(); lfo.stop(); });
  });
  return () => stops.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
}

/* plánovač náhodných událostí */
function events(list) {
  let alive = true;
  const tids = [];
  for (const ev of list) {
    const go = () => {
      if (!alive) return;
      try { ev.fn(); } catch (e) { /* ignore */ }
      tids.push(setTimeout(go, rnd(ev.min, ev.max) * 1000));
    };
    tids.push(setTimeout(go, rnd(ev.first != null ? ev.first : ev.min * 0.4, ev.min) * 1000));
  }
  return () => { alive = false; tids.forEach(clearTimeout); };
}
const sfx = (id, pan, vol) => BNJ.sfx(id, { pan: pan != null ? pan : rnd(-0.8, 0.8), vol: vol != null ? vol : rnd(0.25, 0.5) });

/* drobné syntetické hlasy prostředí */
function tone(ac, out, t, f0, f1, dur, vol, type) {
  const o = ac.createOscillator(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
function sparrows(ac, out, vol) {
  const t = ac.currentTime, n = 2 + (Math.random() * 4 | 0);
  const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
  const dst = p || out; if (p) { p.pan.value = rnd(-0.8, 0.8); p.connect(out); }
  for (let i = 0; i < n; i++) { const f = rnd(3600, 5200); tone(ac, dst, t + i * rnd(0.08, 0.16), f, f * rnd(0.7, 1.2), 0.06, vol); }
}
function owl(ac, out, vol) {
  const t = ac.currentTime;
  const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
  const dst = p || out; if (p) { p.pan.value = rnd(-0.9, 0.9); p.connect(out); }
  tone(ac, dst, t, 420, 380, 0.35, vol);
  tone(ac, dst, t + 0.6, 440, 360, 0.25, vol * 0.7);
  tone(ac, dst, t + 0.95, 450, 370, 0.7, vol);
}
function tick(ac, out, vol) {
  const t = ac.currentTime;
  for (let i = 0; i < 8; i++) {
    const b = ac.createBufferSource(); b.buffer = noise(ac);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = i % 2 ? 2600 : 3200; bp.Q.value = 12;
    const g = ac.createGain(); const tt = t + i * 0.5;
    g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(vol, tt + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.03);
    b.connect(bp); bp.connect(g); g.connect(out); b.start(tt, Math.random()); b.stop(tt + 0.05);
  }
}
function iceGroan(ac, out, vol) {
  const t = ac.currentTime;
  const o = ac.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(rnd(90, 160), t); o.frequency.exponentialRampToValueAtTime(rnd(40, 70), t + 1.2);
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 6;
  bp.frequency.exponentialRampToValueAtTime(220, t + 1.2);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 1.4);
}
function whisper(ac, out, vol) {
  // bludičky: dýchavé formantové „šepoty"
  const t = ac.currentTime, d = rnd(1.2, 2.2);
  const b = ac.createBufferSource(); b.buffer = noise(ac);
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9;
  bp.frequency.setValueAtTime(rnd(700, 1400), t); bp.frequency.linearRampToValueAtTime(rnd(1400, 2600), t + d);
  const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + d * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + d);
  b.connect(bp); bp.connect(g);
  if (p) { p.pan.setValueAtTime(rnd(-1, 0), t); p.pan.linearRampToValueAtTime(rnd(0, 1), t + d); g.connect(p); p.connect(out); } else g.connect(out);
  b.start(t, Math.random() * 2); b.stop(t + d + 0.1);
}

function amb(id, layers) {
  audio.registerAmbience(id, (ac, out) => {
    const stops = layers.map(f => f(ac, out)).filter(Boolean);
    return { stop() { stops.forEach(s => { try { s(); } catch (e) { /* ignore */ } }); } };
  });
}

amb('amb_castle', [
  (ac, o) => wind(ac, o, 420, 0.05, true),
  (ac, o) => events([
    { min: 7, max: 16, fn: () => sparrows(ac, o, 0.025) },
    { min: 25, max: 50, fn: () => sfx('sfx_crow', null, 0.18) },
    { min: 30, max: 70, fn: () => sfx('sfx_dog', 0.7, 0.16) }
  ])
]);
amb('amb_observatory', [
  (ac, o) => wind(ac, o, 260, 0.028, true),
  (ac, o) => fire(ac, o, 0.05),
  (ac, o) => events([
    { min: 6, max: 12, first: 1, fn: () => tick(ac, o, 0.05) },
    { min: 30, max: 60, fn: () => owl(ac, o, 0.04) }
  ])
]);
amb('amb_river', [
  (ac, o) => river(ac, o, 0.16, 1000),
  (ac, o) => wind(ac, o, 520, 0.035, true),
  (ac, o) => events([
    { min: 12, max: 26, fn: () => iceGroan(ac, o, 0.05) },
    { min: 18, max: 40, fn: () => sfx('sfx_crow', null, 0.16) },
    { min: 30, max: 60, fn: () => sfx('sfx_goose', 0.6, 0.14) }
  ])
]);
amb('amb_square', [
  (ac, o) => crowd(ac, o, 0.022),
  (ac, o) => wind(ac, o, 600, 0.02, false),
  (ac, o) => fire(ac, o, 0.018),
  (ac, o) => events([
    { min: 5, max: 12, fn: () => sparrows(ac, o, 0.022) },
    { min: 40, max: 80, fn: () => sfx('sfx_bell', 0.2, 0.12) }
  ])
]);
amb('amb_oldtown', [
  (ac, o) => fire(ac, o, 0.07),
  (ac, o) => river(ac, o, 0.05, 600),
  (ac, o) => wind(ac, o, 340, 0.03, true),
  (ac, o) => events([
    { min: 20, max: 45, fn: () => owl(ac, o, 0.035) },
    { min: 30, max: 70, fn: () => sfx('sfx_dog', -0.7, 0.12) }
  ])
]);
amb('amb_marsh', [
  (ac, o) => wind(ac, o, 300, 0.06, true),
  (ac, o) => wind(ac, o, 900, 0.015, true),
  (ac, o) => events([
    { min: 8, max: 18, fn: () => whisper(ac, o, 0.035) },
    { min: 10, max: 22, fn: () => iceGroan(ac, o, 0.06) },
    { min: 20, max: 40, fn: () => sfx('sfx_crow', null, 0.14) },
    { min: 30, max: 60, fn: () => owl(ac, o, 0.03) }
  ])
]);
amb('amb_title', [
  (ac, o) => wind(ac, o, 360, 0.035, true),
  (ac, o) => events([{ min: 25, max: 50, fn: () => owl(ac, o, 0.025) }])
]);

audio.sceneAmbience = {
  castle_yard: 'amb_castle', observatory: 'amb_observatory', river_bank: 'amb_river',
  square: 'amb_square', old_town: 'amb_oldtown', marsh: 'amb_marsh'
};
audio.sceneReverb = {
  castle_yard: 0.38, observatory: 0.62, river_bank: 0.3, square: 0.26, old_town: 0.34, marsh: 0.55
};

/* ================================================================= UI SFX */
function defSfx(id, vol, build) {
  audio.registerSfx(id, (ac, out) => { out.gain.value = vol; build(ac, out, ac.currentTime + 0.005); });
}
defSfx('sfx_ui_hover', 0.05, (ac, o, t) => tone(ac, o, t, 1900, 2300, 0.05, 1));
defSfx('sfx_ui_click', 0.12, (ac, o, t) => { tone(ac, o, t, 900, 600, 0.06, 1, 'triangle'); tone(ac, o, t + 0.01, 2400, 1800, 0.03, 0.4); });
defSfx('sfx_coin_open', 0.16, (ac, o, t) => {
  // kovové cinknutí mince + závan
  [1320, 1980, 2640].forEach((f, i) => tone(ac, o, t + i * 0.012, f, f * 0.995, 0.35 - i * 0.08, 0.6 / (i + 1)));
  const b = ac.createBufferSource(); b.buffer = noise(ac);
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(800, t); bp.frequency.exponentialRampToValueAtTime(3000, t + 0.15);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  b.connect(bp); bp.connect(g); g.connect(o); b.start(t); b.stop(t + 0.2);
});
defSfx('sfx_inv_open', 0.18, (ac, o, t) => {
  // kožená brašna: tlumený šum + klapnutí
  const b = ac.createBufferSource(); b.buffer = brown(ac);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  b.connect(lp); lp.connect(g); g.connect(o); b.start(t); b.stop(t + 0.3);
  tone(ac, o, t + 0.12, 220, 140, 0.06, 0.6, 'triangle');
});
defSfx('sfx_page', 0.2, (ac, o, t) => {
  const b = ac.createBufferSource(); b.buffer = noise(ac);
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(1200, t); bp.frequency.exponentialRampToValueAtTime(4200, t + 0.22);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.8, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  b.connect(bp); bp.connect(g); g.connect(o); b.start(t, Math.random()); b.stop(t + 0.32);
});
defSfx('sfx_hint', 0.12, (ac, o, t) => {
  [74, 78, 81, 86].forEach((m, i) => { const f = 440 * Math.pow(2, (m - 69) / 12); tone(ac, o, t + i * 0.07, f, f, 0.6, 0.5); });
});
defSfx('sfx_step_wood', 0.3, (ac, o, t) => {
  tone(ac, o, t, rnd(140, 180), 70, 0.08, 0.8, 'triangle');
  const b = ac.createBufferSource(); b.buffer = noise(ac);
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rnd(500, 800); bp.Q.value = 2;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  b.connect(bp); bp.connect(g); g.connect(o); b.start(t, Math.random() * 2); b.stop(t + 0.1);
  if (Math.random() < 0.12) tone(ac, o, t + 0.04, rnd(300, 420), rnd(250, 500), 0.25, 0.08, 'sawtooth'); // vrznutí prkna
});

})();
