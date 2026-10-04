/* =========================================================================
   ZTRACENÝ LIST — 20_backgrounds.js
   Malíř pozadí: všech 7 scén (title, castle_yard, observatory, river_bank,
   square, old_town, marsh) ve stylu Curse of Monkey Island — vrstvené
   gradienty, atmosférická perspektiva, scumble šum, rim-light, zima 1599/1600.
   Vše procedurální canvas 2D. Souřadnice klíčových rekvizit (pro hotspoty):

   castle_yard (w2600): brána x0–330 (exit ~[120,900]) • sluneční hodiny
     střed (800,420) r62 • studna střed (1560,860) • saně (1330,855) •
     bouda+pes Ryšák (1815,880) • hromada sněhu (300,950) • dveře věže
     (2350–2470, 690–890, exit ~[2400,880])
   observatory (w2200): dveře (150–300,640–890) • okno (500–880,210–700) •
     zední kvadrant (950–1450,360–740) • police se skalicí (1500–1780,
     400–700; lahvička ~(1568,538)) • poznámky o Marsu (1820–1965,420–650) •
     krb (1980–2190,520–900) • velký sextant (600–1000,560–1060) •
     armilární sféra (1180,860) • glóbus (1420,880) • křivule (1600–1810,
     700–900) • hmoždíř (300–460,760–900) • psací pult (1840–2080,760–1055)
     • svícen (1770,830–1000)
   river_bank (w2800): jez+vír — vír střed (900,770) • pramice (1350–1850,
     940–1060) • ohniště (2280,900) • rákosí+hnízdo (2080,870) • husa
     Markyta u hnízda (2185,905) / po goose_lured na břehu (2320,975) •
     ulička na náměstí vlevo (exit ~[140,880]) • cesta po ledu vpravo
     (exit ~[2720,900])
   square (w2600): cesta k zámku vlevo (exit ~[200,850]) • koš s ohněm
     (700,1010) • stánek Bětky (950–1330,780–1060) • kašna (1650,900) •
     dveře kostela (1618–1682,640–830) • pranýř (2100,880) • ulička k řece
     vpravo (exit ~[2450,880])
   old_town (w2400): cesta po ledu vlevo (exit ~[140,900]) • tkalcovna
     (950–1300,560–830) • zvonice (1380–1560,300–860) • Bendův plácek s
     ohýnkem (1750–1950,880–1000; oheň (1800,955)) • dveře krčmy
     (2075–2145,660–850) • pěšina do mokřad vpravo (exit ~[2280,880])
   marsh (w2600): hatě (exit vlevo ~[150,900]) • boží muka (600,860) •
     zamrzlá tůň s fragmentem (850–1600,950–1080; fragment ~(1230,1010)) •
     starý dub (1650–2050; kmen ~(1830,1080)) • bludičky (500,760),
     (1200,800), (2350,780) • volavka (2280,865)
   ========================================================================= */
(function () {
'use strict';

const BNJ = window.BNJ;
if (!BNJ || !BNJ.registerScene) { console.error('[20_backgrounds] BNJ.registerScene chybí'); return; }

const W = 1920, H = 1080, TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------------------------- malířské pomocníky */
function lg(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const s of stops) g.addColorStop(s[0], s[1]);
  return g;
}
function P(ctx, pts, close) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close !== false) ctx.closePath();
}
function fillP(ctx, pts, fill) { P(ctx, pts); ctx.fillStyle = fill; ctx.fill(); }

function glow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, r * 0.04, x, y, r);
  g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
  g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
/* širokánský měkký oblak/mlha (radial gradient roztažený do elipsy) */
function mistPuff(ctx, x, y, rx, ry, rgb, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx / 100, ry / 100);
  const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 100);
  g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
  g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.fill();
  ctx.restore();
}
/* scumble — jemný malířský texturní přetah (šum z nízkoalfa tahů) */
function scumble(ctx, x, y, w, h, seed, n, cols, rmin, rmax, amax) {
  const r = mulberry(seed);
  ctx.save();
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = amax * (0.25 + 0.75 * r());
    ctx.fillStyle = cols[(r() * cols.length) | 0];
    const rr = rmin + r() * (rmax - rmin);
    ctx.beginPath();
    ctx.ellipse(x + r() * w, y + r() * h, rr, rr * (0.3 + r() * 0.5), r() * Math.PI, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
/* sněhová čepice podél lomené čáry (vlnitý spodní okraj) */
function snowBand(ctx, pts, th, seed, top, bot) {
  const r = mulberry(seed);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + th * (0.65 + r() * 0.7));
  ctx.closePath();
  const y0 = Math.min(pts[0][1], pts[pts.length - 1][1]);
  const g = lg(ctx, 0, y0 - th * 0.3, 0, y0 + th * 1.5, [[0, top || '#f4f8fd'], [1, bot || '#b9cbe4']]);
  ctx.fillStyle = g;
  ctx.fill();
}
function icicles(ctx, x0, x1, y, seed, hMax) {
  const r = mulberry(seed);
  for (let x = x0; x < x1; x += 7 + r() * 15) {
    const h2 = hMax * (0.25 + r() * 0.75);
    ctx.fillStyle = 'rgba(214,234,250,0.85)';
    ctx.beginPath();
    ctx.moveTo(x - 3.4, y);
    ctx.quadraticCurveTo(x - 1.2, y + h2 * 0.6, x, y + h2);
    ctx.quadraticCurveTo(x + 1.2, y + h2 * 0.6, x + 3.4, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x - 1.4, y, 1.3, h2 * 0.55);
  }
}
/* okno — warm 0..1 (0 = temné sklo), mull = příčle */
function litWindow(ctx, x, y, w, h, warm, glowR) {
  if (glowR && warm > 0.05) glow(ctx, x + w / 2, y + h / 2, glowR, '255,190,100', 0.3 * warm);
  if (warm > 0.05) {
    ctx.fillStyle = lg(ctx, x, y, x, y + h, [[0, '#ffe3a0'], [0.55, '#ffc063'], [1, '#e8923c']]);
  } else {
    ctx.fillStyle = lg(ctx, x, y, x, y + h, [[0, '#2a3350'], [0.5, '#1b2338'], [1, '#232c46']]);
  }
  ctx.fillRect(x, y, w, h);
  if (warm <= 0.05) { // studený odlesk nebe
    ctx.fillStyle = 'rgba(190,210,235,0.22)';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y); ctx.lineTo(x + w * 0.42, y);
    ctx.lineTo(x + w * 0.2, y + h); ctx.lineTo(x + w * 0.02, y + h);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(34,24,18,0.9)';
  ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
  ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
  ctx.strokeStyle = 'rgba(40,28,20,0.9)'; ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}
/* renesanční sgrafita — psaníčka */
function sgrafito(ctx, x, y, w, h, size, col, a) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = col; ctx.globalAlpha = a; ctx.lineWidth = 1.6;
  let row = 0;
  for (let yy = y; yy < y + h; yy += size, row++) {
    const off = row % 2 ? size / 2 : 0;
    for (let xx = x - size; xx < x + w; xx += size) {
      ctx.beginPath();
      ctx.moveTo(xx + off, yy);
      ctx.lineTo(xx + off + size / 2, yy + size);
      ctx.lineTo(xx + off + size, yy);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
/* holý zimní strom (rekurzivní větvení) */
function bareTree(ctx, x, y, h, seed, col, lean) {
  const r = mulberry(seed);
  ctx.save();
  ctx.strokeStyle = col; ctx.lineCap = 'round';
  (function br(bx, by, ang, len, wdt, d) {
    ctx.lineWidth = Math.max(0.5, wdt);
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    if (d <= 0 || wdt < 0.7) return;
    const n = 2 + ((r() * 2) | 0);
    for (let i = 0; i < n; i++) {
      br(ex, ey, ang + (r() - 0.5) * 1.15 + (lean || 0) * 0.12, len * (0.6 + r() * 0.2), wdt * 0.62, d - 1);
    }
  })(x, y, -Math.PI / 2 + (lean || 0) * 0.25, h * 0.34, h * 0.05, 5);
  ctx.restore();
}
function cloudPuff(ctx, x, y, s, col, a, seed) {
  const r = mulberry(seed);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(x + (r() - 0.5) * 180 * s, y + (r() - 0.5) * 40 * s, (50 + r() * 70) * s, (16 + r() * 20) * s, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
/* dvoutónový mrak — stínové břicho + vršek osvětlený od slunce/měsíce.
   sunDx = -1 světlo zleva, +1 zprava, 0 shora */
function cloud2(ctx, x, y, s, lit, shade, a, seed, sunDx) {
  const r = mulberry(seed);
  sunDx = sunDx || 0;
  const puffs = [];
  for (let i = 0; i < 7; i++) {
    puffs.push([(r() - 0.5) * 190 * s, (r() - 0.5) * 42 * s, (46 + r() * 68) * s, (15 + r() * 20) * s]);
  }
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = shade;
  for (const p of puffs) {
    ctx.beginPath(); ctx.ellipse(x + p[0], y + p[1] + p[3] * 0.3, p[2], p[3], 0, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = lit;
  for (const p of puffs) {
    ctx.beginPath();
    ctx.ellipse(x + p[0] + sunDx * p[2] * 0.16, y + p[1] - p[3] * 0.42, p[2] * 0.84, p[3] * 0.62, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
/* měkký oblak z překrývajících se mistPuff elips (žádné tvrdé hrany) */
function softCloud(ctx, x, y, s, rgb, a, seed) {
  const r = mulberry(seed);
  for (let i = 0; i < 7; i++) {
    mistPuff(ctx, x + (r() - 0.5) * 260 * s, y + (r() - 0.5) * 60 * s,
      (70 + r() * 90) * s, (24 + r() * 26) * s, rgb, a * (0.5 + r() * 0.5));
  }
}
/* kontaktní stín pod objektem — širší měkký okraj + tmavší jádro */
function contactShadow(ctx, x, y, rx, ry, a, rgb) {
  a = a == null ? 1 : a;
  rgb = rgb || '60,80,130';
  ctx.fillStyle = 'rgba(' + rgb + ',' + (0.12 * a).toFixed(3) + ')';
  ctx.beginPath(); ctx.ellipse(x, y, rx * 1.5, ry * 1.55, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(' + rgb + ',' + (0.30 * a).toFixed(3) + ')';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}
/* dlouhý modrofialový vržený stín od paty objektu směrem od slunce */
function castShadow(ctx, x, y, w, dx, dy, a, rgb) {
  ctx.fillStyle = 'rgba(' + (rgb || '95,90,165') + ',' + (a == null ? 0.18 : a) + ')';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w * 0.28 + dx, y + dy);
  ctx.lineTo(x - w * 0.28 + dx, y + dy);
  ctx.closePath(); ctx.fill();
}
/* globální „paper grain" — jednorázový noise pattern, dvojí průchod (tmavý + světlý) */
let _grainDark = null, _grainLight = null;
function makeGrainCanvas(light) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = mulberry(light ? 7771 : 7772);
  g.fillStyle = light ? '#ffffff' : '#000000';
  for (let i = 0; i < 3200; i++) {
    g.globalAlpha = 0.2 + r() * 0.8;
    const sz = 0.5 + r() * 1.7;
    g.fillRect(r() * 256, r() * 256, sz, sz * (0.5 + r()));
  }
  return c;
}
function grain(ctx, w, h, a) {
  if (!_grainDark) { _grainDark = makeGrainCanvas(false); _grainLight = makeGrainCanvas(true); }
  a = a == null ? 0.05 : a;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = ctx.createPattern(_grainDark, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = a * 0.85;
  ctx.fillStyle = ctx.createPattern(_grainLight, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/* ------------------------------------------------- dynamické pomocníky */
/* padající sníh — deterministický z t, 3 hloubky v jednom volání */
function snowDyn(ctx, t, w, seed, count, wind, col) {
  const r = mulberry(seed);
  ctx.fillStyle = col || '#e8f0fa';
  const span = w + 240;
  for (let i = 0; i < count; i++) {
    const depth = r();
    const sp = 26 + depth * 74;
    const rad = 0.8 + depth * 2.6;
    const ph = r() * TAU, sw = 18 + r() * 52;
    const x0 = r() * span, y0 = r() * 1120;
    const y = (y0 + t * sp) % 1120 - 20;
    let x = x0 + Math.sin(t * 0.6 + ph) * sw + t * (wind || 10) * depth;
    x = ((x % span) + span) % span - 120;
    ctx.globalAlpha = 0.22 + depth * 0.55;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/* kouř z komína */
function smokeDyn(ctx, t, x, y, seed, s, rgb, alpha, wind) {
  for (let i = 0; i < 9; i++) {
    const life = ((t * 0.13 + i / 9 + (seed * 0.37) % 1) % 1);
    const px = x + Math.sin(t * 0.5 + i * 1.9 + seed) * (3 + life * 15) * s + life * life * (wind == null ? 30 : wind) * s;
    const py = y - life * 100 * s;
    const rr = (4 + life * 18) * s;
    ctx.globalAlpha = alpha * (1 - life) * (0.3 + life * 0.7);
    ctx.fillStyle = 'rgba(' + rgb + ',1)';
    ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/* plamen svíčky / ohně (s = velikost, seed fázuje mihotání) */
function flameDyn(ctx, t, x, y, s, seed) {
  const fl = 0.78 + 0.22 * Math.sin(t * 11 + seed) * Math.sin(t * 17.3 + seed * 2.1);
  const sway = Math.sin(t * 7.1 + seed) * 2.1;
  glow(ctx, x, y - 8 * s, 30 * s * fl, '255,170,60', 0.30);
  ctx.save();
  ctx.translate(x + sway * s * 0.4, y);
  ctx.scale(s, s * fl);
  ctx.fillStyle = 'rgba(255,140,40,0.85)';
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(-7, -8, sway * 0.5, -22);
  ctx.quadraticCurveTo(7, -8, 0, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,214,120,0.95)';
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.quadraticCurveTo(-4, -5, sway * 0.35, -14);
  ctx.quadraticCurveTo(4, -5, 0, 1);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,250,225,0.95)';
  ctx.beginPath(); ctx.ellipse(0, -4.5, 1.9, 3.6, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
/* táborák / oheň v koši (větší, s jazyky) */
function fireDyn(ctx, t, x, y, s, seed) {
  glow(ctx, x, y - 14 * s, 95 * s, '255,150,50', 0.22 + 0.05 * Math.sin(t * 9 + seed));
  for (let i = 0; i < 5; i++) {
    const ph = seed + i * 2.3;
    const fl = 0.6 + 0.4 * Math.sin(t * (8 + i) + ph) * Math.sin(t * 13.7 + ph * 2);
    const bx = x + Math.sin(ph * 3.1) * 12 * s;
    const hh = (34 + i * 7) * s * (0.7 + 0.3 * fl);
    const sway = Math.sin(t * 6 + ph) * 5 * s;
    ctx.fillStyle = 'rgba(255,' + (110 + i * 22) + ',' + (30 + i * 10) + ',' + (0.5 - i * 0.06) + ')';
    ctx.beginPath();
    ctx.moveTo(bx - (10 - i) * s, y);
    ctx.quadraticCurveTo(bx - 4 * s + sway, y - hh * 0.55, bx + sway, y - hh);
    ctx.quadraticCurveTo(bx + 4 * s + sway * 0.6, y - hh * 0.55, bx + (10 - i) * s, y);
    ctx.closePath(); ctx.fill();
  }
  // jiskry
  const r = mulberry((seed * 97) | 0);
  ctx.fillStyle = '#ffca6e';
  for (let i = 0; i < 7; i++) {
    const life = ((t * (0.5 + r() * 0.5) + r()) % 1);
    const sx = x + Math.sin(t * 2.2 + i * 2.6) * (6 + life * 22) * s;
    const sy = y - 10 * s - life * 90 * s;
    ctx.globalAlpha = (1 - life) * 0.8;
    ctx.fillRect(sx, sy, 2.2, 2.2);
  }
  ctx.globalAlpha = 1;
}
/* třpytky (led, sníh, voda) */
function sparkleDyn(ctx, t, seed, n, x, y, rw, rh, rgb) {
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const px = x + r() * rw, py = y + r() * rh, ph = r() * TAU, sp = 1.6 + r() * 3;
    const a = Math.sin(t * sp + ph);
    if (a < 0.62) continue;
    ctx.globalAlpha = (a - 0.62) * 2.6;
    ctx.fillStyle = 'rgba(' + (rgb || '255,255,255') + ',1)';
    ctx.fillRect(px - 2, py - 0.6, 4, 1.2);
    ctx.fillRect(px - 0.6, py - 2, 1.2, 4);
  }
  ctx.globalAlpha = 1;
}
/* letící pták (ph = fáze mávání) */
function flyBird(ctx, x, y, s, ph, col) {
  const f = Math.sin(ph) * 0.9;
  ctx.strokeStyle = col || 'rgba(30,34,48,0.9)';
  ctx.lineWidth = 2.4 * s; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 11 * s, y - f * 7 * s);
  ctx.quadraticCurveTo(x - 4 * s, y + f * 4 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y + f * 4 * s, x + 11 * s, y - f * 7 * s);
  ctx.stroke();
}
/* sedící vrána/vrabec */
function perchBird(ctx, x, y, s, dir, hop, col) {
  ctx.save();
  ctx.translate(x, y - hop);
  ctx.scale(dir * s, s);
  ctx.fillStyle = col || '#20242f';
  ctx.beginPath();
  ctx.ellipse(0, -7, 9, 6.5, -0.15, 0, TAU);
  ctx.fill();
  ctx.beginPath(); ctx.arc(7, -12, 4.4, 0, TAU); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8, -6); ctx.lineTo(-17, -2.5); ctx.lineTo(-8, -3.4);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9932e';
  ctx.beginPath(); ctx.moveTo(10.6, -12.6); ctx.lineTo(15.5, -11.2); ctx.lineTo(10.6, -10.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#20242f'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-2, -1); ctx.lineTo(-2, 0); ctx.moveTo(2, -1); ctx.lineTo(2, 0); ctx.stroke();
  ctx.restore();
}
/* stopy — vyšlapaná pěšina ve sněhu */
function trodden(ctx, x0, y0, x1, y1, wdt, seed, col) {
  const r = mulberry(seed);
  const n = 26;
  ctx.fillStyle = col || 'rgba(157,180,214,0.5)';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const px = lerp(x0, x1, t) + (r() - 0.5) * wdt * 0.7;
    const py = lerp(y0, y1, t) + (r() - 0.5) * 14;
    ctx.globalAlpha = 0.25 + r() * 0.4;
    ctx.beginPath(); ctx.ellipse(px, py, 9 + r() * 8, 3.5 + r() * 2.5, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* =========================================================================
   SCÉNA: title — noční nebe nad siluetou zámku (1920)
   ========================================================================= */
(function () {
  const SW = 1920;
  // komíny městečka pro kouř (x, y)
  const CHIM = [[260, 905], [742, 872], [1245, 890], [1692, 862]];

  BNJ.registerScene({
    id: 'title',
    width: SW,
    name: { cz: 'Ztracený list', en: 'The Lost Letter' },
    layers: [
      { // nebe + mléčná dráha
        parallax: 0,
        paint(x) {
          x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#081428'], [0.45, '#0b1d3a'], [0.8, '#16304e'], [1, '#1c3a5e']]);
          x.fillRect(0, 0, SW, H);
          // mléčná dráha — výraznější pás s jádrem, prachovou trhlinou
          // a chuchvalci hvězd (astronomická hra — nebe je hlavní kulisa)
          const r = mulberry(4001);
          x.save();
          x.translate(880, 360); x.rotate(-0.5);
          x.fillStyle = 'rgba(205,218,242,0.08)';
          x.fillRect(-1500, -170, 3000, 340);
          x.fillStyle = 'rgba(222,232,250,0.10)';
          x.fillRect(-1500, -85, 3000, 170);
          // jasné jádro pásu — měkké obláčky záře
          for (let i = 0; i < 26; i++) {
            const gx = -1400 + r() * 2800;
            const gy = (r() - 0.5) * 90;
            mistPuff(x, gx, gy, 90 + r() * 130, 26 + r() * 30, '216,226,248', 0.10 + r() * 0.08);
          }
          // temná prachová trhlina (Great Rift) podél jádra
          for (let i = 0; i < 16; i++) {
            const gx = -1200 + i * 160 + (r() - 0.5) * 90;
            mistPuff(x, gx, 12 + Math.sin(i * 0.9) * 26 + (r() - 0.5) * 18, 100 + r() * 90, 14 + r() * 16, '8,16,32', 0.16 + r() * 0.10);
          }
          x.fillStyle = '#f5f0dc';
          for (let i = 0; i < 900; i++) {
            const gx = -1400 + r() * 2800;
            const gy = (r() + r() + r() - 1.5) * 130;
            x.globalAlpha = 0.05 + r() * 0.32;
            x.beginPath(); x.arc(gx, gy, 0.4 + r() * 1.2, 0, TAU); x.fill();
          }
          // chuchvalce/hvězdokupy — lokální zhuštění
          for (let k = 0; k < 7; k++) {
            const ccx = -1200 + r() * 2400, ccy = (r() - 0.5) * 160;
            for (let i = 0; i < 40; i++) {
              x.globalAlpha = 0.08 + r() * 0.3;
              x.beginPath();
              x.arc(ccx + (r() + r() - 1) * 60, ccy + (r() + r() - 1) * 40, 0.4 + r() * 1, 0, TAU);
              x.fill();
            }
          }
          x.restore();
          x.globalAlpha = 1;
          // statický hvězdný prach (jemný — hlavní hvězdy třpytí dynamika)
          x.fillStyle = '#f5f0dc';
          for (let i = 0; i < 340; i++) {
            x.globalAlpha = 0.06 + r() * 0.3;
            x.beginPath(); x.arc(r() * SW, r() * 720, 0.4 + r() * 0.9, 0, TAU); x.fill();
          }
          x.globalAlpha = 1;
          // Kasiopeja s Tychonovou novou (1572!) — W nad kopci vlevo,
          // hvězdy s jemným křížovým zábleskem, nova nejjasnější
          const CAS = [[300, 240], [368, 186], [436, 218], [498, 152], [572, 178]];
          x.strokeStyle = 'rgba(180,198,232,0.10)'; x.lineWidth = 1.6;
          x.beginPath();
          for (let i = 0; i < CAS.length; i++) i ? x.lineTo(CAS[i][0], CAS[i][1]) : x.moveTo(CAS[i][0], CAS[i][1]);
          x.stroke();
          const spike = (sx, sy, rad, a) => {
            glow(x, sx, sy, rad * 5, '225,235,255', a * 0.5);
            x.strokeStyle = 'rgba(235,240,255,' + (a * 0.7).toFixed(2) + ')';
            x.lineWidth = 1.2;
            x.beginPath();
            x.moveTo(sx - rad * 3.4, sy); x.lineTo(sx + rad * 3.4, sy);
            x.moveTo(sx, sy - rad * 3.4); x.lineTo(sx, sy + rad * 3.4);
            x.stroke();
            x.fillStyle = '#f2f4ff';
            x.globalAlpha = a;
            x.beginPath(); x.arc(sx, sy, rad, 0, TAU); x.fill();
            x.globalAlpha = 1;
          };
          for (const [sx2, sy2] of CAS) spike(sx2, sy2, 1.8, 0.75);
          spike(452, 128, 3, 0.95); // „nova stella" — Tychonova supernova
          grain(x, SW, H, 0.035);
        }
      },
      { // měsíc + závoje mraků
        parallax: 0.15,
        paint(x) {
          // dvojité halo měsíce
          glow(x, 1545, 195, 260, '235,228,200', 0.14);
          glow(x, 1545, 195, 150, '240,232,205', 0.26);
          x.fillStyle = '#f0e6c8';
          x.beginPath(); x.arc(1545, 195, 54, 0, TAU); x.fill();
          x.fillStyle = 'rgba(198,188,158,0.55)';
          x.beginPath(); x.arc(1526, 180, 9, 0, TAU); x.fill();
          x.beginPath(); x.arc(1562, 212, 12, 0, TAU); x.fill();
          x.beginPath(); x.arc(1535, 222, 6, 0, TAU); x.fill();
          // stínová strana měsíce (terminátor vlevo dole)
          x.fillStyle = 'rgba(90,100,120,0.35)';
          x.beginPath();
          x.arc(1545, 195, 54, Math.PI * 0.55, Math.PI * 1.45);
          x.quadraticCurveTo(1512, 195, 1526, 149);
          x.closePath(); x.fill();
          x.fillStyle = 'rgba(240,232,208,0.5)';
          x.beginPath(); x.arc(1545, 195, 54, -1.9, 1.1); x.arc(1545, 195, 46, 1.1, -1.9, true); x.fill();
          // noční mraky — stínové břicho + hřbet postříbřený měsícem
          softCloud(x, 420, 260, 1.3, '30,48,86', 0.4, 70);
          cloud2(x, 420, 250, 1.4, '#3a527e', '#182848', 0.55, 71, 1);
          cloud2(x, 1180, 140, 1.1, '#48608c', '#16264a', 0.5, 72, 1);
          cloud2(x, 1660, 330, 0.9, '#4a6290', '#1c2c50', 0.45, 73, -1);
          softCloud(x, 900, 360, 1.2, '28,44,80', 0.3, 74);
          softCloud(x, 180, 470, 1.4, '24,38,72', 0.35, 75);
          cloud2(x, 320, 560, 1.1, '#31497a', '#142244', 0.35, 76, 1);
          softCloud(x, 1350, 500, 1.3, '26,40,76', 0.28, 77);
          // klín divokých hus protíná měsíční zář — černé siluety
          const rg = mulberry(78);
          for (let i = 0; i < 9; i++) {
            const k = i - 4;
            const bx = 1420 + k * 44 + (rg() - 0.5) * 12;
            const by = 250 + Math.abs(k) * 24 + (rg() - 0.5) * 8;
            flyBird(x, bx, by, 0.34 + rg() * 0.2, rg() * TAU, 'rgba(10,14,26,' + (0.6 + rg() * 0.3) + ')');
          }
          // pár nočních opozdilců vlevo
          flyBird(x, 520, 380, 0.3, 1.2, 'rgba(12,16,30,0.5)');
          flyBird(x, 640, 340, 0.26, 3.4, 'rgba(12,16,30,0.45)');
        }
      },
      { // vzdálené kopce
        parallax: 0.35,
        paint(x) {
          const r = mulberry(4002);
          const hill = (base, amp, col) => {
            x.fillStyle = col;
            x.beginPath(); x.moveTo(-10, H);
            for (let px = -10; px <= SW + 10; px += 40) {
              x.lineTo(px, base + Math.sin(px * 0.0035 + base) * amp + (r() - 0.5) * 16);
            }
            x.lineTo(SW + 10, H); x.closePath(); x.fill();
          };
          hill(600, 30, '#182747'); // nejvzdálenější hřeben — změkčí přechod nebe/země
          hill(660, 42, '#15233f');
          hill(724, 34, '#101c33');
          // sněhový přísvit hřebenů
          x.strokeStyle = 'rgba(184,207,232,0.16)'; x.lineWidth = 3;
          x.beginPath();
          for (let px = -10; px <= SW + 10; px += 40) {
            const y = 660 + Math.sin(px * 0.0035 + 660) * 42;
            px === -10 ? x.moveTo(px, y) : x.lineTo(px, y);
          }
          x.stroke();
        }
      },
      { // zámek na návrší
        parallax: 0.6,
        paint(x) {
          // návrší
          x.fillStyle = '#0e1830';
          x.beginPath();
          x.moveTo(760, H);
          x.quadraticCurveTo(950, 700, 1130, 648);
          x.lineTo(1760, 640);
          x.quadraticCurveTo(1880, 700, 1920, 780);
          x.lineTo(1920, H);
          x.closePath(); x.fill();
          // silueta zámku — dlouhé křídlo + věž s cibulovou bání
          const sil = '#111a2e';
          x.fillStyle = sil;
          x.fillRect(1120, 470, 520, 180); // křídlo
          fillP(x, [[1120, 470], [1180, 415], [1580, 415], [1640, 470]], sil); // střecha křídla
          // štíty
          fillP(x, [[1200, 470], [1240, 420], [1280, 470]], sil);
          fillP(x, [[1450, 470], [1490, 420], [1530, 470]], sil);
          // věž
          x.fillRect(1275, 250, 92, 240);
          // ochoz
          x.fillRect(1263, 288, 116, 14);
          // cibulová báň
          x.beginPath();
          x.moveTo(1267, 250);
          x.bezierCurveTo(1256, 205, 1290, 195, 1321, 172);
          x.bezierCurveTo(1352, 195, 1386, 205, 1375, 250);
          x.closePath(); x.fill();
          x.fillRect(1318, 128, 6, 46); // hrot
          x.beginPath(); x.arc(1321, 124, 6, 0, TAU); x.fill();
          // arkádové oblouky křídla (prosvit nebe? ne — jen tmavší zářezy)
          x.fillStyle = '#0b1226';
          for (let i = 0; i < 7; i++) {
            const ax = 1160 + i * 68;
            x.beginPath();
            x.moveTo(ax, 650); x.lineTo(ax, 592);
            x.arc(ax + 20, 592, 20, Math.PI, 0);
            x.lineTo(ax + 40, 650);
            x.closePath(); x.fill();
          }
          // měsíční rim-light na báni a hřebeni
          x.strokeStyle = 'rgba(200,216,240,0.5)'; x.lineWidth = 2.4; x.lineCap = 'round';
          x.beginPath();
          x.moveTo(1375, 248);
          x.bezierCurveTo(1386, 205, 1352, 196, 1322, 173);
          x.stroke();
          x.strokeStyle = 'rgba(200,216,240,0.28)';
          x.beginPath(); x.moveTo(1180, 416); x.lineTo(1578, 416); x.stroke();
          // sníh na římsách
          snowBand(x, [[1263, 288], [1379, 288]], 7, 40011, '#8fa8cc', '#3c527a');
          snowBand(x, [[1120, 470], [1640, 470]], 8, 40012, '#7d97bd', '#31456b');
          // okna zámku (temná; observatoř svítí dynamicky)
          x.fillStyle = 'rgba(18,26,46,0.9)';
          for (let i = 0; i < 8; i++) x.fillRect(1150 + i * 62, 510, 22, 34);
          // okno observatoře ve věži (dyn. glow kreslí dynamic())
          x.fillStyle = 'rgba(30,38,60,1)';
          x.fillRect(1303, 330, 36, 48);
        }
      },
      { // střechy městečka v popředí
        parallax: 1,
        paint(x) {
          const r = mulberry(4005);
          // hmota města
          x.fillStyle = '#0a1122';
          x.fillRect(0, 900, SW, H - 900);
          // řada štítů a střech
          const roofs = [
            [40, 985, 300, 870], [230, 985, 560, 855], [520, 985, 830, 880],
            [790, 985, 1120, 858], [1080, 985, 1400, 875], [1360, 985, 1700, 852], [1660, 985, 1940, 872]
          ];
          for (let i = 0; i < roofs.length; i++) {
            const [x0, y0, x1, yTop] = roofs[i];
            // hřeben mimo střed + mírně jiný tón — žádné dvě střechy stejné
            const mid = (x0 + x1) / 2 + (r() - 0.5) * 70;
            const cols = ['#0c1428', '#0e1730', '#0b1224', '#101a34'];
            fillP(x, [[x0, y0], [mid, yTop], [x1, y0], [x1, H], [x0, H]], cols[i % 4]);
            snowBand(x, [[x0 + 8, y0 - 4], [mid, yTop]], 10, 4100 + i, '#c3d3ec', '#5a7099');
            snowBand(x, [[mid, yTop], [x1 - 8, y0 - 4]], 10, 4140 + i, '#b0c3e0', '#4c6089');
            // vikýř na některých střechách
            if (i % 3 === 1) {
              const dx2 = lerp(x0 + 40, mid, 0.55);
              const dy2 = lerp(y0 - 6, yTop, 0.4);
              x.fillStyle = cols[(i + 2) % 4];
              x.fillRect(dx2 - 14, dy2 - 4, 28, 26);
              fillP(x, [[dx2 - 19, dy2 - 4], [dx2, dy2 - 20], [dx2 + 19, dy2 - 4]], cols[(i + 2) % 4]);
              snowBand(x, [[dx2 - 15, dy2 - 6], [dx2, dy2 - 17], [dx2 + 15, dy2 - 6]], 5, 4160 + i, '#c3d3ec', '#5a7099');
            }
            // teplá okénka sem tam
            if (r() > 0.35) {
              const wx = mid - 12 + (r() - 0.5) * 60;
              glow(x, wx + 7, y0 - 34, 40, '255,190,100', 0.28);
              x.fillStyle = '#ffc063';
              x.fillRect(wx, y0 - 44, 14, 20);
              x.fillStyle = 'rgba(20,14,10,0.85)';
              x.fillRect(wx + 6, y0 - 44, 2, 20);
            }
          }
          // komíny
          x.fillStyle = '#0c1326';
          for (const c of CHIM) {
            x.fillRect(c[0] - 10, c[1], 20, 46);
            x.fillRect(c[0] - 13, c[1] - 6, 26, 8);
            snowBand(x, [[c[0] - 13, c[1] - 8], [c[0] + 13, c[1] - 8]], 5, (c[0] | 0), '#c3d3ec', '#5a7099');
          }
          // zvonička vlevo
          x.fillStyle = '#0b1224';
          x.fillRect(96, 800, 54, 130);
          fillP(x, [[86, 800], [123, 748], [160, 800]], '#0b1224');
          snowBand(x, [[92, 798], [123, 752], [154, 798]], 7, 4171, '#c3d3ec', '#5a7099');
          x.fillStyle = 'rgba(255,190,100,0.15)';
          x.fillRect(112, 828, 22, 30);
          // sněhová pláň dole
          x.fillStyle = lg(x, 0, 1010, 0, H, [[0, '#22314f'], [1, '#141f38']]);
          x.beginPath();
          x.moveTo(0, 1030);
          for (let px = 0; px <= SW; px += 90) x.lineTo(px, 1022 + Math.sin(px * 0.01 + 2) * 10);
          x.lineTo(SW, H); x.lineTo(0, H); x.closePath(); x.fill();
          scumble(x, 0, 1010, SW, 70, 4180, 260, ['#2c3d61', '#1b2946', '#31446b', '#3c507c'], 3, 11, 0.45);
          // měsíční pěšina na sněhové pláni
          x.fillStyle = 'rgba(200,212,238,0.10)';
          x.beginPath(); x.ellipse(1500, 1046, 320, 26, 0, 0, TAU); x.fill();
          // globální malířské zrno
          grain(x, SW, H, 0.05);
        }
      }
    ],
    dynamic(ctx, t) {
      // třpyt hvězd
      const r = mulberry(909);
      ctx.fillStyle = '#f5f0dc';
      for (let i = 0; i < 150; i++) {
        const sx = r() * SW, sy = r() * 660, ph = r() * TAU, sp = 0.6 + r() * 1.9, rad = 0.5 + r() * 1.4;
        const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * sp + ph));
        ctx.globalAlpha = a * 0.8;
        ctx.beginPath(); ctx.arc(sx, sy, rad, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // padající hvězda ~ každých 31 s
      {
        const cyc = Math.floor(t / 31), ph = t % 31;
        if (ph < 1.1) {
          const r2 = mulberry(cyc + 17);
          const sx = 150 + r2() * 1400, sy = 70 + r2() * 260;
          const dx = 240 + r2() * 220, dy = 100 + r2() * 90;
          const p = ph / 1.1;
          const hx = sx + dx * p, hy = sy + dy * p;
          const gr = ctx.createLinearGradient(hx - dx * 0.2, hy - dy * 0.2, hx, hy);
          gr.addColorStop(0, 'rgba(245,240,220,0)');
          gr.addColorStop(1, 'rgba(245,240,220,' + (0.9 * Math.sin(p * Math.PI)) + ')');
          ctx.strokeStyle = gr; ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.moveTo(hx - dx * 0.2, hy - dy * 0.2); ctx.lineTo(hx, hy); ctx.stroke();
        }
      }
      // dech měsíčního svitu
      glow(ctx, 1545, 195, 165 * (0.92 + Math.sin(t * 0.35) * 0.08), '240,230,200', 0.13);
      // okno observatoře ve věži — Brahe pozoruje (cyklus 17 s)
      {
        const cyc = t % 17, on = cyc > 2.4;
        const fl = on ? 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 9.1) * Math.sin(t * 4.7)) : 0.06;
        glow(ctx, 1321, 354, 66, '255,179,71', 0.5 * fl);
        ctx.fillStyle = 'rgba(255,199,101,' + (0.85 * fl) + ')';
        ctx.fillRect(1303, 330, 36, 48);
        ctx.fillStyle = 'rgba(17,26,46,0.9)';
        ctx.fillRect(1319, 330, 4, 48);
        ctx.fillRect(1303, 352, 36, 4);
      }
      // kouř z komínů městečka
      for (let i = 0; i < CHIM.length; i++) {
        smokeDyn(ctx, t, CHIM[i][0], CHIM[i][1] - 4, i * 3 + 1, 0.9, '159,176,200', 0.16, 22);
      }
      // sníh — 3 hloubky
      snowDyn(ctx, t, SW, 911, 130, 9, '#dfe9f5');
    },
    overlayDynamic(ctx) {
      const vg = ctx.createRadialGradient(W / 2, H * 0.42, 320, W / 2, H * 0.52, 1250);
      vg.addColorStop(0, 'rgba(4,6,14,0)');
      vg.addColorStop(1, 'rgba(4,6,14,0.52)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    },
    walkArea: [[300, 900], [1620, 900], [1620, 1040], [300, 1040]],
    scaleAt() { return 1; },
    exits: []
  });
})();

/* =========================================================================
   SCÉNA: castle_yard — zámecké nádvoří, pozdní zimní odpoledne (2600)
   ========================================================================= */
(function () {
  const SW = 2600;

  BNJ.registerScene({
    id: 'castle_yard',
    width: SW,
    name: { cz: 'Nádvoří zámku', en: 'Castle Courtyard' },
    lightTint: 'rgba(255,196,130,0.10)',
    spawn: [420, 950],
    layers: [
      { // nebe + nízké slunce + daleké kopce
        parallax: 0.2,
        paint(x) {
          x.fillStyle = lg(x, 0, 0, 0, 900, [[0, '#7fa3c4'], [0.35, '#a7c2d8'], [0.62, '#dfc9a4'], [0.85, '#f4c98a'], [1, '#f7d9a4']]);
          x.fillRect(0, 0, SW, 900);
          x.fillStyle = '#f4c98a'; x.fillRect(0, 880, SW, 220);
          // nízké zlaté slunce
          glow(x, 430, 560, 420, '255,214,150', 0.5);
          glow(x, 430, 560, 180, '255,236,190', 0.55);
          x.fillStyle = '#fff3d2';
          x.beginPath(); x.arc(430, 560, 52, 0, TAU); x.fill();
          // pruhy zimních mraků prosvícené sluncem (dvoutónové: teplý vršek od slunce, chladnější břicho)
          softCloud(x, 700, 306, 1.4, '214,190,160', 0.4, 90);
          cloud2(x, 700, 300, 1.9, '#f6e2b6', '#c4a98e', 0.55, 91, -1);
          cloud2(x, 1500, 210, 2.3, '#eed6ae', '#b39a88', 0.5, 92, -1);
          cloud2(x, 2200, 340, 1.7, '#f2dcac', '#bfa48c', 0.5, 93, -1);
          cloud2(x, 1100, 430, 1.5, '#f8e4b8', '#c9ac90', 0.45, 94, -1);
          softCloud(x, 1800, 300, 1.6, '230,206,170', 0.3, 95);
          // hejno ptáků v dálce (statické tečky, živí létají v dynamice)
          x.fillStyle = 'rgba(90,80,80,0.4)';
          const r = mulberry(95);
          for (let i = 0; i < 9; i++) {
            const bx = 1500 + r() * 500, by = 240 + r() * 110;
            x.fillRect(bx, by, 4, 1.4);
          }
          // vzdálené zasněžené kopce za hradbou
          const hills = (base, amp, col) => {
            x.fillStyle = col;
            x.beginPath(); x.moveTo(-10, H);
            for (let px = -10; px <= SW + 10; px += 50) {
              x.lineTo(px, base + Math.sin(px * 0.003 + base * 0.1) * amp);
            }
            x.lineTo(SW + 10, H); x.closePath(); x.fill();
          };
          hills(690, 30, '#c3ccd8');
          hills(750, 24, '#aeb9cc');
          // malířské zrno přes nebe
          grain(x, SW, H, 0.035);
        }
      },
      { // zadní křídlo zámku s velkou věží
        parallax: 0.45,
        paint(x) {
          // fasáda — 4 hodnotové zóny s výrazným rozpětím: světlo nahoře, lokál, stín, studená pata
          const wallG = lg(x, 0, 300, 0, 840, [[0, '#efdcb5'], [0.4, '#d3c19c'], [0.72, '#a8916f'], [1, '#82715c']]);
          // hlavní fronta
          x.fillStyle = wallG;
          x.fillRect(200, 400, 2400, 440);
          // studený odraz sněhu zespoda
          x.fillStyle = lg(x, 0, 760, 0, 845, [[0, 'rgba(150,170,210,0)'], [1, 'rgba(150,170,210,0.22)']]);
          x.fillRect(200, 760, 2400, 80);
          // malířský scumble přes celou frontu (viditelné tahy)
          scumble(x, 200, 400, 2400, 200, 5061, 420, ['#f2e2bc', '#e6d4ac', '#cdb890'], 4, 16, 0.30);
          scumble(x, 200, 600, 2400, 240, 5062, 420, ['#c9b48c', '#af9a76', '#8f7c60'], 4, 16, 0.26);
          // střecha
          fillP(x, [[170, 400], [280, 300], [2540, 300], [2600, 400]], '#8a7460');
          scumble(x, 200, 305, 2340, 92, 5063, 200, ['#9a8570', '#78624e', '#6a5644'], 3, 13, 0.32);
          snowBand(x, [[190, 396], [285, 306], [2530, 306], [2600, 396]], 16, 5001, '#f4f8fd', '#a9bedd');
          // stín hlavní římsy pod střechou — ukotví střechu k fasádě
          x.fillStyle = lg(x, 0, 400, 0, 424, [[0, 'rgba(66,48,30,0.34)'], [1, 'rgba(66,48,30,0)']]);
          x.fillRect(200, 400, 2400, 24);
          // sgrafitová psaníčka na fasádě — dole slábnou (stínová zóna rastr polyká)
          sgrafito(x, 200, 408, 2400, 130, 26, '#8a7454', 0.45);
          sgrafito(x, 200, 690, 2400, 150, 26, '#8a7454', 0.18);
          // opadaná omítka — velké plochy s jiným valérem + odhalené cihelné zdivo
          const plaster = (px2, py2, sw2, sh2, seed2, rot2) => {
            const rp = mulberry(seed2);
            x.save();
            x.translate(px2, py2);
            x.rotate(rot2 || 0);
            x.fillStyle = 'rgba(240,229,203,0.95)';
            x.beginPath();
            x.moveTo(-sw2 * 0.5, sh2 * 0.1);
            x.quadraticCurveTo(-sw2 * 0.42, -sh2 * (0.4 + rp() * 0.2), -sw2 * 0.12, -sh2 * 0.5);
            x.quadraticCurveTo(sw2 * (0.2 + rp() * 0.15), -sh2 * 0.55, sw2 * 0.46, -sh2 * 0.18);
            x.quadraticCurveTo(sw2 * (0.55 + rp() * 0.1), sh2 * 0.2, sw2 * 0.3, sh2 * 0.42);
            x.quadraticCurveTo(-rp() * sw2 * 0.2, sh2 * (0.5 + rp() * 0.12), -sw2 * 0.5, sh2 * 0.1);
            x.closePath(); x.fill();
            // stínek horní hrany odloupnuté omítky
            x.strokeStyle = 'rgba(88,62,38,0.5)'; x.lineWidth = 3;
            x.beginPath();
            x.moveTo(-sw2 * 0.5, sh2 * 0.1);
            x.quadraticCurveTo(-sw2 * 0.42, -sh2 * 0.5, -sw2 * 0.12, -sh2 * 0.5);
            x.stroke();
            // cihelné řádky uvnitř
            x.save();
            x.beginPath();
            x.ellipse(0, 0, sw2 * 0.36, sh2 * 0.36, 0, 0, TAU); x.clip();
            for (let rr2 = 0; rr2 < 5; rr2++) {
              const ry2 = -sh2 * 0.34 + rr2 * sh2 * 0.17;
              for (let cc = 0; cc < 5; cc++) {
                x.fillStyle = rp() > 0.5 ? 'rgba(164,98,58,0.8)' : 'rgba(142,84,52,0.8)';
                x.fillRect(-sw2 * 0.38 + cc * sw2 * 0.16 + (rr2 % 2) * sw2 * 0.08, ry2, sw2 * 0.14, sh2 * 0.13);
              }
            }
            x.restore();
            x.restore();
          };
          plaster(580, 474, 106, 88, 5064, -0.06);
          plaster(1470, 470, 108, 86, 5065.1, 0.05);
          plaster(1240, 740, 156, 58, 5066.2, 0.04);
          plaster(1800, 742, 168, 56, 5067.3, -0.03);
          plaster(2360, 482, 100, 82, 5068.4, 0.04);
          // menší oděrky
          const rpl = mulberry(5064);
          for (let i = 0; i < 7; i++) {
            const px2 = 260 + rpl() * 2200, py2 = 430 + rpl() * 110;
            x.fillStyle = 'rgba(238,226,198,0.85)';
            x.beginPath();
            x.ellipse(px2, py2, 16 + rpl() * 20, 8 + rpl() * 8, (rpl() - 0.5) * 0.6, 0, TAU);
            x.fill();
          }
          // zatékání pod římsou — dlouhé rezavé stružky s měkkým rozpitím
          const rz = mulberry(5069);
          for (let i = 0; i < 14; i++) {
            const dx2 = 240 + i * 172 + rz() * 60;
            const wz = 7 + rz() * 12, hz = 60 + rz() * 130;
            x.fillStyle = lg(x, 0, 404, 0, 404 + hz,
              [[0, 'rgba(104,74,44,0.34)'], [0.5, 'rgba(104,74,44,0.18)'], [1, 'rgba(104,74,44,0)']]);
            x.fillRect(dx2, 404, wz, hz);
            x.fillStyle = 'rgba(88,62,38,0.22)';
            x.fillRect(dx2 + wz * 0.3, 404, wz * 0.3, hz * 1.25);
          }
          // vlhká zelenavá mapa u paty zdi
          x.fillStyle = 'rgba(96,104,66,0.16)';
          x.beginPath(); x.ellipse(980, 812, 190, 42, 0.03, 0, TAU); x.fill();
          x.beginPath(); x.ellipse(2140, 820, 150, 34, -0.04, 0, TAU); x.fill();
          // kordonová římsa + vržený stín pod ní
          x.fillStyle = '#c9b48c'; x.fillRect(200, 545, 2400, 14);
          x.fillStyle = lg(x, 0, 559, 0, 580, [[0, 'rgba(70,50,30,0.4)'], [1, 'rgba(70,50,30,0)']]);
          x.fillRect(200, 559, 2400, 21);
          snowBand(x, [[200, 543], [2600, 543]], 7, 5002, '#f4f8fd', '#b9cbe4');
          // kamenný sokl — výškové členění paty fasády
          x.fillStyle = lg(x, 0, 768, 0, 840, [[0, '#8c7c66'], [1, '#6e6152']]);
          x.fillRect(200, 772, 2400, 68);
          x.fillStyle = 'rgba(50,40,30,0.35)'; x.fillRect(200, 772, 2400, 5);
          x.strokeStyle = 'rgba(58,48,38,0.4)'; x.lineWidth = 2.5;
          for (let i = 0; i < 24; i++) {
            const sx2 = 240 + i * 104 + (i % 2) * 30;
            x.beginPath(); x.moveTo(sx2, 777); x.lineTo(sx2 - 6, 840); x.stroke();
          }
          // dvě řady oken
          for (let i = 0; i < 13; i++) {
            const wx = 290 + i * 178;
            if (wx > 1930 && wx < 2240) continue; // věž
            litWindow(x, wx, 440, 46, 78, 0, 0);
            // kamenná šambrána
            x.strokeStyle = '#a98f62'; x.lineWidth = 6;
            x.strokeRect(wx - 7, 433, 60, 92);
            litWindow(x, wx, 610, 46, 88, i === 4 || i === 9 ? 0.8 : 0, i === 4 || i === 9 ? 60 : 0);
            x.strokeStyle = '#a98f62'; x.lineWidth = 6;
            x.strokeRect(wx - 7, 603, 60, 102);
            // špinavé stružky pod parapety (variované, ne u všech)
            if (i % 3 !== 1) {
              x.fillStyle = lg(x, 0, 528, 0, 570, [[0, 'rgba(96,68,42,0.30)'], [1, 'rgba(96,68,42,0)']]);
              x.fillRect(wx + 2 + (i % 4) * 6, 528, 6 + (i % 3) * 4, 42);
              x.fillStyle = lg(x, 0, 708, 0, 756, [[0, 'rgba(96,68,42,0.28)'], [1, 'rgba(96,68,42,0)']]);
              x.fillRect(wx + 6 + (i % 5) * 5, 708, 5 + (i % 3) * 4, 48);
            }
          }
          // velká věž s cibulovou bání
          const twG = lg(x, 1960, 0, 2230, 0, [[0, '#eeddb8'], [0.45, '#d9c9a8'], [1, '#a8916c']]);
          x.fillStyle = twG;
          x.fillRect(1975, 205, 240, 635);
          scumble(x, 1975, 210, 240, 620, 5065, 240, ['#f0e0ba', '#cdb890', '#a8916c'], 3, 12, 0.28);
          sgrafito(x, 1975, 215, 240, 620, 24, '#8a7454', 0.4);
          // ochoz věže
          x.fillStyle = '#c9b48c'; x.fillRect(1953, 262, 284, 18);
          x.fillStyle = 'rgba(110,86,52,0.55)'; x.fillRect(1953, 278, 284, 5);
          snowBand(x, [[1953, 258], [2237, 258]], 8, 5003, '#f4f8fd', '#b9cbe4');
          // hodiny na věži (jedna ručička — dobově)
          x.fillStyle = '#f0e2c0';
          x.beginPath(); x.arc(2095, 380, 46, 0, TAU); x.fill();
          x.strokeStyle = '#7a5c34'; x.lineWidth = 5; x.stroke();
          x.strokeStyle = '#3a2c1a'; x.lineWidth = 4;
          for (let i = 0; i < 12; i++) {
            const a = i / 12 * TAU;
            x.beginPath();
            x.moveTo(2095 + Math.cos(a) * 38, 380 + Math.sin(a) * 38);
            x.lineTo(2095 + Math.cos(a) * 43, 380 + Math.sin(a) * 43);
            x.stroke();
          }
          x.lineWidth = 5;
          x.beginPath(); x.moveTo(2095, 380); x.lineTo(2095 + 24, 380 - 20); x.stroke();
          // okna věže
          litWindow(x, 2062, 470, 40, 64, 0, 0);
          litWindow(x, 2062, 640, 40, 72, 0.9, 70); // observatoř za oknem svítí
          // cibulová báň (blackened copper)
          x.fillStyle = lg(x, 1975, 0, 2215, 0, [[0, '#5a6068'], [0.45, '#3a4448'], [1, '#262e34']]);
          x.beginPath();
          x.moveTo(1962, 205);
          x.bezierCurveTo(1935, 105, 2030, 88, 2088, 30);
          x.bezierCurveTo(2150, 88, 2252, 105, 2226, 205);
          x.closePath(); x.fill();
          // rim-light slunce zleva
          x.strokeStyle = 'rgba(255,220,160,0.7)'; x.lineWidth = 4; x.lineCap = 'round';
          x.beginPath();
          x.moveTo(1965, 200);
          x.bezierCurveTo(1940, 108, 2032, 90, 2087, 34);
          x.stroke();
          snowBand(x, [[1968, 202], [2222, 202]], 10, 5004, '#f4f8fd', '#a9bedd');
          // lucerna báně + makovice + korouhvička (prapor kreslí dynamic)
          x.fillStyle = '#3a4448';
          x.fillRect(2080, -20, 16, 52);
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(2088, -24, 9, 0, TAU); x.fill();
          // stín křídla na fasádu (slunce nízko zleva)
          x.fillStyle = 'rgba(90,80,120,0.14)';
          x.fillRect(2240, 400, 360, 440);
        }
      },
      { // boční křídlo s arkádami za věží (pravá strana) + stáje vlevo
        parallax: 0.7,
        paint(x) {
          // stáj / hospodářské křídlo vlevo za branou — 3 zóny + textura
          x.fillStyle = lg(x, 0, 520, 0, 850, [[0, '#d2bc94'], [0.55, '#b8a27c'], [1, '#94805e']]);
          x.fillRect(0, 560, 480, 290);
          scumble(x, 0, 560, 480, 290, 5066, 180, ['#dcc69e', '#a8926c', '#8a7656'], 3, 12, 0.30);
          fillP(x, [[0, 560], [70, 480], [430, 480], [480, 560]], '#7c6852');
          snowBand(x, [[0, 556], [74, 486], [426, 486], [478, 556]], 13, 5011, '#f4f8fd', '#a9bedd');
          x.fillStyle = '#5c422a';
          x.fillRect(120, 660, 90, 190);
          x.fillRect(300, 660, 90, 190);
          x.fillStyle = 'rgba(40,26,14,0.5)';
          x.fillRect(120, 660, 90, 12); x.fillRect(300, 660, 90, 12);
          // patrové křídlo s arkádami vpravo — 3 zóny + textura
          x.fillStyle = lg(x, 0, 460, 0, 850, [[0, '#e4d4ae'], [0.55, '#c9b28a'], [1, '#a68e68']]);
          x.fillRect(1500, 500, 1100, 350);
          scumble(x, 1500, 500, 1100, 350, 5067, 300, ['#ecdcb4', '#b8a27a', '#96825e'], 3, 13, 0.28);
          fillP(x, [[1470, 500], [1560, 420], [2600, 420], [2600, 500]], '#83705c');
          snowBand(x, [[1490, 496], [1565, 426], [2600, 426]], 13, 5012, '#f4f8fd', '#a9bedd');
          // stín římsy pod střechou křídla
          x.fillStyle = lg(x, 0, 500, 0, 522, [[0, 'rgba(66,48,30,0.32)'], [1, 'rgba(66,48,30,0)']]);
          x.fillRect(1500, 500, 1100, 22);
          sgrafito(x, 1500, 508, 1100, 90, 24, '#8a7454', 0.4);
          // zatékání i na křídle — rezavé stružky pod římsou
          const rz3 = mulberry(5068);
          for (let i = 0; i < 7; i++) {
            const dx3 = 1540 + i * 152 + rz3() * 44;
            const wz3 = 6 + rz3() * 9, hz3 = 40 + rz3() * 80;
            x.fillStyle = lg(x, 0, 504, 0, 504 + hz3,
              [[0, 'rgba(104,74,44,0.28)'], [1, 'rgba(104,74,44,0)']]);
            x.fillRect(dx3, 504, wz3, hz3);
          }
          // arkádová lodžie v patře — každý oblouk trochu jiný (žádný copy-paste)
          const arcH = [672, 668, 674, 670, 676, 666, 672, 670];
          const arcR = [44, 40, 46, 42, 44, 47, 41, 44];
          x.fillStyle = '#2c2216';
          for (let i = 0; i < 8; i++) {
            const ax = 1545 + i * 132;
            const ay = arcH[i], ar = arcR[i];
            if (i === 5) {
              // zazděný oblouk — cihlová záslepka
              x.fillStyle = '#a5885e';
              x.beginPath();
              x.moveTo(ax, 780); x.lineTo(ax, ay);
              x.arc(ax + 44, ay, ar, Math.PI, 0);
              x.lineTo(ax + 88, 780);
              x.closePath(); x.fill();
              x.strokeStyle = 'rgba(122,84,54,0.6)'; x.lineWidth = 2.5;
              for (let k = 0; k < 5; k++) {
                x.beginPath(); x.moveTo(ax + 4, 700 + k * 18); x.lineTo(ax + 84, 700 + k * 18); x.stroke();
              }
              x.fillStyle = '#2c2216';
            } else {
              x.fillStyle = '#2c2216';
              x.beginPath();
              x.moveTo(ax, 780); x.lineTo(ax, ay);
              x.arc(ax + 44, ay, ar, Math.PI, 0);
              x.lineTo(ax + 88, 780);
              x.closePath(); x.fill();
              // v jednom oblouku složené dříví, v jiném zábradlí s prádlem
              if (i === 2) {
                x.fillStyle = '#54401f';
                for (let k = 0; k < 4; k++) {
                  x.beginPath(); x.ellipse(ax + 24 + k * 14, 768 - (k % 2) * 10, 6, 6, 0, 0, TAU); x.fill();
                }
                x.fillStyle = '#2c2216';
              }
              if (i === 6) {
                x.fillStyle = '#7a3a2e';
                x.fillRect(ax + 14, 726, 30, 40);
                x.fillStyle = '#2c2216';
              }
            }
            // rim-light oblouku
            x.strokeStyle = 'rgba(255,214,150,0.55)'; x.lineWidth = 3.5;
            x.beginPath(); x.arc(ax + 44, ay, ar, Math.PI, Math.PI * 1.5); x.stroke();
            x.fillStyle = '#c9b48c';
            x.fillRect(ax - 10, 780, 14, 70);
            x.fillStyle = '#2c2216';
          }
          x.fillStyle = '#c9b48c'; x.fillRect(1500, 776, 1100, 10);
          snowBand(x, [[1500, 774], [2600, 774]], 6, 5013, '#f4f8fd', '#b9cbe4');
          // teplý dech atmosférické perspektivy
          x.fillStyle = 'rgba(244,201,138,0.08)';
          x.fillRect(0, 0, SW, H);
        }
      },
      { // 1.0 — nádvoří: brána, arkády se slunečními hodinami, studna, věžní schodiště
        parallax: 1,
        walkBehind: [
          // sněhová závěj s keříkem vlevo dole
          [[0, 1002], [150, 1006], [330, 1030], [420, 1080], [0, 1080]],
          // závěj vpravo dole
          [[2280, 1040], [2450, 1018], [2600, 1026], [2600, 1080], [2280, 1080]]
        ],
        paint(x) {
          const r = mulberry(5100);
          /* --- sněhová pláň nádvoří — 3 hodnotové zóny --- */
          x.fillStyle = lg(x, 0, 790, 0, H, [[0, '#c8d5ea'], [0.3, '#eef3fa'], [0.62, '#dde7f4'], [1, '#b2c3e0']]);
          x.fillRect(0, 800, SW, H - 800);
          // teplá zóna zlatého světla od slunce (zleva)
          x.fillStyle = lg(x, 200, 0, 1400, 0, [[0, 'rgba(255,216,150,0.22)'], [1, 'rgba(255,216,150,0)']]);
          x.fillRect(0, 800, 1400, H - 800);
          // studená stínová zóna pod pravými budovami
          x.fillStyle = lg(x, 1900, 0, 2600, 0, [[0, 'rgba(105,118,178,0)'], [1, 'rgba(105,118,178,0.20)']]);
          x.fillRect(1900, 800, 700, H - 800);
          // teplé sluneční pruhy na sněhu
          fillP(x, [[300, 830], [420, 826], [1000, 1080], [700, 1080]], 'rgba(255,214,150,0.16)');
          scumble(x, 0, 800, SW, 280, 5101, 760, ['#dfe9f7', '#c3d2ea', '#f6f9fd', '#a9bcdd', '#e8d9c0'], 3, 12, 0.45);
          // dlouhé modrofialové vržené stíny — od skutečných objektů, slunce nízko na (430,560)
          castShadow(x, 810, 850, 700, 520, 230, 0.16);   // arkádová chodba
          castShadow(x, 1560, 875, 200, 260, 190, 0.20);  // studna
          castShadow(x, 1340, 872, 190, 230, 170, 0.18);  // saně
          castShadow(x, 1840, 888, 180, 260, 180, 0.20);  // bouda
          castShadow(x, 2425, 905, 290, 480, 175, 0.18);  // schodišťová věžice
          castShadow(x, 305, 985, 220, 200, 95, 0.14);    // hromada sněhu
          // stíny pilířů arkád — dlouhé pruhy doprava dolů
          for (let i = 0; i <= 5; i++) {
            castShadow(x, 450 + i * 160, 850, 46, 210 + i * 8, 165, 0.15);
          }
          // vyšlapané pěšiny
          trodden(x, 330, 930, 1560, 900, 60, 5102);
          trodden(x, 1560, 900, 2380, 930, 60, 5103);
          trodden(x, 1300, 980, 1900, 940, 40, 5104);
          // stopy saní
          x.strokeStyle = 'rgba(150,170,210,0.55)'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(600, 1030); x.quadraticCurveTo(1100, 990, 1360, 905); x.stroke();
          x.beginPath(); x.moveTo(640, 1046); x.quadraticCurveTo(1140, 1004, 1385, 915); x.stroke();
          // teplý odlesk zlatého světla z brány — protažený po sněhu do středu dvora
          x.save();
          x.beginPath();
          x.moveTo(240, 856);
          x.quadraticCurveTo(700, 880, 1160, 1000);
          x.lineTo(1050, 1080); x.lineTo(300, 1080);
          x.quadraticCurveTo(180, 960, 240, 856);
          x.closePath(); x.clip();
          x.fillStyle = lg(x, 240, 0, 1160, 0,
            [[0, 'rgba(255,198,116,0.5)'], [0.35, 'rgba(255,204,132,0.28)'], [1, 'rgba(255,210,150,0)']]);
          x.fillRect(180, 840, 1000, 240);
          // teplé šmouhy v odlesku (rozbité, ne plocha)
          const rgl = mulberry(5105);
          for (let i = 0; i < 16; i++) {
            const gx2 = 260 + rgl() * 700, gy2 = 880 + rgl() * 170;
            x.fillStyle = 'rgba(255,214,150,' + (0.10 + rgl() * 0.12).toFixed(2) + ')';
            x.beginPath();
            x.ellipse(gx2, gy2, 30 + rgl() * 60, 6 + rgl() * 8, 0.05, 0, TAU);
            x.fill();
          }
          x.restore();

          /* --- levá stěna s branou (exit square) --- */
          x.fillStyle = lg(x, 0, 0, 340, 0, [[0, '#a08a64'], [1, '#c9b48c']]);
          x.fillRect(0, 210, 335, 640);
          sgrafito(x, 0, 220, 335, 200, 26, '#8a7454', 0.4);
          fillP(x, [[0, 210], [340, 210], [300, 130], [0, 130]], '#7c6852');
          snowBand(x, [[0, 206], [40, 140], [296, 136], [338, 206]], 15, 5111, '#f4f8fd', '#a9bedd');
          // gotický lomený průjezd brány
          x.fillStyle = '#241a10';
          x.beginPath();
          x.moveTo(40, 850); x.lineTo(40, 560);
          x.quadraticCurveTo(45, 430, 150, 410);
          x.quadraticCurveTo(255, 430, 260, 560);
          x.lineTo(260, 850);
          x.closePath(); x.fill();
          // prosvit zlatého odpoledne skrz bránu (cesta dolů do města)
          x.fillStyle = lg(x, 0, 500, 0, 850, [[0, '#f2c584'], [0.6, '#e0aa66'], [1, '#a97f4e']]);
          x.beginPath();
          x.moveTo(70, 850); x.lineTo(70, 570);
          x.quadraticCurveTo(76, 465, 150, 448);
          x.quadraticCurveTo(224, 465, 230, 570);
          x.lineTo(230, 850);
          x.closePath(); x.fill();
          // silueta města dole v průhledu
          x.fillStyle = 'rgba(122,84,54,0.85)';
          fillP(x, [[86, 850], [96, 780], [128, 780], [128, 812], [170, 812], [176, 764], [214, 764], [222, 850]], 'rgba(114,76,48,0.9)');
          x.fillStyle = 'rgba(244,220,170,0.9)';
          x.fillRect(104, 792, 8, 10); x.fillRect(186, 778, 8, 10);
          // pootevřené vrata
          x.fillStyle = '#4e3826';
          fillP(x, [[232, 850], [232, 470], [268, 500], [268, 850]], '#443019');
          x.strokeStyle = 'rgba(24,14,6,0.7)'; x.lineWidth = 3;
          for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(238 + i * 8, 850); x.lineTo(238 + i * 8, 490 + i * 8); x.stroke(); }
          // bosáž okolo brány
          x.strokeStyle = '#8a7454'; x.lineWidth = 7;
          x.beginPath();
          x.moveTo(34, 850); x.lineTo(34, 560);
          x.quadraticCurveTo(40, 420, 150, 402);
          x.quadraticCurveTo(260, 420, 266, 560);
          x.lineTo(266, 850);
          x.stroke();
          x.fillStyle = '#bda57c';
          for (let i = 0; i < 7; i++) {
            const a = Math.PI + i / 6 * Math.PI;
            const kx = 150 + Math.cos(a) * 122, ky = 545 + Math.sin(a) * 128;
            x.save(); x.translate(kx, ky); x.rotate(a + Math.PI / 2);
            x.fillRect(-16, -13, 32, 26);
            x.strokeStyle = 'rgba(90,66,38,0.6)'; x.lineWidth = 2.5; x.strokeRect(-16, -13, 32, 26);
            x.restore();
          }
          // erb nad branou (lev)
          x.fillStyle = '#8a2c22';
          x.beginPath();
          x.moveTo(122, 330); x.lineTo(178, 330); x.lineTo(178, 372); x.quadraticCurveTo(150, 396, 122, 372);
          x.closePath(); x.fill();
          x.strokeStyle = '#c9a24a'; x.lineWidth = 3.5; x.stroke();
          x.strokeStyle = '#e8d2a0'; x.lineWidth = 2.5;
          x.beginPath();
          x.moveTo(138, 342); x.quadraticCurveTo(150, 336, 158, 346);
          x.quadraticCurveTo(166, 358, 154, 366); x.moveTo(142, 366); x.lineTo(138, 378);
          x.stroke();
          // lucerna u brány (plamen dynamicky)
          x.strokeStyle = '#2c2216'; x.lineWidth = 6;
          x.beginPath(); x.moveTo(300, 470); x.lineTo(350, 490); x.stroke();
          x.fillStyle = '#2c2216';
          x.fillRect(340, 490, 22, 34);
          x.fillStyle = 'rgba(255,220,150,0.25)';
          x.fillRect(344, 496, 14, 24);
          icicles(x, 0, 335, 218, 5112, 26);

          /* --- arkádová chodba se slunečními hodinami — teplá, o valér světlejší
                 než zadní křídlo (sedí blíž ke slunci), členěná špínou a soklem --- */
          x.fillStyle = lg(x, 0, 300, 0, 850, [[0, '#f4e4bc'], [0.45, '#d8c298'], [0.78, '#ae9670'], [1, '#8e7a5c']]);
          x.fillRect(430, 296, 850, 554);
          scumble(x, 430, 300, 850, 260, 5122, 320, ['#f8e8c0', '#dcc89e', '#b8a27a'], 3, 13, 0.30);
          scumble(x, 430, 560, 850, 290, 5123, 260, ['#c2ac82', '#a08a62', '#83704e'], 3, 12, 0.28);
          // studený odraz sněhu na patě zdi
          x.fillStyle = lg(x, 0, 790, 0, 852, [[0, 'rgba(150,170,210,0)'], [1, 'rgba(150,170,210,0.25)']]);
          x.fillRect(430, 790, 850, 62);
          // střecha arkád
          fillP(x, [[400, 300], [500, 216], [1230, 216], [1300, 300]], '#8a7460');
          scumble(x, 440, 220, 830, 76, 5124, 130, ['#9a8570', '#78624e'], 3, 10, 0.32);
          snowBand(x, [[420, 296], [505, 222], [1225, 222], [1296, 296]], 15, 5121, '#f4f8fd', '#a9bedd');
          // stín římsy pod střechou
          x.fillStyle = lg(x, 0, 298, 0, 320, [[0, 'rgba(66,48,30,0.36)'], [1, 'rgba(66,48,30,0)']]);
          x.fillRect(430, 298, 850, 22);
          sgrafito(x, 430, 306, 850, 150, 26, '#8a7454', 0.42);
          // opadaná omítka — velké záplaty s cihlami (ne drobné flíčky)
          const plaster2 = (px2, py2, sw2, sh2, seed2) => {
            const rp = mulberry(seed2);
            x.save();
            x.translate(px2, py2);
            x.rotate((rp() - 0.5) * 0.2);
            x.fillStyle = 'rgba(242,231,205,0.95)';
            x.beginPath();
            x.moveTo(-sw2 * 0.5, 0);
            x.quadraticCurveTo(-sw2 * 0.35, -sh2 * (0.45 + rp() * 0.15), 0, -sh2 * 0.5);
            x.quadraticCurveTo(sw2 * (0.3 + rp() * 0.2), -sh2 * 0.4, sw2 * 0.5, -sh2 * 0.05);
            x.quadraticCurveTo(sw2 * 0.42, sh2 * (0.35 + rp() * 0.15), sw2 * 0.05, sh2 * 0.5);
            x.quadraticCurveTo(-sw2 * 0.35, sh2 * 0.42, -sw2 * 0.5, 0);
            x.closePath(); x.fill();
            x.strokeStyle = 'rgba(88,62,38,0.45)'; x.lineWidth = 2.5;
            x.beginPath();
            x.moveTo(-sw2 * 0.5, 0);
            x.quadraticCurveTo(-sw2 * 0.35, -sh2 * 0.5, 0, -sh2 * 0.5);
            x.stroke();
            x.save();
            x.beginPath(); x.ellipse(0, 0, sw2 * 0.34, sh2 * 0.33, 0, 0, TAU); x.clip();
            for (let rr2 = 0; rr2 < 4; rr2++) {
              for (let cc = 0; cc < 4; cc++) {
                x.fillStyle = rp() > 0.5 ? 'rgba(164,98,58,0.78)' : 'rgba(140,82,50,0.78)';
                x.fillRect(-sw2 * 0.34 + cc * sw2 * 0.18 + (rr2 % 2) * sw2 * 0.09,
                  -sh2 * 0.3 + rr2 * sh2 * 0.19, sw2 * 0.155, sh2 * 0.15);
              }
            }
            x.restore();
            x.restore();
          };
          plaster2(560, 388, 120, 78, 5125);
          plaster2(1120, 360, 150, 70, 5126);
          plaster2(1210, 560, 96, 62, 5127);
          // zatékání z říms arkádové chodby
          const rz2 = mulberry(5128);
          for (let i = 0; i < 6; i++) {
            const dx2 = 460 + i * 138 + rz2() * 40;
            const wz = 6 + rz2() * 10, hz = 46 + rz2() * 90;
            x.fillStyle = lg(x, 0, 302, 0, 302 + hz,
              [[0, 'rgba(104,74,44,0.30)'], [1, 'rgba(104,74,44,0)']]);
            x.fillRect(dx2, 302, wz, hz);
          }
          // kamenný sokl arkádové stěny
          x.fillStyle = lg(x, 0, 786, 0, 850, [[0, '#93816a'], [1, '#726552']]);
          x.fillRect(430, 788, 850, 62);
          x.fillStyle = 'rgba(50,40,30,0.32)'; x.fillRect(430, 788, 850, 4);
          x.strokeStyle = 'rgba(58,48,38,0.38)'; x.lineWidth = 2.5;
          for (let i = 0; i < 9; i++) {
            const sx2 = 470 + i * 96 + (i % 2) * 26;
            x.beginPath(); x.moveTo(sx2, 792); x.lineTo(sx2 - 5, 850); x.stroke();
          }
          // sluneční hodiny (malované, zlacený gnómon) — v lednu k ničemu
          x.save();
          x.translate(800, 420);
          x.fillStyle = '#efe0ba';
          x.beginPath(); x.arc(0, 0, 66, 0, TAU); x.fill();
          x.strokeStyle = '#8a5f1e'; x.lineWidth = 4; x.stroke();
          x.strokeStyle = '#7a5c34'; x.lineWidth = 2.5;
          for (let i = -4; i <= 4; i++) {
            const a = Math.PI / 2 + i * 0.32;
            x.beginPath(); x.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
            x.lineTo(Math.cos(a) * 56, Math.sin(a) * 56); x.stroke();
          }
          x.fillStyle = '#3a2c1a';
          x.font = 'bold 15px Georgia, serif'; x.textAlign = 'center';
          x.fillText('VIII', -46, 30); x.fillText('XII', 0, 58); x.fillText('IV', 46, 30);
          // gnómon + jeho dlouhý stín
          x.fillStyle = 'rgba(60,40,90,0.35)';
          fillP(x, [[0, 0], [52, 30], [46, 40]], 'rgba(60,40,90,0.3)');
          x.fillStyle = '#c9932e';
          fillP(x, [[-3, 0], [3, 0], [0, -34]], '#c9932e');
          x.restore();
          // nápis pod hodinami
          x.fillStyle = 'rgba(90,64,32,0.75)';
          x.font = 'italic 17px Georgia, serif'; x.textAlign = 'center';
          x.fillText('HORAS NON NUMERO NISI SERENAS', 800, 516);
          x.textAlign = 'left';
          // oblouky arkád dole — SKUTEČNĚ různé: výšky náběhu i vrcholu se liší
          // o desítky px, jeden je zazděný, jeden snížený stlačený
          const arcY2 = [648, 604, 672, 640, 624];
          const arcR2 = [56, 68, 46, 60, 62];
          for (let i = 0; i < 5; i++) {
            const ax = 470 + i * 160;
            const ay2 = arcY2[i], ar2 = arcR2[i];
            if (i === 3) {
              // zazděný oblouk — cihlová záslepka s větracím okénkem
              x.fillStyle = '#ab8e62';
              x.beginPath();
              x.moveTo(ax, 850); x.lineTo(ax, ay2);
              x.arc(ax + 60, ay2, ar2, Math.PI, 0);
              x.lineTo(ax + 120, 850);
              x.closePath(); x.fill();
              x.save();
              x.beginPath();
              x.moveTo(ax, 850); x.lineTo(ax, ay2);
              x.arc(ax + 60, ay2, ar2, Math.PI, 0);
              x.lineTo(ax + 120, 850);
              x.closePath(); x.clip();
              x.strokeStyle = 'rgba(118,80,50,0.55)'; x.lineWidth = 2.5;
              for (let k = 0; k < 13; k++) {
                x.beginPath(); x.moveTo(ax, 596 + k * 20); x.lineTo(ax + 120, 596 + k * 20); x.stroke();
                // svislé spáry vazby
                for (let c = 0; c < 4; c++) {
                  const bx2 = ax + 14 + c * 30 + (k % 2) * 15;
                  x.beginPath(); x.moveTo(bx2, 596 + k * 20); x.lineTo(bx2, 616 + k * 20); x.stroke();
                }
              }
              // pár cihel jinak vypálených
              x.fillStyle = 'rgba(150,84,50,0.5)';
              x.fillRect(ax + 30, 656, 28, 18); x.fillRect(ax + 75, 736, 28, 18);
              x.fillRect(ax + 14, 776, 28, 18);
              x.restore();
              // větrací okénko
              x.fillStyle = '#241a10';
              x.fillRect(ax + 48, 690, 24, 34);
              x.strokeStyle = '#57575f'; x.lineWidth = 3;
              x.beginPath(); x.moveTo(ax + 48, 707); x.lineTo(ax + 72, 707); x.stroke();
            } else {
              // tmavá chodba za obloukem
              x.fillStyle = lg(x, 0, 560, 0, 850, [[0, '#312516'], [1, '#1c1208']]);
              x.beginPath();
              x.moveTo(ax, 850); x.lineTo(ax, ay2);
              x.arc(ax + 60, ay2, ar2, Math.PI, 0);
              x.lineTo(ax + 120, 850);
              x.closePath(); x.fill();
            }
            // i=0: zavřená dubová vrata v oblouku
            if (i === 0) {
              x.fillStyle = '#4e3826';
              x.beginPath();
              x.moveTo(ax + 8, 850); x.lineTo(ax + 8, ay2 + 4);
              x.arc(ax + 60, ay2 + 4, ar2 - 8, Math.PI, 0);
              x.lineTo(ax + 112, 850);
              x.closePath(); x.fill();
              x.strokeStyle = 'rgba(24,14,6,0.7)'; x.lineWidth = 3;
              for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(ax + 8 + k * 21, 850); x.lineTo(ax + 8 + k * 21, ay2 - 30); x.stroke(); }
              x.strokeStyle = '#57575f'; x.lineWidth = 4;
              x.beginPath(); x.moveTo(ax + 10, 760); x.lineTo(ax + 110, 760); x.stroke();
            }
            // i=2 (snížený stlačený oblouk): v chodbě opřené fošny
            if (i === 2) {
              x.strokeStyle = '#54401f'; x.lineWidth = 9;
              x.beginPath(); x.moveTo(ax + 24, 848); x.lineTo(ax + 52, 680); x.stroke();
              x.beginPath(); x.moveTo(ax + 44, 848); x.lineTo(ax + 64, 688); x.stroke();
            }
            // v chodbě: sud (i=1), dříví (i=4)
            if (i === 1) {
              x.fillStyle = '#4e3a22';
              x.beginPath(); x.ellipse(ax + 60, 812, 26, 34, 0, 0, TAU); x.fill();
              x.strokeStyle = 'rgba(20,12,6,0.8)'; x.lineWidth = 3;
              x.beginPath(); x.ellipse(ax + 60, 812, 26, 34, 0, 0, TAU); x.stroke();
              x.beginPath(); x.moveTo(ax + 34, 800); x.lineTo(ax + 86, 800); x.stroke();
            }
            if (i === 4) {
              x.fillStyle = '#54401f';
              for (let k = 0; k < 5; k++) {
                x.beginPath(); x.ellipse(ax + 30 + k * 14, 830 - (k % 2) * 12, 7, 7, 0, 0, TAU); x.fill();
                x.strokeStyle = '#2c1e0c'; x.lineWidth = 2; x.stroke();
              }
            }
            // teplý odraz slunce na ostění (u zazděného jen slabý na cihle)
            x.strokeStyle = i === 3 ? 'rgba(255,214,150,0.3)' : 'rgba(255,214,150,0.6)';
            x.lineWidth = 4;
            x.beginPath(); x.arc(ax + 60, ay2, ar2, Math.PI, Math.PI * 1.5); x.stroke();
            x.strokeStyle = 'rgba(70,50,26,0.6)'; x.lineWidth = 4;
            x.beginPath(); x.arc(ax + 60, ay2, ar2, Math.PI * 1.5, 0); x.stroke();
          }
          // pilíře mezi oblouky — variované šířky, patky i hlavice; jeden oprýskaný
          const pilW = [40, 34, 46, 38, 44, 36];
          const pilBase = [18, 26, 14, 22, 30, 18];
          for (let i = 0; i <= 5; i++) {
            const px = 430 + i * 160 + (20 - pilW[i] / 2);
            const pw = pilW[i];
            // dřík navazuje na náběh sousedních oblouků
            const topY = Math.min(i > 0 ? arcY2[i - 1] : 648, i < 5 ? arcY2[i] : 648) - 34;
            x.fillStyle = lg(x, px, 0, px + pw + 2, 0, [[0, '#ead9b6'], [0.5, '#cdb88e'], [1, '#a08a62']]);
            x.fillRect(px, topY, pw, 850 - topY);
            // hlavice (krycí deska pod náběhem)
            x.fillStyle = '#bda57c';
            x.fillRect(px - 5, topY - 14, pw + 10, 16);
            // patka — jednou nízká deska, jindy dvoustupňová
            x.fillStyle = '#b09a72';
            x.fillRect(px - 5, 850 - pilBase[i], pw + 10, pilBase[i]);
            if (pilBase[i] > 20) {
              x.fillStyle = '#9a8560';
              x.fillRect(px - 9, 850 - 10, pw + 18, 10);
            }
            // oprýskaný pilíř (i=2): odhalený kámen
            if (i === 2) {
              x.fillStyle = 'rgba(146,134,112,0.9)';
              x.beginPath();
              x.ellipse(px + pw / 2, 742, pw * 0.42, 34, 0.12, 0, TAU); x.fill();
              x.strokeStyle = 'rgba(88,74,54,0.6)'; x.lineWidth = 2;
              x.beginPath(); x.moveTo(px + 4, 734); x.lineTo(px + pw - 6, 726); x.stroke();
              x.beginPath(); x.moveTo(px + 6, 752); x.lineTo(px + pw - 4, 758); x.stroke();
            }
            snowBand(x, [[px - 5, topY - 16], [px + pw + 5, topY - 16]], 6, 5130 + i, '#f4f8fd', '#b9cbe4');
          }
          icicles(x, 430, 1290, 302, 5131, 34);

          /* --- studna (zamrzlá) --- */
          x.save();
          // kontaktní stín ukotví studnu do sněhu
          contactShadow(x, 1580, 880, 120, 24, 1.15);
          // kamenné roubení
          x.fillStyle = lg(x, 0, 790, 0, 880, [[0, '#b8a888'], [1, '#8a7a5c']]);
          x.beginPath(); x.ellipse(1560, 858, 92, 30, 0, 0, TAU); x.fill();
          x.fillRect(1468, 800, 184, 58);
          x.beginPath(); x.ellipse(1560, 800, 92, 30, 0, 0, TAU); x.fill();
          // kameny roubení
          x.strokeStyle = 'rgba(90,74,50,0.55)'; x.lineWidth = 3;
          for (let i = 0; i < 7; i++) {
            const a = 0.4 + i * 0.38;
            x.beginPath();
            x.moveTo(1560 + Math.cos(a) * 92, 800 + Math.sin(a) * 30);
            x.lineTo(1560 + Math.cos(a) * 92, 858 + Math.sin(a) * 30);
            x.stroke();
          }
          // led uvnitř
          x.fillStyle = '#bcd4e0';
          x.beginPath(); x.ellipse(1560, 800, 74, 22, 0, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 2;
          x.beginPath(); x.moveTo(1516, 796); x.lineTo(1556, 806); x.lineTo(1588, 794); x.stroke();
          // sloupky + stříška
          x.fillStyle = '#5c422a';
          x.fillRect(1486, 640, 14, 166);
          x.fillRect(1620, 640, 14, 166);
          fillP(x, [[1452, 656], [1560, 588], [1668, 656]], '#6e5138');
          snowBand(x, [[1462, 652], [1560, 594], [1658, 652]], 12, 5141, '#f4f8fd', '#a9bedd');
          icicles(x, 1470, 1655, 660, 5142, 22);
          // hřídel s klikou a okovem
          x.fillStyle = '#7a5c34';
          x.fillRect(1494, 700, 132, 16);
          x.strokeStyle = '#3a2c1a'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(1630, 708); x.lineTo(1652, 730); x.lineTo(1668, 722); x.stroke();
          x.strokeStyle = '#241a10'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(1560, 716); x.lineTo(1560, 768); x.stroke();
          x.fillStyle = '#4e3826';
          x.fillRect(1546, 768, 28, 22);
          x.restore();

          /* --- saně u arkád --- */
          contactShadow(x, 1330, 872, 115, 20, 1.1);
          x.save();
          x.translate(1330, 856);
          x.rotate(-0.08);
          x.fillStyle = '#6e4a28';
          fillP(x, [[-90, -60], [80, -76], [96, -6], [-96, 8]], '#6e4a28');
          x.strokeStyle = '#402a12'; x.lineWidth = 4;
          P(x, [[-90, -60], [80, -76], [96, -6], [-96, 8]]); x.stroke();
          x.strokeStyle = 'rgba(30,18,8,0.55)'; x.lineWidth = 2.5;
          x.beginPath(); x.moveTo(-80, -38); x.lineTo(84, -52); x.stroke();
          x.beginPath(); x.moveTo(-84, -16); x.lineTo(90, -30); x.stroke();
          // skluznice
          x.strokeStyle = '#2c2216'; x.lineWidth = 7; x.lineCap = 'round';
          x.beginPath(); x.moveTo(-98, 16); x.quadraticCurveTo(-116, 6, -110, -18); x.stroke();
          x.beginPath(); x.moveTo(-98, 16); x.lineTo(98, 2); x.stroke();
          snowBand(x, [[-88, -66], [78, -80]], 10, 5151, '#f4f8fd', '#b9cbe4');
          x.restore();

          /* --- psí bouda Ryšáka (pes sám je dynamický) --- */
          x.save();
          x.translate(1840, 842);
          contactShadow(x, 0, 46, 92, 17, 1.15);
          x.fillStyle = lg(x, -70, 0, 70, 0, [[0, '#7a5838'], [1, '#553c22']]);
          x.fillRect(-70, -46, 140, 90);
          fillP(x, [[-84, -46], [0, -104], [84, -46]], '#402c16');
          snowBand(x, [[-78, -50], [0, -100], [78, -50]], 13, 5161, '#f4f8fd', '#a9bedd');
          x.fillStyle = '#1c1208';
          x.beginPath();
          x.moveTo(-26, 44); x.lineTo(-26, -12);
          x.arc(0, -12, 26, Math.PI, 0);
          x.lineTo(26, 44);
          x.closePath(); x.fill();
          x.strokeStyle = 'rgba(30,18,8,0.6)'; x.lineWidth = 2.5;
          for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(-70, -46 + i * 18); x.lineTo(70, -46 + i * 18); x.stroke(); }
          // miska a kost
          x.fillStyle = '#8a7a5c';
          x.beginPath(); x.ellipse(-100, 36, 20, 8, 0, 0, TAU); x.fill();
          x.fillStyle = '#efe6d0';
          x.fillRect(96, 34, 26, 5);
          x.beginPath(); x.arc(96, 34, 4, 0, TAU); x.arc(96, 39, 4, 0, TAU); x.arc(122, 34, 4, 0, TAU); x.arc(122, 39, 4, 0, TAU); x.fill();
          // řetěz
          x.strokeStyle = '#57575f'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(-60, -6); x.quadraticCurveTo(-90, 26, -52, 40); x.stroke();
          x.restore();

          /* --- hromada sněhu (easter egg sněhulák) --- */
          contactShadow(x, 305, 988, 115, 15, 0.8);
          x.fillStyle = lg(x, 0, 880, 0, 1000, [[0, '#f6f9fd'], [1, '#bccbe6']]);
          x.beginPath();
          x.moveTo(190, 990);
          x.quadraticCurveTo(240, 892, 310, 902);
          x.quadraticCurveTo(390, 908, 420, 990);
          x.closePath(); x.fill();
          scumble(x, 200, 900, 210, 90, 5171, 40, ['#ffffff', '#dce6f5'], 4, 12, 0.5);
          // zapíchnutá dřevěná lopata
          x.strokeStyle = '#6e5138'; x.lineWidth = 8;
          x.beginPath(); x.moveTo(392, 918); x.lineTo(428, 812); x.stroke();
          x.fillStyle = '#8a6a42';
          fillP(x, [[376, 940], [404, 912], [418, 926], [392, 956]], '#8a6a42');

          /* --- schodišťová věžice s dveřmi do observatoře (exit) --- */
          x.save();
          // válcové těleso
          x.fillStyle = lg(x, 2290, 0, 2560, 0, [[0, '#d5c29c'], [0.45, '#c4ae84'], [1, '#96805c']]);
          x.beginPath();
          x.moveTo(2290, 910);
          x.lineTo(2290, 260);
          x.quadraticCurveTo(2425, 218, 2560, 260);
          x.lineTo(2560, 910);
          x.closePath(); x.fill();
          scumble(x, 2290, 270, 270, 630, 5183, 240, ['#e0cda6', '#b8a27c', '#8c7856'], 3, 12, 0.28);
          sgrafito(x, 2290, 280, 270, 600, 24, '#8a7454', 0.35);
          // kuželová střecha
          fillP(x, [[2266, 268], [2425, 96], [2584, 268]], '#5c422a');
          snowBand(x, [[2278, 262], [2425, 104], [2572, 262]], 15, 5181, '#f4f8fd', '#a9bedd');
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(2425, 90, 8, 0, TAU); x.fill();
          // spirála okének schodiště
          for (let i = 0; i < 4; i++) {
            const wy = 330 + i * 128;
            const wx = 2350 + Math.sin(i * 1.8) * 60;
            x.fillStyle = '#241c30';
            x.fillRect(wx, wy, 22, 44);
            x.strokeStyle = '#a98f62'; x.lineWidth = 4;
            x.strokeRect(wx - 4, wy - 4, 30, 52);
          }
          // portál dveří
          x.fillStyle = '#8a7454';
          x.beginPath();
          x.moveTo(2340, 900); x.lineTo(2340, 730);
          x.arc(2410, 730, 70, Math.PI, 0);
          x.lineTo(2480, 900);
          x.closePath(); x.fill();
          x.fillStyle = '#3c2a16';
          x.beginPath();
          x.moveTo(2352, 894); x.lineTo(2352, 736);
          x.arc(2410, 736, 58, Math.PI, 0);
          x.lineTo(2468, 894);
          x.closePath(); x.fill();
          // fošny + kování
          x.strokeStyle = 'rgba(20,12,6,0.7)'; x.lineWidth = 3;
          for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(2352 + i * 23, 894); x.lineTo(2352 + i * 23, 700); x.stroke(); }
          x.strokeStyle = '#57575f'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(2354, 780); x.lineTo(2466, 780); x.stroke();
          x.beginPath(); x.moveTo(2354, 840); x.lineTo(2466, 840); x.stroke();
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(2444, 812, 7, 0, TAU); x.fill();
          // schůdky
          x.fillStyle = '#b8a888';
          x.fillRect(2330, 900, 160, 12);
          x.fillStyle = '#96805c';
          x.fillRect(2318, 912, 184, 12);
          snowBand(x, [[2318, 910], [2502, 910]], 6, 5182, '#f4f8fd', '#b9cbe4');
          // lucerna nad dveřmi (plamen dynamicky)
          x.strokeStyle = '#2c2216'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(2410, 652); x.lineTo(2410, 636); x.stroke();
          x.fillStyle = '#2c2216';
          x.fillRect(2396, 636, 28, 38);
          x.fillStyle = 'rgba(255,220,150,0.25)';
          x.fillRect(2401, 642, 18, 27);
          // cedulka "AD ASTRA" nade dveřmi
          x.fillStyle = '#efe0ba';
          x.fillRect(2372, 668, 76, 22);
          x.strokeStyle = '#7a5c34'; x.lineWidth = 2; x.strokeRect(2372, 668, 76, 22);
          x.fillStyle = '#3a2c1a'; x.font = 'bold 13px Georgia, serif'; x.textAlign = 'center';
          x.fillText('AD ASTRA', 2410, 684);
          x.textAlign = 'left';
          x.restore();

          /* --- závěje v popředí (walkBehind) --- */
          x.fillStyle = lg(x, 0, 990, 0, H, [[0, '#f7fafd'], [1, '#b6c8e4']]);
          x.beginPath();
          x.moveTo(0, 1012);
          x.quadraticCurveTo(160, 992, 330, 1030);
          x.quadraticCurveTo(400, 1052, 420, 1080);
          x.lineTo(0, 1080); x.closePath(); x.fill();
          x.beginPath();
          x.moveTo(2280, 1052);
          x.quadraticCurveTo(2420, 1008, 2600, 1026);
          x.lineTo(2600, 1080); x.lineTo(2280, 1080);
          x.closePath(); x.fill();
          scumble(x, 0, 1000, 430, 80, 5191, 50, ['#ffffff', '#dfe9f7'], 5, 16, 0.5);
          scumble(x, 2280, 1010, 320, 70, 5192, 40, ['#ffffff', '#dfe9f7'], 5, 16, 0.5);
          // zmrzlý keřík v závěji
          bareTree(x, 120, 1046, 130, 5193, '#4e3a26', 0.2);
          snowBand(x, [[70, 1006], [180, 1000]], 8, 5194, '#ffffff', '#c3d2ea');
          // globální malířské zrno přes celou vrstvu
          grain(x, SW, H, 0.05);
        }
      },
      { // POPŘEDÍ (parallax > 1) — zasněžený vozík s košem dole, větev přes levý horní roh
        parallax: 1.16,
        walkBehind: [
          // vozík + koš (kreslí se před postavou)
          [[600, 1080], [620, 942], [1070, 930], [1090, 1080]]
        ],
        paint(x) {
          /* --- odstavený žebřiňák, zapadaný sněhem, ořízlý spodním okrajem --- */
          x.save();
          x.translate(850, 1074);
          x.rotate(-0.025);
          contactShadow(x, 0, 26, 230, 26, 1.2);
          // kola (zadní velké, viditelná horní půlka)
          const wheel = (wx, wy, wr) => {
            x.strokeStyle = '#2e2114'; x.lineWidth = 13;
            x.beginPath(); x.arc(wx, wy, wr, 0, TAU); x.stroke();
            x.strokeStyle = '#4a3520'; x.lineWidth = 6;
            for (let i = 0; i < 8; i++) {
              const a = i / 8 * TAU + 0.3;
              x.beginPath(); x.moveTo(wx, wy);
              x.lineTo(wx + Math.cos(a) * (wr - 7), wy + Math.sin(a) * (wr - 7));
              x.stroke();
            }
            x.fillStyle = '#241a10';
            x.beginPath(); x.arc(wx, wy, 12, 0, TAU); x.fill();
            // sněhový srpek na obruči
            snowBand(x, [[wx - wr * 0.72, wy - wr * 0.72], [wx, wy - wr - 4], [wx + wr * 0.72, wy - wr * 0.72]], 10, 5501, '#f6f9fd', '#b9cbe4');
          };
          wheel(-138, 4, 88);
          wheel(150, -2, 96);
          // korba — tmavé fošny, mírně z profilu
          x.fillStyle = lg(x, 0, -150, 0, -30, [[0, '#6b4d2c'], [0.5, '#523a1e'], [1, '#3c2a14']]);
          fillP(x, [[-232, -44], [236, -56], [226, -140], [-222, -124]], x.fillStyle);
          x.strokeStyle = '#2a1c0e'; x.lineWidth = 4;
          P(x, [[-232, -44], [236, -56], [226, -140], [-222, -124]]); x.stroke();
          // spáry fošen korby
          x.strokeStyle = 'rgba(24,14,6,0.6)'; x.lineWidth = 2.6;
          x.beginPath(); x.moveTo(-226, -96); x.lineTo(230, -108); x.stroke();
          x.beginPath(); x.moveTo(-224, -70); x.lineTo(232, -82); x.stroke();
          // svislé klanice
          x.strokeStyle = '#3c2a14'; x.lineWidth = 7;
          for (const kx of [-170, -60, 60, 170]) {
            x.beginPath(); x.moveTo(kx, -44 - (kx > 0 ? 8 : 0)); x.lineTo(kx - 4, -148 + (kx < 0 ? 16 : 0)); x.stroke();
          }
          // oj opřená do sněhu vlevo
          x.strokeStyle = '#4a3520'; x.lineWidth = 9; x.lineCap = 'round';
          x.beginPath(); x.moveTo(-226, -60); x.quadraticCurveTo(-330, -30, -392, 26); x.stroke();
          // sníh navátý na korbě — silná čepice s převisem
          snowBand(x, [[-228, -126], [-60, -140], [120, -146], [228, -142]], 24, 5502, '#f7fafd', '#aabedd');
          x.fillStyle = '#eef3fa';
          x.beginPath(); x.ellipse(-40, -132, 120, 16, -0.02, 0, TAU); x.fill();
          // rampouchy pod korbou
          icicles(x, -210, 210, -48, 5503, 22);
          // proutěný koš překocený vedle vozu (vpravo) — ústí k divákovi
          x.save();
          x.translate(334, -10);
          x.rotate(0.22);
          contactShadow(x, 0, 26, 58, 12, 0.9);
          // tělo koše (ležící soudek)
          x.fillStyle = lg(x, -50, 0, 54, 0, [[0, '#96744a'], [1, '#6e5230']]);
          x.beginPath();
          x.moveTo(-48, -22);
          x.quadraticCurveTo(0, -34, 40, -26);
          x.lineTo(44, 18);
          x.quadraticCurveTo(0, 28, -46, 20);
          x.closePath(); x.fill();
          // vodorovný výplet — oblé pruhy
          x.strokeStyle = 'rgba(52,36,18,0.65)'; x.lineWidth = 3;
          for (let i = 0; i < 4; i++) {
            const yy2 = -18 + i * 12;
            x.beginPath();
            x.moveTo(-47, yy2 + 2);
            x.quadraticCurveTo(0, yy2 - 6, 42, yy2);
            x.stroke();
          }
          // ústí — tmavý ovál s obrubou
          x.fillStyle = '#241a10';
          x.beginPath(); x.ellipse(-46, -1, 11, 22, 0.06, 0, TAU); x.fill();
          x.strokeStyle = '#a5804e'; x.lineWidth = 4;
          x.beginPath(); x.ellipse(-46, -1, 11, 22, 0.06, 0, TAU); x.stroke();
          // sníh na boku koše
          snowBand(x, [[-40, -28], [38, -29]], 10, 5504, '#f6f9fd', '#b9cbe4');
          x.restore();
          x.restore();

          /* --- holá větev přesahující přes levý horní roh (strom stojí mimo záběr) --- */
          x.save();
          x.strokeStyle = '#241a10'; x.lineCap = 'round';
          const branch = (pts, w0, w1) => {
            for (let i = 0; i < pts.length - 1; i++) {
              x.lineWidth = lerp(w0, w1, i / (pts.length - 1));
              x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]); x.stroke();
            }
          };
          branch([[-20, 30], [120, 58], [260, 96], [390, 118], [500, 126]], 26, 9);
          branch([[240, 92], [320, 56], [406, 34]], 10, 4);
          branch([[120, 58], [180, 108], [242, 160], [290, 186]], 12, 4);
          branch([[390, 118], [460, 160], [512, 196]], 8, 3);
          branch([[406, 34], [462, 16], [510, 8]], 4, 2);
          // tenké koncové větvičky
          x.lineWidth = 2.2;
          const rbr = mulberry(5511);
          for (const [bx2, by2] of [[500, 126], [290, 186], [512, 196], [510, 8], [406, 34]]) {
            for (let i = 0; i < 3; i++) {
              x.beginPath(); x.moveTo(bx2, by2);
              x.quadraticCurveTo(bx2 + 26 + rbr() * 20, by2 + (rbr() - 0.4) * 30,
                bx2 + 52 + rbr() * 40, by2 + (rbr() - 0.4) * 56);
              x.stroke();
            }
          }
          // sníh na hřbetě větve
          snowBand(x, [[-20, 22], [120, 50], [260, 88], [390, 110], [498, 119]], 12, 5512, '#f6f9fd', '#aabedd');
          snowBand(x, [[240, 86], [320, 50], [402, 29]], 7, 5513, '#f4f8fd', '#b9cbe4');
          x.restore();
        }
      }
    ],
    dynamic(ctx, t, camX) {
      /* korouhev na věži (vrstva 0.45) */
      ctx.save();
      ctx.translate(camX * (1 - 0.45), 0);
      ctx.fillStyle = '#a63a2e';
      ctx.beginPath();
      const fx = 2096, fy = -14;
      ctx.moveTo(fx, fy);
      const wv = (o) => Math.sin(t * 3.1 + o) * 6 + Math.sin(t * 1.7 + o * 2) * 4;
      ctx.lineTo(fx + 30, fy + 4 + wv(1) * 0.4);
      ctx.lineTo(fx + 62, fy + 2 + wv(2));
      ctx.lineTo(fx + 46, fy + 12 + wv(2.5) * 0.8);
      ctx.lineTo(fx + 62, fy + 22 + wv(3));
      ctx.lineTo(fx + 30, fy + 20 + wv(1.6) * 0.4);
      ctx.lineTo(fx, fy + 16);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,214,150,0.35)';
      ctx.fillRect(fx, fy, 4, 16);
      // kouř z komínů zadního křídla
      smokeDyn(ctx, t, 640, 318, 3, 1.1, '210,214,228', 0.20, 34);
      smokeDyn(ctx, t, 1560, 312, 7, 1.0, '210,214,228', 0.18, 30);
      ctx.restore();

      /* třpyt rampouchů arkád a studny */
      sparkleDyn(ctx, t, 5301, 14, 440, 300, 850, 40, '255,244,214');
      sparkleDyn(ctx, t, 5302, 6, 1470, 655, 190, 24, '235,246,255');

      /* vrabci u studny — hopsají, občas přeletí */
      {
        const cyc = t % 26;
        const rj = mulberry(((t / 26) | 0) + 5);
        if (cyc < 15) {
          for (let i = 0; i < 3; i++) {
            const hop = (Math.sin(t * (5 + i) + i * 2.7) > 0.86) ? 6 : 0;
            const bx = 1665 + i * 34 + Math.floor(Math.sin(t * 0.4 + i * 3) * 3) * 8;
            perchBird(ctx, bx, 986 + (i % 2) * 8, 0.72, i % 2 ? -1 : 1, hop, '#57493a');
          }
        } else if (cyc < 18.5) {
          const p = (cyc - 15) / 3.5;
          for (let i = 0; i < 3; i++) {
            const bx = lerp(1680 + i * 30, 2000 + i * 90 + rj() * 100, p);
            const by = lerp(990, 340 - i * 40, p * p);
            flyBird(ctx, bx, by, 0.6, t * 14 + i, 'rgba(87,73,58,0.9)');
          }
        }
      }

      /* pes Ryšák — zvedá hlavu, vrtí ocasem, dýchá páru */
      {
        const dx = 1812, dy = 892;
        const awake = (t % 13) < 5.2;
        const wag = awake ? Math.sin(t * 9) * 0.55 : Math.sin(t * 1.2) * 0.08;
        const headUp = awake ? 1 : 0.15 + 0.05 * Math.sin(t * 1.1);
        ctx.save();
        ctx.translate(dx, dy);
        // tělo stočené
        ctx.fillStyle = '#a8642e';
        ctx.beginPath(); ctx.ellipse(0, 0, 44, 22, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a4e20';
        ctx.beginPath(); ctx.ellipse(-8, 6, 30, 14, 0, 0, TAU); ctx.fill();
        // ocas
        ctx.strokeStyle = '#a8642e'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-40, -2);
        ctx.quadraticCurveTo(-58, -10 - wag * 18, -66, 2 - wag * 26);
        ctx.stroke();
        // hlava
        const hy2 = -16 - headUp * 20;
        ctx.fillStyle = '#a8642e';
        ctx.beginPath(); ctx.ellipse(30, hy2, 16, 13, -0.2 - headUp * 0.2, 0, TAU); ctx.fill();
        // čenich + ucho
        ctx.beginPath(); ctx.ellipse(43, hy2 + 4, 9, 6, -0.1, 0, TAU); ctx.fill();
        ctx.fillStyle = '#7a3f18';
        ctx.beginPath(); ctx.ellipse(24, hy2 - 10, 6, 9, 0.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#241812';
        ctx.beginPath(); ctx.arc(50, hy2 + 3, 2.8, 0, TAU); ctx.fill();
        if (awake) { ctx.beginPath(); ctx.arc(33, hy2 - 3, 2.2, 0, TAU); ctx.fill(); }
        ctx.restore();
        // pára od čenichu
        if (awake) {
          const bl = (t * 0.55) % 1;
          mistPuff(ctx, dx + 56 + bl * 26, dy + hy2 + 2 - bl * 12, 14 + bl * 18, 8 + bl * 10, '235,242,252', 0.22 * (1 - bl));
        }
      }

      /* plameny luceren (brána + dveře věže) */
      flameDyn(ctx, t, 351, 512, 0.62, 3.1);
      flameDyn(ctx, t, 2410, 664, 0.66, 7.7);

      /* sníh */
      snowDyn(ctx, t, SW, 5401, 120, 12, '#eef3fa');
    },
    overlayDynamic(ctx, t, camX) {
      // šikmé zlaté paprsky nízkého slunce zleva — jemně dýchají (scéna)
      const a = 0.05 + 0.02 * Math.sin(t * 0.7);
      ctx.fillStyle = 'rgba(255,214,150,' + a + ')';
      fillP(ctx, [[-100, 260], [180, 200], [1500, 1080], [700, 1080]], ctx.fillStyle);
      ctx.fillStyle = 'rgba(255,214,150,' + a * 0.6 + ')';
      fillP(ctx, [[260, 160], [420, 130], [1900, 1080], [1560, 1080]], ctx.fillStyle);
      // pár velkých vloček úplně vpředu
      snowDyn(ctx, t * 1.25, SW, 5402, 26, 18, '#f8fbff');
      // teplá vinětace (screen-space)
      ctx.save();
      ctx.translate(camX || 0, 0);
      const vg = ctx.createRadialGradient(W * 0.45, H * 0.45, 400, W * 0.5, H * 0.5, 1300);
      vg.addColorStop(0, 'rgba(30,20,10,0)');
      vg.addColorStop(1, 'rgba(40,24,30,0.30)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
    walkArea: [[170, 828], [2480, 828], [2520, 900], [2520, 1032], [430, 1032], [180, 1005], [120, 920]],
    scaleAt(y) { return clamp(0.5 + 0.58 * (y - 800) / 240, 0.42, 1.1); },
    exits: [
      { to: 'square', at: [120, 890], spawn: [300, 900], label: { cz: 'Brána — dolů do města', en: 'Gate — down to town' } },
      { to: 'observatory', at: [2415, 880], spawn: [330, 930], label: { cz: 'Dveře věže — observatoř', en: 'Tower door — observatory' } }
    ]
  });
})();

/* =========================================================================
   SCÉNA: observatory — Brahova observatoř a laboratoř, noc (2200)
   ========================================================================= */
(function () {
  const SW = 2200;
  // svíce: [x, y, velikost, seed]
  const CANDLES = [
    [1908, 792, 0.8, 1.2],   // svíčka na pultu
    [1752, 858, 0.9, 2.4],   // svícen — hlavní (pečetění)
    [1729, 878, 0.7, 3.1],
    [1775, 878, 0.7, 4.6],
    [2020, 596, 0.6, 5.9],   // krbová římsa
    [2148, 596, 0.6, 6.3],
    [352, 700, 0.7, 7.8]     // u hmoždíře
  ];

  BNJ.registerScene({
    id: 'observatory',
    width: SW,
    name: { cz: 'Observatoř', en: 'The Observatory' },
    lightTint: 'rgba(120,90,160,0.18)',
    spawn: [330, 930],
    layers: [
      { // noční nebe za oknem (parallax posouvá hvězdy za ostěním)
        parallax: 0.3,
        paint(x) {
          x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#0a1024'], [0.5, '#101a36'], [1, '#1a2648']]);
          x.fillRect(0, 0, SW, H);
          const r = mulberry(6001);
          x.fillStyle = '#f5f0dc';
          for (let i = 0; i < 240; i++) {
            x.globalAlpha = 0.08 + r() * 0.3;
            x.beginPath(); x.arc(r() * SW, r() * 800, 0.4 + r() * 1.1, 0, TAU); x.fill();
          }
          x.globalAlpha = 1;
          // měsíc nízko — zdroj paprsku
          glow(x, 700, 330, 200, '190,207,232', 0.3);
          x.fillStyle = '#e8e2cc';
          x.beginPath(); x.arc(700, 330, 42, 0, TAU); x.fill();
          x.fillStyle = 'rgba(190,182,150,0.5)';
          x.beginPath(); x.arc(686, 318, 8, 0, TAU); x.fill();
          x.beginPath(); x.arc(712, 342, 9, 0, TAU); x.fill();
        }
      },
      { // střechy města hluboko pod oknem
        parallax: 0.55,
        paint(x) {
          const r = mulberry(6002);
          x.fillStyle = '#0b1226';
          x.beginPath();
          x.moveTo(0, 700);
          for (let px = 0; px <= SW; px += 90) {
            x.lineTo(px, 640 + (r() - 0.5) * 40);
            x.lineTo(px + 45, 606 + (r() - 0.5) * 30);
          }
          x.lineTo(SW, H); x.lineTo(0, H);
          x.closePath(); x.fill();
          x.strokeStyle = 'rgba(184,207,232,0.22)'; x.lineWidth = 2.5;
          x.beginPath();
          const r2 = mulberry(6002);
          x.moveTo(0, 700);
          for (let px = 0; px <= SW; px += 90) {
            x.lineTo(px, 640 + (r2() - 0.5) * 40);
            x.lineTo(px + 45, 606 + (r2() - 0.5) * 30);
          }
          x.stroke();
          // teplá okénka spícího městečka
          x.fillStyle = '#ffc063';
          for (let i = 0; i < 7; i++) {
            if (r() > 0.4) x.fillRect(120 + i * 300 + r() * 120, 660 + r() * 60, 8, 12);
          }
        }
      },
      { // 1.0 — celý interiér
        parallax: 1,
        walkBehind: [
          // velký sextant (podstava + rameno v popředí)
          [[598, 1080], [614, 880], [700, 720], [760, 700], [790, 730], [724, 880], [716, 1080]],
          [[560, 1080], [900, 1080], [905, 1024], [556, 1024]],
          // psací pult (přední hrana)
          [[1836, 1080], [1846, 900], [2088, 900], [2098, 1080]]
        ],
        paint(x) {
          const r = mulberry(6100);
          /* --- stěny — 3 zóny (strop tmavý, střed teplejší od svící, dole odraz podlahy) --- */
          x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#241c2e'], [0.35, '#2e2438'], [0.8, '#4a3a56'], [1, '#3a2e44']]);
          x.fillRect(0, 0, SW, H);
          // teplý dech svíček ve střední zóně stěn (vpravo, kde hoří svíce a krb)
          x.fillStyle = lg(x, 1300, 0, 2200, 0, [[0, 'rgba(255,170,80,0)'], [1, 'rgba(255,170,80,0.07)']]);
          x.fillRect(1300, 200, 900, 700);
          // viditelný malířský scumble ve dvou tónech
          scumble(x, 0, 100, SW, 420, 6101, 520, ['#392c46', '#2a2036', '#514062', '#453552'], 4, 17, 0.4);
          scumble(x, 0, 520, SW, 380, 6103, 460, ['#564468', '#453552', '#5e4a70', '#39304a'], 4, 17, 0.36);
          // vinětace rohů místnosti — svíčky a paprsek vyniknou
          x.fillStyle = lg(x, 0, 0, 420, 0, [[0, 'rgba(10,6,18,0.34)'], [1, 'rgba(10,6,18,0)']]);
          x.fillRect(0, 0, 420, H);
          x.fillStyle = lg(x, SW - 380, 0, SW, 0, [[0, 'rgba(10,6,18,0)'], [1, 'rgba(10,6,18,0.28)']]);
          x.fillRect(SW - 380, 0, 380, H);
          /* --- trámový strop --- */
          x.fillStyle = '#241a10';
          x.fillRect(0, 0, SW, 120);
          x.fillStyle = '#33240f';
          for (let bx = 60; bx < SW; bx += 260) {
            x.fillRect(bx, 0, 54, 150);
            x.fillStyle = 'rgba(255,179,71,0.06)';
            x.fillRect(bx + 44, 0, 10, 150);
            x.fillStyle = '#33240f';
          }
          x.fillStyle = 'rgba(20,12,6,0.6)';
          x.fillRect(0, 146, SW, 10);
          // hvězdná mapa přibitá na trámu
          x.save();
          x.translate(1180, 96); x.rotate(0.04);
          x.fillStyle = '#d9c9a0';
          x.fillRect(-80, -40, 160, 110);
          x.strokeStyle = '#7a5c34'; x.lineWidth = 2; x.strokeRect(-80, -40, 160, 110);
          x.strokeStyle = 'rgba(90,64,32,0.7)'; x.lineWidth = 1.4;
          x.beginPath(); x.arc(0, 15, 52, 0, TAU); x.stroke();
          x.beginPath(); x.arc(0, 15, 30, 0, TAU); x.stroke();
          x.beginPath(); x.moveTo(-52, 15); x.lineTo(52, 15); x.moveTo(0, -37); x.lineTo(0, 67); x.stroke();
          for (let i = 0; i < 12; i++) {
            const a = i / 12 * TAU;
            x.fillStyle = '#3a2c1a';
            x.beginPath(); x.arc(Math.cos(a) * 41, 15 + Math.sin(a) * 41, 1.6, 0, TAU); x.fill();
          }
          x.restore();

          /* --- podlaha: široká prkna --- */
          x.fillStyle = lg(x, 0, 800, 0, H, [[0, '#4a3524'], [0.5, '#5a4030'], [1, '#33241a']]);
          x.fillRect(0, 800, SW, H - 800);
          x.strokeStyle = 'rgba(20,12,6,0.55)'; x.lineWidth = 3;
          for (let i = 0; i < 9; i++) {
            const yy = 812 + i * 34 + i * i * 1.1;
            x.beginPath(); x.moveTo(0, yy); x.lineTo(SW, yy); x.stroke();
          }
          for (let i = 0; i < 30; i++) {
            const yy = 812 + (r() * 9 | 0) * 36;
            const xx = r() * SW;
            x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 30); x.stroke();
          }
          scumble(x, 0, 800, SW, 280, 6102, 380, ['#6a4e36', '#3c2b1e', '#7a5a40', '#553c2a'], 3, 14, 0.4);
          // teplé kaluže světla svící na podlaze (svícen, pult, hmoždíř)
          x.fillStyle = 'rgba(255,180,90,0.12)';
          x.beginPath(); x.ellipse(1752, 1008, 150, 34, 0, 0, TAU); x.fill();
          x.fillStyle = 'rgba(255,180,90,0.08)';
          x.beginPath(); x.ellipse(1965, 1030, 190, 40, 0, 0, TAU); x.fill();
          x.beginPath(); x.ellipse(370, 920, 130, 28, 0, 0, TAU); x.fill();
          // teplý pruh světla svící na stole s křivulí
          x.fillStyle = 'rgba(255,190,110,0.10)';
          x.beginPath(); x.ellipse(1700, 838, 120, 14, 0, 0, TAU); x.fill();
          // měsíční kaluž světla pod oknem
          x.fillStyle = 'rgba(184,207,232,0.13)';
          x.beginPath(); x.ellipse(760, 920, 300, 70, -0.06, 0, TAU); x.fill();
          x.fillStyle = 'rgba(184,207,232,0.08)';
          x.beginPath(); x.ellipse(820, 960, 420, 100, -0.06, 0, TAU); x.fill();

          /* --- dveře na schodiště (exit, vlevo) --- */
          x.fillStyle = '#6a5a48';
          x.beginPath();
          x.moveTo(130, 890); x.lineTo(130, 660);
          x.arc(220, 660, 90, Math.PI, 0);
          x.lineTo(310, 890);
          x.closePath(); x.fill();
          x.fillStyle = '#3c2a16';
          x.beginPath();
          x.moveTo(146, 884); x.lineTo(146, 668);
          x.arc(220, 668, 74, Math.PI, 0);
          x.lineTo(294, 884);
          x.closePath(); x.fill();
          x.strokeStyle = 'rgba(16,10,4,0.7)'; x.lineWidth = 3;
          for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(146 + i * 30, 884); x.lineTo(146 + i * 30, 620); x.stroke(); }
          x.strokeStyle = '#57575f'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(148, 730); x.lineTo(292, 730); x.stroke();
          x.beginPath(); x.moveTo(148, 820); x.lineTo(292, 820); x.stroke();
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(272, 778, 7, 0, TAU); x.fill();
          // práh + schod dolů
          x.fillStyle = '#8a7a5c'; x.fillRect(120, 890, 200, 10);

          /* --- velké arkýřové okno s otevřenou okenicí --- */
          // ostění
          x.fillStyle = '#584668';
          x.beginPath();
          x.moveTo(470, 730); x.lineTo(470, 330);
          x.quadraticCurveTo(480, 210, 690, 196);
          x.quadraticCurveTo(900, 210, 910, 330);
          x.lineTo(910, 730);
          x.closePath(); x.fill();
          // otvor (prosvit vrstev za scénou)
          x.save();
          x.beginPath();
          x.moveTo(500, 706); x.lineTo(500, 340);
          x.quadraticCurveTo(508, 236, 690, 224);
          x.quadraticCurveTo(872, 236, 880, 340);
          x.lineTo(880, 706);
          x.closePath();
          // vyříznout — kreslíme průhled: nic nemalujeme, vrstvy 0.3/0.55 jsou pod námi
          x.clip();
          x.clearRect(460, 180, 460, 540);
          x.restore();
          // kamenný parapet
          x.fillStyle = '#6a5878';
          x.fillRect(470, 706, 440, 26);
          x.fillStyle = 'rgba(184,207,232,0.35)';
          x.fillRect(470, 706, 440, 6);
          snowBand(x, [[500, 704], [880, 704]], 8, 6111, '#dce8f5', '#8fa2c4');
          // příčle olověného zasklení (pravá půlka zavřená, levá otevřená ven)
          x.strokeStyle = 'rgba(30,26,40,0.9)'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(690, 224); x.lineTo(690, 706); x.stroke();
          x.strokeStyle = 'rgba(40,36,56,0.55)'; x.lineWidth = 2.5;
          for (let i = 1; i < 6; i++) {
            x.beginPath(); x.moveTo(694, 250 + i * 76); x.lineTo(880, 250 + i * 76); x.stroke();
          }
          for (let i = 1; i < 3; i++) {
            x.beginPath(); x.moveTo(694 + i * 62, 236); x.lineTo(694 + i * 62, 706); x.stroke();
          }
          // sklo pravé půlky — jemný odlesk
          x.fillStyle = 'rgba(160,190,230,0.09)';
          fillP(x, [[694, 240], [880, 262], [880, 706], [694, 706]], 'rgba(160,190,230,0.08)');
          x.fillStyle = 'rgba(220,235,255,0.10)';
          fillP(x, [[720, 240], [770, 238], [706, 706], [694, 706]], 'rgba(220,235,255,0.10)');
          // otevřená okenice (dřevěná, uvnitř)
          x.fillStyle = lg(x, 380, 0, 500, 0, [[0, '#2c2013'], [1, '#4e3826']]);
          fillP(x, [[500, 340], [500, 706], [396, 748], [396, 360]], '#3c2c1a');
          x.strokeStyle = 'rgba(16,10,4,0.6)'; x.lineWidth = 3;
          for (let i = 1; i < 4; i++) {
            x.beginPath(); x.moveTo(396 + i * 26, 360 + i * 4); x.lineTo(396 + i * 26, 742); x.stroke();
          }
          x.strokeStyle = '#57575f'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(400, 420); x.lineTo(496, 400); x.stroke();
          x.beginPath(); x.moveTo(400, 660); x.lineTo(496, 646); x.stroke();
          // truhla pod oknem + stoh knih
          contactShadow(x, 615, 842, 105, 16, 1, '10,6,20');
          contactShadow(x, 785, 822, 55, 10, 0.9, '10,6,20');
          x.fillStyle = '#4e3826';
          x.fillRect(520, 760, 190, 76);
          x.fillStyle = '#3a2a1c';
          x.fillRect(520, 748, 190, 18);
          x.strokeStyle = '#57575f'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(560, 748); x.lineTo(560, 836); x.stroke();
          x.beginPath(); x.moveTo(670, 748); x.lineTo(670, 836); x.stroke();
          const bookCols = ['#7a3a2e', '#3e5a6a', '#8a6a2a', '#4e3e6a', '#5a6a3e'];
          for (let i = 0; i < 5; i++) {
            x.fillStyle = bookCols[i % 5];
            x.fillRect(740 + (i % 2) * 6, 812 - i * 15, 84 - (i % 2) * 10, 15);
            x.fillStyle = 'rgba(240,230,200,0.5)';
            x.fillRect(742 + (i % 2) * 6, 816 - i * 15, 80 - (i % 2) * 10, 2);
          }

          /* --- zední kvadrant (velký malovaný s mosazným obloukem) --- */
          x.save();
          x.translate(1030, 700);
          // freska pozadí (à la Uraniborg — Brahe ukazující)
          x.fillStyle = 'rgba(220,205,170,0.14)';
          x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 330, -Math.PI / 2, 0); x.closePath(); x.fill();
          // rytecká freska: astronom v plášti ukazuje k hvězdě — šrafovaná mědirytina
          x.save();
          x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 328, -Math.PI / 2, 0); x.closePath(); x.clip();
          // jemná šrafura pozadí rytiny (diagonální linky)
          x.strokeStyle = 'rgba(214,196,150,0.10)'; x.lineWidth = 1.3;
          for (let i = 0; i < 30; i++) {
            x.beginPath();
            x.moveTo(-10 + i * 12, -330);
            x.lineTo(150 + i * 12, -20);
            x.stroke();
          }
          // silueta figury: dlouhý plášť, fazetované záhyby
          const frescoInk = 'rgba(214,196,150,';
          x.fillStyle = frescoInk + '0.22)';
          x.beginPath();
          x.moveTo(128, -30);           // lem pláště vlevo dole
          x.lineTo(122, -96);
          x.lineTo(132, -150);          // pas
          x.lineTo(122, -168);          // rameno vzadu
          x.lineTo(136, -180);          // krk
          x.lineTo(134, -196);          // brada
          x.quadraticCurveTo(138, -218, 158, -218);  // týl s baretem
          x.quadraticCurveTo(176, -216, 176, -198);  // čelo
          x.lineTo(168, -184);          // nos k rameni
          x.lineTo(186, -172);          // přední rameno zvednuté
          x.lineTo(232, -204);          // paže ukazuje vzhůru k oblouku
          x.lineTo(238, -194);          // spodek předloktí
          x.lineTo(196, -158);          // podpaží
          x.lineTo(200, -96);           // bok pláště
          x.lineTo(210, -30);           // lem vpravo dole
          x.closePath(); x.fill();
          // obrys rytiny
          x.strokeStyle = frescoInk + '0.55)'; x.lineWidth = 2.6; x.lineJoin = 'round';
          x.stroke();
          // vnitřní šrafura figury — záhyby pláště
          x.save();
          x.clip(); // clip na siluetu (path je pořád aktivní)
          x.strokeStyle = frescoInk + '0.4)'; x.lineWidth = 1.5;
          for (let i = 0; i < 9; i++) {
            x.beginPath();
            x.moveTo(126 + i * 10, -24);
            x.quadraticCurveTo(132 + i * 10, -100, 128 + i * 9, -170);
            x.stroke();
          }
          // stín na zadní straně pláště hustší šrafou
          x.strokeStyle = frescoInk + '0.5)'; x.lineWidth = 1.3;
          for (let i = 0; i < 6; i++) {
            x.beginPath();
            x.moveTo(122 + i * 4, -30);
            x.lineTo(120 + i * 4, -168);
            x.stroke();
          }
          x.restore();
          // ruka a manžeta
          x.strokeStyle = frescoInk + '0.55)'; x.lineWidth = 2.2;
          x.beginPath(); x.moveTo(232, -204); x.lineTo(244, -212); x.stroke();
          // vous a profil
          x.beginPath();
          x.moveTo(168, -184); x.quadraticCurveTo(160, -172, 148, -176);
          x.stroke();
          // baret s okrajem
          x.beginPath();
          x.moveTo(136, -212); x.quadraticCurveTo(158, -230, 180, -210);
          x.stroke();
          // hvězda, k níž ukazuje — paprsčitá ryteckými čárkami (uvnitř výseče)
          const stx = 248, sty = -198;
          x.strokeStyle = frescoInk + '0.6)'; x.lineWidth = 1.8;
          for (let i = 0; i < 8; i++) {
            const sa = i / 8 * TAU;
            x.beginPath();
            x.moveTo(stx + Math.cos(sa) * 5, sty + Math.sin(sa) * 5);
            x.lineTo(stx + Math.cos(sa) * (12 + (i % 2) * 4), sty + Math.sin(sa) * (12 + (i % 2) * 4));
            x.stroke();
          }
          x.restore();
          // mosazný oblouk se stupnicí
          x.strokeStyle = '#c9932e'; x.lineWidth = 12;
          x.beginPath(); x.arc(0, 0, 300, -Math.PI / 2, 0); x.stroke();
          x.strokeStyle = '#8a5f1e'; x.lineWidth = 3;
          x.beginPath(); x.arc(0, 0, 306, -Math.PI / 2, 0); x.stroke();
          x.strokeStyle = '#f0d9a0'; x.lineWidth = 2;
          for (let i = 0; i <= 45; i++) {
            const a = -Math.PI / 2 + (i / 45) * (Math.PI / 2);
            const len = i % 5 === 0 ? 20 : 10;
            x.beginPath();
            x.moveTo(Math.cos(a) * (294 - len), Math.sin(a) * (294 - len));
            x.lineTo(Math.cos(a) * 294, Math.sin(a) * 294);
            x.stroke();
          }
          // ramena
          x.strokeStyle = '#a5772a'; x.lineWidth = 8;
          x.beginPath(); x.moveTo(0, 0); x.lineTo(300, 0); x.stroke();
          x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -300); x.stroke();
          // záměrné pravítko (alhidáda) šikmo
          x.strokeStyle = '#e0b45e'; x.lineWidth = 6;
          x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(-0.62) * 296, Math.sin(-0.62) * 296); x.stroke();
          // olovnice
          x.strokeStyle = 'rgba(230,230,240,0.65)'; x.lineWidth = 1.6;
          x.beginPath(); x.moveTo(0, 0); x.lineTo(6, 250); x.stroke();
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(6, 254, 7, 0, TAU); x.fill();
          x.beginPath(); x.arc(0, 0, 12, 0, TAU); x.fill();
          x.restore();

          /* --- police s alchymií (skalice) --- */
          x.fillStyle = '#33241a';
          x.fillRect(1494, 400, 300, 14);
          x.fillRect(1494, 520, 300, 14);
          x.fillRect(1494, 640, 300, 14);
          x.fillStyle = '#241a10';
          x.fillRect(1490, 390, 12, 270);
          x.fillRect(1786, 390, 12, 270);
          // horní police: knihy + lebka
          for (let i = 0; i < 6; i++) {
            x.fillStyle = bookCols[(i * 2 + 1) % 5];
            x.fillRect(1508 + i * 26, 348 + (i % 3) * 4, 22, 52 - (i % 3) * 4);
          }
          // memento mori — poctivá lebka ze 3/4: protáhlé kranium, lícní kost,
          // stínované očnice, nosní dutina, řada zubů
          x.save();
          x.translate(1718, 376);
          // vržený stín na polici
          x.fillStyle = 'rgba(14,10,22,0.5)';
          x.beginPath(); x.ellipse(3, 26, 26, 5.5, 0, 0, TAU); x.fill();
          // kranium
          x.fillStyle = '#cfc1a2';
          x.beginPath();
          x.moveTo(-26, 8);                       // spánek vlevo
          x.bezierCurveTo(-30, -16, -16, -28, 2, -28);   // klenba
          x.bezierCurveTo(20, -28, 30, -16, 29, -2);     // týl/čelo vpravo
          x.bezierCurveTo(28.5, 6, 24, 9, 21, 11);       // skráň
          x.lineTo(23, 15);                       // lícní kost vystupuje
          x.lineTo(15, 16);
          x.lineTo(14, 24);                       // horní čelist
          x.quadraticCurveTo(2, 27, -9, 24);
          x.quadraticCurveTo(-20, 20, -26, 8);
          x.closePath(); x.fill();
          // tvarový stín (svíce svítí zleva zdola — pravá strana v šeru)
          x.fillStyle = 'rgba(94,78,96,0.4)';
          x.beginPath();
          x.moveTo(12, -27);
          x.bezierCurveTo(24, -24, 30, -14, 29, -2);
          x.bezierCurveTo(28.5, 6, 24, 9, 21, 11);
          x.lineTo(23, 15); x.lineTo(15, 16); x.lineTo(14, 24);
          x.quadraticCurveTo(9, 25.5, 4, 26);
          x.quadraticCurveTo(14, 6, 12, -27);
          x.closePath(); x.fill();
          // světlý odlesk klenby vlevo nahoře
          x.fillStyle = 'rgba(240,232,208,0.75)';
          x.beginPath(); x.ellipse(-9, -16, 12, 7, -0.5, 0, TAU); x.fill();
          // očnice — hluboké, stínované (ne tečky): tmavé jádro + měkký okraj
          const socket = (sx2, sy2, rx2, ry2, rot2) => {
            x.save();
            x.translate(sx2, sy2); x.rotate(rot2);
            x.fillStyle = 'rgba(30,22,16,0.55)';
            x.beginPath(); x.ellipse(0.5, 1.5, rx2 + 1.5, ry2 + 1.5, 0, 0, TAU); x.fill();
            x.fillStyle = '#191008';
            x.beginPath(); x.ellipse(0, 0, rx2, ry2, 0, 0, TAU); x.fill();
            // odlesk na horním okraji očnice
            x.strokeStyle = 'rgba(226,214,184,0.5)'; x.lineWidth = 1.6;
            x.beginPath(); x.ellipse(0, -1, rx2, ry2, 0, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
            x.restore();
          };
          socket(-11, 0, 8, 6.5, -0.12);   // bližší očnice větší
          socket(11, -1, 6.5, 6, 0.1);     // vzdálenější mírně menší (3/4 natočení)
          // nosní dutina — srdcovitá
          x.fillStyle = '#1c130a';
          x.beginPath();
          x.moveTo(1, 6);
          x.quadraticCurveTo(-4, 13, 0, 15);
          x.quadraticCurveTo(3, 13.5, 6, 15);
          x.quadraticCurveTo(9, 12, 3, 6);
          x.closePath(); x.fill();
          // řada zubů — nepravidelné, jeden chybí
          x.strokeStyle = 'rgba(70,56,40,0.8)'; x.lineWidth = 1.4;
          x.fillStyle = '#ddd2b6';
          x.fillRect(-9, 19, 22, 6);
          for (let i = 0; i < 6; i++) {
            if (i === 4) { // chybějící zub
              x.fillStyle = '#241a10';
              x.fillRect(-9 + i * 3.7, 19, 3.4, 6);
              x.fillStyle = '#ddd2b6';
              continue;
            }
            x.beginPath(); x.moveTo(-9 + i * 3.7, 19); x.lineTo(-9 + i * 3.7, 25); x.stroke();
          }
          // spánková jamka + šev lebky (jemné rytecké linky)
          x.strokeStyle = 'rgba(96,82,60,0.5)'; x.lineWidth = 1.2;
          x.beginPath(); x.moveTo(-20, -8); x.quadraticCurveTo(-14, -13, -16, -20); x.stroke();
          x.beginPath(); x.moveTo(-4, -27); x.quadraticCurveTo(2, -20, -2, -10); x.stroke();
          x.restore();
          // střední police: lahve, KŘIVULE malá, SKALICE (zelená, svítivá)
          const jarCols = ['#5a7a8c', '#7a5a3e', '#4e6a4e', '#6a4a5e'];
          for (let i = 0; i < 4; i++) {
            const jx = 1512 + i * 40;
            x.fillStyle = jarCols[i];
            x.fillRect(jx, 476, 24, 44);
            x.beginPath(); x.ellipse(jx + 12, 476, 12, 5, 0, 0, TAU); x.fill();
            x.fillStyle = 'rgba(240,230,210,0.35)';
            x.fillRect(jx + 3, 482, 5, 32);
          }
          // ZELENÁ SKALICE — nápadná lahvička se zeleným svitem
          glow(x, 1568, 538, 46, '110,220,140', 0.20);
          x.fillStyle = '#2c6a44';
          x.beginPath();
          x.moveTo(1554, 520); x.lineTo(1554, 488);
          x.quadraticCurveTo(1554, 478, 1562, 476);
          x.lineTo(1574, 476);
          x.quadraticCurveTo(1582, 478, 1582, 488);
          x.lineTo(1582, 520);
          x.closePath(); x.fill();
          x.fillStyle = '#68d494';
          x.fillRect(1558, 500, 20, 17);
          x.fillStyle = '#d9c9a0';
          x.fillRect(1552, 470, 34, 8);
          x.fillStyle = '#3a2c1a'; x.font = 'italic 11px Georgia, serif';
          x.fillText('vitriol', 1553, 478);
          // dolní police: hmoždířky, svitky, sušené byliny visící pod policí
          x.fillStyle = '#8a7a5c';
          x.beginPath(); x.ellipse(1530, 630, 16, 10, 0, 0, TAU); x.fill();
          x.fillStyle = '#d9c9a0';
          for (let i = 0; i < 3; i++) {
            x.save();
            x.translate(1600 + i * 34, 626); x.rotate(-0.1 + i * 0.12);
            x.fillRect(-16, -8, 32, 14);
            x.strokeStyle = '#7a5c34'; x.lineWidth = 1.6; x.strokeRect(-16, -8, 32, 14);
            x.restore();
          }
          x.strokeStyle = '#4e5a2e'; x.lineWidth = 2.4;
          for (let i = 0; i < 4; i++) {
            const hx = 1700 + i * 22;
            x.beginPath(); x.moveTo(hx, 654); x.lineTo(hx - 4, 690); x.stroke();
            x.beginPath(); x.moveTo(hx, 654); x.lineTo(hx + 5, 686); x.stroke();
          }

          /* --- Brahova pozorování Marsu (pulpit s listinami) --- */
          x.save();
          x.translate(1892, 530);
          x.fillStyle = '#4e3826';
          x.fillRect(-72, -110, 145, 190);
          x.strokeStyle = '#241a10'; x.lineWidth = 4;
          x.strokeRect(-72, -110, 145, 190);
          // přišpendlené listy
          for (let i = 0; i < 3; i++) {
            x.save();
            x.translate(-40 + i * 44, -60 + (i % 2) * 58);
            x.rotate(-0.06 + i * 0.05);
            x.fillStyle = '#e8dcbe';
            x.fillRect(-22, -28, 46, 60);
            x.strokeStyle = 'rgba(122,92,52,0.6)'; x.lineWidth = 1.4;
            for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(-16, -18 + k * 10); x.lineTo(18, -18 + k * 10); x.stroke(); }
            x.fillStyle = '#8a2c22';
            x.beginPath(); x.arc(0, -28, 3, 0, TAU); x.fill();
            x.restore();
          }
          // rudý Mars — kroužek s epicyklem
          x.strokeStyle = '#a63a2e'; x.lineWidth = 2.4;
          x.beginPath(); x.arc(4, 10, 26, 0, TAU); x.stroke();
          x.beginPath(); x.arc(24, 0, 9, 0, TAU); x.stroke();
          x.fillStyle = '#c9502e';
          x.beginPath(); x.arc(28, -4, 3.4, 0, TAU); x.fill();
          x.fillStyle = '#3a2c1a'; x.font = 'italic 13px Georgia, serif';
          x.fillText('MARTIS', -28, 68);
          x.restore();

          /* --- krb --- */
          x.save();
          x.translate(2080, 0);
          x.fillStyle = lg(x, -110, 0, 120, 0, [[0, '#6a5878'], [1, '#4a3a56']]);
          x.fillRect(-104, 560, 224, 340);
          // kamenné kvádry
          x.strokeStyle = 'rgba(30,22,40,0.6)'; x.lineWidth = 3;
          for (let i = 0; i < 5; i++) {
            x.beginPath(); x.moveTo(-104, 610 + i * 60); x.lineTo(120, 610 + i * 60); x.stroke();
            x.beginPath(); x.moveTo(-40 + (i % 2) * 60, 610 + i * 60); x.lineTo(-40 + (i % 2) * 60, 670 + i * 60); x.stroke();
          }
          // římsa
          x.fillStyle = '#33241a';
          x.fillRect(-116, 604, 248, 18);
          // topeniště
          x.fillStyle = '#160c06';
          x.beginPath();
          x.moveTo(-70, 900); x.lineTo(-70, 730);
          x.quadraticCurveTo(0, 668, 74, 730);
          x.lineTo(74, 900);
          x.closePath(); x.fill();
          // polena
          x.strokeStyle = '#4e3018'; x.lineWidth = 13; x.lineCap = 'round';
          x.beginPath(); x.moveTo(-46, 872); x.lineTo(50, 858); x.stroke();
          x.beginPath(); x.moveTo(-38, 856); x.lineTo(44, 874); x.stroke();
          // kočka spí u krbu (dech je dynamický — tělo statické)
          x.restore();

          /* --- armilární sféra na sloupku --- */
          x.save();
          x.translate(1180, 866);
          x.fillStyle = 'rgba(10,6,16,0.4)';
          x.beginPath(); x.ellipse(0, 6, 60, 13, 0, 0, TAU); x.fill();
          x.fillStyle = '#4e3826';
          x.fillRect(-13, -120, 26, 122);
          x.fillStyle = '#33241a';
          x.beginPath(); x.ellipse(0, 0, 34, 10, 0, 0, TAU); x.fill();
          x.translate(0, -170);
          x.strokeStyle = '#c9932e'; x.lineWidth = 5;
          x.beginPath(); x.arc(0, 0, 52, 0, TAU); x.stroke();
          x.strokeStyle = '#a5772a'; x.lineWidth = 4;
          x.beginPath(); x.ellipse(0, 0, 52, 18, 0, 0, TAU); x.stroke();
          x.beginPath(); x.ellipse(0, 0, 20, 52, 0, 0, TAU); x.stroke();
          x.save(); x.rotate(0.42);
          x.strokeStyle = '#e0b45e'; x.lineWidth = 3.5;
          x.beginPath(); x.ellipse(0, 0, 52, 8, 0, 0, TAU); x.stroke();
          x.restore();
          x.strokeStyle = '#8a5f1e'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(-38, 42); x.lineTo(38, -42); x.stroke();
          x.fillStyle = '#f0d9a0';
          x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.fill();
          x.restore();

          /* --- velký mosazný nebeský glóbus --- */
          x.save();
          x.translate(1420, 878);
          x.fillStyle = 'rgba(10,6,16,0.4)';
          x.beginPath(); x.ellipse(0, 8, 78, 15, 0, 0, TAU); x.fill();
          // trojnožka
          x.strokeStyle = '#4e3826'; x.lineWidth = 11; x.lineCap = 'round';
          x.beginPath(); x.moveTo(0, -70); x.lineTo(-46, 2); x.stroke();
          x.beginPath(); x.moveTo(0, -70); x.lineTo(46, 2); x.stroke();
          x.beginPath(); x.moveTo(0, -70); x.lineTo(0, 6); x.stroke();
          // koule
          const gg = x.createRadialGradient(-24, -152, 10, 0, -128, 82);
          gg.addColorStop(0, '#f0d9a0');
          gg.addColorStop(0.45, '#c9932e');
          gg.addColorStop(1, '#6a4415');
          x.fillStyle = gg;
          x.beginPath(); x.arc(0, -128, 72, 0, TAU); x.fill();
          // rytá souhvězdí
          x.strokeStyle = 'rgba(60,38,10,0.6)'; x.lineWidth = 1.6;
          x.beginPath(); x.ellipse(0, -128, 72, 24, 0, 0, TAU); x.stroke();
          x.beginPath(); x.ellipse(0, -128, 72, 48, 0, 0, TAU); x.stroke();
          x.beginPath(); x.ellipse(0, -128, 30, 72, 0, 0, TAU); x.stroke();
          const r6 = mulberry(6161);
          x.fillStyle = 'rgba(50,30,8,0.8)';
          for (let i = 0; i < 16; i++) {
            const a1 = r6() * TAU, r1 = r6() * 58;
            x.beginPath(); x.arc(Math.cos(a1) * r1, -128 + Math.sin(a1) * r1 * 0.8, 2, 0, TAU); x.fill();
          }
          // horizontový kruh
          x.strokeStyle = '#8a5f1e'; x.lineWidth = 6;
          x.beginPath(); x.ellipse(0, -128, 86, 28, 0, 0, TAU); x.stroke();
          x.restore();

          /* --- stůl s křivulí (destilace) --- */
          x.save();
          x.translate(1700, 0);
          contactShadow(x, 10, 902, 115, 16, 1, '10,6,20');
          x.fillStyle = '#4e3826';
          x.fillRect(-96, 828, 210, 16);
          x.fillStyle = '#3a2a1c';
          x.fillRect(-84, 844, 16, 56);
          x.fillRect(86, 844, 16, 56);
          // kahan
          x.fillStyle = '#57575f';
          x.beginPath(); x.ellipse(-40, 824, 15, 6, 0, 0, TAU); x.fill();
          x.fillRect(-46, 804, 12, 18);
          // baňka křivule
          x.fillStyle = 'rgba(150,190,210,0.35)';
          x.beginPath(); x.arc(-40, 776, 26, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(200,225,240,0.6)'; x.lineWidth = 2.4;
          x.beginPath(); x.arc(-40, 776, 26, 0, TAU); x.stroke();
          // obsah — bublající zlatá tekutina
          x.fillStyle = 'rgba(220,170,60,0.55)';
          x.beginPath(); x.arc(-40, 782, 20, 0.2, Math.PI - 0.2); x.closePath(); x.fill();
          // krk křivule dolů do sběrné lahve
          x.strokeStyle = 'rgba(200,225,240,0.6)'; x.lineWidth = 8;
          x.beginPath();
          x.moveTo(-20, 762);
          x.quadraticCurveTo(30, 738, 56, 782);
          x.stroke();
          x.fillStyle = 'rgba(150,190,210,0.35)';
          x.beginPath(); x.arc(60, 806, 17, 0, TAU); x.fill();
          x.fillStyle = 'rgba(220,170,60,0.5)';
          x.beginPath(); x.arc(60, 812, 11, 0.2, Math.PI - 0.2); x.closePath(); x.fill();
          x.restore();

          /* --- stolek s hmoždířem (vlevo) --- */
          x.save();
          x.translate(378, 0);
          contactShadow(x, 0, 900, 95, 14, 1, '10,6,20');
          x.fillStyle = '#4e3826';
          x.fillRect(-80, 806, 164, 14);
          x.fillStyle = '#3a2a1c';
          x.fillRect(-68, 820, 14, 78);
          x.fillRect(56, 820, 14, 78);
          // bronzový hmoždíř s tloukem
          const mg2 = x.createLinearGradient(-34, 0, 30, 0);
          mg2.addColorStop(0, '#a5772a'); mg2.addColorStop(0.5, '#c9932e'); mg2.addColorStop(1, '#6a4415');
          x.fillStyle = mg2;
          x.beginPath();
          x.moveTo(-34, 762);
          x.quadraticCurveTo(-30, 806, 0, 806);
          x.quadraticCurveTo(30, 806, 34, 762);
          x.closePath(); x.fill();
          x.beginPath(); x.ellipse(0, 762, 34, 10, 0, 0, TAU); x.fill();
          x.fillStyle = '#241a10';
          x.beginPath(); x.ellipse(0, 762, 26, 7, 0, 0, TAU); x.fill();
          x.strokeStyle = '#c9932e'; x.lineWidth = 9; x.lineCap = 'round';
          x.beginPath(); x.moveTo(14, 758); x.lineTo(40, 716); x.stroke();
          // rozsypané duběnky vedle
          x.fillStyle = '#6a4a2a';
          x.beginPath(); x.arc(-52, 800, 5, 0, TAU); x.fill();
          x.beginPath(); x.arc(-60, 806, 4, 0, TAU); x.fill();
          x.restore();

          /* --- psací pult (šikmý, s kalamářem) --- */
          x.save();
          x.translate(1965, 0);
          x.fillStyle = 'rgba(10,6,16,0.4)';
          x.beginPath(); x.ellipse(0, 1044, 130, 20, 0, 0, TAU); x.fill();
          // nohy
          x.fillStyle = '#33241a';
          x.fillRect(-104, 880, 20, 168);
          x.fillRect(86, 880, 20, 168);
          x.fillRect(-96, 960, 194, 14);
          // šikmá deska
          x.fillStyle = lg(x, -120, 780, 120, 880, [[0, '#6a4e30'], [1, '#443019']]);
          fillP(x, [[-124, 830], [122, 796], [130, 872], [-116, 906]], '#5a4030');
          x.strokeStyle = '#241a10'; x.lineWidth = 4;
          P(x, [[-124, 830], [122, 796], [130, 872], [-116, 906]]); x.stroke();
          // rozepsaný pergamen
          x.save();
          x.rotate(-0.13);
          x.fillStyle = '#e8dcbe';
          x.fillRect(-74, 900, 120, 76);
          x.strokeStyle = 'rgba(122,92,52,0.55)'; x.lineWidth = 1.6;
          for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(-64, 914 + i * 11); x.lineTo(36, 914 + i * 11); x.stroke(); }
          x.restore();
          // kalamář + brk držák
          x.fillStyle = '#241a10';
          x.beginPath(); x.ellipse(64, 806, 13, 8, -0.14, 0, TAU); x.fill();
          x.strokeStyle = '#d9c9a0'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(66, 800); x.quadraticCurveTo(84, 766, 96, 758); x.stroke();
          // svíčka na pultu (plamen dynamický) — x 1908? zde lokálně (-57, 792)
          x.fillStyle = '#e8dcbe';
          x.fillRect(-63, 764, 12, 40);
          x.fillStyle = '#c9932e';
          x.beginPath(); x.ellipse(-57, 806, 17, 7, 0, 0, TAU); x.fill();
          x.restore();

          /* --- mosazný svícen (pečetění) --- */
          x.save();
          x.translate(1752, 0);
          x.fillStyle = 'rgba(10,6,16,0.4)';
          x.beginPath(); x.ellipse(0, 1006, 52, 11, 0, 0, TAU); x.fill();
          const bg2 = x.createLinearGradient(-20, 0, 20, 0);
          bg2.addColorStop(0, '#8a5f1e'); bg2.addColorStop(0.5, '#e0b45e'); bg2.addColorStop(1, '#6a4415');
          x.strokeStyle = bg2; x.fillStyle = bg2;
          x.beginPath(); x.ellipse(0, 1000, 34, 9, 0, 0, TAU); x.fill();
          x.lineWidth = 9;
          x.beginPath(); x.moveTo(0, 998); x.lineTo(0, 892); x.stroke();
          x.beginPath(); x.ellipse(0, 940, 14, 5, 0, 0, TAU); x.fill();
          // tři ramena
          x.lineWidth = 6;
          x.beginPath(); x.moveTo(0, 908); x.quadraticCurveTo(-30, 900, -23, 878); x.stroke();
          x.beginPath(); x.moveTo(0, 908); x.quadraticCurveTo(30, 900, 23, 878); x.stroke();
          // misky + svíčky
          for (const [cx, cy] of [[-23, 878], [0, 892], [23, 878]]) {
            x.fillStyle = bg2;
            x.beginPath(); x.ellipse(cx, cy, 12, 4.5, 0, 0, TAU); x.fill();
            x.fillStyle = '#e8dcbe';
            x.fillRect(cx - 5, cy - 34, 10, 34);
          }
          // vosková kapka + kousky pečetního vosku u paty
          x.fillStyle = '#8a2c22';
          x.beginPath(); x.arc(40, 1002, 6, 0, TAU); x.fill();
          x.beginPath(); x.arc(50, 1006, 4, 0, TAU); x.fill();
          x.restore();

          /* --- VELKÝ SEXTANT (popředí, walkBehind) --- */
          x.save();
          x.translate(660, 0);
          x.fillStyle = 'rgba(10,6,16,0.45)';
          x.beginPath(); x.ellipse(20, 1052, 190, 24, 0, 0, TAU); x.fill();
          // masivní dubová podnož
          x.fillStyle = lg(x, -60, 0, 70, 0, [[0, '#5a4030'], [1, '#33241a']]);
          fillP(x, [[-62, 1052], [-38, 880], [-10, 880], [-26, 1052]], '#4a3524');
          fillP(x, [[42, 1052], [50, 880], [78, 880], [78, 1052]], '#3f2d1f');
          x.fillRect(-52, 952, 130, 18);
          x.fillRect(-40, 866, 110, 24);
          // kloub
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(18, 862, 17, 0, TAU); x.fill();
          x.fillStyle = '#6a4415';
          x.beginPath(); x.arc(18, 862, 7, 0, TAU); x.fill();
          // mosazný oblouk sextantu (šikmo vzhůru)
          x.save();
          x.translate(18, 862);
          x.rotate(-0.5);
          x.strokeStyle = '#c9932e'; x.lineWidth = 11;
          x.beginPath(); x.arc(0, 0, 240, -1.32, -0.28); x.stroke();
          x.strokeStyle = '#8a5f1e'; x.lineWidth = 3;
          x.beginPath(); x.arc(0, 0, 248, -1.32, -0.28); x.stroke();
          // stupnice
          x.strokeStyle = '#f0d9a0'; x.lineWidth = 2;
          for (let i = 0; i <= 30; i++) {
            const a = -1.32 + (i / 30) * 1.04;
            const len = i % 5 === 0 ? 18 : 9;
            x.beginPath();
            x.moveTo(Math.cos(a) * (234 - len), Math.sin(a) * (234 - len));
            x.lineTo(Math.cos(a) * 234, Math.sin(a) * 234);
            x.stroke();
          }
          // dvě záměrná ramena
          x.strokeStyle = '#a5772a'; x.lineWidth = 9;
          x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(-1.26) * 252, Math.sin(-1.26) * 252); x.stroke();
          x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(-0.34) * 252, Math.sin(-0.34) * 252); x.stroke();
          // průzory
          x.fillStyle = '#e0b45e';
          for (const aa of [-1.26, -0.34]) {
            x.save();
            x.translate(Math.cos(aa) * 244, Math.sin(aa) * 244);
            x.rotate(aa + Math.PI / 2);
            x.fillRect(-8, -14, 16, 22);
            x.fillStyle = '#241a10';
            x.fillRect(-2.4, -8, 5, 10);
            x.fillStyle = '#e0b45e';
            x.restore();
          }
          // zrcátko na kloubu (na Měsíc!)
          x.fillStyle = '#dfe9f5';
          x.save(); x.rotate(0.5);
          x.fillRect(-13, -34, 26, 20);
          x.strokeStyle = '#8a5f1e'; x.lineWidth = 3; x.strokeRect(-13, -34, 26, 20);
          x.restore();
          x.restore();
          // mosazná protizávaží
          x.strokeStyle = '#57575f'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(-30, 890); x.lineTo(-44, 946); x.stroke();
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(-44, 956, 12, 0, TAU); x.fill();
          x.restore();

          /* --- perský kobereček + drobnosti --- */
          x.save();
          x.translate(1290, 986);
          x.rotate(-0.02);
          x.fillStyle = '#7a3a2e';
          x.fillRect(-190, -44, 380, 92);
          x.strokeStyle = '#c9a24a'; x.lineWidth = 5;
          x.strokeRect(-176, -34, 352, 72);
          x.strokeStyle = 'rgba(201,162,74,0.6)'; x.lineWidth = 2.5;
          x.strokeRect(-150, -22, 300, 48);
          x.fillStyle = '#c9a24a';
          x.beginPath(); x.ellipse(0, 2, 40, 18, 0, 0, TAU); x.fill();
          x.fillStyle = '#7a3a2e';
          x.beginPath(); x.ellipse(0, 2, 26, 11, 0, 0, TAU); x.fill();
          x.restore();
          // pohozené svitky u pultu
          for (let i = 0; i < 3; i++) {
            x.save();
            x.translate(1820 + i * 40, 1040 + (i % 2) * 14);
            x.rotate(-0.4 + i * 0.5);
            x.fillStyle = '#d9c9a0';
            x.fillRect(-26, -7, 52, 14);
            x.fillStyle = '#b89868';
            x.beginPath(); x.ellipse(-26, 0, 4, 7, 0, 0, TAU); x.fill();
            x.beginPath(); x.ellipse(26, 0, 4, 7, 0, 0, TAU); x.fill();
            x.restore();
          }
          // spící kočka u krbu
          x.save();
          x.translate(1948, 886);
          contactShadow(x, 0, 16, 42, 8, 0.9, '10,6,20');
          x.fillStyle = '#57493a';
          x.beginPath(); x.ellipse(0, 0, 34, 17, 0, 0, TAU); x.fill();
          x.beginPath(); x.arc(-26, -8, 12, 0, TAU); x.fill();
          x.strokeStyle = '#57493a'; x.lineWidth = 7; x.lineCap = 'round';
          x.beginPath(); x.moveTo(28, 4); x.quadraticCurveTo(48, 8, 44, -10); x.stroke();
          x.fillStyle = '#3d332a';
          fillP(x, [[-34, -16], [-30, -26], [-24, -17]], '#3d332a');
          fillP(x, [[-20, -18], [-14, -27], [-10, -17]], '#3d332a');
          x.restore();
          // globální malířské zrno
          grain(x, SW, H, 0.055);
        }
      }
    ],
    dynamic(ctx, t, camX) {
      /* hvězdy za oknem se otáčejí kolem Polárky */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(500, 706); ctx.lineTo(500, 340);
      ctx.quadraticCurveTo(508, 236, 690, 224);
      ctx.quadraticCurveTo(872, 236, 880, 340);
      ctx.lineTo(880, 706);
      ctx.closePath();
      ctx.clip();
      ctx.translate(camX * (1 - 0.3), 0);
      const px0 = 700, py0 = 300;
      ctx.translate(px0, py0);
      ctx.rotate(t * 0.0035);
      const rs = mulberry(6301);
      ctx.fillStyle = '#f5f0dc';
      for (let i = 0; i < 46; i++) {
        const a = rs() * TAU, rad = 20 + rs() * 420, sz = 0.6 + rs() * 1.7;
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + rs() * 2) + i);
        ctx.globalAlpha = 0.25 + 0.65 * tw;
        ctx.beginPath(); ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad, sz, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.rotate(-t * 0.0035);
      // Polárka — stálice
      ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      /* oheň v krbu */
      fireDyn(ctx, t, 2082, 886, 1.15, 4.2);
      // mihotavá záře krbu na podlaze
      ctx.fillStyle = 'rgba(255,150,60,' + (0.10 + 0.04 * Math.sin(t * 9.3) * Math.sin(t * 5.1)) + ')';
      ctx.beginPath(); ctx.ellipse(2040, 950, 320, 80, 0, 0, TAU); ctx.fill();

      /* svíce */
      for (const c of CANDLES) flameDyn(ctx, t, c[0], c[1] - 36 * c[2], c[2], c[3]);

      /* pára z křivule — puf puf */
      {
        const bx = 1660, by = 748;
        for (let i = 0; i < 5; i++) {
          const life = ((t * 0.32 + i / 5) % 1);
          mistPuff(ctx, bx + 20 + Math.sin(t * 1.1 + i * 2) * 8 + life * 22, by - life * 70, 8 + life * 22, 6 + life * 14, '210,225,240', 0.16 * (1 - life));
        }
        // bublinky v baňce
        const rb = mulberry(63);
        ctx.fillStyle = 'rgba(255,230,170,0.7)';
        for (let i = 0; i < 4; i++) {
          const life = ((t * (0.5 + rb() * 0.4) + rb()) % 1);
          ctx.globalAlpha = (1 - life) * 0.6;
          ctx.beginPath(); ctx.arc(1652 + rb() * 16, 790 - life * 22, 1.6 + rb() * 1.8, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // kapka do sběrné lahve
        const dl = (t * 0.7) % 1;
        if (dl < 0.35) {
          ctx.fillStyle = 'rgba(220,170,60,0.8)';
          ctx.beginPath(); ctx.arc(1760, 788 + dl * 40, 2.2, 0, TAU); ctx.fill();
        }
      }

      /* kočka — dýchá, švihá ocasem */
      {
        const br = 1 + Math.sin(t * 1.9) * 0.05;
        ctx.save();
        ctx.translate(1948, 886);
        ctx.scale(br, 1);
        ctx.fillStyle = 'rgba(87,73,58,0.65)';
        ctx.beginPath(); ctx.ellipse(0, -4, 30, 12, 0, 0, TAU); ctx.fill();
        ctx.restore();
        if ((t % 7) < 1.1) {
          const sw = Math.sin((t % 7) * 6) * 12;
          ctx.strokeStyle = '#57493a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(1976, 890); ctx.quadraticCurveTo(1996, 894 + sw, 1992, 876 + sw); ctx.stroke();
        }
      }

      /* mosazné odlesky (glóbus, kvadrant, sextant) putují se svitem svící */
      sparkleDyn(ctx, t * 0.7, 6302, 8, 1350, 700, 160, 120, '255,224,150');
      sparkleDyn(ctx, t * 0.6, 6303, 6, 700, 620, 260, 220, '255,224,150');
      sparkleDyn(ctx, t * 0.8, 6304, 5, 980, 420, 320, 260, '255,224,150');
    },
    overlayDynamic(ctx, t, camX) {
      camX = camX || 0;
      /* měsíční paprsek z okna — dýchá, s prachem */
      const a = 0.10 + 0.035 * Math.sin(t * 0.4);
      ctx.save();
      const grd = ctx.createLinearGradient(690, 240, 980, 960);
      grd.addColorStop(0, 'rgba(184,207,232,' + a * 1.4 + ')');
      grd.addColorStop(1, 'rgba(184,207,232,0)');
      ctx.fillStyle = grd;
      fillP(ctx, [[510, 250], [880, 250], [1160, 980], [560, 980]], ctx.fillStyle);
      // prachová zrnka v paprsku
      const rd = mulberry(6401);
      ctx.fillStyle = 'rgba(220,232,250,0.8)';
      for (let i = 0; i < 26; i++) {
        const life = ((t * (0.03 + rd() * 0.05) + rd()) % 1);
        const lx = lerp(560, 1100, rd());
        const px = lx + Math.sin(t * 0.5 + i) * 14;
        const py = lerp(280, 960, (life + rd() * 0.15) % 1);
        // jen uvnitř kužele
        const tt = (py - 250) / 730;
        const xmin = lerp(510, 560, tt), xmax = lerp(880, 1160, tt);
        if (px < xmin || px > xmax) continue;
        ctx.globalAlpha = 0.35 * Math.sin(Math.PI * ((t * 0.1 + i * 0.37) % 1));
        ctx.beginPath(); ctx.arc(px, py, 1.3, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      /* teplá tma po krajích (screen-space) */
      ctx.save();
      ctx.translate(camX, 0);
      const vg = ctx.createRadialGradient(W / 2, H * 0.5, 380, W / 2, H * 0.5, 1250);
      vg.addColorStop(0, 'rgba(8,4,14,0)');
      vg.addColorStop(1, 'rgba(8,4,14,0.42)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
    walkArea: [[180, 840], [2060, 840], [2060, 1035], [180, 1035]],
    scaleAt(y) { return clamp(0.55 + 0.5 * (y - 820) / 215, 0.5, 1.06); },
    exits: [
      { to: 'castle_yard', at: [210, 890], spawn: [2380, 930], label: { cz: 'Schody dolů na nádvoří', en: 'Stairs down to the courtyard' } }
    ],
    actors: [{ id: 'brahe', x: 1275, y: 940, dir: -1 }]
  });
})();

/* =========================================================================
   SCÉNA: river_bank — břeh Jizery pod jezem, mrazivé ráno (2800)
   ========================================================================= */
(function () {
  const SW = 2800;

  BNJ.registerScene({
    id: 'river_bank',
    width: SW,
    name: { cz: 'Břeh Jizery', en: 'The Jizera Bank' },
    lightTint: 'rgba(205,222,240,0.10)',
    spawn: [300, 940],
    layers: [
      { // bledé ranní nebe + mlžné slunce
        parallax: 0.2,
        paint(x) {
          // nebe — 3 barevné zóny: studená modř nahoře, perleť, teplá mlžná u obzoru
          x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#b4c8da'], [0.35, '#d2e2ec'], [0.62, '#e6e6d6'], [0.85, '#f2e6cc'], [1, '#f2ead8']]);
          x.fillRect(0, 0, SW, H);
          glow(x, 2050, 300, 340, '250,240,210', 0.5);
          x.fillStyle = 'rgba(252,246,224,0.9)';
          x.beginPath(); x.arc(2050, 300, 56, 0, TAU); x.fill();
          x.fillStyle = 'rgba(252,246,224,0.35)';
          x.beginPath(); x.arc(2050, 300, 86, 0, TAU); x.fill();
          // dvoutónové mraky se světlem od mlžného slunce (vpravo) —
          // víc pater, aby horní polovina plátna žila
          cloud2(x, 500, 200, 1.8, '#eae2ce', '#b6c2ce', 0.55, 71, 1);
          cloud2(x, 1300, 130, 1.5, '#ece4d2', '#bcc8d4', 0.5, 72, 1);
          cloud2(x, 2500, 220, 1.4, '#f2e8d0', '#c2ccd6', 0.5, 73, 1);
          softCloud(x, 900, 300, 1.5, '206,216,226', 0.35, 74);
          cloud2(x, 180, 90, 1.3, '#e2dcc8', '#aebac8', 0.45, 76, 1);
          cloud2(x, 900, 70, 1.1, '#e8e0cc', '#b4c0cc', 0.4, 77, 1);
          cloud2(x, 1850, 180, 1.6, '#f4ecd4', '#c6d0da', 0.5, 78, 1);
          softCloud(x, 2250, 90, 1.3, '212,220,230', 0.3, 79);
          softCloud(x, 1550, 340, 1.7, '222,226,222', 0.26, 80);
          cloud2(x, 2680, 110, 1.0, '#eee6d0', '#bcc6d2', 0.4, 81, -1);
          // protrhaná stratová šmouha pod sluncem — světlo se do ní opírá
          mistPuff(x, 2050, 400, 520, 40, '246,238,214', 0.30);
          mistPuff(x, 1750, 430, 420, 30, '238,232,210', 0.22);
          // hejno vran táhne k jihu — V formace + opozdilci, zaplní nebe
          const rv = mulberry(75);
          for (let i = 0; i < 9; i++) {
            const k = i - 4, lead = 1200, ly = 130;
            const bx = lead + k * 62 + (rv() - 0.5) * 18;
            const by = ly + Math.abs(k) * 34 + (rv() - 0.5) * 12;
            flyBird(x, bx, by, 0.4 + rv() * 0.26, rv() * TAU, 'rgba(64,74,90,' + (0.42 + rv() * 0.28) + ')');
          }
          for (let i = 0; i < 6; i++) { // opozdilci roztroušeně
            const bx = 380 + rv() * 1200, by = 90 + rv() * 220;
            flyBird(x, bx, by, 0.3 + rv() * 0.26, rv() * TAU, 'rgba(70,80,96,' + (0.3 + rv() * 0.26) + ')');
          }
          // sněhová přeháňka vlevo — dva šikmé závoje + šrafy vloček
          x.save();
          x.globalAlpha = 0.24;
          x.fillStyle = lg(x, 120, 40, 460, 560, [[0, '#eef2f6'], [1, 'rgba(238,242,246,0)']]);
          fillP(x, [[60, 30], [640, 30], [430, 560], [0, 560]], x.fillStyle);
          x.globalAlpha = 0.14;
          x.fillStyle = lg(x, 500, 60, 780, 500, [[0, '#e8eef4'], [1, 'rgba(232,238,244,0)']]);
          fillP(x, [[480, 40], [900, 40], [740, 500], [360, 500]], x.fillStyle);
          x.restore();
          x.strokeStyle = 'rgba(240,245,250,0.30)'; x.lineWidth = 1.6;
          for (let i = 0; i < 46; i++) {
            const sx = 40 + rv() * 700, sy = 50 + rv() * 420, sl = 10 + rv() * 16;
            x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx - sl * 0.4, sy + sl); x.stroke();
          }
          grain(x, SW, H, 0.035);
        }
      },
      { // protější břeh — Staré Benátky v mlze + horní klidná hladina
        parallax: 0.45,
        paint(x) {
          const r = mulberry(7001);
          // pás mlhy nad obzorem — měkké překrývající se elipsy (žádné tvrdé hrany)
          for (let i = 0; i < 12; i++) {
            mistPuff(x, i * (SW / 11) + (r() - 0.5) * 120, 445 + (r() - 0.5) * 40,
              260 + r() * 140, 60 + r() * 34, '232,238,242', 0.5 + r() * 0.3);
          }
          // silueta Starých Benátek — praná v mlze, každý dům jiný
          for (let i = 0; i < 12; i++) {
            const hx = 120 + i * 240 + r() * 60;
            const hw = 80 + r() * 90, hh = 40 + r() * 46;
            const peak = 18 + r() * 26;
            const a2 = 0.55 + r() * 0.25;
            const col = 'rgba(' + (150 + ((r() * 18) | 0)) + ',' + (165 + ((r() * 16) | 0)) + ',' + (182 + ((r() * 12) | 0)) + ',' + a2.toFixed(2) + ')';
            if (r() > 0.6) { // sedlová střecha
              fillP(x, [[hx, 470], [hx, 470 - hh], [hx + hw / 2, 470 - hh - peak], [hx + hw, 470 - hh], [hx + hw, 470]], col);
            } else if (r() > 0.3) { // pultová / nižší křídlo
              fillP(x, [[hx, 470], [hx, 470 - hh], [hx + hw * 0.7, 470 - hh - peak * 0.6], [hx + hw, 470 - hh + 8], [hx + hw, 470]], col);
            } else { // štít + přístavek
              fillP(x, [[hx, 470], [hx, 470 - hh], [hx + hw * 0.4, 470 - hh - peak], [hx + hw * 0.6, 470 - hh], [hx + hw * 0.6, 470]], col);
              fillP(x, [[hx + hw * 0.6, 470], [hx + hw * 0.6, 470 - hh * 0.6], [hx + hw, 470 - hh * 0.6], [hx + hw, 470]], col);
            }
            // komín s pramínkem kouře sem tam
            if (r() > 0.55) {
              x.fillStyle = col;
              x.fillRect(hx + hw * 0.65, 470 - hh - peak * 0.5 - 16, 9, 18);
              mistPuff(x, hx + hw * 0.65 + 8, 470 - hh - peak * 0.5 - 34, 16, 26, '210,218,228', 0.30);
              mistPuff(x, hx + hw * 0.65 + 20, 470 - hh - peak * 0.5 - 62, 22, 30, '214,222,230', 0.22);
            }
          }
          // zvonička Starých Benátek
          x.fillStyle = 'rgba(148,162,180,0.8)';
          x.fillRect(1180, 356, 40, 114);
          fillP(x, [[1170, 356], [1200, 316], [1230, 356]], 'rgba(148,162,180,0.8)');
          /* --- mlýn u jezu (vlevo) — vysoká silueta s kolem a kouřem,
                 kotví levou stranu a jeho kouř táhne do prázdného nebe --- */
          x.fillStyle = 'rgba(128,142,160,0.85)';
          x.fillRect(268, 330, 150, 140); // hlavní stavení
          fillP(x, [[254, 330], [343, 272], [432, 330]], 'rgba(128,142,160,0.85)');
          x.fillRect(398, 386, 74, 84); // nižší křídlo nad vodou
          fillP(x, [[392, 386], [435, 356], [478, 386]], 'rgba(128,142,160,0.85)');
          snowBand(x, [[258, 328], [343, 276], [428, 328]], 8, 7005, '#e8eef6', '#a8b6c8');
          // mlýnské kolo — polovina nad hladinou, lopatky s ledem
          x.strokeStyle = 'rgba(74,84,100,0.9)'; x.lineWidth = 6;
          x.beginPath(); x.arc(470, 452, 34, Math.PI, TAU); x.stroke();
          x.lineWidth = 3;
          for (let i = 0; i <= 6; i++) {
            const a3 = Math.PI + i / 6 * Math.PI;
            x.beginPath(); x.moveTo(470, 452);
            x.lineTo(470 + Math.cos(a3) * 33, 452 + Math.sin(a3) * 33); x.stroke();
          }
          x.strokeStyle = 'rgba(214,228,240,0.8)'; x.lineWidth = 4;
          x.beginPath(); x.arc(470, 452, 34, Math.PI * 1.1, Math.PI * 1.55); x.stroke();
          // okénko mlýna — jediné teplé světlo protějšího břehu
          x.fillStyle = 'rgba(255,206,130,0.75)';
          x.fillRect(302, 372, 14, 20);
          glow(x, 309, 382, 34, '255,200,120', 0.22);
          // komín + statický sloup kouře stoupající vysoko (dyn. dokresluje)
          x.fillStyle = 'rgba(120,134,152,0.85)';
          x.fillRect(376, 296, 14, 40);
          mistPuff(x, 386, 268, 18, 26, '206,214,224', 0.4);
          mistPuff(x, 400, 216, 26, 34, '210,218,228', 0.32);
          mistPuff(x, 422, 152, 36, 44, '214,222,232', 0.24);
          mistPuff(x, 452, 84, 48, 52, '218,226,234', 0.16);
          // holé stromy na břehu
          for (let i = 0; i < 7; i++) {
            bareTree(x, 200 + i * 420 + r() * 100, 470, 90 + r() * 40, 7010 + i, 'rgba(130,142,158,0.65)');
          }
          // druhý závoj mlhy před siluetou — opět elipsy
          for (let i = 0; i < 9; i++) {
            mistPuff(x, i * (SW / 8) + (r() - 0.5) * 160, 455 + (r() - 0.5) * 26,
              300 + r() * 120, 44 + r() * 22, '226,234,240', 0.4 + r() * 0.25);
          }
          // sněhový pruh protějšího břehu
          snowBand(x, [[0, 470], [SW, 470]], 14, 7002, '#eef3f8', '#c2cfdd');
          // klidná horní hladina (nad jezem) — zrcadlí mlhu
          x.fillStyle = lg(x, 0, 484, 0, 600, [[0, '#aebfc6'], [0.5, '#93a8b0'], [1, '#7e949e']]);
          x.fillRect(0, 484, SW, 120);
          // odrazy siluet
          x.save();
          x.globalAlpha = 0.25;
          x.scale(1, -0.55);
          x.translate(0, -1720);
          x.fillStyle = '#6e8290';
          const rrf = mulberry(7003);
          for (let i = 0; i < 12; i++) {
            const hx = 120 + i * 240 + rrf() * 50;
            x.globalAlpha = 0.14 + rrf() * 0.16;
            x.fillRect(hx, 850, 80 + rrf() * 90, 40 + rrf() * 40);
          }
          x.restore();
          x.globalAlpha = 1;
          // ledový lem u protějšího břehu
          x.fillStyle = 'rgba(206,224,236,0.85)';
          x.beginPath();
          x.moveTo(0, 484);
          for (let px = 0; px <= SW; px += 120) x.lineTo(px, 492 + Math.sin(px * 0.02) * 6 + (r() - 0.5) * 8);
          x.lineTo(SW, 484); x.closePath(); x.fill();
        }
      },
      { // křoviny a vrby na hraně jezu (mezivrstva)
        parallax: 0.75,
        paint(x) {
          const r = mulberry(7050);
          for (let i = 0; i < 9; i++) {
            const bx = 90 + i * 330 + r() * 90;
            bareTree(x, bx, 610, 70 + r() * 50, 7051 + i, 'rgba(110,118,132,0.8)', (r() - 0.5));
            snowBand(x, [[bx - 26, 606], [bx + 26, 606]], 7, 7060 + i, '#eef3f8', '#b6c5d6');
          }
          // zasněžené keře
          for (let i = 0; i < 14; i++) {
            const bx = r() * SW, by = 596 + r() * 16;
            x.fillStyle = 'rgba(122,130,146,0.7)';
            x.beginPath(); x.ellipse(bx, by, 30 + r() * 26, 14 + r() * 8, 0, 0, TAU); x.fill();
            x.fillStyle = 'rgba(238,243,248,0.8)';
            x.beginPath(); x.ellipse(bx, by - 8, 26 + r() * 20, 8 + r() * 5, 0, 0, TAU); x.fill();
          }
        }
      },
      { // 1.0 — jez, peřej, břeh, pramice, ohniště, rákosí s hnízdem
        parallax: 1,
        walkBehind: [
          // pramice (převrácená, popředí)
          [[1348, 1080], [1360, 972], [1450, 936], [1720, 930], [1836, 972], [1848, 1080]],
          // přední trs rákosí vpravo dole
          [[2470, 1080], [2480, 990], [2540, 950], [2620, 986], [2660, 1080]],
          // balvan vlevo dole
          [[210, 1080], [224, 1020], [318, 1004], [398, 1042], [408, 1080]]
        ],
        paint(x) {
          const r = mulberry(7100);
          /* --- těleso jezu (koruna) přes levou polovinu --- */
          // dolní řeka (pod jezem) — základ
          x.fillStyle = lg(x, 0, 600, 0, 840, [[0, '#4a6672'], [0.5, '#3e5a66'], [1, '#33505c']]);
          x.fillRect(0, 604, SW, 240);
          // koruna jezu — mokré tmavé trámy se zbytky sněhu (ne bledý pás)
          fillP(x, [[240, 636], [1560, 606], [1560, 642], [240, 672]], '#3a2c1c');
          fillP(x, [[240, 632], [1560, 602], [1560, 612], [240, 644]], '#57432a');
          // potrhaný ledový ret na hraně — přerušovaný, ne souvislá linka
          x.fillStyle = 'rgba(238,244,250,0.8)';
          for (let px = 252; px < 1550; px += 46) {
            if (r() < 0.35) continue;
            const fy = lerp(633, 603, (px - 240) / 1320);
            x.beginPath(); x.ellipse(px + r() * 18, fy + 2, 11 + r() * 15, 2.6 + r() * 2, -0.02, 0, TAU); x.fill();
          }
          // přepadová stěna — ztlumená o dva valéry, ať nepřebíjí sníh a lísteček
          x.fillStyle = '#7e97a3';
          fillP(x, [[240, 660], [1560, 630], [1560, 700], [240, 736]], '#7e97a3');
          // stín pod převisem koruny — voda padá ze tmy, ne z bílé hrany
          x.fillStyle = 'rgba(38,58,66,0.55)';
          fillP(x, [[240, 660], [1560, 630], [1560, 646], [240, 678]], x.fillStyle);
          let fwx = 250;
          while (fwx < 1540) {
            const fy = lerp(662, 632, (fwx - 240) / 1320);
            x.fillStyle = 'rgba(222,236,243,' + (0.14 + r() * 0.18).toFixed(2) + ')';
            x.fillRect(fwx, fy, 3 + r() * 10, 44 + r() * 30);
            fwx += 16 + r() * 48;
          }

          /* --- LÁVKA nad jezem — tmavá silueta na diagonále (F2):
                 mokré dřevo 2–3 hodnoty, klesá k pravému břehu, sloupky
                 nepravidelné výškou/náklonem/rozestupem, sněhové čepice --- */
          {
            const bl = mulberry(7180);
            const dX0 = 120, dX1 = 1640;
            const dY = (px) => lerp(502, 598, (px - dX0) / (dX1 - dX0));
            // podpěrné piloty k tělesu jezu — páry variované, ledové límce
            for (let i = 0; i < 7; i++) {
              const px = 310 + i * 185 + (bl() - 0.5) * 50;
              if (px > 1440) break;
              const yTop = dY(px) + 8;
              const yBot = lerp(636, 606, (px - 240) / 1320) + 4;
              const wj = 9 + bl() * 6, leanp = (bl() - 0.5) * 9;
              x.fillStyle = i % 2 ? '#2c2114' : '#231a0f';
              fillP(x, [[px - wj / 2, yBot], [px - wj / 2 + leanp, yTop], [px + wj / 2 + leanp, yTop], [px + wj / 2 + 1.5, yBot]], x.fillStyle);
              // šikmá vzpěra u některých pilot
              if (bl() > 0.45) {
                x.strokeStyle = '#241b10'; x.lineWidth = 4.4; x.lineCap = 'round';
                const dxs = bl() > 0.5 ? 44 : -44;
                x.beginPath(); x.moveTo(px + dxs, yBot); x.lineTo(px + leanp, yTop + 10); x.stroke();
              }
              // ledový límec u paty
              x.fillStyle = 'rgba(226,238,246,0.75)';
              x.beginPath(); x.ellipse(px, yBot - 1, wj * 0.9 + 4, 3.4, 0, 0, TAU); x.fill();
            }
            // mostovka — spodní stín + mokrá fošnová plocha
            x.fillStyle = '#191209';
            fillP(x, [[dX0, dY(dX0) + 5], [dX1, dY(dX1) + 5], [dX1, dY(dX1) + 15], [dX0, dY(dX0) + 17]], '#191209');
            x.fillStyle = '#38291a';
            fillP(x, [[dX0, dY(dX0) - 6], [dX1, dY(dX1) - 4], [dX1, dY(dX1) + 6], [dX0, dY(dX0) + 6]], '#38291a');
            // vlhký odlesk na hraně fošen
            x.strokeStyle = 'rgba(150,170,190,0.35)'; x.lineWidth = 2;
            x.beginPath(); x.moveTo(dX0 + 40, dY(dX0 + 40) - 6); x.lineTo(dX1 - 120, dY(dX1 - 120) - 4); x.stroke();
            // spáry fošen — šikmé zářezy v nepravidelném rytmu
            x.strokeStyle = 'rgba(12,8,4,0.6)'; x.lineWidth = 2;
            for (let px = dX0 + 24; px < dX1 - 10; px += 30 + bl() * 30) {
              x.beginPath(); x.moveTo(px, dY(px) - 5); x.lineTo(px - 4, dY(px) + 5); x.stroke();
            }
            // sloupky zábradlí — nepravidelný rozestup, výška, náklon; pár jich chybí
            const posts = [];
            for (let px = dX0 + 16; px < dX1 - 10; px += 84 + bl() * 78) {
              posts.push([px, 30 + bl() * 13, (bl() - 0.5) * 7, bl()]);
            }
            for (const [px, ph, lean, rr3] of posts) {
              const py = dY(px);
              x.fillStyle = rr3 > 0.5 ? '#241b10' : '#2e2214';
              fillP(x, [[px - 3.4, py + 2], [px - 2.6 + lean, py - ph], [px + 3.2 + lean, py - ph], [px + 4, py + 2]], x.fillStyle);
              // sněhová čepička sloupku
              x.fillStyle = '#eef3fa';
              x.beginPath(); x.ellipse(px + lean, py - ph - 1, 4.6, 2.2, lean * 0.04, 0, TAU); x.fill();
            }
            // madlo — prohnuté úseky mezi sloupky, jeden úsek vylomený
            const broken = 3 + ((bl() * (posts.length - 5)) | 0);
            x.strokeStyle = '#241b10'; x.lineWidth = 5; x.lineCap = 'round';
            for (let i = 0; i < posts.length - 1; i++) {
              const [ax, ah, al] = posts[i], [bx2, bh, blq] = posts[i + 1];
              const ay = dY(ax) - ah + al * 0.3, by2 = dY(bx2) - bh + blq * 0.3;
              if (i === broken) { // vylomené madlo visí dolů
                x.beginPath(); x.moveTo(ax + al, ay);
                x.quadraticCurveTo(ax + 30, ay + 26, ax + 44, dY(ax + 44) + 2); x.stroke();
                continue;
              }
              x.beginPath(); x.moveTo(ax + al, ay);
              x.quadraticCurveTo((ax + bx2) / 2, (ay + by2) / 2 + 3.5, bx2 + blq, by2);
              x.stroke();
            }
            // sníh na madle — přerušované čepice sledující diagonálu
            for (let i = 0; i < posts.length - 1; i++) {
              if (i === broken || posts[i][3] < 0.3) continue;
              const [ax, ah] = posts[i], [bx2, bh] = posts[i + 1];
              snowBand(x, [[ax + 8, dY(ax) - ah + 1], [bx2 - 8, dY(bx2) - bh + 1]], 5, 7185 + i, '#f4f8fd', '#b9cbe4');
            }
            // sníh navátý na návětrné (levé) části mostovky
            snowBand(x, [[dX0 + 6, dY(dX0 + 6) - 5], [560, dY(560) - 4]], 8, 7191, '#f4f8fd', '#aabedd');
            snowBand(x, [[840, dY(840) - 4], [1080, dY(1080) - 4]], 6, 7192, '#eef3fa', '#aabedd');
            // vrána na madle u levého konce
            perchBird(x, 250, dY(250) - 36, 0.9, 1, 0, '#20242e');
          }
          // vývařiště s pěnou pod jezem
          x.fillStyle = 'rgba(202,222,230,0.6)';
          x.beginPath();
          x.moveTo(240, 736);
          for (let px = 240; px <= 1560; px += 60) x.lineTo(px, 730 + Math.sin(px * 0.05) * 8 - (px - 240) * 0.025);
          x.lineTo(1560, 760); x.lineTo(240, 790);
          x.closePath(); x.fill();
          // VÍR pod jezem (frag_a) — točité pruhy
          x.save();
          x.translate(900, 772);
          for (let i = 0; i < 4; i++) {
            x.strokeStyle = 'rgba(210,230,238,' + (0.5 - i * 0.09) + ')';
            x.lineWidth = 5 - i;
            x.beginPath();
            x.ellipse(0, 0, 26 + i * 22, 8 + i * 7, 0.15, 0.6 + i * 0.7, 4.4 + i * 0.7);
            x.stroke();
          }
          x.fillStyle = 'rgba(40,60,70,0.55)';
          x.beginPath(); x.ellipse(0, 0, 16, 6, 0.1, 0, TAU); x.fill();
          x.restore();
          // proudnice dolní řeky
          x.strokeStyle = 'rgba(110,138,148,0.5)'; x.lineWidth = 3;
          for (let i = 0; i < 12; i++) {
            const yy = 700 + i * 12 + r() * 8;
            x.beginPath();
            x.moveTo(1560 + r() * 200, yy);
            x.quadraticCurveTo(2000, yy + 6, 2800, yy + r() * 10);
            x.stroke();
          }
          // ledový lem obou břehů dolní řeky
          x.fillStyle = '#bcd4e0';
          x.beginPath();
          x.moveTo(1560, 610);
          for (let px = 1560; px <= SW; px += 90) x.lineTo(px, 608 + Math.sin(px * 0.03) * 7);
          x.lineTo(SW, 640);
          for (let px = SW; px >= 1560; px -= 90) x.lineTo(px, 634 + Math.sin(px * 0.021) * 9);
          x.closePath(); x.fill();
          x.fillStyle = 'rgba(255,255,255,0.55)';
          for (let i = 0; i < 8; i++) {
            x.beginPath();
            const ix = 1600 + i * 150;
            x.moveTo(ix, 614); x.lineTo(ix + 40, 622); x.lineTo(ix + 20, 618);
            x.stroke();
          }
          // led u našeho břehu
          x.fillStyle = '#c4dae6';
          x.beginPath();
          x.moveTo(0, 812);
          for (let px = 0; px <= SW; px += 110) x.lineTo(px, 806 + Math.sin(px * 0.017 + 3) * 10);
          x.lineTo(SW, 856); x.lineTo(0, 856);
          x.closePath(); x.fill();
          // praskliny v ledu
          x.strokeStyle = 'rgba(90,120,140,0.5)'; x.lineWidth = 2;
          for (let i = 0; i < 9; i++) {
            const ix = 100 + i * 300 + r() * 120;
            x.beginPath();
            x.moveTo(ix, 816);
            x.lineTo(ix + 24 + r() * 30, 826 + r() * 14);
            x.lineTo(ix + 60 + r() * 30, 820 + r() * 20);
            x.stroke();
          }

          /* --- CESTA PO LEDU vpravo (exit old_town) --- */
          // pevný ledový most s položenými fošnami
          x.fillStyle = '#cfe1ec';
          fillP(x, [[2600, 604], [2800, 596], [2800, 880], [2570, 866]], '#cfe1ec');
          x.fillStyle = '#8a6a42';
          for (let i = 0; i < 5; i++) {
            fillP(x, [[2620 + i * 8, 640 + i * 52], [2790, 630 + i * 52], [2792, 644 + i * 52], [2624 + i * 8, 656 + i * 52]], i % 2 ? '#8a6a42' : '#79592f');
          }
          // vodicí lano na kůlech
          x.strokeStyle = '#57432a'; x.lineWidth = 7; x.lineCap = 'round';
          x.beginPath(); x.moveTo(2612, 700); x.lineTo(2606, 620); x.stroke();
          x.beginPath(); x.moveTo(2700, 840); x.lineTo(2692, 750); x.stroke();
          x.strokeStyle = 'rgba(122,96,60,0.9)'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(2606, 626); x.quadraticCurveTo(2650, 700, 2694, 756); x.stroke();

          /* --- břeh — zasněžená louka s pěšinou, 3 hodnotové zóny --- */
          x.fillStyle = lg(x, 0, 830, 0, H, [[0, '#eef3fa'], [0.35, '#dbe6f3'], [0.7, '#c6d4ea'], [1, '#aabcdb']]);
          x.beginPath();
          x.moveTo(0, 856);
          for (let px = 0; px <= SW; px += 100) x.lineTo(px, 848 + Math.sin(px * 0.008 + 1) * 12);
          x.lineTo(SW, H); x.lineTo(0, H);
          x.closePath(); x.fill();
          // teplý přísvit mlžného slunce zprava
          x.fillStyle = lg(x, 1600, 0, 2800, 0, [[0, 'rgba(242,230,200,0)'], [1, 'rgba(242,230,200,0.18)']]);
          x.fillRect(1600, 850, 1200, H - 850);
          // studený stín od uličky vlevo
          x.fillStyle = lg(x, 0, 0, 700, 0, [[0, 'rgba(105,120,175,0.18)'], [1, 'rgba(105,120,175,0)']]);
          x.fillRect(0, 850, 700, H - 850);
          scumble(x, 0, 850, SW, 230, 7101, 640, ['#e8eef8', '#cdd9ec', '#f4f8fd', '#b6c8e4', '#dfe2d8'], 3, 12, 0.45);
          trodden(x, 200, 940, 1350, 950, 70, 7102);
          trodden(x, 1850, 950, 2650, 900, 70, 7103);
          // zmrzlá tráva propíchává sníh
          x.strokeStyle = 'rgba(168,146,94,0.75)'; x.lineWidth = 2;
          for (let i = 0; i < 70; i++) {
            const gx = r() * SW, gy = 880 + r() * 170;
            x.beginPath(); x.moveTo(gx, gy);
            x.quadraticCurveTo(gx + 4, gy - 14, gx + 9 * (r() - 0.5), gy - 20 - r() * 10);
            x.stroke();
          }

          /* --- ulička k náměstí (vlevo, exit square) --- */
          x.fillStyle = '#8c7a5e';
          x.fillRect(0, 520, 150, 400);
          x.fillStyle = '#6e5e46';
          x.fillRect(140, 520, 22, 400);
          fillP(x, [[0, 520], [162, 520], [150, 470], [0, 452]], '#5c4c38');
          snowBand(x, [[0, 516], [158, 516]], 12, 7111, '#f4f8fd', '#a9bedd');
          // vývěsní štít s rybou (u cesty do města)
          x.strokeStyle = '#3a2c1a'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(150, 600); x.lineTo(206, 616); x.stroke();
          x.fillStyle = '#7e949e';
          x.save();
          x.translate(206, 648); x.rotate(0.08);
          x.beginPath();
          x.moveTo(-30, 0); x.quadraticCurveTo(0, -16, 26, 0); x.quadraticCurveTo(0, 16, -30, 0);
          x.closePath(); x.fill();
          fillP(x, [[24, 0], [40, -10], [40, 10]], '#7e949e');
          x.fillStyle = '#1c2430';
          x.beginPath(); x.arc(-16, -2, 2.4, 0, TAU); x.fill();
          x.restore();

          /* --- Vávrovo ohniště --- */
          x.save();
          x.translate(2280, 906);
          contactShadow(x, 0, 12, 85, 17, 1);
          // špalek a deka mají vlastní dotyk se sněhem
          contactShadow(x, -98, 16, 34, 8, 0.8);
          // roztátý kruh kolem ohně
          x.fillStyle = '#7a6a52';
          x.beginPath(); x.ellipse(0, 4, 58, 15, 0, 0, TAU); x.fill();
          // kameny dokola
          for (let i = 0; i < 9; i++) {
            const a = i / 9 * TAU;
            x.fillStyle = i % 2 ? '#8a7a5c' : '#6e6048';
            x.beginPath();
            x.ellipse(Math.cos(a) * 52, 6 + Math.sin(a) * 13, 10, 7, a, 0, TAU);
            x.fill();
          }
          // polena
          x.strokeStyle = '#4e3018'; x.lineWidth = 10; x.lineCap = 'round';
          x.beginPath(); x.moveTo(-26, 0); x.lineTo(24, -8); x.stroke();
          x.beginPath(); x.moveTo(-18, -8); x.lineTo(20, 2); x.stroke();
          // kotlík na trojnožce
          x.strokeStyle = '#33241a'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(-34, -56); x.lineTo(0, -6); x.stroke();
          x.beginPath(); x.moveTo(34, -56); x.lineTo(6, -6); x.stroke();
          x.beginPath(); x.moveTo(0, -70); x.lineTo(-4, -6); x.stroke();
          x.fillStyle = '#2c2c34';
          x.beginPath(); x.arc(0, -34, 17, 0.1, Math.PI - 0.1); x.closePath(); x.fill();
          x.beginPath(); x.ellipse(0, -34, 17, 5, 0, 0, TAU); x.fill();
          // špalek na sezení + Vávrova deka
          x.fillStyle = '#6e5138';
          x.fillRect(-120, -28, 44, 40);
          x.beginPath(); x.ellipse(-98, -28, 22, 8, 0, 0, TAU); x.fill();
          x.fillStyle = '#7a3a2e';
          fillP(x, [[70, -18], [130, -26], [136, 4], [76, 12]], '#7a3a2e');
          x.restore();

          /* --- rákosí s hnízdem husy Markyty --- */
          const reedPatch = (cx, cy, n, seed, sc) => {
            const rr2 = mulberry(seed);
            for (let i = 0; i < n; i++) {
              const bx = cx + (rr2() - 0.5) * 160 * sc;
              const by = cy + (rr2() - 0.5) * 30;
              const hh = (70 + rr2() * 70) * sc;
              const lean = (rr2() - 0.5) * 0.5;
              x.strokeStyle = rr2() > 0.5 ? '#a8925e' : '#8a7a4e';
              x.lineWidth = 3;
              x.beginPath();
              x.moveTo(bx, by);
              x.quadraticCurveTo(bx + lean * 20, by - hh * 0.6, bx + lean * 44, by - hh);
              x.stroke();
              if (rr2() > 0.55) { // palice orobince
                x.fillStyle = '#6a5230';
                x.save();
                x.translate(bx + lean * 44, by - hh);
                x.rotate(lean * 0.5);
                x.fillRect(-3.4, -20, 7, 22);
                x.fillStyle = '#eef3fa';
                x.fillRect(-3.4, -22, 7, 5);
                x.restore();
              }
            }
          };
          reedPatch(2020, 880, 46, 7121, 1);
          reedPatch(2180, 872, 34, 7122, 0.9);
          // hnízdo na trsu
          x.save();
          x.translate(2080, 884);
          contactShadow(x, 0, 16, 58, 12, 0.9);
          x.fillStyle = '#8a7148';
          x.beginPath(); x.ellipse(0, 0, 54, 20, 0, 0, TAU); x.fill();
          x.strokeStyle = '#6a5230'; x.lineWidth = 3;
          for (let i = 0; i < 9; i++) {
            x.beginPath();
            x.ellipse(0, 0, 50 - i * 3, 18 - i * 1.4, i * 0.3, 0.4, 2.8);
            x.stroke();
          }
          x.fillStyle = '#57432a';
          x.beginPath(); x.ellipse(0, -2, 30, 10, 0, 0, TAU); x.fill();
          // roh pergamenu + brk se kreslí v dynamic() — musí zmizet po
          // _nest_looted a statická vrstva se prerenderuje jen jednou
          snowBand(x, [[-50, -14], [50, -14]], 6, 7123, '#f4f8fd', '#c3d2ea');
          x.restore();

          /* --- převrácená pramice (walkBehind popředí) --- */
          x.save();
          x.translate(1595, 986);
          x.rotate(-0.015);
          contactShadow(x, 0, 62, 245, 27, 1.3);
          // trup dnem vzhůru
          const bgrad = lg(x, 0, -60, 0, 70, [[0, '#7c6142'], [0.5, '#6b5138'], [1, '#4a3524']]);
          x.fillStyle = bgrad;
          x.beginPath();
          x.moveTo(-238, 42);
          x.quadraticCurveTo(-250, -6, -190, -32);
          x.quadraticCurveTo(-60, -62, 90, -56);
          x.quadraticCurveTo(210, -46, 240, 6);
          x.quadraticCurveTo(246, 34, 228, 46);
          x.closePath(); x.fill();
          // kýl
          x.strokeStyle = '#33241a'; x.lineWidth = 8;
          x.beginPath();
          x.moveTo(-226, -14);
          x.quadraticCurveTo(-40, -66, 200, -34);
          x.stroke();
          // spáry prken
          x.strokeStyle = 'rgba(30,18,8,0.5)'; x.lineWidth = 3;
          for (let i = 0; i < 3; i++) {
            x.beginPath();
            x.moveTo(-232 + i * 8, 20 - i * 18);
            x.quadraticCurveTo(-20, -8 - i * 20, 234 - i * 6, 24 - i * 14);
            x.stroke();
          }
          // záplata
          x.fillStyle = '#8a7a5c';
          x.save(); x.translate(60, -30); x.rotate(0.12);
          x.fillRect(-24, -14, 48, 28);
          x.strokeStyle = '#241a10'; x.lineWidth = 2; x.strokeRect(-24, -14, 48, 28);
          x.fillStyle = '#241a10';
          x.beginPath(); x.arc(-18, -8, 1.8, 0, TAU); x.arc(18, -8, 1.8, 0, TAU);
          x.arc(-18, 8, 1.8, 0, TAU); x.arc(18, 8, 1.8, 0, TAU); x.fill();
          x.restore();
          snowBand(x, [[-220, -26], [-40, -52], [150, -48], [232, -6]], 14, 7131, '#f4f8fd', '#b9cbe4');
          // vesla opřená o bok
          x.strokeStyle = '#6e5138'; x.lineWidth = 7;
          x.beginPath(); x.moveTo(-160, 40); x.lineTo(-60, -110); x.stroke();
          x.fillStyle = '#6e5138';
          x.beginPath(); x.ellipse(-56, -122, 10, 22, 0.5, 0, TAU); x.fill();
          x.restore();

          /* --- balvan vlevo (walkBehind) --- */
          contactShadow(x, 310, 1072, 110, 16, 1.1);
          x.fillStyle = lg(x, 0, 1000, 0, 1080, [[0, '#8a8a92'], [1, '#5a5a64']]);
          x.beginPath();
          x.moveTo(214, 1080);
          x.quadraticCurveTo(212, 1016, 268, 1004);
          x.quadraticCurveTo(330, 996, 380, 1030);
          x.quadraticCurveTo(410, 1052, 406, 1080);
          x.closePath(); x.fill();
          snowBand(x, [[228, 1014], [268, 1002], [340, 1006], [388, 1034]], 12, 7141, '#f8fbff', '#b6c8e4');
          scumble(x, 220, 1010, 180, 66, 7142, 30, ['#9a9aa4', '#6a6a74'], 4, 12, 0.4);

          /* --- přední trs rákosí vpravo (walkBehind) --- */
          contactShadow(x, 2560, 1056, 100, 14, 0.7);
          reedPatch(2560, 1046, 40, 7151, 1.5);
          snowBand(x, [[2480, 1050], [2660, 1050]], 10, 7152, '#f4f8fd', '#b9cbe4');
          // globální malířské zrno
          grain(x, SW, H, 0.05);
        }
      },
      { // POPŘEDÍ (parallax > 1) — rákosí, keře a kotvicí kůl s lanem:
        // temnější hodnoty, kreslí se PŘED postavou (walkBehind přes vše)
        parallax: 1.12,
        walkBehind: [
          [[2330, 1080], [2350, 800], [2600, 750], [2790, 830], [2800, 1080]],
          [[420, 1080], [430, 890], [640, 890], [700, 1080]],
          [[0, 1080], [0, 950], [110, 928], [250, 968], [270, 1080]],
          [[1150, 1080], [1170, 870], [1360, 866], [1400, 1080]]
        ],
        paint(x) {
          const r = mulberry(7200);
          const fgReed = (cx, baseY, n, seed, sc) => {
            const rr2 = mulberry(seed);
            for (let i = 0; i < n; i++) {
              const bx = cx + (rr2() - 0.5) * 200 * sc;
              const by = baseY + (rr2() - 0.5) * 24;
              const hh = (100 + rr2() * 90) * sc;
              const lean = (rr2() - 0.5) * 0.55;
              x.strokeStyle = rr2() > 0.5 ? '#5c4c2c' : '#48391e';
              x.lineWidth = 4 + rr2() * 2.4;
              x.beginPath();
              x.moveTo(bx, by);
              x.quadraticCurveTo(bx + lean * 30, by - hh * 0.6, bx + lean * 70, by - hh);
              x.stroke();
              if (rr2() > 0.5) { // palice orobince se sněhem
                x.save();
                x.translate(bx + lean * 70, by - hh);
                x.rotate(lean * 0.5);
                x.fillStyle = '#3e2e16';
                x.fillRect(-5, -30, 10, 32);
                x.fillStyle = '#eef3fa';
                x.beginPath(); x.ellipse(0, -30, 6.4, 3.4, 0, 0, TAU); x.fill();
                x.restore();
              }
            }
          };
          /* keř vlevo dole — nepravidelné chuchvalce, křivé pruty, sníh v ťupkách */
          for (let i = 0; i < 8; i++) {
            const bx = 40 + r() * 180, by = 1006 + r() * 60;
            x.fillStyle = i % 2 ? '#3a382f' : '#2f2d26';
            x.beginPath(); x.ellipse(bx, by, 34 + r() * 44, 22 + r() * 18, (r() - 0.5) * 0.6, 0, TAU); x.fill();
          }
          x.strokeStyle = '#262419'; x.lineWidth = 3;
          for (let i = 0; i < 11; i++) {
            const bx = 30 + r() * 190;
            const lean2 = (r() - 0.5) * 1.1;
            x.beginPath(); x.moveTo(bx, 1064);
            x.quadraticCurveTo(bx + lean2 * 24, 1010 - r() * 30, bx + lean2 * 64, 962 - r() * 46);
            x.stroke();
          }
          x.fillStyle = '#f4f8fd';
          for (let i = 0; i < 16; i++) {
            x.beginPath();
            x.ellipse(24 + r() * 200, 986 + r() * 56, 8 + r() * 16, 3.4 + r() * 3.4, (r() - 0.5) * 0.5, 0, TAU);
            x.fill();
          }
          /* kotvicí kůl s lanem (u pramice) */
          x.save();
          x.translate(560, 1046);
          x.rotate(-0.06);
          x.fillStyle = '#2c2114';
          fillP(x, [[-13, 0], [-9, -138], [9, -138], [13, 0]], '#2c2114');
          x.fillStyle = '#42311c';
          fillP(x, [[2, 0], [4, -136], [9, -136], [13, 0]], '#42311c');
          // omotané lano
          x.strokeStyle = '#6e5a36'; x.lineWidth = 5;
          for (let i = 0; i < 4; i++) {
            x.beginPath(); x.ellipse(0, -96 + i * 8, 12.4, 4.4, 0, 0, TAU); x.stroke();
          }
          // sněhová čepice na hlavě kůlu
          x.fillStyle = '#f4f8fd';
          x.beginPath(); x.ellipse(0, -140, 12, 5.4, -0.05, 0, TAU); x.fill();
          x.restore();
          // lano vede z kůlu dolů z obrazu (k pramici)
          x.strokeStyle = '#5e4c2e'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(568, 958); x.quadraticCurveTo(640, 1020, 700, 1090); x.stroke();
          /* trs rákosí uprostřed dole — jen špičky, rám spodní hrany */
          fgReed(1260, 1120, 26, 7205, 1.2);
          /* velký rákosový trs vpravo — hlavní kulisa popředí */
          x.fillStyle = 'rgba(40,44,42,0.85)';
          x.beginPath(); x.ellipse(2560, 1072, 210, 54, 0, Math.PI, TAU); x.fill();
          fgReed(2470, 1088, 40, 7206, 1.7);
          fgReed(2660, 1092, 34, 7207, 1.5);
          snowBand(x, [[2372, 1044], [2470, 1022], [2600, 1016], [2724, 1032], [2790, 1054]], 14, 7208, '#f4f8fd', '#a9bedd');
          grain(x, SW, H, 0.04);
        }
      }
    ],
    dynamic(ctx, t, camX) {
      const st = BNJ.state;
      /* --- horní hladina (vrstva 0.45): sluneční třpyt --- */
      ctx.save();
      ctx.translate(camX * (1 - 0.45), 0);
      sparkleDyn(ctx, t, 7301, 22, 300, 500, 2200, 90, '250,246,230');
      // kouř z mlýna — živý sloup nad statickou stopou
      smokeDyn(ctx, t, 383, 292, 17, 1.5, '206,214,226', 0.16, 26);
      // pomalé vlnky
      ctx.strokeStyle = 'rgba(230,240,244,0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const yy = 510 + i * 15;
        const off = (t * 12 + i * 60) % 260;
        for (let px = -260 + off; px < SW; px += 260) {
          ctx.beginPath();
          ctx.moveTo(px, yy);
          ctx.quadraticCurveTo(px + 34, yy - 3, px + 68, yy);
          ctx.stroke();
        }
      }
      ctx.restore();

      /* --- přepad jezu: padající voda --- */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(240, 646); ctx.lineTo(1560, 616); ctx.lineTo(1560, 706); ctx.lineTo(240, 742);
      ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(228,240,246,0.36)';
      const rw = mulberry(7311);
      for (let i = 0; i < 46; i++) {
        const fx = 250 + rw() * 1300;
        const sp = 180 + rw() * 120;
        const ph = rw();
        const fy0 = lerp(660, 630, (fx - 240) / 1320);
        const fall = ((t * sp / 80 + ph) % 1);
        ctx.globalAlpha = 0.18 + 0.16 * Math.sin(fall * Math.PI);
        ctx.fillRect(fx, fy0 + fall * 74 - 8, 3 + rw() * 4, 14 + rw() * 12);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      // pěna pod jezem — nadskakující obláčky (tlumené, ať nesvítí víc než sníh)
      for (let i = 0; i < 16; i++) {
        const fx = 260 + i * 82;
        const fy = lerp(742, 706, (fx - 240) / 1320);
        const b = Math.sin(t * 3.1 + i * 1.7) * 4;
        ctx.fillStyle = 'rgba(226,238,244,' + (0.26 + 0.12 * Math.sin(t * 2.4 + i)) + ')';
        ctx.beginPath(); ctx.ellipse(fx, fy + b, 26, 9, 0, 0, TAU); ctx.fill();
      }

      /* --- vír: rotující šmouhy + kroužící útržek listu (frag_a) --- */
      {
        const cx = 900, cy = 772;
        for (let i = 0; i < 3; i++) {
          const a0 = t * (1.2 + i * 0.3) + i * 2.1;
          ctx.strokeStyle = 'rgba(215,235,242,' + (0.4 - i * 0.1) + ')';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 30 + i * 24, 10 + i * 8, 0.12, a0, a0 + 2.2);
          ctx.stroke();
        }
        const fragGone = st.inventory.indexOf('frag_a') >= 0 || st.flags.letter_read || st.flags.finale_started;
        if (!fragGone) {
          const a = -t * 1.35;
          const px = cx + Math.cos(a) * 52, py = cy + Math.sin(a) * 17;
          // kruhy na vodě kolem útržku — vedou oko k němu
          ctx.strokeStyle = 'rgba(235,246,250,' + (0.3 + 0.18 * Math.sin(t * 2.6)) + ')';
          ctx.lineWidth = 2;
          const rippleR = 1 + ((t * 0.8) % 1);
          ctx.beginPath(); ctx.ellipse(px, py, 22 * rippleR, 8 * rippleR, 0.1, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(px, py, 34, 12, 0.1, 0, TAU); ctx.stroke();
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(1.5, 1.5); // zvětšený útržek (čitelnost na dálku)
          ctx.rotate(Math.sin(t * 2) * 0.5 + a);
          ctx.fillStyle = '#f2e8ca';
          ctx.beginPath();
          ctx.moveTo(-11, -7); ctx.lineTo(10, -9); ctx.lineTo(13, 6); ctx.lineTo(-8, 9);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(122,92,52,0.65)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(7, -4); ctx.moveTo(-5, 1); ctx.lineTo(8, 0);
          ctx.stroke();
          ctx.restore();
          // jiskra na útržku — bliká, přitahuje pozornost
          const gl = Math.sin(t * 3.4);
          if (gl > 0.3) {
            ctx.globalAlpha = (gl - 0.3) * 1.2;
            ctx.fillStyle = '#fff8e0';
            ctx.fillRect(px - 6, py - 1.2, 12, 2.4);
            ctx.fillRect(px - 1.2, py - 6, 2.4, 12);
            ctx.globalAlpha = 1;
          }
        }
      }

      /* --- proud dolní řeky: šmouhy + kry --- */
      ctx.save();
      ctx.beginPath();
      ctx.rect(1560, 640, SW - 1560, 180);
      ctx.clip();
      for (let i = 0; i < 14; i++) {
        const yy = 660 + i * 11;
        const sp = 60 + i * 6;
        const off = (t * sp) % 400;
        ctx.strokeStyle = 'rgba(158,186,196,' + (0.2 + (i % 3) * 0.08) + ')';
        ctx.lineWidth = 2.4;
        for (let px = 1400 + off - 400; px < SW; px += 400) {
          ctx.beginPath();
          ctx.moveTo(px, yy);
          ctx.quadraticCurveTo(px + 60, yy - 2.5, px + 120, yy);
          ctx.stroke();
        }
      }
      // plovoucí kry
      for (let i = 0; i < 4; i++) {
        const sp = 46 + i * 9;
        const span = SW - 1400;
        const fx = 1500 + ((t * sp + i * 420) % span);
        const fy = 680 + (i % 3) * 34;
        const rot = t * (0.2 + i * 0.06) + i;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(rot * 0.3);
        ctx.fillStyle = 'rgba(216,232,242,0.9)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30 + i * 8, 10 + i * 2.4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.ellipse(-6, -2, 16 + i * 4, 5, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      sparkleDyn(ctx, t, 7302, 16, 1600, 650, 1150, 150, '235,246,252');

      /* --- kry kroužící ve víru --- */
      for (let i = 0; i < 2; i++) {
        const a = -t * (0.8 + i * 0.25) + i * 2.6;
        const px = 900 + Math.cos(a) * (78 + i * 20), py = 772 + Math.sin(a) * (24 + i * 6);
        ctx.save();
        ctx.translate(px, py); ctx.rotate(a + t * 0.5);
        ctx.fillStyle = 'rgba(216,232,242,0.85)';
        ctx.beginPath(); ctx.ellipse(0, 0, 18, 7, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }

      /* --- pergamen (frag_b) + brk v hnízdě — mizí po _nest_looted;
             kreslí se PŘED husou, takže sedící Markyta je zakrývá --- */
      if (!st.flags._nest_looted) {
        ctx.save();
        ctx.translate(2080, 884);
        ctx.fillStyle = '#e8dcbe';
        ctx.save(); ctx.rotate(-0.3); ctx.fillRect(8, -18, 26, 18); ctx.restore();
        ctx.strokeStyle = '#f0ead8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-20, -8); ctx.quadraticCurveTo(-34, -26, -30, -38); ctx.stroke();
        ctx.restore();
      }

      /* --- husa Markyta --- */
      {
        const lured = !!st.flags.goose_lured;
        // nenalákaná Markyta SEDÍ NA HNÍZDĚ (2080,884) — dřív se kreslila
        // o ~105 px vedle v rákosí, což popíralo dialogy („sedí na hnízdě
        // jako celnice“, „slézá z hnízda!“)
        const gx = lured ? 2320 : 2080, gy = lured ? 975 : 884;
        const cyc = t % 11;
        const preen = !lured && cyc < 7;
        const peck = lured && (t % 4) < 0.8;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(-1, 1); // kouká doleva
        // tělo
        const bob = Math.sin(t * 2.2) * 1.5;
        ctx.fillStyle = '#f2f2ec';
        ctx.beginPath(); ctx.ellipse(0, -18 + bob * 0.4, 34, 20, -0.06, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d9d9d0';
        ctx.beginPath(); ctx.ellipse(-6, -10 + bob * 0.4, 24, 12, -0.1, 0, TAU); ctx.fill();
        // ocásek
        fillP(ctx, [[-32, -26 + bob * 0.4], [-46, -34], [-30, -16]], '#e8e8e0');
        // krk + hlava
        let hx2, hy2, ha;
        if (preen) {
          const p = 0.5 + 0.5 * Math.sin(cyc * 2.6);
          hx2 = -14 - p * 10; hy2 = -30 - p * 4; ha = 2.4;
        } else if (peck) {
          hx2 = 26; hy2 = -6; ha = 1.2;
        } else {
          hx2 = 22 + Math.sin(t * 1.3) * 2; hy2 = -62 + bob; ha = 0.15 + Math.sin(t * 0.9) * 0.1;
        }
        ctx.strokeStyle = '#f2f2ec'; ctx.lineWidth = 11; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(14, -26 + bob * 0.4);
        ctx.quadraticCurveTo(24, -44, hx2, hy2);
        ctx.stroke();
        // hlava
        ctx.save();
        ctx.translate(hx2, hy2);
        ctx.rotate(ha);
        ctx.fillStyle = '#f2f2ec';
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8933a';
        fillP(ctx, [[8, -2], [24, 1], [8, 5]], '#e8933a');
        ctx.fillStyle = '#241812';
        ctx.beginPath(); ctx.arc(2, -2, 2, 0, TAU); ctx.fill();
        ctx.restore();
        // nožky — jen když zobe na břehu; v hnízdě sedí a nohy má schované
        if (lured) {
          ctx.strokeStyle = '#e8933a'; ctx.lineWidth = 3.4;
          ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6, 12); ctx.moveTo(8, 0); ctx.lineTo(8, 12); ctx.stroke();
        }
        ctx.restore();
      }

      /* --- Vávrovo ohniště: oheň + kouř + pára z kotlíku --- */
      fireDyn(ctx, t, 2280, 906, 0.8, 6.4);
      smokeDyn(ctx, t, 2280, 866, 11, 1.2, '200,206,220', 0.2, 20);
      mistPuff(ctx, 2280 + Math.sin(t * 1.4) * 4, 858 - ((t * 0.4) % 1) * 30, 12, 8, '230,238,248', 0.18);

      /* --- mlha nad vodou (tři pásy) --- */
      for (let i = 0; i < 3; i++) {
        const sp = 9 + i * 7, alpha = 0.10 + i * 0.05;
        const yy = 590 + i * 90;
        const n = 6;
        for (let k = 0; k < n; k++) {
          const span = SW + 900;
          const mx = ((k * span / n + t * sp + i * 300) % span) - 450;
          const my = yy + Math.sin(t * 0.16 + k * 1.9 + i * 3) * 16;
          mistPuff(ctx, mx, my, 260 + k * 40, 40 + i * 12, '232,238,242', alpha);
        }
      }

      /* --- sníh: řídký globálně + hustší šikmý poryv přeháňky --- */
      snowDyn(ctx, t, SW, 7401, 60, 8, '#eef3fa');
      snowDyn(ctx, t, SW, 7402, 70, 26, 'rgba(238,243,250,0.7)');
    },
    overlayDynamic(ctx, t, camX) {
      ctx.save();
      ctx.translate(camX || 0, 0); // screen-space efekty
      // přízemní pás mlhy úplně vpředu
      for (let k = 0; k < 5; k++) {
        const mx = ((k * 560 + t * 13) % (W + 1000)) - 500;
        mistPuff(ctx, mx, 1040 + Math.sin(t * 0.2 + k * 2.2) * 14, 340, 50, '236,242,246', 0.10);
      }
      // studená vinětace
      const vg = ctx.createRadialGradient(W / 2, H * 0.46, 420, W / 2, H * 0.5, 1300);
      vg.addColorStop(0, 'rgba(20,30,44,0)');
      vg.addColorStop(1, 'rgba(20,30,44,0.30)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
    walkArea: [[170, 856], [2540, 856], [2740, 880], [2740, 940], [2600, 1035], [200, 1035], [140, 940]],
    scaleAt(y) { return clamp(0.5 + 0.56 * (y - 820) / 220, 0.44, 1.08); },
    exits: [
      { to: 'square', at: [140, 880], spawn: [2380, 930], label: { cz: 'Ulička na náměstí', en: 'Lane to the square' } },
      { to: 'old_town', at: [2720, 900], spawn: [280, 930], label: { cz: 'Po ledu do Starých Benátek', en: 'Across the ice to Old Benátky' } }
    ],
    actors: [{ id: 'prevoznik', x: 2172, y: 952, dir: 1 }]
  });
})();

/* =========================================================================
   SCÉNA: square — náměstí Nové Benátky, jasné dopoledne (2600)
   ========================================================================= */
(function () {
  const SW = 2600;
  // komíny domů (kouř dynamicky)
  const CHIM = [[560, 396], [1150, 380], [1872, 352], [2350, 406]];

  BNJ.registerScene({
    id: 'square',
    width: SW,
    name: { cz: 'Náměstí', en: 'The Town Square' },
    spawn: [2320, 930],
    layers: [
      { // jasné zimní nebe
        parallax: 0.25,
        paint(x) {
          // nebe — 3 zóny: sytá modř v zenitu, bledší střed, perleťový obzor
          x.fillStyle = lg(x, 0, 0, 0, 900, [[0, '#6aa2d0'], [0.35, '#9ec4e0'], [0.68, '#c6dcee'], [0.88, '#e2ecf2'], [1, '#ecf0ea']]);
          x.fillRect(0, 0, SW, 900);
          x.fillStyle = '#ecf0ea'; x.fillRect(0, 880, SW, 220);
          // slunce — měkký kotouč ze soustředných alf, žádný tvrdý disk
          glow(x, 1750, 200, 300, '255,252,238', 0.5);
          glow(x, 1750, 200, 150, '255,250,230', 0.45);
          x.fillStyle = 'rgba(255,251,232,0.45)';
          x.beginPath(); x.arc(1750, 200, 74, 0, TAU); x.fill();
          x.fillStyle = 'rgba(255,252,238,0.75)';
          x.beginPath(); x.arc(1750, 200, 52, 0, TAU); x.fill();
          x.fillStyle = 'rgba(255,254,246,0.9)';
          x.beginPath(); x.arc(1750, 200, 38, 0, TAU); x.fill();
          // dvoutónové mraky, osvětlené směrem od slunce
          cloud2(x, 400, 180, 1.6, '#ffffff', '#c2d4e4', 0.8, 81, 1);
          cloud2(x, 1150, 260, 1.2, '#fbfdff', '#c8d8e6', 0.7, 82, 1);
          cloud2(x, 2250, 150, 1.9, '#ffffff', '#c6d6e4', 0.75, 83, -1);
          // mrak křižující slunce — prosvícený okraj
          softCloud(x, 1720, 250, 1.0, '255,244,214', 0.5, 84);
          cloud2(x, 1690, 258, 0.9, '#ffeecb', '#d8c9a8', 0.5, 85, 0);
          grain(x, SW, 900, 0.035);
        }
      },
      { // zámek na návrší + vzdálené střechy za frontou domů
        parallax: 0.55,
        paint(x) {
          // návrší se zámkem vlevo (odkud jsme přišli)
          x.fillStyle = '#b4c4d4';
          x.beginPath();
          x.moveTo(0, 560);
          x.quadraticCurveTo(260, 380, 620, 400);
          x.quadraticCurveTo(800, 430, 900, 560);
          x.lineTo(0, 560);
          x.closePath(); x.fill();
          snowBand(x, [[40, 470], [300, 402], [610, 402], [860, 520]], 20, 8001, '#eef5fb', '#b9cbe4');
          // silueta zámku s věží (atmosférická perspektiva)
          x.fillStyle = '#93a6bc';
          x.fillRect(240, 290, 300, 120);
          fillP(x, [[228, 290], [270, 250], [520, 250], [552, 290]], '#93a6bc');
          x.fillRect(430, 180, 66, 230);
          x.beginPath();
          x.moveTo(424, 180);
          x.bezierCurveTo(416, 148, 442, 142, 463, 124);
          x.bezierCurveTo(484, 142, 510, 148, 502, 180);
          x.closePath(); x.fill();
          snowBand(x, [[236, 286], [274, 254], [516, 254], [548, 286]], 8, 8002, '#eef5fb', '#a9bedd');
          x.fillStyle = 'rgba(255,240,210,0.55)';
          x.fillRect(300, 320, 12, 18); x.fillRect(380, 320, 12, 18);
          // NEJVZDÁLENĚJŠÍ řada štítů — skoro barva nebe (atmosférická perspektiva)
          const r0 = mulberry(8004);
          for (let i = 0; i < 12; i++) {
            const hx = 820 + i * 155 + r0() * 50;
            const hh2 = 430 + r0() * 36;
            fillP(x, [[hx, 545], [hx + 52, hh2], [hx + 112, 545]], 'rgba(178,192,210,0.55)');
          }
          // vzdálené štíty za frontou — variované výšky, sklony i komíny
          const r = mulberry(8003);
          for (let i = 0; i < 10; i++) {
            const hx = 900 + i * 180 + r() * 40;
            const py = 455 + r() * 55;
            const apex = 46 + r() * 28;                 // vrchol mimo střed
            fillP(x, [[hx, 560], [hx + apex, py], [hx + 130, 560]], 'rgba(150,166,188,0.85)');
            snowBand(x, [[hx + 6, 552], [hx + apex, py + 8], [hx + 124, 552]], 9, 8010 + i, '#eef5fb', '#a9bedd');
            if (r() > 0.55) {                            // komínek
              x.fillStyle = 'rgba(150,166,188,0.85)';
              x.fillRect(hx + apex + 18, py + 14, 10, 26);
            }
          }
          // mrazivý opar nad střechami — sjednocuje dálku s nebem
          x.fillStyle = lg(x, 0, 440, 0, 585, [[0, 'rgba(226,236,244,0)'], [0.7, 'rgba(226,236,244,0.34)'], [1, 'rgba(226,236,244,0.55)']]);
          x.fillRect(0, 440, SW, 145);
        }
      },
      { // 1.0 — fronta domů s podloubím, kostel, stánek, kašna, pranýř, koš
        parallax: 1,
        walkBehind: [
          // pult stánku (popředí)
          [[924, 1080], [934, 966], [1330, 966], [1342, 1080]],
          // železný koš s ohněm
          [[646, 1080], [658, 986], [756, 986], [768, 1080]],
          // závěj vpravo dole
          [[2380, 1080], [2410, 1030], [2600, 1042], [2600, 1080]]
        ],
        paint(x) {
          const r = mulberry(8100);
          /* --- sněhová plocha náměstí — 3 hodnotové zóny --- */
          x.fillStyle = lg(x, 0, 790, 0, H, [[0, '#ccd9ec'], [0.28, '#eef3fa'], [0.6, '#dce6f4'], [1, '#b4c4e2']]);
          x.fillRect(0, 800, SW, H - 800);
          // sluneční teplá zóna pod sluncem (vpravo od středu)
          x.fillStyle = lg(x, 1200, 0, 2200, 0, [[0, 'rgba(255,244,214,0)'], [0.5, 'rgba(255,244,214,0.16)'], [1, 'rgba(255,244,214,0)']]);
          x.fillRect(1200, 800, 1000, H - 800);
          scumble(x, 0, 800, SW, 280, 8101, 680, ['#e4ecf7', '#c9d6ec', '#f6f9fd', '#b2c4e2', '#ecdfc8'], 3, 12, 0.45);
          // rozšlapaný trh — DIAGONÁLNÍ tok: od brány zámku šikmo ke stánku
          // a dál vzhůru k uličce k řece (lomená úhlopříčka přes náměstí)
          trodden(x, 250, 866, 1150, 1004, 210, 8102, 'rgba(150,168,205,0.45)');
          trodden(x, 1150, 1004, 2460, 904, 180, 8103, 'rgba(150,168,205,0.42)');
          trodden(x, 700, 992, 1640, 952, 80, 8104);
          // koleje od povozu
          x.strokeStyle = 'rgba(140,160,200,0.6)'; x.lineWidth = 6;
          x.beginPath(); x.moveTo(240, 870); x.quadraticCurveTo(1300, 980, 2560, 900); x.stroke();
          x.beginPath(); x.moveTo(236, 892); x.quadraticCurveTo(1300, 1004, 2556, 922); x.stroke();
          // modré stíny domů přes náměstí — zesílené, dvě vrstvy (slunce vpravo nahoře)
          fillP(x, [[300, 810], [900, 810], [700, 1080], [0, 1080], [0, 900]], 'rgba(112,132,196,0.30)');
          fillP(x, [[280, 810], [980, 810], [820, 1080], [0, 1080], [0, 880]], 'rgba(112,132,196,0.12)');
          // vržené stíny objektů náměstí — doleva dolů od slunce
          castShadow(x, 1650, 935, 270, -300, 130, 0.22, '95,105,175');
          castShadow(x, 2100, 895, 130, -230, 120, 0.20, '95,105,175');
          castShadow(x, 1128, 985, 400, -260, 90, 0.16, '95,105,175');
          castShadow(x, 706, 1062, 110, -180, 16, 0.16, '95,105,175');
          castShadow(x, 420, 885, 150, -170, 100, 0.18, '95,105,175');
          castShadow(x, 1650, 840, 220, -340, 200, 0.10, '95,105,175'); // věž kostela — dlouhý měkký

          /* --- fronta měšťanských domů s podloubím ---
             Asymetrická kompozice: okapová linie KLESÁ diagonálně doprava
             až k nízké roubence, pak nástup kostel → RADNICE (dominanta
             mimo střed s věžičkou). Žádné dva domy, oblouky ani okna
             nejsou klony: variují okapy, štíty, okenice, patky pilířů. */
          const houses = [
            { x0: 280, w: 340, col: '#d8b894', roof: '#8a4436', gable: 'volute', eave: 452, shut: '#5c7050', wn: 3 },
            { x0: 620, w: 300, col: '#c46a4a', roof: '#7a3a2e', gable: 'step', eave: 472, shut: null, wn: 3, flower: true },
            { x0: 920, w: 320, col: '#e0d4b0', roof: '#a63a2e', gable: 'tri', eave: 486, shut: null, wn: 2, board: 1 },
            { x0: 1240, w: 220, col: '#8aa27a', roof: '#6e5138', gable: 'cottage', eave: 524, shut: '#7a3a2e', wn: 2 },
            { x0: 2130, w: 300, col: '#c9a284', roof: '#7a3a2e', gable: 'tri', eave: 490, shut: '#7c3040', wn: 3, half: 1 }
          ];
          const pilX = [];        // paty pilířů podloubí → dlouhé stíny do náměstí
          for (let hi = 0; hi < houses.length; hi++) {
            const hh = houses[hi];
            const hx = hh.x0, hw = hh.w, e = hh.eave;
            // zeď — 3 zóny: osvětlený vršek, lokální barva, studený odraz sněhu dole
            x.fillStyle = lg(x, hx, e - 60, hx, 840, [[0, hh.col], [1, '#a5906a']]);
            x.fillRect(hx, e, hw, 840 - e);
            x.fillStyle = lg(x, hx, e, hx, e + 90, [[0, 'rgba(255,250,235,0.28)'], [1, 'rgba(255,250,235,0)']]);
            x.fillRect(hx, e, hw, 90);
            x.fillStyle = lg(x, hx, 750, hx, 840, [[0, 'rgba(130,150,200,0)'], [1, 'rgba(130,150,200,0.22)']]);
            x.fillRect(hx, 750, hw, 90);
            scumble(x, hx, e + 10, hw, 830 - e, 8110 + hi, 130, ['rgba(255,255,255,0.55)', 'rgba(120,90,60,0.45)', 'rgba(220,190,150,0.5)'], 3, 12, 0.34);
            // štít — 4 různé typy
            if (hh.gable === 'step') {
              x.fillStyle = hh.col;
              for (let s = 0; s < 4; s++) {
                x.fillRect(hx + s * (hw / 8), e - (s + 1) * 30, hw - s * (hw / 4), 32);
              }
              snowBand(x, [[hx, e - 2], [hx + hw / 8, e - 32], [hx + hw / 4, e - 62], [hx + hw * 3 / 8, e - 92], [hx + hw / 2, e - 120], [hx + hw * 5 / 8, e - 92], [hx + hw * 3 / 4, e - 62], [hx + hw * 7 / 8, e - 32], [hx + hw, e - 2]], 12, 8120 + hi, '#f4f8fd', '#a9bedd');
              // výklenek s Madonkou ve štítu (pekařská zbožnost)
              x.fillStyle = '#8a4a38';
              x.beginPath();
              x.moveTo(hx + hw / 2 - 12, e - 44); x.lineTo(hx + hw / 2 - 12, e - 68);
              x.arc(hx + hw / 2, e - 68, 12, Math.PI, 0);
              x.lineTo(hx + hw / 2 + 12, e - 44);
              x.closePath(); x.fill();
              x.fillStyle = '#e8dcbe';
              x.beginPath(); x.ellipse(hx + hw / 2, e - 58, 5, 9, 0, 0, TAU); x.fill();
            } else if (hh.gable === 'volute') {
              x.fillStyle = hh.col;
              x.beginPath();
              x.moveTo(hx, e);
              x.quadraticCurveTo(hx + hw * 0.16, e - 8, hx + hw * 0.2, e - 50);
              x.quadraticCurveTo(hx + hw * 0.24, e - 84, hx + hw * 0.4, e - 94);
              x.lineTo(hx + hw * 0.42, e - 126);
              x.lineTo(hx + hw * 0.58, e - 126);
              x.lineTo(hx + hw * 0.6, e - 94);
              x.quadraticCurveTo(hx + hw * 0.76, e - 84, hx + hw * 0.8, e - 50);
              x.quadraticCurveTo(hx + hw * 0.84, e - 8, hx + hw, e);
              x.closePath(); x.fill();
              snowBand(x, [[hx + 4, e - 4], [hx + hw * 0.2, e - 50], [hx + hw * 0.42, e - 120], [hx + hw * 0.58, e - 120], [hx + hw * 0.8, e - 50], [hx + hw - 4, e - 4]], 11, 8120 + hi, '#f4f8fd', '#a9bedd');
              // kulaté okénko půdy
              x.fillStyle = '#2c3654';
              x.beginPath(); x.arc(hx + hw / 2, e - 66, 13, 0, TAU); x.fill();
              x.strokeStyle = '#8a7454'; x.lineWidth = 4; x.stroke();
            } else if (hh.gable === 'cottage') {
              // nízká roubenka s vysokou doškovou valbou a peřinou sněhu
              fillP(x, [[hx - 26, e], [hx + hw * 0.24, e - 118], [hx + hw * 0.76, e - 112], [hx + hw + 26, e]], hh.roof);
              x.strokeStyle = 'rgba(44,28,12,0.45)'; x.lineWidth = 2.2;
              for (let k = 0; k < 6; k++) {
                x.beginPath();
                x.moveTo(hx + 6 + k * 40, e - 4);
                x.lineTo(hx + hw * 0.28 + k * 22, e - 100);
                x.stroke();
              }
              snowBand(x, [[hx - 16, e - 6], [hx + hw * 0.25, e - 108], [hx + hw * 0.75, e - 102], [hx + hw + 16, e - 6]], 17, 8120 + hi, '#f4f8fd', '#a9bedd');
              icicles(x, hx - 18, hx + hw + 18, e + 2, 8710, 18);
              // roubení — vodorovné trámy
              x.strokeStyle = 'rgba(74,50,30,0.5)'; x.lineWidth = 5;
              for (let k = 1; k < 4; k++) {
                x.beginPath(); x.moveTo(hx + 4, e + k * 64); x.lineTo(hx + hw - 4, e + k * 64); x.stroke();
              }
            } else {
              const ap = hi === 4 ? 0.58 : 0.44;          // vrchol střechy MIMO osu
              fillP(x, [[hx - 8, e], [hx + hw * ap, e - 146], [hx + hw + 8, e]], hh.roof);
              snowBand(x, [[hx, e - 6], [hx + hw * ap, e - 138], [hx + hw, e - 6]], 13, 8120 + hi, '#f4f8fd', '#a9bedd');
              if (hi === 2) {                             // vikýř s okénkem
                fillP(x, [[hx + 196, e - 34], [hx + 226, e - 74], [hx + 256, e - 34]], '#7c4034');
                x.fillStyle = '#241a2e';
                x.fillRect(hx + 214, e - 52, 24, 20);
                snowBand(x, [[hx + 200, e - 38], [hx + 226, e - 68], [hx + 252, e - 38]], 7, 8121, '#f4f8fd', '#a9bedd');
              }
            }
            /* okna patra — každé jiné: šířky, okenice, truhlík, bednění */
            const wy = e + (hh.gable === 'cottage' ? 34 : 46);
            for (let wi = 0; wi < hh.wn; wi++) {
              const cwx = hx + 52 + wi * ((hw - 104) / Math.max(1, hh.wn - 1));
              const wwd = hh.gable === 'cottage' ? 34 : 40 + ((hi * 2 + wi) % 3) * 4;
              const wht = hh.gable === 'cottage' ? 42 : 58 + ((hi + wi * 2) % 3) * 7;
              const wx = cwx - wwd / 2;
              if (hh.board === wi) {                      // zabedněné okno (mráz rozbil sklo)
                x.fillStyle = '#2a2336';
                x.fillRect(wx, wy, wwd, wht);
                x.strokeStyle = '#8a7454'; x.lineWidth = 4;
                x.strokeRect(wx - 5, wy - 6, wwd + 10, wht + 12);
                x.fillStyle = '#8a6a42';
                x.save();
                x.translate(wx + wwd / 2, wy + wht / 2);
                x.rotate(0.45); x.fillRect(-wwd * 0.72, -6, wwd * 1.44, 12);
                x.rotate(-0.9); x.fillRect(-wwd * 0.72, -5, wwd * 1.44, 10);
                x.restore();
              } else {
                litWindow(x, wx, wy, wwd, wht, 0, 0);
                x.strokeStyle = '#8a7454'; x.lineWidth = 4;
                x.strokeRect(wx - 5, wy - 6, wwd + 10, wht + 12);
                if (hh.shut) {                            // okenice
                  if (hh.half === wi) {                   // jedna napůl přivřená
                    x.fillStyle = hh.shut;
                    x.fillRect(wx - wwd * 0.52, wy - 4, wwd * 0.44, wht + 8);
                    x.fillRect(wx + wwd * 0.5, wy - 2, wwd * 0.54, wht + 6);
                    x.strokeStyle = 'rgba(20,12,8,0.55)'; x.lineWidth = 2;
                    x.strokeRect(wx + wwd * 0.5, wy - 2, wwd * 0.54, wht + 6);
                  } else {
                    for (const sxx of [wx - wwd * 0.56, wx + wwd + wwd * 0.14]) {
                      x.fillStyle = hh.shut;
                      x.fillRect(sxx, wy - 4, wwd * 0.42, wht + 8);
                      x.strokeStyle = 'rgba(20,12,8,0.45)'; x.lineWidth = 2;
                      for (let k = 1; k < 4; k++) {
                        x.beginPath();
                        x.moveTo(sxx + 2, wy - 4 + k * (wht + 8) / 4);
                        x.lineTo(sxx + wwd * 0.42 - 2, wy - 4 + k * (wht + 8) / 4);
                        x.stroke();
                      }
                    }
                  }
                }
                if (hh.flower && wi !== 1) {              // truhlík se sněhem a suchými snítkami
                  x.fillStyle = '#6e5138';
                  x.fillRect(wx - 7, wy + wht + 6, wwd + 14, 12);
                  snowBand(x, [[wx - 7, wy + wht + 4], [wx + wwd + 7, wy + wht + 4]], 7, 8135 + wi, '#f4f8fd', '#b9cbe4');
                  x.strokeStyle = '#7a5c34'; x.lineWidth = 2;
                  for (let k = 0; k < 3; k++) {
                    x.beginPath();
                    x.moveTo(wx + 6 + k * 14, wy + wht + 4);
                    x.lineTo(wx + 2 + k * 15, wy + wht - 10 - k * 3);
                    x.stroke();
                  }
                }
              }
              snowBand(x, [[wx - 6, wy + wht + 8], [wx + wwd + 6, wy + wht + 8]], 5, 8130 + hi * 4 + wi, '#f4f8fd', '#b9cbe4');
            }
            /* přízemí: podloubí s variovanými patkami — roubenka ho NEMÁ */
            if (hh.gable === 'cottage') {
              // dveře s podkovou, okénko, dříví a lavice u stěny
              x.fillStyle = '#54401f';
              x.fillRect(hx + 26, 738, 56, 102);
              x.strokeStyle = '#2c1c0c'; x.lineWidth = 3;
              x.strokeRect(hx + 26, 738, 56, 102);
              x.beginPath(); x.moveTo(hx + 54, 742); x.lineTo(hx + 54, 836); x.stroke();
              x.strokeStyle = '#8a8a94'; x.lineWidth = 3;
              x.beginPath(); x.arc(hx + 54, 762, 8, 0.3, Math.PI - 0.3); x.stroke();
              litWindow(x, hx + 118, 756, 34, 40, 0, 0);
              x.strokeStyle = '#6e5138'; x.lineWidth = 4;
              x.strokeRect(hx + 113, 751, 44, 50);
              x.fillStyle = '#4e3a22';                   // hranice dříví
              for (let k = 0; k < 8; k++) {
                x.beginPath();
                x.ellipse(hx + 172 + (k % 4) * 13, 830 - ((k / 4) | 0) * 12, 6, 6, 0, 0, TAU);
                x.fill();
                x.strokeStyle = '#2c1e0c'; x.lineWidth = 1.8; x.stroke();
              }
              snowBand(x, [[hx + 164, 812], [hx + 216, 812]], 6, 8122, '#f4f8fd', '#b9cbe4');
              pilX.push(hx + 26, hx + 190);
            } else {
              const arches = Math.max(2, (hw / 150) | 0);
              for (let ai = 0; ai < arches; ai++) {
                const ax = hx + 16 + ai * ((hw - 32) / arches);
                const aw = (hw - 32) / arches - 14;
                const spring = 706 + ((hi * 7 + ai * 5) % 5) * 8;   // patky variují 706–738
                if (hi === 1 && ai === 0) {
                  // zazděný oblouk s malým okénkem
                  x.fillStyle = '#b09a76';
                  x.beginPath();
                  x.moveTo(ax, 840); x.lineTo(ax, spring);
                  x.arc(ax + aw / 2, spring, aw / 2, Math.PI, 0);
                  x.lineTo(ax + aw, 840);
                  x.closePath(); x.fill();
                  x.strokeStyle = 'rgba(120,90,60,0.5)'; x.lineWidth = 2.4;
                  for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(ax + 2, 748 + k * 18); x.lineTo(ax + aw - 2, 748 + k * 18); x.stroke(); }
                  x.fillStyle = '#241c30';
                  x.fillRect(ax + aw / 2 - 10, 760, 20, 26);
                } else {
                  x.fillStyle = lg(x, 0, 660, 0, 840, [[0, '#3c2f20'], [1, '#221708']]);
                  x.beginPath();
                  x.moveTo(ax, 840); x.lineTo(ax, spring);
                  x.arc(ax + aw / 2, spring, aw / 2, Math.PI, 0);
                  x.lineTo(ax + aw, 840);
                  x.closePath(); x.fill();
                  if (hi === 0 && ai === 1) {
                    // vrata skladu v podloubí
                    x.fillStyle = '#54401f';
                    x.fillRect(ax + 8, spring + 10, aw - 16, 830 - spring);
                    x.strokeStyle = 'rgba(24,14,6,0.7)'; x.lineWidth = 2.5;
                    for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(ax + 8 + k * (aw - 16) / 4, spring + 10); x.lineTo(ax + 8 + k * (aw - 16) / 4, 838); x.stroke(); }
                  }
                  if (hi === 2 && ai === 1) {
                    // složené dříví v šeru
                    x.fillStyle = '#54401f';
                    for (let k = 0; k < 5; k++) {
                      x.beginPath(); x.ellipse(ax + 16 + k * 13, 824 - (k % 2) * 11, 6.5, 6.5, 0, 0, TAU); x.fill();
                      x.strokeStyle = '#2c1e0c'; x.lineWidth = 2; x.stroke();
                    }
                  }
                  if (hi === 4 && ai === 0) {
                    // sud u pilíře
                    x.fillStyle = '#4e3a22';
                    x.beginPath(); x.ellipse(ax + aw / 2, 812, 20, 26, 0, 0, TAU); x.fill();
                    x.strokeStyle = 'rgba(20,12,6,0.8)'; x.lineWidth = 2.4;
                    x.beginPath(); x.moveTo(ax + aw / 2 - 20, 804); x.lineTo(ax + aw / 2 + 20, 804); x.stroke();
                  }
                }
                x.strokeStyle = 'rgba(255,250,235,0.5)'; x.lineWidth = 3;
                x.beginPath(); x.arc(ax + aw / 2, spring, aw / 2, Math.PI, Math.PI * 1.6); x.stroke();
                // kamenná patka pilíře — jen u některých (žádné klony)
                if ((hi * 3 + ai) % 2 === 0) {
                  x.fillStyle = '#b0a284';
                  x.fillRect(ax - 12, 812, 20, 28);
                  x.fillRect(ax + aw - 8, 812, 20, 28);
                  x.strokeStyle = 'rgba(60,44,24,0.5)'; x.lineWidth = 2;
                  x.strokeRect(ax - 12, 812, 20, 28);
                  x.strokeRect(ax + aw - 8, 812, 20, 28);
                }
                pilX.push(ax - 7);
                if (ai === arches - 1) pilX.push(ax + aw + 7);
              }
            }
            x.fillStyle = 'rgba(90,70,44,0.5)';
            x.fillRect(hx, 836, hw, 8);
          }

          /* --- RADNICE — dominanta náměstí, MIMO střed, s věžičkou --- */
          {
            const rx = 1850, rwd = 280;
            /* věžička se zvoničkou (kreslí se dřív — štít ji zdola překryje) */
            const tx = rx + 190;
            x.fillStyle = lg(x, tx, 0, tx + 60, 0, [[0, '#e6d8b2'], [1, '#b4a075']]);
            x.fillRect(tx, 232, 60, 200);
            x.fillStyle = '#241a10';                       // okénko zvonu
            x.fillRect(tx + 16, 258, 28, 40);
            x.strokeStyle = '#8a7454'; x.lineWidth = 3;
            x.strokeRect(tx + 13, 254, 34, 47);
            x.fillStyle = '#caa25a';                       // zvonek
            x.beginPath(); x.arc(tx + 30, 276, 8, Math.PI, 0);
            x.lineTo(tx + 38, 286); x.lineTo(tx + 22, 286); x.closePath(); x.fill();
            /* ochoz + cibulka s makovicí a praporkem */
            x.fillStyle = '#7a4a36';
            fillP(x, [[tx - 10, 232], [tx + 70, 232], [tx + 62, 216], [tx - 2, 216]], '#7a4a36');
            x.fillStyle = '#5c422a';
            x.beginPath();
            x.moveTo(tx - 4, 216);
            x.bezierCurveTo(tx - 12, 186, tx + 18, 178, tx + 30, 158);
            x.bezierCurveTo(tx + 42, 178, tx + 72, 186, tx + 64, 216);
            x.closePath(); x.fill();
            snowBand(x, [[tx - 2, 212], [tx + 30, 168], [tx + 62, 212]], 8, 8117, '#f4f8fd', '#a9bedd');
            x.strokeStyle = '#c9932e'; x.lineWidth = 3.4;
            x.beginPath(); x.moveTo(tx + 30, 156); x.lineTo(tx + 30, 130); x.stroke();
            x.fillStyle = '#c9932e';
            x.beginPath(); x.arc(tx + 30, 152, 5, 0, TAU); x.fill();
            fillP(x, [[tx + 30, 130], [tx + 48, 136], [tx + 30, 143]], '#b8434c');
            /* vysoká fasáda — o patro víc než sousedé */
            x.fillStyle = lg(x, rx, 400, rx, 840, [[0, '#ecdfc0'], [0.55, '#d9c9a2'], [1, '#a5906a']]);
            x.fillRect(rx, 420, rwd, 420);
            x.fillStyle = lg(x, rx, 420, rx, 505, [[0, 'rgba(255,250,235,0.30)'], [1, 'rgba(255,250,235,0)']]);
            x.fillRect(rx, 420, rwd, 85);
            x.fillStyle = lg(x, rx, 750, rx, 840, [[0, 'rgba(130,150,200,0)'], [1, 'rgba(130,150,200,0.22)']]);
            x.fillRect(rx, 750, rwd, 90);
            /* sgrafitový pás pod římsou + kvádrované nároží */
            sgrafito(x, rx + 26, 452, rwd - 52, 66, 17, '#8a7450', 0.32);
            x.fillStyle = 'rgba(252,246,230,0.55)';
            for (let q = 0; q < 9; q++) {
              x.fillRect(rx + 2, 430 + q * 46, q % 2 ? 20 : 26, 20);
              x.fillRect(rx + rwd - (q % 2 ? 22 : 28), 430 + q * 46, q % 2 ? 20 : 26, 20);
            }
            scumble(x, rx + 4, 430, rwd - 8, 400, 8118, 150, ['rgba(255,255,255,0.5)', 'rgba(120,96,64,0.4)', 'rgba(226,206,166,0.5)'], 3, 12, 0.3);
            /* ERB města v kartuši (heraldická loďka — Benátky!) */
            x.save();
            x.translate(rx + rwd / 2, 484);
            x.fillStyle = '#f0e6cc';
            x.beginPath(); x.ellipse(0, 0, 34, 26, 0, 0, TAU); x.fill();
            x.strokeStyle = '#8a7454'; x.lineWidth = 3; x.stroke();
            x.fillStyle = '#b8434c';
            x.beginPath();
            x.moveTo(-17, -12); x.lineTo(17, -12); x.lineTo(17, 4);
            x.quadraticCurveTo(17, 16, 0, 20);
            x.quadraticCurveTo(-17, 16, -17, 4);
            x.closePath(); x.fill();
            x.strokeStyle = '#5e241c'; x.lineWidth = 2; x.stroke();
            x.fillStyle = '#f0e6cc';
            x.beginPath();
            x.moveTo(-10, 2); x.quadraticCurveTo(0, 11, 10, 2);
            x.lineTo(7, -2); x.lineTo(-7, -2); x.closePath(); x.fill();
            x.restore();
            /* stupňovitý štít (5 stupňů) se sněhem */
            x.fillStyle = '#ecdfc0';
            for (let s = 0; s < 5; s++) {
              x.fillRect(rx + s * (rwd / 10), 420 - (s + 1) * 26, rwd - s * (rwd / 5), 27);
            }
            snowBand(x, [[rx + 2, 416], [rx + rwd * 0.1, 392], [rx + rwd * 0.2, 366], [rx + rwd * 0.3, 340], [rx + rwd * 0.4, 314], [rx + rwd * 0.5, 288], [rx + rwd * 0.6, 314], [rx + rwd * 0.7, 340], [rx + rwd * 0.8, 366], [rx + rwd * 0.9, 392], [rx + rwd - 2, 416]], 12, 8119, '#f4f8fd', '#a9bedd');
            /* sdružená okna s kamennými šambránami */
            for (let wi = 0; wi < 3; wi++) {
              const wx = rx + 42 + wi * 82;
              x.fillStyle = '#f0e6cc';
              x.fillRect(wx - 8, 532, 62, 96);
              litWindow(x, wx, 540, 20, 80, 0, 0);
              litWindow(x, wx + 26, 540, 20, 80, 0, 0);
              x.strokeStyle = '#8a7454'; x.lineWidth = 3;
              x.strokeRect(wx - 8, 532, 62, 96);
              snowBand(x, [[wx - 10, 630], [wx + 56, 630]], 6, 8137 + wi, '#f4f8fd', '#b9cbe4');
            }
            /* podloubí radnice: 2 širší oblouky na hranatých pilířích */
            for (let ai = 0; ai < 2; ai++) {
              const ax = rx + 22 + ai * 124, aw = 110;
              x.fillStyle = lg(x, 0, 660, 0, 840, [[0, '#40342a'], [1, '#241808']]);
              x.beginPath();
              x.moveTo(ax, 840); x.lineTo(ax, 716);
              x.arc(ax + aw / 2, 716, aw / 2, Math.PI, 0);
              x.lineTo(ax + aw, 840);
              x.closePath(); x.fill();
              x.strokeStyle = 'rgba(255,250,235,0.55)'; x.lineWidth = 3.4;
              x.beginPath(); x.arc(ax + aw / 2, 716, aw / 2, Math.PI, Math.PI * 1.6); x.stroke();
              pilX.push(ax - 8);
              if (ai === 1) pilX.push(ax + aw + 8);
            }
            /* vývěska s vyhláškami v levém oblouku */
            x.fillStyle = '#6e5138';
            x.fillRect(rx + 40, 736, 74, 66);
            x.strokeStyle = '#402a12'; x.lineWidth = 3;
            x.strokeRect(rx + 40, 736, 74, 66);
            x.fillStyle = '#e8dcbe';
            x.save(); x.translate(rx + 58, 758); x.rotate(-0.05); x.fillRect(-9, -12, 20, 26); x.restore();
            x.save(); x.translate(rx + 84, 762); x.rotate(0.07); x.fillRect(-9, -12, 20, 26); x.restore();
            x.save(); x.translate(rx + 100, 752); x.rotate(-0.03); x.fillRect(-8, -10, 17, 22); x.restore();
            x.strokeStyle = 'rgba(90,64,32,0.8)'; x.lineWidth = 1.2;
            for (let k = 0; k < 3; k++) {
              x.beginPath(); x.moveTo(rx + 52, 752 + k * 5); x.lineTo(rx + 64, 752 + k * 5); x.stroke();
              x.beginPath(); x.moveTo(rx + 78, 756 + k * 5); x.lineTo(rx + 90, 756 + k * 5); x.stroke();
            }
            /* okovaná vrata radnice v pravém oblouku */
            x.fillStyle = '#54401f';
            x.fillRect(rx + 168, 728, 66, 112);
            x.strokeStyle = 'rgba(24,14,6,0.7)'; x.lineWidth = 2.5;
            x.strokeRect(rx + 168, 728, 66, 112);
            x.beginPath(); x.moveTo(rx + 201, 730); x.lineTo(rx + 201, 838); x.stroke();
            x.fillStyle = '#57575f';
            for (let k = 0; k < 3; k++) {
              x.beginPath(); x.arc(rx + 178, 744 + k * 34, 2.6, 0, TAU); x.fill();
              x.beginPath(); x.arc(rx + 224, 744 + k * 34, 2.6, 0, TAU); x.fill();
            }
            x.fillStyle = 'rgba(90,70,44,0.5)';
            x.fillRect(rx, 836, rwd, 8);
          }

          /* --- dlouhé stíny pilířů podloubí — šikmé pruhy přes sníh
             (rozbíjejí ploché polední světlo, vedou oko diagonálně) --- */
          {
            const rs = mulberry(8106);
            for (const px2 of pilX) {
              const len = 0.75 + rs() * 0.6;
              castShadow(x, px2, 846, 18 + rs() * 10, -170 * len, 150 * len, 0.11 + rs() * 0.05, '95,105,175');
            }
          }

          /* --- sníh navátý k patám zdí a pilířů --- */
          {
            const rdr = mulberry(8107);
            for (const dx2 of [312, 470, 640, 812, 985, 1160, 1300, 1428, 1530, 1760, 1910, 2085, 2250, 2400]) {
              const dw = 28 + rdr() * 36, dh = 10 + rdr() * 15;
              x.fillStyle = lg(x, 0, 846 - dh, 0, 852, [[0, '#f6f9fd'], [1, '#c2d0e8']]);
              x.beginPath();
              x.moveTo(dx2 - dw, 849);
              x.quadraticCurveTo(dx2 - dw * 0.3, 849 - dh, dx2 + dw * 0.25, 847 - dh * 0.6);
              x.quadraticCurveTo(dx2 + dw * 0.7, 847, dx2 + dw, 849);
              x.closePath(); x.fill();
            }
          }

          /* komínové hlavy (zdroje kouře) */
          for (const [cx2, cy2] of CHIM) {
            const sh2 = cy2 < 360 ? 52 : 34;
            x.fillStyle = '#8a5a42';
            x.fillRect(cx2 - 11, cy2 - 4, 22, sh2);
            x.fillStyle = '#6e4232';
            x.fillRect(cx2 - 14, cy2 - 10, 28, 8);
            snowBand(x, [[cx2 - 13, cy2 - 12], [cx2 + 13, cy2 - 12]], 5, 9100 + cx2, '#f4f8fd', '#b9cbe4');
          }

          // vývěsní štíty (preclík u pekaře, bota u ševce) — houpou se dynamicky, tady jen konzoly
          x.strokeStyle = '#33241a'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(620, 640); x.lineTo(586, 660); x.stroke();
          x.beginPath(); x.moveTo(2210, 652); x.lineTo(2176, 672); x.stroke();

          /* --- kostel (Narození Panny Marie) --- */
          x.save();
          const kx = 1450;
          // loď
          x.fillStyle = lg(x, kx, 300, kx, 840, [[0, '#e2d4ac'], [0.55, '#c9b890'], [1, '#a3926c']]);
          x.fillRect(kx, 430, 400, 410);
          x.fillStyle = lg(x, kx, 760, kx, 840, [[0, 'rgba(130,150,200,0)'], [1, 'rgba(130,150,200,0.20)']]);
          x.fillRect(kx, 760, 400, 80);
          scumble(x, kx, 440, 400, 390, 8141, 170, ['rgba(255,255,255,0.5)', 'rgba(120,96,64,0.45)', 'rgba(226,200,160,0.5)'], 3, 12, 0.34);
          // opěráky
          x.fillStyle = '#bda57c';
          x.fillRect(kx + 20, 520, 26, 320);
          x.fillRect(kx + 354, 520, 26, 320);
          snowBand(x, [[kx + 18, 516], [kx + 48, 516]], 7, 8142, '#f4f8fd', '#b9cbe4');
          snowBand(x, [[kx + 352, 516], [kx + 382, 516]], 7, 8143, '#f4f8fd', '#b9cbe4');
          // sedlová střecha
          fillP(x, [[kx - 16, 430], [kx + 200, 310], [kx + 416, 430]], '#8a5a42');
          snowBand(x, [[kx - 6, 424], [kx + 200, 318], [kx + 406, 424]], 15, 8144, '#f4f8fd', '#a9bedd');
          // věž
          x.fillStyle = lg(x, kx + 260, 0, kx + 400, 0, [[0, '#cbb894'], [1, '#a5906a']]);
          x.fillRect(kx + 270, 130, 120, 310);
          // zvukové okno se žaluzií
          x.fillStyle = '#241a10';
          x.fillRect(kx + 300, 180, 60, 90);
          x.strokeStyle = '#8a7454'; x.lineWidth = 4;
          x.strokeRect(kx + 296, 176, 68, 98);
          x.strokeStyle = 'rgba(200,180,140,0.8)'; x.lineWidth = 3;
          for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(kx + 302, 194 + i * 16); x.lineTo(kx + 358, 190 + i * 16); x.stroke(); }
          // jehlan věže
          fillP(x, [[kx + 258, 130], [kx + 330, 20], [kx + 402, 130]], '#5c422a');
          snowBand(x, [[kx + 266, 126], [kx + 330, 30], [kx + 394, 126]], 12, 8145, '#f4f8fd', '#a9bedd');
          x.strokeStyle = '#c9932e'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(kx + 330, 18); x.lineTo(kx + 330, -6); x.stroke();
          x.beginPath(); x.moveTo(kx + 320, 0); x.lineTo(kx + 340, 0); x.stroke();
          // hodiny na věži
          x.fillStyle = '#f0e2c0';
          x.beginPath(); x.arc(kx + 330, 320, 34, 0, TAU); x.fill();
          x.strokeStyle = '#7a5c34'; x.lineWidth = 4; x.stroke();
          x.strokeStyle = '#3a2c1a'; x.lineWidth = 3.4;
          x.beginPath(); x.moveTo(kx + 330, 320); x.lineTo(kx + 330 + 14, 320 - 16); x.stroke();
          // gotický portál + zavřené dveře (hs_sq_church_door)
          x.fillStyle = '#8a7454';
          x.beginPath();
          x.moveTo(kx + 150, 840); x.lineTo(kx + 150, 700);
          x.quadraticCurveTo(kx + 152, 620, kx + 200, 606);
          x.quadraticCurveTo(kx + 248, 620, kx + 250, 700);
          x.lineTo(kx + 250, 840);
          x.closePath(); x.fill();
          x.fillStyle = '#3c2a16';
          x.beginPath();
          x.moveTo(kx + 168, 834); x.lineTo(kx + 168, 706);
          x.quadraticCurveTo(kx + 170, 646, kx + 200, 634);
          x.quadraticCurveTo(kx + 230, 646, kx + 232, 706);
          x.lineTo(kx + 232, 834);
          x.closePath(); x.fill();
          x.strokeStyle = 'rgba(16,10,4,0.7)'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(kx + 200, 634); x.lineTo(kx + 200, 834); x.stroke();
          x.strokeStyle = '#57575f'; x.lineWidth = 4;
          for (const dy of [700, 780]) {
            x.beginPath(); x.moveTo(kx + 172, dy); x.lineTo(kx + 228, dy); x.stroke();
          }
          x.fillStyle = '#c9932e';
          x.beginPath(); x.arc(kx + 214, 742, 5, 0, TAU); x.fill();
          // kruhové okno nad portálem
          x.fillStyle = '#2c3654';
          x.beginPath(); x.arc(kx + 200, 520, 38, 0, TAU); x.fill();
          x.strokeStyle = '#8a7454'; x.lineWidth = 6; x.stroke();
          x.strokeStyle = 'rgba(200,180,140,0.7)'; x.lineWidth = 3;
          for (let i = 0; i < 6; i++) {
            const a = i / 6 * TAU;
            x.beginPath(); x.moveTo(kx + 200, 520); x.lineTo(kx + 200 + Math.cos(a) * 36, 520 + Math.sin(a) * 36); x.stroke();
          }
          // cedule na dveřích („mše až po opravě kamen")
          x.fillStyle = '#e8dcbe';
          x.save();
          x.translate(kx + 200, 764); x.rotate(-0.04);
          x.fillRect(-26, -16, 52, 32);
          x.strokeStyle = '#7a5c34'; x.lineWidth = 2; x.strokeRect(-26, -16, 52, 32);
          x.strokeStyle = 'rgba(90,64,32,0.8)'; x.lineWidth = 1.4;
          for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-18, -7 + i * 8); x.lineTo(18, -7 + i * 8); x.stroke(); }
          x.restore();
          x.restore();

          /* --- ulička k řece (vpravo mezi domy) --- */
          x.fillStyle = lg(x, 2430, 0, 2600, 0, [[0, '#3a4a5e'], [1, '#5c6c80']]);
          fillP(x, [[2430, 840], [2430, 560], [2600, 540], [2600, 840]], '#46566a');
          // průhled: světlá mlha od řeky
          x.fillStyle = lg(x, 0, 560, 0, 850, [[0, '#c2d4e0'], [1, '#e6eef4']]);
          fillP(x, [[2470, 840], [2474, 590], [2560, 580], [2566, 840]], '#cfdde8');
          x.fillStyle = 'rgba(110,130,150,0.8)';
          fillP(x, [[2480, 840], [2486, 700], [2508, 700], [2504, 840]], 'rgba(110,130,150,0.7)');
          // schody dolů
          x.fillStyle = '#9aa8b8';
          for (let i = 0; i < 4; i++) x.fillRect(2470, 800 + i * 12, 96 + i * 8, 8);

          /* --- cesta k zámku (vlevo vzhůru) --- */
          x.fillStyle = lg(x, 0, 0, 260, 0, [[0, '#c3d2e4'], [1, '#e2ebf5']]);
          fillP(x, [[0, 840], [0, 560], [120, 560], [270, 700], [270, 840]], '#cdd9ea');
          trodden(x, 60, 700, 220, 800, 50, 8151);
          // zídka podél cesty
          x.fillStyle = '#a5906a';
          fillP(x, [[0, 700], [250, 810], [250, 848], [0, 742]], '#a5906a');
          snowBand(x, [[0, 696], [248, 806]], 10, 8152, '#f4f8fd', '#b9cbe4');
          // ukazatel „HRAD"
          x.strokeStyle = '#6e5138'; x.lineWidth = 8;
          x.beginPath(); x.moveTo(300, 850); x.lineTo(300, 730); x.stroke();
          x.fillStyle = '#8a6a42';
          fillP(x, [[268, 730], [352, 730], [368, 744], [352, 758], [268, 758]], '#8a6a42');
          x.fillStyle = '#3a2c1a'; x.font = 'bold 17px Georgia, serif';
          x.fillText('ZÁMEK', 280, 750);

          /* --- zamrzlá kašna (kámen s okrovým nádechem, ne beton) --- */
          x.save();
          x.translate(1650, 906);
          contactShadow(x, 4, 28, 145, 26, 1.2);
          // nádrž
          x.fillStyle = lg(x, -130, 0, 130, 0, [[0, '#c2b49c'], [0.5, '#a09076'], [1, '#786852']]);
          x.beginPath(); x.ellipse(0, 10, 128, 34, 0, 0, TAU); x.fill();
          x.fillRect(-128, -36, 256, 48);
          x.beginPath(); x.ellipse(0, -36, 128, 34, 0, 0, TAU); x.fill();
          // mrazová glazura + okrové šmouhy na kameni
          scumble(x, -126, -34, 252, 60, 8163, 46, ['rgba(226,214,190,0.6)', 'rgba(110,96,76,0.5)', 'rgba(200,214,232,0.5)'], 3, 10, 0.4);
          x.strokeStyle = 'rgba(74,64,50,0.6)'; x.lineWidth = 3;
          for (let i = 0; i < 8; i++) {
            const a = 0.35 + i * 0.34;
            x.beginPath();
            x.moveTo(Math.cos(a) * 128, -36 + Math.sin(a) * 34);
            x.lineTo(Math.cos(a) * 128, 10 + Math.sin(a) * 34);
            x.stroke();
          }
          // led uvnitř — vyboulený
          x.fillStyle = '#bcd4e0';
          x.beginPath(); x.ellipse(0, -38, 108, 26, 0, 0, TAU); x.fill();
          x.fillStyle = 'rgba(255,255,255,0.6)';
          x.beginPath(); x.ellipse(-30, -44, 40, 10, -0.2, 0, TAU); x.fill();
          // sloupek s chrličem — ryba s rampouchem z tlamy
          x.fillStyle = '#a09076';
          x.fillRect(-14, -150, 28, 116);
          x.beginPath(); x.ellipse(0, -150, 30, 14, 0, 0, TAU); x.fill();
          x.fillStyle = '#8a7c64';
          x.beginPath();
          x.moveTo(-6, -166); x.quadraticCurveTo(24, -178, 38, -160);
          x.quadraticCurveTo(24, -148, -6, -150);
          x.closePath(); x.fill();
          fillP(x, [[-6, -168], [-22, -180], [-18, -156]], '#8a7c64');
          // zmrzlý pramen — rampouchový vodopád
          x.fillStyle = 'rgba(214,234,250,0.9)';
          x.beginPath();
          x.moveTo(30, -158);
          x.quadraticCurveTo(40, -110, 34, -64);
          x.lineTo(22, -64);
          x.quadraticCurveTo(26, -110, 22, -156);
          x.closePath(); x.fill();
          icicles(x, -30, 34, -136, 8161, 26);
          snowBand(x, [[-128, -40], [-40, -48], [60, -46], [128, -38]], 10, 8162, '#f4f8fd', '#b9cbe4');
          x.restore();

          /* --- pranýř (s vtipnou sněhovou čepicí) --- */
          x.save();
          x.translate(2100, 886);
          contactShadow(x, 0, 8, 58, 12, 1.1);
          x.fillStyle = '#8a7a5c';
          x.beginPath(); x.ellipse(0, 0, 44, 12, 0, 0, TAU); x.fill();
          x.fillRect(-44, -18, 88, 18);
          x.fillStyle = '#6e5138';
          x.fillRect(-10, -140, 20, 124);
          // deska s otvory
          x.fillStyle = '#7a5c38';
          x.fillRect(-58, -168, 116, 34);
          x.strokeStyle = '#402a12'; x.lineWidth = 3;
          x.strokeRect(-58, -168, 116, 34);
          x.fillStyle = '#241a10';
          x.beginPath(); x.arc(0, -151, 11, 0, TAU); x.fill();
          x.beginPath(); x.arc(-36, -151, 7, 0, TAU); x.fill();
          x.beginPath(); x.arc(36, -151, 7, 0, TAU); x.fill();
          // panty + řetízek
          x.strokeStyle = '#57575f'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(-58, -160); x.lineTo(-66, -160); x.moveTo(-66, -160); x.lineTo(-66, -144); x.stroke();
          snowBand(x, [[-58, -172], [58, -172]], 9, 8171, '#f4f8fd', '#b9cbe4');
          x.restore();

          /* --- Bětčin stánek --- */
          x.save();
          x.translate(1128, 0);
          // zadní tyče a plachta
          x.strokeStyle = '#6e5138'; x.lineWidth = 9;
          x.beginPath(); x.moveTo(-186, 968); x.lineTo(-178, 640); x.stroke();
          x.beginPath(); x.moveTo(186, 968); x.lineTo(178, 640); x.stroke();
          // pruhovaná stříška
          x.fillStyle = '#b8434c';
          x.beginPath();
          x.moveTo(-214, 668);
          x.quadraticCurveTo(0, 600, 214, 668);
          x.lineTo(202, 712);
          x.quadraticCurveTo(0, 650, -202, 712);
          x.closePath(); x.fill();
          x.save();
          x.beginPath();
          x.moveTo(-214, 668);
          x.quadraticCurveTo(0, 600, 214, 668);
          x.lineTo(202, 712);
          x.quadraticCurveTo(0, 650, -202, 712);
          x.closePath(); x.clip();
          x.fillStyle = '#e8dcbe';
          for (let i = -4; i <= 4; i += 2) x.fillRect(i * 52 - 22, 590, 44, 130);
          x.restore();
          snowBand(x, [[-208, 664], [0, 606], [208, 664]], 10, 8181, '#f4f8fd', '#b9cbe4');
          // zvlněný lem plachty
          x.fillStyle = '#a63a44';
          for (let i = -4; i < 4; i++) {
            x.beginPath();
            x.arc(i * 52 + 26, 710 - Math.abs(i) * 5, 24, 0, Math.PI);
            x.fill();
          }
          // pult (walkBehind popředí)
          x.fillStyle = lg(x, 0, 966, 0, 1080, [[0, '#8a6a42'], [1, '#5a4028']]);
          x.fillRect(-198, 966, 396, 114);
          x.fillStyle = '#a5814e';
          x.fillRect(-206, 952, 412, 20);
          x.strokeStyle = 'rgba(40,24,10,0.55)'; x.lineWidth = 3;
          for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(-198 + i * 60, 972); x.lineTo(-198 + i * 60, 1080); x.stroke(); }
          // zboží na pultu: cedníky, svíčky, pytlík zrní, sušená jablka
          // cedník zavěšený na tyči
          x.strokeStyle = '#57575f'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(-178, 700); x.lineTo(-160, 726); x.stroke();
          x.fillStyle = '#9a9aa4';
          x.beginPath(); x.arc(-156, 748, 26, 0, TAU); x.fill();
          x.fillStyle = '#7a7a86';
          x.beginPath(); x.arc(-156, 748, 19, 0, TAU); x.fill();
          x.fillStyle = '#57575f';
          const rd2 = mulberry(8182);
          for (let i = 0; i < 9; i++) {
            x.beginPath(); x.arc(-156 + (rd2() - 0.5) * 26, 748 + (rd2() - 0.5) * 26, 2, 0, TAU); x.fill();
          }
          x.strokeStyle = '#57575f'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(-136, 736); x.lineTo(-108, 720); x.stroke();
          // svazek lojových svíček
          x.fillStyle = '#e8dcbe';
          for (let i = 0; i < 5; i++) x.fillRect(-60 + i * 11, 906, 8, 52);
          x.strokeStyle = '#8a6a42'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(-64, 926); x.lineTo(-8, 926); x.stroke();
          // pytle
          for (let i = 0; i < 3; i++) {
            const px = 30 + i * 62;
            x.fillStyle = i === 1 ? '#b09a72' : '#9a825c';
            x.beginPath();
            x.moveTo(px, 962);
            x.quadraticCurveTo(px - 6, 900, px + 24, 892);
            x.quadraticCurveTo(px + 56, 898, px + 52, 962);
            x.closePath(); x.fill();
            x.fillStyle = i === 0 ? '#e0c580' : (i === 1 ? '#c9a24a' : '#8a7148');
            x.beginPath(); x.ellipse(px + 25, 902, 18, 7, 0, 0, TAU); x.fill();
          }
          // girlanda sušených jablek
          x.strokeStyle = '#6a5230'; x.lineWidth = 2.4;
          x.beginPath(); x.moveTo(-186, 780); x.quadraticCurveTo(0, 830, 186, 780); x.stroke();
          x.fillStyle = '#9a5a30';
          for (let i = 0; i < 11; i++) {
            const tt = i / 10;
            const ax = lerp(-180, 180, tt);
            const ay = 782 + Math.sin(tt * Math.PI) * 44;
            x.beginPath(); x.arc(ax, ay, 7.4, 0, TAU); x.fill();
          }
          x.restore();

          /* --- železný koš s ohněm (walkBehind popředí) --- */
          x.save();
          x.translate(706, 1006);
          contactShadow(x, 0, 58, 68, 14, 1.2, '50,44,64');
          // roztátý sníh kolem
          x.fillStyle = '#a89a86';
          x.beginPath(); x.ellipse(0, 56, 52, 11, 0, 0, TAU); x.fill();
          // nohy
          x.strokeStyle = '#2c2c34'; x.lineWidth = 7;
          x.beginPath(); x.moveTo(-30, 54); x.lineTo(-16, 6); x.stroke();
          x.beginPath(); x.moveTo(30, 54); x.lineTo(16, 6); x.stroke();
          x.beginPath(); x.moveTo(0, 58); x.lineTo(0, 10); x.stroke();
          // koš — kované pásy
          x.strokeStyle = '#3a3a44'; x.lineWidth = 5;
          x.beginPath(); x.ellipse(0, 6, 44, 12, 0, 0, TAU); x.stroke();
          x.beginPath(); x.ellipse(0, -34, 36, 10, 0, 0, TAU); x.stroke();
          for (let i = 0; i < 7; i++) {
            const a = i / 7 * TAU;
            x.beginPath();
            x.moveTo(Math.cos(a) * 44, 6 + Math.sin(a) * 12);
            x.lineTo(Math.cos(a) * 36, -34 + Math.sin(a) * 10);
            x.stroke();
          }
          // žhavé uhlíky (oheň sám dynamicky)
          x.fillStyle = '#e8582a';
          x.beginPath(); x.ellipse(0, -30, 28, 8, 0, 0, TAU); x.fill();
          x.restore();

          /* --- fůra sena s trakařem u podloubí --- */
          x.save();
          x.translate(420, 880);
          contactShadow(x, 0, 24, 100, 16, 1);
          x.fillStyle = '#8a6a42';
          fillP(x, [[-70, 0], [70, 0], [56, -26], [-56, -26]], '#8a6a42');
          x.strokeStyle = '#57432a'; x.lineWidth = 6;
          x.beginPath(); x.moveTo(66, -6); x.lineTo(120, 10); x.stroke();
          x.fillStyle = '#c9a24a';
          x.beginPath();
          x.moveTo(-60, -26);
          x.quadraticCurveTo(-30, -78, 0, -70);
          x.quadraticCurveTo(40, -84, 58, -30);
          x.closePath(); x.fill();
          x.strokeStyle = 'rgba(138,102,40,0.7)'; x.lineWidth = 2;
          const rh = mulberry(8191);
          for (let i = 0; i < 14; i++) {
            const hx2 = -50 + rh() * 100, hy2 = -70 + rh() * 36;
            x.beginPath(); x.moveTo(hx2, hy2); x.lineTo(hx2 + 14, hy2 + 5); x.stroke();
          }
          snowBand(x, [[-52, -60], [0, -76], [50, -56]], 9, 8192, '#f4f8fd', '#b9cbe4');
          // kolo
          x.fillStyle = '#57432a';
          x.beginPath(); x.arc(-30, 12, 20, 0, TAU); x.fill();
          x.fillStyle = '#8a6a42';
          x.beginPath(); x.arc(-30, 12, 8, 0, TAU); x.fill();
          x.restore();

          /* --- závěj vpravo dole (walkBehind) --- */
          x.fillStyle = lg(x, 0, 1020, 0, H, [[0, '#f7fafd'], [1, '#b6c8e4']]);
          x.beginPath();
          x.moveTo(2380, 1080);
          x.quadraticCurveTo(2440, 1024, 2530, 1034);
          x.quadraticCurveTo(2580, 1040, 2600, 1052);
          x.lineTo(2600, 1080);
          x.closePath(); x.fill();
          scumble(x, 2390, 1030, 210, 50, 8195, 30, ['#ffffff', '#dfe9f7'], 5, 14, 0.5);
          // stánek — kontaktní stín pod pultem
          contactShadow(x, 1128, 1074, 210, 14, 0.9);
          // globální malířské zrno
          grain(x, SW, H, 0.05);
        }
      },
      { // POPŘEDÍ (parallax > 1) — kulisy před hráčem: saně, pytle se
        // sudem, vozík. Tmavší a chladnější valéry = hloubka obrazu.
        parallax: 1.16,
        walkBehind: [
          [[0, 1080], [0, 952], [352, 952], [368, 1080]],
          [[872, 1080], [884, 996], [1084, 996], [1096, 1080]],
          [[1450, 1080], [1476, 1038], [1820, 1038], [1846, 1080]],
          [[2270, 1080], [2292, 936], [2600, 936], [2600, 1080]]
        ],
        paint(x) {
          /* --- vlevo: opřené selské saně + navátá závěj (ořez rámem) --- */
          x.save();
          x.translate(150, 1046);
          x.rotate(-0.06);
          x.fillStyle = '#4a3826';
          fillP(x, [[-140, 0], [130, -12], [136, 8], [-140, 22]], '#4a3826');
          fillP(x, [[-132, -30], [122, -40], [126, -24], [-134, -12]], '#57432a');
          x.strokeStyle = '#33241a'; x.lineWidth = 7;
          for (const kx2 of [-96, -12, 78]) {
            x.beginPath(); x.moveTo(kx2, -34); x.lineTo(kx2 + 6, 6); x.stroke();
          }
          // skluznice zahnutá vzhůru
          x.strokeStyle = '#2c2c34'; x.lineWidth = 8; x.lineCap = 'round';
          x.beginPath();
          x.moveTo(-142, 26); x.lineTo(120, 12);
          x.quadraticCurveTo(160, 8, 164, -28);
          x.stroke();
          snowBand(x, [[-130, -44], [120, -54]], 10, 8801, '#eef4fb', '#a9bce0');
          x.restore();
          x.fillStyle = lg(x, 0, 1000, 0, H, [[0, '#e8eef8'], [1, '#a6b8da']]);
          x.beginPath();
          x.moveTo(0, 1080); x.lineTo(0, 1002);
          x.quadraticCurveTo(120, 1032, 250, 1052);
          x.quadraticCurveTo(320, 1062, 360, 1080);
          x.closePath(); x.fill();
          scumble(x, 4, 1010, 340, 62, 8802, 46, ['#f6f9fd', '#c2d0e8', '#9ab0d6'], 4, 13, 0.5);

          /* --- střed-levá: sud a pytle u ohně (trhovecké zázemí) --- */
          x.save();
          x.translate(975, 1050);
          contactShadow(x, 0, 20, 100, 14, 1.1, '40,48,80');
          // sud s obručemi
          x.fillStyle = lg(x, -60, 0, -10, 0, [[0, '#5a4226'], [0.5, '#6e5138'], [1, '#3c2a16']]);
          x.beginPath(); x.ellipse(-42, -18, 27, 36, 0.03, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(20,12,6,0.85)'; x.lineWidth = 3;
          x.beginPath(); x.ellipse(-42, -18, 27, 36, 0.03, 0, TAU); x.stroke();
          x.strokeStyle = '#57575f'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(-68, -32); x.lineTo(-16, -34); x.stroke();
          x.beginPath(); x.moveTo(-69, -4); x.lineTo(-15, -6); x.stroke();
          snowBand(x, [[-64, -52], [-20, -54]], 8, 8803, '#eef4fb', '#a9bce0');
          // dva pytle — jeden povalený
          x.fillStyle = '#8a7452';
          x.beginPath();
          x.moveTo(-4, 16); x.quadraticCurveTo(-12, -38, 16, -44);
          x.quadraticCurveTo(46, -40, 42, 16);
          x.closePath(); x.fill();
          x.strokeStyle = 'rgba(30,20,8,0.6)'; x.lineWidth = 2.6;
          x.beginPath(); x.moveTo(-4, 16); x.quadraticCurveTo(-12, -38, 16, -44); x.stroke();
          x.fillStyle = '#7a6446';
          x.beginPath(); x.ellipse(72, 4, 34, 17, -0.12, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(30,20,8,0.55)'; x.lineWidth = 2.4;
          x.beginPath(); x.ellipse(72, 4, 34, 17, -0.12, 0, TAU); x.stroke();
          x.strokeStyle = '#57432a'; x.lineWidth = 3;              // zavázaný krk
          x.beginPath(); x.moveTo(16, -46); x.lineTo(16, -54); x.stroke();
          x.fillStyle = '#57432a';
          x.beginPath(); x.ellipse(16, -48, 7, 4, 0, 0, TAU); x.fill();
          x.restore();

          /* --- střed-pravá: nízká navátá vlna přes spodní okraj --- */
          x.fillStyle = lg(x, 0, 1038, 0, H, [[0, '#eaf0f9'], [1, '#a8bad8']]);
          x.beginPath();
          x.moveTo(1450, 1080);
          x.quadraticCurveTo(1560, 1042, 1680, 1052);
          x.quadraticCurveTo(1780, 1060, 1846, 1080);
          x.closePath(); x.fill();
          scumble(x, 1470, 1044, 350, 34, 8804, 30, ['#f6f9fd', '#c2d0e8'], 4, 12, 0.45);

          /* --- vpravo: dvoukolový ruční vozík s nákladem --- */
          x.save();
          x.translate(2440, 1030);
          contactShadow(x, -10, 42, 150, 16, 1.2, '40,48,80');
          // oj opřená o zem (diagonála!)
          x.strokeStyle = '#4a3826'; x.lineWidth = 9; x.lineCap = 'round';
          x.beginPath(); x.moveTo(-64, -22); x.lineTo(-172, 40); x.stroke();
          // korba
          x.fillStyle = lg(x, 0, -70, 0, 10, [[0, '#6e5138'], [1, '#42301c']]);
          fillP(x, [[-92, -18], [96, -26], [86, -68], [-84, -60]], x.fillStyle);
          x.strokeStyle = '#2c1c0c'; x.lineWidth = 3;
          P(x, [[-92, -18], [96, -26], [86, -68], [-84, -60]]); x.stroke();
          x.strokeStyle = 'rgba(24,14,6,0.6)'; x.lineWidth = 2.4;  // prkna
          for (let k = 1; k < 4; k++) {
            x.beginPath();
            x.moveTo(-90 + k * 2, -18 - k * 11);
            x.lineTo(94 - k * 2, -26 - k * 11);
            x.stroke();
          }
          // náklad: pytel + bečka + roura sena
          x.fillStyle = '#8a7452';
          x.beginPath(); x.ellipse(-38, -72, 30, 20, -0.15, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(30,20,8,0.55)'; x.lineWidth = 2.4;
          x.beginPath(); x.ellipse(-38, -72, 30, 20, -0.15, 0, TAU); x.stroke();
          x.fillStyle = '#57432a';
          x.beginPath(); x.ellipse(34, -80, 22, 26, 0.1, 0, TAU); x.fill();
          x.strokeStyle = '#2c1c0c'; x.lineWidth = 2.6;
          x.beginPath(); x.ellipse(34, -80, 22, 26, 0.1, 0, TAU); x.stroke();
          x.strokeStyle = '#57575f'; x.lineWidth = 3;
          x.beginPath(); x.moveTo(13, -88); x.lineTo(55, -84); x.stroke();
          snowBand(x, [[-70, -90], [-6, -94], [50, -102]], 9, 8805, '#eef4fb', '#a9bce0');
          // velké loukoťové kolo
          x.fillStyle = '#3c2c1a';
          x.beginPath(); x.arc(6, 4, 46, 0, TAU); x.fill();
          x.fillStyle = '#57432a';
          x.beginPath(); x.arc(6, 4, 38, 0, TAU); x.fill();
          x.fillStyle = '#3c2c1a';
          x.beginPath(); x.arc(6, 4, 9, 0, TAU); x.fill();
          x.strokeStyle = '#2c1c0c'; x.lineWidth = 4;
          for (let k = 0; k < 6; k++) {
            const a2 = k / 6 * TAU + 0.4;
            x.beginPath(); x.moveTo(6, 4);
            x.lineTo(6 + Math.cos(a2) * 38, 4 + Math.sin(a2) * 38);
            x.stroke();
          }
          x.strokeStyle = '#2c2c34'; x.lineWidth = 5;               // obruč
          x.beginPath(); x.arc(6, 4, 46, 0, TAU); x.stroke();
          x.restore();
          // závěj u pravého okraje přes vozík
          x.fillStyle = lg(x, 0, 1010, 0, H, [[0, '#edf2fa'], [1, '#a6b8da']]);
          x.beginPath();
          x.moveTo(2600, 1080); x.lineTo(2600, 1016);
          x.quadraticCurveTo(2520, 1030, 2430, 1056);
          x.quadraticCurveTo(2360, 1072, 2320, 1080);
          x.closePath(); x.fill();
          scumble(x, 2360, 1024, 240, 50, 8806, 36, ['#f6f9fd', '#c2d0e8', '#9ab0d6'], 4, 13, 0.5);
        }
      }
    ],
    dynamic(ctx, t, camX) {
      /* vrány na hřebeni střechy — poposedají, krákají, občas přeletí */
      {
        const ridge = [[760, 352], [806, 344], [980, 372]];
        const cyc = t % 34;
        for (let i = 0; i < 3; i++) {
          if (i === 1 && cyc > 20 && cyc < 27) { // prostřední letí na kostel
            const p = (cyc - 20) / 7;
            const bx = lerp(806, 1640, p);
            const by = lerp(344, 470, p) - Math.sin(p * Math.PI) * 160;
            flyBird(ctx, bx, by, 0.9, t * 13, 'rgba(28,30,40,0.95)');
          } else {
            const hop = (Math.sin(t * (3.4 + i) + i * 2.1) > 0.92) ? 7 : 0;
            const caw = (Math.sin(t * 0.5 + i * 4) > 0.97);
            perchBird(ctx, ridge[i][0], ridge[i][1], 1.05, i % 2 ? -1 : 1, hop, '#1c1e28');
            if (caw) {
              ctx.fillStyle = 'rgba(28,30,40,0.6)';
              ctx.font = 'bold 15px Georgia, serif';
              ctx.fillText('krá!', ridge[i][0] + 14, ridge[i][1] - 34);
            }
          }
        }
        // kroužící ptáci vysoko (vrstva nebe)
        ctx.save();
        ctx.translate(camX * (1 - 0.25), 0);
        for (let i = 0; i < 3; i++) {
          const a = t * 0.22 + i * 2.1;
          flyBird(ctx, 1100 + Math.cos(a) * (170 + i * 30), 240 + Math.sin(a * 1.3) * 46, 0.55, t * 9 + i * 2, 'rgba(70,84,104,0.7)');
        }
        ctx.restore();
      }

      /* oheň v koši + tetelení vzduchu */
      fireDyn(ctx, t, 706, 976, 0.9, 8.8);
      for (let i = 0; i < 3; i++) {
        const wob = Math.sin(t * 3 + i * 2.1) * 6;
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(706 + wob + (i - 1) * 16, 880 - i * 46, 13, 30, Math.sin(t * 2 + i) * 0.3, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* šály a prádlo na šňůře mezi stánkem a podloubím */
      {
        const x0 = 1316, y0 = 700, x1 = 1452, y1 = 682;
        ctx.strokeStyle = 'rgba(60,44,26,0.9)'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 26, x1, y1); ctx.stroke();
        const cols = ['#a63a2e', '#3e5a6a', '#c9a24a'];
        for (let i = 0; i < 3; i++) {
          const tt = 0.2 + i * 0.3;
          const px = lerp(x0, x1, tt);
          const py = lerp(y0, y1, tt) + 24 * Math.sin(Math.PI * tt);
          const sway = Math.sin(t * 2.6 + i * 1.8) * 9 + Math.sin(t * 4.1 + i) * 4;
          ctx.fillStyle = cols[i];
          ctx.beginPath();
          ctx.moveTo(px - 15, py);
          ctx.lineTo(px + 15, py);
          ctx.lineTo(px + 11 + sway, py + 58);
          ctx.lineTo(px - 13 + sway, py + 54);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          ctx.fillRect(px - 15, py, 30, 6);
        }
      }

      /* houpající se vývěsní štíty (preclík, bota) */
      for (const [sx, sy, kind] of [[586, 660, 0], [2176, 672, 1]]) {
        const sw = Math.sin(t * 1.9 + sx) * 0.09;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sw);
        ctx.strokeStyle = '#57575f'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-8, 18); ctx.moveTo(8, 0); ctx.lineTo(8, 18); ctx.stroke();
        if (kind === 0) { // preclík
          ctx.fillStyle = '#c98a3e';
          ctx.beginPath(); ctx.arc(0, 40, 22, 0, TAU); ctx.fill();
          ctx.fillStyle = '#8a5a22';
          ctx.beginPath(); ctx.arc(-7, 42, 6.5, 0, TAU); ctx.arc(7, 42, 6.5, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(0, 33, 5.5, 0, TAU); ctx.fill();
        } else { // bota
          ctx.fillStyle = '#5c422a';
          ctx.beginPath();
          ctx.moveTo(-8, 22); ctx.lineTo(8, 22); ctx.lineTo(8, 52);
          ctx.quadraticCurveTo(26, 50, 26, 62);
          ctx.lineTo(-8, 64);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      /* kolemjdoucí měšťka — pozadím ~ každých 90 s */
      {
        const per = 90, dur = 22;
        const cyc = Math.floor(t / per), ph = t % per;
        if (ph < dur) {
          const p = ph / dur;
          const dir = cyc % 2 ? -1 : 1;
          const bx = dir > 0 ? lerp(320, 2340, p) : lerp(2340, 320, p);
          const by = 848;
          const step = Math.sin(t * 7) * 3;
          ctx.save();
          ctx.translate(bx, by);
          ctx.scale(dir * 0.62, 0.62);
          // sukně
          ctx.fillStyle = '#4e3e6a';
          ctx.beginPath();
          ctx.moveTo(-22, 0); ctx.quadraticCurveTo(0, -84, 20, 0);
          ctx.closePath(); ctx.fill();
          // živůtek + vlňák
          ctx.fillStyle = '#7a3a2e';
          ctx.fillRect(-13, -118, 26, 44);
          ctx.beginPath(); ctx.moveTo(-13, -114); ctx.lineTo(-26, -66); ctx.lineTo(-4, -74); ctx.closePath(); ctx.fill();
          // hlava v šátku
          ctx.fillStyle = '#e4b083';
          ctx.beginPath(); ctx.arc(2, -132, 13, 0, TAU); ctx.fill();
          ctx.fillStyle = '#c9a24a';
          ctx.beginPath(); ctx.arc(0, -136, 13.6, Math.PI * 0.85, Math.PI * 2.05); ctx.fill();
          // nůše
          ctx.fillStyle = '#8a6a42';
          fillP(ctx, [[-38, -102], [-20, -108], [-16, -66], [-40, -62]], '#8a6a42');
          // krok
          ctx.strokeStyle = '#241812'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(-6 + step, 0); ctx.lineTo(-6 + step, 8); ctx.moveTo(8 - step, 0); ctx.lineTo(8 - step, 8); ctx.stroke();
          ctx.restore();
          // pára od úst
          const bl = (t * 0.8) % 1;
          mistPuff(ctx, bx + dir * (14 + bl * 16), by - 84 - bl * 8, 8 + bl * 12, 5 + bl * 7, '240,246,252', 0.16 * (1 - bl));
        }
      }

      /* kouř z komínů */
      for (let i = 0; i < CHIM.length; i++) {
        smokeDyn(ctx, t, CHIM[i][0], CHIM[i][1], i * 2 + 1, 1.1, '214,220,232', 0.2, 26);
      }

      /* třpyt sněhu ve slunci */
      sparkleDyn(ctx, t, 8301, 22, 300, 850, 2100, 200, '255,255,255');
      sparkleDyn(ctx, t, 8302, 8, 1520, -50, 800, 300, '255,252,240');

      /* sníh — jen lehounké chumelení */
      snowDyn(ctx, t, SW, 8401, 50, 10, '#f2f7fd');
    },
    overlayDynamic(ctx, t, camX) {
      ctx.save();
      ctx.translate(camX || 0, 0); // screen-space efekty
      // občasný poryv — zvířený sníh (~ každých 26 s)
      const per = 26, ph = t % per;
      if (ph < 3.2) {
        const p = ph / 3.2;
        const a = Math.sin(p * Math.PI) * 0.5;
        const r = mulberry(8402);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
          const fy = 300 + r() * 700 + Math.sin(t * 3 + i) * 20;
          const fx = ((r() * (W + 400)) + p * 1600 + i * 12) % (W + 400) - 200;
          ctx.globalAlpha = a * (0.3 + r() * 0.5);
          ctx.beginPath(); ctx.ellipse(fx, fy, 6 + r() * 8, 1.6, 0.08, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // jasná studená vinětace
      const vg = ctx.createRadialGradient(W / 2, H * 0.44, 460, W / 2, H * 0.5, 1350);
      vg.addColorStop(0, 'rgba(30,40,70,0)');
      vg.addColorStop(1, 'rgba(30,40,70,0.22)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
    walkArea: [[210, 850], [2420, 850], [2560, 880], [2560, 1030], [900, 1030], [860, 995], [660, 995], [620, 1030], [180, 1030], [130, 900]],
    scaleAt(y) { return clamp(0.5 + 0.56 * (y - 820) / 220, 0.44, 1.08); },
    exits: [
      { to: 'castle_yard', at: [190, 840], spawn: [260, 920], label: { cz: 'Cesta vzhůru k zámku', en: 'Road up to the castle' } },
      { to: 'river_bank', at: [2510, 880], spawn: [300, 940], label: { cz: 'Ulička k řece', en: 'Lane to the river' } }
    ],
    actors: [{ id: 'trhovkyne', x: 1120, y: 940, dir: 1 }]
  });
})();

/* =========================================================================
   SCÉNA: old_town — Staré Benátky, modrá hodinka (2400)
   ========================================================================= */
(function () {
  const SW = 2400;
  // teplá okna chalup [x, y, w, h, fáze]
  // POZOR: WINS je jediný zdroj pravdy pro svítící tabulky, okenice
  // i louže světla — souřadnice MUSÍ sedět na otvory ve statických fasádách:
  // [0..1] chalupa 1 (stěna 380–600, dveře ~474–526), [2..3] chalupa 2 (660–890),
  // [4] tkalcovna vlevo od velkého okna (970–1030), [5] tkalcovna vpravo od
  // dveří (1256–1300), [6] dům vpravo, [7] vikýř chalupy 2 (otvor 792–812, 606–632)
  const WINS = [
    [420, 742, 34, 44, 0.3], [545, 746, 30, 40, 1.7], [700, 738, 36, 46, 2.9],
    [820, 744, 30, 40, 4.1], [985, 702, 32, 44, 0.9], [1263, 704, 28, 40, 5.3],
    [2110, 726, 32, 44, 2.2], [794, 607, 17, 21, 3.6]
  ];
  const CHIM = [[470, 618], [760, 606], [1120, 560], [2150, 610]];

  BNJ.registerScene({
    id: 'old_town',
    width: SW,
    name: { cz: 'Staré Benátky', en: 'Old Benátky' },
    lightTint: 'rgba(96,116,190,0.14)',
    spawn: [280, 930],
    layers: [
      { // soumračné nebe s prvními hvězdami
        parallax: 0.2,
        paint(x) {
          x.fillStyle = lg(x, 0, 0, 0, 820, [[0, '#1e2c50'], [0.3, '#2c3e66'], [0.6, '#7a5a78'], [0.85, '#d88a5a'], [1, '#e8a468']]);
          x.fillRect(0, 0, SW, 820);
          x.fillStyle = '#e8a468'; x.fillRect(0, 800, SW, 300);
          const r = mulberry(9001);
          x.fillStyle = '#f5f0dc';
          for (let i = 0; i < 90; i++) {
            x.globalAlpha = 0.15 + r() * 0.5;
            x.beginPath(); x.arc(r() * SW, r() * 360, 0.5 + r() * 1.2, 0, TAU); x.fill();
          }
          x.globalAlpha = 1;
          // pásy soumračných mraků — měkké závoje bez tvrdých hran + dvoutónové hřbety
          softCloud(x, 600, 430, 1.9, '74,62,100', 0.5, 91);
          softCloud(x, 1500, 380, 2.2, '85,63,96', 0.45, 92);
          softCloud(x, 2100, 470, 1.6, '106,70,96', 0.42, 93);
          softCloud(x, 1000, 520, 1.9, '138,85,96', 0.34, 94);
          softCloud(x, 300, 500, 1.6, '150,95,90', 0.3, 95);
          cloud2(x, 1500, 372, 1.8, '#8a6a8c', '#3e3458', 0.35, 96, 1);
          cloud2(x, 620, 424, 1.5, '#7a5a7e', '#382f52', 0.35, 97, 1);
          // růžový podsvit od zapadlého slunce u obzoru
          mistPuff(x, 1200, 720, 900, 130, '232,164,104', 0.30);
          mistPuff(x, 400, 740, 700, 110, '216,138,90', 0.24);
          // srpek měsíce se stínovou stranou a halem
          glow(x, 1872, 194, 130, '240,230,200', 0.20);
          x.fillStyle = '#f0e6c8';
          x.beginPath(); x.arc(1880, 190, 34, 0, TAU); x.fill();
          x.fillStyle = 'rgba(210,196,150,0.6)';
          x.beginPath(); x.arc(1868, 196, 5, 0, TAU); x.fill();
          x.beginPath(); x.arc(1876, 208, 4, 0, TAU); x.fill();
          x.fillStyle = '#26345c';
          x.beginPath(); x.arc(1894, 182, 30, 0, TAU); x.fill();
          grain(x, SW, 820, 0.04);
        }
      },
      { // protější břeh: Nové Benátky se zámkem + řeka
        parallax: 0.5,
        paint(x) {
          const r = mulberry(9002);
          // návrší s Novými Benátkami
          x.fillStyle = '#242e50';
          x.beginPath();
          x.moveTo(0, 630);
          x.quadraticCurveTo(500, 470, 1100, 480);
          x.quadraticCurveTo(1800, 490, 2400, 610);
          x.lineTo(2400, 660); x.lineTo(0, 660);
          x.closePath(); x.fill();
          // město na kopci — silueta se svítícími okny
          x.fillStyle = '#1c2544';
          for (let i = 0; i < 14; i++) {
            const hx = 160 + i * 160 + r() * 40;
            const hw = 70 + r() * 60, hh = 40 + r() * 40;
            const base = 520 + Math.abs(1100 - hx) * 0.04;
            // spodek protažen o 44 px POD hřeben návrší — jinak krajní domy
            // (hlavně první vlevo) visely nad terénem, hřeben tam klesá níž
            fillP(x, [[hx, base + 44], [hx, base - hh], [hx + hw / 2, base - hh - 24], [hx + hw, base - hh], [hx + hw, base + 44]], '#1c2544');
            if (r() > 0.35) {
              x.fillStyle = '#ffcf6e';
              x.fillRect(hx + 10 + r() * (hw - 26), base - hh + 8 + r() * (hh - 20), 7, 10);
              x.fillStyle = '#1c2544';
            }
          }
          // zámek s věží (silueta)
          x.fillStyle = '#161e3a';
          x.fillRect(950, 380, 300, 120);
          x.fillRect(1060, 280, 62, 110);
          x.beginPath();
          x.moveTo(1054, 280);
          x.bezierCurveTo(1046, 250, 1072, 244, 1091, 226);
          x.bezierCurveTo(1110, 244, 1136, 250, 1128, 280);
          x.closePath(); x.fill();
          x.fillStyle = '#ffcf6e';
          x.fillRect(985, 420, 10, 14); x.fillRect(1090, 320, 9, 13); x.fillRect(1180, 424, 10, 14);
          glow(x, 1090, 330, 60, '255,207,110', 0.16);
          // kostelní věž Nových Benátek
          x.fillStyle = '#161e3a';
          x.fillRect(1560, 350, 44, 140);
          fillP(x, [[1550, 350], [1582, 296], [1614, 350]], '#161e3a');
          // řeka pod svahem (odrazy dynamicky)
          x.fillStyle = lg(x, 0, 660, 0, 800, [[0, '#3a4a74'], [0.5, '#2c3a60'], [1, '#232e50']]);
          x.fillRect(0, 660, SW, 140);
          // ledové kry u břehů
          x.fillStyle = 'rgba(150,170,210,0.4)';
          for (let i = 0; i < 16; i++) {
            x.beginPath();
            x.ellipse(r() * SW, 668 + r() * 20, 24 + r() * 30, 7 + r() * 4, 0, 0, TAU);
            x.fill();
            x.beginPath();
            x.ellipse(r() * SW, 762 + r() * 26, 30 + r() * 36, 8 + r() * 5, 0, 0, TAU);
            x.fill();
          }
        },
        // dynamický pass VRSTVY (kreslí ho engine hned nad touto statikou,
        // tj. ZA chalupami popředí) — dřív byl ve scénovém dynamic() a odlesky
        // se malovaly přes fasády → „průhledné domy“
        dynamic(ctx, t) {
          /* odrazy světel na řece — chvějivé sloupce */
          const lights = [[990, 425], [1095, 325], [1185, 428], [420, 462], [760, 452], [1420, 448], [2020, 470]];
          for (let i = 0; i < lights.length; i++) {
            const lx = lights[i][0] + 5;
            const wob = Math.sin(t * 1.8 + i * 2.4) * 4;
            ctx.fillStyle = 'rgba(255,207,110,0.14)';
            for (let k = 0; k < 5; k++) {
              const yy = 668 + k * 24;
              const ww = 10 - k * 1.4 + Math.sin(t * 2.6 + k + i) * 2.5;
              ctx.fillRect(lx - ww / 2 + wob * (k * 0.4), yy, ww, 13);
            }
          }
          // pomalé proudění
          ctx.strokeStyle = 'rgba(150,170,220,0.14)'; ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const yy = 680 + i * 22;
            const off = (t * (9 + i * 3)) % 300;
            for (let px = -300 + off; px < SW; px += 300) {
              ctx.beginPath();
              ctx.moveTo(px, yy);
              ctx.quadraticCurveTo(px + 46, yy - 2.4, px + 92, yy);
              ctx.stroke();
            }
          }
        }
      },
      { // zasněžené zahrady a ploty za chalupami
        parallax: 0.8,
        paint(x) {
          const r = mulberry(9050);
          x.fillStyle = lg(x, 0, 780, 0, 860, [[0, '#5a6a94'], [1, '#46557e']]);
          x.fillRect(0, 790, SW, 80);
          snowBand(x, [[0, 792], [SW, 792]], 18, 9051, '#a9b8dc', '#5c6c98');
          // ploty
          x.strokeStyle = '#333048'; x.lineWidth = 4;
          for (let i = 0; i < 60; i++) {
            const fx = i * 42 + r() * 8;
            x.beginPath(); x.moveTo(fx, 838); x.lineTo(fx + 2, 796 + r() * 8); x.stroke();
          }
          x.strokeStyle = '#3a3752'; x.lineWidth = 5;
          x.beginPath(); x.moveTo(0, 812); x.lineTo(SW, 806); x.stroke();
          // ovocné stromky
          for (let i = 0; i < 6; i++) {
            bareTree(x, 200 + i * 420 + r() * 80, 800, 100 + r() * 40, 9060 + i, '#2c2a42', (r() - 0.5) * 0.6);
          }
        }
      },
      { // 1.0 — náves: chalupy, tkalcovna, zvonice, krčma, Bendův plácek
        parallax: 1,
        walkBehind: [
          // roh chalupy vlevo (hráč vychází zpoza něj)
          [[0, 1080], [0, 620], [236, 640], [244, 1080]],
          // hranice dříví vpravo dole
          [[2178, 1080], [2186, 1006], [2378, 1006], [2390, 1080]]
        ],
        paint(x) {
          const r = mulberry(9100);
          /* --- modrý sníh návsi — 3 hodnotové zóny --- */
          x.fillStyle = lg(x, 0, 800, 0, H, [[0, '#7e90c0'], [0.28, '#c8d4ec'], [0.6, '#a8b8e0'], [1, '#7688b8']]);
          x.fillRect(0, 820, SW, H - 820);
          // dohasínající růžový odlesk soumraku na sněhu (zleva)
          x.fillStyle = lg(x, 0, 0, 1100, 0, [[0, 'rgba(226,150,110,0.14)'], [1, 'rgba(226,150,110,0)']]);
          x.fillRect(0, 820, 1100, H - 820);
          scumble(x, 0, 820, SW, 260, 9101, 620, ['#d4defc', '#a2b2dc', '#e2eafd', '#7e90c0', '#c8b0c0'], 3, 12, 0.45);
          trodden(x, 260, 940, 1800, 950, 90, 9102, 'rgba(94,110,160,0.5)');
          trodden(x, 1800, 950, 2300, 910, 60, 9103, 'rgba(94,110,160,0.5)');
          // teplé louže světla z oken na sněhu — VRSTVENÉ ELIPSY s rozpadlou
          // hranou (žádný polygon): studený okraj → teplé jádro, hrany
          // rozbité scumble ťupkami teplými ven a sněhově modrými dovnitř
          for (const wn of WINS) {
            if (wn[1] > 700) {
              const rw2 = mulberry(wn[0]);
              const cx2 = wn[0] + wn[2] / 2;
              const cy2 = wn[1] + wn[3] + 8;
              const tilt = (rw2() - 0.5) * 0.1; // každá kaluž jinak natočená
              const len = 130 + rw2() * 55; // dosah po sněhu
              // 3 překryté elipsy: velká studenější → malá teplé jádro
              const pools = [
                [len, 0.62, '236,186,120', 0.07],
                [len * 0.66, 0.52, '255,199,110', 0.13],
                [len * 0.36, 0.44, '255,218,140', 0.18]
              ];
              for (const [pl, sq, rgb, pa] of pools) {
                x.save();
                x.translate(cx2 + tilt * pl * 0.6, cy2 + pl * 0.52);
                x.rotate(tilt * 0.3);
                x.globalAlpha = pa;
                x.fillStyle = 'rgba(' + rgb + ',1)';
                x.beginPath();
                x.ellipse(0, 0, wn[2] * 0.9 + pl * 0.55, pl * sq, 0, 0, TAU);
                x.fill();
                x.restore();
              }
              x.globalAlpha = 1;
              // rozpad hrany: teplé ťupky ven z okraje…
              for (let k = 0; k < 12; k++) {
                const a2 = rw2() * TAU;
                const er = (wn[2] * 0.9 + len * 0.55) * (0.82 + rw2() * 0.36);
                x.fillStyle = 'rgba(255,199,110,' + (0.04 + rw2() * 0.05).toFixed(2) + ')';
                x.beginPath();
                x.ellipse(cx2 + Math.cos(a2) * er, cy2 + len * 0.52 + Math.sin(a2) * len * 0.58,
                  6 + rw2() * 10, 2.6 + rw2() * 3, tilt, 0, TAU);
                x.fill();
              }
              // …a sněhově modré zákusy dovnitř (stopa boří hranu)
              for (let k = 0; k < 7; k++) {
                const a2 = rw2() * TAU;
                const er = (wn[2] * 0.9 + len * 0.5) * (0.62 + rw2() * 0.42);
                x.fillStyle = 'rgba(150,166,214,' + (0.06 + rw2() * 0.06).toFixed(2) + ')';
                x.beginPath();
                x.ellipse(cx2 + Math.cos(a2) * er, cy2 + len * 0.52 + Math.sin(a2) * len * 0.5,
                  7 + rw2() * 9, 3 + rw2() * 3, -tilt, 0, TAU);
                x.fill();
              }
              // teplé jiskření krystalků jen v jádru
              x.fillStyle = 'rgba(255,228,160,0.4)';
              for (let k = 0; k < 6; k++) {
                x.beginPath();
                x.ellipse(cx2 + (rw2() - 0.5) * 50, cy2 + 26 + rw2() * len * 0.6,
                  2.4 + rw2() * 3.6, 1.4 + rw2() * 1.6, 0, 0, TAU);
                x.fill();
              }
            }
          }

          /* --- roubená chalupa vlevo (roh, walkBehind) --- */
          x.fillStyle = '#3c3450';
          x.fillRect(0, 620, 240, 460);
          // roubení — vodorovné trámy
          for (let i = 0; i < 9; i++) {
            x.fillStyle = i % 2 ? '#443a58' : '#38304c';
            x.fillRect(0, 640 + i * 46, 240, 40);
            x.fillStyle = 'rgba(20,16,32,0.6)';
            x.fillRect(0, 678 + i * 46, 240, 6);
          }
          fillP(x, [[0, 624], [0, 520], [250, 610], [250, 640]], '#2c2740');
          snowBand(x, [[0, 522], [246, 610]], 16, 9111, '#c8d4ec', '#6a7aa8');
          icicles(x, 4, 240, 630, 9112, 30);

          /* --- chalupy středu návsi — každá jiná (odstín, hřeben, okenice, vikýř) --- */
          const cottage = (cx, cw, chh, seed, hasDoor, opts) => {
            const rr2 = mulberry(seed);
            opts = opts || {};
            const baseY = 840;
            const colA = opts.colA || '#4c4058', colB = opts.colB || '#443a50';
            // stěna z trámů
            for (let i = 0; i < ((chh / 42) | 0) + 1; i++) {
              x.fillStyle = i % 2 ? colA : colB;
              x.fillRect(cx, baseY - chh + i * 42, cw, 38);
              x.fillStyle = 'rgba(24,18,34,0.55)';
              x.fillRect(cx, baseY - chh + i * 42 + 36, cw, 5);
            }
            scumble(x, cx, baseY - chh, cw, chh, seed + 4, 60, ['rgba(120,108,140,0.5)', 'rgba(30,24,46,0.5)'], 3, 10, 0.3);
            // mechové spáry
            x.fillStyle = 'rgba(110,120,90,0.4)';
            for (let i = 0; i < 8; i++) x.fillRect(cx + rr2() * cw, baseY - chh + rr2() * chh, 14, 3);
            // střecha — hřeben rovný, nebo prohnutý stářím (sag)
            const peakY = baseY - chh - 90 - rr2() * 24;
            const sag = opts.sag || 0;
            x.fillStyle = opts.roofCol || '#332c44';
            x.beginPath();
            x.moveTo(cx - 30, baseY - chh);
            x.quadraticCurveTo(cx + cw * 0.28, peakY + sag * 0.4, cx + cw / 2, peakY + sag);
            x.quadraticCurveTo(cx + cw * 0.72, peakY + sag * 0.4, cx + cw + 30, baseY - chh);
            x.closePath(); x.fill();
            snowBand(x, [[cx - 22, baseY - chh - 6], [cx + cw * 0.28, peakY + 24 + sag * 0.5], [cx + cw / 2, peakY + 6 + sag], [cx + cw * 0.72, peakY + 24 + sag * 0.5], [cx + cw + 22, baseY - chh - 6]], 18, seed + 1, '#d8e2f6', '#7c8cba');
            // vikýř
            if (opts.dormer) {
              const dx2 = cx + cw * 0.62;
              x.fillStyle = colB;
              x.fillRect(dx2 - 20, baseY - chh - 52, 40, 40);
              fillP(x, [[dx2 - 27, baseY - chh - 52], [dx2, baseY - chh - 76], [dx2 + 27, baseY - chh - 52]], opts.roofCol || '#332c44');
              snowBand(x, [[dx2 - 22, baseY - chh - 55], [dx2, baseY - chh - 72], [dx2 + 22, baseY - chh - 55]], 7, seed + 3, '#d8e2f6', '#7c8cba');
              x.fillStyle = '#1c1830';
              x.fillRect(dx2 - 10, baseY - chh - 44, 20, 26);
            }
            icicles(x, cx - 22, cx + cw + 22, baseY - chh + 2, seed + 2, opts.icy ? 34 : 24);
            // dveře
            if (hasDoor) {
              // doorDx: posun dveří, ať nekolidují s okenicemi oken z WINS
              const doorX = cx + cw / 2 - 26 + (opts.doorDx || 0);
              x.fillStyle = '#2c2036';
              x.fillRect(doorX, baseY - 96, 52, 96);
              x.strokeStyle = '#1a1226'; x.lineWidth = 3;
              x.strokeRect(doorX, baseY - 96, 52, 96);
            }
            // okenice u oken chalupy
            if (opts.shutter) {
              for (const wn of WINS) {
                if (wn[0] > cx && wn[0] + wn[2] < cx + cw && wn[1] > baseY - chh) {
                  x.fillStyle = '#5e4a38';
                  x.fillRect(wn[0] - 14, wn[1] - 3, 11, wn[3] + 6);
                  x.fillRect(wn[0] + wn[2] + 3, wn[1] - 3, 11, wn[3] + 6);
                  x.strokeStyle = 'rgba(26,18,12,0.7)'; x.lineWidth = 1.6;
                  x.strokeRect(wn[0] - 14, wn[1] - 3, 11, wn[3] + 6);
                  x.strokeRect(wn[0] + wn[2] + 3, wn[1] - 3, 11, wn[3] + 6);
                }
              }
            }
          };
          cottage(380, 220, 180, 9121, true, { shutter: true, sag: 14, doorDx: 10, colA: '#524464', colB: '#463c54' });
          cottage(660, 230, 190, 9126, false, { dormer: true, icy: true, colA: '#48405c', colB: '#3e3650', roofCol: '#2e2a46' });

          /* --- TKALCOVNA (větší stavení se širokým oknem) --- */
          x.save();
          const tx = 970;
          for (let i = 0; i < 7; i++) {
            x.fillStyle = i % 2 ? '#544666' : '#4a3e5c';
            x.fillRect(tx, 588 + i * 38, 330, 34);
            x.fillStyle = 'rgba(24,18,34,0.5)';
            x.fillRect(tx, 620 + i * 38, 330, 5);
          }
          fillP(x, [[tx - 34, 588], [tx + 165, 470], [tx + 364, 588]], '#3a3350');
          snowBand(x, [[tx - 26, 582], [tx + 165, 478], [tx + 356, 582]], 20, 9131, '#d8e2f6', '#7c8cba');
          // široké okno dílny — uvnitř silueta tkalcovského stavu
          x.fillStyle = '#ffb75e';
          x.fillRect(tx + 60, 660, 130, 92);
          glow(x, tx + 125, 706, 120, '255,183,94', 0.22);
          x.fillStyle = 'rgba(70,40,20,0.9)';
          // rám stavu
          x.fillRect(tx + 74, 672, 8, 74);
          x.fillRect(tx + 160, 672, 8, 74);
          x.fillRect(tx + 74, 672, 94, 7);
          x.fillRect(tx + 74, 706, 94, 5);
          // osnova
          x.strokeStyle = 'rgba(70,40,20,0.65)'; x.lineWidth = 1.6;
          for (let i = 0; i < 9; i++) {
            x.beginPath(); x.moveTo(tx + 80 + i * 10, 679); x.lineTo(tx + 84 + i * 10, 744); x.stroke();
          }
          x.fillStyle = 'rgba(34,20,12,0.9)';
          x.fillRect(tx + 60, 700, 130, 4);
          x.strokeStyle = 'rgba(34,20,12,0.9)'; x.lineWidth = 4;
          x.strokeRect(tx + 60, 660, 130, 92);
          // vývěsní člunek nade dveřmi
          x.fillStyle = '#2c2036';
          x.fillRect(tx + 230, 680, 56, 108);
          x.strokeStyle = '#c9a24a'; x.lineWidth = 3;
          x.save();
          x.translate(tx + 258, 650); x.rotate(0.1);
          x.fillStyle = '#c9a24a';
          x.beginPath();
          x.moveTo(-30, 0); x.quadraticCurveTo(0, -13, 30, 0); x.quadraticCurveTo(0, 13, -30, 0);
          x.closePath(); x.fill();
          x.fillStyle = '#443a50';
          x.beginPath(); x.ellipse(0, 0, 9, 4, 0, 0, TAU); x.fill();
          x.restore();
          // špulky nití na okenním parapetu
          const spCols = ['#a63a2e', '#c9a24a', '#3e5a6a', '#8aa27a'];
          for (let i = 0; i < 4; i++) {
            x.fillStyle = spCols[i];
            x.fillRect(tx + 70 + i * 30, 748, 14, 18);
            x.fillStyle = '#2c2036';
            x.fillRect(tx + 68 + i * 30, 744, 18, 5);
            x.fillRect(tx + 68 + i * 30, 765, 18, 5);
          }
          x.restore();

          /* --- ZVONICE (dřevěná, 1259) --- */
          x.save();
          const zx = 1470;
          contactShadow(x, zx + 80, 862, 120, 20, 1.1, '30,34,70');
          // kamenná podezdívka
          x.fillStyle = lg(x, zx, 700, zx, 860, [[0, '#5a5468'], [1, '#3e3a4e']]);
          x.fillRect(zx - 10, 740, 180, 120);
          x.strokeStyle = 'rgba(28,24,40,0.7)'; x.lineWidth = 3;
          for (let i = 0; i < 6; i++) {
            x.beginPath(); x.moveTo(zx - 10, 764 + i * 24); x.lineTo(zx + 170, 764 + i * 24); x.stroke();
            x.beginPath(); x.moveTo(zx + 20 + (i % 2) * 40 + i * 20, 740 + i * 4); x.lineTo(zx + 22 + (i % 2) * 40 + i * 20, 762 + i * 4); x.stroke();
          }
          // mech na kamenech
          x.fillStyle = 'rgba(104,120,84,0.5)';
          x.beginPath(); x.ellipse(zx + 30, 830, 20, 8, 0.3, 0, TAU); x.fill();
          x.beginPath(); x.ellipse(zx + 130, 786, 16, 6, -0.2, 0, TAU); x.fill();
          // bedněný trup — mírně nakloněný
          x.save();
          x.translate(zx + 80, 740);
          x.rotate(-0.022);
          x.fillStyle = lg(x, -70, 0, 70, 0, [[0, '#443c58'], [0.5, '#38304a'], [1, '#2c2640']]);
          fillP(x, [[-70, 0], [-52, -330], [52, -330], [70, 0]], '#38304a');
          x.strokeStyle = 'rgba(20,16,30,0.6)'; x.lineWidth = 2.5;
          for (let i = 0; i < 7; i++) {
            x.beginPath();
            x.moveTo(-66 + i * 19, 0);
            x.lineTo(-50 + i * 15, -330);
            x.stroke();
          }
          // zvonové patro — otevřené, zvon uvnitř
          x.fillStyle = '#1c1830';
          x.fillRect(-46, -324, 92, 74);
          x.fillStyle = '#8a7a4e';
          x.beginPath();
          x.moveTo(-20, -318);
          x.quadraticCurveTo(-24, -276, -30, -266);
          x.lineTo(30, -266);
          x.quadraticCurveTo(24, -276, 20, -318);
          x.closePath(); x.fill();
          x.fillStyle = '#6a5c3a';
          x.beginPath(); x.ellipse(0, -264, 30, 7, 0, 0, TAU); x.fill();
          x.fillStyle = '#4a4030';
          x.beginPath(); x.arc(0, -258, 5, 0, TAU); x.fill();
          // šindelová jehlanová střecha
          fillP(x, [[-64, -330], [0, -430], [64, -330]], '#2a2340');
          snowBand(x, [[-56, -334], [0, -424], [56, -334]], 14, 9141, '#d8e2f6', '#7c8cba');
          x.strokeStyle = '#c9a24a'; x.lineWidth = 3.4;
          x.beginPath(); x.moveTo(0, -430); x.lineTo(0, -454); x.stroke();
          x.beginPath(); x.moveTo(-9, -444); x.lineTo(9, -444); x.stroke();
          x.restore();
          snowBand(x, [[zx - 10, 736], [zx + 170, 736]], 10, 9142, '#d8e2f6', '#7c8cba');
          x.restore();

          /* --- Bendův plácek: lavice, ohniště (oheň dyn.), stojan na noty --- */
          x.save();
          x.translate(1800, 955);
          contactShadow(x, 0, 10, 66, 14, 1, '30,34,70');
          contactShadow(x, 116, 0, 66, 11, 0.9, '30,34,70');
          // roztátý kruh
          x.fillStyle = '#6e6252';
          x.beginPath(); x.ellipse(0, 6, 56, 14, 0, 0, TAU); x.fill();
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * TAU;
            x.fillStyle = i % 2 ? '#6a6a78' : '#565664';
            x.beginPath();
            x.ellipse(Math.cos(a) * 50, 7 + Math.sin(a) * 12, 9, 6, a, 0, TAU);
            x.fill();
          }
          x.strokeStyle = '#3e2c16'; x.lineWidth = 9; x.lineCap = 'round';
          x.beginPath(); x.moveTo(-22, 0); x.lineTo(20, -6); x.stroke();
          x.beginPath(); x.moveTo(-14, -7); x.lineTo(16, 2); x.stroke();
          // lavice z půlkuláče
          x.fillStyle = '#4e4258';
          x.fillRect(56, -46, 120, 16);
          x.fillStyle = '#3a3048';
          x.fillRect(66, -30, 14, 34);
          x.fillRect(154, -30, 14, 34);
          snowBand(x, [[58, -48], [174, -48]], 6, 9151, '#d8e2f6', '#8c9cc8');
          // futrál od skřipek opřený o lavici
          x.fillStyle = '#2c2036';
          x.save();
          x.rotate(-0.2);
          x.beginPath();
          x.ellipse(120, 26, 14, 40, 0, 0, TAU);
          x.fill();
          x.restore();
          x.restore();

          /* --- KRČMA (zavřená, hlasy zevnitř) --- */
          x.save();
          const kx = 2040;
          for (let i = 0; i < 7; i++) {
            x.fillStyle = i % 2 ? '#4c4058' : '#42384e';
            x.fillRect(kx, 600 + i * 38, 320, 34);
            x.fillStyle = 'rgba(24,18,34,0.5)';
            x.fillRect(kx, 632 + i * 38, 320, 5);
          }
          fillP(x, [[kx - 30, 600], [kx + 160, 488], [kx + 350, 600]], '#332c44');
          snowBand(x, [[kx - 22, 594], [kx + 160, 496], [kx + 342, 594]], 18, 9161, '#d8e2f6', '#7c8cba');
          // dveře se světlem ve spárách
          x.fillStyle = '#241a2c';
          x.fillRect(kx + 35, 660, 70, 190);
          x.strokeStyle = '#141020'; x.lineWidth = 4;
          x.strokeRect(kx + 35, 660, 70, 190);
          x.strokeStyle = 'rgba(255,183,94,0.75)'; x.lineWidth = 2.4;
          x.beginPath(); x.moveTo(kx + 70, 664); x.lineTo(kx + 70, 846); x.stroke();
          x.beginPath(); x.moveTo(kx + 38, 846); x.lineTo(kx + 102, 846); x.stroke();
          glow(x, kx + 70, 850, 46, '255,183,94', 0.18);
          // okénko se závěsem
          x.fillStyle = '#ffb75e';
          x.fillRect(kx + 180, 700, 60, 54);
          x.fillStyle = '#7a3a2e';
          fillP(x, [[kx + 180, 700], [kx + 210, 700], [kx + 196, 754], [kx + 180, 754]], '#7a3a2e');
          x.strokeStyle = 'rgba(34,20,12,0.9)'; x.lineWidth = 4;
          x.strokeRect(kx + 180, 700, 60, 54);
          // vývěsní džbán na kované konzole
          x.strokeStyle = '#1c1830'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(kx + 30, 622); x.lineTo(kx - 20, 640); x.stroke();
          x.fillStyle = '#8a7148';
          x.beginPath();
          x.moveTo(kx - 32, 656);
          x.quadraticCurveTo(-14 + kx - 20, 680, kx - 30, 700);
          x.lineTo(kx - 8, 700);
          x.quadraticCurveTo(kx - 4, 680, kx - 10, 656);
          x.closePath(); x.fill();
          x.strokeStyle = '#8a7148'; x.lineWidth = 4;
          x.beginPath(); x.arc(kx - 6, 674, 10, -1.2, 1.2); x.stroke();
          x.restore();

          /* --- pěšina do mokřad (vpravo za krčmou) --- */
          x.fillStyle = 'rgba(94,110,160,0.55)';
          fillP(x, [[2340, 880], [2400, 872], [2400, 920], [2350, 926]], 'rgba(94,110,160,0.5)');
          // křivý ukazatel „OBODŘ" s vránou
          x.strokeStyle = '#3a3048'; x.lineWidth = 7;
          x.beginPath(); x.moveTo(2330, 900); x.lineTo(2338, 770); x.stroke();
          x.fillStyle = '#4e4258';
          x.save();
          x.translate(2338, 782); x.rotate(-0.12);
          fillP(x, [[-8, -10], [66, -14], [80, 0], [66, 12], [-8, 8]], '#4e4258');
          x.fillStyle = '#c8d4ec'; x.font = 'bold 15px Georgia, serif';
          x.fillText('OBODŘ', 4, 3);
          x.restore();

          /* --- hranice dříví (walkBehind vpravo dole) --- */
          x.save();
          x.translate(2282, 1042);
          contactShadow(x, 0, 18, 110, 15, 1, '30,34,70');
          for (let row = 0; row < 3; row++) {
            for (let i = 0; i < 6 - row; i++) {
              const lx = -84 + i * 30 + row * 15;
              const ly = -row * 24;
              x.fillStyle = row % 2 ? '#57432a' : '#4a3824';
              x.beginPath(); x.arc(lx, ly, 14, 0, TAU); x.fill();
              x.fillStyle = '#8a7148';
              x.beginPath(); x.arc(lx, ly, 9, 0, TAU); x.fill();
              x.strokeStyle = 'rgba(60,42,22,0.8)'; x.lineWidth = 1.6;
              x.beginPath(); x.arc(lx, ly, 5, 0, TAU); x.stroke();
            }
          }
          snowBand(x, [[-96, -62], [92, -62]], 10, 9171, '#d8e2f6', '#8c9cc8');
          x.restore();
          // ukazatel — kontaktní stín
          contactShadow(x, 2332, 902, 26, 7, 0.8, '30,34,70');
          // globální malířské zrno
          grain(x, SW, H, 0.05);
        }
      }
    ],
    dynamic(ctx, t, camX) {
      /* odlesky a proudění řeky se přesunuly do layer.dynamic vrstvy 0.5 —
         tady (nad všemi vrstvami) prosvítaly skrz chalupy popředí */

      /* okna se rozžíhají a dýchají */
      for (let i = 0; i < WINS.length; i++) {
        const wn = WINS[i];
        // pomalé cykly — většina svítí, občas některé zhasne
        const onWave = Math.sin(t * 0.045 + wn[4] * 2.4);
        const on = onWave > -0.75;
        const flick = on ? 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * (5 + i * 0.7) + wn[4] * 7)) : 0;
        if (flick > 0.03) {
          glow(ctx, wn[0] + wn[2] / 2, wn[1] + wn[3] / 2, 58, '255,197,100', 0.26 * flick);
          ctx.fillStyle = 'rgba(255,199,101,' + (0.9 * flick) + ')';
          ctx.fillRect(wn[0], wn[1], wn[2], wn[3]);
          ctx.fillStyle = 'rgba(24,16,30,0.9)';
          ctx.fillRect(wn[0] + wn[2] / 2 - 1.5, wn[1], 3, wn[3]);
          ctx.fillRect(wn[0], wn[1] + wn[3] / 2 - 1.5, wn[2], 3);
        } else {
          ctx.fillStyle = '#232040';
          ctx.fillRect(wn[0], wn[1], wn[2], wn[3]);
        }
      }

      /* Bendův ohýnek + jiskry + kouř */
      fireDyn(ctx, t, 1800, 950, 0.78, 5.5);
      smokeDyn(ctx, t, 1800, 912, 13, 1.0, '150,150,180', 0.16, 16);

      /* stoupající noty od Bendy (hraje!) */
      {
        const rn = mulberry(9301);
        for (let i = 0; i < 5; i++) {
          const life = ((t * 0.22 + i / 5 + rn() * 0.3) % 1);
          const nx = 1868 + Math.sin(life * 5 + i * 2.2) * 26 + i * 8;
          const ny = 860 - life * 210;
          const a = Math.sin(life * Math.PI) * 0.8;
          ctx.save();
          ctx.translate(nx, ny);
          ctx.rotate(Math.sin(t * 1.4 + i) * 0.22);
          ctx.globalAlpha = a;
          ctx.fillStyle = '#ffd98a';
          ctx.beginPath(); ctx.ellipse(0, 0, 6.4, 4.8, -0.4, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(5.6, -1.6); ctx.lineTo(5.6, -22); ctx.stroke();
          if (i % 2) {
            ctx.beginPath(); ctx.moveTo(5.6, -22); ctx.quadraticCurveTo(14, -18, 12, -8); ctx.stroke();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      /* sova na zvonici — očka svítí, občas zamrká; ~60 s přeletí netopýr */
      {
        // sova sedí na okraji zvonového patra
        const ox = 1592, oy = 486;
        ctx.fillStyle = '#2c2640';
        ctx.beginPath(); ctx.ellipse(ox, oy, 10, 13, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(ox, oy - 13, 8, 0, TAU); ctx.fill();
        const blink = (Math.sin(t * 0.9) > 0.96) ? 0 : 1;
        if (blink) {
          ctx.fillStyle = '#ffd98a';
          ctx.beginPath(); ctx.arc(ox - 3.4, oy - 14, 1.7, 0, TAU); ctx.arc(ox + 3.4, oy - 14, 1.7, 0, TAU); ctx.fill();
        }
        // netopýr
        const per = 58, ph = t % per;
        if (ph < 5) {
          const p = ph / 5;
          const bx = lerp(-60, SW + 60, p);
          const by = 300 + Math.sin(p * 9) * 60 + Math.sin(p * 23) * 24;
          flyBird(ctx, bx, by, 0.5, t * 26, 'rgba(20,16,32,0.9)');
        }
      }

      /* kouř z komínů chalup */
      for (let i = 0; i < CHIM.length; i++) {
        smokeDyn(ctx, t, CHIM[i][0], CHIM[i][1], i * 4 + 2, 1.0, '130,138,170', 0.22, 14);
      }

      /* modravý sníh */
      snowDyn(ctx, t, SW, 9401, 110, 8, '#c8d4ec');
    },
    overlayDynamic(ctx, t, camX) {
      ctx.save();
      ctx.translate(camX || 0, 0); // screen-space efekty
      // přízemní chlad — jemná mlha
      for (let k = 0; k < 4; k++) {
        const mx = ((k * 620 + t * 9) % (W + 900)) - 450;
        mistPuff(ctx, mx, 1050 + Math.sin(t * 0.24 + k * 2) * 10, 300, 40, '150,166,210', 0.10);
      }
      // hluboká modrá vinětace
      const vg = ctx.createRadialGradient(W / 2, H * 0.46, 400, W / 2, H * 0.52, 1300);
      vg.addColorStop(0, 'rgba(8,10,26,0)');
      vg.addColorStop(1, 'rgba(8,10,26,0.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
    walkArea: [[250, 860], [2320, 860], [2380, 900], [2380, 1032], [260, 1032], [160, 950], [160, 880]],
    scaleAt(y) { return clamp(0.52 + 0.54 * (y - 830) / 210, 0.46, 1.08); },
    exits: [
      { to: 'river_bank', at: [150, 900], spawn: [2600, 930], label: { cz: 'Po ledu k jezu', en: 'Across the ice to the weir' } },
      { to: 'marsh', at: [2360, 900], spawn: [300, 930], label: { cz: 'Pěšina do Obodře', en: 'Path to Obodř marsh' } }
    ],
    actors: [{ id: 'benda', x: 1878, y: 948, dir: -1 }]
  });
})();

/* =========================================================================
   SCÉNA: marsh — Obodř, zamrzlé mokřady v mlze (2600)
   ========================================================================= */
(function () {
  const SW = 2600;
  let _lastCrack = -1; // pro sfx praskání ledu

  BNJ.registerScene({
    id: 'marsh',
    width: SW,
    name: { cz: 'Obodř — mokřady', en: 'Obodř Marshes' },
    lightTint: 'rgba(122,140,150,0.16)',
    spawn: [300, 930],
    layers: [
      { // mléčné nebe zapadajícího dne
        parallax: 0.2,
        paint(x) {
          // nebe — 3 zóny: ocelová šeď, kalná perleť, teplý dohasínající pruh
          x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#61708a'], [0.32, '#8a96a8'], [0.62, '#b0b8bc'], [0.85, '#c2c2b4'], [1, '#b8c4c8']]);
          x.fillRect(0, 0, SW, H);
          // kalné světlo, kde zapadlo slunce
          glow(x, 420, 430, 480, '218,196,170', 0.28);
          glow(x, 420, 430, 220, '230,206,172', 0.22);
          // nízká zimní oblačnost — potrhané dvoutónové cáry přes horní
          // polovinu; u světla vlevo teplejší břicha, vpravo ocelové
          cloud2(x, 300, 150, 1.7, '#a89886', '#5c6678', 0.5, 10021, -1);
          cloud2(x, 950, 100, 1.4, '#9a9490', '#566070', 0.45, 10022, -1);
          softCloud(x, 620, 280, 1.8, '132,128,132', 0.35, 10023);
          cloud2(x, 1650, 170, 1.8, '#8e929c', '#4e5868', 0.5, 10024, -1);
          softCloud(x, 2100, 110, 1.5, '116,124,138', 0.4, 10025);
          cloud2(x, 2400, 260, 1.3, '#949aa4', '#525c6c', 0.42, 10026, -1);
          softCloud(x, 1300, 320, 1.9, '148,148,146', 0.28, 10027);
          // protrhané okno v mracích, kudy prosvítá perleť
          mistPuff(x, 1450, 210, 260, 60, '198,200,196', 0.30);
          // vzdálené kopce nad mlhou — dvě měkké vlny (info do prázdné zóny)
          const rh = mulberry(10003);
          x.fillStyle = 'rgba(108,120,136,0.30)';
          x.beginPath(); x.moveTo(0, 470);
          for (let px = 0; px <= SW; px += 60) x.lineTo(px, 432 + Math.sin(px * 0.0026 + 1.2) * 26 + (rh() - 0.5) * 10);
          x.lineTo(SW, 560); x.lineTo(0, 560); x.closePath(); x.fill();
          x.fillStyle = 'rgba(120,130,142,0.24)';
          x.beginPath(); x.moveTo(0, 500);
          for (let px = 0; px <= SW; px += 60) x.lineTo(px, 472 + Math.sin(px * 0.0034 + 4) * 20 + (rh() - 0.5) * 8);
          x.lineTo(SW, 580); x.lineTo(0, 580); x.closePath(); x.fill();
          // hejno vran táhne přes nebe — V klín + roztroušení opozdilci
          const rv2 = mulberry(10002);
          for (let i = 0; i < 11; i++) {
            const k = i - 5;
            const bx = 1620 + k * 56 + (rv2() - 0.5) * 16;
            const by = 150 + Math.abs(k) * 30 + (rv2() - 0.5) * 10;
            flyBird(x, bx, by, 0.38 + rv2() * 0.26, rv2() * TAU, 'rgba(48,52,62,' + (0.45 + rv2() * 0.3) + ')');
          }
          for (let i = 0; i < 7; i++) {
            const bx = 750 + rv2() * 1500, by = 90 + rv2() * 240;
            flyBird(x, bx, by, 0.3 + rv2() * 0.28, rv2() * TAU, 'rgba(52,56,66,' + (0.32 + rv2() * 0.28) + ')');
          }
          // vzdálená vížka nad mlhou + sloup kouře
          x.fillStyle = 'rgba(96,106,122,0.5)';
          x.fillRect(2130, 388, 26, 92);
          fillP(x, [[2124, 388], [2143, 356], [2162, 388]], 'rgba(96,106,122,0.5)');
          mistPuff(x, 2210, 380, 20, 46, '178,184,192', 0.35);
          mistPuff(x, 2222, 320, 30, 52, '182,188,196', 0.28);
          mistPuff(x, 2240, 258, 44, 60, '186,192,200', 0.20);
          // siluety vrb utopené v mlze
          const r = mulberry(10001);
          for (let i = 0; i < 8; i++) {
            const bx = 150 + i * 340 + r() * 120;
            x.save();
            x.globalAlpha = 0.28;
            bareTree(x, bx, 560, 110 + r() * 60, 10010 + i, '#5e6a7a', (r() - 0.5) * 0.8);
            x.restore();
          }
          x.globalAlpha = 1;
          // pás husté mlhy nad obzorem — měkké překrývající se elipsy, žádné fillRect pruhy
          for (let i = 0; i < 13; i++) {
            mistPuff(x, i * (SW / 12) + (r() - 0.5) * 140, 545 + (r() - 0.5) * 44,
              280 + r() * 150, 74 + r() * 40, '196,206,212', 0.55 + r() * 0.3);
          }
          for (let i = 0; i < 10; i++) {
            mistPuff(x, i * (SW / 9) + (r() - 0.5) * 160, 462 + (r() - 0.5) * 30,
              240 + r() * 120, 48 + r() * 26, '184,196,200', 0.34 + r() * 0.22);
          }
          grain(x, SW, H, 0.04);
        }
      },
      { // střední plán: tůně, rákosové ostrovy, mrtvé stromy
        parallax: 0.5,
        paint(x) {
          const r = mulberry(10050);
          // hladiny vzdálených tůní
          x.fillStyle = lg(x, 0, 600, 0, 760, [[0, '#8aa0aa'], [0.5, '#74909c'], [1, '#5e7a86']]);
          x.fillRect(0, 610, SW, 150);
          // horní hrana rozpitá do mlhy (žádný tvrdý pruh)
          for (let i = 0; i < 11; i++) {
            mistPuff(x, i * (SW / 10) + (r() - 0.5) * 120, 612 + (r() - 0.5) * 16,
              240 + r() * 130, 34 + r() * 20, '186,198,204', 0.45 + r() * 0.25);
          }
          // světlé zamrzlé plochy
          x.fillStyle = 'rgba(178,200,208,0.75)';
          for (let i = 0; i < 6; i++) {
            x.beginPath();
            x.ellipse(240 + i * 440 + r() * 100, 660 + r() * 60, 130 + r() * 90, 22 + r() * 12, 0, 0, TAU);
            x.fill();
          }
          // rákosové ostrůvky
          for (let i = 0; i < 9; i++) {
            const cx = 120 + i * 300 + r() * 100, cy = 640 + r() * 90;
            x.strokeStyle = 'rgba(94,86,56,0.75)';
            x.lineWidth = 2.4;
            for (let k = 0; k < 16; k++) {
              const bx = cx + (r() - 0.5) * 70;
              const hh = 40 + r() * 44;
              const lean = (r() - 0.5) * 0.5;
              x.beginPath();
              x.moveTo(bx, cy);
              x.quadraticCurveTo(bx + lean * 16, cy - hh * 0.6, bx + lean * 34, cy - hh);
              x.stroke();
            }
            x.fillStyle = 'rgba(150,160,168,0.5)';
            x.beginPath(); x.ellipse(cx, cy + 4, 46, 9, 0, 0, TAU); x.fill();
          }
          // mrtvé pahýly stromů
          for (let i = 0; i < 4; i++) {
            const bx = 500 + i * 560 + r() * 140;
            x.strokeStyle = 'rgba(62,58,50,0.8)'; x.lineWidth = 8; x.lineCap = 'round';
            x.beginPath(); x.moveTo(bx, 700); x.lineTo(bx - 8, 590 + r() * 30); x.stroke();
            x.lineWidth = 4;
            x.beginPath(); x.moveTo(bx - 6, 630); x.lineTo(bx + 26, 600); x.stroke();
            x.beginPath(); x.moveTo(bx - 7, 660); x.lineTo(bx - 34, 634); x.stroke();
          }
        }
      },
      { // bližší rákosový pás + křivá vrba
        parallax: 0.8,
        paint(x) {
          const r = mulberry(10080);
          x.fillStyle = lg(x, 0, 740, 0, 850, [[0, '#6e8290'], [1, '#597380']]);
          x.fillRect(0, 750, SW, 100);
          // rozpité napojení na mlhu za ním
          for (let i = 0; i < 10; i++) {
            mistPuff(x, i * (SW / 9) + (r() - 0.5) * 140, 752 + (r() - 0.5) * 14,
              230 + r() * 120, 30 + r() * 18, '168,182,190', 0.4 + r() * 0.25);
          }
          x.fillStyle = 'rgba(196,212,218,0.6)';
          for (let i = 0; i < 5; i++) {
            x.beginPath();
            x.ellipse(300 + i * 520, 790 + r() * 30, 170, 26, 0, 0, TAU);
            x.fill();
          }
          // hustý rákos
          for (let i = 0; i < 160; i++) {
            const bx = r() * SW, by = 780 + r() * 60;
            const hh = 60 + r() * 70;
            const lean = (r() - 0.5) * 0.6;
            x.strokeStyle = r() > 0.5 ? 'rgba(138,122,78,0.85)' : 'rgba(94,86,56,0.85)';
            x.lineWidth = 2.6;
            x.beginPath();
            x.moveTo(bx, by);
            x.quadraticCurveTo(bx + lean * 20, by - hh * 0.6, bx + lean * 44, by - hh);
            x.stroke();
            if (r() > 0.75) {
              x.fillStyle = '#5e5638';
              x.save();
              x.translate(bx + lean * 44, by - hh);
              x.rotate(lean * 0.5);
              x.fillRect(-3, -16, 6, 18);
              x.fillStyle = '#dfe9f5';
              x.fillRect(-3, -18, 6, 4);
              x.restore();
            }
          }
          // křivá vrba nakloněná nad tůně
          x.save();
          x.strokeStyle = '#3a3a34'; x.lineCap = 'round';
          x.lineWidth = 22;
          x.beginPath(); x.moveTo(400, 850); x.quadraticCurveTo(430, 740, 520, 690); x.stroke();
          x.lineWidth = 9;
          x.beginPath(); x.moveTo(520, 690); x.quadraticCurveTo(600, 640, 640, 650); x.stroke();
          x.beginPath(); x.moveTo(505, 700); x.quadraticCurveTo(560, 700, 610, 730); x.stroke();
          x.lineWidth = 3.4;
          for (let i = 0; i < 12; i++) {
            const bx = 540 + i * 12, by = 660 + (i % 3) * 14;
            x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + 4, by + 50, bx - 6 + (i % 5), by + 90 + (i % 4) * 12); x.stroke();
          }
          snowBand(x, [[404, 800], [450, 726], [520, 692]], 10, 10081, '#dce6f2', '#8a9cb4');
          x.restore();
        }
      },
      { // 1.0 — hatě, boží muka, zamrzlá tůň s fragmentem, starý dub, volavčí tůňka
        parallax: 1,
        walkBehind: [
          // kmen dubu (hráč prochází za ním)
          [[1738, 1080], [1756, 900], [1770, 800], [1810, 742], [1862, 742], [1900, 806], [1916, 900], [1934, 1080]],
          // přední rákosí vlevo dole
          [[60, 1080], [80, 1002], [200, 962], [340, 1000], [386, 1080]],
          // přední ostřice vpravo dole
          [[2410, 1080], [2426, 1010], [2530, 984], [2600, 1010], [2600, 1080]]
        ],
        paint(x) {
          const r = mulberry(10100);
          /* --- zasněžený mokřadní terén — 3 hodnotové zóny --- */
          x.fillStyle = lg(x, 0, 820, 0, H, [[0, '#a4b2c2'], [0.3, '#cbd6e2'], [0.65, '#b4c2d2'], [1, '#8c9cb2']]);
          x.fillRect(0, 840, SW, H - 840);
          // dohasínající teplý přísvit zleva (kde zapadlo slunce)
          x.fillStyle = lg(x, 0, 0, 900, 0, [[0, 'rgba(226,204,168,0.13)'], [1, 'rgba(226,204,168,0)']]);
          x.fillRect(0, 840, 900, H - 840);
          scumble(x, 0, 840, SW, 240, 10101, 620, ['#c3d0dc', '#a2b2c4', '#d8e2ec', '#8a9cb0', '#b8beb0'], 3, 12, 0.45);
          // tmavé promáčené fleky pod sněhem
          x.fillStyle = 'rgba(74,90,102,0.35)';
          for (let i = 0; i < 12; i++) {
            x.beginPath();
            x.ellipse(r() * SW, 880 + r() * 160, 40 + r() * 70, 10 + r() * 8, 0, 0, TAU);
            x.fill();
          }

          /* --- HATĚ — cesta z položených kuláčů --- */
          const hatY = (px) => 940 + Math.sin(px * 0.004) * 26;
          for (let px = 0; px < SW; px += 34) {
            const yy = hatY(px);
            x.save();
            x.translate(px + 16, yy);
            x.rotate(Math.sin(px * 0.05) * 0.06 + (r() - 0.5) * 0.1);
            x.fillStyle = ((px / 34) | 0) % 2 ? '#5e4c36' : '#544430';
            x.fillRect(-17, -34, 30, 68);
            x.fillStyle = 'rgba(30,22,14,0.4)';
            x.fillRect(-17, -34, 30, 6);
            x.fillRect(-17, 28, 30, 6);
            // sníh na kuláčích
            x.fillStyle = 'rgba(226,234,244,0.8)';
            x.fillRect(-15, -30 + r() * 10, 26, 8 + r() * 6);
            x.restore();
          }
          // okraje hatí vsakují do ledu
          x.fillStyle = 'rgba(120,140,152,0.5)';
          for (let px = 0; px < SW; px += 120) {
            x.beginPath();
            x.ellipse(px + 40, hatY(px) + 44, 46, 9, 0, 0, TAU);
            x.fill();
          }

          /* --- vstup na hatě vlevo (exit old_town): dva křivé kůly --- */
          contactShadow(x, 158, 962, 22, 6, 0.9, '52,64,86');
          contactShadow(x, 242, 988, 22, 6, 0.9, '52,64,86');
          x.strokeStyle = '#4a3c2c'; x.lineWidth = 12; x.lineCap = 'round';
          x.beginPath(); x.moveTo(160, 960); x.lineTo(150, 830); x.stroke();
          x.beginPath(); x.moveTo(240, 986); x.lineTo(252, 852); x.stroke();
          x.strokeStyle = 'rgba(140,150,120,0.6)'; x.lineWidth = 4;
          x.beginPath(); x.moveTo(152, 840); x.quadraticCurveTo(200, 872, 250, 862); x.stroke();
          snowBand(x, [[144, 828], [158, 826]], 7, 10111, '#eef3fa', '#a9bedd');
          snowBand(x, [[246, 848], [260, 850]], 7, 10112, '#eef3fa', '#a9bedd');
          // vybledlá stužka na kůlu (ochrana proti bludičkám, říká se)
          x.fillStyle = '#8a4444';
          fillP(x, [[252, 866], [268, 872], [258, 886], [250, 878]], '#8a4444');

          /* --- boží muka --- */
          x.save();
          x.translate(600, 862);
          contactShadow(x, 0, 6, 40, 9, 1.1, '52,64,86');
          x.fillStyle = lg(x, -12, 0, 12, 0, [[0, '#8a8a92'], [1, '#5e5e6a']]);
          x.fillRect(-11, -150, 22, 156);
          // stříška
          fillP(x, [[-26, -150], [0, -178], [26, -150]], '#4a4444');
          snowBand(x, [[-22, -152], [0, -174], [22, -152]], 8, 10121, '#eef3fa', '#a9bedd');
          // nika se svatým obrázkem
          x.fillStyle = '#2c2620';
          x.fillRect(-8, -136, 16, 24);
          x.fillStyle = '#c9a24a';
          x.fillRect(-5, -132, 10, 14);
          x.fillStyle = '#7a3a2e';
          x.fillRect(-3, -129, 6, 8);
          // mech + praskliny
          x.fillStyle = 'rgba(104,120,84,0.5)';
          x.beginPath(); x.ellipse(-6, -60, 6, 14, 0.2, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(40,40,48,0.5)'; x.lineWidth = 1.6;
          x.beginPath(); x.moveTo(4, -10); x.lineTo(7, -52); x.lineTo(3, -80); x.stroke();
          x.restore();

          /* --- ZAMRZLÁ TŮŇ s přimrzlým fragmentem (popředí, střed) --- */
          x.save();
          // tvar tůně
          const poolPath = () => {
            x.beginPath();
            x.moveTo(880, 1006);
            x.bezierCurveTo(920, 962, 1080, 946, 1230, 952);
            x.bezierCurveTo(1420, 946, 1550, 972, 1584, 1010);
            x.bezierCurveTo(1600, 1046, 1520, 1076, 1230, 1080);
            x.bezierCurveTo(1000, 1080, 872, 1052, 880, 1006);
            x.closePath();
          };
          // tmavá hloubka
          poolPath();
          x.fillStyle = lg(x, 0, 950, 0, 1080, [[0, '#5e7a86'], [0.5, '#4e6470'], [1, '#3a505c']]);
          x.fill();
          // ledová deska — mléčné víry
          poolPath();
          x.save();
          x.clip();
          x.fillStyle = 'rgba(154,180,188,0.65)';
          x.fillRect(860, 940, 760, 150);
          scumble(x, 880, 946, 720, 130, 10131, 90, ['rgba(214,230,238,0.8)', 'rgba(120,146,158,0.6)', 'rgba(240,248,252,0.7)'], 8, 40, 0.35);
          // bubliny pod ledem
          const rb = mulberry(10132);
          for (let i = 0; i < 22; i++) {
            x.fillStyle = 'rgba(220,240,246,' + (0.2 + rb() * 0.4) + ')';
            x.beginPath();
            x.arc(920 + rb() * 640, 970 + rb() * 90, 1.5 + rb() * 4, 0, TAU);
            x.fill();
          }
          // FRAGMENT LISTU (~1230,1010) se kreslí v dynamic() — po vyzvednutí
          // musí zmizet a statická vrstva se prerenderuje jen jednou za session
          // mléčný závoj ledu přes fragment — měkké elipsy
          mistPuff(x, 1210, 1000, 130, 46, '190,210,220', 0.5);
          mistPuff(x, 1290, 1024, 100, 36, '196,214,224', 0.4);
          mistPuff(x, 1160, 980, 80, 30, '200,218,226', 0.35);
          // velké praskliny
          x.strokeStyle = 'rgba(230,244,250,0.65)'; x.lineWidth = 2.6;
          x.beginPath();
          x.moveTo(940, 990); x.lineTo(1060, 1002); x.lineTo(1150, 986); x.lineTo(1310, 1010);
          x.stroke();
          x.beginPath();
          x.moveTo(1310, 1010); x.lineTo(1420, 996); x.lineTo(1530, 1018);
          x.stroke();
          x.lineWidth = 1.4;
          x.beginPath(); x.moveTo(1150, 986); x.lineTo(1180, 950); x.stroke();
          x.beginPath(); x.moveTo(1060, 1002); x.lineTo(1044, 1046); x.stroke();
          x.restore();
          // zasněžený lem tůně
          poolPath();
          x.strokeStyle = 'rgba(236,243,250,0.9)'; x.lineWidth = 9;
          x.stroke();
          x.restore();

          /* --- STARÝ DUB (kmen walkBehind, koruna přes scénu) --- */
          x.save();
          const ox = 1836;
          contactShadow(x, ox, 1072, 150, 20, 1.1, '52,64,86');
          // kořenové náběhy
          x.fillStyle = '#3e3428';
          fillP(x, [[ox - 98, 1080], [ox - 66, 980], [ox - 40, 1080]], '#3e3428');
          fillP(x, [[ox + 34, 1080], [ox + 66, 986], [ox + 102, 1080]], '#3e3428');
          // kmen
          const tg = lg(x, ox - 70, 0, ox + 70, 0, [[0, '#4a4034'], [0.45, '#3e3428'], [1, '#2a2218']]);
          x.fillStyle = tg;
          x.beginPath();
          x.moveTo(ox - 78, 1080);
          x.bezierCurveTo(ox - 66, 940, ox - 58, 860, ox - 34, 780);
          x.lineTo(ox - 20, 730);
          x.lineTo(ox + 30, 730);
          x.bezierCurveTo(ox + 48, 800, ox + 62, 900, ox + 78, 1080);
          x.closePath(); x.fill();
          // borka — svislé rozpraskané rýhy
          x.strokeStyle = 'rgba(16,12,8,0.6)'; x.lineWidth = 3.4;
          for (let i = 0; i < 8; i++) {
            const bx = ox - 62 + i * 17;
            x.beginPath();
            x.moveTo(bx + 8, 1076);
            x.bezierCurveTo(bx + 4 + Math.sin(i * 3) * 6, 980, bx + 10, 880, bx + 16 + Math.sin(i) * 4, 760);
            x.stroke();
          }
          x.strokeStyle = 'rgba(200,214,228,0.25)'; x.lineWidth = 2.4;
          x.beginPath();
          x.moveTo(ox - 58, 1060); x.bezierCurveTo(ox - 52, 950, ox - 44, 860, ox - 26, 764);
          x.stroke();
          // dutina se zbytky žaludů
          x.fillStyle = '#171008';
          x.beginPath(); x.ellipse(ox + 26, 920, 16, 26, 0.12, 0, TAU); x.fill();
          x.strokeStyle = '#4a4034'; x.lineWidth = 4;
          x.beginPath(); x.ellipse(ox + 26, 920, 16, 26, 0.12, 0, TAU); x.stroke();
          // hlavní větve do koruny
          x.strokeStyle = '#352c20'; x.lineCap = 'round';
          const branch = (x0, y0, x1, y1, w0) => {
            x.lineWidth = w0;
            x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2 + 20, (y0 + y1) / 2 - 30, x1, y1); x.stroke();
          };
          branch(ox - 10, 745, ox - 250, 560, 30);
          branch(ox + 16, 740, ox + 240, 540, 32);
          branch(ox, 742, ox - 60, 460, 26);
          branch(ox + 8, 745, ox + 110, 430, 22);
          // vedlejší větvoví
          branch(ox - 250, 560, ox - 420, 470, 14);
          branch(ox - 250, 560, ox - 330, 620, 10);
          branch(ox - 60, 460, ox - 180, 360, 12);
          branch(ox - 60, 460, ox + 20, 330, 10);
          branch(ox + 110, 430, ox + 240, 330, 11);
          branch(ox + 240, 540, ox + 420, 480, 13);
          branch(ox + 240, 540, ox + 350, 620, 9);
          // jemné konce
          x.lineWidth = 4;
          const rt = mulberry(10141);
          const tips = [[-420, 470], [-330, 620], [-180, 360], [20, 330], [240, 330], [420, 480], [350, 620]];
          for (const tp of tips) {
            for (let k = 0; k < 5; k++) {
              const a = rt() * TAU;
              x.beginPath();
              x.moveTo(ox + tp[0], tp[1]);
              x.quadraticCurveTo(
                ox + tp[0] + Math.cos(a) * 30, tp[1] + Math.sin(a) * 26 - 14,
                ox + tp[0] + Math.cos(a) * 66, tp[1] + Math.sin(a) * 52 - 20
              );
              x.stroke();
            }
          }
          // DUBĚNKY — hnědé kuličky na koncích větví
          for (const tp of tips) {
            for (let k = 0; k < 4; k++) {
              const gx = ox + tp[0] + (rt() - 0.5) * 90;
              const gy = tp[1] + (rt() - 0.5) * 70;
              x.fillStyle = k % 2 ? '#6a4a2a' : '#7a5a34';
              x.beginPath(); x.arc(gx, gy, 5 + rt() * 3, 0, TAU); x.fill();
              x.fillStyle = 'rgba(230,220,200,0.35)';
              x.beginPath(); x.arc(gx - 1.5, gy - 1.5, 1.6, 0, TAU); x.fill();
            }
          }
          // pár scvrklých dubových listů
          x.fillStyle = '#6e5a30';
          for (let k = 0; k < 14; k++) {
            const tp = tips[(rt() * tips.length) | 0];
            const lx = ox + tp[0] + (rt() - 0.5) * 110;
            const ly = tp[1] + (rt() - 0.5) * 80;
            x.save();
            x.translate(lx, ly);
            x.rotate(rt() * TAU);
            x.beginPath();
            x.moveTo(0, -7);
            x.bezierCurveTo(6, -4, 6, 4, 0, 8);
            x.bezierCurveTo(-6, 4, -6, -4, 0, -7);
            x.fill();
            x.restore();
          }
          // sníh na hlavních větvích
          snowBand(x, [[ox - 250, 556], [ox - 120, 640], [ox - 6, 742]], 9, 10142, '#e8eef8', '#8a9cb4');
          snowBand(x, [[ox + 18, 738], [ox + 130, 640], [ox + 238, 538]], 9, 10143, '#e8eef8', '#8a9cb4');
          snowBand(x, [[ox - 60, 458], [ox - 20, 560], [ox + 4, 660]], 7, 10144, '#e8eef8', '#95a8c0');
          x.restore();

          /* --- volavčí tůňka vpravo (mělká, u pěšiny) --- */
          x.save();
          x.beginPath();
          x.ellipse(2280, 880, 190, 42, 0, 0, TAU);
          x.fillStyle = lg(x, 0, 840, 0, 920, [[0, '#7e98a4'], [1, '#54707c']]);
          x.fill();
          x.fillStyle = 'rgba(178,200,208,0.6)';
          x.beginPath(); x.ellipse(2340, 886, 90, 20, 0, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(236,243,250,0.85)'; x.lineWidth = 7;
          x.beginPath(); x.ellipse(2280, 880, 190, 42, 0, 0, TAU); x.stroke();
          // nezamrzlé očko s odrazem nebe
          x.fillStyle = 'rgba(170,182,192,0.9)';
          x.beginPath(); x.ellipse(2226, 874, 52, 13, 0, 0, TAU); x.fill();
          x.fillStyle = 'rgba(218,206,186,0.5)';
          x.beginPath(); x.ellipse(2214, 872, 20, 6, 0, 0, TAU); x.fill();
          x.restore();

          /* --- přední rákosí a ostřice (walkBehind) --- */
          const frontReeds = (cx, cy, n, seed, sc) => {
            const rr2 = mulberry(seed);
            for (let i = 0; i < n; i++) {
              const bx = cx + (rr2() - 0.5) * 220 * sc;
              const by = cy + (rr2() - 0.5) * 40;
              const hh = (90 + rr2() * 110) * sc;
              const lean = (rr2() - 0.5) * 0.5;
              x.strokeStyle = rr2() > 0.5 ? '#8a7a4e' : '#5e5638';
              x.lineWidth = 4;
              x.beginPath();
              x.moveTo(bx, by);
              x.quadraticCurveTo(bx + lean * 26, by - hh * 0.6, bx + lean * 56, by - hh);
              x.stroke();
              if (rr2() > 0.5) {
                x.fillStyle = '#6a5230';
                x.save();
                x.translate(bx + lean * 56, by - hh);
                x.rotate(lean * 0.5);
                x.fillRect(-4.4, -26, 9, 28);
                x.fillStyle = '#eef3fa';
                x.fillRect(-4.4, -29, 9, 6);
                x.restore();
              }
            }
          };
          contactShadow(x, 210, 1052, 110, 14, 0.7, '52,64,86');
          contactShadow(x, 2510, 1058, 100, 13, 0.7, '52,64,86');
          frontReeds(210, 1046, 42, 10151, 1.25);
          frontReeds(2510, 1052, 36, 10152, 1.15);
          snowBand(x, [[90, 1010], [330, 1000]], 12, 10153, '#eef3fa', '#a9bedd');
          snowBand(x, [[2430, 1016], [2596, 1012]], 10, 10154, '#eef3fa', '#a9bedd');
          // globální malířské zrno
          grain(x, SW, H, 0.05);
        }
      }
    ],
    dynamic(ctx, t, camX) {
      /* FRAGMENT LISTU přimrzlý pod ledem — dynamicky, aby po vyzvednutí
         zmizel. Podmínka zrcadlí hs_ma_ice_pool v 50_puzzles.js. */
      {
        const st = BNJ.state;
        if (!(st.inventory.includes('frag_c') || st.flags._frag_c_in || st.flags.letter_read)) {
          ctx.save();
          ctx.translate(1230, 1010);
          ctx.rotate(-0.18);
          fillP(ctx, [[-34, -20], [30, -26], [38, 16], [-26, 24]], 'rgba(232,220,190,0.72)');
          ctx.strokeStyle = 'rgba(122,92,52,0.5)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-22, -8); ctx.lineTo(24, -12); ctx.moveTo(-20, 2); ctx.lineTo(26, -1); ctx.moveTo(-18, 12); ctx.lineTo(20, 9); ctx.stroke();
          ctx.fillStyle = 'rgba(138,44,34,0.7)';
          ctx.beginPath(); ctx.arc(22, 10, 8, 0, TAU); ctx.fill();
          ctx.restore();
          // mléčný závoj navrch, ať fragment zůstane čitelně „pod ledem“
          mistPuff(ctx, 1210, 1000, 130, 46, '190,210,220', 0.35);
          mistPuff(ctx, 1290, 1024, 100, 36, '196,214,224', 0.3);
        }
      }

      /* vlnící se rákosí (několik dynamických stébel přes statické trsy) */
      {
        const rr2 = mulberry(10301);
        for (let i = 0; i < 14; i++) {
          const bx = rr2() * SW;
          const by = 830 + rr2() * 60;
          const hh = 70 + rr2() * 80;
          const ph = rr2() * TAU;
          const sway = Math.sin(t * 1.1 + ph) * 8 + Math.sin(t * 2.3 + ph * 2) * 3;
          ctx.strokeStyle = 'rgba(138,122,78,0.55)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + sway * 0.5, by - hh * 0.6, bx + sway, by - hh);
          ctx.stroke();
        }
      }

      /* BLUDIČKY — tři zelenkavá světélka nad tůněmi */
      {
        const anchors = [[500, 760], [1200, 800], [2350, 780]];
        for (let i = 0; i < anchors.length; i++) {
          const [ax, ay] = anchors[i];
          const wx = ax + Math.sin(t * (0.31 + i * 0.07) + i * 2.1) * 110 + Math.sin(t * 0.83 + i) * 30;
          const wy = ay + Math.sin(t * (0.47 + i * 0.05) + i * 4.2) * 42 + Math.cos(t * 1.1 + i * 2) * 12;
          const fl = 0.55 + 0.45 * Math.sin(t * (2.2 + i * 0.6) + i * 3) * Math.sin(t * 3.7 + i);
          // duch stopy
          for (let k = 1; k <= 2; k++) {
            const tx2 = ax + Math.sin((t - k * 0.16) * (0.31 + i * 0.07) + i * 2.1) * 110 + Math.sin((t - k * 0.16) * 0.83 + i) * 30;
            const ty2 = ay + Math.sin((t - k * 0.16) * (0.47 + i * 0.05) + i * 4.2) * 42 + Math.cos((t - k * 0.16) * 1.1 + i * 2) * 12;
            glow(ctx, tx2, ty2, 14, '174,240,200', 0.10 * fl / k);
          }
          glow(ctx, wx, wy, 52, '174,240,200', 0.30 * fl);
          glow(ctx, wx, wy, 20, '210,255,225', 0.5 * fl);
          ctx.fillStyle = 'rgba(235,255,240,' + (0.85 * fl) + ')';
          ctx.beginPath(); ctx.arc(wx, wy, 3.2, 0, TAU); ctx.fill();
          // odraz na ledu pod bludičkou
          ctx.fillStyle = 'rgba(174,240,200,' + (0.10 * fl) + ')';
          ctx.beginPath(); ctx.ellipse(wx, 900 + i * 30, 34, 7, 0, 0, TAU); ctx.fill();
        }
      }

      /* VOLAVKA — stojí na jedné noze, občas zaloví */
      {
        const hx = 2280, hy = 866;
        const cyc = t % 16;
        let neckDip = 0;
        if (cyc > 11 && cyc < 12) neckDip = Math.sin((cyc - 11) * Math.PI);          // rychlý úder
        else if (cyc >= 12 && cyc < 14) neckDip = Math.max(0, 1 - (cyc - 12) * 0.7); // zvedá hlavu
        const sway = Math.sin(t * 0.8) * 2;
        ctx.save();
        ctx.translate(hx, hy);
        // noha
        ctx.strokeStyle = '#4a4a44'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1, -44); ctx.stroke();
        // druhá přitažená
        ctx.beginPath(); ctx.moveTo(2, -40); ctx.lineTo(10, -30); ctx.stroke();
        // tělo
        ctx.fillStyle = '#9aa4ac';
        ctx.beginPath(); ctx.ellipse(4 + sway * 0.4, -62, 26, 15, -0.16, 0, TAU); ctx.fill();
        ctx.fillStyle = '#7e8890';
        ctx.beginPath(); ctx.ellipse(-6 + sway * 0.4, -56, 14, 9, -0.3, 0, TAU); ctx.fill();
        // ocásek
        fillP(ctx, [[-20, -66], [-34, -58], [-18, -54]], '#7e8890');
        // krk + hlava (S křivka, při lovu vystřelí dolů)
        const hdx = 30 + sway - neckDip * 16;
        const hdy = -96 + neckDip * 74;
        ctx.strokeStyle = '#c8ccd0'; ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(20, -70);
        ctx.quadraticCurveTo(38 - neckDip * 10, -92 + neckDip * 30, hdx, hdy);
        ctx.stroke();
        ctx.fillStyle = '#c8ccd0';
        ctx.beginPath(); ctx.ellipse(hdx, hdy, 8, 6, -0.2, 0, TAU); ctx.fill();
        // zobák
        ctx.fillStyle = '#c9a24a';
        fillP(ctx, [[hdx + 5, hdy - 2], [hdx + 26, hdy + 2 + neckDip * 6], [hdx + 5, hdy + 3]], '#c9a24a');
        // černý proužek za okem
        ctx.strokeStyle = '#2c3038'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(hdx - 2, hdy - 5); ctx.lineTo(hdx - 12, hdy - 12); ctx.stroke();
        ctx.fillStyle = '#241812';
        ctx.beginPath(); ctx.arc(hdx + 1, hdy - 1.6, 1.7, 0, TAU); ctx.fill();
        ctx.restore();
        // cáknutí při úderu
        if (cyc > 11.2 && cyc < 11.8) {
          const p = (cyc - 11.2) / 0.6;
          ctx.fillStyle = 'rgba(220,236,242,' + (0.6 * (1 - p)) + ')';
          for (let k = 0; k < 5; k++) {
            const a = -0.6 - k * 0.4;
            ctx.beginPath();
            ctx.arc(2310 + Math.cos(a) * 20 * p * 2, 850 + Math.sin(a) * 24 * p, 2.4, 0, TAU);
            ctx.fill();
          }
        }
      }

      /* praskání ledu — trhlina se rozběhne po tůni (~40 s) + SFX */
      {
        const per = 41;
        const cyc = Math.floor(t / per), ph = t % per;
        if (ph < 1.6) {
          if (cyc !== _lastCrack) { _lastCrack = cyc; try { BNJ.sfx('sfx_ice_crack'); } catch (e) { } }
          const p = ph / 1.6;
          const rc = mulberry(cyc * 7 + 3);
          const sx = 950 + rc() * 500, sy = 970 + rc() * 80;
          ctx.strokeStyle = 'rgba(240,250,255,' + (0.8 * (1 - p * 0.5)) + ')';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          let px2 = sx, py2 = sy;
          const segs = Math.floor(p * 8) + 1;
          for (let k = 0; k < segs; k++) {
            px2 += 20 + rc() * 50;
            py2 += (rc() - 0.5) * 34;
            ctx.lineTo(px2, py2);
          }
          ctx.stroke();
          // odbočka
          if (segs > 4) {
            ctx.beginPath();
            ctx.moveTo(sx + 80, sy + 4);
            ctx.lineTo(sx + 110 + rc() * 30, sy - 26 - rc() * 14);
            ctx.stroke();
          }
        }
      }

      /* mihotání nezamrzlého očka tůňky */
      sparkleDyn(ctx, t, 10302, 6, 2176, 862, 100, 20, '224,232,240');

      /* MLHA — tři pásy různých rychlostí (hlavní kouzlo scény) */
      for (let i = 0; i < 3; i++) {
        const sp = 8 + i * 7;
        const alpha = 0.11 + i * 0.045;
        const yy = 640 + i * 130;
        const n = 6;
        for (let k = 0; k < n; k++) {
          const span = SW + 1000;
          const mx = ((k * span / n + t * sp + i * 400) % span) - 500;
          const my = yy + Math.sin(t * 0.14 + k * 2.1 + i * 2.6) * 22;
          mistPuff(ctx, mx, my, 300 + k * 36, 46 + i * 14, '196,206,212', alpha);
        }
      }

      /* jemné sněžení */
      snowDyn(ctx, t, SW, 10401, 60, 6, '#dfe6ee');
    },
    overlayDynamic(ctx, t, camX) {
      ctx.save();
      ctx.translate(camX || 0, 0); // screen-space efekty
      // hustý přízemní pás mlhy vpředu
      for (let k = 0; k < 5; k++) {
        const mx = ((k * 540 + t * 16) % (W + 1100)) - 550;
        mistPuff(ctx, mx, 1046 + Math.sin(t * 0.3 + k * 1.8) * 12, 360, 60, '200,210,216', 0.16);
      }
      // občas přeletí přes celou scénu mlžný závoj
      {
        const per = 47, ph = t % per;
        if (ph < 12) {
          const p = ph / 12;
          mistPuff(ctx, lerp(-500, W + 500, p), 500 + Math.sin(p * 5) * 60, 520, 160, '206,214,220', 0.13 * Math.sin(p * Math.PI));
        }
      }
      // šedá vinětace — svírá scénu
      const vg = ctx.createRadialGradient(W / 2, H * 0.46, 360, W / 2, H * 0.5, 1250);
      vg.addColorStop(0, 'rgba(14,20,26,0)');
      vg.addColorStop(1, 'rgba(14,20,26,0.44)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
    walkArea: [[190, 890], [850, 890], [900, 940], [1580, 940], [1640, 890], [2380, 880], [2420, 930], [2380, 1000], [1700, 1010], [900, 1030], [400, 1010], [180, 980]],
    scaleAt(y) { return clamp(0.54 + 0.52 * (y - 850) / 190, 0.48, 1.08); },
    exits: [
      { to: 'old_town', at: [190, 930], spawn: [2280, 940], label: { cz: 'Po hatích do Starých Benátek', en: 'Along the causeway to Old Benátky' } }
    ]
  });
})();

})();
