/* =========================================================================
   ZTRACENÝ LIST — 90_boot.js
   Start hry: kontrola registrací dle kánonu IDS.md (jen hlášení do konzole,
   nikdy pád), fade-in, spuštění enginu. Engine degraduje elegantně.
   ========================================================================= */
(function () {
'use strict';

/* Kánon ID dle design/IDS.md — slouží POUZE ke kontrolnímu výpisu. */
const EXPECTED = {
  scenes: ['title', 'castle_yard', 'observatory', 'river_bank', 'square', 'old_town', 'marsh'],
  characters: ['jirka', 'brahe', 'kepler', 'benda', 'prevoznik', 'trhovkyne'],
  items: ['mokry_list', 'frag_a', 'frag_b', 'frag_c', 'cednik', 'bidlo', 'podberak',
    'zrno', 'svicka', 'dubenky', 'skalice', 'inkoust', 'brk', 'pergamen',
    'pecetidlo', 'prepis', 'zapeceteny_list'],
  dialogs: ['dlg_intro', 'brahe_intro', 'brahe_test', 'prevoznik_intro', 'trhovkyne_intro',
    'trhovkyne_trade', 'benda_intro', 'benda_song', 'kepler_arrival', 'epilog'],
  tracks: ['title_theme', 'castle_theme', 'observatory_theme', 'river_theme',
    'square_theme', 'oldtown_theme', 'marsh_theme', 'finale_theme'],
  sfx: ['sfx_splash', 'sfx_ice_crack', 'sfx_goose', 'sfx_bell', 'sfx_crow', 'sfx_dog',
    'sfx_grind', 'sfx_quill', 'sfx_seal', 'sfx_snow_step', 'sfx_door', 'sfx_pickup', 'sfx_sleigh']
};

function checkGroup(label, expected, present) {
  const have = expected.filter(id => present[id]);
  const missing = expected.filter(id => !present[id]);
  const extra = Object.keys(present).filter(id => !expected.includes(id));
  console.info('[BNJ] ' + label + ': ' + have.length + '/' + expected.length + ' registrováno');
  if (missing.length) console.warn('[BNJ]   chybí ' + label + ': ' + missing.join(', ') + ' — engine je nahradí nouzově');
  if (extra.length) console.warn('[BNJ]   mimo kánon IDS.md (' + label + '): ' + extra.join(', '));
  return missing.length;
}

function report(BNJ) {
  const R = BNJ._registry || {};
  console.info('%c[BNJ] Ztracený list — kontrola registrací modulů', 'font-weight:bold');
  if (Array.isArray(window.__bnjMissing) && window.__bnjMissing.length) {
    console.warn('[BNJ] Nenačtené soubory modulů: ' + window.__bnjMissing.join(', '));
  }
  let miss = 0;
  miss += checkGroup('scény', EXPECTED.scenes, R.scenes || {});
  miss += checkGroup('postavy', EXPECTED.characters, R.characters || {});
  miss += checkGroup('předměty', EXPECTED.items, R.items || {});
  miss += checkGroup('dialogy', EXPECTED.dialogs, R.dialogs || {});
  const au = BNJ.audio || {};
  miss += checkGroup('hudební tracky', EXPECTED.tracks, au.tracks || {});
  miss += checkGroup('SFX', EXPECTED.sfx, au.sfxFns || {});
  // hotspoty — jen počty na scénu
  const hs = R.hotspots || {};
  const hsScenes = Object.keys(hs);
  if (hsScenes.length) {
    console.info('[BNJ] hotspoty: ' + hsScenes.map(s => s + '×' + hs[s].length).join(', '));
  } else {
    console.warn('[BNJ] hotspoty: žádné (50_puzzles.js se nejspíš nenačetl)');
  }
  if (!BNJ.strings) {
    console.warn('[BNJ] BNJ.strings chybí (10_strings.js) — UI poběží s klíči místo textů');
  }
  if (miss === 0) console.info('[BNJ] Vše na svém místě. Jizera může téct.');
  else console.warn('[BNJ] Chybí ' + miss + ' registrací — hra poběží v degradovaném režimu.');
}

function fatal(msg) {
  console.error('[BNJ] ' + msg);
  const host = document.getElementById('game') || document.body;
  const div = document.createElement('div');
  div.style.cssText = 'color:#e8dcbe;font:24px Georgia,serif;text-align:center;padding:40vh 10vw 0;';
  div.textContent = 'Ztracený list se nepodařilo rozvinout: ' + msg;
  host.appendChild(div);
}

function boot() {
  const BNJ = window.BNJ;
  if (!BNJ || typeof BNJ.boot !== 'function') {
    fatal('jádro enginu (src/00_engine.js) se nenačetlo.');
    return;
  }
  // globální záchytná síť — chyby modulů logujeme, hru neshazujeme
  window.addEventListener('error', function (e) {
    console.error('[BNJ] Zachycená chyba: ' + (e.message || e.type), e.error || '');
  });
  window.addEventListener('unhandledrejection', function (e) {
    console.error('[BNJ] Nezachycený promise:', e.reason);
  });
  try { report(BNJ); } catch (e) { console.error('[BNJ] Kontrola registrací selhala', e); }
  try {
    BNJ.boot();   // engine startuje na titulní obrazovce s fade-in (fader 1 → 0)
    console.info('[BNJ] Hra běží. Benátky nad Jizerou, léta Páně 1600.');
  } catch (e) {
    fatal('start enginu selhal (' + (e && e.message) + ').');
    console.error(e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

})();
