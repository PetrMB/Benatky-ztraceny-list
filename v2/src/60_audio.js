/* ============================================================================
 * 60_audio.js — „Ztracený list" • hudba + SFX (čistá WebAudio syntéza)
 * ----------------------------------------------------------------------------
 * Renesanční instrumentace bez jediného externího souboru:
 *   • loutna    — Karplus-Strong (předpočítaný vybuzený string do bufferu)
 *   • flétna    — sinus + zpožděné vibrato + dechový šum (bandpass)
 *   • viola     — dvě rozladěné pily + lowpass, pomalý nástup smyčce
 *   • zvony     — 2-op FM s inharmonickým poměrem 2.76 + spodní „hum" parciála
 *   • skřipky   — pila + výrazné vibrato + formantový bandpass (Bendovy housle)
 *   • sníh-pad  — loopovaný šum přes pomalu dýchající lowpass
 *
 * Leitmotivy dle GAME_DESIGN.md §6: Jiřík (stoupavá kvarta, dorský),
 * Brahe (klesající půltón + zvon), Jizera (perpetuum arpeggio),
 * Benda (skočná). Smyčky plánuje lookahead sekvencer — žádné lupání,
 * crossfade řeší engine (fade-in/out na předaném gain uzlu), stop()
 * jen ukončí plánování a nechá doznít release.
 * Adaptivní vrstvy: části sekvenceru mají `when()` — čtou BNJ.state
 * (flagy / inventář) a vrstva se přidá až po odemčení, beze švů,
 * protože časová osa části běží dál i když je vrstva němá.
 * Master limiter: každý track i SFX jde přes DynamicsCompressor
 * v limiter režimu, aby souzvuky nikdy neclipovaly.
 * Start zvuku až po prvním gestu uživatele zajišťuje engine (audio.unlock).
 * ========================================================================== */
(function () {
  'use strict';
  const audio = window.BNJ.audio;

  /* ------------------------------------------------------------ utility -- */

  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);

  const ST = () => (window.BNJ.state || { flags: {}, inventory: [] });
  const hasFlag = (n) => !!ST().flags[n];
  const hasItem = (n) => (ST().inventory || []).indexOf(n) >= 0;
  const anyFragment = () =>
    hasItem('frag_a') || hasItem('frag_b') || hasItem('frag_c') || hasFlag('letter_read');

  /* Sdílený 2s buffer bílého šumu (cache na AudioContext). */
  let _noise = null, _noiseAc = null;
  function noiseBuf(ac) {
    if (_noise && _noiseAc === ac) return _noise;
    const len = Math.floor(ac.sampleRate * 2);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    _noise = buf; _noiseAc = ac;
    return buf;
  }

  /* Limiter — poslední článek každého tracku/SFX před engine gainem. */
  function limiter(ac, out) {
    const c = ac.createDynamicsCompressor();
    c.threshold.value = -9;
    c.knee.value = 6;
    c.ratio.value = 14;
    c.attack.value = 0.003;
    c.release.value = 0.22;
    c.connect(out);
    return c;
  }

  /* --------------------------------------------------- loutna (K-Strong) -- */
  /* Struna se předpočítá do bufferu: šumový úder → kruhový buffer
   * s půleným průměrovacím filtrem (klasický Karplus-Strong).            */
  const _ksCache = new Map();
  let _ksAc = null;
  function ksBuffer(ac, freq, bright) {
    if (_ksAc !== ac) { _ksCache.clear(); _ksAc = ac; }
    const key = Math.round(freq) + '|' + bright;
    if (_ksCache.has(key)) return _ksCache.get(key);
    const sr = ac.sampleRate;
    const N = Math.max(2, Math.round(sr / freq));
    const dur = clamp(6 / Math.sqrt(freq / 110), 1.2, 3.2);
    const len = Math.ceil(sr * dur);
    const buf = ac.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) {
      const w = Math.random() * 2 - 1;
      prev = bright * w + (1 - bright) * prev;   /* měkčí drnknutí */
      ring[i] = prev;
    }
    /* Útlum závislý na výšce → vyrovnaná délka dozvuku přes rejstřík. */
    const damp = Math.exp(-freq / (sr * 14));
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const cur = ring[idx];
      const nxt = ring[(idx + 1) % N];
      out[i] = cur;
      ring[idx] = damp * 0.5 * (cur + nxt);
      idx = (idx + 1) % N;
    }
    /* Krátký fade okrajů proti DC lupnutí. */
    const f = Math.min(64, len >> 2);
    for (let i = 0; i < f; i++) { out[i] *= i / f; out[len - 1 - i] *= i / f; }
    _ksCache.set(key, buf);
    return buf;
  }

  function luteN(ac, dest, t, freq, dur, vel) {
    const src = ac.createBufferSource();
    src.buffer = ksBuffer(ac, freq, 0.62);
    const g = ac.createGain();
    g.gain.setValueAtTime(vel, t);
    g.connect(dest);
    src.connect(g);
    src.start(t);
    src.stop(t + src.buffer.duration);
  }
  /* Jasnější, kratší drnk pro rytmické štrejchy. */
  function luteMuteN(ac, dest, t, freq, dur, vel) {
    const src = ac.createBufferSource();
    src.buffer = ksBuffer(ac, freq, 0.85);
    const g = ac.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.5, dur + 0.2));
    g.connect(dest);
    src.connect(g);
    src.start(t);
    src.stop(t + Math.min(0.6, dur + 0.3));
  }

  /* ------------------------------------------------------------- flétna -- */
  function fluteN(ac, dest, t, freq, dur, vel) {
    const g = ac.createGain();
    const a = Math.min(0.09, dur * 0.35);
    const r = Math.min(0.28, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + a);
    g.gain.setValueAtTime(vel, Math.max(t + a, t + dur - r));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.06);
    g.connect(dest);

    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * rnd(0.998, 1.002), t);
    o.connect(g);
    const o2 = ac.createOscillator();               /* dech oktávy – barva */
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(freq * 2.001, t);
    const g2 = ac.createGain();
    g2.gain.value = 0.10;
    o2.connect(g2); g2.connect(g);

    /* zpožděné vibrato */
    const lfo = ac.createOscillator();
    lfo.frequency.setValueAtTime(rnd(4.4, 5.2), t);
    const lg = ac.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(freq * 0.008, t + Math.min(0.4, dur * 0.6));
    lfo.connect(lg); lg.connect(o.frequency);

    /* dechový šum */
    const n = ac.createBufferSource();
    n.buffer = noiseBuf(ac); n.loop = true;
    n.playbackRate.value = rnd(0.9, 1.1);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq * 2; bp.Q.value = 9;
    const ng = ac.createGain();
    ng.gain.value = vel * 0.16;
    n.connect(bp); bp.connect(ng); ng.connect(g);

    const end = t + dur + 0.12;
    o.start(t); o2.start(t); lfo.start(t); n.start(t, rnd(0, 1));
    o.stop(end); o2.stop(end); lfo.stop(end); n.stop(end);
  }

  /* -------------------------------------------------------------- viola -- */
  function violaN(ac, dest, t, freq, dur, vel) {
    const g = ac.createGain();
    const a = Math.min(0.14, dur * 0.4);
    const r = Math.min(0.3, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + a);
    g.gain.setValueAtTime(vel, Math.max(t + a, t + dur - r));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.08);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * 2.2, t);
    lp.frequency.linearRampToValueAtTime(freq * 3.4, t + a * 2);   /* smyčec se opře */
    lp.Q.value = 1.1;
    lp.connect(g); g.connect(dest);
    const s1 = ac.createOscillator();
    s1.type = 'sawtooth'; s1.frequency.setValueAtTime(freq, t); s1.detune.value = -5;
    const s2 = ac.createOscillator();
    s2.type = 'sawtooth'; s2.frequency.setValueAtTime(freq, t); s2.detune.value = 5;
    const mix = ac.createGain(); mix.gain.value = 0.5;
    s1.connect(mix); s2.connect(mix); mix.connect(lp);
    const end = t + dur + 0.15;
    s1.start(t); s2.start(t); s1.stop(end); s2.stop(end);
  }

  /* --------------------------------------------------------------- zvon -- */
  function bellN(ac, dest, t, freq, dur, vel) {
    const decay = clamp(dur * 1.4, 0.8, 6);
    const c = ac.createOscillator();
    c.type = 'sine'; c.frequency.setValueAtTime(freq, t);
    const m = ac.createOscillator();
    m.type = 'sine'; m.frequency.setValueAtTime(freq * 2.76, t);   /* inharmonické */
    const mg = ac.createGain();
    mg.gain.setValueAtTime(freq * 2.4, t);
    mg.gain.exponentialRampToValueAtTime(freq * 0.02, t + decay * 0.65);
    m.connect(mg); mg.connect(c.frequency);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    c.connect(g); g.connect(dest);
    /* spodní hum parciála */
    const h = ac.createOscillator();
    h.type = 'sine'; h.frequency.setValueAtTime(freq * 0.5, t);
    const hg = ac.createGain();
    hg.gain.setValueAtTime(0.0001, t);
    hg.gain.linearRampToValueAtTime(vel * 0.35, t + 0.015);
    hg.gain.exponentialRampToValueAtTime(0.0001, t + decay * 1.25);
    h.connect(hg); hg.connect(dest);
    const end = t + decay * 1.3 + 0.1;
    c.start(t); m.start(t); h.start(t);
    c.stop(end); m.stop(end); h.stop(end);
  }
  /* Zvonkohra — kratší, tišší doznění pro melodické linky v observatoři. */
  function chimeN(ac, dest, t, freq, dur, vel) {
    bellN(ac, dest, t, freq, Math.min(dur, 1.1), vel * 0.8);
  }

  /* ----------------------------------------------- skřipky (Benda) ------ */
  function fiddleN(ac, dest, t, freq, dur, vel) {
    const g = ac.createGain();
    const a = Math.min(0.05, dur * 0.3);
    const r = Math.min(0.14, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + a);
    g.gain.setValueAtTime(vel, Math.max(t + a, t + dur - r));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.7;
    const bp = ac.createBiquadFilter();                     /* formant korpusu */
    bp.type = 'bandpass'; bp.frequency.value = 950; bp.Q.value = 0.9;
    const bg = ac.createGain(); bg.gain.value = 0.9;
    const s = ac.createOscillator();
    s.type = 'sawtooth'; s.frequency.setValueAtTime(freq * rnd(0.997, 1.003), t);
    const lfo = ac.createOscillator();
    lfo.frequency.setValueAtTime(rnd(5.6, 6.4), t);
    const lg = ac.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(freq * 0.013, t + Math.min(0.18, dur * 0.5));
    lfo.connect(lg); lg.connect(s.frequency);
    s.connect(bp); bp.connect(bg); bg.connect(lp); lp.connect(g); g.connect(dest);
    /* škrábnutí smyčce na začátku tahu */
    const n = ac.createBufferSource();
    n.buffer = noiseBuf(ac); n.loop = true;
    const nf = ac.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 2400; nf.Q.value = 2;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(vel * 0.25, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.connect(nf); nf.connect(ng); ng.connect(dest);
    const end = t + dur + 0.1;
    s.start(t); lfo.start(t); n.start(t, rnd(0, 1));
    s.stop(end); lfo.stop(end); n.stop(t + 0.09);
  }

  const INSTR = {
    lute: luteN, luteMute: luteMuteN, flute: fluteN,
    viola: violaN, bell: bellN, chime: chimeN, fiddle: fiddleN
  };

  /* ------------------------------------------- kontinuální vrstvy (pady) -- */

  /* Tichý sníh — dýchající filtrovaný šum. Vrací stop(). */
  function snowPad(ac, dest, baseHz, vol) {
    const n = ac.createBufferSource();
    n.buffer = noiseBuf(ac); n.loop = true;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = baseHz; lp.Q.value = 0.6;
    const g = ac.createGain();
    const t0 = ac.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 3.5);
    const lfo = ac.createOscillator();
    lfo.frequency.value = rnd(0.04, 0.08);
    const lg = ac.createGain(); lg.gain.value = baseHz * 0.45;
    lfo.connect(lg); lg.connect(lp.frequency);
    /* druhé, pomalejší dýchání hlasitosti */
    const lfo2 = ac.createOscillator();
    lfo2.frequency.value = rnd(0.02, 0.05);
    const lg2 = ac.createGain(); lg2.gain.value = vol * 0.35;
    lfo2.connect(lg2); lg2.connect(g.gain);
    n.connect(lp); lp.connect(g); g.connect(dest);
    n.start(t0, rnd(0, 1)); lfo.start(t0); lfo2.start(t0);
    return () => {
      const e = ac.currentTime + 2.3;
      try { n.stop(e); lfo.stop(e); lfo2.stop(e); } catch (err) { /* ignore */ }
    };
  }

  /* Violový drone (kvinta) — dvě rozladěné pily, pomalé vlnění. */
  function droneViola(ac, dest, midiRoot, vol) {
    const t0 = ac.currentTime;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 4);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = midiHz(midiRoot) * 3; lp.Q.value = 0.8;
    lp.connect(g); g.connect(dest);
    const oscs = [];
    [[midiRoot, -6], [midiRoot, 6], [midiRoot + 7, -4]].forEach((sp) => {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiHz(sp[0]);
      o.detune.value = sp[1];
      const og = ac.createGain(); og.gain.value = 0.4;
      o.connect(og); og.connect(lp);
      o.start(t0); oscs.push(o);
    });
    const lfo = ac.createOscillator();
    lfo.frequency.value = rnd(0.06, 0.11);
    const lg = ac.createGain(); lg.gain.value = vol * 0.3;
    lfo.connect(lg); lg.connect(g.gain);
    lfo.start(t0); oscs.push(lfo);
    return () => {
      const e = ac.currentTime + 2.3;
      oscs.forEach((o) => { try { o.stop(e); } catch (err) { /* ignore */ } });
    };
  }

  /* ---------------------------------------------------------- sekvencer -- */
  /* parts: { i:'lute', seq:[[midi|null,doby],…], g, oct, legato, when }
   * Každá část má vlastní časovou osu — běží dál, i když when()==false,
   * takže se adaptivní vrstva připojí přesně v tempu.                     */
  function runSequencer(ac, dest, parts, tempo) {
    const spb = 60 / tempo;
    const ps = parts.map((p) => ({
      def: p, idx: 0, t: ac.currentTime + 0.08 + (p.delay || 0) * spb
    }));
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const horizon = ac.currentTime + 0.65;
      for (const p of ps) {
        const d = p.def;
        let guard = 0;
        while (p.t < horizon && guard++ < 96) {
          const step = d.seq[p.idx];
          const m = step[0], beats = step[1];
          if (m !== null && (!d.when || d.when())) {
            const jt = rnd(-0.007, 0.007);
            const vel = (d.g || 0.5) * rnd(0.86, 1.12);
            INSTR[d.i](ac, dest, Math.max(p.t + jt, ac.currentTime),
              midiHz(m + (d.oct || 0)), beats * spb * (d.legato || 0.92), vel);
          }
          p.t += beats * spb;
          p.idx = (p.idx + 1) % d.seq.length;
        }
      }
    };
    tick();
    const iv = setInterval(tick, 140);
    return () => { alive = false; clearInterval(iv); };
  }

  /* Registrace tracku: parts + volitelné kontinuální vrstvy. */
  function defTrack(id, tempo, partsFn, contFns) {
    audio.registerTrack(id, (ac, out) => {
      const lim = limiter(ac, out);
      const stops = [];
      if (contFns) for (const f of contFns) stops.push(f(ac, lim));
      stops.push(runSequencer(ac, lim, partsFn(), tempo));
      return {
        stop() {
          for (const s of stops) { try { s(); } catch (e) { /* ignore */ } }
        }
      };
    });
  }

  /* ============================== TRACKY ================================ */
  /* Melodie = kánon z GAME_DESIGN.md §6.2 (midi, doby), ~92 BPM.          */

  /* --- title_theme — Jiříkův motiv (d dorský) nad hvězdným drone -------- */
  defTrack('title_theme', 66, () => [
    { i: 'flute', g: 0.4, legato: 0.98,
      seq: [[62,1],[65,1],[69,1],[74,2],[72,1],[69,1],[67,1],[69,3],[65,1],[67,1],[62,4]] },
    { i: 'lute', g: 0.3,          /* perpetuum arpeggio, fázuje proti melodii */
      seq: [[50,.5],[57,.5],[62,.5],[65,.5],[69,.5],[65,.5],[62,.5],[57,.5]] },
    { i: 'bell', g: 0.14,          /* vzdálený zvon jednou za smyčku */
      seq: [[50,17]] }
  ], [
    (ac, lim) => snowPad(ac, lim, 420, 0.05),
    (ac, lim) => droneViola(ac, lim, 38, 0.05)
  ]);

  /* --- castle_theme — slavnostní D dur, zvony na těžké doby ------------- */
  defTrack('castle_theme', 92, () => [
    { i: 'lute', g: 0.5,
      seq: [[50,2],[57,2],[62,1],[66,1],[69,2],[67,1],[66,1],[64,2],[62,2],[57,2],[62,4]] },
    { i: 'bell', g: 0.2,
      seq: [[50,4],[45,4],[50,4],[45,4],[50,4]] },
    { i: 'viola', g: 0.16, legato: 0.96,
      seq: [[38,4],[42,2],[45,2],[43,4],[45,4],[38,4]] },
    { i: 'flute', g: 0.24, when: () => hasFlag('knows_quest'),   /* adaptivní deskant */
      seq: [[null,4],[74,2],[78,2],[81,2],[79,1],[78,1],[76,2],[74,2],[73,1],[74,3]] }
  ], [
    (ac, lim) => snowPad(ac, lim, 360, 0.035)
  ]);

  /* --- observatory_theme — e frygický, viola drone + zvonkohra ---------- */
  defTrack('observatory_theme', 60, () => [
    { i: 'chime', g: 0.26, legato: 1,
      seq: [[64,2],[65,1],[67,1],[71,2],[67,1],[65,1],[64,4],[59,2],[64,6]] },
    { i: 'bell', g: 0.12,
      seq: [[40,10],[null,10]] },
    { i: 'chime', g: 0.12, when: () => hasFlag('letter_read'),   /* hvězdný třpyt */
      seq: [[76,.5],[79,.5],[83,.5],[88,.5],[null,2]] }
  ], [
    (ac, lim) => droneViola(ac, lim, 40, 0.08),
    (ac, lim) => snowPad(ac, lim, 300, 0.03)
  ]);

  /* --- river_theme — loutnové perpetuum, plyne jako Jizera -------------- */
  defTrack('river_theme', 96, () => [
    { i: 'lute', g: 0.45,
      seq: [[55,.5],[59,.5],[62,.5],[67,.5],[66,.5],[62,.5],[60,1],[59,1],[57,.5],[59,.5],[55,2]] },
    { i: 'flute', g: 0.2, legato: 0.98,
      seq: [[67,4],[66,2],[62,2]] },
    { i: 'lute', g: 0.24, oct: 12, when: anyFragment,            /* naděje o oktávu výš */
      seq: [[55,.5],[59,.5],[62,.5],[67,.5],[66,.5],[62,.5],[60,1],[59,1],[57,.5],[59,.5],[55,2]] }
  ], [
    (ac, lim) => snowPad(ac, lim, 520, 0.05)
  ]);

  /* --- square_theme — trhová skočná C dur ------------------------------- */
  defTrack('square_theme', 104, () => [
    { i: 'flute', g: 0.4,
      seq: [[60,.5],[64,.5],[67,.5],[64,.5],[69,1],[67,.5],[65,.5],[64,.5],[62,.5],[60,2],[67,1],[60,1]] },
    { i: 'lute', g: 0.4,
      seq: [[48,1],[55,1],[48,1],[55,1],[48,1],[53,1],[55,1],[48,2]] },
    { i: 'luteMute', g: 0.2, delay: 0.5,          /* štrejch na lehkou dobu */
      seq: [[64,1]] },
    { i: 'flute', g: 0.22, when: () => hasFlag('gossip_told'),   /* Bětčina tercie */
      seq: [[64,.5],[67,.5],[71,.5],[67,.5],[72,1],[71,.5],[69,.5],[67,.5],[65,.5],[64,2],[71,1],[64,1]] }
  ], [
    (ac, lim) => snowPad(ac, lim, 380, 0.03)
  ]);

  /* --- oldtown_theme — Bendův motiv, skřipky (a moll) ------------------- */
  defTrack('oldtown_theme', 100, () => [
    { i: 'fiddle', g: 0.34,
      seq: [[69,.5],[72,.5],[76,1],[74,.5],[72,.5],[71,1],[72,.5],[74,.5],[76,1],[73,.5],[74,.5],[69,2]] },
    { i: 'lute', g: 0.36,
      seq: [[45,1],[52,1],[45,1],[52,1],[45,1],[52,1],[43,1],[45,2]] },
    { i: 'fiddle', g: 0.2, when: () => hasFlag('formule_known'), /* druhý hlas v tercii */
      seq: [[65,.5],[69,.5],[72,1],[71,.5],[69,.5],[68,1],[69,.5],[71,.5],[72,1],[69,.5],[71,.5],[65,2]] }
  ], [
    (ac, lim) => snowPad(ac, lim, 340, 0.035)
  ]);

  /* --- marsh_theme — nízký drone + váhavá flétna (d moll) --------------- */
  defTrack('marsh_theme', 56, () => [
    { i: 'flute', g: 0.24, legato: 0.85,
      seq: [[50,3],[53,1],[55,2],[53,1],[50,4],[46,2],[50,4]] },
    { i: 'bell', g: 0.09,
      seq: [[38,17]] },
    { i: 'chime', g: 0.08, when: () => hasItem('frag_c'),        /* bludičky ztichly */
      seq: [[86,3],[null,5],[89,4],[null,5]] }
  ], [
    (ac, lim) => droneViola(ac, lim, 38, 0.075),
    (ac, lim) => snowPad(ac, lim, 260, 0.06)
  ]);

  /* --- finale_theme — Jiříkův motiv v D dur + Brahovy zvony, plné vrstvy */
  defTrack('finale_theme', 84, () => [
    { i: 'flute', g: 0.42, legato: 0.98,
      seq: [[62,1],[66,1],[69,1],[74,2],[73,.5],[74,.5],[76,2],[74,1],[71,1],[69,1],[66,1],[62,4]] },
    { i: 'bell', g: 0.22,
      seq: [[50,4],[45,4],[47,4],[50,4]] },
    { i: 'viola', g: 0.17, legato: 0.96,
      seq: [[38,4],[43,4],[45,4],[38,4]] },
    { i: 'lute', g: 0.3,
      seq: [[50,.5],[57,.5],[62,.5],[66,.5],[69,.5],[66,.5],[62,.5],[57,.5]] }
  ], [
    (ac, lim) => snowPad(ac, lim, 420, 0.04)
  ]);

  /* Mapování scén → hudba (finale_theme spouští cutscéna přes music krok). */
  audio.sceneMusic = {
    title: 'title_theme',
    castle_yard: 'castle_theme',
    observatory: 'observatory_theme',
    river_bank: 'river_theme',
    square: 'square_theme',
    old_town: 'oldtown_theme',
    marsh: 'marsh_theme'
  };

  /* ================================ SFX ================================= */
  /* Engine předává čerstvý gain uzel; nastavíme mu celkovou hlasitost
   * a stavíme do limiteru, aby ani vrstvené SFX nepřebudily mix.          */
  function defSfx(id, vol, build) {
    audio.registerSfx(id, (ac, out) => {
      out.gain.value = vol;
      build(ac, limiter(ac, out), ac.currentTime + 0.01);
    });
  }

  /* šumový burst přes filtr — základ mnoha ruchů */
  function burst(ac, dest, t, dur, type, f0, f1, q, vel) {
    const n = ac.createBufferSource();
    n.buffer = noiseBuf(ac); n.loop = true;
    const fl = ac.createBiquadFilter();
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + Math.min(0.012, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(fl); fl.connect(g); g.connect(dest);
    n.start(t, rnd(0, 1.5)); n.stop(t + dur + 0.05);
  }

  /* sinusový chirp (kapky, žbluňk, štěknutí…) */
  function chirp(ac, dest, t, dur, f0, f1, vel, type) {
    const o = ac.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(25, f1), t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + Math.min(0.01, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.03);
  }

  /* --- sfx_splash — žbluňknutí u jezu ----------------------------------- */
  defSfx('sfx_splash', 0.7, (ac, lim, t) => {
    chirp(ac, lim, t, 0.09, 480, 140, 0.55);                       /* žbluňk */
    burst(ac, lim, t + 0.02, 0.5, 'lowpass', 1500, 320, 0.8, 0.5); /* hlavní šplouch */
    burst(ac, lim, t + 0.12, 0.7, 'bandpass', 2600, 900, 1.4, 0.2);/* spršky */
    for (let i = 0; i < 5; i++) {                                   /* kapky */
      const dt = 0.2 + i * rnd(0.05, 0.1);
      chirp(ac, lim, t + dt, 0.05, rnd(900, 1700), rnd(300, 500), 0.12);
    }
  });

  /* --- sfx_ice_crack — prasknutí ledu ----------------------------------- */
  defSfx('sfx_ice_crack', 0.75, (ac, lim, t) => {
    burst(ac, lim, t, 0.05, 'highpass', 2400, 2400, 0.7, 0.8);     /* křupnutí */
    chirp(ac, lim, t + 0.01, 0.5, 420, 48, 0.5);                   /* táhlé puknutí */
    for (let i = 0; i < 4; i++) {                                   /* trhlinky běží */
      const dt = 0.08 + i * rnd(0.05, 0.09);
      burst(ac, lim, t + dt, 0.04, 'bandpass', rnd(1400, 3200), 900, 3, 0.3);
    }
    burst(ac, lim, t + 0.05, 0.6, 'lowpass', 260, 70, 0.8, 0.35);  /* dunění pod ledem */
  });

  /* --- sfx_goose — Markyta syčí a kejhá --------------------------------- */
  defSfx('sfx_goose', 0.55, (ac, lim, t) => {
    burst(ac, lim, t, 0.28, 'bandpass', 3400, 2600, 1.2, 0.3);     /* sssss */
    for (let i = 0; i < 2; i++) {                                   /* gag-gag */
      const t0 = t + 0.3 + i * 0.22;
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300 + i * 40, t0);
      o.frequency.exponentialRampToValueAtTime(210, t0 + 0.16);
      const am = ac.createOscillator(); am.frequency.value = 26;    /* chraplavé AM */
      const amg = ac.createGain(); amg.gain.value = 0.5;
      const base = ac.createGain(); base.gain.value = 0.5;
      am.connect(amg);
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.6;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.5, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      o.connect(base); base.connect(bp); amg.connect(base.gain);
      bp.connect(g); g.connect(lim);
      o.start(t0); am.start(t0); o.stop(t0 + 0.2); am.stop(t0 + 0.2);
    }
  });

  /* --- sfx_bell — zvon z věže (i ohlášení Keplera) ---------------------- */
  defSfx('sfx_bell', 0.6, (ac, lim, t) => {
    bellN(ac, lim, t, midiHz(57), 4.5, 0.55);
    bellN(ac, lim, t + 1.6, midiHz(57) * rnd(0.996, 1.004), 4.5, 0.45);
  });

  /* --- sfx_crow — vrány na hřebeni -------------------------------------- */
  defSfx('sfx_crow', 0.5, (ac, lim, t) => {
    for (let i = 0; i < 2; i++) {
      const t0 = t + i * rnd(0.28, 0.36);
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(rnd(620, 700), t0);
      o.frequency.exponentialRampToValueAtTime(430, t0 + 0.18);
      const am = ac.createOscillator(); am.frequency.value = 42;
      const amg = ac.createGain(); amg.gain.value = 0.55;
      const base = ac.createGain(); base.gain.value = 0.45;
      am.connect(amg); amg.connect(base.gain);
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.1;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.5, t0 + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(base); base.connect(bp); bp.connect(g); g.connect(lim);
      o.start(t0); am.start(t0); o.stop(t0 + 0.22); am.stop(t0 + 0.22);
    }
  });

  /* --- sfx_dog — Ryšák: haf + funění ------------------------------------ */
  defSfx('sfx_dog', 0.6, (ac, lim, t) => {
    chirp(ac, lim, t, 0.12, 620, 130, 0.5, 'square');              /* haf */
    burst(ac, lim, t, 0.1, 'lowpass', 900, 300, 0.8, 0.4);
    burst(ac, lim, t + 0.35, 0.18, 'lowpass', 500, 250, 0.8, 0.18);/* funí */
    burst(ac, lim, t + 0.6, 0.18, 'lowpass', 500, 250, 0.8, 0.14);
  });

  /* --- sfx_grind — hmoždíř tře duběnky ---------------------------------- */
  defSfx('sfx_grind', 0.55, (ac, lim, t) => {
    for (let i = 0; i < 3; i++) {                                   /* tři krouživé tahy */
      const t0 = t + i * 0.42;
      const n = ac.createBufferSource();
      n.buffer = noiseBuf(ac); n.loop = true;
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 2.2;
      bp.frequency.setValueAtTime(500, t0);
      bp.frequency.linearRampToValueAtTime(1100, t0 + 0.18);        /* krouží */
      bp.frequency.linearRampToValueAtTime(600, t0 + 0.36);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.4, t0 + 0.06);
      g.gain.linearRampToValueAtTime(0.0001, t0 + 0.38);
      n.connect(bp); bp.connect(g); g.connect(lim);
      n.start(t0, rnd(0, 1)); n.stop(t0 + 0.4);
      chirp(ac, lim, t0 + rnd(0.05, 0.2), 0.03, rnd(1800, 2600), 1200, 0.08); /* kamínek */
    }
  });

  /* --- sfx_quill — brk škrábe po pergamenu ------------------------------ */
  defSfx('sfx_quill', 0.45, (ac, lim, t) => {
    let t0 = t;
    for (let i = 0; i < 5; i++) {                                   /* tahy písma */
      const d = rnd(0.1, 0.24);
      burst(ac, lim, t0, d, 'highpass', rnd(3200, 4800), 3800, 1.5, rnd(0.18, 0.3));
      t0 += d + rnd(0.04, 0.14);
    }
    burst(ac, lim, t0, 0.06, 'highpass', 4200, 4200, 1.5, 0.28);    /* tečka */
  });

  /* --- sfx_seal — pečetidlo do vosku ------------------------------------ */
  defSfx('sfx_seal', 0.7, (ac, lim, t) => {
    chirp(ac, lim, t, 0.16, 130, 45, 0.6);                          /* žuchnutí */
    burst(ac, lim, t, 0.1, 'lowpass', 420, 120, 0.8, 0.45);
    burst(ac, lim, t + 0.24, 0.12, 'lowpass', 300, 90, 0.8, 0.16);  /* dosednutí */
  });

  /* --- sfx_snow_step — křupnutí sněhu (střídá dvě nohy) ----------------- */
  let _stepFlip = false;
  defSfx('sfx_snow_step', 0.35, (ac, lim, t) => {
    _stepFlip = !_stepFlip;
    const f = _stepFlip ? 1 : 0.85;
    burst(ac, lim, t, 0.09, 'lowpass', 1300 * f, 380 * f, 0.9, 0.4);
    burst(ac, lim, t + 0.015, 0.06, 'bandpass', 2400 * f, 1500, 1.8, 0.14); /* křupnutí krystalků */
  });

  /* --- sfx_door — vrznutí a dosednutí dveří ----------------------------- */
  defSfx('sfx_door', 0.55, (ac, lim, t) => {
    const o = ac.createOscillator();                                /* vrz pantů */
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(160, t);
    o.frequency.linearRampToValueAtTime(230, t + 0.22);
    o.frequency.linearRampToValueAtTime(140, t + 0.4);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 3.5;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.42);
    o.connect(bp); bp.connect(g); g.connect(lim);
    o.start(t); o.stop(t + 0.45);
    chirp(ac, lim, t + 0.5, 0.1, 110, 50, 0.4);                     /* klapnutí */
    burst(ac, lim, t + 0.5, 0.08, 'lowpass', 600, 180, 0.8, 0.3);
  });

  /* --- sfx_pickup — sebrání předmětu (loutnové drnknutí vzhůru) --------- */
  defSfx('sfx_pickup', 0.5, (ac, lim, t) => {
    luteN(ac, lim, t, midiHz(74), 0.3, 0.4);
    luteN(ac, lim, t + 0.07, midiHz(79), 0.3, 0.4);
    luteN(ac, lim, t + 0.14, midiHz(86), 0.4, 0.35);
  });

  /* --- sfx_sleigh — rolničky Keplerových saní --------------------------- */
  defSfx('sfx_sleigh', 0.5, (ac, lim, t) => {
    const dur = 2.4, rate = 7;                                      /* klus koní */
    const total = Math.floor(dur * rate);
    for (let i = 0; i < total; i++) {
      const t0 = t + i / rate + rnd(-0.02, 0.02);
      const env = 0.5 + 0.5 * Math.sin((i / total) * Math.PI);      /* přijíždí a míjí */
      for (let j = 0; j < 2; j++) {                                  /* svazek rolniček */
        const f = rnd(2300, 4300);
        const o = ac.createOscillator();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t0);
        const m = ac.createOscillator();
        m.type = 'sine'; m.frequency.setValueAtTime(f * 2.76, t0);
        const mg = ac.createGain(); mg.gain.setValueAtTime(f * 0.9, t0);
        m.connect(mg); mg.connect(o.frequency);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.12 * env * rnd(0.6, 1), t0 + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + rnd(0.1, 0.2));
        o.connect(g); g.connect(lim);
        o.start(t0); m.start(t0);
        o.stop(t0 + 0.22); m.stop(t0 + 0.22);
      }
    }
  });
})();
