/* =========================================================================
   ZTRACENÝ LIST v2 — 25_atmosphere.js
   Světlo a atmosféra nad malovanými scénami (v1 kresby zůstávají beze změny):

   • AUTOMATICKÁ ZÁŘE — při prvním vstupu do scény se z každé statické vrstvy
     vytáhnou teplá svítící místa (okna, ohně, svíce, lucerny, mosaz) →
     rozmazaná mapa záře, kreslená 'lighter' hned NAD svou vrstvou (správná
     paralaxa i z-pořadí: popředí záři zakryje).
   • RUČNÍ SVĚTLA — ohně, svíce, slunce, měsíc: blikání, kužely světla na
     sněhu, jiskry, světlo dopadající na postavy, směr vržených stínů.
   • PAPRSKY (god rays) + prach v paprsku, MLHA ve vrstvách (driftuje),
     VLOČKY V POPŘEDÍ (bokeh), TŘPYT SNĚHU, BLOOM celého snímku,
     GRADOVÁNÍ (soft-light + lift), VINĚTA, FILMOVÉ ZRNO.

   API pro engine: BNJ.fx.prepare(def) · afterLayer(ctx,def,i,camX,t) ·
   ground(ctx,def,camX,t) · post(ctx,def,camX,t) · actorLight(def,x,y,h,camX,t)
   · actorShadow(def,x,y,t) · screenFx(ctx,t,profileId) · quality()
   Kvalita: BNJ.settings.fx — 0 vyp., 1 nízká, 2 vysoká.
   ========================================================================= */
(function () {
'use strict';
const BNJ = window.BNJ;
if (!BNJ) return;

const W = 1920, H = 1080, TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
/* hladký pseudošum v čase (součet sinů) pro blikání */
const flick = (t, s) => 0.62 + 0.18 * Math.sin(t * 11.3 + s) + 0.12 * Math.sin(t * 23.1 + s * 2.7) + 0.08 * Math.sin(t * 5.3 + s * 0.6);

/* ============================================================ PROFILY SCÉN
   Souřadnice jsou ve světě dané vrstvy (p = paralaxa, výchozí 1).
   glow: {warm, v, k}  — práh teploty (r−b) a jasu pro autozáři, síla
   lights: [{x,y,r,c,a,p,flick,pool,embers,shadow}]
   rays:   [{x,y,ang,len,w0,w1,c,a,p}]   fog: [{y,h,c,a,sp,after,scale}]
   shadow: {vx,vy,a} (slunce) | {point:true,a} (od nejsilnějšího světla)
   grade:  {top,topA,bot,botA,lift,liftA,mul,mulA}                       */
const P = BNJ.atmos = {
  title: {
    bloom: 0.34, vignette: 0.5, vig: '4,6,18', grain: 0.05,
    grade: { top: '90,110,200', topA: 0.10, bot: '255,170,90', botA: 0.06 }
  },
  castle_yard: {
    glow: { warm: 105, v: 190, k: 1.0 }, bloom: 0.2, vignette: 0.36, vig: '40,20,10', grain: 0.04,
    lights: [
      { x: -260, y: 120, p: 0.2, r: 1100, c: '255,196,120', a: 0.34, sun: true },
      { x: 351, y: 505, r: 150, c: '255,190,100', a: 0.45, flick: 1 },
      { x: 160, y: 520, r: 420, c: '255,170,90', a: 0.22 }
    ],
    rays: [
      { x: -160, y: -40, ang: 0.52, len: 2100, w0: 90, w1: 520, c: '255,214,150', a: 0.13, p: 0.35 },
      { x: 240, y: -80, ang: 0.6, len: 1800, w0: 50, w1: 300, c: '255,224,170', a: 0.09, p: 0.35 },
      { x: 700, y: -60, ang: 0.56, len: 1900, w0: 70, w1: 380, c: '255,214,150', a: 0.07, p: 0.35 }
    ],
    shadow: { vx: 0.95, vy: 0.3, a: 0.30, c: '46,40,96' },
    grade: { top: '255,170,90', topA: 0.20, bot: '80,100,190', botA: 0.20, lift: '40,30,70', liftA: 0.05 },
    snow: { n: 26, wind: 46 }, glints: { n: 110, a: 0.9 }
  },
  observatory: {
    glow: { warm: 95, v: 175, k: 1.25 }, bloom: 0.26, vignette: 0.55, vig: '10,4,24', grain: 0.05,
    lights: [
      { x: 1752, y: 845, r: 300, c: '255,186,100', a: 0.55, flick: 1, pool: 0.5, shadow: true },
      { x: 1909, y: 757, r: 220, c: '255,186,100', a: 0.45, flick: 2 },
      { x: 2092, y: 862, r: 460, c: '255,130,50', a: 0.5, flick: 3, pool: 0.6, embers: 14, shadow: true },
      { x: 2022, y: 570, r: 120, c: '255,186,100', a: 0.4, flick: 4 },
      { x: 2152, y: 570, r: 120, c: '255,186,100', a: 0.4, flick: 5 },
      { x: 352, y: 668, r: 150, c: '255,186,100', a: 0.4, flick: 6 },
      { x: 1288, y: 505, r: 190, c: '90,255,150', a: 0.22, flick: 7 },
      { x: 730, y: 420, r: 520, c: '160,180,255', a: 0.22, shadow: true, moon: true }
    ],
    rays: [
      { x: 735, y: 230, ang: 1.38, len: 820, w0: 330, w1: 560, c: '170,190,255', a: 0.15 },
      { x: 860, y: 260, ang: 0.95, len: 700, w0: 120, w1: 330, c: '170,190,255', a: 0.08 }
    ],
    motes: { x: 560, y: 300, w: 520, h: 680, n: 60, c: '220,230,255' },
    shadow: { point: true, a: 0.32, c: '20,8,40' },
    grade: { top: '110,90,200', topA: 0.16, bot: '255,150,80', botA: 0.10, lift: '30,10,60', liftA: 0.06 },
    glints: null
  },
  river_bank: {
    glow: { warm: 100, v: 180, k: 1.1 }, bloom: 0.16, vignette: 0.34, vig: '20,30,50', grain: 0.045,
    lights: [
      { x: 900, y: -100, p: 0.2, r: 1300, c: '235,240,255', a: 0.16, sun: true }
    ],
    rays: [
      { x: 500, y: -120, ang: 1.25, len: 1500, w0: 200, w1: 700, c: '240,246,255', a: 0.07, p: 0.3 },
      { x: 1250, y: -120, ang: 1.32, len: 1500, w0: 160, w1: 560, c: '240,246,255', a: 0.05, p: 0.3 }
    ],
    fog: [
      { y: 470, h: 230, c: '220,230,240', a: 0.42, sp: 9, after: 1, scale: 1.4 },
      { y: 610, h: 170, c: '225,234,244', a: 0.34, sp: -14, after: 2, scale: 1.1 },
      { y: 860, h: 200, c: '235,242,250', a: 0.22, sp: 18, after: 3, scale: 1.0 }
    ],
    shadow: { vx: 0.25, vy: 0.22, a: 0.16, c: '60,80,120' },
    grade: { top: '200,215,240', topA: 0.12, bot: '70,100,150', botA: 0.16, lift: '40,60,90', liftA: 0.06 },
    snow: { n: 30, wind: 30 }, glints: { n: 80, a: 0.65 }
  },
  square: {
    glow: { warm: 120, v: 200, k: 0.8 }, bloom: 0.2, vignette: 0.3, vig: '30,30,60', grain: 0.04,
    lights: [
      { x: 1735, y: 195, p: 0.25, r: 900, c: '255,236,190', a: 0.42, sun: true },
      { x: 760, y: 960, r: 260, c: '255,150,60', a: 0.4, flick: 1, pool: 0.4, embers: 8 }
    ],
    rays: [
      { x: 1735, y: 195, ang: 2.2, len: 1700, w0: 60, w1: 520, c: '255,240,200', a: 0.11, p: 0.25 },
      { x: 1735, y: 195, ang: 2.45, len: 1600, w0: 40, w1: 380, c: '255,240,200', a: 0.08, p: 0.25 },
      { x: 1735, y: 195, ang: 1.95, len: 1500, w0: 40, w1: 300, c: '255,240,200', a: 0.07, p: 0.25 }
    ],
    shadow: { vx: -0.85, vy: 0.26, a: 0.26, c: '50,60,120' },
    grade: { top: '160,200,255', topA: 0.10, bot: '255,200,140', botA: 0.10, lift: '30,40,80', liftA: 0.04 },
    snow: { n: 16, wind: 24 }, glints: { n: 140, a: 1.0 }
  },
  old_town: {
    glow: { warm: 90, v: 170, k: 0.8 }, bloom: 0.17, vignette: 0.48, vig: '6,6,26', grain: 0.05,
    lights: [
      { x: 1795, y: 940, r: 520, c: '255,140,50', a: 0.62, flick: 1, pool: 0.75, embers: 26, shadow: true },
      { x: 1880, y: 190, p: 0.2, r: 260, c: '210,225,255', a: 0.24, moon: true },
      { x: 1095, y: 705, r: 300, c: '255,190,100', a: 0.12, flick: 8 }
    ],
    fog: [
      { y: 650, h: 120, c: '120,130,190', a: 0.24, sp: 6, after: 1, scale: 1.3 }
    ],
    shadow: { point: true, a: 0.34, c: '10,8,30' },
    grade: { top: '70,80,190', topA: 0.20, bot: '255,140,70', botA: 0.10, lift: '20,20,60', liftA: 0.07 },
    snow: { n: 22, wind: 20 }, glints: { n: 90, a: 0.7, warm: true }
  },
  marsh: {
    glow: { warm: 95, v: 170, k: 1.2 }, bloom: 0.22, vignette: 0.6, vig: '10,16,20', grain: 0.06,
    lights: [
      { x: 602, y: 737, r: 210, c: '255,186,100', a: 0.45, flick: 1, pool: 0.35, shadow: true },
      { x: 1232, y: 1010, r: 380, c: '170,230,255', a: 0.10 }
    ],
    fog: [
      { y: 380, h: 260, c: '170,186,196', a: 0.40, sp: 7, after: 0, scale: 1.6 },
      { y: 560, h: 220, c: '180,196,204', a: 0.38, sp: -11, after: 1, scale: 1.3 },
      { y: 720, h: 200, c: '190,204,210', a: 0.30, sp: 15, after: 2, scale: 1.1 },
      { y: 930, h: 220, c: '200,212,218', a: 0.20, sp: -20, after: 3, scale: 1.0 }
    ],
    shadow: { vx: 0.2, vy: 0.18, a: 0.14, c: '30,40,50' },
    grade: { top: '120,150,170', topA: 0.16, bot: '60,90,90', botA: 0.20, lift: '30,45,50', liftA: 0.08 },
    snow: { n: 14, wind: 36 }, glints: { n: 40, a: 0.4 }
  }
};

/* =============================================================== nastavení */
function quality() {
  const s = BNJ.settings;
  return s && s.fx != null ? s.fx : 2;
}

/* ================================================================ sprity */
let SP = null;
function sprites() {
  if (SP) return SP;
  SP = {};
  // měkká vločka (bokeh)
  const f = mk(64, 64), fx = f.getContext('2d');
  const g = fx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  fx.fillStyle = g; fx.fillRect(0, 0, 64, 64);
  SP.flake = f;
  // třpyt (4cípá hvězdička)
  const s = mk(48, 48), sx = s.getContext('2d');
  sx.translate(24, 24);
  const sg = sx.createRadialGradient(0, 0, 0, 0, 0, 8);
  sg.addColorStop(0, 'rgba(255,255,255,1)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  sx.fillStyle = sg; sx.beginPath(); sx.arc(0, 0, 8, 0, TAU); sx.fill();
  sx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 2; i++) {
    sx.save(); sx.rotate(i * Math.PI / 2);
    sx.beginPath(); sx.moveTo(-22, 0); sx.quadraticCurveTo(0, -1.6, 22, 0); sx.quadraticCurveTo(0, 1.6, -22, 0); sx.fill();
    sx.restore();
  }
  SP.glint = s;
  // jiskra
  const e = mk(24, 24), ex = e.getContext('2d');
  const eg = ex.createRadialGradient(12, 12, 0, 12, 12, 12);
  eg.addColorStop(0, 'rgba(255,240,190,1)'); eg.addColorStop(0.3, 'rgba(255,170,70,0.85)'); eg.addColorStop(1, 'rgba(255,90,20,0)');
  ex.fillStyle = eg; ex.fillRect(0, 0, 24, 24);
  SP.ember = e;
  // mlha — horizontálně dlaždicová textura z měkkých obláčků
  const fw = 1024, fh = 256, fog = mk(fw, fh), fgx = fog.getContext('2d');
  const rng = mulberry(4242);
  for (let i = 0; i < 150; i++) {
    const x = rng() * fw, y = fh * (0.3 + rng() * 0.4), r = 40 + rng() * 110, a = 0.05 + rng() * 0.09;
    for (const ox of [-fw, 0, fw]) {
      const gg = fgx.createRadialGradient(x + ox, y, 0, x + ox, y, r);
      gg.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      fgx.fillStyle = gg;
      fgx.beginPath(); fgx.ellipse(x + ox, y, r * 1.8, r * 0.6, 0, 0, TAU); fgx.fill();
    }
  }
  // svislé zjemnění okrajů pásu
  fgx.globalCompositeOperation = 'destination-in';
  const vg = fgx.createLinearGradient(0, 0, 0, fh);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.35, 'rgba(0,0,0,1)');
  vg.addColorStop(0.65, 'rgba(0,0,0,1)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
  fgx.fillStyle = vg; fgx.fillRect(0, 0, fw, fh);
  SP.fog = fog; SP.fogTint = {};
  // filmové zrno — 4 snímky
  SP.grain = [];
  for (let k = 0; k < 4; k++) {
    const gc = mk(256, 256), gx = gc.getContext('2d');
    const id = gx.createImageData(256, 256), d = id.data, r2 = mulberry(77 + k);
    for (let i = 0; i < d.length; i += 4) {
      const v = 128 + (r2() + r2() + r2() - 1.5) * 120;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    gx.putImageData(id, 0, 0);
    SP.grain.push(gc);
  }
  SP.grainPat = null;
  // bloom buffery
  SP.b1 = mk(480, 270); SP.b2 = mk(240, 135); SP.b3 = mk(120, 68);
  return SP;
}

function fogTint(c) {
  const sp = sprites();
  if (sp.fogTint[c]) return sp.fogTint[c];
  const t = mk(sp.fog.width, sp.fog.height), x = t.getContext('2d');
  x.drawImage(sp.fog, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = 'rgb(' + c + ')'; x.fillRect(0, 0, t.width, t.height);
  sp.fogTint[c] = t;
  return t;
}

/* ===================================================== autozáře vrstvy */
function buildGlow(src, cfg) {
  const sw = src.width, sh = src.height;
  const w2 = Math.ceil(sw / 2), h2 = Math.ceil(sh / 2);
  const c2 = mk(w2, h2), x2 = c2.getContext('2d');
  x2.drawImage(src, 0, 0, w2, h2);
  let id;
  try { id = x2.getImageData(0, 0, w2, h2); } catch (e) { return null; }
  const d = id.data;
  const warm0 = cfg.warm, v0 = cfg.v;
  let any = 0;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 8) { d[i + 3] = 0; continue; }
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const v = r > g ? (r > b ? r : b) : (g > b ? g : b);
    let wt = smooth(warm0, warm0 + 70, r - b) * smooth(v0, 252, v) * smooth(0.5, 0.72, g / (r + 1));
    if (wt < 0.02) { d[i + 3] = 0; continue; }
    any++;
    d[i + 3] = Math.min(255, wt * a);
  }
  if (any < 4) return null;
  x2.putImageData(id, 0, 0);
  // rozmazání řetězem zmenšenin
  const c4 = mk(w2 / 2, h2 / 2), c8 = mk(w2 / 4, h2 / 4), c16 = mk(w2 / 8, h2 / 8), c32 = mk(w2 / 16, h2 / 16);
  c4.getContext('2d').drawImage(c2, 0, 0, c4.width, c4.height);
  c8.getContext('2d').drawImage(c4, 0, 0, c8.width, c8.height);
  c16.getContext('2d').drawImage(c8, 0, 0, c16.width, c16.height);
  c32.getContext('2d').drawImage(c16, 0, 0, c32.width, c32.height);
  // těsná záře (1/4) a široká (1/8 složená z 1/8+1/16+1/32)
  const tight = mk(c4.width, c4.height), tx = tight.getContext('2d');
  tx.drawImage(c4, 0, 0);
  tx.globalCompositeOperation = 'lighter';
  tx.drawImage(c8, 0, 0, tight.width, tight.height);
  const wide = mk(c8.width, c8.height), wx = wide.getContext('2d');
  wx.globalCompositeOperation = 'lighter';
  wx.globalAlpha = 0.9; wx.drawImage(c8, 0, 0);
  wx.globalAlpha = 1; wx.drawImage(c16, 0, 0, wide.width, wide.height);
  wx.drawImage(c32, 0, 0, wide.width, wide.height);
  wx.drawImage(c32, 0, 0, wide.width, wide.height);
  // ozáření pro postavy (CPU kopie 1/32)
  let irr = null;
  try {
    const big = mk(c32.width, c32.height), bx = big.getContext('2d');
    bx.drawImage(c32, 0, 0);
    bx.globalCompositeOperation = 'lighter';
    bx.drawImage(c16, 0, 0, big.width, big.height);
    irr = { w: big.width, h: big.height, d: bx.getImageData(0, 0, big.width, big.height).data, s: sw / big.width };
  } catch (e) { irr = null; }
  return { tight, wide, irr, k: cfg.k || 1 };
}

/* ======================================================== příprava scény */
function layerIndexBefore(def, idx) { return idx; }

BNJ.fx = {};
const FX = BNJ.fx;
FX.quality = quality;

FX.prepare = function (def) {
  if (def._fx) return;
  const prof = P[def.id] || {};
  const fx = def._fx = { prof, glints: [] };
  if (prof.glow && def._pre) {
    const t0 = performance.now();
    for (const L of def._pre) {
      try { L.glow = buildGlow(L.c, prof.glow); } catch (e) { L.glow = null; }
    }
    fx.buildMs = performance.now() - t0;
  }
  // třpyt na sněhu — pevné pozice v pochozím pásu (vrstva p=1)
  if (prof.glints) {
    const rng = mulberry(def.id.length * 977 + 13);
    const wa = def.walkArea || [[0, 860], [def.width, 1080]];
    let top = 1080; for (const p of wa) top = Math.min(top, p[1]);
    for (let i = 0; i < prof.glints.n; i++) {
      fx.glints.push({ x: rng() * def.width, y: top - 10 + rng() * (H - top + 10), ph: rng() * TAU, sp: 0.5 + rng() * 1.2, s: 0.35 + rng() * 0.6 });
    }
  }
  // vločky — deterministické parametry
  if (prof.snow) {
    const rng = mulberry(91 + def.id.length);
    fx.flakes = [];
    for (let i = 0; i < prof.snow.n; i++) {
      fx.flakes.push({ x: rng() * (W + 200), y: rng() * (H + 200), vy: 50 + rng() * 90, sz: 10 + rng() * 26, a: 0.25 + rng() * 0.45, ph: rng() * TAU, f: 0.4 + rng() * 0.9, d: 1.25 + rng() * 0.7 });
    }
  }
  if (prof.motes) {
    const rng = mulberry(555);
    fx.motes = [];
    for (let i = 0; i < prof.motes.n; i++) fx.motes.push({ x: rng(), y: rng(), ph: rng() * TAU, sp: 0.02 + rng() * 0.05, s: 0.6 + rng() * 1.8 });
  }
};

/* ================================================================ kreslení */
function drawLayerGlow(ctx, L, camX, a, t) {
  const g = L.glow;
  if (!g) return;
  const x0 = -camX * L.p;
  const k = g.k * a * (0.94 + 0.06 * Math.sin(t * 1.7));
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = clamp(k * 0.32, 0, 1);
  ctx.drawImage(g.tight, x0, 0, L.c.width, L.c.height);
  ctx.globalAlpha = clamp(k * 0.7, 0, 1);
  ctx.drawImage(g.wide, x0, 0, L.c.width, L.c.height);
  ctx.restore();
}

function drawFog(ctx, f, camX, t, layerP) {
  const tex = fogTint(f.c);
  const sc = (f.scale || 1) * (f.h / 128);
  const tw = tex.width * sc, th = tex.height * sc;
  let ox = -((camX * layerP + t * (f.sp || 0)) % tw);
  if (ox > 0) ox -= tw;
  ctx.save();
  ctx.globalAlpha = f.a * (0.85 + 0.15 * Math.sin(t * 0.21 + f.y));
  for (let x = ox; x < W; x += tw) ctx.drawImage(tex, x, f.y - th / 2, tw, th);
  ctx.restore();
}

function lightScreenX(l, camX) { return l.x - camX * (l.p != null ? l.p : 1); }

function drawLights(ctx, prof, camX, t) {
  if (!prof.lights) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of prof.lights) {
    const sx = lightScreenX(l, camX), sy = l.y;
    if (sx < -l.r * 1.2 || sx > W + l.r * 1.2) continue;
    const fl = l.flick ? flick(t, l.flick * 3.1) : 1;
    const a = l.a * fl;
    const r = l.r * (l.flick ? 0.94 + 0.08 * fl : 1);
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, 'rgba(' + l.c + ',' + (a * 0.9).toFixed(3) + ')');
    g.addColorStop(0.18, 'rgba(' + l.c + ',' + (a * 0.42).toFixed(3) + ')');
    g.addColorStop(0.5, 'rgba(' + l.c + ',' + (a * 0.12).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + l.c + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    // kužel světla na sněhu / podlaze
    if (l.pool) {
      ctx.save();
      ctx.translate(sx, sy + 40);
      ctx.scale(1, 0.24);
      const pr = r * 1.15;
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, pr);
      pg.addColorStop(0, 'rgba(' + l.c + ',' + (l.pool * fl * 0.5).toFixed(3) + ')');
      pg.addColorStop(0.45, 'rgba(' + l.c + ',' + (l.pool * fl * 0.16).toFixed(3) + ')');
      pg.addColorStop(1, 'rgba(' + l.c + ',0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(0, 0, pr, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawRays(ctx, prof, camX, t) {
  if (!prof.rays) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  prof.rays.forEach((r, i) => {
    const ox = r.x - camX * (r.p != null ? r.p : 1), oy = r.y;
    const dx = Math.cos(r.ang), dy = Math.sin(r.ang);
    const nx = -dy, ny = dx;
    const ex = ox + dx * r.len, ey = oy + dy * r.len;
    const a = r.a * (0.7 + 0.3 * Math.sin(t * 0.23 + i * 1.7)) * (0.85 + 0.15 * Math.sin(t * 0.61 + i));
    const g = ctx.createLinearGradient(ox, oy, ex, ey);
    g.addColorStop(0, 'rgba(' + r.c + ',' + a.toFixed(3) + ')');
    g.addColorStop(0.55, 'rgba(' + r.c + ',' + (a * 0.45).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + r.c + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox + nx * r.w0 / 2, oy + ny * r.w0 / 2);
    ctx.lineTo(ex + nx * r.w1 / 2, ey + ny * r.w1 / 2);
    ctx.lineTo(ex - nx * r.w1 / 2, ey - ny * r.w1 / 2);
    ctx.lineTo(ox - nx * r.w0 / 2, oy - ny * r.w0 / 2);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function drawEmbers(ctx, prof, camX, t) {
  if (!prof.lights) return;
  const sp = sprites();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of prof.lights) {
    if (!l.embers) continue;
    const sx = lightScreenX(l, camX);
    if (sx < -200 || sx > W + 200) continue;
    for (let i = 0; i < l.embers; i++) {
      const seed = i * 12.9898 + l.x;
      const per = 2.2 + (Math.sin(seed) * 0.5 + 0.5) * 1.8;
      const life = ((t / per) + (Math.sin(seed * 3.1) * 0.5 + 0.5)) % 1;
      const drift = Math.sin(seed * 7.7) * 60;
      const x = sx + Math.sin(life * 5 + seed) * 18 * life + drift * life;
      const y = l.y - 10 - life * (180 + (i % 5) * 40);
      const a = (1 - life) * (life < 0.1 ? life * 10 : 1);
      const s = (3 + (i % 3) * 2) * (1 - life * 0.6);
      ctx.globalAlpha = a * 0.9;
      ctx.drawImage(sp.ember, x - s, y - s, s * 2, s * 2);
    }
  }
  ctx.restore();
}

function drawMotes(ctx, def, camX, t) {
  const m = def._fx.prof.motes, arr = def._fx.motes;
  if (!m || !arr) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of arr) {
    const u = (p.x + Math.sin(t * p.sp * 6 + p.ph) * 0.04 + t * p.sp * 0.3) % 1;
    const v = (p.y + t * p.sp * 0.5 + Math.cos(t * p.sp * 5 + p.ph) * 0.03) % 1;
    const x = m.x + u * m.w + v * m.w * 0.25 - camX, y = m.y + v * m.h;
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + p.ph * 3);
    ctx.globalAlpha = 0.25 + tw * 0.55;
    ctx.fillStyle = 'rgb(' + m.c + ')';
    ctx.beginPath(); ctx.arc(x, y, p.s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawFlakes(ctx, def, camX, t) {
  const prof = def._fx.prof, arr = def._fx.flakes;
  if (!prof.snow || !arr) return;
  const sp = sprites();
  const wind = prof.snow.wind * (1 + 0.6 * Math.sin(t * 0.17)) + 50 * Math.max(0, Math.sin(t * 0.09) - 0.7) * 3;
  ctx.save();
  for (const f of arr) {
    const span = W + 200, spanY = H + 200;
    let x = (f.x + wind * t * f.d + Math.sin(t * f.f + f.ph) * 30 - camX * f.d) % span;
    if (x < 0) x += span;
    const y = (f.y + f.vy * t * f.d * 0.6) % spanY;
    ctx.globalAlpha = f.a * (f.d > 1.7 ? 0.7 : 1);
    const s = f.sz * f.d * 0.6;
    ctx.drawImage(sp.flake, x - 100 - s / 2, y - 100 - s / 2, s, s);
  }
  ctx.restore();
}

FX.ground = function (ctx, def, camX, t) {
  if (!def._fx || quality() < 1) return;
  const prof = def._fx.prof;
  if (!prof.glints) return;
  const sp = sprites();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ga = prof.glints.a;
  for (const g of def._fx.glints) {
    const x = g.x - camX;
    if (x < -20 || x > W + 20) continue;
    // třpyt závisí i na pozici kamery (úhel pohledu) — jiskří při chůzi
    const ph = Math.sin(t * g.sp + g.ph + camX * 0.004 + g.x * 0.01);
    const k = Math.pow(Math.max(0, ph), 18);
    if (k < 0.04) continue;
    const s = 22 * g.s * (0.6 + k * 0.6);
    ctx.globalAlpha = k * ga;
    ctx.drawImage(sp.glint, x - s / 2, g.y - s / 2, s, s);
  }
  ctx.restore();
};

FX.afterLayer = function (ctx, def, i, camX, t) {
  if (!def._fx || quality() < 1) return;
  const L = def._pre[i];
  if (L && L.glow) drawLayerGlow(ctx, L, camX, 1, t);
  const prof = def._fx.prof;
  if (prof.fog) for (const f of prof.fog) if (f.after === i) drawFog(ctx, f, camX, t, L ? L.p : 1);
};

function bloom(ctx, amt) {
  const sp = sprites();
  const b1 = sp.b1, b2 = sp.b2, b3 = sp.b3;
  const x1 = b1.getContext('2d'), x2 = b2.getContext('2d'), x3 = b3.getContext('2d');
  x1.globalCompositeOperation = 'copy';
  x1.drawImage(ctx.canvas, 0, 0, b1.width, b1.height);
  // měkký práh: x² · x²  → zůstanou jen světla
  x1.globalCompositeOperation = 'multiply';
  x1.drawImage(b1, 0, 0);
  x1.drawImage(b1, 0, 0);
  x2.globalCompositeOperation = 'copy'; x2.drawImage(b1, 0, 0, b2.width, b2.height);
  x3.globalCompositeOperation = 'copy'; x3.drawImage(b2, 0, 0, b3.width, b3.height);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = amt * 0.6; ctx.drawImage(b2, 0, 0, W, H);
  ctx.globalAlpha = amt; ctx.drawImage(b3, 0, 0, W, H);
  ctx.restore();
}

function grade(ctx, g) {
  if (!g) return;
  ctx.save();
  if (g.top || g.bot) {
    ctx.globalCompositeOperation = 'soft-light';
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(' + (g.top || '128,128,128') + ',' + (g.topA || 0) + ')');
    gr.addColorStop(0.5, 'rgba(128,128,128,0)');
    gr.addColorStop(1, 'rgba(' + (g.bot || '128,128,128') + ',' + (g.botA || 0) + ')');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }
  if (g.lift) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(' + g.lift + ',' + (g.liftA || 0.05) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

const _vigCache = {};
function vignette(ctx, a, c) {
  const key = a + '|' + c;
  let v = _vigCache[key];
  if (!v) {
    v = mk(480, 270);
    const x = v.getContext('2d');
    const g = x.createRadialGradient(240, 125, 60, 240, 135, 300);
    g.addColorStop(0, 'rgba(' + c + ',0)');
    g.addColorStop(0.55, 'rgba(' + c + ',' + (a * 0.25) + ')');
    g.addColorStop(1, 'rgba(' + c + ',' + a + ')');
    x.fillStyle = g; x.fillRect(0, 0, 480, 270);
    _vigCache[key] = v;
  }
  ctx.drawImage(v, 0, 0, W, H);
}

let _gf = 0;
function grain(ctx, a) {
  const sp = sprites();
  _gf++;
  const tile = sp.grain[(_gf >> 1) & 3];
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = a;
  ctx.translate((_gf * 37) % 256, (_gf * 71) % 256);
  ctx.fillStyle = pat;
  ctx.fillRect(-256, -256, W + 256, H + 256);
  ctx.restore();
}

FX.post = function (ctx, def, camX, t) {
  if (!def._fx) return;
  const q = quality();
  const prof = def._fx.prof;
  if (q >= 1) {
    if (prof.fog) for (const f of prof.fog) if (f.after == null) drawFog(ctx, f, camX, t, 1);
    drawLights(ctx, prof, camX, t);
    if (q >= 2) drawRays(ctx, prof, camX, t);
    drawEmbers(ctx, prof, camX, t);
    if (q >= 2) drawMotes(ctx, def, camX, t);
    drawFlakes(ctx, def, camX, t);
    if (q >= 2 && prof.bloom) bloom(ctx, prof.bloom);
    grade(ctx, prof.grade);
  }
  if (prof.vignette) vignette(ctx, prof.vignette, prof.vig || '0,0,0');
  if (q >= 2 && prof.grain) grain(ctx, prof.grain);
};

/* efekty pro titulku a obrazovky mimo scény */
FX.screenFx = function (ctx, t, id) {
  const prof = P[id || 'title'];
  if (!prof) return;
  const q = quality();
  if (q >= 2 && prof.bloom) bloom(ctx, prof.bloom);
  if (q >= 1) grade(ctx, prof.grade);
  if (prof.vignette) vignette(ctx, prof.vignette, prof.vig || '0,0,0');
  if (q >= 2 && prof.grain) grain(ctx, prof.grain);
};

/* ===================================================== světlo na postavy */
FX.actorLight = function (def, x, y, h, camX, t) {
  if (!def || !def._fx || quality() < 1) return null;
  const prof = def._fx.prof;
  let r = 0, g = 0, b = 0, k = 0;
  const ty = y - h * 0.5;
  for (const L of def._pre || []) {
    const ir = L.glow && L.glow.irr;
    if (!ir) continue;
    const lx = x - camX * (1 - L.p);
    const px = clamp((lx / ir.s) | 0, 0, ir.w - 1), py = clamp((ty / ir.s) | 0, 0, ir.h - 1);
    const i = (py * ir.w + px) * 4;
    const a = ir.d[i + 3] / 255 * L.glow.k;
    r += ir.d[i] * a; g += ir.d[i + 1] * a; b += ir.d[i + 2] * a; k += a;
  }
  if (prof.lights) {
    for (const l of prof.lights) {
      if (l.sun) continue;
      const lx = l.x - camX * ((l.p != null ? l.p : 1) - 1);
      const d = Math.hypot(lx - x, (l.y - ty) * 1.4);
      if (d > l.r * 1.3) continue;
      const fl = l.flick ? flick(t, l.flick * 3.1) : 1;
      const a = l.a * fl * Math.pow(1 - d / (l.r * 1.3), 2) * 1.6;
      const c = l.c.split(',');
      r += +c[0] * a; g += +c[1] * a; b += +c[2] * a; k += a;
    }
  }
  if (k < 0.01) return null;
  return { c: Math.round(r / k) + ',' + Math.round(g / k) + ',' + Math.round(b / k), k: clamp(k * 0.5, 0, 0.5), side: side(prof, x, ty, camX) };
};

/* odkud přichází nejsilnější lokální světlo: −1 zleva, +1 zprava, 0 shora */
function side(prof, x, y, camX) {
  let best = 0, bw = 0;
  for (const l of prof.lights || []) {
    const lx = l.x - camX * ((l.p != null ? l.p : 1) - 1);
    const d = Math.hypot(lx - x, l.y - y);
    const w = l.sun ? l.a * 0.6 : l.a * Math.max(0, 1 - d / (l.r * 1.3));
    if (w > bw) { bw = w; best = clamp((lx - x) / 300, -1, 1); }
  }
  return best;
}

FX.actorShadow = function (def, x, y, t) {
  if (!def || !def._fx || quality() < 2) return null;
  const prof = def._fx.prof, s = prof.shadow;
  if (!s) return null;
  if (!s.point) return { vx: s.vx, vy: s.vy, a: s.a, c: s.c || '20,20,40' };
  let best = null, bw = 0;
  for (const l of prof.lights || []) {
    if (!l.shadow) continue;
    const d = Math.hypot(l.x - x, (l.y - y) * 1.6);
    const w = l.a * Math.max(0, 1 - d / (l.r * 2.2));
    if (w > bw) { bw = w; best = l; }
  }
  if (!best || bw < 0.02) return null;
  const dx = x - best.x;
  const fl = best.flick ? flick(t, best.flick * 3.1) : 1;
  const len = clamp(Math.abs(dx) / 260, 0.35, 1.25);
  return {
    vx: Math.sign(dx || 1) * len,
    vy: clamp((y - best.y) / 260, -0.25, 0.35) + 0.08,
    a: s.a * clamp(bw * 2.2, 0.3, 1) * (0.85 + 0.15 * fl),
    c: s.c || '10,8,30'
  };
};

})();
