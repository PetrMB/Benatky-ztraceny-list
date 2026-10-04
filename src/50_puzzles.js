/* =========================================================================
   ZTRACENÝ LIST — 50_puzzles.js
   Předměty (ikony 96×96), hotspoty všech scén, interakce, kombinace,
   hádanky H1–H10 a cutscény (sextant, finále s Keplerem).
   Kánon ID dle design/IDS.md; souřadnice hotspotů dle hlavičky
   20_backgrounds.js. Interní pomocné flagy mají prefix „_" (stejně jako
   _song_* ve 40_dialogues.js) a NEJSOU součástí veřejného kánonu.
   ========================================================================= */
(function () {
'use strict';

const BNJ = window.BNJ;
if (!BNJ || !BNJ.registerItem || !BNJ.registerHotspot) {
  console.error('[50_puzzles] BNJ API chybí — engine se nenačetl?');
  return;
}

const TAU = Math.PI * 2;

/* ------------------------------------------------------------ zkratky */
const has = (id) => BNJ.state.inventory.includes(id);
const FL  = (n)  => !!BNJ.state.flags[n];
const J   = (t, then) => BNJ.say('jirka', t, then);
const B   = (t, then) => BNJ.say('brahe', t, then);
const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/* ==================================================================== */
/* ČÁST 1 — PŘEDMĚTY (registerItem, drawIcon 96×96)                     */
/* ==================================================================== */

/* ---- kreslicí pomůcky ikon ---- */
function iRR(x, a, b, w, h, r) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}
function iShadow(x, w) {
  x.fillStyle = 'rgba(10,8,14,0.28)';
  x.beginPath(); x.ellipse(48, 84, w || 30, 7, 0, 0, TAU); x.fill();
}
function iPoly(x, pts) {
  x.beginPath();
  x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
  x.closePath();
}
/* utržený cár pergamenu: pts = obrys, lines = počet vybledlých řádků */
function iScrap(x, pts, opt) {
  opt = opt || {};
  const g = x.createLinearGradient(20, 16, 76, 80);
  g.addColorStop(0, opt.c0 || '#efe3c2');
  g.addColorStop(0.55, opt.c1 || '#e0cfa4');
  g.addColorStop(1, opt.c2 || '#c6ac7c');
  iPoly(x, pts);
  x.fillStyle = g; x.fill();
  x.strokeStyle = opt.edge || '#7a5c34'; x.lineWidth = 2.4; x.stroke();
  // vybledlé řádky písma
  x.strokeStyle = opt.ink || 'rgba(88,70,110,0.38)';
  x.lineWidth = 2;
  const n = opt.lines == null ? 4 : opt.lines;
  for (let i = 0; i < n; i++) {
    const y = 32 + i * 11 + (i % 2) * 1.5;
    x.beginPath();
    x.moveTo(28 + (i % 3) * 2, y);
    x.quadraticCurveTo(48, y + 2, 66 - (i % 2) * 6, y - 1);
    x.stroke();
  }
}

/* ---- mokry_list — rozmočený cár s půlkou pečeti ---- */
BNJ.registerItem({
  id: 'mokry_list',
  name: { cz: 'Rozmočený cár listu', en: 'Soggy scrap of the letter' },
  desc: {
    cz: 'Půlka císařské pečeti a rozpité písmo. Vůně: Jizera, ročník 1600.',
    en: 'Half an imperial seal and smeared ink. Bouquet: Jizera, vintage 1600.'
  },
  drawIcon(x) {
    iShadow(x, 30);
    x.save(); x.translate(48, 46); x.rotate(-0.14); x.translate(-48, -46);
    iScrap(x, [[24, 14], [66, 10], [74, 26], [70, 44], [76, 60], [62, 74], [40, 78], [28, 66], [18, 48], [26, 32]],
      { c0: '#d9cfae', c1: '#c3b58e', c2: '#a3906a', ink: 'rgba(70,60,100,0.30)', lines: 4 });
    // rozpité skvrny vody
    x.fillStyle = 'rgba(90,110,130,0.20)';
    x.beginPath(); x.ellipse(40, 56, 13, 9, 0.4, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(60, 30, 9, 6, -0.3, 0, TAU); x.fill();
    // půlka červené pečeti (utržená rovnou hranou)
    x.save();
    x.beginPath(); x.rect(46, 52, 26, 26); x.clip();
    x.fillStyle = '#8a2c22';
    x.beginPath(); x.arc(46, 64, 12, 0, TAU); x.fill();
    x.fillStyle = '#a94434';
    x.beginPath(); x.arc(44, 62, 8, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(60,16,10,0.6)'; x.lineWidth = 1.4;
    x.beginPath(); x.arc(46, 64, 12, 0, TAU); x.stroke();
    x.restore();
    x.restore();
    // kapky
    x.fillStyle = 'rgba(150,190,220,0.85)';
    [[30, 84], [56, 88], [70, 82]].forEach(p => {
      x.beginPath();
      x.moveTo(p[0], p[1] - 6);
      x.quadraticCurveTo(p[0] + 4, p[1], p[0], p[1] + 3);
      x.quadraticCurveTo(p[0] - 4, p[1], p[0], p[1] - 6);
      x.fill();
    });
  }
});

/* ---- tři fragmenty — společný základ, různé siluety a ozdoby ---- */
function fragIcon(x, pts, deco) {
  iShadow(x, 28);
  x.save(); x.translate(48, 46); x.rotate(0.1); x.translate(-48, -46);
  iScrap(x, pts, { ink: 'rgba(80,66,104,0.42)', lines: 4 });
  deco(x);
  x.restore();
}
BNJ.registerItem({
  id: 'frag_a',
  name: { cz: 'Fragment listu — jez', en: 'Letter fragment — weir' },
  desc: {
    cz: 'Točil se ve víru jako tanečník. Písmo vybledlé, ale rýhy po brku drží.',
    en: 'It spun in the eddy like a dancer. Ink faded, but the quill grooves hold.'
  },
  drawIcon(x) {
    fragIcon(x, [[22, 20], [58, 12], [76, 22], [70, 40], [78, 58], [58, 72], [34, 76], [20, 58], [16, 38]], (c) => {
      // vodní vír — spirálka v rohu
      c.strokeStyle = 'rgba(80,120,140,0.55)'; c.lineWidth = 2;
      c.beginPath();
      for (let a = 0; a < 4.6; a += 0.2) {
        const r = 2 + a * 2.4;
        const px = 64 + Math.cos(a * 1.9) * r, py = 62 + Math.sin(a * 1.9) * r * 0.7;
        if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      c.fillStyle = 'rgba(150,190,220,0.7)';
      c.beginPath(); c.arc(28, 66, 2.4, 0, TAU); c.fill();
      c.beginPath(); c.arc(72, 28, 2, 0, TAU); c.fill();
    });
  }
});
BNJ.registerItem({
  id: 'frag_b',
  name: { cz: 'Fragment listu — hnízdo', en: 'Letter fragment — nest' },
  desc: {
    cz: 'Vystlaný husím peřím a pomstou. Markyta ví, kde bydlím.',
    en: 'Lined with goose down and vengeance. Markyta knows where I live.'
  },
  drawIcon(x) {
    fragIcon(x, [[20, 26], [50, 12], [74, 18], [80, 40], [68, 58], [72, 72], [44, 78], [26, 68], [14, 46]], (c) => {
      // přilepené peříčko
      c.save(); c.translate(62, 62); c.rotate(0.7);
      c.fillStyle = 'rgba(244,244,238,0.95)';
      c.beginPath();
      c.moveTo(0, -14);
      c.quadraticCurveTo(8, -4, 0, 12);
      c.quadraticCurveTo(-8, -4, 0, -14);
      c.fill();
      c.strokeStyle = 'rgba(160,160,150,0.8)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, -13); c.lineTo(0, 11); c.stroke();
      c.restore();
      // stébla z hnízda
      c.strokeStyle = 'rgba(120,100,54,0.7)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(20, 70); c.quadraticCurveTo(30, 62, 40, 70); c.stroke();
      c.beginPath(); c.moveTo(16, 60); c.quadraticCurveTo(26, 56, 30, 62); c.stroke();
    });
  }
});
BNJ.registerItem({
  id: 'frag_c',
  name: { cz: 'Fragment listu — led', en: 'Letter fragment — ice' },
  desc: {
    cz: 'Vytaje-li úplně, poděkuju svíčce. V rohu ještě chrastí jinovatka.',
    en: 'If it ever thaws fully, I shall thank the candle. Hoarfrost still rattles in the corner.'
  },
  drawIcon(x) {
    fragIcon(x, [[26, 14], [64, 16], [80, 32], [72, 52], [76, 68], [52, 78], [30, 72], [18, 54], [20, 32]], (c) => {
      // námraza — bílé jehličky u okrajů
      c.strokeStyle = 'rgba(226,240,252,0.9)'; c.lineWidth = 1.6;
      [[24, 20, 0.6], [70, 24, 2.4], [26, 62, 4.0], [70, 64, 5.2]].forEach(s => {
        for (let k = 0; k < 3; k++) {
          const a = s[2] + k * 0.5;
          c.beginPath();
          c.moveTo(s[0], s[1]);
          c.lineTo(s[0] + Math.cos(a) * 9, s[1] + Math.sin(a) * 9);
          c.stroke();
        }
      });
      c.fillStyle = 'rgba(190,214,236,0.35)';
      c.beginPath(); c.ellipse(48, 44, 22, 15, 0.2, 0, TAU); c.fill();
    });
  }
});

/* ---- cednik — děravý měděný cedník ---- */
BNJ.registerItem({
  id: 'cednik',
  name: { cz: 'Děravý cedník', en: 'Leaky strainer' },
  desc: {
    cz: 'Bětka přísahá, že díry má schválně. Na lovení listů z řek — přesně tak akorát.',
    en: 'Bětka swears the holes are intentional. For fishing letters out of rivers — just the thing.'
  },
  drawIcon(x) {
    iShadow(x, 32);
    x.save(); x.translate(48, 50); x.rotate(-0.12);
    // rukojeť
    const hg = x.createLinearGradient(18, -6, 46, 6);
    hg.addColorStop(0, '#9a6a30'); hg.addColorStop(1, '#5e3c1c');
    x.fillStyle = hg;
    iRR(x, 16, -5, 32, 10, 5); x.fill();
    x.strokeStyle = '#3c2812'; x.lineWidth = 1.6; x.stroke();
    x.beginPath(); x.arc(44, 0, 4, 0, TAU); x.strokeStyle = '#3c2812'; x.stroke();
    // mísa
    const bg = x.createRadialGradient(-16, -10, 4, -8, 2, 34);
    bg.addColorStop(0, '#e8a86a'); bg.addColorStop(0.6, '#b97a3c'); bg.addColorStop(1, '#7c4c22');
    x.fillStyle = bg;
    x.beginPath(); x.ellipse(-8, 2, 28, 22, 0, 0, TAU); x.fill();
    x.strokeStyle = '#4c2c12'; x.lineWidth = 2.2; x.stroke();
    x.fillStyle = 'rgba(255,235,200,0.35)';
    x.beginPath(); x.ellipse(-16, -8, 10, 5, -0.5, 0, TAU); x.fill();
    // díry
    x.fillStyle = '#3a2010';
    for (let r = 0; r < 3; r++) {
      const n = 3 + r * 3;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + r;
        x.beginPath();
        x.arc(-8 + Math.cos(a) * r * 8, 2 + Math.sin(a) * r * 6, 1.8, 0, TAU);
        x.fill();
      }
    }
    x.restore();
  }
});

/* ---- bidlo — dlouhá převoznická tyč ---- */
BNJ.registerItem({
  id: 'bidlo',
  name: { cz: 'Převoznické bidlo', en: 'Ferry pole' },
  desc: {
    cz: 'Rodinné dědictví Vávrů. Otec, děd i Jizera na něm zanechali stopy.',
    en: 'A Vávra family heirloom. Father, grandfather and the Jizera all left their marks on it.'
  },
  drawIcon(x) {
    iShadow(x, 34);
    x.save(); x.translate(48, 48); x.rotate(0.62);
    const g = x.createLinearGradient(-4, 0, 5, 0);
    g.addColorStop(0, '#8a5c2c'); g.addColorStop(0.5, '#b98a4c'); g.addColorStop(1, '#6a4420');
    x.fillStyle = g;
    iRR(x, -4, -56, 9, 112, 4); x.fill();
    x.strokeStyle = '#3c2812'; x.lineWidth = 1.8; x.stroke();
    // léta dřeva
    x.strokeStyle = 'rgba(60,40,18,0.5)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(0, -50); x.quadraticCurveTo(3, -10, -1, 30); x.stroke();
    x.beginPath(); x.moveTo(3, -44); x.quadraticCurveTo(1, 0, 4, 44); x.stroke();
    // okované špičaté dno
    x.fillStyle = '#8a8f98';
    iPoly(x, [[-5, 44], [6, 44], [3, 58], [-2, 58]]); x.fill();
    x.strokeStyle = '#3a3e46'; x.lineWidth = 1.4; x.stroke();
    // vruby („zářezy plaveb")
    x.strokeStyle = 'rgba(40,26,12,0.8)';
    for (let i = 0; i < 4; i++) {
      x.beginPath(); x.moveTo(-4, -34 + i * 7); x.lineTo(0, -34 + i * 7); x.stroke();
    }
    x.restore();
  }
});

/* ---- podberak — cedník přivázaný na bidlo ---- */
BNJ.registerItem({
  id: 'podberak',
  name: { cz: '„Astronomický podběrák"', en: '"Astronomical skimmer"' },
  desc: {
    cz: 'Brahe má sextant, já mám tohle. Oba přístroje míří k nebi — můj přes jez.',
    en: 'Brahe has his sextant, I have this. Both instruments aim at the heavens — mine via the weir.'
  },
  drawIcon(x) {
    iShadow(x, 34);
    x.save(); x.translate(44, 52); x.rotate(0.66);
    const g = x.createLinearGradient(-4, 0, 5, 0);
    g.addColorStop(0, '#8a5c2c'); g.addColorStop(0.5, '#b98a4c'); g.addColorStop(1, '#6a4420');
    x.fillStyle = g;
    iRR(x, -4, -22, 8, 78, 4); x.fill();
    x.strokeStyle = '#3c2812'; x.lineWidth = 1.6; x.stroke();
    x.restore();
    // cedník na konci (vlevo nahoře)
    x.save(); x.translate(30, 26); x.rotate(-0.5);
    const bg = x.createRadialGradient(-6, -6, 3, 0, 0, 24);
    bg.addColorStop(0, '#e8a86a'); bg.addColorStop(0.6, '#b97a3c'); bg.addColorStop(1, '#7c4c22');
    x.fillStyle = bg;
    x.beginPath(); x.ellipse(0, 0, 20, 15, 0, 0, TAU); x.fill();
    x.strokeStyle = '#4c2c12'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#3a2010';
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU;
      x.beginPath(); x.arc(Math.cos(a) * 8, Math.sin(a) * 6, 1.6, 0, TAU); x.fill();
    }
    x.restore();
    // provazové ovázání
    x.strokeStyle = '#caa86a'; x.lineWidth = 2.6;
    for (let i = 0; i < 3; i++) {
      x.beginPath();
      x.moveTo(38 + i * 3, 34 + i * 4);
      x.lineTo(50 + i * 3, 42 + i * 4);
      x.stroke();
    }
    // hvězdička „vědeckosti"
    x.fillStyle = '#ffe9a8';
    x.save(); x.translate(74, 18);
    x.beginPath();
    for (let k = 0; k < 10; k++) {
      const rr2 = k % 2 ? 2.4 : 6, a = k / 10 * TAU - Math.PI / 2;
      x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    x.closePath(); x.fill();
    x.restore();
  }
});

/* ---- zrno — pytlík zrní ---- */
BNJ.registerItem({
  id: 'zrno',
  name: { cz: 'Pytlík zrní', en: 'Bag of grain' },
  desc: {
    cz: 'Úplatek pro husu. Bětka tvrdí, že na zrní slyší i výběrčí daní.',
    en: 'A bribe for a goose. Bětka claims even tax collectors respond to grain.'
  },
  drawIcon(x) {
    iShadow(x, 26);
    x.save(); x.translate(48, 52);
    const g = x.createLinearGradient(-22, -20, 20, 30);
    g.addColorStop(0, '#c8a878'); g.addColorStop(0.6, '#a8865a'); g.addColorStop(1, '#7c603c');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(-16, -22);
    x.quadraticCurveTo(-30, 2, -22, 26);
    x.quadraticCurveTo(0, 36, 22, 26);
    x.quadraticCurveTo(30, 0, 16, -22);
    x.closePath(); x.fill();
    x.strokeStyle = '#54401e'; x.lineWidth = 2.2; x.stroke();
    // převázaný krk
    x.fillStyle = '#b89468';
    x.beginPath(); x.ellipse(0, -24, 12, 7, 0, 0, TAU); x.fill();
    x.strokeStyle = '#54401e'; x.lineWidth = 2; x.stroke();
    x.strokeStyle = '#8a2c22'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(-11, -20); x.quadraticCurveTo(0, -14, 11, -20); x.stroke();
    // šev
    x.strokeStyle = 'rgba(84,64,30,0.7)'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(-2, -16); x.quadraticCurveTo(2, 6, -2, 28); x.stroke();
    // vysypaná zrnka
    x.fillStyle = '#e8c86a';
    [[-30, 34], [-24, 39], [26, 36], [32, 32], [20, 41], [-14, 42]].forEach(p => {
      x.save(); x.translate(p[0], p[1]); x.rotate(p[0]);
      x.beginPath(); x.ellipse(0, 0, 3.4, 2, 0, 0, TAU); x.fill();
      x.restore();
    });
    x.restore();
  }
});

/* ---- svicka — lojová svíčka ---- */
BNJ.registerItem({
  id: 'svicka',
  name: { cz: 'Lojová svíčka', en: 'Tallow candle' },
  desc: {
    cz: 'Taví led i kape na pečeti. Voní jako skopové. Všechno v Benátkách voní jako skopové.',
    en: 'Melts ice and drips onto seals. Smells of mutton. Everything in Benátky smells of mutton.'
  },
  drawIcon(x) {
    iShadow(x, 20);
    x.save(); x.translate(48, 50);
    const g = x.createLinearGradient(-12, 0, 12, 0);
    g.addColorStop(0, '#d8c890'); g.addColorStop(0.4, '#f0e2b0'); g.addColorStop(1, '#b8a468');
    x.fillStyle = g;
    iRR(x, -11, -22, 22, 56, 4); x.fill();
    x.strokeStyle = '#6a5428'; x.lineWidth = 2; x.stroke();
    // stékající vosk
    x.fillStyle = '#f4ecc8';
    x.beginPath();
    x.moveTo(-11, -20); x.quadraticCurveTo(-15, -8, -11, 2);
    x.quadraticCurveTo(-8, -8, -11, -20); x.fill();
    x.beginPath();
    x.moveTo(8, -21); x.quadraticCurveTo(12, -12, 9, -4);
    x.quadraticCurveTo(6, -12, 8, -21); x.fill();
    x.beginPath(); x.ellipse(0, -22, 11, 4.4, 0, 0, TAU); x.fill();
    x.strokeStyle = '#6a5428'; x.lineWidth = 1.4; x.stroke();
    // knot + plamínek
    x.strokeStyle = '#3a2c14'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, -22); x.lineTo(1, -30); x.stroke();
    const fg = x.createRadialGradient(1, -36, 1, 1, -36, 10);
    fg.addColorStop(0, '#fff6d8'); fg.addColorStop(0.45, '#ffb347'); fg.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = fg;
    x.beginPath();
    x.moveTo(1, -46);
    x.quadraticCurveTo(7, -36, 1, -28);
    x.quadraticCurveTo(-5, -36, 1, -46);
    x.fill();
    x.restore();
  }
});

/* ---- dubenky — hrst duběnek s dubovou větvičkou ---- */
BNJ.registerItem({
  id: 'dubenky',
  name: { cz: 'Hrst duběnek', en: 'Handful of oak galls' },
  desc: {
    cz: 'Kuličky ze starého dubu. Žlabatka si v nich bydlí, písaři z nich píší. Příroda je podivná.',
    en: 'Little balls from the old oak. Gall wasps live in them, scribes write with them. Nature is strange.'
  },
  drawIcon(x) {
    iShadow(x, 28);
    // větvička s lístkem
    x.strokeStyle = '#5a4326'; x.lineWidth = 3.4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(18, 30); x.quadraticCurveTo(50, 18, 80, 28); x.stroke();
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(58, 23); x.lineTo(66, 12); x.stroke();
    // dubový list
    x.save(); x.translate(68, 10); x.rotate(0.5);
    x.fillStyle = '#7c7034';
    x.beginPath();
    x.moveTo(0, 0);
    for (let i = 0; i < 6; i++) {
      const yy = i * 4.4;
      x.quadraticCurveTo(9 - (i % 2) * 4, yy + 2, 3, yy + 4.4);
    }
    for (let i = 5; i >= 0; i--) {
      const yy = i * 4.4;
      x.quadraticCurveTo(-9 + (i % 2) * 4, yy + 2, -3, yy);
    }
    x.closePath(); x.fill();
    x.strokeStyle = '#4c441c'; x.lineWidth = 1; x.stroke();
    x.restore();
    // duběnky (kuličky s dírkou po žlabatce)
    [[34, 52, 13], [58, 58, 11], [44, 70, 10], [70, 48, 8]].forEach(p => {
      const g = x.createRadialGradient(p[0] - p[2] * 0.4, p[1] - p[2] * 0.4, 2, p[0], p[1], p[2]);
      g.addColorStop(0, '#c8a05c'); g.addColorStop(0.6, '#96703a'); g.addColorStop(1, '#5e4322');
      x.fillStyle = g;
      x.beginPath(); x.arc(p[0], p[1], p[2], 0, TAU); x.fill();
      x.strokeStyle = 'rgba(50,34,14,0.7)'; x.lineWidth = 1.4; x.stroke();
      x.fillStyle = '#32220e';
      x.beginPath(); x.arc(p[0] + p[2] * 0.45, p[1] + p[2] * 0.2, 1.6, 0, TAU); x.fill();
    });
  }
});

/* ---- skalice — lahvička zelené skalice ---- */
BNJ.registerItem({
  id: 'skalice',
  name: { cz: 'Zelená skalice', en: 'Green vitriol' },
  desc: {
    cz: 'Síran železnatý z Brahovy laboratoře. „Jedna lahvička, chlapče. JEDNA."',
    en: 'Iron sulphate from Brahe’s laboratory. "One phial, boy. ONE."'
  },
  drawIcon(x) {
    iShadow(x, 20);
    x.save(); x.translate(48, 52);
    // sklo lahvičky
    const g = x.createLinearGradient(-16, 0, 16, 0);
    g.addColorStop(0, 'rgba(190,220,215,0.9)');
    g.addColorStop(0.5, 'rgba(230,246,242,0.75)');
    g.addColorStop(1, 'rgba(160,196,190,0.9)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(-7, -34); x.lineTo(-7, -18);
    x.quadraticCurveTo(-18, -10, -16, 10);
    x.quadraticCurveTo(-14, 30, 0, 30);
    x.quadraticCurveTo(14, 30, 16, 10);
    x.quadraticCurveTo(18, -10, 7, -18);
    x.lineTo(7, -34);
    x.closePath(); x.fill();
    x.strokeStyle = '#3e5a52'; x.lineWidth = 2; x.stroke();
    // zelené krystaly uvnitř
    x.fillStyle = '#5ec898';
    iPoly(x, [[-13, 24], [-12, 10], [-4, 16], [0, 6], [6, 18], [12, 9], [13, 24]]);
    x.fill();
    x.fillStyle = 'rgba(180,255,220,0.55)';
    iPoly(x, [[-6, 22], [-2, 12], [3, 22]]); x.fill();
    // korek
    x.fillStyle = '#b08a54';
    iRR(x, -8, -42, 16, 10, 3); x.fill();
    x.strokeStyle = '#5e4322'; x.lineWidth = 1.6; x.stroke();
    // odlesk skla
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 2.4;
    x.beginPath(); x.moveTo(-10, -12); x.quadraticCurveTo(-13, 4, -9, 18); x.stroke();
    x.restore();
  }
});

/* ---- inkoust — kalamář duběnkového inkoustu ---- */
BNJ.registerItem({
  id: 'inkoust',
  name: { cz: 'Duběnkový inkoust', en: 'Iron-gall ink' },
  desc: {
    cz: 'Duběnky + skalice, utřeno v hmoždíři. Černý jak zimní noc a drží staletí.',
    en: 'Oak galls + vitriol, ground in a mortar. Black as a winter night and it lasts for centuries.'
  },
  drawIcon(x) {
    iShadow(x, 24);
    x.save(); x.translate(48, 56);
    // baňatý kameninový kalamář
    const g = x.createRadialGradient(-8, -10, 4, 0, 0, 30);
    g.addColorStop(0, '#8a7a68'); g.addColorStop(0.6, '#665846'); g.addColorStop(1, '#3e3428');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(-12, -22);
    x.quadraticCurveTo(-28, -12, -24, 8);
    x.quadraticCurveTo(-20, 26, 0, 26);
    x.quadraticCurveTo(20, 26, 24, 8);
    x.quadraticCurveTo(28, -12, 12, -22);
    x.closePath(); x.fill();
    x.strokeStyle = '#241c12'; x.lineWidth = 2.2; x.stroke();
    // hrdlo s hladinou inkoustu
    x.fillStyle = '#241c12';
    x.beginPath(); x.ellipse(0, -22, 13, 5.5, 0, 0, TAU); x.fill();
    x.fillStyle = '#0e0a14';
    x.beginPath(); x.ellipse(0, -22, 10, 4, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(120,120,180,0.5)';
    x.beginPath(); x.ellipse(-3, -23, 3.4, 1.4, 0, 0, TAU); x.fill();
    // kapka na boku
    x.fillStyle = '#141020';
    x.beginPath();
    x.moveTo(16, -14); x.quadraticCurveTo(20, -4, 15, 0);
    x.quadraticCurveTo(12, -6, 16, -14); x.fill();
    // odlesk
    x.strokeStyle = 'rgba(230,220,200,0.35)'; x.lineWidth = 2.6;
    x.beginPath(); x.moveTo(-16, -12); x.quadraticCurveTo(-20, 2, -14, 14); x.stroke();
    x.restore();
  }
});

/* ---- brk — husí brk ---- */
BNJ.registerItem({
  id: 'brk',
  name: { cz: 'Husí brk', en: 'Goose quill' },
  desc: {
    cz: 'Markytě vypadl, když slézala k zrní. Považuji to za dobrovolný dar. Ona ne.',
    en: 'Markyta dropped it climbing down to the grain. I consider it a voluntary gift. She does not.'
  },
  drawIcon(x) {
    iShadow(x, 30);
    x.save(); x.translate(48, 48); x.rotate(0.7);
    // prapor pera
    const g = x.createLinearGradient(-14, 0, 12, 0);
    g.addColorStop(0, '#e8e8e0'); g.addColorStop(0.5, '#f8f8f4'); g.addColorStop(1, '#c8c8be');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, -46);
    x.quadraticCurveTo(16, -30, 10, -2);
    x.quadraticCurveTo(6, 10, 2, 16);
    x.lineTo(-2, 14);
    x.quadraticCurveTo(-14, -12, -8, -34);
    x.quadraticCurveTo(-5, -43, 0, -46);
    x.closePath(); x.fill();
    x.strokeStyle = '#8a8a80'; x.lineWidth = 1.4; x.stroke();
    // osten
    x.strokeStyle = '#d8cba8'; x.lineWidth = 2.6;
    x.beginPath(); x.moveTo(0, -44); x.quadraticCurveTo(2, -10, 2, 16); x.stroke();
    // vlákna praporu
    x.strokeStyle = 'rgba(150,150,140,0.6)'; x.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const yy = -40 + i * 7;
      x.beginPath(); x.moveTo(1, yy); x.lineTo(9 - i * 0.6, yy + 5); x.stroke();
      x.beginPath(); x.moveTo(0, yy); x.lineTo(-8 + i * 0.4, yy + 6); x.stroke();
    }
    // seříznutá špička
    x.fillStyle = '#e0d2a8';
    iPoly(x, [[0, 16], [4, 16], [7, 34], [2, 30]]); x.fill();
    x.strokeStyle = '#8a7a50'; x.lineWidth = 1.2; x.stroke();
    x.strokeStyle = '#4a3a20';
    x.beginPath(); x.moveTo(4.5, 27); x.lineTo(6.5, 33); x.stroke();
    x.restore();
  }
});

/* ---- pergamen — čistý svitek ---- */
BNJ.registerItem({
  id: 'pergamen',
  name: { cz: 'Čistý pergamen', en: 'Blank parchment' },
  desc: {
    cz: 'Hladký jako led na Jizeře. Doufám, že dopadne líp než můj poslední papír.',
    en: 'Smooth as the ice on the Jizera. I hope it fares better than my last piece of paper.'
  },
  drawIcon(x) {
    iShadow(x, 30);
    x.save(); x.translate(48, 48); x.rotate(-0.08);
    const g = x.createLinearGradient(-28, -34, 28, 34);
    g.addColorStop(0, '#f6ecd0'); g.addColorStop(0.55, '#ecdcb4'); g.addColorStop(1, '#d0b98c');
    x.fillStyle = g;
    iRR(x, -27, -32, 54, 66, 3); x.fill();
    x.strokeStyle = '#8a6c3c'; x.lineWidth = 2; x.stroke();
    // horní okraj stočený do ruličky
    x.fillStyle = '#c8ae7e';
    x.beginPath(); x.ellipse(0, -32, 27, 8, 0, 0, TAU); x.fill();
    x.strokeStyle = '#8a6c3c'; x.lineWidth = 1.6; x.stroke();
    x.fillStyle = '#a88a5c';
    x.beginPath(); x.ellipse(0, -32, 27, 8, 0, Math.PI * 0.15, Math.PI * 0.85); x.fill();
    // jemné vlásečnice kůže
    x.strokeStyle = 'rgba(150,120,70,0.28)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(-18, -8); x.quadraticCurveTo(0, -2, 18, -10); x.stroke();
    x.beginPath(); x.moveTo(-14, 14); x.quadraticCurveTo(4, 20, 20, 12); x.stroke();
    // zvednutý růžek
    x.fillStyle = '#e2d0a4';
    iPoly(x, [[27, 34], [16, 34], [27, 22]]); x.fill();
    x.strokeStyle = '#8a6c3c'; x.lineWidth = 1.4; x.stroke();
    x.restore();
  }
});

/* ---- pecetidlo — Brahovo mosazné pečetidlo ---- */
BNJ.registerItem({
  id: 'pecetidlo',
  name: { cz: 'Brahovo pečetidlo', en: 'Brahe’s signet' },
  desc: {
    cz: '„Moje čest odlitá v kovu." Mosaz — jako jistá jiná věc, o které se nemluví.',
    en: '"My honour cast in metal." Brass — like a certain other item we do not discuss.'
  },
  drawIcon(x) {
    iShadow(x, 22);
    x.save(); x.translate(48, 46); x.rotate(0.16);
    // dřevěná rukojeť (hruškovitá)
    const hg = x.createLinearGradient(-10, -44, 10, -6);
    hg.addColorStop(0, '#7c5026'); hg.addColorStop(0.5, '#a87840'); hg.addColorStop(1, '#5e3a1a');
    x.fillStyle = hg;
    x.beginPath();
    x.moveTo(-4, -8);
    x.quadraticCurveTo(-14, -20, -9, -34);
    x.quadraticCurveTo(-5, -44, 0, -44);
    x.quadraticCurveTo(5, -44, 9, -34);
    x.quadraticCurveTo(14, -20, 4, -8);
    x.closePath(); x.fill();
    x.strokeStyle = '#3a2410'; x.lineWidth = 1.8; x.stroke();
    x.strokeStyle = 'rgba(255,230,180,0.4)'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(-5, -36); x.quadraticCurveTo(-7, -24, -3, -14); x.stroke();
    // mosazný dřík a hlava
    const bg2 = x.createLinearGradient(-14, 0, 14, 0);
    bg2.addColorStop(0, '#8a5f1e'); bg2.addColorStop(0.45, '#e8bc54'); bg2.addColorStop(1, '#9a6c24');
    x.fillStyle = bg2;
    iRR(x, -5, -10, 10, 14, 2); x.fill();
    x.strokeStyle = '#54400e'; x.lineWidth = 1.6; x.stroke();
    x.fillStyle = bg2;
    x.beginPath(); x.ellipse(0, 14, 20, 12, 0, 0, TAU); x.fill();
    x.strokeStyle = '#54400e'; x.lineWidth = 2; x.stroke();
    // pečetní plocha s hvězdou a půlměsícem (zrcadlově)
    x.fillStyle = '#c89a34';
    x.beginPath(); x.ellipse(0, 16, 16, 9, 0, 0, TAU); x.fill();
    x.strokeStyle = '#6a4c12'; x.lineWidth = 1.2;
    x.beginPath(); x.ellipse(0, 16, 16, 9, 0, 0, TAU); x.stroke();
    x.fillStyle = '#6a4c12';
    x.save(); x.translate(-5, 16);
    x.beginPath();
    for (let k = 0; k < 12; k++) {
      const rr2 = k % 2 ? 1.6 : 4, a = k / 12 * TAU - Math.PI / 2;
      x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2 * 0.7);
    }
    x.closePath(); x.fill();
    x.restore();
    x.beginPath(); x.arc(7, 16, 4, 0.6, TAU - 0.6); x.strokeStyle = '#6a4c12'; x.lineWidth = 2; x.stroke();
    // záblesk mosazi
    x.fillStyle = 'rgba(255,244,200,0.8)';
    x.beginPath(); x.ellipse(-9, 8, 3.4, 1.6, -0.5, 0, TAU); x.fill();
    x.restore();
  }
});

/* ---- prepis — hotový přepis listu ---- */
BNJ.registerItem({
  id: 'prepis',
  name: { cz: 'Přepis listu', en: 'Fair copy' },
  desc: {
    cz: '„Z Boží milosti My, Rudolf Druhý…" Každá čárka na svém místě. Teď už jen pečeť.',
    en: '"By the grace of God, We, Rudolph the Second…" Every stroke in its place. Now just the seal.'
  },
  drawIcon(x) {
    iShadow(x, 30);
    x.save(); x.translate(48, 48); x.rotate(-0.06);
    const g = x.createLinearGradient(-28, -36, 28, 36);
    g.addColorStop(0, '#f8f0d8'); g.addColorStop(0.55, '#eee0bc'); g.addColorStop(1, '#d4bd90');
    x.fillStyle = g;
    iRR(x, -28, -36, 56, 72, 3); x.fill();
    x.strokeStyle = '#8a6c3c'; x.lineWidth = 2; x.stroke();
    // iniciála „R" (Rudolfus) rumělkou
    x.fillStyle = '#a02818';
    x.font = 'bold 20px Georgia, serif';
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillText('R', -24, -14);
    // slavnostní první řádek
    x.strokeStyle = 'rgba(30,24,50,0.85)'; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(-8, -22); x.lineTo(22, -22); x.stroke();
    // úhledné řádky
    x.strokeStyle = 'rgba(30,24,50,0.68)'; x.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const y = -8 + i * 8;
      x.beginPath();
      x.moveTo(-23, y);
      x.lineTo(-23 + 40 + (i % 3) * 3, y);
      x.stroke();
    }
    // podpisová kudrlinka
    x.strokeStyle = 'rgba(30,24,50,0.8)'; x.lineWidth = 1.8;
    x.beginPath();
    x.moveTo(-6, 30);
    x.bezierCurveTo(6, 22, 12, 34, 22, 26);
    x.stroke();
    x.restore();
  }
});

/* ---- zapeceteny_list — složený a zapečetěný přepis ---- */
BNJ.registerItem({
  id: 'zapeceteny_list',
  name: { cz: 'Zapečetěný list', en: 'Sealed letter' },
  desc: {
    cz: 'Vosk, pečeť, rovné řádky. Vypadá, jako by nikdy neplaval. My dva to nikomu nepovíme.',
    en: 'Wax, seal, straight lines. Looks as if it never went swimming. That stays between us.'
  },
  drawIcon(x) {
    iShadow(x, 30);
    x.save(); x.translate(48, 48); x.rotate(0.05);
    // složené psaní
    const g = x.createLinearGradient(-30, -22, 30, 22);
    g.addColorStop(0, '#f4ead0'); g.addColorStop(0.55, '#e8d8b0'); g.addColorStop(1, '#cdb488');
    x.fillStyle = g;
    iRR(x, -30, -22, 60, 44, 3); x.fill();
    x.strokeStyle = '#8a6c3c'; x.lineWidth = 2; x.stroke();
    // přehyby obálky
    x.strokeStyle = 'rgba(120,92,52,0.75)'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(-30, -22); x.lineTo(0, 2); x.lineTo(30, -22); x.stroke();
    x.beginPath(); x.moveTo(-30, 22); x.lineTo(-8, 4); x.stroke();
    x.beginPath(); x.moveTo(30, 22); x.lineTo(8, 4); x.stroke();
    // vosková pečeť s hvězdou
    const sg = x.createRadialGradient(-3, 0, 2, 0, 3, 14);
    sg.addColorStop(0, '#c05038'); sg.addColorStop(0.6, '#96301e'); sg.addColorStop(1, '#661c10');
    x.fillStyle = sg;
    x.beginPath();
    for (let k = 0; k < 14; k++) {
      const a = k / 14 * TAU;
      const rr2 = 13 + (k % 2) * 2.4;
      x.lineTo(Math.cos(a) * rr2, 3 + Math.sin(a) * rr2);
    }
    x.closePath(); x.fill();
    x.strokeStyle = '#40100a'; x.lineWidth = 1.4; x.stroke();
    // otisk hvězdy a půlměsíce
    x.strokeStyle = 'rgba(255,200,160,0.55)'; x.lineWidth = 1.4;
    x.save(); x.translate(-3, 2);
    x.beginPath();
    for (let k = 0; k < 12; k++) {
      const rr2 = k % 2 ? 2 : 5, a = k / 12 * TAU - Math.PI / 2;
      x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2 * 0.8);
    }
    x.closePath(); x.stroke();
    x.restore();
    x.beginPath(); x.arc(5, 4, 4, 0.6, TAU - 0.6); x.stroke();
    // adresní řádek
    x.strokeStyle = 'rgba(30,24,50,0.6)'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(-20, 15); x.lineTo(-2, 15); x.stroke();
    x.restore();
  }
});

/* ==================================================================== */
/* ČÁST 2 — HOTSPOTY: castle_yard (zámecké nádvoří, w2600)              */
/* Souřadnice dle 20_backgrounds: hodiny (800,420) r62 • studna         */
/* (1560,860) • saně (1330,855) • bouda+pes (1815,880) • sníh (300,950) */
/* • dveře věže 2350–2470/690–890 • brána x0–330                        */
/* ==================================================================== */

/* exit-hotspoty mají poly NAD prahem exitu (engine hlídá kruh r100
   kolem exit.at — poly ho nesmí zakrýt, jinak by nešlo projít klikem) */

BNJ.registerHotspot('castle_yard', {
  id: 'hs_cy_gate',
  poly: box(10, 560, 330, 785),
  name: { cz: 'Zámecká brána', en: 'Castle gate' },
  walkTo: [180, 910], faceDir: -1,
  lookAt: {
    cz: 'Brána dolů do města. Nahoru jsem jí prošel s listem. Dolů půjdu s výmluvou.',
    en: 'The gate down to town. I came up through it with a letter. I shall go down with an excuse.'
  },
  use(s) {
    BNJ.sfx('sfx_door');
    BNJ.goto('square', [300, 900]);
  },
  talk() {
    J({
      cz: 'Otevři se!… Ona JE otevřená. Dobrý začátek dne.',
      en: 'Open sesame!… It IS open. A promising start to the day.'
    });
  }
});

BNJ.registerHotspot('castle_yard', {
  id: 'hs_cy_tower_door',
  poly: box(2340, 660, 2480, 775),
  name: { cz: 'Dveře věže — observatoř', en: 'Tower door — observatory' },
  walkTo: [2400, 900], faceDir: 1,
  lookAt: {
    cz: 'Schody do observatoře. Třináct místností přístrojů — a jeden hvězdář, který slyší každé vrznutí.',
    en: 'Stairs to the observatory. Thirteen rooms of instruments — and one astronomer who hears every creak.'
  },
  use(s) {
    BNJ.sfx('sfx_door');
    BNJ.goto('observatory', [330, 930]);
  },
  talk() {
    J({
      cz: '„Dále!" křičí shora. To neplatilo mně. To platilo vesmíru.',
      en: '"Enter!" comes a shout from above. That wasn’t meant for me. That was meant for the universe.'
    });
  }
});

BNJ.registerHotspot('castle_yard', {
  id: 'hs_cy_sundial',
  poly: box(700, 340, 900, 505),
  name: { cz: 'Sluneční hodiny', en: 'Sundial' },
  walkTo: [800, 900], faceDir: -1,
  lookAt: {
    cz: 'Sluneční hodiny v lednu. Ukazují přesně „běž dovnitř".',
    en: 'A sundial in January. It reads, precisely: "go indoors."'
  },
  use() {
    J({
      cz: 'Posunout stín? To bych musel pohnout sluncem. A to tady smí jedině pan Brahe.',
      en: 'Move the shadow? I’d have to move the sun. And around here only Master Brahe is allowed to do that.'
    });
  },
  talk() {
    J({ cz: 'Kolik je hodin?', en: 'What time is it?' }, () => {
      J({
        cz: '…Ticho. Zimní provoz. Otevřeno zase v dubnu.',
        en: '…Silence. Winter hours. Reopening in April.'
      });
    });
  }
});

BNJ.registerHotspot('castle_yard', {
  id: 'hs_cy_well',
  poly: box(1470, 750, 1655, 905),
  name: { cz: 'Zamrzlá studna', en: 'Frozen well' },
  walkTo: [1560, 940], faceDir: 1,
  lookAt: {
    cz: 'Studna zamrzla. I voda v Benátkách má rozum a v lednu nikam neleze.',
    en: 'The well is frozen over. Even the water in Benátky has the sense to stay put in January.'
  },
  use() {
    J({
      cz: 'Okov je přimrzlý k rumpálu. Nechám ho. Dnes už jsem s ledem jednou prohrál.',
      en: 'The bucket is frozen to the windlass. I’ll leave it. I already lost to ice once today.'
    });
  },
  talk() {
    J({ cz: 'Haló-ó-ó!', en: 'Hello-o-o!' }, () => {
      J({
        cz: '„…ó-ó," říká studna. Konečně někdo, kdo se mnou souhlasí.',
        en: '"…o-o," says the well. At last, someone who agrees with me.'
      });
    });
  }
});

BNJ.registerHotspot('castle_yard', {
  id: 'hs_cy_sled',
  poly: box(1230, 785, 1435, 905),
  name: { cz: 'Saně u zdi', en: 'Sleigh by the wall' },
  walkTo: [1330, 935], faceDir: 1,
  lookAt: {
    cz: 'Zámecké saně. Čtvrtého února prý přijedou jiné — až ze Štýrska. Doufám, že vezou trpělivého člověka.',
    en: 'The castle sleigh. On the fourth of February another one is due — all the way from Styria. I hope it carries a patient man.'
  },
  use() {
    J({
      cz: 'Půjčit si je? Posel, co utopil list, nebude řídit spřežení. To je zámecký zákon. Můj zámecký zákon.',
      en: 'Borrow it? A courier who drowned a letter does not get to drive a team. That’s castle law. My castle law.'
    });
  },
  talk() {
    J({
      cz: 'Hyjé!… Bez koní to zní spíš jako prosba.',
      en: 'Giddy-up!… Without horses it sounds more like a plea.'
    });
  }
});

BNJ.registerHotspot('castle_yard', {
  id: 'hs_cy_snow_pile',
  poly: box(200, 895, 425, 1012),
  name: { cz: 'Hromada sněhu', en: 'Pile of snow' },
  walkTo: [420, 980], faceDir: -1,
  lookAt(s) {
    if (FL('snowman_built')) {
      J({
        cz: 'Místo posledního odpočinku sněhuláka Tychona II. Čest jeho rampouchu.',
        en: 'The final resting place of the snowman Tycho II. Honour to his icicle.'
      });
    } else {
      J({
        cz: 'Pěkný, ulehlý sníh. Přímo vybízí k činům, které pan Brahe neschválí.',
        en: 'Nice, well-packed snow. Positively inviting deeds Master Brahe will not approve of.'
      });
    }
  },
  use(s) {
    if (FL('snowman_built')) {
      J({
        cz: 'Postavit druhého? Ryšák už si olizuje čenich. Nebudu krmit osud.',
        en: 'Build another? Ryšák is already licking his snout. I will not feed fate.'
      });
      return;
    }
    const n = (s.flags._snow_hits || 0) + 1;
    BNJ.flag('_snow_hits', n);
    if (n === 1) {
      J({
        cz: 'Koule první — základna. Pořádná, důstojná, vědecká.',
        en: 'Ball one — the base. Solid, dignified, scientific.'
      });
    } else if (n === 2) {
      J({
        cz: 'Koule druhá a třetí. Tělo a hlava. Teď to nejdůležitější…',
        en: 'Balls two and three. Body and head. And now for the crucial part…'
      });
    } else {
      BNJ.flag('snowman_built');
      BNJ.cutscene([
        { say: ['jirka', {
          cz: '…rampouch místo nosu! Sněhulák Tycho II.! Mosazný by mu slušel víc, ale led je levnější.',
          en: '…an icicle for a nose! Tycho II. the snowman! Brass would suit him better, but ice is cheaper.'
        }] },
        { say: ['brahe', {
          cz: 'TO. NENÍ. VTIPNÉ.',
          en: 'ZAT. IS. NOT. FUNNY.'
        }] },
        { say: ['jirka', {
          cz: 'Mistr má okna opravdu všude.',
          en: 'The master truly has windows everywhere.'
        }] },
        { sfx: 'sfx_dog' },
        { wait: 0.5 },
        { say: ['jirka', {
          cz: 'Ryšáku! NE—! …A je po sněhulíkovi. I po nosu. Historie se opakuje.',
          en: 'Ryšák! NO—! …And there goes the snowman. Nose and all. History repeats itself.'
        }] }
      ]);
    }
  },
  talk() {
    J({
      cz: 'Sněhu, sněhu… kdybys uměl vracet listy, byli bychom nejlepší přátelé.',
      en: 'Snow, oh snow… if you could return letters, we would be the best of friends.'
    });
  }
});

BNJ.registerHotspot('castle_yard', {
  id: 'hs_cy_dog',
  poly: box(1720, 795, 1915, 935),
  name: { cz: 'Pes Ryšák', en: 'Ryšák the dog' },
  walkTo: [1815, 950], faceDir: 1,
  lookAt: {
    cz: 'Ryšák, zámecký pes. Hlídá boudu, saně a — soudě po břichu — hlavně kuchyni.',
    en: 'Ryšák, the castle dog. He guards the kennel, the sleigh and — judging by his belly — mainly the kitchen.'
  },
  use() {
    BNJ.sfx('sfx_dog');
    J({
      cz: 'Kdo je hodný pes? Ty jsi hodný pes. Vrtí ocasem tak, že by roztočil Brahův glóbus.',
      en: 'Who’s a good dog? You’re a good dog. His tail wags hard enough to spin Brahe’s globe.'
    });
  },
  talk() {
    J({ cz: 'Ryšáku! Neviděls plavat kus listu?', en: 'Ryšák! Have you seen a piece of letter float by?' }, () => {
      BNJ.sfx('sfx_dog');
      J({
        cz: '„Haf." Což znamená buď „ne", nebo „hoď klacek". U psů je to totéž.',
        en: '"Woof." Which means either "no" or "throw a stick." With dogs it’s the same word.'
      });
    });
  }
});

/* --- postavy finále (viditelné až po finale_started) ------------------ */
BNJ.registerHotspot('castle_yard', {
  id: 'kepler',
  poly: box(1070, 610, 1250, 950),
  hidden: (s) => !s.flags.finale_started,
  name: { cz: 'Johannes Kepler', en: 'Johannes Kepler' },
  walkTo: [1000, 960], faceDir: 1,
  lookAt: {
    cz: 'Pan Kepler. Sníh na ramenou, čísla v hlavě, brýle na šňůrce. Přijel přesně — počítal kroky.',
    en: 'Master Kepler. Snow on his shoulders, numbers in his head, spectacles on a string. He arrived on time — he counted the steps.'
  },
  use() {
    J({
      cz: 'Nebudu mu sahat na desky s papíry. Ještě bych mu rozházel nějakou elipsu.',
      en: 'I shall not touch his folder of papers. I might knock one of his ellipses out of shape.'
    });
  },
  talk() {
    BNJ.say('kepler', {
      cz: 'Ten led na řece… odhadem tři palce. Nosnost… hm… hm. Vy jste po něm ŠEL?',
      en: 'That ice on the river… three inches, at a guess. Load-bearing capacity… hm… hm. You WALKED on it?'
    }, () => {
      J({
        cz: 'Šel. A kus cesty i plaval. Ale to už je v Kronice.',
        en: 'Walked. And swam part of the way. But that’s all in the Chronicle now.'
      });
    });
  }
});

BNJ.registerHotspot('castle_yard', {
  id: 'brahe',
  poly: box(1330, 590, 1510, 945),
  hidden: (s) => !s.flags.finale_started,
  name: { cz: 'Tycho Brahe', en: 'Tycho Brahe' },
  walkTo: [1250, 960], faceDir: 1,
  lookAt: {
    cz: 'Mistr Brahe ve slavnostním. Nos vyleštěný na uvítanou — blýská se víc než hvězdy, které měří.',
    en: 'Master Brahe in his ceremonial best. Nose polished for the welcome — it outshines the stars he measures.'
  },
  use() {
    J({
      cz: 'Tahat hvězdáře za rukáv? Dnes ne. Dnes jsme si kvit.',
      en: 'Tug the astronomer’s sleeve? Not today. Today we are even.'
    });
  },
  talk() {
    B({
      cz: 'Ještě tady, chlapče? Běž se ohřát. Doručeno jest — a vesmír to bere na vědomí.',
      en: 'Still here, boy? Go varm yourself. Delivered it is — and ze universe takes note.'
    }, () => {
      J({
        cz: 'To je od vesmíru hezké. Od vás taky, mistře.',
        en: 'Very kind of the universe. And of you, master.'
      });
    });
  }
});

/* ==================================================================== */
/* ČÁST 3 — HOTSPOTY: observatory (w2200)                               */
/* kvadrant 950–1450/360–740 • police 1500–1780/400–700 • Mars          */
/* 1820–1965/420–650 • krb 1980–2190/520–900 • sextant 600–1000/560–    */
/* 1060 • glóbus (1420,880) • křivule 1600–1810/700–900 • hmoždíř       */
/* 300–460/760–900 • pult 1840–2080/760–1055 • svícen (1770,830–1000)   */
/* • Brahe (actor 1275,940)                                             */
/* ==================================================================== */

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_quadrant',
  poly: box(955, 360, 1450, 700),
  name: { cz: 'Zední kvadrant', en: 'Mural quadrant' },
  walkTo: [1120, 900], faceDir: 1,
  lookAt: {
    cz: 'Obří kvadrant. Mistr s ním měří výšky hvězd na osminu minuty. Já s ním neměřím nic — mám zákaz dýchat jeho směrem.',
    en: 'A giant quadrant. The master measures star altitudes to an eighth of a minute with it. I measure nothing — I’m forbidden to breathe in its direction.'
  },
  use() {
    B({
      cz: 'NEDOTÝKAT SE KVADRANTU!',
      en: 'DO NOT TOUCH ZE QUADRANT!'
    }, () => {
      J({
        cz: '…Ani jsem se nedotkl! Jen jsem na něj MYSLEL.',
        en: '…I didn’t even touch it! I merely THOUGHT about it.'
      });
    });
  },
  talk() {
    J({
      cz: 'Pěkný oblouk. Slušelo by ti jméno. Kvido? Kvido Kvadrant.',
      en: 'Nice arc. You deserve a name. Quentin? Quentin Quadrant.'
    });
  }
});

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_marsnotes',
  poly: box(1820, 420, 1965, 650),
  name: { cz: 'Pozorování Marsu', en: 'Mars observations' },
  walkTo: [1890, 900], faceDir: 1,
  lookAt(s) {
    BNJ.fact('fact_kepler_mars');
    J({
      cz: 'Sloupce čísel o Marsu. Léta měření, noc za nocí. Prý na ně čeká ten Kepler — jako pes na kost. Učená kost.',
      en: 'Columns of numbers on Mars. Years of measurements, night after night. They say this Kepler is waiting for them — like a dog for a bone. A learned bone.'
    });
  },
  use() {
    J({
      cz: 'Vzít je? Za ztracený list mi hrozil přeměřením oběžné dráhy. Za tohle by mě rovnou vypustil na ni.',
      en: 'Take them? For a lost letter he threatened to measure my orbit. For these he’d launch me straight onto one.'
    });
  },
  talk() {
    J({
      cz: 'Marse, Marse… kroužíš, nebo se touláš? …Neodpovídá. Taky čeká na Keplera.',
      en: 'Mars, oh Mars… do you circle, or do you wander? …No answer. He, too, is waiting for Kepler.'
    });
  }
});

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_shelf_vitriol',
  poly: box(1500, 400, 1780, 700),
  name: { cz: 'Police s lučebninami', en: 'Shelf of chemicals' },
  walkTo: [1640, 900], faceDir: 1,
  lookAt: {
    cz: 'Lahvičky, kelímky, nálepky latinsky. Ta zelená je skalice — z ní a z duběnek se dělá inkoust, co přežije staletí.',
    en: 'Phials, crucibles, labels in Latin. The green one is vitriol — with oak galls it makes an ink that outlives centuries.'
  },
  use(s) {
    if (!FL('knows_quest')) {
      B({ cz: 'NESAHAT! To je laboratoř, ne trh!', en: 'HANDS OFF! Zis is a laboratory, not a market!' }, () => {
        J({
          cz: 'Nejdřív si to s mistrem vyříkám. Pak budu sahat.',
          en: 'First I’ll have a word with the master. Then I’ll do the touching.'
        });
      });
      return;
    }
    if (has('skalice') || has('inkoust')) {
      J({
        cz: 'Skalici už mám. „Jedna lahvička, chlapče. JEDNA." Rozumím i napodruhé.',
        en: 'I have my vitriol. "One phial, boy. ONE." I understand even the second time.'
      });
      return;
    }
    BNJ.give('skalice');
    J({
      cz: 'Zelená skalice. Mistr dovolil — cituji: „Ber, ale jestli mi vypiješ vitriol, pohřeb si platíš sám."',
      en: 'Green vitriol. The master gave leave — quote: "Take it, but if you drink my vitriol, ze funeral is at your own expense."'
    });
  },
  talk() {
    J({
      cz: 'Která z vás je skalice?… Všechny mlčí. Správně. Lučebniny nemají žalovat.',
      en: 'Which of you is the vitriol?… All silent. Good. Chemicals shouldn’t tattle.'
    });
  }
});

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_alembic',
  poly: box(1600, 705, 1810, 900),
  name: { cz: 'Křivule', en: 'Alembic' },
  walkTo: [1700, 940], faceDir: 1,
  lookAt: {
    cz: 'Destilace běží dnem i nocí. Co se v ní vaří, nevím — ale observatoř i laboratoř mají celé druhé patro. Třináct místností!',
    en: 'The distillation runs day and night. What’s brewing in there I don’t know — but the observatory and laboratory fill the whole second floor. Thirteen rooms!'
  },
  use() {
    J({
      cz: 'Nechám ji bublat. Poslední, kdo do ní šťouchl, prý týden voněl po síře. A byl to biskup.',
      en: 'I’ll let it bubble. The last man who poked it reportedly smelled of sulphur for a week. And he was a bishop.'
    });
  },
  talk() {
    J({ cz: 'Co vaříš?', en: 'What are you brewing?' }, () => {
      J({
        cz: '„Bl-bl-blb," odpovídá křivule. Nebudu to brát osobně.',
        en: '"Blub-blub-blub," replies the alembic. I choose not to take that personally.'
      });
    });
  }
});

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_fireplace',
  poly: [[2085, 520], [2190, 520], [2190, 900], [2090, 900], [2090, 760], [2085, 760]],
  name: { cz: 'Krb', en: 'Fireplace' },
  walkTo: [2020, 1000], faceDir: 1,
  lookAt: {
    cz: 'Jediné místo v Čechách, kde je posel v teple. Jiskry létají ke komínu jako malé komety.',
    en: 'The only place in Bohemia where a courier is warm. Sparks fly up the chimney like little comets.'
  },
  use() {
    J({
      cz: 'Přiložit? Rád. Aspoň jednou dnes udělám něco, co nemůžu pokazit… Poleno. Kouř. Sláva.',
      en: 'Add a log? Gladly. For once today I’ll do something I cannot ruin… Log. Smoke. Triumph.'
    });
  },
  talk() {
    J({
      cz: 'Praskáš si, viď? Taky bych si praskal, kdybych byl jediný spokojený tvor v místnosti.',
      en: 'Crackling away, are you? I’d crackle too if I were the only content creature in the room.'
    });
  }
});

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_globe',
  poly: box(1150, 760, 1510, 915),
  name: { cz: 'Nebeský glóbus', en: 'Celestial globe' },
  walkTo: [1440, 950], faceDir: -1,
  lookAt: {
    cz: 'Mosazný glóbus s hvězdami místo zemí. Mistr do něj léta ryje oblohu — hvězdu za hvězdou, jak je přeměří.',
    en: 'A brass globe with stars instead of countries. The master has been engraving the sky into it for years — star by star, as he measures them.'
  },
  use() {
    J({
      cz: 'Roztočit! …Ne. Minule jsem roztočil list nad Jizerou a víme, jak to dopadlo.',
      en: 'Spin it! …No. Last time I spun something it was a letter over the Jizera, and we know how that ended.'
    });
  },
  talk() {
    J({
      cz: 'Kde jsou na tobě Benátky?… Aha. Nebeský glóbus. Benátky jsou pod ním. Jako vždycky pod něčím.',
      en: 'Where is Benátky on you?… Ah. A celestial globe. Benátky is underneath it. As usual, underneath something.'
    });
  }
});

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_mortar',
  poly: box(300, 755, 465, 905),
  name: { cz: 'Hmoždíř', en: 'Mortar' },
  walkTo: [380, 940], faceDir: -1,
  lookAt(s) {
    if (has('inkoust')) {
      J({
        cz: 'Dobře utřeno, hmoždíři. Z nás dvou je lepší písařský tovaryš ten kamenný.',
        en: 'Well ground, mortar. Of the two of us, the stone one makes the better scribe’s apprentice.'
      });
    } else {
      J({
        cz: 'Kamenný hmoždíř s paličkou. Duběnky, skalice, pár otoček — a je z toho inkoust, co píše císařské listiny.',
        en: 'A stone mortar and pestle. Oak galls, vitriol, a few turns — and you get the ink that writes imperial charters.'
      });
    }
  },
  use: [
    { item: 'dubenky', fn: (s) => mortarGrind(s) },
    { item: 'skalice', fn: (s) => mortarGrind(s) },
    { item: 'inkoust', fn: () => J({
      cz: 'Utřít utřené? Hmoždíř by se urazil.',
      en: 'Grind the ground? The mortar would take offence.'
    }) },
    { item: 'zrno', fn: () => J({
      cz: 'Mouku dnes nemelu. Dnes melu literaturu.',
      en: 'No flour-milling today. Today I mill literature.'
    }) }
  ],
  talk() {
    J({
      cz: 'Hmoždíři, hmoždíři, kdo je v kraji nejtvrdší?… Mlčí. Zná odpověď: Markyta.',
      en: 'Mortar, mortar, who is the hardest in the land?… Silence. It knows the answer: Markyta.'
    });
  }
});

/* H7 — výroba duběnkového inkoustu */
function mortarGrind(s) {
  if (!(has('dubenky') && has('skalice'))) {
    J({
      cz: 'Půlka receptu není recept. Duběnky A skalice — jinak utřu jen svoji trpělivost.',
      en: 'Half a recipe is no recipe. Galls AND vitriol — otherwise I’m just grinding my own patience.'
    });
    return;
  }
  BNJ.cutscene([
    { sfx: 'sfx_grind' },
    { say: ['jirka', {
      cz: 'Duběnky rozdrtit… skalici vsypat… a třít, třít, třít. Kdyby mě viděla máma — konečně dělám něco pořádného.',
      en: 'Crush the galls… pour in the vitriol… and grind, grind, grind. If mother could see me — finally doing honest work.'
    }] },
    { sfx: 'sfx_grind' },
    { wait: 0.4 },
    (st) => {
      BNJ.take('dubenky');
      BNJ.take('skalice');
      BNJ.give('inkoust');
      BNJ.fact('fact_gall_ink');
    },
    { say: ['jirka', {
      cz: 'Černé jako půlnoc nad jezem. Duběnkový inkoust — tenhle vydrží staletí. Snad i jednu cestu přes led.',
      en: 'Black as midnight over the weir. Iron-gall ink — this stuff lasts centuries. Perhaps even one trip across the ice.'
    }] },
    { say: ['brahe', {
      cz: 'Hm. Utřeno slušně. Kdybys tak nosil listy, jak třeš duběnky, jo!',
      en: 'Hm. Decently ground. If only you carried letters ze vay you grind galls, ja!'
    }] }
  ]);
}

/* --- H6: velký sextant — čtení fragmentů šikmým světlem --------------- */
function fragsIn() {
  return (FL('_frag_a_in') ? 1 : 0) + (FL('_frag_b_in') ? 1 : 0) + (FL('_frag_c_in') ? 1 : 0);
}
function placeFrag(s, itemId) {
  const key = '_' + itemId + '_in';
  BNJ.take(itemId);
  BNJ.flag(key, true);
  const n = fragsIn();
  if (n < 3) {
    const missing = 3 - n;
    J(missing === 2
      ? { cz: 'Fragment první na pultu sextantu. Ještě dva a je z toho zase list. Skoro.',
          en: 'Fragment one on the sextant table. Two more and it’s a letter again. Almost.' }
      : { cz: 'Druhý fragment. Skládám listinu jako Brahe oblohu — kus po kuse.',
          en: 'Fragment two. I assemble this charter like Brahe assembles the sky — piece by piece.' });
  } else {
    J({
      cz: 'Všechny tři! Roztrhané, vybledlé, ale MOJE. A teď to světelné kouzlo…',
      en: 'All three! Torn, faded, but MINE. And now for that trick of the light…'
    }, () => BNJ.dialog('_sextant_aim'));
  }
}

BNJ.registerHotspot('observatory', {
  id: 'hs_ob_sextant',
  poly: box(600, 560, 1000, 1040),
  name: { cz: 'Velký sextant', en: 'Great sextant' },
  walkTo: [1040, 960], faceDir: -1,
  lookAt(s) {
    BNJ.fact('fact_observatory_rooms');
    if (FL('letter_read')) {
      J({
        cz: 'Tady se stal zázrak: měsíční světlo, šikmý úhel — a rýhy po brku promluvily. Sextant, děkuji. Vesmíre, taky.',
        en: 'A miracle happened here: moonlight, a slanted angle — and the quill grooves spoke. Sextant, thank you. Universe, you too.'
      });
    } else if (fragsIn() > 0) {
      J({
        cz: 'Fragmenty leží na pultu sextantu. Mistrův nejpřesnější přístroj v Evropě teď slouží jako sušák na poštu.',
        en: 'The fragments lie on the sextant table. The most precise instrument in Europe now serves as a mail-drying rack.'
      });
    } else {
      J({
        cz: 'Velký sextant. Mistr jich má po zámku třináct místností — kvůli přístrojům se celé patro přestavovalo. Tenhle je jeho miláček.',
        en: 'The great sextant. The master keeps thirteen rooms of instruments — the whole floor was rebuilt for them. This one is his darling.'
      });
    }
  },
  use: [
    { item: 'frag_a', fn: (s) => placeFrag(s, 'frag_a') },
    { item: 'frag_b', fn: (s) => placeFrag(s, 'frag_b') },
    { item: 'frag_c', fn: (s) => placeFrag(s, 'frag_c') },
    { item: 'mokry_list', fn: () => J({
      cz: 'Můj cár s půlkou pečeti si nechám. Je to důkaz, že jsem list aspoň CHVÍLI nesl.',
      en: 'My scrap with half the seal stays with me. It proves I carried the letter for at least A WHILE.'
    }) },
    { item: 'podberak', fn: () => J({
      cz: 'Podběrák k sextantu? Konečně by tu byly DVA astronomické přístroje.',
      en: 'The skimmer next to the sextant? At last there would be TWO astronomical instruments in here.'
    }) }
  ],
  talk() {
    J({
      cz: 'Sextante, ty přesnosti zlatá… nauč to i mě. Já měřím vzdálenosti hlavně pádem.',
      en: 'Sextant, you golden marvel of precision… teach me. I mostly measure distances by falling across them.'
    });
  }
});

/* interní dialog H6 — minivolba zaměření (viz komentář v hlavičce:
   „_"-prefix = interní, mimo veřejný kánon, stejně jako _song_*) */
BNJ.registerDialog({
  id: '_sextant_aim',
  nodes: {
    start: {
      speaker: 'brahe',
      text: {
        cz: 'Tři cáry, jo. Vidíš ty rýhy? Brk TLAČÍ, pergamen si PAMATUJE. Inkoust vzala voda, rýhy zůstaly. Teď to chce šikmé světlo — zamiř, chlapče!',
        en: 'Three scraps, ja. See ze grooves? Ze quill PRESSES, ze parchment REMEMBERS. Ze water took ze ink, ze grooves remain. Now — slanted light. Take aim, boy!'
      },
      next: 'aim'
    },
    aim: {
      choices: [
        {
          text: { cz: 'Zaměřím na Polárku a zrcátko obrátím vzhůru.', en: 'I’ll aim at Polaris and turn the mirror upward.' },
          next: 'w1'
        },
        {
          text: { cz: 'Zaměřím na svíčku na stole. Je nejblíž.', en: 'I’ll aim at the table candle. It’s the closest.' },
          next: 'w2'
        },
        {
          text: { cz: 'Měsíc nízko nad obzorem, zrcátkem šikmo na pult.', en: 'The Moon low above the horizon, mirror slanted onto the table.' },
          next: 'ok1'
        },
        {
          text: { cz: 'Prostě to celé roztočím.', en: 'I’ll simply give the whole thing a spin.' },
          once: true,
          next: 'w3'
        }
      ]
    },
    w1: {
      speaker: 'brahe',
      text: {
        cz: 'Polárka?! Ta stojí na místě jako ponocný, jo! Světlo shora rýhy ZALIJE, nic neuvidíš. Znovu!',
        en: 'Polaris?! It stands still like a night vatchman, ja! Light from above FLOODS ze grooves — you see nozing. Again!'
      },
      next: 'aim'
    },
    w2: {
      speaker: 'brahe',
      text: {
        cz: 'Svíčka mihotá jak tvoje alibi, chlapče. Na rýhy potřebuješ světlo klidné a NÍZKÉ. Mysli! Co teď visí nízko nad obzorem?',
        en: 'Ze candle flickers like your alibi, boy. For grooves you need light steady and LOW. Sink! Vat hangs low above ze horizon right now?'
      },
      next: 'aim'
    },
    w3: {
      speaker: 'brahe',
      text: {
        cz: 'NETOČIT! Ved Gud! To je sextant, ne kolotoč na výročním trhu!',
        en: 'NO SPINNING! Ved Gud! Zat is a sextant, not a fairground carousel!'
      },
      next: 'aim'
    },
    ok1: {
      speaker: 'brahe',
      text: {
        cz: '…Měsíc nízko. Zrcátko šikmo. Světlo se plazí po pergamenu jak kocour po střeše — a KAŽDÁ rýha vrhá stín! ČTI!',
        en: '…Ze Moon low. Ze mirror slanted. Ze light creeps across ze parchment like a tomcat on a roof — and EVERY groove casts a shadow! READ!'
      },
      next: 'ok2'
    },
    ok2: {
      speaker: 'jirka',
      effect() {
        BNJ.flag('letter_read');
        BNJ.fact('fact_gall_ink');
        BNJ.sfx('sfx_quill');
      },
      text: {
        cz: 'Písmena! Stříbrná písmena ze stínů! „…potvrzujeme summu na dostavbu hvězdárny… a povolujeme příjezd Johannese Keplera ze Štýrska…" Čtu to! ČTU TO!',
        en: 'Letters! Silver letters made of shadows! "…ve confirm the sum for the observatory’s completion… and permit the arrival of Johannes Kepler of Styria…" I can read it! I CAN READ IT!'
      },
      next: 'ok3'
    },
    ok3: {
      speaker: 'brahe',
      text: {
        cz: 'Peníze na dostavbu! Svolení pro Keplera! Přesně tak to císař psal — duběnkovým inkoustem, jak se na listinu sluší. Voda ho smyla, ale tlak brku NE.',
        en: 'Money for ze building! Permission for Kepler! Exactly as ze Emperor wrote it — in iron-gall ink, as befits a charter. Ze water washed it out, but ze quill’s pressure — NEVER.'
      },
      next: 'ok4'
    },
    ok4: {
      speaker: 'jirka',
      text: {
        cz: 'Jenže chybí utržený roh — úvodní formule. „Z Boží milosti My…" a dál si pamatuju jen šplouchnutí.',
        en: 'But the torn corner is missing — the opening formula. "By the grace of God, We…" and after that I remember only a splash.'
      },
      next: 'ok5'
    },
    ok5: {
      speaker: 'brahe',
      text: {
        cz: 'Formuli slýchá při slavnostech kdekdo. Třeba ten šumař za řekou, co věčně vrže. A k přepisu chceš inkoust, brk, pergamen — a MOJI pečeť. Tu si ZASLOUŽÍŠ, jo?',
        en: 'Everyone hears ze formula at feasts. Zat fiddler across ze river, for instance — ze one who never stops scraping. And for ze copy you need ink, quill, parchment — and MY seal. Vitch you must EARN, ja?'
      },
      next: null
    }
  }
});

/* --- H10a: psací pult — přepis ---------------------------------------- */
BNJ.registerHotspot('observatory', {
  id: 'hs_ob_desk',
  poly: box(1840, 760, 2080, 1050),
  name: { cz: 'Psací pult', en: 'Writing desk' },
  walkTo: [1930, 1010], faceDir: 1,
  lookAt(s) {
    if (FL('prepis_done')) {
      J({
        cz: 'Tady vznikl přepis. Pult si mě bude pamatovat — málokdo se u něj tolik potil v lednu.',
        en: 'This is where the fair copy was born. The desk will remember me — few men have sweated over it in January.'
      });
    } else {
      J({
        cz: 'Šikmý psací pult. K přepisu potřebuju: přečtený text, formuli z písně, inkoust, brk a pergamen. Maličkost. Pro písaře. Kterým nejsem.',
        en: 'A slanted writing desk. For the copy I need: the deciphered text, the formula from the song, ink, quill and parchment. Trifles. For a scribe. Which I am not.'
      });
    }
  },
  use: [
    { item: 'pergamen', fn: (s) => deskWrite(s) },
    { item: 'brk', fn: () => J({
      cz: 'Psát brkem nasucho? To umím — tak jsem se učil písmena. Na výsledek se ale nikdo nesmí dívat.',
      en: 'Write with a dry quill? I know that art — it’s how I learned my letters. Nobody may look at the results, though.'
    }) },
    { item: 'inkoust', fn: () => J({
      cz: 'Inkoust na pult, dobře. A na co ho položím? Pergamen, Jiříku, pergamen.',
      en: 'Ink on the desk, fine. And what shall I put it ON? Parchment, Jiřík, parchment.'
    }) },
    { item: 'prepis', fn: () => J({
      cz: 'Přepis je hotový. Teď vosk a pečetidlo — u svícnu.',
      en: 'The copy is done. Now wax and signet — over at the candlestick.'
    }) },
    { item: 'mokry_list', fn: () => J({
      cz: 'Položit vedle sebe: originál a pult. Chybí jen těch dvě stě slov mezi nimi.',
      en: 'Side by side: the original and the desk. All that’s missing is the two hundred words in between.'
    }) }
  ],
  talk() {
    J({
      cz: 'Pulte, buď ke mně vlídný. Poslední psací plocha, co jsem potkal, byla ledová kra.',
      en: 'Desk, be gentle with me. The last writing surface I met was an ice floe.'
    });
  }
});

function deskWrite(s) {
  const miss = [];
  if (!FL('letter_read')) miss.push({ cz: 'text listu — fragmenty musí přečíst sextant', en: 'the letter’s text — the sextant must read the fragments' });
  if (!FL('formule_known')) miss.push({ cz: 'úvodní formule — tu prý zpívá šumař Benda', en: 'the opening formula — the fiddler Benda sings it, they say' });
  if (!has('inkoust')) miss.push({ cz: 'inkoust — duběnky a skalice do hmoždíře', en: 'ink — oak galls and vitriol into the mortar' });
  if (!has('brk')) miss.push({ cz: 'brk — a jediná husa široko daleko je Markyta', en: 'a quill — and the only goose for miles is Markyta' });
  if (miss.length) {
    J({
      cz: 'Pergamen je připraven. Já ne. Ještě mi chybí:',
      en: 'The parchment is ready. I am not. Still missing:'
    });
    miss.forEach(m => J({ cz: '— ' + m.cz + '.', en: '— ' + m.en + '.' }));
    return;
  }
  BNJ.cutscene([
    { say: ['jirka', {
      cz: 'Tak. Rukávy nahoru, jazyk mezi zuby. „Z Boží milosti My, Rudolf Druhý, volený císař římský, uherský a český král…"',
      en: 'Right. Sleeves up, tongue between teeth. "By the grace of God, We, Rudolph the Second, elected Emperor of the Romans, King of Hungary and Bohemia…"'
    }] },
    { sfx: 'sfx_quill' },
    { wait: 0.5 },
    { say: ['jirka', {
      cz: '„…potvrzujeme summu na dostavbu hvězdárny benátecké… a povolujeme příjezd Johannese Keplera…" Řádek za řádkem, jak je sextant vysvítil.',
      en: '"…ve confirm the sum for the completion of the Benátky observatory… and permit the arrival of Johannes Kepler…" Line by line, as the sextant lit them.'
    }] },
    { sfx: 'sfx_quill' },
    { wait: 0.4 },
    (st) => {
      BNJ.take('pergamen');
      BNJ.give('prepis');
      BNJ.flag('prepis_done');
    },
    { say: ['jirka', {
      cz: 'Hotovo! Ani kaňka! Tedy… ta jedna je ozdobná iniciála. Rozhodl jsem.',
      en: 'Done! Not a single blot! Well… that one is an ornamental initial. I have so decreed.'
    }] },
    { say: ['brahe', {
      cz: 'Ukaž… hm. Řádky rovné jak poledník. Teď vosk a pečeť, chlapče — bez pečeti je to jen hezký dopis nikomu.',
      en: 'Show me… hm. Lines straight as a meridian. Now vax and seal, boy — vithout a seal it is just a pretty letter to nobody.'
    }] }
  ]);
}

/* --- H10b: svícen — pečetění ------------------------------------------ */
BNJ.registerHotspot('observatory', {
  id: 'hs_ob_candle',
  poly: box(1728, 820, 1815, 1005),
  name: { cz: 'Svícen', en: 'Candlestick' },
  walkTo: [1770, 1010], faceDir: -1,
  lookAt: {
    cz: 'Vysoký svícen s klidným plamenem. Ideální na pečetění — a na koukání, když člověk předstírá, že přemýšlí.',
    en: 'A tall candlestick with a steady flame. Ideal for sealing — and for staring at while pretending to think.'
  },
  use: [
    { item: 'prepis', fn: (s) => sealLetter(s) },
    { item: 'svicka', fn: () => J({
      cz: 'Zapálit svíčku od svíčky? To je jak posílat posla pro posla.',
      en: 'Light a candle from a candle? That’s like sending a courier to fetch a courier.'
    }) },
    { item: 'pecetidlo', fn: () => J({
      cz: 'Pečetidlo mám, vosk tu je. Chybí to hlavní: hotový přepis. Vosk na prázdno neteče.',
      en: 'I have the signet, the wax is here. Missing the main thing: a finished copy. Wax does not flow onto nothing.'
    }) },
    { item: 'mokry_list', fn: () => J({
      cz: 'Zapečetit cár? To by bylo jak korunovat sněhuláka.',
      en: 'Seal a scrap? That would be like crowning a snowman.'
    }) }
  ],
  talk() {
    J({
      cz: 'Světýlko, nezhasínej. Jsi jediný svědek, který mě dnes viděl pracovat.',
      en: 'Little flame, don’t go out. You are the only witness who saw me work today.'
    });
  }
});

function sealLetter(s) {
  if (!has('pecetidlo')) {
    J({
      cz: 'Vosk kape, ale čím ho otisknout? Bez pečetidla je to jen horká louže.',
      en: 'The wax drips, but what shall I press into it? Without a signet it’s just a hot puddle.'
    });
    return;
  }
  BNJ.cutscene([
    { say: ['jirka', {
      cz: 'List složit… vosk nakapat… nespálit si prsty… nespálit si PRSTY…',
      en: 'Fold the letter… drip the wax… don’t burn my fingers… don’t burn my FINGERS…'
    }] },
    { sfx: 'sfx_seal' },
    (st) => {
      BNJ.take('prepis');
      BNJ.give('zapeceteny_list');
      BNJ.flag('letter_sealed');
    },
    { say: ['jirka', {
      cz: 'Pečeť sedí! Hvězda a půlměsíc, ostré jak mistrův jazyk. List od Rudolfa II. — podruhé na světě.',
      en: 'The seal sits true! Star and crescent, sharp as the master’s tongue. The letter of Rudolf II — born for the second time.'
    }] },
    { sfx: 'sfx_bell' },
    { wait: 0.6 },
    { say: ['jirka', {
      cz: 'Zvon?! Čtvrtého února… Dneska je ČTVRTÉHO ÚNORA! Honem, list mistrovi, než mi ho zase něco sebere!',
      en: 'The bell?! The fourth of February… Today IS the fourth of February! Quick — the letter to the master, before something takes it from me again!'
    }] }
  ]);
}

/* --- Brahe v observatoři + finále ------------------------------------- */
BNJ.registerHotspot('observatory', {
  id: 'brahe',
  poly: box(1185, 610, 1365, 955),
  name: { cz: 'Tycho Brahe', en: 'Tycho Brahe' },
  walkTo: [1150, 955], faceDir: 1,
  lookAt: {
    cz: 'Tycho Brahe. Řád slona na krku, oheň v očích a mosazný nos, který se blýská ve svitu svící. O nosu se nemluví. Proto o něm mluví pořád.',
    en: 'Tycho Brahe. The Order of the Elephant at his neck, fire in his eyes, and a brass nose gleaming in the candlelight. One does not mention the nose. Which is why he mentions it constantly.'
  },
  use: [
    { item: 'zapeceteny_list', fn: (s) => finaleStart(s) },
    { item: 'prepis', fn: () => B({
      cz: 'Bez pečeti?! Chlapče, list bez pečeti je jako hvězdář bez nosu — NIKDO ho nebere vážně!',
      en: 'Vithout a seal?! Boy, a letter vithout a seal is like an astronomer vithout a nose — NOBODY takes him seriously!'
    }) },
    { item: 'mokry_list', fn: () => B({
      cz: 'To NENÍ list. To je omluvenka od řeky.',
      en: 'Zat is NOT a letter. Zat is a note of apology from ze river.'
    }) },
    { item: 'podberak', fn: () => B({
      cz: '…Cedník na bidle. Víš ty co? Kdyby fungoval, dám ho patentovat jako JEDENÁCTÝ přístroj benátecký.',
      en: '…A strainer on a pole. You know vat? If it vorks, I shall patent it as ze ELEVENTH instrument of Benátky.'
    }) },
    { item: 'frag_a', fn: () => B({
      cz: 'Nemávej mi tím před nosem — polož to na pult SEXTANTU, jo?!',
      en: 'Do not vave it under my nose — put it on ze SEXTANT table, ja?!'
    }) }
  ],
  talk: 'brahe_intro'
});

function finaleStart(s) {
  if (FL('finale_started')) return;
  BNJ.cutscene([
    (st) => { BNJ.take('zapeceteny_list'); },
    { say: ['brahe', {
      cz: 'Ukaž… Pečeť má. Formuli má. Summa sedí, Kepler povolen… Hm. HM. Chlapče — tohle by vzal i císařský archivář. A to je protivnější než já.',
      en: 'Show me… Seal — good. Formula — good. Ze sum is right, Kepler permitted… Hm. HM. Boy — even ze imperial archivist vould accept zis. And he is more insufferable zan I am.'
    }] },
    { say: ['jirka', {
      cz: 'Doručeno, mistře. Jen o tři týdny, jednu řeku a jednu husu později.',
      en: 'Delivered, master. Merely three weeks, one river and one goose late.'
    }] },
    { sfx: 'sfx_sleigh' },
    { say: ['brahe', {
      cz: 'Ticho!… Slyšíš? ROLNIČKY! Saně od Prahy! To je ON! Na nádvoří, chlapče — POKLUSEM!',
      en: 'Qviet!… You hear? SLEIGH BELLS! A sleigh from Prague! It is HIM! To ze courtyard, boy — AT ZE DOUBLE!'
    }] },
    (st) => {
      /* postavy finále na nádvoří (setScene si je přečte z def.actors) */
      const cy = BNJ._registry && BNJ._registry.scenes && BNJ._registry.scenes.castle_yard;
      if (cy) {
        cy.actors = [
          { id: 'brahe', x: 1430, y: 935, dir: -1 },
          { id: 'kepler', x: 1150, y: 940, dir: 1 }
        ];
      }
    },
    { music: 'finale_theme' },
    { goto: ['castle_yard', [840, 960]] },
    { sfx: 'sfx_sleigh' },
    { wait: 0.7 }
  ], () => {
    BNJ.dialog('kepler_arrival'); /* → jumpTo('epilog') uvnitř 40_dialogues */
  });
}

/* ==================================================================== */
/* ČÁST 4 — HOTSPOTY: river_bank (w2800)                                */
/* vír (900,770) • pramice 1350–1850/940–1060 • ohniště (2280,900) •    */
/* rákosí+hnízdo (2080,870) • husa (2185,905)/(2320,975) • Vávra        */
/* (actor 2172,952) • cesta po ledu vpravo (exit [2720,900])            */
/* ==================================================================== */

BNJ.registerHotspot('river_bank', {
  id: 'hs_rb_weir',
  poly: box(690, 660, 1120, 850),
  name: { cz: 'Jez s vírem', en: 'Weir with an eddy' },
  walkTo: [905, 880], faceDir: -1,
  lookAt(s) {
    if (has('frag_a') || FL('_frag_a_in') || FL('letter_read')) {
      J({
        cz: 'Vír pod jezem. Už v něm netančí nic mého. Točiž se dál, zloději.',
        en: 'The eddy below the weir. Nothing of mine dances in it any more. Spin on, you thief.'
      });
    } else {
      J({
        cz: 'A tamhle je! Můj fragment — točí se ve víru dokolečka jako opilý mnich. Rukou tam nedosáhnu, leda hlavou napřed.',
        en: 'And there it is! My fragment — spinning round the eddy like a drunken monk. I can’t reach it by hand. Head-first, perhaps.'
      });
    }
  },
  use: [
    { item: 'podberak', fn: (s) => weirFish(s) },
    { item: 'cednik', fn: () => J({
      cz: 'Cedník bez násady? To bych tam spadl i já. A já už tam dneska jednou byl.',
      en: 'The strainer without a handle? I’d fall in after it. And I’ve already been in there once today.'
    }) },
    { item: 'bidlo', fn: () => J({
      cz: 'Bidlem ho jen roztočím rychleji. Potřebuju něco, co vodu PUSTÍ a list NE… něco děravého…',
      en: 'The pole would only spin it faster. I need something that lets the water THROUGH but not the letter… something with holes…'
    }) },
    { item: 'mokry_list', fn: () => J({
      cz: 'Vrátit řece i zbytek? Jizero, nejsme si TAK blízcí.',
      en: 'Give the river the rest as well? Jizera, we are not THAT close.'
    }) },
    { item: 'zrno', fn: () => J({
      cz: 'Krmit vír? Ten polyká i bez přílohy.',
      en: 'Feed the eddy? It swallows plenty without a side dish.'
    }) }
  ],
  talk() {
    J({ cz: 'Jizero! Vrať mi list!', en: 'Jizera! Return my letter!' }, () => {
      J({
        cz: '„Šššš," dělá jez. Vávra by řekl: dneska nemá náladu.',
        en: '"Shhhh," says the weir. Vávra would say: she’s in a mood today.'
      });
    });
  }
});

/* H3 — lovení fragmentu podběrákem */
function weirFish(s) {
  if (has('frag_a') || FL('_frag_a_in') || FL('letter_read')) {
    J({
      cz: 'Vír už nic nenese. Jen pěnu a moje vzpomínky na koupel.',
      en: 'The eddy carries nothing now. Just foam and my memories of the bath.'
    });
    return;
  }
  BNJ.cutscene([
    { say: ['jirka', {
      cz: 'Astronomický podběrák — první nasazení! Klid, ruko. Měř dvakrát, lov jednou.',
      en: 'The astronomical skimmer — maiden deployment! Steady, hand. Measure twice, fish once.'
    }] },
    { sfx: 'sfx_splash' },
    { wait: 0.5 },
    { say: ['jirka', {
      cz: '…a MÁM ho! Cedník vodu pustil, list nechal! Bětko, ty díry OPRAVDU byly schválně!',
      en: '…and I HAVE it! The strainer let the water through and kept the letter! Bětka, those holes really WERE intentional!'
    }] },
    (st) => { BNJ.give('frag_a'); },
    { say: ['jirka', {
      cz: 'Fragment první. Promočený, ale čitelný pro toho, kdo umí číst rýhy. Tedy zatím pro nikoho.',
      en: 'Fragment the first. Soaked, but legible to anyone who can read grooves. Which, so far, is no one.'
    }] }
  ]);
}

BNJ.registerHotspot('river_bank', {
  id: 'hs_rb_boat',
  poly: box(1350, 930, 1850, 1050),
  name: { cz: 'Pramice', en: 'Ferry punt' },
  walkTo: [1600, 1000], faceDir: 1,
  lookAt: {
    cz: 'Vávrova pramice, dnem vzhůru. „Spí do jara," říká. Chrápe sněhem.',
    en: 'Vávra’s punt, keel up. "She sleeps till spring," he says. She snores snow.'
  },
  use() {
    J({
      cz: 'Obrátit ji a vyplout? V lednu? To by byla moje druhá nejhorší plavba. Hned po té dnešní.',
      en: 'Flip her over and set sail? In January? That would be my second-worst voyage. Right after today’s.'
    });
  },
  talk() {
    J({
      cz: 'Spi, lodičko, spi… Vávra tě zamkl na zimu a klíčem je duben.',
      en: 'Sleep, little boat, sleep… Vávra locked you up for winter, and the key is April.'
    });
  }
});

BNJ.registerHotspot('river_bank', {
  id: 'hs_rb_reeds',
  poly: box(1895, 755, 2008, 950),
  name: { cz: 'Rákosí', en: 'Reeds' },
  walkTo: [1950, 975], faceDir: 1,
  lookAt: {
    cz: 'Zmrzlé rákosí chrastí jako kostlivec s husí kůží. Vhodné bydliště pro Markytu.',
    en: 'Frozen reeds rattling like a skeleton with goose bumps. A fitting residence for Markyta.'
  },
  use() {
    J({
      cz: 'Prohrabat rákosí? Už takhle mám v botách půl Jizery. Nechci i její nábytek.',
      en: 'Rummage through the reeds? Half the Jizera is in my boots already. I don’t need her furniture too.'
    });
  },
  talk() {
    J({
      cz: 'Šumíte krásně. Benda by vás vzal do kapely.',
      en: 'You rustle beautifully. Benda would sign you up for the band.'
    });
  }
});

BNJ.registerHotspot('river_bank', {
  id: 'hs_rb_nest',
  poly: box(2010, 800, 2126, 935),
  // dokud Markyta sedí na hnízdě, kliky v této oblasti patří jí
  // (hs_rb_goose má stavový poly a je v pořadí hover-detekce dřív)
  hidden: (s) => !s.flags.goose_lured,
  name: { cz: 'Hnízdo Markyty', en: 'Markyta’s nest' },
  walkTo: [2068, 960], faceDir: 1,
  lookAt(s) {
    if (FL('_nest_looted')) {
      J({
        cz: 'Hnízdo, už bez pošty. Markyta si tam nechala jen peří a zášť.',
        en: 'The nest, now mail-free. Markyta keeps only feathers and grudges in it.'
      });
    } else {
      J({
        cz: 'V hnízdě vykukuje roh pergamenu! Můj fragment — vpletený mezi větvičky jako věno. A vedle leží vypadlý brk.',
        en: 'A parchment corner peeks from the nest! My fragment — woven between the twigs like a dowry. And a dropped quill lies beside it.'
      });
    }
  },
  use(s) {
    if (FL('_nest_looted')) {
      J({
        cz: 'Hnízdo už vydalo všechno. Víc bych z něj dostal leda rýmu.',
        en: 'The nest has yielded all it will. Anything more I’d catch would be a cold.'
      });
      return;
    }
    if (!FL('goose_lured')) {
      BNJ.sfx('sfx_goose');
      J({
        cz: 'SSSSS! — Dobře, dobře, jdu! Husy jsou jen draci, co to vzdali. Ale zuby si nechaly!',
        en: 'HISSSS! — All right, all right, I’m going! Geese are just dragons that gave up. But they kept the teeth!'
      });
      return;
    }
    BNJ.cutscene([
      { say: ['jirka', {
        cz: 'Markyta zobe, hnízdo je moje. Tedy — to, co je v něm MOJE, je moje.',
        en: 'Markyta is pecking away, the nest is mine. That is — what’s MINE in it is mine.'
      }] },
      (st) => {
        BNJ.give('frag_b');
        BNJ.flag('_nest_looted');
      },
      { say: ['jirka', {
        cz: 'Fragment druhý! Vystlaný peřím — nejluxusnější uložení, jaké kdy císařská pošta měla.',
        en: 'Fragment the second! Bedded in down — the most luxurious storage imperial mail has ever known.'
      }] },
      (st) => { BNJ.give('brk'); },
      { say: ['jirka', {
        cz: 'A tenhle brk jí vypadl. Beru ho jako odškodné. Markyto, sepíšeme to — TVÝM peřím.',
        en: 'And she dropped this quill. I claim it as damages. Markyta, we’ll put it in writing — with YOUR feather.'
      }] },
      { sfx: 'sfx_goose' }
    ]);
  },
  talk() {
    J({
      cz: 'Hnízdo mlčí. Jen z něj čouhá pomsta a proutí.',
      en: 'The nest says nothing. Only vengeance and wicker stick out of it.'
    });
  }
});

BNJ.registerHotspot('river_bank', {
  id: 'hs_rb_fire',
  poly: box(2265, 815, 2360, 922),
  name: { cz: 'Vávrovo ohniště', en: 'Vávra’s campfire' },
  walkTo: [2300, 955], faceDir: 1,
  lookAt: {
    cz: 'Ohniště u přívozu. Vávra u něj sedí od listopadu do března a řece dělá dozor.',
    en: 'The campfire by the ferry. Vávra sits at it from November to March, keeping an eye on the river.'
  },
  use() {
    J({
      cz: 'Ohřát ruce… ááách. Kdyby šlo u ohně sušit i čest posla, sedím tu do jara.',
      en: 'Warm my hands… aaah. If a courier’s honour could be dried by a fire, I’d sit here till spring.'
    });
  },
  talk() {
    J({
      cz: 'Praskej, ohníčku. Jsi jediné šplouchnutí, které mám dnes rád.',
      en: 'Crackle on, little fire. You’re the only splashing sound I like today.'
    });
  }
});

BNJ.registerHotspot('river_bank', {
  id: 'prevoznik',
  poly: box(2100, 620, 2245, 862),
  name: { cz: 'Převozník Vávra', en: 'Vávra the ferryman' },
  walkTo: [2050, 960], faceDir: 1,
  lookAt: {
    cz: 'Vávra. Ramena jako vrata od stodoly, vousy ojíněné, fajfka věčná. Mluví málo. Jizera za něj domluví zbytek.',
    en: 'Vávra. Shoulders like barn doors, frost-rimed beard, eternal pipe. A man of few words. The Jizera says the rest for him.'
  },
  use: [
    { item: 'bidlo', fn: () => {
      BNJ.say('prevoznik', {
        cz: 'Vrátit? Až po jaru. Teď je tvoje. Bidlo si posla vybralo — to se u nás počítá.',
        en: 'Return it? After spring. It’s yours for now. The pole chose its courier — that counts for something here.'
      }, () => J({
        cz: 'Slyšels to, bidlo? Jsme si souzeni.',
        en: 'Hear that, pole? We are destined for each other.'
      }));
    } },
    { item: 'mokry_list', fn: () => {
      BNJ.say('prevoznik', {
        cz: 'Hm. Jizera ti nechala růžek. To u ní znamená, že tě má ráda.',
        en: 'Hm. The Jizera left you a corner. From her, that means she likes you.'
      });
    } },
    { item: 'podberak', fn: () => {
      BNJ.say('prevoznik', {
        cz: '…Cedník na mým bidle. Otec by plakal. Ale lovil bys s tím. Hm. Dobrý.',
        en: '…A strainer on my pole. Father would weep. But it would catch things. Hm. Good.'
      });
    } },
    { item: 'zrno', fn: () => {
      BNJ.say('prevoznik', {
        cz: 'Zrní dej Markytě. Mě krmí řeka. Teda krmila. V létě.',
        en: 'Give the grain to Markyta. The river feeds me. Fed me. In summer.'
      });
    } }
  ],
  talk: 'prevoznik_intro'
});

BNJ.registerHotspot('river_bank', {
  id: 'hs_rb_goose',
  // poly je funkce stavu: nenalákaná Markyta sedí NA HNÍZDĚ (~2080,884),
  // po goose_lured zobe na břehu vpravo (2320,975)
  poly: (s) => s.flags.goose_lured
    ? [[2140, 865], [2255, 865], [2255, 928], [2352, 928], [2352, 1012], [2140, 1012]]
    : [[2010, 795], [2150, 795], [2150, 935], [2010, 935]],
  name: { cz: 'Husa Markyta', en: 'Markyta the goose' },
  walkTo: [2110, 990], faceDir: 1,
  lookAt(s) {
    if (FL('goose_lured')) {
      J({
        cz: 'Markyta zobe na břehu a tváří se, že mě nevidí. Obě strany vědí, že je to příměří, ne mír.',
        en: 'Markyta pecks along the bank, pretending not to see me. Both sides know this is a truce, not peace.'
      });
    } else {
      J({
        cz: 'Markyta. Sedí na hnízdě jako celnice na mostě: nic neprojde bez cla. Vávra říká: Markyta bere, Markyta nedává.',
        en: 'Markyta. She sits on that nest like a toll-house on a bridge: nothing passes duty-free. Vávra says: Markyta takes, Markyta does not give.'
      });
    }
  },
  use: [
    { item: 'zrno', fn: (s) => {
      if (FL('goose_lured')) {
        J({
          cz: 'Další zrní nemám a Markyta už stejně povečeřela. I s příborem.',
          en: 'I have no more grain, and Markyta has already dined. Cutlery included.'
        });
        return;
      }
      BNJ.cutscene([
        { say: ['jirka', {
          cz: 'Markyto! Koukej — zrníčko! Zrní-zrní-zrníčko, celý pytlík úplatku!',
          en: 'Markyta! Look — grain! Grainy-grainy-grain, a whole bag of bribery!'
        }] },
        { sfx: 'sfx_goose' },
        (st) => {
          BNJ.take('zrno');
          BNJ.flag('goose_lured');
        },
        { wait: 0.4 },
        { say: ['jirka', {
          cz: 'Funguje to! Slézá z hnízda! Bětko, jsi génius a já jsem husí diplomat.',
          en: 'It works! She’s leaving the nest! Bětka, you are a genius, and I am a goose diplomat.'
        }] }
      ]);
    } },
    { item: 'brk', fn: () => {
      BNJ.sfx('sfx_goose');
      J({
        cz: 'Vrátit jí brk? SSSS! Dobře, dobře — NEvrátit. Byl to jen návrh!',
        en: 'Give the quill back? HISSS! Fine, fine — NOT giving it back. It was only a suggestion!'
      });
    } },
    { item: 'mokry_list', fn: () => J({
      cz: 'Neukazovat husám dokumenty. Jednou to zkusíš a deset let ti to připomínají.',
      en: 'Never show documents to geese. Try it once and they remind you of it for a decade.'
    }) },
    { item: 'podberak', fn: () => J({
      cz: 'Lovit Markytu podběrákem?! Chci brk, ne válku na dvou frontách.',
      en: 'Catch Markyta with the skimmer?! I want a quill, not a war on two fronts.'
    }) }
  ],
  talk(s) {
    BNJ.sfx('sfx_goose');
    J({ cz: 'Markyto… dohodneme se?', en: 'Markyta… can we come to terms?' }, () => {
      J({
        cz: '„SSSSS." Přeloženo z husího: „Vše, co plave, je moje." My dvě si rozumíme.',
        en: '"HISSSS." Translated from goose: "All that floats is mine." We understand each other perfectly.'
      });
    });
  }
});

/* cesta po ledu — do prevoznik_intro hlídá Vávra, pak se hotspot skryje
   a funguje běžný exit scény */
BNJ.registerHotspot('river_bank', {
  id: 'hs_rb_ice_path',
  poly: box(2560, 780, 2790, 1005),
  hidden: (s) => !!s.flags.met_prevoznik,
  name: { cz: 'Cesta po ledu', en: 'Path across the ice' },
  walkTo: [2600, 950], faceDir: 1,
  lookAt: {
    cz: 'Přes zamrzlou Jizeru se dá přejít do Starých Benátek. Teoreticky. Prakticky o tom rozhoduje Vávra a led — v tomhle pořadí.',
    en: 'One can cross the frozen Jizera to Old Benátky. In theory. In practice, Vávra and the ice decide — in that order.'
  },
  use(s) {
    BNJ.say('prevoznik', {
      cz: 'STÁT. Na led bez zkoušky nikdo. Dneska už ses koupal, posle. Přijď si promluvit.',
      en: 'HALT. Nobody on the ice untested. You’ve had your bath today, courier. Come and talk first.'
    }, () => {
      J({
        cz: 'Dobrá. Nejdřív diplomacie, pak led. Opačně už jsem to zkoušel.',
        en: 'Fair enough. Diplomacy first, then ice. I’ve tried it the other way round.'
      });
    });
  },
  talk() {
    J({ cz: 'Haló! Staré Benátky!', en: 'Hello! Old Benátky!' }, () => {
      J({
        cz: 'Přes řeku se vrací jen ozvěna a vrzání houslí. Tam někdo hraje!',
        en: 'Only an echo and the scrape of a fiddle come back across the river. Someone’s playing over there!'
      });
    });
  }
});

/* ==================================================================== */
/* ČÁST 5 — HOTSPOTY: square (Nové Benátky, w2600)                      */
/* koš (700,1010) • stánek 950–1330/780–1060 (Bětka actor 1120,940) •   */
/* kašna (1650,900) • kostel 1618–1682/640–830 • pranýř (2100,880)      */
/* ==================================================================== */

BNJ.registerHotspot('square', {
  id: 'hs_sq_castle_road',
  poly: box(60, 540, 330, 732),
  name: { cz: 'Cesta vzhůru k zámku', en: 'Road up to the castle' },
  walkTo: [220, 880], faceDir: -1,
  lookAt: {
    cz: 'Cesta na návrší k zámku. Brahe si Benátky vybral prý právě kvůli tomu kopci. Moje lýtka mu to nezapomenou.',
    en: 'The road up to the castle hill. They say Brahe chose Benátky precisely for that rise. My calves will never forgive him.'
  },
  use() {
    BNJ.goto('castle_yard', [260, 920]);
  },
  talk() {
    J({
      cz: 'Kopče, buď dnes milosrdný. Nesu důležité výmluvy.',
      en: 'Hill, be merciful today. I carry important excuses.'
    });
  }
});

BNJ.registerHotspot('square', {
  id: 'hs_sq_river_lane',
  poly: box(2380, 590, 2600, 772),
  name: { cz: 'Ulička k řece', en: 'Lane to the river' },
  walkTo: [2450, 900], faceDir: 1,
  lookAt: {
    cz: 'Ulička dolů k Jizeře. Cítím odsud jez. A jez cítí mě — máme spolu účty.',
    en: 'The lane down to the Jizera. I can smell the weir from here. And the weir smells me — we have unfinished business.'
  },
  use() {
    BNJ.goto('river_bank', [300, 940]);
  },
  talk() {
    J({
      cz: '„Kdo jde dolů k řece, ať si sváže boty," říkávala babička. A taky: „Nenos listy přes led." Moudrá žena.',
      en: '"Whoever goes down to the river should tie his boots," grandmother used to say. Also: "Never carry letters across ice." A wise woman.'
    });
  }
});

BNJ.registerHotspot('square', {
  id: 'hs_sq_fountain',
  poly: box(1545, 795, 1755, 965),
  name: { cz: 'Zamrzlá kašna', en: 'Frozen fountain' },
  walkTo: [1650, 990], faceDir: -1,
  lookAt: {
    cz: 'Kašna drží vodu. Konečně někdo.',
    en: 'The fountain is holding its water. At last, somebody around here does.'
  },
  use() {
    J({
      cz: 'Klouzat po kašně? Radnice by mě dala na pranýř. Je to hned vedle — úsporné.',
      en: 'Skate on the fountain? The town hall would put me in the pillory. Conveniently, it’s right next door.'
    });
  },
  talk() {
    J({
      cz: 'Kašno, až roztaješ, vyřiď Jizeře, že jí nic nedlužím. NIC.',
      en: 'Fountain, when you thaw, tell the Jizera I owe her nothing. NOTHING.'
    });
  }
});

BNJ.registerHotspot('square', {
  id: 'hs_sq_church_door',
  poly: box(1612, 630, 1688, 835),
  name: { cz: 'Dveře kostela', en: 'Church door' },
  walkTo: [1650, 880], faceDir: -1,
  lookAt: {
    cz: 'Kostel Nových Benátek. Založeno kolem 1340 s celým městečkem — biskup Jan z Dražic věděl, co dělá.',
    en: 'The church of New Benátky. Founded around 1340 with the whole town — Bishop Jan of Dražice knew what he was doing.'
  },
  use() {
    BNJ.sfx('sfx_door');
    J({
      cz: 'Zamčeno. Kostelník šel na oběd. V lednu trvá oběd do března.',
      en: 'Locked. The sexton has gone to lunch. In January, lunch lasts till March.'
    });
  },
  talk() {
    J({
      cz: 'Svatý Wolfgangu, patrone poslů… nebo aspoň patrone plavců… kdokoli má službu: díky za ten růžek s pečetí.',
      en: 'Saint Wolfgang, patron of couriers… or at least of swimmers… whoever is on duty: thank you for that corner with the seal.'
    });
  }
});

BNJ.registerHotspot('square', {
  id: 'hs_sq_pillory',
  poly: box(2040, 690, 2165, 945),
  name: { cz: 'Pranýř', en: 'Pillory' },
  walkTo: [2100, 975], faceDir: -1,
  lookAt: {
    cz: 'Pranýř. Pro zloděje, klevetníky a — čtu dobře? — „posly, již zásilku svou v řece utopili". To je NOVÝ nápis?!',
    en: 'The pillory. For thieves, gossips and — do I read this right? — "couriers who drowned their delivery in the river". Is that inscription NEW?!'
  },
  use() {
    J({
      cz: 'Vyzkoušet si ho předem? Ne. Nebudu pokoušet úřady. Ani osud. Ani Bětku, ta by to roznesla do večera.',
      en: 'Try it on for size? No. I won’t tempt the authorities. Or fate. Or Bětka — she’d have it all over town by dusk.'
    });
  },
  talk() {
    J({
      cz: 'Kdo tu stál naposled?… Pranýř mlčí. Diskrétní kus dřeva. To se cení.',
      en: 'Who stood here last?… The pillory says nothing. A discreet piece of timber. Commendable.'
    });
  }
});

BNJ.registerHotspot('square', {
  id: 'hs_sq_firebasket',
  poly: box(625, 895, 785, 1050),
  name: { cz: 'Koš s ohněm', en: 'Fire basket' },
  walkTo: [710, 985], faceDir: -1,
  lookAt: {
    cz: 'Železný koš, ve kterém město pálí polena a trhovci si u něj přihřívají ceny.',
    en: 'An iron basket where the town burns logs and the stallholders warm up their prices.'
  },
  use: [
    { item: 'svicka', fn: () => J({
      cz: 'Už hoří. Nebudu nosit oheň do ohně. To dělám jen s problémy.',
      en: 'It’s already burning. I won’t carry fire into fire. I only do that with my problems.'
    }) },
    { item: 'mokry_list', fn: () => J({
      cz: 'Usušit cár nad košem? Jedna jiskra a doručím popel. S pečetí.',
      en: 'Dry the scrap over the basket? One spark and I deliver ashes. With a seal.'
    }) },
    { item: 'zrno', fn: () => J({
      cz: 'Pražit zrní? Vonělo by krásně — a Markyta by mi to nikdy neodpustila.',
      en: 'Roast the grain? It would smell wonderful — and Markyta would never forgive me.'
    }) }
  ],
  talk() {
    J({
      cz: 'Hřej, koši, hřej. Město tě platí, já tě chválím. Dělba práce.',
      en: 'Glow, basket, glow. The town pays you, I praise you. Division of labour.'
    });
  }
});

BNJ.registerHotspot('square', {
  id: 'hs_sq_stall',
  poly: box(950, 780, 1330, 1055),
  name: { cz: 'Bětka a její stánek', en: 'Bětka and her stall' },
  walkTo: [1160, 1000], faceDir: -1,
  lookAt: {
    cz: 'Bětčin stánek: svíčky, cedníky, zrní, sušená jablka — a zpravodajství rychlejší než císařská pošta. Teda… než já.',
    en: 'Bětka’s stall: candles, strainers, grain, dried apples — and a news service faster than the imperial post. That is… faster than me.'
  },
  use() {
    J({
      cz: 'Posloužit si sám? Bětka má oči jako výr a účetnictví v hlavě. Radši to vezmu přes diplomacii. A drby.',
      en: 'Help myself? Bětka has the eyes of an owl and a ledger in her head. Better to go through diplomacy. And gossip.'
    });
  },
  talk: 'trhovkyne_intro'
});

/* ==================================================================== */
/* ČÁST 6 — HOTSPOTY: old_town (Staré Benátky, w2400)                   */
/* tkalcovna 950–1300/560–830 • zvonice 1380–1560/300–860 • Bendův      */
/* plácek 1750–1950/880–1000 (actor 1878,948) • krčma 2075–2145/660–850 */
/* ==================================================================== */

BNJ.registerHotspot('old_town', {
  id: 'hs_ot_ice_path',
  poly: box(40, 640, 262, 795),
  name: { cz: 'Cesta po ledu k jezu', en: 'Ice path to the weir' },
  walkTo: [180, 900], faceDir: -1,
  lookAt: {
    cz: 'Vávrova vyšlapaná stezka přes led, vyznačená větvičkami. „Šlapej, kam šlapu já," řekl. Životní filozofie.',
    en: 'Vávra’s trodden path across the ice, marked with twigs. "Step where I step," he said. A philosophy for life.'
  },
  use() {
    BNJ.goto('river_bank', [2600, 930]);
  },
  talk() {
    J({
      cz: 'Lede, dohodneme se: ty držíš, já nepočítám nahlas, kolik vážím.',
      en: 'Ice, let’s make a deal: you hold, and I won’t count my weight out loud.'
    });
  }
});

BNJ.registerHotspot('old_town', {
  id: 'hs_ot_marsh_path',
  poly: box(2268, 640, 2400, 795),
  name: { cz: 'Pěšina do Obodře', en: 'Path to Obodř' },
  walkTo: [2320, 900], faceDir: 1,
  lookAt: {
    cz: 'Pěšina podél řeky do obodřských mokřadů. Mlha, bažiny, bludičky. Tam plaval třetí kus. Samozřejmě že tam.',
    en: 'A riverside path to the Obodř marshes. Fog, bogs, will-o’-the-wisps. That’s where the third piece floated. Of course it did.'
  },
  use() {
    BNJ.goto('marsh', [300, 930]);
  },
  talk() {
    J({
      cz: 'Mokřady! Už jdu! …Nemusely jste odpovídat.',
      en: 'Marshes! I’m coming! …You didn’t have to answer.'
    });
  }
});

BNJ.registerHotspot('old_town', {
  id: 'hs_ot_loom_house',
  poly: box(950, 560, 1300, 830),
  name: { cz: 'Tkalcovna', en: 'Weaving house' },
  walkTo: [1120, 900], faceDir: -1,
  lookAt(s) {
    BNJ.fact('fact_benda_family');
    J({
      cz: 'Tkalcovna Bendů. Přes den tu klape stav, večer smyčec. Matěj tvrdí, že z rodu jednou vzejde víc muzikantů než Bachů. Ať je to kdokoli.',
      en: 'The Bendas’ weaving house. By day the loom clatters, by night the bow. Matěj swears his line will one day produce more musicians than the Bachs. Whoever they may be.'
    });
  },
  use() {
    J({
      cz: 'Tkát neumím. Zkusil jsem to jednou s vlastními tkaničkami a dodnes mi říkají Uzlík.',
      en: 'I can’t weave. I tried it once with my own bootlaces, and they still call me Knots.'
    });
  },
  talk() {
    J({
      cz: 'Klap, klap… stav pracuje i po setmění. Osnova živí muzikanta.',
      en: 'Clack, clack… the loom works after dark too. The warp feeds the musician.'
    });
  }
});

BNJ.registerHotspot('old_town', {
  id: 'hs_ot_belfry',
  poly: box(1380, 300, 1560, 860),
  name: { cz: 'Stará zvonice', en: 'Old belfry' },
  walkTo: [1470, 905], faceDir: -1,
  lookAt(s) {
    BNJ.fact('fact_first_mention_1259');
    J({
      cz: 'Stará zvonice Starých Benátek. Tady na levém břehu stála osada už roku 1259 — o století dřív, než přes řeku vyrostly Benátky Nové.',
      en: 'The old belfry of Old Benátky. A settlement stood here on the left bank as early as 1259 — a century before New Benátky rose across the river.'
    });
  },
  use() {
    BNJ.sfx('sfx_bell');
    J({ cz: '…Jen jsem se opřel o provaz! ČESTNĚ!', en: '…I merely leaned on the rope! HONESTLY!' }, () => {
      BNJ.say('benda', {
        cz: 'Hó! Ladíš se mnou, chlapče? Zvon má áčko! Trošku podchlazený!',
        en: 'Ho! Tuning up with me, lad? The bell gives an A! Slightly hypothermic!'
      });
    });
  },
  talk() {
    J({
      cz: 'Kolik svateb jsi odzvonila, stará dámo? A kolik povodní?… Ona ví. Zvonice vědí všechno.',
      en: 'How many weddings have you rung in, old lady? And how many floods?… She knows. Belfries know everything.'
    });
  }
});

BNJ.registerHotspot('old_town', {
  id: 'hs_ot_tavern_door',
  poly: box(2070, 655, 2150, 855),
  name: { cz: 'Dveře krčmy', en: 'Tavern door' },
  walkTo: [2110, 895], faceDir: 1,
  lookAt: {
    cz: 'Krčma „U Utopeného raka". Zevnitř zní smích a cinkání. Zvenku zním já a kručení břicha.',
    en: 'The tavern "At the Drowned Crayfish". From inside: laughter and clinking. From outside: me and my stomach growling.'
  },
  use() {
    BNJ.sfx('sfx_door');
    J({
      cz: 'Zavřeno pro poslíčky bez peněz. Tedy: zavřeno pro mě, osobně, jmenovitě.',
      en: 'Closed to penniless errand boys. That is: closed to me, personally, by name.'
    });
  },
  talk() {
    J({ cz: 'Je otevřeno?', en: 'Are you open?' }, () => {
      J({
        cz: '„OBSAZENO!" hulákají zevnitř. To není totéž. Ale je to odpověď.',
        en: '"FULL UP!" they bellow from inside. Not the same thing. But it is an answer.'
      });
    });
  }
});

BNJ.registerHotspot('old_town', {
  id: 'hs_ot_benda',
  poly: box(1770, 610, 1995, 1002),
  name: { cz: 'Šumař Matěj Benda', en: 'Matěj Benda the fiddler' },
  walkTo: [1790, 975], faceDir: 1,
  lookAt: {
    cz: 'Matěj Benda: beranice s pérem, ruměné tváře, skřipky a u pasu tkalcovský člunek. Přes den osnova, večer struny.',
    en: 'Matěj Benda: a feathered fur cap, ruddy cheeks, a fiddle, and a weaver’s shuttle at his belt. Warp by day, strings by night.'
  },
  use() {
    J({
      cz: 'Sáhnout šumaři na skřipky je jako sáhnout Brahovi na kvadrant. Přežiješ, ale nikdo ti už nezahraje.',
      en: 'Touching a fiddler’s fiddle is like touching Brahe’s quadrant. You survive, but no one ever plays for you again.'
    });
  },
  talk: 'benda_intro'
});

/* ==================================================================== */
/* ČÁST 7 — HOTSPOTY: marsh (Obodř, w2600)                              */
/* tůň 850–1600/950–1080 (fragment ~1230,1010) • dub 1650–2050 (kmen    */
/* ~1830) • bludičky (500,760) • volavka (2280,865) • hatě vlevo        */
/* ==================================================================== */

BNJ.registerHotspot('marsh', {
  id: 'hs_ma_causeway',
  poly: box(40, 690, 300, 828),
  name: { cz: 'Hatě do Starých Benátek', en: 'Causeway to Old Benátky' },
  walkTo: [240, 940], faceDir: -1,
  lookAt: {
    cz: 'Pěšina z hatí — klád položených přes bažinu. Jediná věc v Obodři, které se dá věřit. A i ta vrže.',
    en: 'A causeway of logs laid across the bog. The only thing in Obodř you can trust. And even it creaks.'
  },
  use() {
    BNJ.goto('old_town', [2280, 940]);
  },
  talk() {
    J({
      cz: 'Klády, děkuju za slu… žbluňk… za službu. Mokřady mi lezou i do slovníku.',
      en: 'Logs, thank you for your servi… splosh… service. The marshes are seeping into my vocabulary now.'
    });
  }
});

BNJ.registerHotspot('marsh', {
  id: 'hs_ma_reeds',
  // dolní hrana snížena z 1000 → 960: neblokovat pochozí pás (y ~960–1020)
  poly: box(560, 850, 840, 960),
  name: { cz: 'Rákosové ostrovy', en: 'Reed islands' },
  walkTo: [700, 1000], faceDir: -1,
  lookAt: {
    cz: 'Ostrůvky rákosu a ostřice trčí ze zamrzlých tůní. V létě tu prý bývá ráj volavek. V lednu je to ráj nikoho.',
    en: 'Islands of reed and sedge jut from the frozen pools. In summer, they say, it’s a heron’s paradise. In January it is nobody’s.'
  },
  use() {
    J({
      cz: 'Nelezu do rákosí. Co jednou zmizí v obodřském rákosí, to se vrací jen v pověstech.',
      en: 'I’m not going into those reeds. What vanishes into the Obodř reeds returns only in legends.'
    });
  },
  talk() {
    J({
      cz: 'Ševelíte hezky. Ale Bendův orchestr už má plno — ptal jsem se za vás.',
      en: 'Lovely rustling. But Benda’s orchestra is full — I asked on your behalf.'
    });
  }
});

BNJ.registerHotspot('marsh', {
  id: 'hs_ma_wisps',
  poly: box(420, 660, 600, 840),
  name: { cz: 'Bludičky', en: 'Will-o’-the-wisps' },
  walkTo: [470, 920], faceDir: -1,
  lookAt(s) {
    BNJ.fact('fact_name_venice');
    J({
      cz: 'Zelenkavá světýlka nad tůněmi! B-bludičky! Vávra říkal, že „Benátky" znamenají mokré místo u vody — tak tady bydlí ti, kdo to jméno vymysleli!',
      en: 'Greenish lights over the pools! W-wisps! Vávra said "Benátky" means a wet place by the water — well, HERE live the ones who coined the name!'
    }, () => {
      J({
        cz: 'Mistr Brahe by řekl „bahenní plyn, chlapče". Mistr Brahe tady ale NENÍ, že ne.',
        en: 'Master Brahe would say "marsh gas, boy". But Master Brahe is not HERE right now, is he.'
      });
    });
  },
  use() {
    J({
      cz: 'Chytat bludičky? A co bych s ní dělal?! Nosil ji domů v cedníku?! …Vlastně cedník mám. NE. Ne.',
      en: 'Catch a wisp? And do what with it?! Carry it home in a strainer?! …I do own a strainer. NO. No.'
    });
  },
  talk() {
    J({ cz: 'Nejsem k jídlu! Jsem posel! Úředně!', en: 'I am not edible! I am a courier! Officially!' }, () => {
      J({
        cz: 'Světýlka zablikala. Buď se smějí, nebo hlasují. Neptám se na výsledek.',
        en: 'The lights flickered. Either laughing or voting. I shall not ask for the tally.'
      });
    });
  }
});

BNJ.registerHotspot('marsh', {
  id: 'hs_ma_heron',
  poly: box(2200, 750, 2360, 905),
  name: { cz: 'Volavka', en: 'Heron' },
  walkTo: [2260, 960], faceDir: 1,
  lookAt: {
    cz: 'Volavka stojí na jedné noze v ledové vodě. Buď je to otužilost, nebo úspora. U ptáků nikdy nevíš.',
    en: 'A heron standing on one leg in icy water. Either hardiness or economy. With birds you never know.'
  },
  use() {
    J({
      cz: 'Hladit volavku nebudu. Ten zobák je delší než můj vztah s tím listem.',
      en: 'I will not pet the heron. That beak is longer than my relationship with the letter.'
    });
  },
  talk() {
    J({ cz: 'Neviděla jsi plavat kus pergamenu?', en: 'Have you seen a piece of parchment float by?' }, () => {
      J({
        cz: 'Ani nemrkla. Volavky nevypovídají. Profesionálka.',
        en: 'Not even a blink. Herons don’t testify. A professional.'
      });
    });
  }
});

BNJ.registerHotspot('marsh', {
  id: 'hs_ma_oak',
  poly: [[1660, 290], [2050, 290], [2050, 700], [1930, 700], [1930, 1030], [1700, 1030], [1700, 700], [1660, 700]],
  name: { cz: 'Starý dub', en: 'Old oak' },
  walkTo: [1800, 995], faceDir: 1,
  lookAt: {
    cz: 'Prastarý dub, pamatuje možná rok 1259. Větve plné duběnek — kuliček, ze kterých se s trochou skalice rodí inkoust.',
    en: 'An ancient oak — it may remember the year 1259. Branches full of oak galls: little balls that, with a dash of vitriol, become ink.'
  },
  use(s) {
    if (has('dubenky') || has('inkoust')) {
      J({
        cz: 'Duběnek mám plnou hrst. Víc by byla krádež na žlabatkách.',
        en: 'I have a full handful of galls. Any more would be robbing the gall wasps.'
      });
      return;
    }
    BNJ.give('dubenky');
    J({
      cz: 'Duběnky! Suché, tvrdé, dokonalé. Dube, píšeš dějiny — doslova.',
      en: 'Oak galls! Dry, hard, perfect. Oak, you write history — literally.'
    });
  },
  talk() {
    J({
      cz: 'Dube, ty tu stojíš, co Benátky Benátkami jsou. Viděls někdy takhle smolného posla?… Zašuměl. To znamená „ne".',
      en: 'Oak, you’ve stood here as long as Benátky has been Benátky. Ever seen a courier this unlucky?… A rustle. That means "no".'
    });
  }
});

BNJ.registerHotspot('marsh', {
  id: 'hs_ma_ice_pool',
  // pozor: nezvedat horní hranu nad ~985 — walkArea koridor je y 940–1030
  // a box(…,945,…) překrýval skoro celou pochozí zem → nešlo projít zpět
  poly: box(850, 985, 1600, 1078),
  name: { cz: 'Zamrzlá tůň', en: 'Frozen pool' },
  walkTo: [905, 1005], faceDir: 1,
  lookAt(s) {
    if (has('frag_c') || FL('_frag_c_in') || FL('letter_read')) {
      J({
        cz: 'V ledu zbyla po fragmentu jen vytávaná stopa. Tůň vypadá skoro zklamaně.',
        en: 'Only a melted outline of the fragment remains in the ice. The pool looks almost disappointed.'
      });
    } else {
      J({
        cz: 'Tamhle! Pod ledem prosvítá můj třetí fragment — přimrzlý jako moucha v jantaru. Vylamovat ho nebudu, roztrhl by se. Chce to teplo. Malé, poslušné teplo.',
        en: 'There! My third fragment glows under the ice — frozen in like a fly in amber. I won’t chip it out, it would tear. This calls for heat. Small, obedient heat.'
      });
    }
  },
  use: [
    { item: 'svicka', fn: (s) => poolMelt(s) },
    { item: 'bidlo', fn: () => J({
      cz: 'Prasklo by. Led, ne bidlo. Teda… obojí. A fragment by odplaval potřetí. Rekord nestojím.',
      en: 'It would crack. The ice, not the pole. Well… both. And the fragment would swim off for a third time. I don’t need the record.'
    }) },
    { item: 'podberak', fn: () => J({
      cz: 'Podběrák je na vodu tekutou. Tahle je v důchodu.',
      en: 'The skimmer is for liquid water. This water has retired.'
    }) },
    { item: 'cednik', fn: () => J({
      cz: 'Cedit led? I Bětka by uznala, že na tohle díry nestačí.',
      en: 'Strain ice? Even Bětka would admit the holes aren’t up to this.'
    }) }
  ],
  talk() {
    J({ cz: 'Vydrž, listečku! Jdu si pro tebe!', en: 'Hold on, little letter! I’m coming for you!' }, () => {
      J({
        cz: 'Neodpovídá. Je zmrzlý. Já vlastně taky, ale já z toho nedělám drama.',
        en: 'No answer. It’s frozen stiff. So am I, come to think of it, but I don’t make a scene about it.'
      });
    });
  }
});

/* H5 — vytavení fragmentu svíčkou (svíčka se NEspotřebuje) */
function poolMelt(s) {
  if (has('frag_c') || FL('_frag_c_in') || FL('letter_read')) {
    J({
      cz: 'Už je venku. Tůň dostane místo něj vzpomínku.',
      en: 'It’s already out. The pool gets a memory in exchange.'
    });
    return;
  }
  BNJ.cutscene([
    { say: ['jirka', {
      cz: 'Svíčku nad led… kroužit… pomalu… Neroztávej mi celou tůň, jen ten kroužek.',
      en: 'Candle over the ice… circle… slowly… Don’t thaw me the whole pool, just the little ring.'
    }] },
    { sfx: 'sfx_ice_crack' },
    { wait: 0.5 },
    (st) => { BNJ.give('frag_c'); },
    { say: ['jirka', {
      cz: 'Fragment třetí! Studený jako soudce, ale CELÝ! A svíčka? Sotva si loklá. Šetrné kouzlo.',
      en: 'Fragment the third! Cold as a judge, but WHOLE! And the candle? Barely a sip gone. Economical magic.'
    }] },
    { say: ['jirka', {
      cz: 'Mám všechny tři kusy! Teď na zámek — mistr říkal něco o šikmém světle a sextantu.',
      en: 'I have all three pieces! Now to the castle — the master said something about slanted light and the sextant.'
    }] }
  ]);
}

/* ==================================================================== */
/* ČÁST 8 — KOMBINACE V INVENTÁŘI                                       */
/* ==================================================================== */

/* H3a — cedník + bidlo = astronomický podběrák */
BNJ.combine('cednik', 'bidlo', (s) => {
  BNJ.take('cednik');
  BNJ.take('bidlo');
  BNJ.give('podberak');
  J({
    cz: 'Cedník na bidlo, tři uzly, hotovo. Brahe má sextant, já mám tohle. Oba tomu říkáme věda.',
    en: 'Strainer onto pole, three knots, done. Brahe has his sextant, I have this. We both call it science.'
  }, () => {
    J({
      cz: 'Křtím tě: ASTRONOMICKÝ PODBĚRÁK. Protože míříš vysoko a skončíš ve vodě.',
      en: 'I hereby christen you: the ASTRONOMICAL SKIMMER. Because you aim high and end up in the water.'
    });
  });
});

/* H7 nápověda — duběnky + skalice → potřebují hmoždíř */
BNJ.combine('dubenky', 'skalice', () => {
  J({
    cz: 'Duběnky a skalice — recept na inkoust! Jenže rozemnout to v dlani nesvedu. Chce to hmoždíř. Kámen, ne prsty.',
    en: 'Oak galls and vitriol — the ink recipe! But I can’t crush them in my palm. This needs a mortar. Stone, not fingers.'
  });
});

/* --- bonusové vtipné kombinace ---------------------------------------- */
BNJ.combine('brk', 'inkoust', () => {
  J({
    cz: 'Brk a inkoust. Chybí pergamen, formule a odvaha. Odvahu nosím, jen nevím kde.',
    en: 'Quill and ink. Missing: parchment, the formula, and courage. I do carry courage — I just forget where.'
  });
});
BNJ.combine('mokry_list', 'svicka', () => {
  J({
    cz: 'Sušit cár nad plamenem? Přišel bych i o tu půlku pečeti. Ne. Mokrý důkaz je pořád důkaz.',
    en: 'Dry the scrap over a flame? I’d lose the half-seal too. No. Soggy evidence is still evidence.'
  });
});
BNJ.combine('cednik', 'zrno', () => {
  J({
    cz: 'Prosívat zrní cedníkem? Jsem posel, ne mlynář. A ty díry jsou na LISTY, řekla Bětka.',
    en: 'Sift grain through the strainer? I’m a courier, not a miller. And those holes are for LETTERS, Bětka said.'
  });
});
BNJ.combine('pecetidlo', 'svicka', () => {
  J({
    cz: 'Pečetidlo a svíčka se k sobě mají. Ale bez přepisu bych pečetil jen vzduch. Úředně ověřený vzduch.',
    en: 'Signet and candle do belong together. But without the fair copy I’d be sealing thin air. Officially certified air.'
  });
});
BNJ.combine('podberak', 'zrno', () => {
  J({
    cz: 'Podběrák plný zrní — past na husu? Markyta by ji prokoukla, snědla návnadu a odnesla si i podběrák.',
    en: 'A skimmer full of grain — a goose trap? Markyta would see through it, eat the bait, and carry off the skimmer as well.'
  });
});
BNJ.combine('brk', 'pergamen', () => {
  J({
    cz: 'Brk a pergamen, staří známí. Ještě inkoust a slova — detaily, které dělají dopis dopisem.',
    en: 'Quill and parchment, old friends. Now just ink and words — the details that make a letter a letter.'
  });
});

/* ===== KONEC 50_puzzles ===== */
})();
