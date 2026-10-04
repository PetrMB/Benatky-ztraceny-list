# HANDOFF — „Ztracený list" — předání projektu pro novou session / nový model

Tento dokument je jediný potřebný vstupní bod pro kohokoliv (člověka nebo
nový model), kdo má na hře pokračovat, opravovat ji nebo ji jen spustit.
Obsahuje kompletní herní texty/obsah **i** technický postup (build, test,
nástrahy enginu). Design dokumenty v `design/` zůstávají jako podrobný
zdroj pravdy — tohle je jejich provozní výtah + vše, co se naučilo až při
implementaci a ladění (a co v nich není).

**Stav k 9. 8. 2026: hra je dokončená a hratelná.** Vizuální kritik dal ve
4 kolech slepého srovnání s Curse of Monkey Island / Return to Monkey
Island verdikt **7/7 PASS** (`design/CRITIQUE_R4.md`). Po R4 proběhla ještě
jedna drobná úprava postavy trhovkyně Bětky (viz `tools/betka_*`).

---

## 1. Jak hru hned spustit

Hratelný jednosouborový build: **`dist/index.html`** (čistý HTML/JS/canvas,
žádné externí soubory, žádný server potřeba) — stačí otevřít v prohlížeči.

Vývojová verze (živé soubory, pro úpravy): **`index.html`** v kořeni
projektu — načítá moduly přímo z `src/` v pořadí daném `CONTRACT.md`.
Funguje stejně jako `dist/`, jen při každé úpravě `src/*.js` stačí reload
stránky (žádný build krok).

```
benatky-adventure/
├── CONTRACT.md          # závazné API enginu — PŘEČÍST JAKO PRVNÍ při jakékoli úpravě src/
├── index.html            # dev loader (načítá src/*.js z CDN... ne, lokálně, <script src=...>)
├── dist/index.html        # PRODUKČNÍ BUILD — jediný soubor, tohle hraje hráč
├── shots.html            # headless-screenshot harness (viz §3)
├── marsh_exit_test.html  # regresní sada kliknutí + debug overlay hotspotů (viz §4.6)
├── src/
│   ├── 00_engine.js       # jádro: registry, loop, verb coin, inventář, save, dialogy, i18n
│   ├── 10_strings.js      # UI stringy CZ/EN
│   ├── 20_backgrounds.js  # 7 scén — malba, parallax, dynamika (nejobjemnější soubor, ~6300 ř.)
│   ├── 30_characters.js   # 6 postav — vektor + animace
│   ├── 40_dialogues.js    # všechny dialogové stromy CZ/EN
│   ├── 50_puzzles.js      # předměty, hotspoty, kombinace, cutscény
│   ├── 60_audio.js        # WebAudio hudba + SFX
│   └── 90_boot.js         # start hry
├── design/
│   ├── GAME_DESIGN.md     # master design dokument (fakta, scény, postavy, hádanky, hudba)
│   ├── IDS.md             # kánon VŠECH ID (scény/postavy/předměty/hotspoty/dialogy/flagy/fakta/audio)
│   ├── WALKTHROUGH.md     # ručně ověřený průchod + kontrola dependency grafu
│   └── CRITIQUE_R1..R4.md # historie 4 kol vizuální kritiky (0/7 → 2/7 → 5/7 → 7/7 PASS)
└── tools/                 # ad-hoc ladicí pomůcky (viz git historii/mtime, není součást buildu)
```

---

## 2. Build — jak slít `dist/index.html`

Build = inlinování osmi `<script src="src/...">` tagů z `index.html` přímo
do jednoho souboru. Žádný bundler, žádné závislosti — čistý Python regex:

```bash
cd /Users/otto/Documents/OTTO/Projects/nazev-projektu/benatky-adventure
for f in src/*.js; do node --check "$f" || echo "SYNTAX FAIL: $f"; done   # VŽDY nejdřív

python3 - <<'EOF'
import re, pathlib
root = pathlib.Path('.')
html = (root/'index.html').read_text(encoding='utf-8')
def inline(m):
    return '<script>\n' + (root/m.group(1)).read_text(encoding='utf-8') + '\n</script>'
out, n = re.subn(r'<script\s+src="([^"]+)"[^>]*>\s*</script>', inline, html)
(root/'dist'/'index.html').write_text(out, encoding='utf-8')
print('inlined', n, 'souborů,', f'{len(out):,}', 'bytes')
EOF
```

**Pravidlo:** po jakékoli úpravě `src/*.js` nejdřív `node --check` na
všechny moduly (rychlý syntax check, engine je jinak jen vanilla JS bez
buildu, co by to odhalil), teprve pak rebuild. Pokud syntax check selže u
souboru, který právě souběžně edituje jiný proces/agent, rebuild **odlož**
(nerozbiješ tím hratelnou `dist/` verzi starším stavem).

---

## 3. Vizuální testování (headless screenshot harness)

Hra běží jen v prohlížeči (canvas + WebAudio), takže se dá i bez
interaktivního Chrome rozšíření ověřit vzhled přes **headless Chrome +
`shots.html`**:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --window-size=1920,1080 \
  --virtual-time-budget=15000 \
  --screenshot=<cesta_na_vystup>.png \
  "file://$PWD/shots.html#<sceneId>"
```

- `<sceneId>` ∈ `castle_yard, observatory, river_bank, square, old_town,
  marsh` (viz `IDS.md` §Scény).
- **Titulní obrazovku foť BEZ hashe** (`shots.html` bez `#...`) — s
  `#title` harness omylem spustí novou hru a postaví postavu doprostřed
  titulky, což je artefakt harnessu, ne vada hry.
- Výstupní PNG se čte normálním Read nástrojem (žádný OCR krok potřeba).
- `--virtual-time-budget=15000` (ne méně) — viz gotcha v §4.1, proč je to
  nutné a proč samotné zvýšení nestačí bez shimu v `shots.html`.

### 3.1 Jak se dělala kritika (pro zopakování/rozšíření)

Čtyřkolový cyklus „oprav → vyfoť → slepě porovnej s referencí CoMI/RtMI →
zapiš verdikt" zdokumentovaný v `design/CRITIQUE_R1.md`…`R4.md`. Pokud se
bude ve vzhledu dál ladit, drž stejnou metodu a stejně přísné měřítko
(PASS jen když scéna obstojí v slepém testu, ne „je hezká").

---

## 4. Known gotchas enginu — NEZNOVUOBJEVOVAT, ušetří to hodiny

Toto jsou chyby, které se při stavbě a ladění skutečně staly a byly
opravené. Při dalších úpravách `20_backgrounds.js` / `00_engine.js` /
`50_puzzles.js` na ně dávej pozor — stejný vzor chyby se v kódu objevil
opakovaně na různých místech.

### 4.1 Headless Chrome prakticky nespouští `requestAnimationFrame`
Pod `--virtual-time-budget` naběhnou za 15 s virtuálního času jen ~2 rAF
callbacky → herní smyčka (fade-in, animace) reálně stojí a scéna vypadá
černá/ztmavená, i když s hrou samotnou nic není špatně. `shots.html` má
proto **shim** `requestAnimationFrame → setTimeout(16ms)` vložený jako
úplně první `<script>`, PŘED načtením `00_engine.js`. Pokud se bude dělat
nový testovací harness, tenhle shim musí jít s ním.

Související: `BNJ.G` (hlavní engine stav) **není exportované** — je to
lokální `const G` uvnitř `00_engine.js` (řádek ~213). Pokus sahat na
`BNJ.G` zvenku (např. ruční reset faderu v test harness) je tiše no-op.
Nespoléhat na to; pokud je potřeba stav zvenku ovlivnit, přidat k tomu
explicitní API, ne sahat na interní `G`.

### 4.2 Verb coin: klik mimo slovesa musí i chodit
Původně klik mimo ikony verb coinu minci jen zavřel, bez pohybu hráče.
V praxi to vytvářelo **deadlock** všude, kde hotspot (neviditelně) pokrývá
většinu pochozí plochy — každý klik na zem střídavě otvíral/zavíral
minci a postava nikdy nedošla k cíli (reálně nahlášený bug na hatích v
Obodři, hotspot `hs_ma_ice_pool` přesahoval do walkArea). Opraveno v
`coinClick()` (`00_engine.js`): klik mimo minci ji zavře **a zároveň**
pošle hráče na kliknuté místo (chování jako RtMI). Při přidávání nových
hotspotů dávej pozor, aby jejich `poly` nezabíral celou šířku pochozího
koridoru walkArea.

### 4.3 Statické vrstvy se vykreslí JEN JEDNOU — stav-závislá grafika patří do `dynamic()`
`prerender()` má cache (`if (def._pre) return`) — vrstva se vymaluje
jednou za session a dál na stav hry nereaguje. Cokoliv, co se má objevit/
zmizet podle flagu nebo inventáře (fragment listu pod ledem, brk v hnízdě,
roh pergamenu), **musí být v `dynamic()` s explicitní podmínkou**, ne v
`paint()` statické vrstvy. Tahle chyba se v `20_backgrounds.js` objevila
na dvou různých místech nezávisle (tůň v mokřadech i hnízdo husy) —
hledej vzor „objekt tam zůstává navždy, i po sebrání".

### 4.4 Z-pořadí animací: `layer.dynamic()` vs. scénový `dynamic()`
Scénový `dynamic(ctx, t, camX)` (na úrovni `registerScene`) se kreslí
**nad úplně všemi statickými vrstvami** bez ohledu na to, jakou parallaxu
jen vizuálně emuluje přes `ctx.translate`. Translace mění pozici, ne
z-pořadí. Důsledek: animace vzdálenějšího prvku (odlesky a proudění řeky
ve Starých Benátkách) kreslená ve scénovém `dynamic()` prosvítala přes
fasády domů v popředí („průhledné domy").

**Oprava/rozšíření enginu:** jednotlivá vrstva smí mít vlastní
`layer.dynamic(ctx, t, camX)`, který engine zavolá hned po vykreslení
statiky TÉ vrstvy (`renderScene`, `00_engine.js`) — tedy správně POD
následujícími vrstvami, ve stejném souřadném prostoru jako její `paint`.
Animaci vzdáleného prvku dávej do `dynamic` té konkrétní vrstvy, ne do
scénového `dynamic`. **River_bank má latentně stejný vzor** u třpytu horní
hladiny (vrstva 0.45) — zatím nehlášeno jako vada, ale kandidát na stejnou
opravu, pokud se v budoucnu bude upravovat.

### 4.5 Sdílené souřadnicové pole napříč více věcmi (`WINS` v `old_town`)
Pole `WINS` (`20_backgrounds.js`, scéna `old_town`) řídí najednou tři
věci: svítící/zhasnuté okenní tabulky (dynamic), okenice (statická
fasáda) a louže světla na sněhu. Při jakékoli přestavbě fasády (posun
vikýře, výlohy, dveří) se `WINS` musí ručně dorovnat, jinak okna „plavou"
mimo otvory. Pole má teď komentář, který index patří kterému otvoru —
při další úpravě fasád v `old_town` ho udržuj aktuální.

### 4.6 `marsh_exit_test.html` — regresní sada
Vznikla postupně při lovení výše uvedených bugů; simuluje kliky a má
pojmenované stavy přes hash:
- `#a`, `#b` — výchozí odchod z hatí (ověření, že deadlock z §4.2 nenastává)
- `#c`…`#f` — stavy sběru fragmentů (husa v hnízdě/na břehu dle
  `goose_lured`, fragment pod ledem viditelný/zmizelý po sebrání)
- `#g2` — debug overlay: vykreslí obrysy `WINS` a hotspotů přímo do
  render pipeline (přes `BNJ._registry`) — užitečné při jakékoli další
  práci na fasádách `old_town`.

Doporučení: při každé další grafické/gameplay úpravě tenhle harness
spustit znovu (nebo rozšířit o nový stav), než se prohlásí hotovo.

---

## 5. KOMPLETNÍ HERNÍ BIBLE

*(Výtah z `design/GAME_DESIGN.md` a `design/IDS.md` — detaily a zdroje
faktů tam, tohle je čtecí verze pro rychlou orientaci.)*

### 5.1 Logline
Point-and-click adventura ve stylu *Curse of Monkey Island* / *Return to
Monkey Island*. Benátky nad Jizerou, zima 1599/1600. Čtrnáctiletý posel
**Jiřík** nese na zámek císařský list od Rudolfa II. pro astronoma
**Tychona Braheho** — a při přechodu zamrzlé Jizery ho upustí do vody,
proud ho roztrhá na kusy. Musí list zrekonstruovat dřív, než na zámek
dorazí **Johannes Kepler** (historicky 4. 2. 1600).

### 5.2 Ověřená fakta (13×, zdroje viz `GAME_DESIGN.md` §1)
1. Brahe přijel na zámek Benátky 20. 8. 1599 na pozvání Rudolfa II.
2. Rudolf II. mu nabídl tři zámky (Lysá, Brandýs, Benátky) — vybral si
   Benátky kvůli návrší s výhledem na oblohu.
3. Observatoř a alchymistická laboratoř byly ve 2. patře zámku, přístroje
   rozmístěné ve 13 místnostech (zámek se kvůli tomu přestavoval).
4. O nos přišel Brahe 1566 v souboji s Manderupem Parsbergem (spor o
   matematiku). Pověst říká stříbro; exhumace 2010 (Aarhus Univ.)
   prokázala **mosaz**. *(Ve hře je to záměrný chyták — viz H9.)*
5. Johannes Kepler přijel za Brahem 4. 2. 1600 (některé prameny: 3. 2.).
6. Z Brahových přesných měření Marsu Kepler později odvodil eliptické
   dráhy planet.
7. V červnu 1600 se Brahe přestěhoval do Prahy; zemřel 1601.
8. Jméno Benátky pochází z italského *Venetia* přes slovinské *Benetke* —
   „mokré místo u vody".
9. První zmínka o Benátkách je z roku 1259 (osada na levém břehu Jizery,
   dnešní Staré Benátky).
10. Kolem 1340 založil biskup Jan z Dražic na protějším břehu Nové
    Benátky (městem k r. 1343).
11. Roku 1944 se Nové Benátky, Staré Benátky a Obodř sloučily v jedno
    město Benátky nad Jizerou.
12. Rod Bendů ze Starých Benátek: Jan Jiří Benda (1682–1757, tkadlec a
    muzikant) a syn František Benda (*1709, houslista pruského krále).
    *(Anachronismus: rod žil až v 18. století — hra proto má fiktivní
    „předka Bendů", šumaře Matěje Bendu; Kronika uvádí skutečná data.)*
13. Železoduběnkový inkoust: duběnky + zelená skalice — standardní
    technologie od středověku.

### 5.3 Synopse — tři akty
- **Akt I — „Voda bere":** List spadne do Jizery a roztrhá se na tři
  kusy. Jiřík se přizná Brahovi a dostane za úkol fragmenty vylovit:
  jeden z víru pod jezem, druhý z hnízda husy Markyty, třetí z přimrzlé
  tůně v Obodři. Pomáhají převozník Vávra, trhovkyně Bětka a šumař Matěj
  Benda.
- **Akt II — „Inkoust a paměť":** Fragmenty jsou vylovené, ale vybledlé.
  Brahe ukáže trik se šikmým světlem velkého sextantu, který zviditelní
  rýhy po brku. Chybí úvodní formule listu (utržený roh) — tu zná jen
  šumař Benda, který ji umí zazpívanou (dialogová hádanka). K přepisu
  je potřeba vyrobit duběnkový inkoust a sehnat brk a pergamen.
- **Akt III — „Pečeť a sníh":** Brahe otestuje Jiříka třemi otázkami
  (včetně chytáku o nosu), než půjčí pečetidlo. Jiřík napíše přepis,
  zapečetí ho — a vtom zvon ohlásí příjezd saní: 4. února 1600 dorazí
  Kepler. Finální scéna na nádvoří + epilog s dalšími fakty.

### 5.4 Postavy (6)

| ID | Jméno | Barva titulků | Charakteristika |
|---|---|---|---|
| `jirka` | **Jiřík** | `#ffe9a8` | 14 let, hrdina, drzý a upřímný, bojí se hus a bludiček. Zrzavý, červená šála, poselská brašna. |
| `brahe` | **Tycho Brahe** | `#d9b8ff` | Hřmotný cholerik se zlatým srdcem, na nos citlivý (a proto o něm pořád mluví). Mosazný nos se třpytí u svíce. |
| `kepler` | **Johannes Kepler** | `#b8e0ff` | Tichý, krátkozraký, myšlenky utíkají k číslům. Přijíždí ve finále. |
| `benda` | **Matěj Benda** | `#ff9e64` | Fiktivní „předek Bendů", šumař-tkadlec, půlku vět zpívá, prorokuje slávu svého rodu. |
| `prevoznik` | **Vávra** | `#9fd8c0` | Flegmatický převozník s fajfkou, majitel husy Markyty. |
| `trhovkyne` | **Bětka** | `#ffa8c8` | Srdečná trhovkyně, platidlem jsou drby ze zámku. |

Ukázkové repliky (CZ/EN) a plný vizuální popis každé postavy:
`design/GAME_DESIGN.md` §4. Plné dialogové stromy: `src/40_dialogues.js`.

### 5.5 Scény (7) a mapa propojení

```
title (titulka) → Nová hra → castle_yard
castle_yard ⇄ observatory   (dveře věže)
castle_yard ⇄ square        (brána)
square ⇄ river_bank         (ulička k řece)
river_bank ⇄ old_town       (lávka po ledu, odemkne H1 s Vávrou)
old_town ⇄ marsh            (pěšina / hatě)
```

Hub = `square`. Všechny exity obousměrné, žádná scéna se trvale
nezamyká → žádný dead-end. Společné zimní prvky všech exteriérů: sníh ve
2 hloubkových vrstvách, pára od úst postav, mizící stopy ve sněhu.

Přehled denní doby / nálady každé scény (plná paleta a vrstvy:
`GAME_DESIGN.md` §3):
- `title` — hluboká noc, hvězdné nebe s Mléčnou dráhou nad siluetou zámku
- `castle_yard` — pozdní zimní odpoledne, nízké zlaté slunce, dlouhé stíny
- `observatory` — noc, měsíční světlo + svíce, mosaz přístrojů
- `river_bank` — mrazivé ráno, mlha nad vodou, jez
- `square` — jasné dopoledne, trh, ostré zimní světlo
- `old_town` — „modrá hodinka", rozsvěcující se okna, Bendův ohýnek
- `marsh` — mlhavý soumrak, bludičky, nejstrašidelnější scéna

### 5.6 Předměty (17 ID, z toho 4 stavové transformace)

| ID | Co to je | Jak se získá |
|---|---|---|
| `mokry_list` | Rozmočený cár listu s kouskem pečeti | úvodní cutscéna |
| `frag_a` / `frag_b` / `frag_c` | 3 fragmenty listu | jez / hnízdo / tůň v Obodři |
| `cednik`, `zrno`, `svicka` | od Bětky výměnou za drby | H2 |
| `bidlo` | od Vávry | H1 |
| `podberak` | `cednik` + `bidlo` (absurdní kombinace!) | inventář |
| `dubenky` | ze starého dubu v mokřadech | ruka na dub |
| `skalice` | z police v laboratoři | po `knows_quest` |
| `inkoust` | `dubenky` + `skalice` v hmoždíři | H7 |
| `brk` | z hnízda husy Markyty | H4 |
| `pergamen`, `pecetidlo` | od Braha | H9 (zkouška) |
| `prepis` | psací pult | H10a |
| `zapeceteny_list` | svícen + pečetidlo | H10b — finální předmět |

Svíčka a bidlo se nikdy nespotřebují (svíčka slouží v H5 i H10b).
Plné názvy CZ/EN, popisy, detaily ikon: `design/IDS.md` §Předměty,
implementace `src/50_puzzles.js`.

### 5.7 Hádanky (10) — stručně

| # | Hádanka | Typ | Řešení |
|---|---|---|---|
| H1 | Vávrovo bidlo | dialog | rozhovor s Vávrou → `bidlo` + odemkne cestu po ledu |
| H2 | Drby za krám | dialogový obchod | drby Bětce → `cednik`+`zrno`+`svicka` |
| H3 | Astronomický podběrák | **absurdní kombinace** | `cednik`+`bidlo`→`podberak`, na jez → `frag_a` |
| H4 | Husa Markyta | inventář+hotspot | `zrno` na husu → hnízdo → `frag_b`+`brk` |
| H5 | List v ledu | inventář+hotspot | `svicka` na zamrzlou tůň → `frag_c` |
| H6 | Sextant a měsíc | **hádanka s přístroji** | 3 fragmenty na sextant → zaměřovací volba → `letter_read` |
| H7 | Duběnkový inkoust | kombinace | `dubenky`+`skalice` v hmoždíři → `inkoust` |
| H8 | Bendova píseň | **dialogová hádanka** | poskládat 4 verše formule ve správném pořadí |
| H9 | Brahova zkouška | dialogová zkouška | 3 otázky, chyták „z čeho je nos" → **„Z mosazi!"** |
| H10 | Přepis a pečeť | finální syntéza | pult → `prepis`; svícen → `zapeceteny_list`; dát Brahovi → finále |

Plný dependency graf (Mermaid, ověřeně acyklický, bez dead-endů) a tabulka
hotspot×předmět→efekt: `design/GAME_DESIGN.md` §5.3–5.4. Krok-za-krokem
ověřený průchod: `design/WALKTHROUGH.md`.

### 5.8 Hudba a zvuk
8 leitmotivových tracků (WebAudio syntéza — Karplus-Strong loutna, FM
zvony, filtrovaná viola, flétna): `title_theme`, `castle_theme`,
`observatory_theme`, `river_theme`, `square_theme`, `oldtown_theme`,
`marsh_theme`, `finale_theme`. 13 SFX (šplouchnutí, praskání ledu,
kejhání husy, zvon, krákání vran, štěkot, tření hmoždíře, škrábání brku,
přitisknutí pečetidla, kroky ve sněhu, dveře, sebrání předmětu, rolničky
saní). Plné melodie jako pole `[midi, doba]`: `GAME_DESIGN.md` §6,
implementace `src/60_audio.js`.

### 5.9 Kronika (13 faktů) a easter eggy
Každý fakt má ID `fact_*` a místo získání (viz `GAME_DESIGN.md` §7 pro
plné mapování). Easter eggy: sněhulák „Tycho II." na nádvoří (3× ruka na
hromadu sněhu), rozeznění zvonice ve Starých Benátkách, Brahova reakce na
nabídnutí podběráku, varování nedávat brk zpět Markytě.

---

## 6. Vizuální kritika — shrnutí historie (pro kontext, ne k opakování od nuly)

| Kolo | PASS/7 | Co se řešilo |
|---|---|---|
| R1 | 0/7 | „čistá vektorová ilustrace" — chybí textura, stíny, siluety postav |
| R2 | 2/7 | postavy dostaly rim-light a karikaturu, redesign břehu Jizery |
| R3 | 5/7 | zbývaly náměstí (`square`) a nádvoří zámku (`castle_yard`) |
| R4 | **7/7** | poslední dvě scény opraveny (de-klonování, foreground, trhovkyně) |

Zbývající nice-to-have polish (žádný neblokuje nic, viz
`design/CRITIQUE_R4.md` §Zbývající nice-to-have):
- **N1** `square` — kompozice je jediná bez výrazné architektonické diagonály
- **N2** `square`/trhovkyně — rim-light slabší než u ostatních postav, póza
  rukou skoro symetrická *(pozn.: po R4 proběhla ještě úprava Bětky, viz
  `tools/betka_before.png` / `betka_after.png` — zkontrolovat, zda N2 už
  není vyřešené, než se do toho znovu sahá)*
- **N3** `old_town` — žlutý „oko" vývěsní štít čte nejednoznačně
- **N4** `square` — ambientní chodkyně je ve stillu příliš zjednodušená
- **N5** `title` — položka „Pokračovat" v disabled stavu moc splývá s pozadím

---

## 7. Co dělat jako první v nové session

1. Přečti tenhle soubor celý (`HANDOFF.md`) — je to levnější než
   rekonstruovat kontext z `design/*.md` a kódu zvlášť.
2. `node --check src/*.js` — ověř, že nikdo neodešel uprostřed úpravy.
3. Otevři `dist/index.html` v prohlížeči a projdi aspoň jednu scénu —
   ověř, že build odpovídá aktuálnímu `src/`.
4. Pokud se bude pokračovat na vizuálu: nejdřív `design/CRITIQUE_R4.md`
   §Zbývající nice-to-have, teprve pak hledat nové problémy.
5. Pokud se bude přidávat obsah (nová scéna/hádanka/postava): nejdřív
   rozšířit `design/IDS.md` o nová ID, pak `GAME_DESIGN.md`, teprve pak
   kód — stejné pořadí, jakým byla hra postavená.
6. Claude Code má v paměti (`~/.claude/projects/.../memory/`) uložené dva
   záznamy k tomuto projektu: `sequential-agents-token-saving.md`
   (preference uživatele — agenty spouštět sekvenčně, ne paralelně, kvůli
   tokenům) a `benatky-adventure-projekt.md` (stručný ukazatel na tenhle
   projekt). Zkontroluj, že `benatky-adventure-projekt.md` pořád odkazuje
   na aktuální soubory.
