# TECHNICKÝ KONTRAKT — „Ztracený list" (Benátky nad Jizerou adventure)

Závazné API pro všechny moduly. Každý agent píše JEDEN soubor v `src/` a smí
používat POUZE zde definovaná rozhraní. Vše je vanilla JS (ES2020), žádné
externí knihovny, žádné externí soubory (obrázky/audio) — veškerá grafika je
procedurální canvas 2D, veškerý zvuk je WebAudio syntéza. Finální build slije
soubory do jednoho `index.html`.

## Pořadí načítání (build je slije v tomto pořadí)
1. `src/00_engine.js`   — jádro: registry, game loop, verb coin, inventář, save, dialogový runtime, i18n
2. `src/10_strings.js`  — UI stringy (i18n)
3. `src/20_backgrounds.js` — malíři scén (pozadí, vrstvy, parallax, dynamika)
4. `src/30_characters.js`  — postavy: vektorové kreslení + animace
5. `src/40_dialogues.js`   — dialogové stromy (CZ+EN)
6. `src/50_puzzles.js`     — předměty, hotspoty, interakce, logika hádanek
7. `src/60_audio.js`       — hudba + SFX (WebAudio)
8. `src/90_boot.js`        — start (součást engine agenta)

Globální namespace: `window.BNJ`. Nic jiného do globálu nedávat.

## Rozlišení a rendering
- Interní rozlišení **1920×1080**, canvas škálovaný na okno s letterboxem.
- Malířský styl à la Curse of Monkey Island / RtMI: syté gradienty, měkké
  tvary, rim-light, atmosférická perspektiva, texturní šum (scumble).
- Scéna = statické vrstvy (pre-renderované JEDNOU do offscreen canvasů)
  + dynamické průchody kreslené každý frame (voda, kouř, ptáci, vlajky,
  svíčky, déšť světla). Parallax dle `parallax` faktoru vrstvy (kamera se
  posouvá za hráčem, scéna může být širší než 1920 — `width` scény).

## API — scény (implementuje 20_backgrounds.js)
```js
BNJ.registerScene({
  id: 'castle_yard',            // canon ID z IDS.md
  width: 2400,                  // >= 1920
  name: {cz:'Nádvoří zámku', en:'Castle Courtyard'},
  layers: [                     // pořadí = zezadu dopředu
    { parallax: 0.2, paint(ctx){/* kreslí JEDNOU, 1920x1080*šířka */} },
    { parallax: 1.0, paint(ctx){}, walkBehind: [ [poly...] ] },
  ],
  dynamic(ctx, t, camX){},      // každý frame NAD vrstvou s parallax 1.0, pod walkBehind
  overlayDynamic(ctx, t, camX){}, // úplně navrchu (déšť světla, mlha)
  walkArea: [[x,y],...],        // polygon (souřadnice scény), y ~ 780–1050
  scaleAt(y){return 0.4+...},   // měřítko postavy dle y (perspektiva)
  exits: [{to:'square', at:[x,y], spawn:[x,y], label:{cz,en}}],
  lightTint: 'rgba(...)',       // volitelný barevný nádech postav ve scéně
})
```

## API — postavy (implementuje 30_characters.js)
```js
BNJ.registerCharacter({
  id: 'jirka',                  // hrdina = 'jirka' (mladý posel Jiřík)
  textColor: '#ffe9a8',         // barva titulků řeči
  height: 340,                  // px při scale 1
  draw(ctx, pose){},            // kreslí postavu, kotva = střed nohou (0,0)
})
// pose = { t, dir:1|-1, action:'idle'|'walk'|'talk'|'reach'|'pickup',
//          mouth:0..1 (otevření úst při talk), blink:0..1, phase }
```
Postavy jsou plně vektorové (ctx paths), walk cycle 8+ fází odvozený z `t`,
sekundární animace (vlasy, pláštík), mrkání, gesta při řeči.

## API — dialogy (implementuje 40_dialogues.js)
```js
BNJ.registerDialog({
  id: 'brahe_intro',
  nodes: {
    start: { speaker:'brahe', text:{cz:'…',en:'…'},
             next:'q1' },                       // lineární krok
    q1:    { choices: [
              { text:{cz,en}, cond:s=>true, once:false, next:'a1',
                effect(s){} },                  // s = BNJ.state
            ]},
    a1:    { speaker:'jirka', text:{cz,en}, next:null }, // null = konec
  }
})
```
`speaker` je ID postavy. Fakta z historie označuj `fact:'brahe_nose'` na uzlu
→ engine je zapíše do Kroniky (journal sbírající pravdivá fakta).

## API — hádanky a interakce (implementuje 50_puzzles.js)
```js
BNJ.registerItem({ id:'mokry_list', name:{cz,en}, desc:{cz,en},
                   drawIcon(ctx){/* 96x96 */} })
BNJ.registerHotspot('castle_yard', {
  id:'sundial', poly:[[x,y],...], name:{cz,en},
  lookAt:{cz,en} | fn,                 // oko
  use: fn(s) | {item:'x', fn},         // ruka (i s předmětem z inventáře)
  talk: fn(s) | 'dialog_id',           // ústa
  walkTo:[x,y], faceDir:1|-1,
})
BNJ.combine('itemA','itemB', fn(s))    // kombinace v inventáři
```
Efektová API dostupná v `fn(s)`:
`BNJ.say(charId, {cz,en}, then?)`, `BNJ.give(itemId)`, `BNJ.take(itemId)`,
`BNJ.flag(name, val?)`, `BNJ.goto(sceneId, spawn?)`, `BNJ.dialog(id)`,
`BNJ.sfx(name)`, `BNJ.cutscene([kroky])`, `BNJ.fact(id)`.
Stav: `BNJ.state = {flags:{}, inventory:[], scene, lang:'cz'|'en', facts:[]}`.

## API — audio (implementuje 60_audio.js)
```js
BNJ.audio.registerTrack('castle_theme', (ac, out)=>{/* vrátí {stop()} */})
BNJ.audio.registerSfx('splash', (ac, out)=>{})
BNJ.audio.sceneMusic = { castle_yard:'castle_theme', ... }
```
Engine volá `BNJ.audio.play(trackId)` (crossfade 2 s) a `BNJ.sfx(id)`.
Hudba: leitmotivy, renesanční instrumentace (loutna=Karplus-Strong,
flétna, viola, zvony), adaptivní vrstvy. Start až po prvním user gestu.

## Engine (00_engine.js) dále poskytuje
- Verb coin (Curse-style): klik na hotspot → mince s okem/rukou/ústy.
- Inventář: pruh dole (toggle), klik předmět→hotspot / předmět→předmět.
- Chůze: klik = jdi (uvnitř walkArea, jednoduchá navigace), škálování dle y.
- Titulky řeči nad hlavou v barvě postavy, font s obrysem, CZ/EN.
- Dialogové volby dole (max 5, hover highlight).
- Save/Load: 3 sloty + autosave, localStorage `bnj_save_*`; menu (Esc).
- Titulní obrazovka s CZ/EN přepínačem (i za hry tlačítko vpravo nahoře).
- Kronika (journal) — seznam nasbíraných pravdivých faktů, tlačítko v UI.
- `BNJ.T(o)` → `o[BNJ.state.lang]`; fallback cz.

## Kánon ID
Viz `IDS.md` (vznikne v design fázi) — VŠECHNA ID scén, postav, předmětů,
dialogů, flagů, faktů, tracků. Nikdo nevymýšlí vlastní ID mimo kánon.

## Kvalita
Cíl: při slepém srovnání se screenshoty Curse/Return to Monkey Island musí
obstát. Žádné placeholder obdélníky, žádné „TODO", žádný lorem ipsum.
