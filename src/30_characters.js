/* =========================================================================
   ZTRACENÝ LIST — 30_characters.js
   Postavy: vektorové karikatury à la Curse of Monkey Island.
   Výrazné siluety, velké hlavy a ruce, osobité proporce.

   Kánon (IDS.md): jirka, brahe, kepler, benda, prevoznik, trhovkyne.
   API (CONTRACT.md): BNJ.registerCharacter({id, textColor, height, draw})
   draw(ctx, pose) — kotva = střed nohou (0,0), osa Y nahoru záporná.
   pose = { t, dir:1|-1, action:'idle'|'walk'|'talk'|'reach'|'pickup',
            mouth:0..1, blink:0..1, phase:0..1 }

   Animace: walk cycle kvantovaný do 8 fází (nohy, ruce, poskok, brašna),
   idle (dýchání, mrkání, občasné gesto), talk (ústa dle pose.mouth, gesta,
   obočí), reach/pickup (natažení / dřep). Sekundární pohyb: šála, vlasy,
   péro na čapce, pláštík, kouř z fajfky. Flip směru řeší postava sama
   (ctx.scale(pose.dir,1)); lightTint scény aplikuje engine nad kresbou.
   ========================================================================= */
(function () {
'use strict';

const BNJ = window.BNJ;
if (!BNJ || !BNJ.registerCharacter) {
  console.error('[30_characters] BNJ.registerCharacter chybí — načtěte 00_engine.js dřív.');
  return;
}

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, k) => a + (b - a) * k;
/* hladký "kopeček" 0→1→0 pro občasná gesta */
const bump = (x) => (x <= 0 || x >= 1) ? 0 : Math.sin(Math.PI * x);

/* společné barvy pleti */
const SKIN = '#eab98c';
const SKIN_HI = '#f6d3ab';
const INK = 'rgba(32,16,9,0.92)';        // výrazná tmavá kontura (CoMI)
const TONE_D = 'rgba(30,22,58,0.26)';    // stínový cel-tón (modrofialový)
const TONE_L = 'rgba(255,240,205,0.14)'; // osvětlený cel-tón
const EYE_D = '#2a1a10';
/* směr světla (odkud svítí): nízké zimní slunce / okna vlevo nahoře.
   CLX = LX kompenzované o flip postavy (ctx.scale(dir,1)), aby světlo
   zůstalo ve SVĚTOVÝCH souřadnicích — rim se neotáčí s postavou. */
const LX = -0.62, LY = -0.78;
let CLX = LX;

/* ---------------------------------------------------- rim-light dle scény
   Engine přebarvuje postavu scene.lightTint (source-atop); tady si z téže
   hodnoty (přes registr, čtení jen — API se nemění) odvodíme BARVU okraje
   po siluetě. Scény s lokálním teplým zdrojem (oheň v koších, svíčky) mají
   ruční override — Jirka u ohně v old_town MUSÍ mít teplý okraj. */
const RIM_OVERRIDE = {
  old_town:    ['rgba(255,186,104,1)', 'rgba(255,186,104,0.60)'],    // ohně + okna
  observatory: ['rgba(255,212,146,1)', 'rgba(255,212,146,0.55)'],    // svíčky
  square:      ['rgba(255,228,184,0.9)', 'rgba(255,228,184,0.42)'],  // nízké slunce
};
const RIM_DEF = ['rgba(210,232,255,0.95)', 'rgba(210,232,255,0.45)'];
let RIM = RIM_DEF[0];        // hlavní rim (kontury cel-shadingu)
let RIM_SOFT = RIM_DEF[1];   // slabší rim (končetiny)
function sceneRim() {
  const id = BNJ.state && BNJ.state.scene;
  const o = id && RIM_OVERRIDE[id];
  if (o) { RIM = o[0]; RIM_SOFT = o[1]; return; }
  const sc = id && BNJ._registry && BNJ._registry.scenes && BNJ._registry.scenes[id];
  const m = sc && sc.lightTint &&
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(sc.lightTint);
  if (m) {
    /* zesvětlit tint směrem k bílé → okrajové světlo v barvě scény */
    const L = (v) => Math.round(mix(+v, 255, 0.55));
    RIM = 'rgba(' + L(m[1]) + ',' + L(m[2]) + ',' + L(m[3]) + ',0.88)';
    RIM_SOFT = 'rgba(' + L(m[1]) + ',' + L(m[2]) + ',' + L(m[3]) + ',0.40)';
  } else { RIM = RIM_DEF[0]; RIM_SOFT = RIM_DEF[1]; }
}

/* ------------------------------------------------------------- pomocníci */
function ell(ctx, x, y, rx, ry, col, rot) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  ctx.fill();
}

function shadow(ctx, rx) {
  ell(ctx, 0, -4, rx, rx * 0.22, 'rgba(10,14,26,0.28)');
}

/* půlrovina: bod (px,py), vnější normála (nx,ny), rozměr S — pro clipy tónů */
function hp(ctx, px, py, nx, ny, S) {
  const tx = -ny, ty = nx;
  ctx.moveTo(px + tx * S, py + ty * S);
  ctx.lineTo(px - tx * S, py - ty * S);
  ctx.lineTo(px - tx * S + nx * S, py - ty * S + ny * S);
  ctx.lineTo(px + tx * S + nx * S, py + ty * S + ny * S);
  ctx.closePath();
}

/* Cel-shading à la CoMI: výplň + stínový tón na odvrácené straně + světlý
   tón po směru světla + rim-light po kontuře + inkoustová kontura, která na
   stinné straně zesílí (proměnlivá tloušťka linky).
   path = fn(c) vykreslí tvar; o = {base, cx, cy, r, lw, dark, light, rim, rimW, ink}
   (dark/light/rim: null = vynechat, undefined = výchozí tóny) */
function cel(ctx, path, o) {
  const cx = o.cx || 0, cy = o.cy || 0, R = o.r || 50, S = R * 4;
  ctx.save();
  ctx.beginPath(); path(ctx);
  if (o.base) { ctx.fillStyle = o.base; ctx.fill(); }
  ctx.clip();
  if (o.dark !== null) {
    ctx.fillStyle = o.dark || TONE_D;
    ctx.beginPath(); hp(ctx, cx - CLX * R * 0.30, cy - LY * R * 0.30, -CLX, -LY, S); ctx.fill();
  }
  if (o.light !== null) {
    ctx.fillStyle = o.light || TONE_L;
    ctx.beginPath(); hp(ctx, cx + CLX * R * 0.45, cy + LY * R * 0.45, CLX, LY, S); ctx.fill();
  }
  ctx.restore();
  const lw = o.lw || 3;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath(); path(ctx);
  ctx.strokeStyle = o.ink || INK; ctx.lineWidth = lw; ctx.stroke();
  ctx.beginPath(); hp(ctx, cx - CLX * R * 0.05, cy - LY * R * 0.05, -CLX, -LY, S); ctx.clip();
  ctx.beginPath(); path(ctx);
  ctx.lineWidth = lw * 1.9; ctx.stroke();
  ctx.restore();
  /* rim-light AŽ NAVRCH (přes inkoust), oříznutý dovnitř siluety —
     jasná světlá hrana po návětrné straně à la CoMI */
  if (o.rim !== null) {
    ctx.save();
    ctx.beginPath(); path(ctx); ctx.clip();
    ctx.beginPath(); hp(ctx, cx + CLX * R * 0.28, cy + LY * R * 0.28, CLX, LY, S); ctx.clip();
    ctx.beginPath(); path(ctx);
    ctx.strokeStyle = o.rim || RIM; ctx.lineWidth = o.rimW || 10; ctx.stroke();
    ctx.restore();
  }
}

/* rim-light po kontuře libovolného tvaru (čepice, šátky — velké masy
   siluety, které nejdou přes cel()) — jen na návětrné straně */
function rimStroke(ctx, path, cx, cy, r, w) {
  const S = (r || 40) * 4;
  ctx.save();
  ctx.beginPath(); path(ctx); ctx.clip();          // jen dovnitř siluety
  ctx.beginPath(); hp(ctx, cx + CLX * r * 0.25, cy + LY * r * 0.25, CLX, LY, S); ctx.clip();
  ctx.beginPath(); path(ctx);
  ctx.strokeStyle = RIM; ctx.lineWidth = (w || 8) * 1.5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

/* karikaturní hlava: kulaté temeno, tvář a brada vystrčené dopředu (+x).
   chin: 0 = měkce kulatá, ~1.4 = ostrá vystrčená brada */
function headRound(hx, hy, rx, ry, chin) {
  const ch = chin || 0;
  return function (c) {
    c.moveTo(hx - rx, hy + ry * 0.08);
    c.quadraticCurveTo(hx - rx * 1.04, hy - ry * 0.86, hx - rx * 0.3, hy - ry * 0.99);
    c.quadraticCurveTo(hx + rx * 0.42, hy - ry * 1.08, hx + rx * 0.88, hy - ry * 0.52);
    c.quadraticCurveTo(hx + rx * 1.06, hy - ry * 0.1, hx + rx * 0.98, hy + ry * 0.3);
    c.quadraticCurveTo(hx + rx * (0.98 + ch * 0.08), hy + ry * (0.5 + ch * 0.1),
      hx + rx * (0.6 + ch * 0.12), hy + ry * (0.68 + ch * 0.16));
    c.quadraticCurveTo(hx + rx * 0.25, hy + ry * (0.92 + ch * 0.08), hx - rx * 0.2, hy + ry * 0.88);
    c.quadraticCurveTo(hx - rx * 0.85, hy + ry * 0.72, hx - rx, hy + ry * 0.08);
    c.closePath();
  };
}

/* dvoudílná končetina: rameno/kyčel → (ohyb) → dlaň/chodidlo.
   Inkoustový podklad = kontura kolem celé končetiny, stínový tón po
   odvrácené straně, tenký rim po návětrné. */
function limb(ctx, x0, y0, bx, by, x1, y1, w, col) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w + 5;               // kontura
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(bx, by, x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w;                   // jádro
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(bx, by, x1, y1); ctx.stroke();
  const dx = -CLX * w * 0.28, dy = -LY * w * 0.28;             // stínový tón
  ctx.strokeStyle = TONE_D; ctx.lineWidth = w * 0.5;
  ctx.beginPath(); ctx.moveTo(x0 + dx, y0 + dy);
  ctx.quadraticCurveTo(bx + dx * 1.4, by + dy * 1.4, x1 + dx, y1 + dy); ctx.stroke();
  ctx.strokeStyle = RIM_SOFT; ctx.lineWidth = Math.max(2, w * 0.26);
  ctx.beginPath(); ctx.moveTo(x0 - dx, y0 - dy);              // rim dle světla scény
  ctx.quadraticCurveTo(bx - dx * 1.3, by - dy * 1.3, x1 - dx, y1 - dy); ctx.stroke();
}

/* velká karikaturní dlaň s palcem (CoMI ruce!) — zvětšeno o dalších ~30 % */
function hand(ctx, x, y, r, col) {
  const R = r * 1.75;
  cel(ctx, (c) => { c.ellipse(x - R * 0.54, y - R * 0.5, R * 0.48, R * 0.38, -0.7, 0, TAU); },
    { base: col, cx: x - R * 0.5, cy: y - R * 0.5, r: R * 0.5, lw: 2.2, rim: null });
  cel(ctx, (c) => { c.ellipse(x, y, R, R * 0.9, -0.25, 0, TAU); },
    { base: col, cx: x, cy: y, r: R, lw: 2.8 });
}

/* holá pracovní ruka s PRSTY (žádný palčákový bochánek) — dlaň, palec a
   tři buclaté prsty vějířem ve směru ang. Pro postavy bez rukavic. */
function handBare(ctx, x, y, r, ang) {
  const R = r * 1.6;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang || 0);
  /* palec — odstátý proti prstům */
  cel(ctx, (c) => { c.ellipse(-R * 0.42, -R * 0.5, R * 0.44, R * 0.28, -0.85, 0, TAU); },
    { base: SKIN, cx: -R * 0.42, cy: -R * 0.5, r: R * 0.4, lw: 2, rim: null });
  /* tři prsty vějířem (kreslené PŘED dlaní, ať z ní vyrůstají) */
  for (let i = 0; i < 3; i++) {
    const a = -0.46 + i * 0.46;
    const fx = Math.cos(a) * R * 0.88, fy = Math.sin(a) * R * 0.88;
    cel(ctx, (c) => { c.ellipse(fx, fy, R * 0.42, R * 0.21, a, 0, TAU); },
      { base: SKIN, cx: fx, cy: fy, r: R * 0.35, lw: 1.9, rim: null });
  }
  /* dlaň navrch */
  cel(ctx, (c) => { c.ellipse(0, 0, R * 0.74, R * 0.66, -0.18, 0, TAU); },
    { base: SKIN, cx: 0, cy: 0, r: R * 0.7, lw: 2.3 });
  /* klouby — dvě tečky */
  ctx.fillStyle = 'rgba(150,84,48,0.35)';
  ctx.beginPath(); ctx.arc(R * 0.3, -R * 0.2, 1.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(R * 0.42, R * 0.12, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
}

/* bota — OBŘÍ fazetovaná bagančata à la CoMI: rovné seky, zvednutá špička,
   podpatek. y ~ střed boty, spodek podrážky zůstává na y + h2*1.25. */
function boot(ctx, x, y, len, h2, col) {
  const W2 = len * 1.5, H = h2 * 1.25;
  const path = (c) => {
    c.moveTo(x - W2 * 0.5, y + H);                 // pata dole
    c.lineTo(x - W2 * 0.6, y - H * 0.5);           // zadní hrana — rovný sek
    c.lineTo(x - W2 * 0.22, y - H * 0.95);         // horní lem
    c.lineTo(x + W2 * 0.3, y - H * 0.62);          // nárt (zlom)
    c.lineTo(x + W2 * 0.92, y - H * 0.4);          // hřbet ke špičce
    c.lineTo(x + W2 * 1.08, y - H * 0.05);         // zvednutá špička
    c.lineTo(x + W2 * 0.98, y + H * 0.62);         // čelo špičky
    c.lineTo(x + W2 * 0.42, y + H);                // podrážka
    c.closePath();
  };
  cel(ctx, path, { base: col, cx: x + W2 * 0.2, cy: y, r: W2, lw: 2.8 });
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;         // šev podrážky
  ctx.beginPath();
  ctx.moveTo(x - W2 * 0.48, y + H * 0.55);
  ctx.lineTo(x + W2 * 0.9, y + H * 0.45);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';                        // odlesk špičky
  ctx.beginPath();
  ctx.moveTo(x + W2 * 0.5, y - H * 0.45);
  ctx.lineTo(x + W2 * 0.94, y - H * 0.28);
  ctx.lineTo(x + W2 * 0.78, y + H * 0.05);
  ctx.lineTo(x + W2 * 0.44, y - H * 0.1);
  ctx.closePath(); ctx.fill();
}

/* trup: ramena → boky — LOMENÉ linie místo hladkých oblouků (CoMI/RtMI
   fazety): seknutá ramena, zalomený bok, cípatý lem kabátu. */
function torso(ctx, shY, hipY, wSh, wHip, belly, col, edge) {
  const midY = (shY + hipY) / 2, hh = hipY - shY;
  const path = (c) => {
    c.moveTo(-wSh, shY);
    c.lineTo(-wSh - belly, midY - hh * 0.1);       // lomený bok (loket fazety)
    c.lineTo(-wHip - belly * 0.4, hipY - hh * 0.12);
    c.lineTo(-wHip, hipY);
    c.lineTo(-wHip * 0.5, hipY + 10);              // cíp lemu
    c.lineTo(wHip * 0.06, hipY + 4);
    c.lineTo(wHip * 0.58, hipY + 11);              // druhý cíp
    c.lineTo(wHip, hipY);
    c.lineTo(wSh + belly, midY + hh * 0.08);
    c.lineTo(wSh, shY);
    c.lineTo(wSh * 0.52, shY - 10);                // seknuté rameno
    c.lineTo(-wSh * 0.48, shY - 11);
    c.closePath();
  };
  cel(ctx, path, {
    base: col, cx: 0, cy: midY, r: Math.max(wSh, wHip) + belly,
    lw: edge ? 3.4 : 2.8
  });
}

/* oči: bělmo + panenka, mrkání zavírá víčka */
function eyes(ctx, ex1, ex2, ey, r, blink, look) {
  const open = 1 - clamp(blink * 1.25, 0, 1);
  const lx = (look || 0.3) * r;
  if (open < 0.22) {
    ctx.strokeStyle = '#41281a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex1 - r, ey + 1); ctx.lineTo(ex1 + r, ey + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex2 - r * 0.9, ey + 1); ctx.lineTo(ex2 + r * 0.9, ey + 1); ctx.stroke();
    return;
  }
  ctx.fillStyle = '#f8f3e4';
  ctx.beginPath(); ctx.ellipse(ex1, ey, r, r * 1.18 * open, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(ex2, ey, r * 0.92, r * 1.1 * open, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(ex1, ey, r, r * 1.18 * open, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(ex2, ey, r * 0.92, r * 1.1 * open, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = EYE_D;
  ctx.beginPath(); ctx.arc(ex1 + lx, ey + r * 0.08, r * 0.42, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2 + lx, ey + r * 0.08, r * 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(ex1 + lx - r * 0.12, ey - r * 0.1, r * 0.12, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2 + lx - r * 0.12, ey - r * 0.1, r * 0.11, 0, TAU); ctx.fill();
}

function brow(ctx, x, y, w2, tilt, col, lw) {
  ctx.strokeStyle = col; ctx.lineWidth = lw || 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w2, y + tilt);
  ctx.quadraticCurveTo(x, y - 3, x + w2, y - tilt);
  ctx.stroke();
}

/* ústa: otevření dle m (0..1); zavřená = úsměv/rovná linka dle curve */
function mouthDraw(ctx, x, y, m, w2, curve, col) {
  ctx.lineCap = 'round';
  if (m > 0.12) {
    ctx.fillStyle = col || '#5e241c';
    ctx.beginPath(); ctx.ellipse(x, y + m * 2, w2 * 0.55, 2.5 + m * 7.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(250,246,232,0.9)';
    ctx.fillRect(x - w2 * 0.32, y - 1.5 - m * 2.5, w2 * 0.64, 3);
  } else {
    ctx.strokeStyle = col || '#5e241c'; ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(x - w2, y - curve * 0.4);
    ctx.quadraticCurveTo(x, y + curve, x + w2, y - curve * 0.6);
    ctx.stroke();
  }
}

function cheeks(ctx, x1, x2, y, r, a) {
  ctx.fillStyle = 'rgba(216,86,62,' + a + ')';
  ctx.beginPath(); ctx.ellipse(x1, y, r, r * 0.66, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x2, y, r * 0.88, r * 0.6, 0, 0, TAU); ctx.fill();
}

/* ------------------------------------------------------------------- rig
   Společný výpočet animačních veličin z pose. Walk cycle kvantovaný na
   8 fází (Math.floor(phase*8)) → „loutkový" krok jako u sprite animací. */
function rigOf(pose, cfg) {
  sceneRim();                                             // rim dle světla scény
  CLX = LX * ((pose && pose.dir) || 1);                   // světlo ve world-space
  const t = pose.t || 0;
  const act = pose.action || 'idle';
  const walk = act === 'walk';
  let ph = (pose.phase || 0) % 1; if (ph < 0) ph += 1;
  const th = ((Math.floor(ph * 8) + 0.5) / 8) * TAU;      // 8 fází
  const sinT = walk ? Math.sin(th) : 0;
  const cosT = walk ? Math.cos(th) : 0;
  /* chodidla: x = kyv, zdvih jen ve švihové fázi.
     Mimo chůzi ASYMETRICKÝ postoj: váha na zadní noze, přední vykročená
     (kontrapost — žádné symetrické „panáčkování"). */
  const stA = walk ? 0 : (cfg.stA === undefined ? 18 : cfg.stA);
  const stB = walk ? 0 : (cfg.stB === undefined ? -7 : cfg.stB);
  const fA = { x: cosT * cfg.stride + stA, y: -Math.max(0, -sinT) * cfg.lift };
  const fB = { x: -cosT * cfg.stride + stB, y: -Math.max(0, sinT) * cfg.lift };
  const bob = walk ? Math.abs(sinT) * cfg.bob : Math.sin(t * cfg.br) * cfg.idleBob;
  const breath = walk ? 0.5 : Math.sin(t * cfg.br) * 0.5 + 0.5;
  const talk = act === 'talk';
  const gA = talk ? Math.sin(t * 5.3) : 0;                 // gesto přední ruky
  const gB = talk ? Math.sin(t * 3.7 + 1.3) : 0;           // gesto zadní ruky
  const per = cfg.gPeriod || 8.5;
  const ges = act === 'idle'
    ? bump((((t + (cfg.gOff || 0)) % per) - (per - 2.1)) / 2.1)
    : 0;                                                   // občasné idle gesto
  const reach = act === 'reach' ? 1 : 0;
  const pick = act === 'pickup' ? 1 : 0;
  const wob = Math.sin(t * 3.1) * 2;                       // drobný živý neklid
  return {
    t, act, walk, talk, sinT, cosT, fA, fB, bob, breath, gA, gB, ges,
    reach, pick, wob,
    crouch: pick * (cfg.crouch || 46),
    lean: walk ? (cfg.lean || 0.05)
      : (reach ? 0.09 : (pick ? 0.13 : (cfg.idleLean === undefined ? 0.028 : cfg.idleLean))),
    armSw: cosT * (cfg.armAmp || 0.7),
    blink: pose.blink || 0,
    mouth: pose.mouth || 0
  };
}

/* =========================================================================
   JIŘÍK — 14letý posel. Zrzavé vlasy zpod kulicha s bambulí, dlouhá červená
   šála (vlaje!), záplatovaný kabátec, brašna přes rameno (houpe se), velké
   boty, palčáky. Pružný, poskakuje. Výška 300.
   ========================================================================= */
function drawJirka(ctx, pose) {
  const r = rigOf(pose, {
    stride: 26, lift: 22, bob: 9, br: 1.8, idleBob: 2.6,
    gPeriod: 8.2, gOff: 0, crouch: 52, lean: 0.075, armAmp: 0.85,
    stA: 24, stB: -9, idleLean: 0.038
  });
  const t = r.t;
  const COAT = '#7c5433', COAT_D = '#5c3d24', PANTS = '#4a3a52', BOOT = '#2c1f16';
  const SCARF = '#a63a2e', SCARF_D = '#7c2a20', HAIR = '#c9722e', CAP = '#7a3020';
  const MITT = '#8a3226';

  ctx.save();
  ctx.scale(pose.dir || 1, 1);
  shadow(ctx, 50);
  ctx.rotate(r.lean);

  const dy = r.crouch - r.bob;          // posun horní poloviny těla
  const hipY = -122 + dy, shY = -206 + dy;
  const hy = -250 + dy;                 // střed hlavy
  const hr = 42;                        // velká hlava!

  /* --- nohy (8 fází) --- */
  const spread = 9;
  const legW = 15;
  if (r.pick) {
    limb(ctx, -spread, hipY, -spread - 26, hipY + 52, -20, -8, legW, PANTS);
    limb(ctx, spread, hipY, spread + 30, hipY + 50, 24, -8, legW, PANTS);
    boot(ctx, -20, -7, 22, 9, BOOT);
    boot(ctx, 24, -7, 22, 9, BOOT);
  } else {
    limb(ctx, -spread, hipY, (-spread + r.fB.x) / 2 + 10, (hipY + r.fB.y - 8) / 2, r.fB.x - 4, r.fB.y - 8, legW, PANTS);
    limb(ctx, spread, hipY, (spread + r.fA.x) / 2 + 12, (hipY + r.fA.y - 8) / 2, r.fA.x + 4, r.fA.y - 8, legW, PANTS);
    boot(ctx, r.fB.x - 4, r.fB.y - 7, 22, 9, BOOT);
    boot(ctx, r.fA.x + 4, r.fA.y - 7, 23, 9.5, BOOT);
  }

  /* --- zadní paže (za trupem) --- */
  const shBx = -24, shBy = shY + 12;
  let hB = { x: -24 + r.armSw * 36, y: hipY + 24 - Math.abs(r.armSw) * 8 };
  if (r.talk) hB = { x: -40 - r.gB * 8, y: shY + 46 - r.gB * 16 };
  if (r.ges > 0) hB = { x: mix(hB.x, 16, r.ges), y: mix(hB.y, hy + 26, r.ges) }; // fouká si do dlaní
  limb(ctx, shBx, shBy, (shBx + hB.x) / 2 - 8, (shBy + hB.y) / 2 + 12, hB.x, hB.y, 13, COAT_D);
  hand(ctx, hB.x, hB.y, 12, MITT);

  /* --- šála: zadní vlající konec (sekundární pohyb) --- */
  const fl = r.walk ? 1.7 : 1;
  ctx.strokeStyle = SCARF; ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, shY + 4);
  ctx.quadraticCurveTo(-34, shY + 16 + Math.sin(t * 2.4) * 5 * fl,
    -56 - fl * 6, shY + 40 + Math.sin(t * 2.4 + 1.1) * 9 * fl);
  ctx.quadraticCurveTo(-74 - fl * 10, shY + 60 + Math.sin(t * 2.4 + 2.1) * 12 * fl,
    -80 - fl * 12, shY + 88 + Math.sin(t * 2.4 + 3) * 13 * fl);
  ctx.stroke();
  ctx.strokeStyle = SCARF_D; ctx.lineWidth = 5;                       // třásně
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-80 - fl * 12 + i * 6, shY + 84 + Math.sin(t * 2.4 + 3) * 13 * fl);
    ctx.lineTo(-83 - fl * 13 + i * 7, shY + 101 + Math.sin(t * 2.4 + 3.4) * 13 * fl);
    ctx.stroke();
  }

  /* --- trup: kabátec — dětská „áčková" silueta, rozšířený lem --- */
  torso(ctx, shY, hipY + 14, 26, 36, 5 + r.breath * 2, COAT, INK);
  /* záplaty */
  ell(ctx, -13, shY + 52, 8, 11, 'rgba(255,236,200,0.20)', 0.4);
  ctx.strokeStyle = 'rgba(40,24,12,0.5)'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-20 + i * 4.5, shY + 42);
    ctx.lineTo(-18 + i * 4.5, shY + 47);
    ctx.stroke();
  }
  /* pás s přezkou */
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(-30, hipY - 6, 60, 10);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(-6, hipY - 7, 13, 12);
  ctx.fillStyle = '#7a5c2a';
  ctx.fillRect(-2.5, hipY - 4, 6, 6);
  /* knoflíky */
  ctx.fillStyle = '#caa25a';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(6, shY + 26 + i * 22, 3, 0, TAU); ctx.fill();
  }

  /* --- brašna: řemen + houpající se taška --- */
  ctx.strokeStyle = '#46311e'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-22, shY + 8); ctx.lineTo(26, hipY - 2); ctx.stroke();
  const bagA = r.walk ? Math.sin((pose.phase || 0) * TAU - 0.9) * 0.3
    : Math.sin(t * 1.35) * 0.06 + r.lean * 0.4;
  ctx.save();
  ctx.translate(27, hipY);
  ctx.rotate(bagA);
  ctx.fillStyle = '#5e4329';
  ctx.beginPath();
  ctx.moveTo(-17, 0); ctx.lineTo(17, 0);
  ctx.quadraticCurveTo(19, 26, 0, 28);
  ctx.quadraticCurveTo(-19, 26, -17, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.fillStyle = '#4a3320';                                    // klopa
  ctx.beginPath();
  ctx.moveTo(-17, 0); ctx.lineTo(17, 0);
  ctx.quadraticCurveTo(15, 13, 0, 14);
  ctx.quadraticCurveTo(-15, 13, -17, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#caa25a';
  ctx.beginPath(); ctx.arc(0, 12, 3.2, 0, TAU); ctx.fill();
  ctx.restore();

  /* --- přední paže --- */
  const shAx = 24, shAy = shY + 12;
  let hA = { x: 28 - r.armSw * 38, y: hipY + 24 - Math.abs(r.armSw) * 9 };
  if (!r.walk) hA = { x: 20, y: shY + 54 };   // idle: palec za řemenem brašny
  if (r.talk) hA = { x: 50 + r.gA * 9, y: shY + 40 - r.gA * 20 };
  if (r.ges > 0) hA = { x: mix(hA.x, 30, r.ges), y: mix(hA.y, hy + 24, r.ges) };
  if (r.reach) hA = { x: 76 + r.wob, y: shY + 26 + r.wob };
  if (r.pick) hA = { x: 56, y: -16 };
  limb(ctx, shAx, shAy, (shAx + hA.x) / 2 + 7, (shAy + hA.y) / 2 + 13, hA.x, hA.y, 13, COAT);
  hand(ctx, hA.x, hA.y, 12.5, MITT);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;    // šev palčáku
  ctx.beginPath(); ctx.arc(hA.x, hA.y, 6, -0.6, 1.2); ctx.stroke();

  /* --- šála: ovin kolem krku --- */
  ctx.strokeStyle = SCARF; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, shY + 2);
  ctx.quadraticCurveTo(0, shY + 12, 18, shY + 2);
  ctx.stroke();
  ctx.strokeStyle = SCARF_D; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, shY + 7);
  ctx.quadraticCurveTo(0, shY + 14, 14, shY + 7);
  ctx.stroke();

  /* --- hlava: karikatura s vystrčenou bradou, ne koule --- */
  ctx.fillStyle = SKIN;
  ctx.fillRect(-8, shY - 14, 16, 18);                              // krk
  cel(ctx, headRound(0, hy, hr, hr, 1.0), { base: SKIN, cx: 0, cy: hy, r: hr, lw: 3 });

  /* uši + vlasy zpod kulicha (sekundární: cuchání) */
  cel(ctx, (c) => { c.ellipse(-hr + 4, hy + 5, 8.5, 11, -0.15, 0, TAU); },
    { base: SKIN, cx: -hr + 4, cy: hy + 5, r: 9, lw: 2.2, rim: null });
  const hsw = Math.sin(t * 2.2) * (r.walk ? 4 : 2);
  ctx.fillStyle = HAIR;
  ctx.beginPath();                                                  // zátylkové tufty
  ctx.moveTo(-hr + 2, hy - 8);
  ctx.quadraticCurveTo(-hr - 10 + hsw, hy + 4, -hr - 4 + hsw, hy + 16);
  ctx.quadraticCurveTo(-hr + 2, hy + 10, -hr + 4, hy + 18);
  ctx.quadraticCurveTo(-hr + 8, hy + 8, -hr + 2, hy - 8);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();                                                  // ofina do čela
  ctx.moveTo(hr - 12, hy - 22);
  ctx.quadraticCurveTo(hr + 4, hy - 12, hr - 2, hy - 2);
  ctx.quadraticCurveTo(hr - 10, hy - 8, hr - 14, hy - 4);
  ctx.quadraticCurveTo(hr - 12, hy - 12, hr - 12, hy - 22);
  ctx.closePath(); ctx.fill();

  /* kulich s bambulí (bambule poskakuje) */
  ctx.fillStyle = CAP;
  ctx.beginPath(); ctx.arc(0, hy - 13, hr - 1, Math.PI, 0); ctx.closePath(); ctx.fill();
  rimStroke(ctx, (c) => { c.arc(0, hy - 13, hr - 1, Math.PI, 0); c.closePath(); },
    0, hy - 13, hr, 6);
  ctx.fillStyle = '#8f4030';
  ctx.beginPath();
  ctx.moveTo(-hr + 1, hy - 13);
  ctx.quadraticCurveTo(0, hy - 4, hr - 1, hy - 13);
  ctx.lineTo(hr - 1, hy - 20);
  ctx.quadraticCurveTo(0, hy - 12, -hr + 1, hy - 20);
  ctx.closePath(); ctx.fill();
  const pomY = hy - 13 - (hr - 1) - 5 + Math.sin(t * 2.7) * 1.5 - (r.walk ? Math.abs(r.sinT) * 3 : 0);
  ell(ctx, 3, pomY, 8.5, 8, '#e0c9a0');
  ell(ctx, 1, pomY - 2, 4, 3.5, 'rgba(255,255,255,0.5)');

  /* obličej — drzý úsměv, pihy */
  const bl = r.talk ? r.mouth * 4 : (r.ges > 0 ? 3 : 0);
  brow(ctx, 12, hy - 16 - bl, 7.5, 1.5, '#8a4518', 5);
  brow(ctx, 30, hy - 17 - bl, 7, 1.5, '#8a4518', 5);
  eyes(ctx, 12, 30, hy - 7, 5.6, r.blink, 0.35);
  /* velký pršáček-bambule (karikatura, ne čárka) */
  cel(ctx, (c) => { c.ellipse(26, hy + 5, 8.5, 7, 0.12, 0, TAU); },
    { base: '#e8a878', cx: 26, cy: hy + 5, r: 8.5, lw: 2.2 });
  ell(ctx, 23, hy + 2.5, 2.8, 2.2, 'rgba(255,255,255,0.5)');
  cheeks(ctx, 6, 36, hy + 10, 6.5, 0.30);
  ctx.fillStyle = 'rgba(150,84,48,0.55)';                           // pihy
  ctx.beginPath(); ctx.arc(8, hy + 6, 1.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(13, hy + 9, 1.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(33, hy + 6, 1.1, 0, TAU); ctx.fill();
  mouthDraw(ctx, 19, hy + 19, r.mouth, 9, 4.5, '#6e2a1e');

  ctx.restore();
}

/* =========================================================================
   TYCHO BRAHE — hřmotný cholerik. Černý kabátec, okruží, zlatý řetěz
   (řád slona), mohutné zrzavé kníry, špičatá bradka a MOSAZNÝ NOS,
   který se blýská. Idle gesto: leští si nos rukávem. Výška 360.
   ========================================================================= */
function drawBrahe(ctx, pose) {
  const r = rigOf(pose, {
    stride: 22, lift: 14, bob: 5, br: 1.35, idleBob: 2,
    gPeriod: 9.5, gOff: 3.1, crouch: 40, lean: 0.045, armAmp: 0.4,
    stA: 14, stB: -14, idleLean: 0.02
  });
  const t = r.t;
  const DOUB = '#26212b', DOUB_L = '#3a3344', GOLD = '#d9a832', GOLD_D = '#8a6a1e';
  const BRASS = '#c9932e', BRASS_HI = '#ffe9a8', MUST = '#b35a24', BOOT = '#1c1614';

  ctx.save();
  ctx.scale(pose.dir || 1, 1);
  shadow(ctx, 64);
  ctx.rotate(r.lean);

  const dy = r.crouch - r.bob;
  const hipY = -142 + dy, shY = -252 + dy;
  const hy = -304 + dy, hr = 45;

  /* --- nohy: sloupy v pumpkách --- */
  const spread = 19, legW = 24;
  if (r.pick) {
    limb(ctx, -spread, hipY, -spread - 28, hipY + 60, -26, -9, legW, '#33272a');
    limb(ctx, spread, hipY, spread + 32, hipY + 58, 30, -9, legW, '#33272a');
    boot(ctx, -26, -8, 27, 11, BOOT); boot(ctx, 30, -8, 27, 11, BOOT);
  } else {
    limb(ctx, -spread, hipY, (-spread + r.fB.x) / 2 + 9, (hipY + r.fB.y) / 2, r.fB.x - 6, r.fB.y - 9, legW, '#33272a');
    limb(ctx, spread, hipY, (spread + r.fA.x) / 2 + 11, (hipY + r.fA.y) / 2, r.fA.x + 6, r.fA.y - 9, legW, '#33272a');
    boot(ctx, r.fB.x - 6, r.fB.y - 8, 27, 11, BOOT);
    boot(ctx, r.fA.x + 6, r.fA.y - 8, 28, 11.5, BOOT);
  }
  /* pumpky (nabírané kalhoty) */
  cel(ctx, (c) => { c.ellipse(-spread, hipY + 16, 23, 27, 0, 0, TAU); },
    { base: '#3e3036', cx: -spread, cy: hipY + 16, r: 25, lw: 2.6, rim: null });
  cel(ctx, (c) => { c.ellipse(spread, hipY + 16, 23, 27, 0, 0, TAU); },
    { base: '#3e3036', cx: spread, cy: hipY + 16, r: 25, lw: 2.6 });

  /* --- zadní paže: v klidu založená ZA zády (schovaná pod kabátcem) --- */
  const shBx = -46, shBy = shY + 18;
  let hB = { x: -52 + r.armSw * 26, y: hipY + 12 };
  if (!r.walk) hB = { x: -20, y: hipY + 16 };            // za zády — kabát ji kryje
  if (r.talk) hB = { x: -58 - r.gB * 6, y: shY + 60 - r.gB * 10 };
  limb(ctx, shBx, shBy, (shBx + hB.x) / 2 - 10, (shBy + hB.y) / 2 + 14, hB.x, hB.y, 21, DOUB);
  if (r.walk || r.talk) hand(ctx, hB.x, hB.y, 14.5, SKIN);

  /* --- trup: klínový kabátec — ramena jak almara, dole užší (nadsázka) --- */
  torso(ctx, shY, hipY + 18, 66, 45, 20 + r.breath * 3, DOUB, INK);
  ctx.fillStyle = DOUB_L;                                          // prostřih rukávů
  ell(ctx, -50, shY + 22, 15, 24, DOUB_L);
  ell(ctx, 48, shY + 22, 15, 24, DOUB_L);
  /* kožešinový lem středem */
  ctx.strokeStyle = '#4e4438'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(2, shY + 6); ctx.lineTo(2, hipY + 16); ctx.stroke();
  ctx.strokeStyle = 'rgba(210,196,170,0.30)'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(-2, shY + 14 + i * 13);
    ctx.lineTo(7, shY + 18 + i * 13);
    ctx.stroke();
  }
  /* zlatý řetěz + přívěsek slona */
  ctx.strokeStyle = GOLD; ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-38, shY + 14);
  ctx.quadraticCurveTo(0, shY + 58, 38, shY + 14);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    const cx2 = mix(-38, 38, k);
    const cy2 = shY + 14 + Math.sin(Math.PI * k) * 33;
    ctx.beginPath(); ctx.arc(cx2, cy2, 3.4, 0, TAU); ctx.fill();
  }
  ctx.save();                                                       // slon
  ctx.translate(0, shY + 58);
  ctx.fillStyle = GOLD;
  ell(ctx, 0, 4, 9, 6.5, GOLD);
  ell(ctx, -7, 0, 4.5, 4, GOLD);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -1); ctx.quadraticCurveTo(-14, 4, -11, 8); ctx.stroke();
  ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(0, 4, 9, 6.5, 0, 0, TAU); ctx.stroke();
  ctx.restore();

  /* --- přední paže --- */
  const shAx = 46, shAy = shY + 18;
  let hA = { x: 54 - r.armSw * 28, y: hipY + 12 };
  let point = false, bowX = 12, bowY = 16;
  if (!r.walk) { hA = { x: 8, y: shY + 64 }; bowX = 30; bowY = 10; } // dlaň svírá řetěz (panské gesto)
  if (r.talk) {
    bowX = 12; bowY = 16;
    if (Math.sin(t * 0.9) > -0.2) { hA = { x: 60 + r.gA * 5, y: shY - 58 - r.gA * 8 }; point = true; }
    else hA = { x: 66 + r.gA * 8, y: shY + 48 - r.gA * 14 };
  }
  if (r.ges > 0) { hA = { x: mix(hA.x, 38, r.ges), y: mix(hA.y, hy + 12, r.ges) }; bowX = 12; bowY = 16; } // leští nos
  if (r.reach) { hA = { x: 92 + r.wob, y: shY + 30 + r.wob }; bowX = 12; bowY = 16; }
  if (r.pick) { hA = { x: 66, y: -18 }; bowX = 12; bowY = 16; }
  limb(ctx, shAx, shAy, (shAx + hA.x) / 2 + bowX, (shAy + hA.y) / 2 + (point ? -6 : bowY), hA.x, hA.y, 21, DOUB);
  hand(ctx, hA.x, hA.y, 15, SKIN);
  if (point) {                                                      // ukazovák k nebi
    ctx.strokeStyle = SKIN; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hA.x, hA.y); ctx.lineTo(hA.x + 4, hA.y - 18); ctx.stroke();
  }

  /* --- okruží (bílý skládaný límec) --- */
  ctx.fillStyle = '#f2eee0';
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * TAU;
    ell(ctx, Math.cos(a) * 40, shY - 6 + Math.sin(a) * 12, 11, 8, '#f2eee0', a * 0.5);
  }
  ctx.strokeStyle = 'rgba(90,80,60,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, shY - 6, 40, 12, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = TONE_D;                                           // stín pod hlavou
  ctx.beginPath(); ctx.ellipse(4, shY - 3, 30, 8, 0, 0, TAU); ctx.fill();

  /* --- hlava: široká palice, žádná koule --- */
  cel(ctx, headRound(0, hy, hr * 1.08, hr, 0.8), { base: SKIN, cx: 0, cy: hy, r: hr, lw: 3.4 });
  cel(ctx, (c) => { c.ellipse(-hr + 2, hy + 6, 8, 12, -0.1, 0, TAU); },
    { base: SKIN, cx: -hr + 2, cy: hy + 6, r: 9, lw: 2.2, rim: null });  // ucho

  /* krátké vlasy + baret (vlasy jen nad obočím, ať nedělají „masku") */
  ctx.fillStyle = '#8a5a2e';
  ctx.beginPath(); ctx.arc(0, hy - 22, hr - 6, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
  /* plochý baret s konturou a rimem */
  cel(ctx, (c) => { c.ellipse(-4, hy - hr + 4, hr + 1, 14, 0, 0, TAU); },
    { base: '#1e1a22', cx: -4, cy: hy - hr + 4, r: hr, lw: 2.8, dark: null });
  ell(ctx, -10, hy - hr - 3, hr * 0.7, 10, '#2a2433');
  ctx.fillStyle = GOLD;                                             // zlatá brož
  ctx.beginPath(); ctx.arc(18, hy - hr + 4, 3.4, 0, TAU); ctx.fill();

  /* hněvivé obočí + oči — těžké huňaté klíny */
  const bl = r.talk ? r.mouth * 5 : 0;
  brow(ctx, 12, hy - 17 - bl, 10, -4.5, '#7a3c12', 7.5);
  brow(ctx, 33, hy - 18 - bl, 9, -4.5, '#7a3c12', 7.5);
  eyes(ctx, 12, 32, hy - 7, 5.8, r.blink, 0.3);

  /* === KNÍRY JAK ŠAVLE — plné tvarované, špičky vzhůru (pod nosem) === */
  const mj = r.talk ? Math.sin(t * 12) * 2 : Math.sin(t * 1.1) * 0.9;
  const saber = (sx, d2) => {
    ctx.beginPath();
    ctx.moveTo(sx, hy + 19);
    ctx.quadraticCurveTo(sx + d2 * 18, hy + 30, sx + d2 * 46, hy + 20 + mj);
    ctx.quadraticCurveTo(sx + d2 * 68, hy + 12 + mj, sx + d2 * 80, hy - 8 + mj * 1.6);
    ctx.quadraticCurveTo(sx + d2 * 62, hy + 6 + mj, sx + d2 * 44, hy + 9 + mj);
    ctx.quadraticCurveTo(sx + d2 * 20, hy + 13, sx, hy + 10);
    ctx.closePath();
    ctx.fillStyle = MUST; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,214,160,0.35)';       // světlý tón po hřbetu
    ctx.beginPath();
    ctx.moveTo(sx + d2 * 8, hy + 13);
    ctx.quadraticCurveTo(sx + d2 * 34, hy + 14, sx + d2 * 62, hy - 2 + mj);
    ctx.quadraticCurveTo(sx + d2 * 40, hy + 14 + mj, sx + d2 * 10, hy + 16);
    ctx.closePath(); ctx.fill();
  };
  saber(16, -1);                                    // dozadu (kreslen dřív = pod)
  saber(26, 1);                                     // dopředu

  /* === MOSAZNÝ NOS — VELKÝ, lesklý, NAD knírem: poznávací znamení! === */
  ctx.save();
  const nosePath = () => {
    ctx.beginPath();
    ctx.moveTo(12, hy - 2);
    ctx.lineTo(40, hy + 4);
    ctx.quadraticCurveTo(47, hy + 13, 37, hy + 21);
    ctx.lineTo(11, hy + 16);
    ctx.closePath();
  };
  nosePath();
  const ng = ctx.createLinearGradient(11, hy - 2, 40, hy + 21);
  ng.addColorStop(0, '#8a5f1e');
  ng.addColorStop(0.45, BRASS);
  ng.addColorStop(0.75, BRASS_HI);
  ng.addColorStop(1, '#a97b22');
  ctx.fillStyle = ng;
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
  /* nýtky po obvodu (je to protéza!) */
  ctx.fillStyle = 'rgba(70,44,10,0.8)';
  ctx.beginPath(); ctx.arc(15, hy + 2, 1.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(15, hy + 12, 1.5, 0, TAU); ctx.fill();
  /* putující odlesk */
  const gl = (Math.sin(t * 1.25) + 1) / 2;
  ctx.beginPath();
  ctx.moveTo(mix(17, 30, gl), hy + 1);
  ctx.lineTo(mix(22, 35, gl), hy + 2);
  ctx.lineTo(mix(20, 33, gl), hy + 17);
  ctx.lineTo(mix(15, 28, gl), hy + 16);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,246,214,0.8)';
  ctx.fill();
  /* hvězdička bliknutí (i při leštění) */
  const spark = Math.max(Math.max(0, Math.sin(t * 1.25) - 0.92) / 0.08, r.ges);
  if (spark > 0) {
    ctx.strokeStyle = 'rgba(255,252,230,' + (0.9 * spark) + ')';
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    const sx = 41, sy = hy + 1, sr = 7 + spark * 3;
    ctx.beginPath(); ctx.moveTo(sx - sr, sy); ctx.lineTo(sx + sr, sy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy - sr); ctx.lineTo(sx, sy + sr); ctx.stroke();
  }
  ctx.restore();

  /* špičatá bradka — delší, ostřejší */
  ctx.beginPath();
  ctx.moveTo(6, hy + 26);
  ctx.quadraticCurveTo(20, hy + 33, 33, hy + 26);
  ctx.quadraticCurveTo(29, hy + 50, 20, hy + 64);
  ctx.quadraticCurveTo(12, hy + 46, 6, hy + 26);
  ctx.closePath();
  ctx.fillStyle = MUST; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,40,10,0.5)'; ctx.lineWidth = 1.6;      // pramínky
  ctx.beginPath(); ctx.moveTo(15, hy + 34); ctx.quadraticCurveTo(17, hy + 46, 19, hy + 56); ctx.stroke();
  cheeks(ctx, 2, 42, hy + 10, 6.5, 0.28);
  mouthDraw(ctx, 20, hy + 21, r.mouth, 8, 1.2, '#5a2018');

  ctx.restore();
}

/* =========================================================================
   JOHANNES KEPLER — útlý, nahrbený, brýle na šňůrce, prostý tmavý kabát,
   bílý límec, desky s papíry pod paží, sníh na ramenou (právě přijel).
   Ustaraný. Idle gesto: posunuje si brýle. Výška 330.
   ========================================================================= */
function drawKepler(ctx, pose) {
  const r = rigOf(pose, {
    stride: 18, lift: 15, bob: 5.5, br: 1.55, idleBob: 1.8,
    gPeriod: 8.8, gOff: 5.4, crouch: 46, lean: 0.06, armAmp: 0.55,
    stA: 9, stB: -4, idleLean: 0.02
  });
  const t = r.t;
  const COAT = '#2b2734', COAT_L = '#3c3749', BOOT = '#211a16', GLASS = '#b98f3a';

  ctx.save();
  ctx.scale(pose.dir || 1, 1);
  shadow(ctx, 44);
  /* drobné třesení zimou v idle */
  if (r.act === 'idle') ctx.translate(Math.sin(t * 17) * 0.6, 0);
  ctx.rotate(r.lean + 0.03);                                        // věčně nahrbený

  const dy = r.crouch - r.bob;
  const hipY = -138 + dy, shY = -238 + dy;
  const hy = -282 + dy, hr = 38;
  const hx = 8;                                                     // hlava předsunutá

  /* --- tenké nohy --- */
  const spread = 8, legW = 11;
  if (r.pick) {
    limb(ctx, -spread, hipY, -spread - 22, hipY + 52, -18, -8, legW, COAT);
    limb(ctx, spread, hipY, spread + 26, hipY + 50, 22, -8, legW, COAT);
    boot(ctx, -18, -7, 19, 7.5, BOOT); boot(ctx, 22, -7, 19, 7.5, BOOT);
  } else {
    limb(ctx, -spread, hipY, (-spread + r.fB.x) / 2 + 8, (hipY + r.fB.y) / 2, r.fB.x - 3, r.fB.y - 8, legW, COAT);
    limb(ctx, spread, hipY, (spread + r.fA.x) / 2 + 9, (hipY + r.fA.y) / 2, r.fA.x + 3, r.fA.y - 8, legW, COAT);
    boot(ctx, r.fB.x - 3, r.fB.y - 7, 19, 7.5, BOOT);
    boot(ctx, r.fA.x + 3, r.fA.y - 7, 20, 8, BOOT);
  }

  /* --- zadní paže: svírá desky s papíry --- */
  ctx.save();
  ctx.translate(-24, shY + 46);
  ctx.rotate(-0.14 + Math.sin(t * 1.5) * 0.015);
  ctx.fillStyle = '#6b4f2e';                                        // desky
  ctx.fillRect(-15, -22, 30, 44);
  ctx.fillStyle = '#efe8d2';                                        // papíry vykukují
  ctx.fillRect(-12, -26, 24, 8);
  ctx.fillRect(-10, -30, 18, 6);
  ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 2;
  ctx.strokeRect(-15, -22, 30, 44);
  ctx.restore();
  limb(ctx, -20, shY + 14, -32, shY + 30, -24, shY + 52, 10, COAT_L);
  hand(ctx, -24, shY + 52, 8.5, SKIN);

  /* --- trup: úzký kabát — tyčka mezi hřmotnými (kontrast siluet) --- */
  torso(ctx, shY, hipY + 12, 19, 29, 2 + r.breath * 1.5, COAT, INK);
  ctx.strokeStyle = 'rgba(190,190,210,0.25)'; ctx.lineWidth = 1.6;  // řada knoflíčků
  ctx.beginPath(); ctx.moveTo(5, shY + 8); ctx.lineTo(3, hipY + 6); ctx.stroke();
  ctx.fillStyle = '#c9c4cf';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.arc(4.6 - i * 0.4, shY + 16 + i * 18, 2, 0, TAU); ctx.fill();
  }
  /* bílý plochý límec */
  ctx.fillStyle = '#eee9da';
  ctx.beginPath();
  ctx.moveTo(-18, shY - 6);
  ctx.lineTo(-24, shY + 16);
  ctx.lineTo(0, shY + 6);
  ctx.lineTo(24, shY + 16);
  ctx.lineTo(18, shY - 6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,115,95,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  /* sníh na ramenou */
  ell(ctx, -19, shY + 2, 11, 4.5, 'rgba(245,250,255,0.95)');
  ell(ctx, 20, shY + 2, 10, 4, 'rgba(245,250,255,0.9)');
  ell(ctx, -14, shY - 1, 5, 2.4, '#ffffff');

  /* --- přední paže --- */
  const shAx = 20, shAy = shY + 12;
  let hA = { x: 24 - r.armSw * 26, y: hipY + 18 };
  if (r.talk) {                                                      // počítá na prstech
    hA = { x: 42 + r.gA * 6, y: shY + 34 - r.gA * 12 };
  }
  if (r.ges > 0) hA = { x: mix(hA.x, hx + 26, r.ges), y: mix(hA.y, hy + 2, r.ges) }; // posunuje brýle
  if (r.reach) hA = { x: 66 + r.wob, y: shY + 24 + r.wob };
  if (r.pick) hA = { x: 50, y: -14 };
  limb(ctx, shAx, shAy, (shAx + hA.x) / 2 + 6, (shAy + hA.y) / 2 + 12, hA.x, hA.y, 10, COAT_L);
  hand(ctx, hA.x, hA.y, 8.5, SKIN);
  if (r.talk) {                                                      // vztyčené prstíky
    ctx.strokeStyle = SKIN; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    const n = 1 + ((Math.floor(t * 1.4) % 3 + 3) % 3);
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(hA.x + i * 4 - 4, hA.y - 6);
      ctx.lineTo(hA.x + i * 4 - 4, hA.y - 13);
      ctx.stroke();
    }
  }

  /* --- hlava (předsunutá, úzká špičatá brada) --- */
  ctx.fillStyle = SKIN;
  ctx.fillRect(hx - 7, shY - 12, 14, 15);
  cel(ctx, headRound(hx, hy, hr * 0.9, hr, 1.4), { base: SKIN, cx: hx, cy: hy, r: hr, lw: 2.8 });
  cel(ctx, (c) => { c.ellipse(hx - hr + 6, hy + 4, 7, 10, -0.12, 0, TAU); },
    { base: SKIN, cx: hx - hr + 6, cy: hy + 4, r: 8, lw: 2, rim: null });  // ucho

  /* tmavé vlasy + kozí bradka */
  ctx.fillStyle = '#3a2d22';
  ctx.beginPath();
  ctx.arc(hx, hy - 6, hr - 1, Math.PI * 0.92, Math.PI * 2.02);
  ctx.quadraticCurveTo(hx + 8, hy - hr + 14, hx - 6, hy - hr + 10);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2d22';
  ctx.beginPath();                                                  // bradka
  ctx.moveTo(hx + 8, hy + 27);
  ctx.quadraticCurveTo(hx + 16, hy + 30, hx + 22, hy + 26);
  ctx.quadraticCurveTo(hx + 19, hy + 40, hx + 14, hy + 43);
  ctx.quadraticCurveTo(hx + 10, hy + 36, hx + 8, hy + 27);
  ctx.closePath(); ctx.fill();
  /* řídký knírek */
  ctx.strokeStyle = '#3a2d22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx + 8, hy + 15); ctx.quadraticCurveTo(hx + 14, hy + 18, hx + 21, hy + 15);
  ctx.stroke();

  /* ustarané obočí (zvednuté uprostřed) + oči za brýlemi */
  const bl = r.talk ? r.mouth * 3 : 0;
  brow(ctx, hx + 8, hy - 16 - bl, 7, 4, '#3a2d22', 3.6);
  brow(ctx, hx + 26, hy - 17 - bl, 6.5, 4, '#3a2d22', 3.6);
  eyes(ctx, hx + 9, hx + 26, hy - 6, 4.6, r.blink, 0.28);
  /* brýle na šňůrce */
  ctx.strokeStyle = GLASS; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.arc(hx + 9, hy - 5, 8.5, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(hx + 26, hy - 5, 8, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 17.5, hy - 6); ctx.lineTo(hx + 18.5, hy - 6); ctx.stroke();
  ctx.fillStyle = 'rgba(214,232,248,0.32)';                          // odraz skel
  ctx.beginPath(); ctx.arc(hx + 9, hy - 5, 8.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 26, hy - 5, 8, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(185,143,58,0.7)'; ctx.lineWidth = 1.4;     // šňůrka
  ctx.beginPath();
  ctx.moveTo(hx + 33, hy - 2);
  ctx.quadraticCurveTo(hx + 40, hy + 26 + Math.sin(t * 2.1) * 3, 14, shY + 14);
  ctx.stroke();

  /* velký skobovitý nos (učenec s frňákem, ne čárka) */
  cel(ctx, (c) => {
    c.moveTo(hx + 14, hy - 4);
    c.quadraticCurveTo(hx + 26, hy - 2, hx + 27, hy + 8);
    c.quadraticCurveTo(hx + 27, hy + 13, hx + 21, hy + 12);
    c.quadraticCurveTo(hx + 16, hy + 10, hx + 14, hy + 5);
    c.closePath();
  }, { base: '#e2a877', cx: hx + 21, cy: hy + 4, r: 9, lw: 2, rim: null });
  cheeks(ctx, hx + 2, hx + 32, hy + 8, 5, 0.18);
  mouthDraw(ctx, hx + 15, hy + 20, r.mouth, 7.5, -1.5, '#5e2a20');   // ustaraná linka

  ctx.restore();
}

/* =========================================================================
   MATĚJ BENDA — šumař-tkadlec. Ošuntělý kožich, beranice s pérem,
   ruměné tváře, skřipky a smyčec, tkalcovský člunek u pasu.
   Idle gesto: zahraje si. Výška 340.
   ========================================================================= */
function drawBenda(ctx, pose) {
  const r = rigOf(pose, {
    stride: 24, lift: 18, bob: 7, br: 1.6, idleBob: 2.4,
    gPeriod: 7.6, gOff: 1.7, crouch: 48, lean: 0.06, armAmp: 0.7,
    stA: 18, stB: -7, idleLean: 0.032
  });
  const t = r.t;
  const FUR = '#6a5138', FUR_L = '#8a6c4a', TRIM = '#b09468', HAT = '#4e3a28';
  const BOOT = '#2a2018', WOOD = '#8a5a2e', WOOD_D = '#5e3a1c';
  const playing = r.ges > 0;                                        // idle: hraje
  const bowSaw = playing ? Math.sin(t * 9) * 15 * r.ges : (r.talk ? Math.sin(t * 5.3) * 6 : 0);

  ctx.save();
  ctx.scale(pose.dir || 1, 1);
  shadow(ctx, 54);
  ctx.rotate(r.lean + (playing ? Math.sin(t * 4.5) * 0.02 : 0));    // houpe se do rytmu

  const dy = r.crouch - r.bob;
  const hipY = -132 + dy, shY = -228 + dy;
  const hy = -276 + dy, hr = 41;

  /* --- nohy --- */
  const spread = 11, legW = 15;
  if (r.pick) {
    limb(ctx, -spread, hipY, -spread - 24, hipY + 54, -21, -8, legW, '#4a3a2c');
    limb(ctx, spread, hipY, spread + 28, hipY + 52, 25, -8, legW, '#4a3a2c');
    boot(ctx, -21, -7, 22, 9, BOOT); boot(ctx, 25, -7, 22, 9, BOOT);
  } else {
    /* při hraní podupává přední nohou */
    const tap = playing ? Math.max(0, Math.sin(t * 9)) * 7 * r.ges : 0;
    limb(ctx, -spread, hipY, (-spread + r.fB.x) / 2 + 9, (hipY + r.fB.y) / 2, r.fB.x - 4, r.fB.y - 8, legW, '#4a3a2c');
    limb(ctx, spread, hipY, (spread + r.fA.x) / 2 + 10, (hipY + r.fA.y - tap) / 2, r.fA.x + 4, r.fA.y - 8 - tap, legW, '#4a3a2c');
    boot(ctx, r.fB.x - 4, r.fB.y - 7, 22, 9, BOOT);
    boot(ctx, r.fA.x + 4, r.fA.y - 7 - tap, 23, 9, BOOT);
  }

  /* --- trup: kožich s kožešinovým lemem — hruškovitý šumař --- */
  torso(ctx, shY, hipY + 16, 33, 42, 9 + r.breath * 2.5, FUR, INK);
  /* chlupatý lem (řada chomáčků) */
  ctx.fillStyle = TRIM;
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    ell(ctx, mix(-36, 38, k), hipY + 15 + Math.sin(k * 7) * 1.5, 6, 4.5, TRIM);
  }
  for (let i = 0; i <= 5; i++) {
    ell(ctx, -1 + Math.sin(i * 5) * 2, shY + 10 + i * 17, 5, 4, TRIM);
  }
  ell(ctx, -30, shY + 4, 9, 6, TRIM);
  ell(ctx, 31, shY + 4, 9, 6, TRIM);
  /* provazový pás + tkalcovský člunek */
  ctx.strokeStyle = '#a8895e'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-36, hipY - 2); ctx.lineTo(37, hipY - 4); ctx.stroke();
  ctx.save();
  ctx.translate(22, hipY + 6);
  ctx.rotate(0.5 + Math.sin(t * 1.5) * 0.04);
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(0, -6.5, 14, 0);
  ctx.quadraticCurveTo(0, 6.5, -14, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = WOOD_D; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = WOOD_D;
  ctx.beginPath(); ctx.ellipse(0, 0, 5, 2, 0, 0, TAU); ctx.fill();
  ctx.restore();

  /* --- skřipky pod bradou (drží zadní rukou, krkem dozadu) --- */
  ctx.save();
  ctx.translate(-8, shY - 2);
  ctx.rotate(-0.42 + (playing ? Math.sin(t * 4.5) * 0.03 : 0));
  ctx.strokeStyle = WOOD_D; ctx.lineWidth = 5;                      // krk
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-44, -6); ctx.stroke();
  ctx.fillStyle = WOOD_D;                                           // šnek
  ctx.beginPath(); ctx.arc(-47, -8, 4.5, 0, TAU); ctx.fill();
  ctx.fillStyle = WOOD;                                             // korpus
  ctx.beginPath(); ctx.ellipse(10, 2, 16, 12, 0.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-6, 0, 12, 10, 0.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = WOOD_D; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(10, 2, 16, 12, 0.1, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,22,10,0.8)'; ctx.lineWidth = 1.4;      // efka
  ctx.beginPath(); ctx.moveTo(6, -3); ctx.quadraticCurveTo(4, 2, 7, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -3); ctx.quadraticCurveTo(16, 2, 13, 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(240,228,190,0.85)'; ctx.lineWidth = 1;    // struny
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-46, -8 + i * 1.6);
    ctx.lineTo(22, -1 + i * 2.4);
    ctx.stroke();
  }
  /* zadní ruka na hmatníku */
  hand(ctx, -30, -4, 9, SKIN);
  ctx.restore();
  limb(ctx, -28, shY + 14, -40, shY + 10, -38, shY - 12, 14, FUR_L);

  /* --- přední paže: smyčec --- */
  const shAx = 30, shAy = shY + 14;
  let hA;
  if (playing || r.talk) {
    hA = { x: 28 + bowSaw, y: shY + 6 };
  } else if (r.reach) hA = { x: 78 + r.wob, y: shY + 26 + r.wob };
  else if (r.pick) hA = { x: 58, y: -16 };
  else hA = { x: 36 - r.armSw * 32, y: hipY + 18 - Math.abs(r.armSw) * 7 };
  limb(ctx, shAx, shAy, (shAx + hA.x) / 2 + 8, (shAy + hA.y) / 2 + 12, hA.x, hA.y, 14, FUR_L);
  hand(ctx, hA.x, hA.y, 10, SKIN);
  /* smyčec v ruce (vždy — šumař ho neodkládá) */
  if (!r.pick && !r.reach) {
    ctx.save();
    ctx.translate(hA.x, hA.y);
    ctx.rotate(-0.9 + (playing ? Math.sin(t * 9) * 0.06 : 0.15));
    ctx.strokeStyle = '#caa25a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(30, -46); ctx.stroke();
    ctx.strokeStyle = 'rgba(240,232,200,0.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(27, -49); ctx.stroke();
    ctx.restore();
  }

  /* notičky, když hraje (sekundární pohyb) */
  if (playing) {
    ctx.fillStyle = 'rgba(255,230,170,' + (0.65 * r.ges) + ')';
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const np = ((t * 0.5 + i / 3) % 1);
      const nx = -30 - i * 16 - np * 20;
      const ny = shY - 40 - np * 60 + Math.sin(t * 3 + i * 2) * 6;
      ctx.globalAlpha = (1 - np) * r.ges;
      ctx.beginPath(); ctx.ellipse(nx, ny, 4, 3, -0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(nx + 3.5, ny - 1); ctx.lineTo(nx + 3.5, ny - 14); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* --- hlava --- */
  ctx.fillStyle = SKIN;
  ctx.fillRect(-8, shY - 12, 16, 15);
  cel(ctx, headRound(0, hy, hr, hr, 0.7), { base: SKIN, cx: 0, cy: hy, r: hr, lw: 3 });
  cel(ctx, (c) => { c.ellipse(-hr + 4, hy + 5, 8, 10, -0.1, 0, TAU); },
    { base: SKIN, cx: -hr + 4, cy: hy + 5, r: 8, lw: 2, rim: null });

  /* prošedivělý plnovous */
  ctx.beginPath();
  ctx.moveTo(-hr + 10, hy + 10);
  ctx.quadraticCurveTo(-6, hy + 52, 16, hy + 46);
  ctx.quadraticCurveTo(34, hy + 38, hr - 4, hy + 12);
  ctx.quadraticCurveTo(20, hy + 26, 0, hy + 24);
  ctx.quadraticCurveTo(-20, hy + 24, -hr + 10, hy + 10);
  ctx.closePath();
  ctx.fillStyle = '#9a8a72'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();

  /* beranice s pérem (péro se kývá) */
  const hatPath = (c) => {
    c.moveTo(-hr - 2, hy - 12);
    c.quadraticCurveTo(-hr - 4, hy - 40, -14, hy - 45);
    c.quadraticCurveTo(20, hy - 49, hr + 2, hy - 34);
    c.quadraticCurveTo(hr + 5, hy - 16, hr - 2, hy - 12);
    c.closePath();
  };
  ctx.fillStyle = HAT;
  ctx.beginPath(); hatPath(ctx); ctx.fill();
  rimStroke(ctx, hatPath, 0, hy - 30, hr, 6);
  ctx.fillStyle = '#66503a';                                        // kožešinový okraj
  for (let i = 0; i <= 8; i++) {
    ell(ctx, mix(-hr, hr, i / 8), hy - 12 + Math.sin(i * 4) * 1.5, 7.5, 6, '#66503a');
  }
  const fa = Math.sin(t * 1.9) * 0.12 + (r.walk ? r.sinT * 0.08 : 0);
  ctx.save();                                                       // péro
  ctx.translate(26, hy - 40);
  ctx.rotate(-0.5 + fa);
  ctx.strokeStyle = '#c8b060'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -18, 6, -34); ctx.stroke();
  ctx.fillStyle = 'rgba(200,176,96,0.75)';
  ctx.beginPath();
  ctx.moveTo(0, -4); ctx.quadraticCurveTo(14, -18, 7, -33);
  ctx.quadraticCurveTo(2, -22, 0, -4);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  /* rozesmátá tvář, veliký nos-brambora */
  const bl = r.talk ? r.mouth * 4 : (playing ? 3 : 0);
  brow(ctx, 11, hy - 15 - bl, 7.5, 2, '#8a7a62', 4.5);
  brow(ctx, 30, hy - 16 - bl, 7, 2, '#8a7a62', 4.5);
  eyes(ctx, 11, 30, hy - 6, 5, Math.max(r.blink, playing ? 0.8 : 0), 0.32); // hraje se zavřenýma
  /* veliký nos-brambora s konturou */
  cel(ctx, (c) => { c.ellipse(24, hy + 6, 10.5, 8.5, 0.15, 0, TAU); },
    { base: '#d89a6a', cx: 24, cy: hy + 6, r: 10, lw: 2.2, rim: null });
  ell(ctx, 20, hy + 3, 3, 2.4, 'rgba(255,255,255,0.4)');
  cheeks(ctx, 2, 38, hy + 10, 8, 0.45);                             // ruměné tváře!
  mouthDraw(ctx, 16, hy + 22, r.mouth, 9, 5, '#6e2a1e');

  ctx.restore();
}

/* =========================================================================
   VÁVRA — převozník. Širokánská ramena, ovčí vesta, ojíněné vousiska,
   fajfka s kouřem (sekundární pohyb). Flegmatik — hýbe se málo.
   Výška 350.
   ========================================================================= */
function drawPrevoznik(ctx, pose) {
  const r = rigOf(pose, {
    stride: 20, lift: 12, bob: 4, br: 1.1, idleBob: 1.6,
    gPeriod: 10.5, gOff: 7.2, crouch: 42, lean: 0.04, armAmp: 0.35,
    stA: 16, stB: -12, idleLean: 0.015
  });
  const t = r.t;
  const VEST = '#d9c9a5', VEST_D = '#b3a075', SHIRT = '#4c3c30', PANTS = '#3a3230';
  const BOOT = '#241c14', BEARD = '#b8b4a6';

  ctx.save();
  ctx.scale(pose.dir || 1, 1);
  shadow(ctx, 66);
  ctx.rotate(r.lean);

  const dy = r.crouch - r.bob;
  const hipY = -136 + dy, shY = -250 + dy;
  const hy = -298 + dy, hr = 42;

  /* --- krátké mohutné nohy, vysoké boty --- */
  const spread = 18, legW = 22;
  if (r.pick) {
    limb(ctx, -spread, hipY, -spread - 26, hipY + 56, -26, -9, legW, PANTS);
    limb(ctx, spread, hipY, spread + 30, hipY + 54, 30, -9, legW, PANTS);
    boot(ctx, -26, -8, 28, 11, BOOT); boot(ctx, 30, -8, 28, 11, BOOT);
  } else {
    limb(ctx, -spread, hipY, (-spread + r.fB.x) / 2 + 8, (hipY + r.fB.y) / 2, r.fB.x - 7, r.fB.y - 9, legW, PANTS);
    limb(ctx, spread, hipY, (spread + r.fA.x) / 2 + 10, (hipY + r.fA.y) / 2, r.fA.x + 7, r.fA.y - 9, legW, PANTS);
    boot(ctx, r.fB.x - 7, r.fB.y - 8, 28, 11, BOOT);
    boot(ctx, r.fA.x + 7, r.fA.y - 8, 29, 11.5, BOOT);
    /* vyhrnuté holínky */
    ell(ctx, r.fB.x - 7, r.fB.y - 34, 14, 9, '#38302a');
    ell(ctx, r.fA.x + 7, r.fA.y - 34, 14, 9, '#38302a');
  }

  /* --- zadní paže: palec za vestou (flegma) --- */
  let hB = { x: -34, y: shY + 58 };
  if (r.walk) hB = { x: -40 + r.armSw * 22, y: hipY + 8 };
  if (r.talk) hB = { x: -50 - r.gB * 5, y: shY + 62 - r.gB * 8 };
  limb(ctx, -50, shY + 16, (-50 + hB.x) / 2 - 8, (shY + 16 + hB.y) / 2 + 10, hB.x, hB.y, 18, SHIRT);
  hand(ctx, hB.x, hB.y, 12.5, SKIN);

  /* --- trup: klín — širokánská ramena, dole staženo opaskem --- */
  torso(ctx, shY, hipY + 16, 63, 41, 9 + r.breath * 2.5, SHIRT, INK);
  /* vesta — dva pláty s huňatým okrajem */
  ctx.fillStyle = VEST;
  ctx.beginPath();
  ctx.moveTo(-58, shY + 2);
  ctx.quadraticCurveTo(-64, (shY + hipY) / 2, -44, hipY + 12);
  ctx.lineTo(-12, hipY + 14);
  ctx.lineTo(-14, shY + 4);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(58, shY + 2);
  ctx.quadraticCurveTo(64, (shY + hipY) / 2, 44, hipY + 12);
  ctx.lineTo(14, hipY + 14);
  ctx.lineTo(16, shY + 4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(90,72,44,0.5)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-14, shY + 4); ctx.lineTo(-12, hipY + 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, shY + 4); ctx.lineTo(14, hipY + 14); ctx.stroke();
  /* rouno po okrajích */
  ctx.fillStyle = VEST_D;
  for (let i = 0; i <= 7; i++) {
    const k = i / 7;
    ell(ctx, -13 + Math.sin(i * 3) * 1.5, mix(shY + 6, hipY + 12, k), 4.5, 5, VEST_D);
    ell(ctx, 15 + Math.sin(i * 3.7) * 1.5, mix(shY + 6, hipY + 12, k), 4.5, 5, VEST_D);
  }
  for (let i = 0; i <= 6; i++) {
    ell(ctx, mix(-50, -16, i / 6), shY + 3 + Math.sin(i * 5) * 2, 6, 5, VEST_D);
    ell(ctx, mix(18, 52, i / 6), shY + 3 + Math.sin(i * 5) * 2, 6, 5, VEST_D);
  }
  /* široký opasek */
  ctx.fillStyle = '#5a4028';
  ctx.fillRect(-44, hipY - 2, 88, 13);
  ctx.fillStyle = '#8a8378';
  ctx.fillRect(-7, hipY - 3, 15, 15);

  /* --- přední paže: fajfka u úst --- */
  const shAx = 50, shAy = shY + 16;
  const puff = r.ges;                                               // idle: potáhne si
  let hA = { x: 40, y: hy + 26 };                                   // default drží fajfku u brady
  if (r.walk) hA = { x: 52 - r.armSw * 24, y: hipY + 8 };
  if (r.talk) hA = { x: 58 + r.gA * 6, y: shY + 44 - r.gA * 10 };
  if (r.reach) hA = { x: 90 + r.wob, y: shY + 28 + r.wob };
  if (r.pick) hA = { x: 64, y: -18 };
  const pipeHeld = !r.walk && !r.talk && !r.reach && !r.pick;
  limb(ctx, shAx, shAy, (shAx + hA.x) / 2 + 12, (shAy + hA.y) / 2 + (pipeHeld ? -4 : 14), hA.x, hA.y, 18, SHIRT);
  hand(ctx, hA.x, hA.y, 12.5, SKIN);

  /* --- hlava --- */
  ctx.fillStyle = SKIN;
  ctx.fillRect(-10, shY - 12, 20, 15);
  cel(ctx, headRound(0, hy, hr * 1.05, hr, 0.6), { base: SKIN, cx: 0, cy: hy, r: hr, lw: 3.2 });

  /* obrovský plnovous ojíněný mrazem */
  ctx.beginPath();
  ctx.moveTo(-hr + 6, hy + 2);
  ctx.quadraticCurveTo(-hr - 6, hy + 40, -18, hy + 62);
  ctx.quadraticCurveTo(0, hy + 74, 20, hy + 60);
  ctx.quadraticCurveTo(hr + 4, hy + 36, hr - 6, hy + 2);
  ctx.quadraticCurveTo(20, hy + 20, 0, hy + 20);
  ctx.quadraticCurveTo(-20, hy + 20, -hr + 6, hy + 2);
  ctx.closePath();
  ctx.fillStyle = BEARD; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(70,62,50,0.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-16 + i * 9, hy + 30);
    ctx.quadraticCurveTo(-14 + i * 9, hy + 44, -16 + i * 9.5, hy + 56);
    ctx.stroke();
  }
  /* jinovatka na vousech */
  ctx.fillStyle = 'rgba(240,248,255,0.8)';
  ell(ctx, -12, hy + 52, 8, 4, 'rgba(240,248,255,0.75)');
  ell(ctx, 8, hy + 58, 9, 4.5, 'rgba(240,248,255,0.8)');
  ell(ctx, 22, hy + 44, 6, 3.5, 'rgba(240,248,255,0.7)');

  /* vlněná čepice přes uši */
  ctx.fillStyle = '#4a4238';
  ctx.beginPath(); ctx.arc(0, hy - 10, hr - 1, Math.PI * 0.96, Math.PI * 2.04); ctx.closePath(); ctx.fill();
  rimStroke(ctx, (c) => { c.arc(0, hy - 10, hr - 1, Math.PI * 0.96, Math.PI * 2.04); c.closePath(); },
    0, hy - 10, hr, 6);
  ctx.fillStyle = '#57493c';
  ctx.fillRect(-hr + 1, hy - 16, hr * 2 - 2, 9);

  /* klidné těžké obočí, přivřené oči */
  brow(ctx, 12, hy - 14, 9, -1, '#8a8274', 5.5);
  brow(ctx, 32, hy - 15, 8, -1, '#8a8274', 5.5);
  eyes(ctx, 12, 32, hy - 5, 4.6, Math.max(r.blink, 0.35), 0.3);      // věčně přimhouřeno
  /* baňatý červený nos (mráz) — pořádná bambule */
  cel(ctx, (c) => { c.ellipse(25, hy + 6, 10.5, 9, 0.1, 0, TAU); },
    { base: '#d88a66', cx: 25, cy: hy + 6, r: 10, lw: 2.2, rim: null });
  ctx.fillStyle = 'rgba(200,80,60,0.45)';
  ctx.beginPath(); ctx.ellipse(25, hy + 8, 7, 5.5, 0, 0, TAU); ctx.fill();
  ell(ctx, 21, hy + 3, 3, 2.4, 'rgba(255,255,255,0.4)');
  mouthDraw(ctx, 14, hy + 19, r.mouth, 7, 0.5, '#4e2018');

  /* --- fajfka + kouř (sekundární) --- */
  if (pipeHeld) {
    ctx.strokeStyle = '#3e2c1c'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(20, hy + 20);
    ctx.quadraticCurveTo(38, hy + 26, hA.x + 4, hA.y - 8);
    ctx.stroke();
    ctx.fillStyle = '#4e3820';                                       // hlavička
    ctx.beginPath(); ctx.arc(hA.x + 6, hA.y - 10, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c85a2a';                                       // žhavý tabák
    ctx.beginPath(); ctx.arc(hA.x + 6, hA.y - 12, 3.4, 0, TAU); ctx.fill();
    /* obláčky kouře stoupají a rostou */
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.22 + i / 3) % 1);
      const a = (1 - p) * (0.28 + puff * 0.3);
      ctx.fillStyle = 'rgba(220,228,236,' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(hA.x + 8 + Math.sin(t * 1.3 + i * 2.1) * 8 * p,
        hA.y - 20 - p * 74, 4 + p * 12, 0, TAU);
      ctx.fill();
    }
  }

  ctx.restore();
}

/* =========================================================================
   BĚTKA — trhovkyně. Karikatura „hruška": mohutný spodek a boky, úzká
   ramena, velká hlava s bramborovým nosem. Kontrapost — váha na levém
   boku (vystrčený!), pěst zapřená v bok, druhá ruka rovná šňůru sušených
   jablek. Holé pracovní ruce s prsty, fazetovaná sukně, rim-light.
   Při řeči gestikuluje celým tělem. Výška 320.
   ========================================================================= */
function drawTrhovkyne(ctx, pose) {
  const r = rigOf(pose, {
    stride: 15, lift: 10, bob: 5, br: 1.5, idleBob: 2.4,
    gPeriod: 9.2, gOff: 2.6, crouch: 38, lean: 0.04, armAmp: 0.4,
    stA: 22, stB: -10, idleLean: 0.055
  });
  const t = r.t;
  const SKIRT = '#7c4a3e', SKIRT_D = '#5e352c', APRON = '#e8dcc0', APRON_D = '#c8b894';
  const SHAWL = '#8a3a4e', SHAWL_D = '#68293a', SCARF2 = '#d8a83e', BLOUSE = '#c9b8a0';

  ctx.save();
  ctx.scale(pose.dir || 1, 1);
  shadow(ctx, 62);
  /* kolébavá chůze — celé tělo se houpe; v klidu mírný náklon (kontrapost) */
  ctx.rotate(r.lean + (r.walk ? r.sinT * 0.055 : 0) + (r.talk ? Math.sin(t * 5.3) * 0.012 : 0));

  const dy = r.crouch - r.bob;
  const hipY = -114 + dy, shY = -212 + dy;
  const hy = -262 + dy, hr = 41;

  /* --- botky vykukující zpod sukně — přední vykročená (asymetrie) --- */
  if (!r.pick) {
    boot(ctx, r.fA.x * 0.5 + 8, r.fA.y * 0.5 - 6, 17, 7.5, '#33241c');
    boot(ctx, r.fB.x * 0.5 - 8, r.fB.y * 0.5 - 6, 15, 6.6, '#2a1d16');
  } else {
    boot(ctx, 14, -6, 17, 7.5, '#33241c');
    boot(ctx, -14, -6, 15, 6.6, '#2a1d16');
  }

  /* --- sukně: FAZETOVANÝ zvon s vystrčeným levým bokem (váha!) ---
     lomené seky à la CoMI, cel-shading + rim po návětrné straně */
  const swy = r.walk ? Math.sin((pose.phase || 0) * TAU) * 5 : Math.sin(t * 1.6) * 2;
  const skirt = (c) => {
    c.moveTo(-27, hipY - 14);
    c.lineTo(-50, hipY + 16);                       // sek přes vystrčený bok
    c.lineTo(-66 + swy * 0.6, hipY + 68);           // KYČEL ven — kontrapost
    c.lineTo(-60 + swy * 0.7, -22);
    c.lineTo(-64 + swy * 0.7, -4);                  // cíp lemu
    c.lineTo(-34, -12 + swy * 0.4);
    c.lineTo(-12, -3);                              // druhý cíp
    c.lineTo(16, -12 - swy * 0.4);
    c.lineTo(44 + swy * 0.5, -5);                   // třetí cíp
    c.lineTo(50 + swy * 0.5, -20);
    c.lineTo(52, hipY + 42);                        // pravá strana strmější
    c.lineTo(38, hipY + 6);
    c.lineTo(28, hipY - 14);
    c.closePath();
  };
  cel(ctx, skirt, { base: SKIRT, cx: -6, cy: hipY + 56, r: 64, lw: 2.9, rimW: 12 });
  /* sklady sukně — rovné fazetové seky, hustší na stinné straně */
  ctx.strokeStyle = SKIRT_D; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [fx0, fx1] of [[-40, -50], [-18, -26], [2, 0], [20, 26]]) {
    ctx.beginPath();
    ctx.moveTo(fx0, hipY - 4);
    ctx.lineTo(fx1 + swy * 0.4, -10);
    ctx.stroke();
  }
  /* --- zástěra: kratší, nakřivo uvázaná (cíp zastrčený za pas) --- */
  const apron = (c) => {
    c.moveTo(-14, hipY - 10);
    c.lineTo(-27, hipY + 42);
    c.lineTo(-31 + swy * 0.4, -18);
    c.lineTo(-6, -9);                                // zvlněný lem
    c.lineTo(24 + swy * 0.4, -24);                   // pravý cíp VYKASANÝ
    c.lineTo(30, hipY + 26);                         // — za pásem
    c.lineTo(17, hipY - 10);
    c.closePath();
  };
  cel(ctx, apron, { base: APRON, cx: 0, cy: hipY + 48, r: 42, lw: 2.1, rimW: 8 });
  ctx.strokeStyle = APRON_D; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, hipY + 24); ctx.quadraticCurveTo(2, hipY + 32, 24, hipY + 22);
  ctx.stroke();
  /* kapsa s vyčuhujícím účetním proutkem + moučná šmouha */
  ctx.fillStyle = APRON_D;
  ctx.beginPath();
  ctx.moveTo(-24, hipY + 46); ctx.lineTo(-4, hipY + 48);
  ctx.lineTo(-6, hipY + 70); ctx.lineTo(-25, hipY + 67);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a6a42'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(-16, hipY + 47); ctx.lineTo(-12, hipY + 32); ctx.stroke();
  ell(ctx, 8, hipY + 58, 9, 5, 'rgba(255,252,240,0.5)', 0.3);

  /* --- trup: úzká ramena, mocné poprsí pod vlňákem (hruška!) --- */
  torso(ctx, shY, hipY, 27, 38, 14 + r.breath * 3, BLOUSE, INK);
  /* vlňák křížem */
  ctx.fillStyle = SHAWL;
  ctx.beginPath();
  ctx.moveTo(-26, shY - 4);
  ctx.lineTo(16, hipY - 2);
  ctx.lineTo(32, hipY - 2);
  ctx.lineTo(-12, shY - 8);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(28, shY - 4);
  ctx.lineTo(-14, hipY - 2);
  ctx.lineTo(-30, hipY - 2);
  ctx.lineTo(13, shY - 8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = SHAWL_D; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-26, shY - 4); ctx.lineTo(16, hipY - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(28, shY - 4); ctx.lineTo(-14, hipY - 2); ctx.stroke();
  /* rim vlňáku po návětrné hraně */
  rimStroke(ctx, (c) => {
    c.moveTo(28, shY - 4); c.lineTo(-14, hipY - 2); c.lineTo(-30, hipY - 2);
    c.lineTo(13, shY - 8); c.closePath();
  }, 0, (shY + hipY) / 2, 40, 5);
  /* třásničky vlňáku */
  ctx.strokeStyle = SHAWL_D; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-26 + i * 13, hipY - 2);
    ctx.lineTo(-27 + i * 13 + Math.sin(t * 2 + i) * 1.5, hipY + 8);
    ctx.stroke();
  }

  /* --- paže: ASYMETRIE — zadní pěst v bok (loket ven), přední drží
     šňůru sušených jablek / gestikuluje --- */
  const shAx = 26, shAy = shY + 10, shBx = -26, shBy = shY + 12;
  let hA = { x: 44, y: shY + 54 };                                   // drží zboží
  let hB = { x: -46, y: hipY - 12 };                                 // pěst v bok
  let akimboB = true, holdA = true;
  if (r.walk) {
    hA = { x: 36 - r.armSw * 22, y: hipY + 8 }; holdA = false;
    hB = { x: -34 + r.armSw * 22, y: hipY + 8 }; akimboB = false;
  }
  if (r.talk) {
    hA = { x: 54 + r.gA * 12, y: shY + 26 - r.gA * 22 };
    if (r.gB > 0.2) { hB = { x: -50 - r.gB * 10, y: shY + 34 - r.gB * 18 }; akimboB = false; }
  }
  if (r.ges > 0) {                                                   // spráskne ruce („No né!")
    hA = { x: mix(hA.x, 20, r.ges), y: mix(hA.y, shY + 16, r.ges) }; holdA = r.ges < 0.3 && holdA;
    hB = { x: mix(hB.x, -16, r.ges), y: mix(hB.y, shY + 16, r.ges) }; akimboB = false;
  }
  if (r.reach) { hA = { x: 72 + r.wob, y: shY + 24 + r.wob }; holdA = false; }
  if (r.pick) { hA = { x: 52, y: -12 }; holdA = false; }
  /* zadní paže — loket VEN ze siluety (bojovný akimbo trojúhelník) */
  limb(ctx, shBx, shBy, akimboB ? -64 : (shBx + hB.x) / 2 - 8,
    akimboB ? (shBy + hB.y) / 2 - 6 : (shBy + hB.y) / 2 + 10, hB.x, hB.y, 12.5, BLOUSE);
  handBare(ctx, hB.x, hB.y, 10, akimboB ? 1.9 : -0.6);
  /* přední paže */
  limb(ctx, shAx, shAy, (shAx + hA.x) / 2 + 9, (shAy + hA.y) / 2 + 8, hA.x, hA.y, 12.5, BLOUSE);
  /* šňůra sušených jablek v prstech (houpe se; při řeči lítá s gestem) */
  if (holdA && !r.walk) {
    const sw2 = Math.sin(t * 1.9) * 4 + (r.talk ? Math.sin(t * 5.3 - 0.8) * 7 : 0);
    ctx.strokeStyle = '#6a5230'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hA.x, hA.y + 3);
    ctx.quadraticCurveTo(hA.x + 5 + sw2 * 0.5, hA.y + 26, hA.x + 2 + sw2, hA.y + 50);
    ctx.stroke();
    for (let i = 1; i <= 4; i++) {
      const ay2 = hA.y + 3 + i * 11.5;
      const ax2 = hA.x + (5 + sw2 * 0.5) * Math.sin(i * 0.55) + sw2 * i * 0.16;
      cel(ctx, (c) => { c.arc(ax2, ay2, 6.6 - i * 0.5, 0, TAU); },
        { base: '#9a5a30', cx: ax2, cy: ay2, r: 6.5, lw: 1.8, rim: null });
      ctx.fillStyle = 'rgba(60,30,12,0.6)';
      ctx.beginPath(); ctx.arc(ax2, ay2, 1.4, 0, TAU); ctx.fill();
    }
  }
  handBare(ctx, hA.x, hA.y, 10.5, holdA ? 0.9 : 0.1);

  /* --- hlava: velká, s bradičkou, mírně nakloněná (drzé sebevědomí) --- */
  ctx.save();
  ctx.translate(0, hy);
  ctx.rotate(0.05 + Math.sin(t * 0.9) * 0.018 + (r.talk ? Math.sin(t * 4.1) * 0.02 : 0));
  ctx.translate(0, -hy);
  ctx.fillStyle = SKIN;
  ctx.fillRect(-8, shY - 12, 16, 15);
  cel(ctx, headRound(0, hy, hr, hr * 1.02, 0.85), { base: SKIN, cx: 0, cy: hy, r: hr, lw: 3 });

  /* šátek à la babuška — kryje temeno a týl, obličej NECHÁVÁ volný:
     přední okraj vede po linii vlasů NAD obočím, ne přes oči */
  const satek = (c) => {
    c.moveTo(-hr - 3, hy + 16);                       // týl dole (za krkem)
    c.quadraticCurveTo(-hr - 8, hy - 24, -12, hy - hr - 4);   // týl → temeno
    c.quadraticCurveTo(20, hy - hr - 8, hr - 4, hy - hr + 16);// temeno → spánek
    c.quadraticCurveTo(hr + 2, hy - hr + 26, hr - 2, hy - 14);// kousek po spánku dolů
    c.quadraticCurveTo(hr - 16, hy - 24, -2, hy - 18);        // okraj podél čela (nad obočím!)
    c.quadraticCurveTo(-hr + 14, hy - 12, -hr + 10, hy + 6);  // kolem zadní tváře
    c.quadraticCurveTo(-hr + 2, hy + 2, -hr - 3, hy + 16);    // uzávěr po týlu
    c.closePath();
  };
  ctx.fillStyle = SCARF2;
  ctx.beginPath(); satek(ctx); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
  ctx.beginPath(); satek(ctx); ctx.stroke();
  rimStroke(ctx, satek, 0, hy - 14, hr, 7);
  ctx.strokeStyle = 'rgba(140,100,20,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-hr + 10, hy - 20);
  ctx.quadraticCurveTo(0, hy - 30, hr - 8, hy - 16);
  ctx.stroke();
  /* uzel POD BRADOU + třepetající cípy (dole u krku, ne na tváři) */
  ell(ctx, 8, hy + hr - 3, 6, 5, SCARF2);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.ellipse(8, hy + hr - 3, 6, 5, 0, 0, TAU); ctx.stroke();
  ctx.save();
  ctx.translate(8, hy + hr - 1);
  ctx.rotate(Math.sin(t * 2.3) * 0.12);
  ctx.fillStyle = SCARF2;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, 7, 7, 17); ctx.quadraticCurveTo(2, 10, 0, 0);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.quadraticCurveTo(-7, 8, -10, 14); ctx.quadraticCurveTo(-3, 7, 0, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, 7, 7, 17);
  ctx.moveTo(0, 0); ctx.quadraticCurveTo(-7, 8, -10, 14);
  ctx.stroke();
  ctx.restore();
  /* pramínek vlasů zpod šátku na týlu */
  ctx.strokeStyle = '#8a6034'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-hr + 11, hy + 4);
  ctx.quadraticCurveTo(-hr + 7 + Math.sin(t * 2.1) * 2, hy + 14, -hr + 12, hy + 20);
  ctx.stroke();
  /* drobná kudrnka vykukující zpod okraje na čele (mimo oči) */
  ctx.strokeStyle = '#8a6034'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, hy - 17);
  ctx.quadraticCurveTo(7, hy - 14, 5, hy - 9);
  ctx.stroke();

  /* tvář — vlídná, ale mazaná; jedno obočí výš (ví o všem první) */
  const bl = r.talk ? r.mouth * 4.5 : (r.ges > 0 ? 4 : 0);
  brow(ctx, 11, hy - 13 - bl, 7, 2.5, '#8a6034', 4.2);
  brow(ctx, 29, hy - 17 - bl * 1.3, 7, -1.5, '#8a6034', 4.2);
  eyes(ctx, 11, 29, hy - 4, 5.2, r.blink, 0.32);
  /* BRAMBOROVÝ nos — velký, s nosní dírkou a odleskem (karikatura) */
  cel(ctx, (c) => { c.ellipse(25, hy + 7, 10.5, 8.6, 0.16, 0, TAU); },
    { base: '#e2a06e', cx: 25, cy: hy + 7, r: 10, lw: 2.4 });
  ell(ctx, 21, hy + 4, 3.4, 2.6, 'rgba(255,255,255,0.5)');
  ctx.fillStyle = 'rgba(120,60,30,0.55)';
  ctx.beginPath(); ctx.ellipse(30, hy + 12, 2.2, 1.5, 0.4, 0, TAU); ctx.fill();
  cheeks(ctx, 2, 38, hy + 12, 9.5, 0.45);                            // jablíčkové tváře
  mouthDraw(ctx, 16, hy + 22, r.mouth, 9.5, 5.5, '#6e2a1e');
  /* smíchové vrásky u oka + dvojitá bradička */
  ctx.strokeStyle = 'rgba(150,84,48,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(37, hy - 6); ctx.quadraticCurveTo(40, hy - 2, 38, hy + 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,84,48,0.35)'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, hy + 33); ctx.quadraticCurveTo(14, hy + 38, 28, hy + 32);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/* ------------------------------------------------------------ registrace */
BNJ.registerCharacter({ id: 'jirka', textColor: '#ffe9a8', height: 300, draw: drawJirka });
BNJ.registerCharacter({ id: 'brahe', textColor: '#d9b8ff', height: 360, draw: drawBrahe });
BNJ.registerCharacter({ id: 'kepler', textColor: '#b8e0ff', height: 330, draw: drawKepler });
BNJ.registerCharacter({ id: 'benda', textColor: '#ff9e64', height: 340, draw: drawBenda });
BNJ.registerCharacter({ id: 'prevoznik', textColor: '#9fd8c0', height: 350, draw: drawPrevoznik });
BNJ.registerCharacter({ id: 'trhovkyne', textColor: '#ffa8c8', height: 320, draw: drawTrhovkyne });

})();
