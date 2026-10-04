# CRITIQUE R1 — „Ztracený list" vs. Monkey Island (slepý test)

Kritik: nemilosrdný AAA art review, 2026-08-07.
Benchmark: The Curse of Monkey Island (1997, Wikipedia screenshot), Return to Monkey Island (2022, 3× oficiální Steam screenshot — z toho jeden zimní/ledový interiér, tedy přímé srovnání 1:1 s naší zimní paletou).
Metoda: všech 7 scén vyfoceno headless Chromem přes opravený `shots.html` (viz Finding #0), prohlédnuto vedle referencí.

## Celkový verdikt

**NEOBSTOJÍ. 0/7 PASS.** Hra je čistá, konzistentní a kompozičně slušná „korporátní vektorová ilustrace" — ale vedle CoMI/RtMI působí jako infografika, ne jako malovaný svět. Chybí tři věci, které dělají Monkey Island Monkey Islandem: **(1) malířská textura a hodnotová modulace uvnitř každé plochy, (2) světlo jako dramaturgie (stíny, bounce, rim), (3) odvaha v kompozici a siluetě** (diagonály, popředí, karikatura). Dobrá zpráva: engine (vrstvy s parallaxou, overlayDynamic, glow/scumble helpery) už všechno potřebné umí — jde o to je skutečně použít.

Pořadí scén od nejsilnější: observatory > title > old_town > square > castle_yard > marsh > river_bank.

## Tabulka scén

| Scéna | Verdikt | Jedna věta |
|---|---|---|
| title | FAIL (těsně) | Nejlepší atmosféra (noc, měsíc, paprsky), ale klonované domky a plochý terén ji prozradí. |
| castle_yard | FAIL | Obří prázdná fasáda s tapetovým sgrafitem, pět identických arkád, objekty bez stínů „plavou" na sněhu. |
| observatory | FAIL (nejblíž) | Jediná scéna s MI hustotou rekvizit; potápí ji ploché stěny s opakovanými skvrnami a chybějící ambient occlusion. |
| river_bank | FAIL (nejhůř) | ~55 % plátna prázdný gradient, klonovaná silueta protějšího břehu, lávka splývá s ledem. |
| square | FAIL | Barevně nejodvážnější, ale kulisovitě frontální; slunce = tvrdý disk, kašna působí betonově moderně. |
| old_town | FAIL | Dobrá nálada oken a zvonice, ale růžový mrak má tvrdé hrany a 3 chalupy jsou skoro tentýž asset. |
| marsh | FAIL | Nejlepší kompoziční kostra (strom vpravo, esovitý plot), zabitá mlhou malovanou jako plnoplošné `fillRect` pruhy. |

---

## Finding #0 (infra, P0) — Screenshot harness: ztmavené snímky NEJSOU vada hry

Pozorování orchestrátora potvrzeno a vysvětleno. Dvě příčiny, obě v harnessu, ne v enginu:

1. **Headless Chrome s `--virtual-time-budget` téměř nespouští `requestAnimationFrame`** — instrumentací naměřeno **2 rAF callbacky za 15 000 ms virtuálního času** (timery přitom běží normálně). Celý game loop (`frame()` v `src/00_engine.js:2204`) je rAF-driven, takže `update()` nikdy nedoběhl a `G.fader` zůstal na ~1 → `rgba(2,3,8,fader)` overlay (`src/00_engine.js:2195-2196`) ztmavil/začernil celý snímek. V normálním prohlížeči fade funguje správně — není to zaseknutý fader ve hře.
2. **`BNJ.G` engine nikdy neexportuje** (`G` je lokální `const` v `src/00_engine.js:213`), takže pojistka v shots.html (`if (BNJ.G) { BNJ.G.fader = 0; … }`) byla odjakživa tichý no-op.

**Oprava (hotovo v tomto review):** do `shots.html` přidán shim `requestAnimationFrame → setTimeout(16)` PŘED načtením enginu — loop pak běží plnou rychlostí ve virtuálním čase a fade i animace doběhnou. Volitelné do budoucna: exportovat `BNJ.G = G` (klidně jen za debug flagem) pro deterministické harness zásahy.

---

## P0 — kazí celou hru

### P0-1: Ploché jednobarevné výplně bez malířské textury
Každá stěna, střecha, sníh i nebe je jedna barva nebo hladký gradient. CoMI má v každé ploše viditelné tahy štětce a 3+ hodnotové zóny; RtMI má na všech tvarech zrno/šum a fazetovanou geometrii (viz zimní referenční screenshot — led je rozbitý do desítek krystalických plošek se studenými/teplými odlesky).
- **Kde:** všech 7 scén, `src/20_backgrounds.js`. Helper `scumble()` (řádek 90) existuje, ale používá se řídce a s alpha tak nízkou, že na screenshotu není vidět (fasáda castle_yard ~617-780, stěny observatory ~1283-1340, chalupy old_town ~3461+).
- **Recept:** (a) zdvojnásobit hustotu i alphu `scumble()` na všech velkých plochách a dát mu 2 barvy (světlejší nahoře/po směru světla, tmavší dole); (b) každé stěně přidat vertikální gradient 3 zón (světlo → lokální barva → odražená studená) místo jedné výplně; (c) přidat globální „paper grain" pass — jednorázový noise pattern canvas v prerenderu, přes celý snímek s `globalAlpha 0.04-0.06` a `overlay`-like dvojím průchodem (světlý + tmavý šum). Levné, okamžitě „malované".

### P0-2: Chybí okluzní a vržené stíny — všechno „plave"
Sáně, studna, bouda, kašna, stánek, loďka, chalupy: skoro nic nemá kontaktní stín, budovy nevrhají nic, přestože kód deklaruje „slunce nízko zleva" (komentáře `src/20_backgrounds.js:725, 785`). CoMI/RtMI kotví každý objekt tmavým jádrovým stínem + dlouhým barevným vrženým stínem.
- **Kde:** castle_yard (sáně/studna/bouda, ~617-1230), square (kašna/stánek/pranýř, ~2758+ — modré stíny domů na ř. 2771 jsou dobrý začátek, ale na screenshotu skoro neviditelné), river_bank (loďka), old_town (chalupy), marsh (plot, boží muka).
- **Recept:** util `contactShadow(ctx, x, y, rx, ry)` = elipsa `rgba(60,80,130,0.30)` + měkčí širší `0.12`; volat pod KAŽDÝM objektem. K tomu vržené stíny: protáhlé zkosené polygony od paty objektu směrem od slunce (castle_yard: slunce na (430,560) → stíny doprava-dolů), barva do modrofialova, ne šedá. Zesílit existující modré stíny v square ×2-3.

### P0-3: Postavy jsou z jiné hry než benchmark
Jirka & spol. jsou roztomilý storybook styl: kruhová hlava, tenké končetiny, žádná linka, žádný rim-light, nulová karikatura. Vedle Guybrushe (CoMI i RtMI verze) vypadají jako z dětské edukativní aplikace. Ve slepém testu je to poznat na první pohled — postava je to první, co hráč čte.
- **Kde:** `src/30_characters.js` — `drawJirka` (193), `drawBrahe` (390), `drawKepler` (586), `drawBenda` (741), `drawPrevoznik` (934), `drawTrhovkyne` (1100).
- **Recept:** (a) přitvrdit siluetu: fazetované/hranaté tvary à la RtMI místo čistých elips — `torso()` (83) už má parametr `edge`, použít ho na tmavou konturu 2-3 px u všech dílů; (b) rim-light: 1-2px světlá hrana na návětrné straně podle světla scény (teplá u ohně/oken, studená venku); (c) proporce: zvětšit ruce a boty, výraznější nos/brada v profilu, přehnat pózu (Brahe = koule s mosazným nosem — toho se dá karikaturně využít mnohem víc); (d) 2-tónové stínování oblečení (každý díl světlá + stínová barva), sklady na šále a kabátě.

## P1 — výrazné

### P1-1: Nebe a mlha jako ploché pásy; river_bank a marsh z poloviny prázdné
Nebe je všude 1 vertikální gradient + 3-4 `cloudPuff` bloby. V river_bank (`src/20_backgrounds.js:2082-2093`) a marsh (3910-3932) zabírá prázdný gradient přes polovinu plátna. Nejhorší: mlha je doslova plnoplošný `fillRect` s tvrdými horizontálními hranami — marsh ř. 3927-3930 (`fillRect(0,480,SW,140)` + `fillRect(0,430,SW,70)`), river_bank ř. 2099 (`fillRect(0,400,SW,120)`); na screenshotech čitelné jako pruhy přes obraz. Old_town: růžový oblak za městem má tvrdou vektorovou hranu.
- **Recept:** (a) mraky dvoubarevně (osvětlená + stínová strana, jak to dělá CoMI) a v pásech s rozdílnou teplotou — min. 3 barevné zóny nebe se zlomem u horizontu; (b) mlhu skládat z 6-10 `mistPuff()` elips (helper už existuje, ř. 78!) s proměnnou alphou a šířkou místo fillRectů; (c) prázdné nebe v marsh/river_bank zaplnit: hejno vran, vzdálená vížka, sloup kouře, sněhová přeháňka v jedné části oblohy.

### P1-2: Kompozice: vše frontální, rovnoběžné s plátnem, bez popředí
CoMI referenční záběr je rámovaný kanónem a trámy v popředí, RtMI džungle má 3 vrstvy listů před postavami, ledový palác vede diagonálou schodiště. U nás: všechny scény = pás země dole, fasáda/horizont uprostřed, nebe nahoře; jediný foreground prvek je zeď v river_bank a strom v marsh (nejlepší scéna právě proto).
- **Recept:** do každé scény přidat foreground vrstvu s `parallax > 1`: castle_yard — zasněžená větev/okap shora + roh zdi; square — šňůra s praporky nebo výstrč krčmy shora, silueta sudu/vozu v rohu; old_town — plot v popředí; river_bank — rákosí a kotvící kůl zprava. Tmavší hodnoty, měkký blur netřeba — stačí tmavá silueta se sněhovou čepicí.

### P1-3: Klonované primitivy
Old_town: 3 chalupy = tentýž asset s jiným oknem; pozadí = 8× identická silueta domku (totéž na title). Castle_yard: 5 stejných arkád + stejné diamantové sgrafito na celé fasádě bez přerušení. Square: arkády klon. River_bank: ~30 identických kůlů lávky, 12 siluet domů generovaných v uniformní smyčce (ř. 2104+).
- **Recept:** každé „kopii" dát 2-3 odlišnosti (jiná výška/šířka, propadlá střecha, vikýř, došky vs. šindel, jiný náklon ±2°); sgrafito přerušit — opadaná omítka (nepravidelné světlé záplaty s odhaleným zdivem), zamrzlé skvrny, prasklina; arkády: jednu zazděnou, v jedné vrata, v jedné složené dříví.

### P1-4: Světlo se nepropisuje do okolí
Okna svítí, ale sníh pod nimi je stejně modrý jako jinde (old_town má náznak, je ~3× slabší než potřeba); oheň u Bendy nevrhá teplý kruh; svíčky v observatoři neosvětlují stůl pod sebou; měsíc v okně observatoře dělá paprsek, ale podlaha pod oknem není světlejší než zbytek.
- **Kde:** `litWindow()` (`src/20_backgrounds.js:132`) kreslí glow jen kolem okna; old_town ~3461+, observatory ~1818 (svíčky).
- **Recept:** ke každému `litWindow` přidat na zem teplou kaluž: protáhlá elipsa/lichoběžník `rgba(255,190,110,0.10-0.18)` směrem od okna + teplý rim na hranách okolních objektů. U ohně `glow()` s poloměrem ×3 a teplé tečky na sněhu. V observatoři zesílit kontrast: ztmavit rohy místnosti o 20 % (vinětace ve scéně, ne globální), tím vyniknou svíčky i měsíční paprsek.

### P1-5: Čitelnost hotspotů / klíčových předmětů
Dopis pod ledem v marsh a lísteček ve vodě v river_bank mají ~20-30 px a nízký kontrast — ve slepém testu je oko nenajde. MI řeší vodítka kompozicí (světlo ukazuje na věc).
- **Recept:** `sparkleDyn()` (`src/20_backgrounds.js:286`) nasadit na všechny sebratelné předměty; k tomu kompoziční vodítko (prasklina v ledu ukazující k dopisu, kruhy na vodě). Interaktivní dveře/vraty odlišit hodnotou (teplejší/tmavší) od dekorativních.

## P2 — detaily

- **P2-1 title:** artefakt „Ztracený list**_**" — zábradlí věže čte se jako podtržítko za titulem; posunout věž nebo titul. Měsíc = plochý disk se 3 krátery, přidat stínovou stranu a halo. Menu položky bez plátna/podkladu — MI tituly mají typografii integrovanou do ilustrace.
- **P2-2 square:** slunce = tvrdý kruh (`ř. 2706-2708`), dát 2-3 soustředné alphy + prosvícení mraku, který ho kříží. Kašna šedě „betonová" — dát kámen s okrovým nádechem a mrazovou glazuru. Ptáci v dálce jako `fillRect` čárky (castle_yard ř. 634-638 totéž) — nahradit `flyBird()`.
- **P2-3 castle_yard:** latinský nápis a ciferník jsou vektorově sterilní — text mírně rozpít (nižší alpha, dvojité vykreslení s 1px offsetem), přidat zatékání pod římsou, rez pod závěsy vlajky.
- **P2-4 observatory:** panáček nakreslený na kvadrantu působí jako placeholder; buď stylizovat jako dobový rytecký diagram (šrafy), nebo odstranit. Skull na poličce je moc „emoji".
- **P2-5 UI:** rohová tlačítka (deník, CZ) = generický rounded-rect; verb coin (`src/00_engine.js:963-990` + render) má jen 3 sloty a hladké kruhy — obojí převléknout do diegetického stylu (pergamen/dřevo/mosaz, ručně kreslené ikony), ať UI nезrazuje iluzi. Hodnoceno z kódu, ne ze screenshotu (klik headless nejde).
- **P2-6:** trvalé černé pasparty kolem canvasu ve fullscreenu (poměr plátna ≠ 16:9) — zvážit dopočítání okrajů scény místo černé.

## Doporučené pořadí prací (největší efekt / cena)
1. P0-2 stíny (1 den, změní všechno okamžitě)
2. P0-1 textura + grain pass (1-2 dny)
3. P1-1 nebe/mlha přes mistPuff + dvoutónové mraky (1 den)
4. P1-4 světelné kaluže (0,5 dne)
5. P0-3 postavy — kontura + rim + 2-tón (2-3 dny)
6. P1-2 foreground vrstvy (1 den)
7. P1-3 de-klonování (průběžně)

Reference: RtMI Steam screenshoty (akamai CDN, app 2060130), CoMI Wikipedia screenshot; lokální kopie v scratchpadu review (`critic/ref_*.jpg|png`).
